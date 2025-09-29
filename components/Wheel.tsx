import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { WHEEL_COLORS } from '../constants';

interface WheelProps {
  items: string[];
  onSpinEnd: (winner: string) => void;
}

const Wheel: React.FC<WheelProps> = ({ items, onSpinEnd }) => {
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
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 항목이 16개 미만일 경우, 16개 이상의 가장 가까운 배수로 항목을 늘립니다.
  const displayItems = useMemo(() => {
    const n = items.length;
    if (n > 0 && n < 16) {
      const repeatCount = Math.ceil(16 / n);
      return Array.from({ length: repeatCount }).flatMap(() => items);
    }
    return items;
  }, [items]);
  
  // 고유 항목에 일관되고 분산된 색상을 매핑합니다.
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueItems = Array.from(new Set(items));
    const numUnique = uniqueItems.length;
    if (numUnique === 0) return map;

    const step = Math.floor(WHEEL_COLORS.length / numUnique);
    uniqueItems.forEach((item, index) => {
      const colorIndex = (index * step) % WHEEL_COLORS.length;
      map.set(item, WHEEL_COLORS[colorIndex]);
    });
    return map;
  }, [items]);

  const numItems = displayItems.length;
  const size = 500;
  const center = size / 2;
  const radius = size / 2 - 10;

  const playTickSound = useCallback(() => {
    if (!audioContextRef.current) return;
    const audioContext = audioContextRef.current;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.05);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  }, []);

  // 물리 기반 애니메이션 루프
  const animate = useCallback(() => {
    // 포인터 물리 상수
    const POINTER_STIFFNESS = 0.3;
    const POINTER_DAMPING = 0.85;
    
    // 포인터 애니메이션 (항상 실행하여 제자리로 돌아오게 함)
    const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
    pointerVelocityRef.current += restoringForce;
    pointerVelocityRef.current *= POINTER_DAMPING;
    pointerRotationRef.current += pointerVelocityRef.current;
    setPointerRotation(pointerRotationRef.current);

    // 돌림판 애니메이션
    if (isSpinningRef.current) {
        // 돌림판 물리 상수
        const FRICTION = 0.996;
        const GRAVITY_FACTOR = 0.0012;
        const MIN_VELOCITY_FOR_GRAVITY = 2.8;
        const STOP_VELOCITY = 0.005;

        let velocity = velocityRef.current * FRICTION;
        const segmentAngle = 360 / (displayItems.length || 1);
        
        if (Math.abs(velocity) < MIN_VELOCITY_FOR_GRAVITY) {
            const currentRotation = rotationRef.current + velocity;
            const angleInSegment = currentRotation % segmentAngle;
            const distanceFromCenter = angleInSegment - (segmentAngle / 2);
            const force = -distanceFromCenter * GRAVITY_FACTOR * (MIN_VELOCITY_FOR_GRAVITY - Math.abs(velocity));
            velocity += force;
        }

        // 포인터와 페그(못) 상호작용
        const nextRotation = rotationRef.current + velocity;
        const lastSegmentIndex = Math.floor(rotationRef.current / segmentAngle);
        const currentSegmentIndex = Math.floor(nextRotation / segmentAngle);
        
        if (currentSegmentIndex !== lastSegmentIndex) {
          playTickSound();
          const kickDirection = Math.sign(velocity) || (currentSegmentIndex > lastSegmentIndex ? 1 : -1);

          // 1. 튕기는 강도를 돌림판 속도에 따라 결정
          const bounceStrength = Math.abs(velocity);
          const kickVelocity = 12 + bounceStrength * 1.5;

          // 2. 시계 방향 충돌 처리
          if (kickDirection > 0) {
              // 포인터가 못을 '뚫고' 들어갔다면 즉시 밖으로 밀어냄
              if (pointerRotationRef.current < 0) {
                  pointerRotationRef.current = 0;
              }
              // 항상 못의 바깥 방향으로 튕겨내는 힘을 적용
              pointerVelocityRef.current = kickVelocity;
          } 
          // 3. 반시계 방향 충돌 처리 (반동 시)
          else { // kickDirection < 0
              // 포인터가 반대쪽에서 못을 '뚫고' 들어갔다면 즉시 밖으로 밀어냄
              if (pointerRotationRef.current > 0) {
                  pointerRotationRef.current = 0;
              }
              // 항상 못의 바깥 방향으로 튕겨내는 힘을 적용
              pointerVelocityRef.current = -kickVelocity;
          }

          // 4. 돌림판에 저항 적용
          velocity *= 0.97;
        }
        
        // 새로운 정지 로직: 안정화 단계를 거쳐 최종적으로 정지할 때 승자 판정
        if (Math.abs(velocity) < STOP_VELOCITY) {
            settlingRef.current = true;
        }

        if (settlingRef.current && Math.abs(velocity) < 0.001) {
            velocity = 0; // 최종 정지
            isSpinningRef.current = false;
            settlingRef.current = false;
            setIsSpinning(false);
            
            const finalRotation = rotationRef.current;
            // 정확한 판정선(180도)으로 승자 계산 로직 수정
            const degrees = (180 - (finalRotation % 360) + 360) % 360;
            const winningSegmentIndex = Math.floor(degrees / segmentAngle);
            if (displayItems[winningSegmentIndex]) {
                onSpinEnd(displayItems[winningSegmentIndex]);
            }
        }

        velocityRef.current = velocity;
        rotationRef.current += velocity;
        lastRotationRef.current = rotationRef.current;
        setRotation(rotationRef.current);
    }
    
    if (!isSpinningRef.current && Math.abs(pointerVelocityRef.current) < 0.01 && Math.abs(pointerRotationRef.current) < 0.01) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        return;
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [displayItems, onSpinEnd, playTickSound]);

  const handleSpin = () => {
    if (isSpinningRef.current || items.length < 2) return;

    if (!audioContextRef.current) {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser.");
        }
    }
    
    isSpinningRef.current = true;
    settlingRef.current = false; // 안정화 단계 초기화
    setIsSpinning(true);
    
    velocityRef.current = Math.random() * 15 + 25;
    lastRotationRef.current = rotationRef.current;

    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };
  
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const getCoordinatesForPercent = (percent: number): [number, number] => {
    const x = center + radius * Math.cos(2 * Math.PI * percent);
    const y = center + radius * Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const renderSegments = () => {
    if (numItems === 0) return null;
    const segmentAngle = 360 / numItems;

    return displayItems.map((item, index) => {
      const startAngle = segmentAngle * index;
      const endAngle = startAngle + segmentAngle;
      
      const start = getCoordinatesForPercent(startAngle / 360);
      const end = getCoordinatesForPercent(endAngle / 360);

      const largeArcFlag = segmentAngle > 180 ? 1 : 0;

      const pathData = [ `M ${center},${center}`, `L ${start[0]},${start[1]}`, `A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]}`, 'Z' ].join(' ');
      
      const textAngle = startAngle + segmentAngle / 2;
      const textRotation = textAngle > 90 && textAngle < 270 ? textAngle - 180 : textAngle;
      
      const textX = center + (radius / 1.5) * Math.cos(textAngle * Math.PI / 180);
      const textY = center + (radius / 1.5) * Math.sin(textAngle * Math.PI / 180);

      const truncatedItem = item.length > 15 ? item.substring(0, 14) + '…' : item;
      const fontSize = Math.max(8, 28 - numItems * 0.5);

      return (
        <g key={index}>
          <path d={pathData} fill={colorMap.get(item) || '#374151'} stroke="#1f2937" strokeWidth="2" />
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
    <div className="relative w-full aspect-square flex items-center justify-center">
        <div 
            className="absolute left-1/2 -translate-x-1/2 z-20"
            style={{ 
                width: '8%', // 40px/500px
                height: '12%', // 60px/500px
                top: '-10%', // -50px/500px, to place tip on pegs
                filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.3))',
                transform: `rotate(${pointerRotation}deg)`,
                transformOrigin: '50% 41.66%' // 25px / 60px
            }}
        >
             <svg width="100%" height="100%" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 60C20 60 40 35.8333 40 25C40 11.1929 31.0457 0 20 0C8.9543 0 0 11.1929 0 25C0 35.8333 20 60 20 60Z" fill="#facc15"/>
                <circle cx="20" cy="25" r="5" fill="#eab308"/>
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
            transformOrigin: 'center'
          }}
        >
          {renderSegments()}
          {/* 페그(못) 렌더링 */}
          {numItems > 0 && displayItems.map((_, index) => {
              const angleDeg = (360 / numItems) * index;
              const [x, y] = getCoordinatesForPercent(angleDeg / 360);
              return (
                  <circle key={`peg-${index}`} cx={x} cy={y} r={4} fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
              );
          })}
        </g>
      </svg>
      <button
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