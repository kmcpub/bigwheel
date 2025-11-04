import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { WHEEL_COLORS } from '../constants';

interface WheelProps {
  items: string[];
  onSpinEnd: (winner: string) => void;
  isBoosterMode: boolean;
}

const Wheel: React.FC<WheelProps> = ({ items, onSpinEnd, isBoosterMode }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [pointerRotation, setPointerRotation] = useState(0);

  // 물리 애니메이션 상태를 위한 Ref
  const isSpinningRef = useRef(false);
  const settlingRef = useRef(false);
  const velocityRef = useRef(0);
  const rotationRef = useRef(0);
  const lastRotationRef = useRef(0);
  const pointerRotationRef = useRef(0);
  const pointerVelocityRef = useRef(0);
  const peakRotationRef = useRef(0);
  const isReversingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tickBufferRef = useRef<AudioBuffer | null>(null); // 오디오 버퍼를 위한 Ref 추가
  const boosterAnimRef = useRef({
    active: false,
    startTime: 0,
    startRotation: 0,
    targetRotation: 0,
    duration: 900,
  });


  // 드래그/스와이프를 위한 Ref
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerAngleRef = useRef(0);
  const velocityHistoryRef = useRef<{ velocity: number; time: number }[]>([]);


  // 고유 항목에 일관되고 분산된 색상을 매핑합니다.
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueItems: string[] = Array.from(new Set<string>(items));
    const numUnique = uniqueItems.length;
    const numColors = WHEEL_COLORS.length;
    if (numUnique === 0) return map;

    // 항목 수에 따라 색상 선택 전략을 조정합니다.
    // 항목이 적으면 대비가 높은 색상을 선택하고, 많으면 무지개처럼 순차적인 색상을 선택합니다.
    const step = numUnique > 0 && numUnique < numColors
      ? Math.floor(numColors / numUnique)
      : 1;

    uniqueItems.forEach((item, index) => {
      const colorIndex = (index * step) % numColors;
      map.set(item, WHEEL_COLORS[colorIndex]);
    });
    return map;
  }, [items]);

  const numItems = items.length;
  const size = 500;
  const center = size / 2;
  const radius = size / 2 - 10;

  const playTickSound = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(15); // 못 소리와 함께 짧은 진동
    }
    
    if (!audioContextRef.current || !tickBufferRef.current) return;
    const audioContext = audioContextRef.current;
    
    // 버퍼 소스 노드를 생성하고 버퍼를 할당합니다.
    const source = audioContext.createBufferSource();
    source.buffer = tickBufferRef.current;
    source.connect(audioContext.destination);
    source.start(); // 즉시 재생
  }, []);

  // 물리 기반 애니메이션 루프
  const animate = useCallback(() => {
    // 포인터 물리 상수
    const POINTER_STIFFNESS = 0.3;
    const POINTER_DAMPING = 0.85;
    
    // 포인터 회전 물리
    const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
    pointerVelocityRef.current += restoringForce;
    pointerVelocityRef.current *= POINTER_DAMPING;
    pointerRotationRef.current += pointerVelocityRef.current;
    setPointerRotation(pointerRotationRef.current);

    // 돌림판 애니메이션
    if (isSpinningRef.current) {
        const segmentAngle = 360 / (items.length || 1);
        const pointerOffset = 180.0;
        
        if (boosterAnimRef.current.active) {
            // 부스터 모드 애니메이션 로직
            const anim = boosterAnimRef.current;
            const elapsedTime = performance.now() - anim.startTime;
            const progress = Math.min(elapsedTime / anim.duration, 1);
            
            // Ease out cubic: 1 - (1 - x)^3
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const newRotation = anim.startRotation + (anim.targetRotation - anim.startRotation) * easedProgress;

            const lastSegmentIndex = Math.floor((rotationRef.current - pointerOffset) / segmentAngle);
            const currentSegmentIndex = Math.floor((newRotation - pointerOffset) / segmentAngle);
            
            if (currentSegmentIndex !== lastSegmentIndex) {
              playTickSound();
              const kickVelocity = 15;
              const spinDirection = Math.sign(anim.targetRotation - anim.startRotation);
              if (spinDirection >= 0) { // 양수 회전은 CCW
                  if (pointerRotationRef.current > 0) pointerRotationRef.current = 0;
                  pointerVelocityRef.current = -kickVelocity;
              } else {
                  if (pointerRotationRef.current < 0) pointerRotationRef.current = 0;
                  pointerVelocityRef.current = kickVelocity;
              }
            }

            rotationRef.current = newRotation;
            setRotation(newRotation);

            if (progress >= 1) {
                anim.active = false;
                isSpinningRef.current = false;
                setIsSpinning(false);
                
                const finalRotation = rotationRef.current;
                const degrees = (180 - (finalRotation % 360) + 360) % 360;
                const winningSegmentIndex = Math.floor(degrees / segmentAngle);
                if (items[winningSegmentIndex]) {
                    onSpinEnd(items[winningSegmentIndex]);
                }
            }
        } else {
            // 일반 물리 기반 회전 로직
            const HIGH_SPEED_THRESHOLD = 15.0;
            const LOW_SPEED_THRESHOLD = 5.0;
            const HIGH_FRICTION = 0.985;
            const LOW_FRICTION = 0.998;

            const currentVelocity = Math.abs(velocityRef.current);
            let currentFriction;

            if (currentVelocity >= HIGH_SPEED_THRESHOLD) {
                currentFriction = HIGH_FRICTION;
            } else if (currentVelocity <= LOW_SPEED_THRESHOLD) {
                currentFriction = LOW_FRICTION;
            } else {
                const progress = (currentVelocity - LOW_SPEED_THRESHOLD) / (HIGH_SPEED_THRESHOLD - LOW_SPEED_THRESHOLD);
                currentFriction = LOW_FRICTION + progress * (HIGH_FRICTION - LOW_FRICTION);
            }

            const GRAVITY_FACTOR = 0.0012;
            const MIN_VELOCITY_FOR_GRAVITY = 2.0;
            const STOP_VELOCITY = 0.005;

            let velocity = velocityRef.current * currentFriction;
            
            if (Math.abs(velocity) < MIN_VELOCITY_FOR_GRAVITY) {
                const currentRotation = rotationRef.current + velocity;
                
                const rotationAtPointer = currentRotation - 180.0;
                const angleInSegment = ((rotationAtPointer % segmentAngle) + segmentAngle) % segmentAngle;

                const distanceFromCenter = angleInSegment - (segmentAngle / 2);
                const force = -distanceFromCenter * GRAVITY_FACTOR * (MIN_VELOCITY_FOR_GRAVITY - Math.abs(velocity));
                velocity += force;
            }

            const nextRotation = rotationRef.current + velocity;
            const lastSegmentIndex = Math.floor((rotationRef.current - pointerOffset) / segmentAngle);
            const currentSegmentIndex = Math.floor((nextRotation - pointerOffset) / segmentAngle);
            
            if (currentSegmentIndex !== lastSegmentIndex) {
              playTickSound();
              const kickDirection = Math.sign(velocity) || (currentSegmentIndex > lastSegmentIndex ? 1 : -1);

              const bounceStrength = Math.abs(velocity);
              const kickVelocity = 5 + bounceStrength * 2.0;

              if (kickDirection > 0) {
                  if (pointerRotationRef.current > 0) pointerRotationRef.current = 0;
                  pointerVelocityRef.current = -kickVelocity;
              } 
              else {
                  if (pointerRotationRef.current < 0) pointerRotationRef.current = 0;
                  pointerVelocityRef.current = kickVelocity;
              }
              velocity *= 0.96;
            }
            
            if (velocityRef.current >= 0 && velocity < 0) {
              if (!isReversingRef.current) {
                isReversingRef.current = true;
                peakRotationRef.current = rotationRef.current;
              }
            }

            if (isReversingRef.current) {
              const reversedDistance = peakRotationRef.current - (rotationRef.current + velocity);
              const limit = segmentAngle / 2;

              if (reversedDistance > limit) {
                velocity = (peakRotationRef.current - limit) - rotationRef.current;
                isReversingRef.current = false;
              }
            }
            
            if (Math.abs(velocity) < STOP_VELOCITY) {
                settlingRef.current = true;
            }

            if (settlingRef.current && Math.abs(velocity) < 0.001) {
                velocity = 0;
                isSpinningRef.current = false;
                settlingRef.current = false;
                isReversingRef.current = false;
                setIsSpinning(false);
                
                const finalRotation = rotationRef.current;
                const degrees = (180 - (finalRotation % 360) + 360) % 360;
                const winningSegmentIndex = Math.floor(degrees / segmentAngle);
                if (items[winningSegmentIndex]) {
                    onSpinEnd(items[winningSegmentIndex]);
                }
            }

            velocityRef.current = velocity;
            rotationRef.current += velocity;
            lastRotationRef.current = rotationRef.current;
            setRotation(rotationRef.current);
        }
    }
    
    if (!isSpinningRef.current && Math.abs(pointerVelocityRef.current) < 0.01 && Math.abs(pointerRotationRef.current) < 0.01) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [items, onSpinEnd, playTickSound]);

  const startSpin = useCallback((initialVelocity: number) => {
    if (isSpinningRef.current || items.length < 2) return;
    
    isSpinningRef.current = true;
    settlingRef.current = false;
    isReversingRef.current = false;
    setIsSpinning(true);
    
    velocityRef.current = initialVelocity;
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate, items.length]);

  const handleSpin = async () => {
    if (isSpinningRef.current || items.length < 2) return;

    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
    
    if (audioContextRef.current && !tickBufferRef.current) {
        try {
            const context = audioContextRef.current;
            const duration = 0.05;
            const frameCount = context.sampleRate * duration;
            const offlineContext = new OfflineAudioContext(1, frameCount, context.sampleRate);
            
            const oscillator = offlineContext.createOscillator();
            const gainNode = offlineContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(offlineContext.destination);

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(1200, 0);
            gainNode.gain.setValueAtTime(0.4, 0);
            gainNode.gain.exponentialRampToValueAtTime(0.001, duration);
            oscillator.start(0);
            
            tickBufferRef.current = await offlineContext.startRendering();
        } catch(e) {
            console.error('오디오 틱 버퍼를 생성하는 데 실패했습니다:', e);
        }
    }

    if (isBoosterMode) {
        isSpinningRef.current = true;
        setIsSpinning(true);
        
        const winnerIndex = Math.floor(Math.random() * items.length);
        const segmentAngle = 360 / items.length;
        
        const targetAngleInWheel = winnerIndex * segmentAngle + segmentAngle / 2;
        const finalRotationFromTop = 180 - targetAngleInWheel;

        const currentEffectiveRotation = (rotationRef.current % 360 + 360) % 360;
        const fullSpins = 5;
        let targetRotation = rotationRef.current - currentEffectiveRotation + (fullSpins * 360) + finalRotationFromTop;

        if (targetRotation <= rotationRef.current) {
            targetRotation += 360;
        }
        
        boosterAnimRef.current = {
            active: true,
            startTime: performance.now(),
            startRotation: rotationRef.current,
            targetRotation: targetRotation,
            duration: 900,
        };
        
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }
    } else {
        const randomVelocity = Math.random() * 15 + 25;
        startSpin(randomVelocity);
    }
  };
  
  // --- 포인터 이벤트 기반 드래그/스와이프 로직 ---
  const getPointerPosition = useCallback((e: PointerEvent | React.PointerEvent) => {
    return { x: e.clientX, y: e.clientY };
  }, []);

  const getAngleFromEvent = useCallback((e: PointerEvent | React.PointerEvent) => {
    if (!wheelContainerRef.current) return 0;
    const rect = wheelContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const { x, y } = getPointerPosition(e);
    if (x === 0 && y === 0) return lastPointerAngleRef.current;
    const angleRad = Math.atan2(y - centerY, x - centerX);
    return (angleRad * 180) / Math.PI;
  }, [getPointerPosition]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    const currentPointerAngle = getAngleFromEvent(e);
    let deltaAngle = currentPointerAngle - lastPointerAngleRef.current;

    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const newRotation = rotationRef.current + deltaAngle;
    rotationRef.current = newRotation;
    setRotation(newRotation);

    const now = performance.now();
    const lastSample = velocityHistoryRef.current[velocityHistoryRef.current.length - 1];
    if (lastSample) {
      const deltaTime = now - lastSample.time;
      if (deltaTime > 0) {
        const velocity = deltaAngle / (deltaTime / 16.67);
        velocityHistoryRef.current.push({ velocity, time: now });
        if (velocityHistoryRef.current.length > 5) {
          velocityHistoryRef.current.shift();
        }
      }
    } else {
      velocityHistoryRef.current.push({ velocity: 0, time: now });
    }

    lastPointerAngleRef.current = currentPointerAngle;
  }, [getAngleFromEvent]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    // 포인터 캡처를 해제합니다.
    if (wheelContainerRef.current) {
      (wheelContainerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    const now = performance.now();
    const recentSamples = velocityHistoryRef.current.filter(sample => now - sample.time < 100);

    if (recentSamples.length > 1) {
      const totalVelocity = recentSamples.reduce((acc, sample) => acc + sample.velocity, 0);
      let avgVelocity = totalVelocity / recentSamples.length;
      
      avgVelocity = Math.max(-45, Math.min(45, avgVelocity));

      if (Math.abs(avgVelocity) > 1) {
        startSpin(avgVelocity);
      }
    }
  }, [handlePointerMove, startSpin]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isSpinningRef.current) return;
    
    isDraggingRef.current = true;
    const currentPointerAngle = getAngleFromEvent(e);
    lastPointerAngleRef.current = currentPointerAngle;
    velocityHistoryRef.current = [{ velocity: 0, time: performance.now() }];
    
    // 후속 이벤트를 캡처하도록 포인터를 설정합니다.
    if (wheelContainerRef.current) {
      (wheelContainerRef.current as HTMLElement).setPointerCapture(e.pointerId);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [getAngleFromEvent, handlePointerMove, handlePointerUp]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // 컴포넌트 언마운트 시 포인터 이벤트 리스너를 정리합니다.
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);


  const getCoordinatesForPercent = (percent: number): [number, number] => {
    const x = center + radius * Math.cos(2 * Math.PI * percent);
    const y = center + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const renderSegments = () => {
    if (numItems === 0) return null;

    const groupedItems: { item: string; count: number; startIndex: number }[] = [];
    if (items.length > 0) {
      let currentGroup = {
        item: items[0],
        count: 1,
        startIndex: 0
      };
      for (let i = 1; i < items.length; i++) {
        if (items[i] === currentGroup.item) {
          currentGroup.count++;
        } else {
          groupedItems.push(currentGroup);
          currentGroup = {
            item: items[i],
            count: 1,
            startIndex: i
          };
        }
      }
      groupedItems.push(currentGroup);
    }

    const segmentAngle = 360 / numItems;

    return groupedItems.map((group) => {
      const startAngle = segmentAngle * group.startIndex;
      const groupAngle = segmentAngle * group.count;
      const endAngle = startAngle + groupAngle;
      
      const start = getCoordinatesForPercent(startAngle / 360);
      const end = getCoordinatesForPercent(endAngle / 360);

      const largeArcFlag = groupAngle > 180 ? 1 : 0;

      const pathData = [
        `M ${center},${center}`,
        `L ${start[0]},${start[1]}`,
        `A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]}`,
        'Z'
      ].join(' ');
      
      const textAngle = startAngle + groupAngle / 2;
      const textRotation = textAngle > 90 && textAngle < 270 ? textAngle - 180 : textAngle;
      
      const textRadiusMultiplier = Math.max(1.2, 1.8 - group.count * 0.1);
      const textX = center + (radius / textRadiusMultiplier) * Math.cos(textAngle * Math.PI / 180);
      const textY = center + (radius / textRadiusMultiplier) * Math.sin(textAngle * Math.PI / 180);

      const truncatedItem = group.item.length > 15 ? group.item.substring(0, 14) + '…' : group.item;
      
      const baseFontSize = 28 - numItems * 0.5;
      const weightedFontSize = baseFontSize + (group.count - 1) * 5;
      const fontSize = Math.max(10, Math.min(50, weightedFontSize));

      return (
        <g key={group.startIndex}>
          <path d={pathData} fill={colorMap.get(group.item) || '#374151'} stroke="#1f2937" strokeWidth="2" />
          <text
            x={textX} y={textY}
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            fill="#111827" fontSize={fontSize} fontWeight="bold"
            textAnchor="middle" alignmentBaseline="middle" className="select-none"
          >
            {truncatedItem}
          </text>
        </g>
      );
    });
  };

  return (
    <div 
        ref={wheelContainerRef}
        className="relative w-full aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }} // 모바일에서 스크롤 방지
    >
        <div 
            className="absolute left-1/2 z-20"
            style={{ 
                width: '8%', 
                height: '12%', 
                top: '-11%', // 겹침 방지를 위해 포인터를 약간 위로 이동
                transform: `translateX(-50%) rotate(${pointerRotation}deg)`,
                transformOrigin: '50% 33.33%', // 원의 중심(y=20)에 맞춘 회전 중심
                filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4))' // 그림자 효과 추가
            }}
        >
             <svg width="100%" height="100%" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,60 C20,60 40,40 40,20 A20,20 0 1,0 0,20 C0,40 20,60 20,60 Z" fill="#fbbf24"/>
                <circle cx="20" cy="20" r="7" fill="#f59e0b"/>
            </svg>
        </div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full"
        style={{ transform: 'rotate(90deg)' }}
      >
        <g 
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: 'center',
          }}
        >
          {renderSegments()}
          {/* 페그(못) 렌더링 */}
          {numItems > 0 && items.map((_, index) => {
              const angleDeg = (360 / numItems) * index;
              const [x, y] = getCoordinatesForPercent(angleDeg / 360);
              return (
                  <circle key={`peg-${index}`} cx={x} cy={y} r={4} fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
              );
          })}
        </g>
      </svg>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleSpin}
        disabled={isSpinning || items.length < 2}
        className="absolute z-10 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold w-24 h-24 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 flex items-center justify-center text-xl"
        aria-label="돌림판 돌리기"
      >
        {isSpinning ? '...' : '돌리기!'}
      </button>
    </div>
  );
};

export default Wheel;
