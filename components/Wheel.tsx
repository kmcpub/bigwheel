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

  // 물리 애니메이션 상태를 위한 Ref 및 DOM 요소 제어를 위한 Ref
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
  const tickBufferRef = useRef<AudioBuffer | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const keepAliveOscRef = useRef<OscillatorNode | null>(null);
  const keepAliveGainRef = useRef<GainNode | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // DOM 직접 제어를 위한 Ref (성능 극대화)
  const wheelGroupRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);

  // 드래그/스와이프를 위한 Ref
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastPointerAngleRef = useRef(0);
  const velocityHistoryRef = useRef<{ velocity: number; time: number }[]>([]);

  // 부스터 모드 애니메이션 상태를 위한 Ref
  const boosterAnimState = useRef({
    startTime: 0,
    startRotation: 0,
    targetRotation: 0,
    winnerIndex: 0,
    lastRotation: 0,
  });

  // 고유 항목에 일관되고 분산된 색상을 매핑합니다.
  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueItems: string[] = Array.from(new Set<string>(items));
    const numUnique = uniqueItems.length;
    const numColors = WHEEL_COLORS.length;
    if (numUnique === 0) return map;

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

  const lastDragSegmentIndexRef = useRef<number>(0);

  // 고품질 틱 소리를 위한 오디오 및 틱 버퍼 동기식 초기화 (지연 없음)
  const initializeAudio = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass();
        }
      } catch (e) {
        console.error("Web Audio API is not supported in this browser.", e);
        return;
      }
    }
    
    const context = audioContextRef.current;
    if (context) {
      if (context.state === 'suspended') {
        context.resume();
      }

      // [핵심!] 스마트폰/OS/사운드카드 오토뮤트 및 앞부분 페이드인(씹힘) 완벽 방지 (Keep-Alive 엔진)
      // 인간의 귀로는 들리지 않는 초고주파(19000Hz) 신호를 아주 미세한 볼륨(0.00015)으로 상시 전송하여
      // 오디오 믹서와 하드웨어를 '항시 핫-스탠바이(활성) 상태'로 묶어둡니다. (BGM이 꺼져 있어도 어택 씹힘 완전 해결!)
      if (!keepAliveOscRef.current) {
        try {
          const osc = context.createOscillator();
          const keepAliveGain = context.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(19000, context.currentTime); // 19kHz 초고주파 (인간 가청 영역 밖의 무음)
          
          keepAliveGain.gain.setValueAtTime(0.00015, context.currentTime); // 오디오 칩셋을 계속 깨워두는 최적의 미세 볼륨
          
          osc.connect(keepAliveGain);
          keepAliveGain.connect(context.destination);
          
          osc.start(0);
          keepAliveOscRef.current = osc;
          keepAliveGainRef.current = keepAliveGain;
        } catch (e) {
          console.error("Failed to start Keep-Alive background signal", e);
        }
      }

      // [핵심!] 볼륨 평준화 및 BGM ducking 방지를 위한 전용 볼륨 노드(GainNode) 생성
      if (!gainNodeRef.current) {
        try {
          const gainNode = context.createGain();
          // 풍부하면서도 다른 사운드와 조화를 이루는 선명한 0.95 볼륨 비율 적용
          gainNode.gain.setValueAtTime(0.95, context.currentTime);
          gainNode.connect(context.destination);
          gainNodeRef.current = gainNode;
        } catch (e) {
          console.error("Failed to initialize GainNode", e);
        }
      }

      // 완전히 새로 설계한 명료하고 단단한 프리미엄 '또르륵' 목재 핀 타격 사운드 합성 (55ms 존재감 넘치는 명품 파형)
      if (!tickBufferRef.current) {
        const duration = 0.055; // 55ms의 기분 좋은 존재감 있는 재생 시간
        const sampleRate = context.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = context.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
          const t = i / sampleRate;
          
          // 1. 맑고 청량하게 딱! 튕기는 고속 주파수 스윕 (2800Hz -> 350Hz)
          const sweepFreq = 350 + 2450 * Math.exp(-220 * t);
          const tone = Math.sin(2 * Math.PI * sweepFreq * t);
          
          // 2. 맑은 공명 울림 레이어 (980Hz 고정 주파수 사인파)
          const resonance = Math.sin(2 * Math.PI * 980 * t) * Math.exp(-120 * t);
          
          // 3. 단단한 나무 몸체를 가볍고 깊게 쳐서 울리는 목재 타격 본체음 (130Hz)
          const body = Math.sin(2 * Math.PI * 130 * t) * Math.exp(-180 * t);
          
          // 4. 플라스틱/나무 핀이 걸쇠를 긁고 넘어가며 생기는 실감 나는 마찰 고주파 노이즈
          const noise = (Math.random() * 2 - 1) * 0.15 * Math.exp(-350 * t);
          
          // 5. 어택 지연(페이드인 씹힘)을 완벽 방지하기 위해 0.4ms의 초예리한 엔벨롭 적용 (팝노이즈 차단 목적)
          let envelope = Math.exp(-85 * t);
          if (t < 0.0004) {
            envelope *= (t / 0.0004);
          }
          
          // 6. 모든 신호를 고품질로 합성하고 시원하게 꽂히도록 2.0배 증폭 (꽉 찬 볼륨감)
          const sampleValue = (tone * 0.5 + resonance * 0.3 + body * 0.35 + noise * 0.15) * envelope;
          data[i] = Math.max(-0.95, Math.min(0.95, sampleValue * 2.0));
        }
        tickBufferRef.current = buffer;
      }
    }
  }, []);

  // 컴포넌트 마운트 시 및 첫 사용자 제스처(터치/클릭) 시 오디오 컨텍스트 사전 활성화 및 언락 처리
  useEffect(() => {
    const handleUnlock = () => {
      if (!audioContextRef.current) {
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioContextRef.current = new AudioContextClass();
          }
        } catch (e) {
          console.error("AudioContext initialization failed:", e);
        }
      }
      
      const context = audioContextRef.current;
      if (context) {
        if (context.state === 'suspended') {
          context.resume().then(() => {
            initializeAudio();
          });
        } else {
          initializeAudio();
        }
      }
    };

    // 첫 터치나 마우스 클릭 시 오디오 즉각 언락
    window.addEventListener('pointerdown', handleUnlock, { once: true });
    window.addEventListener('click', handleUnlock, { once: true });

    // 컴포넌트 마운트와 동시에 초기화 시도
    handleUnlock();

    return () => {
      window.removeEventListener('pointerdown', handleUnlock);
      window.removeEventListener('click', handleUnlock);
      if (keepAliveOscRef.current) {
        try {
          keepAliveOscRef.current.stop();
          keepAliveOscRef.current.disconnect();
        } catch (e) {}
          keepAliveOscRef.current = null;
      }
      if (keepAliveGainRef.current) {
        try {
          keepAliveGainRef.current.disconnect();
        } catch (e) {}
          keepAliveGainRef.current = null;
      }
    };
  }, [initializeAudio]);

  const playTickSound = useCallback(() => {
    // [중요!] 오디오 중첩 과부하를 막는 최소 가청 쓰로틀링 (4ms: 120Hz 고주사율 기기의 8.3ms 프레임 타임보다 낮게 설정하여 씹힘 현상 완벽 방지)
    const nowTime = performance.now();
    if (nowTime - lastTickTimeRef.current < 4) {
      return;
    }
    lastTickTimeRef.current = nowTime;

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // 오디오 컨텍스트가 아예 생성되지 않았을 경우를 위해 즉시 초기화
    if (!audioContextRef.current) {
      initializeAudio();
    }
    
    const audioContext = audioContextRef.current;
    if (!audioContext) return;
    
    const playNow = () => {
      // 전용 gainNode가 있는 경우 여기에 안전하게 연결하여 오버플로우 방지
      if (tickBufferRef.current && gainNodeRef.current) {
        const source = audioContext.createBufferSource();
        source.buffer = tickBufferRef.current;
        source.connect(gainNodeRef.current);
        // 즉각 재생: 어택을 씹지 않고 칼같이 정확한 타이밍에 소리가 나오도록 딜레이 제거
        source.start(audioContext.currentTime);
      } else {
        // 백업용 오실레이터 비동기 완벽 방어 처리 (gainNodeRef 동일 적용)
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.connect(gainNode);
        if (gainNodeRef.current) {
          gainNode.connect(gainNodeRef.current);
        } else {
          gainNode.connect(audioContext.destination);
        }
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.055);
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.055);
        
        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + 0.055);
      }
    };
    
    // 비동기 딜레이를 완벽 차단하기 위해 suspended인 경우 즉시 강제 resume 후 재생
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        playNow();
      }).catch((err) => {
        console.error("Audio resume failed, playing directly", err);
        playNow();
      });
    } else {
      playNow();
    }
  }, [initializeAudio]);

  // 부스터 모드를 위한 감속/가속 Easing 함수
  const easeOutQuint = (x: number): number => {
    return 1 - Math.pow(1 - x, 5);
  };

  // 부스터 모드를 위한 새 애니메이션 루프
  const boosterAnimate = useCallback(() => {
    const DURATION = 900; // ms
    const { startTime, startRotation, targetRotation, winnerIndex } = boosterAnimState.current;
    
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / DURATION, 1);
    const easedProgress = easeOutQuint(progress);

    const currentRotation = startRotation + (targetRotation - startRotation) * easedProgress;
    
    rotationRef.current = currentRotation;
    if (wheelGroupRef.current) {
      wheelGroupRef.current.style.transform = `rotate(${currentRotation + 90}deg) translateZ(0)`;
      wheelGroupRef.current.style.webkitTransform = `rotate(${currentRotation + 90}deg) translateZ(0)`;
    }
    
    const POINTER_STIFFNESS = 0.3;
    const POINTER_DAMPING = 0.85;
    const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
    pointerVelocityRef.current += restoringForce;
    pointerVelocityRef.current *= POINTER_DAMPING;
    pointerRotationRef.current += pointerVelocityRef.current;
    if (pointerRef.current) {
      pointerRef.current.style.transform = `translateX(-50%) rotate(${pointerRotationRef.current}deg) translateZ(0)`;
      pointerRef.current.style.webkitTransform = `translateX(-50%) rotate(${pointerRotationRef.current}deg) translateZ(0)`;
    }

    const segmentAngle = 360 / (items.length || 1);
    const pointerOffset = 180.0;
    
    const angle1 = boosterAnimState.current.lastRotation - pointerOffset;
    const angle2 = currentRotation - pointerOffset;
    const boundaryCount = Math.abs(Math.floor(angle2 / segmentAngle) - Math.floor(angle1 / segmentAngle));

    if (boundaryCount > 0) {
        // 경계선을 지나면 틱 소리 재생 (쓰로틀러가 중첩을 맑게 제어)
        playTickSound();
        const kickVelocity = 15 + Math.random() * 5;
        if (pointerRotationRef.current > 0) pointerRotationRef.current = 0;
        pointerVelocityRef.current = -kickVelocity;
    }
    boosterAnimState.current.lastRotation = currentRotation;

    if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(boosterAnimate);
    } else {
        animationFrameRef.current = null;
        isSpinningRef.current = false;
        setIsSpinning(false);
        setRotation(currentRotation);
        setPointerRotation(0);
        if (items[winnerIndex]) {
            onSpinEnd(items[winnerIndex]);
        }
    }
  }, [items, onSpinEnd, playTickSound]);

  // 물리 기반 애니메이션 루프 (리렌더링 제거 후 스타일 직접 조작)
  const animate = useCallback(() => {
    const POINTER_STIFFNESS = 0.3;
    const POINTER_DAMPING = 0.85;
    
    const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
    pointerVelocityRef.current += restoringForce;
    pointerVelocityRef.current *= POINTER_DAMPING;
    pointerRotationRef.current += pointerVelocityRef.current;
    if (pointerRef.current) {
      pointerRef.current.style.transform = `translateX(-50%) rotate(${pointerRotationRef.current}deg) translateZ(0)`;
      pointerRef.current.style.webkitTransform = `translateX(-50%) rotate(${pointerRotationRef.current}deg) translateZ(0)`;
    }

    if (isSpinningRef.current) {
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

        const GRAVITY_FACTOR = 0.001;
        const MIN_VELOCITY_FOR_GRAVITY = 2.0;
        const STOP_VELOCITY = 0.005;

        let velocity = velocityRef.current * currentFriction;
        const segmentAngle = 360 / (items.length || 1);
        
        if (Math.abs(velocity) < MIN_VELOCITY_FOR_GRAVITY) {
            const currentRotation = rotationRef.current + velocity;
            const rotationAtPointer = currentRotation - 180.0;
            const angleInSegment = ((rotationAtPointer % segmentAngle) + segmentAngle) % segmentAngle;
            const distanceFromCenter = angleInSegment - (segmentAngle / 2);
            const force = -distanceFromCenter * GRAVITY_FACTOR * (MIN_VELOCITY_FOR_GRAVITY - Math.abs(velocity));
            velocity += force;
        }

        const nextRotation = rotationRef.current + velocity;
        const pointerOffset = 180.0;
        const angle1 = rotationRef.current - pointerOffset;
        const pointerSegmentAngle = 360 / (items.length || 1); // segmentAngle
        const angle2 = nextRotation - pointerOffset;
        
        const boundaryCount = Math.abs(Math.floor(angle2 / pointerSegmentAngle) - Math.floor(angle1 / pointerSegmentAngle));
        
        if (boundaryCount > 0) {
          // 경계를 통과하면 틱 사운드 재생 (쓰로틀러가 재생 속도에 맞춰 깔끔하게 디바운싱)
          playTickSound();
          
          const currentSegmentIndex = Math.floor(angle2 / pointerSegmentAngle);
          const lastSegmentIndex = Math.floor(angle1 / pointerSegmentAngle);
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
            
            // 회전 종료 시 최신 각도를 React 상태에 동기화
            setRotation(rotationRef.current);
            setPointerRotation(0);
            
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
        if (wheelGroupRef.current) {
          wheelGroupRef.current.style.transform = `rotate(${rotationRef.current + 90}deg) translateZ(0)`;
          wheelGroupRef.current.style.webkitTransform = `rotate(${rotationRef.current + 90}deg) translateZ(0)`;
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
    if (isSpinningRef.current) return;
    isSpinningRef.current = true;
    settlingRef.current = false;
    isReversingRef.current = false;
    setIsSpinning(true);
    velocityRef.current = initialVelocity;
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  const handleSpin = async () => {
    if (isSpinningRef.current || items.length < 2) return;

    await initializeAudio();
    
    if (isBoosterMode) {
        setIsSpinning(true);
        isSpinningRef.current = true;
        
        const winnerIndex = Math.floor(Math.random() * items.length);
        const segmentAngle = 360 / items.length;
        
        const targetAngleInWheel = winnerIndex * segmentAngle + (segmentAngle / 2);
        const finalRotationFromTop = 180 - targetAngleInWheel;

        const fullSpins = 5;
        const currentRevolutions = Math.floor(rotationRef.current / 360);
        let targetRotation = (currentRevolutions + fullSpins) * 360 + finalRotationFromTop;

        if (targetRotation <= rotationRef.current + 180) {
            targetRotation += 360;
        }
        
        boosterAnimState.current = {
            startTime: performance.now(),
            startRotation: rotationRef.current,
            targetRotation: targetRotation,
            winnerIndex: winnerIndex,
            lastRotation: rotationRef.current,
        };

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = requestAnimationFrame(boosterAnimate);
    } else {
        const randomVelocity = Math.random() * 15 + 25;
        startSpin(randomVelocity);
    }
  };
  
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
    if (wheelGroupRef.current) {
      wheelGroupRef.current.style.transform = `rotate(${newRotation + 90}deg) translateZ(0)`;
      wheelGroupRef.current.style.webkitTransform = `rotate(${newRotation + 90}deg) translateZ(0)`;
    }

    // 드래그 중인 각도 변화에 따른 틱 소리 감지 알고리즘 적용 (느려도 무조건 소리 재생)
    const segmentAngle = 360 / (items.length || 1);
    const pointerOffset = 180.0;
    
    const prevRotation = newRotation - deltaAngle;
    const angle1 = prevRotation - pointerOffset;
    const angle2 = newRotation - pointerOffset;
    
    const boundaryCount = Math.abs(Math.floor(angle2 / segmentAngle) - Math.floor(angle1 / segmentAngle));
    
    if (boundaryCount > 0) {
      // 드래그 속도에 상관없이 경계를 넘을 때마다 틱 소리 깔끔하게 재생 (초당 최대 40회 제한으로 씹힘 및 찌그러짐 차단)
      playTickSound();
      lastDragSegmentIndexRef.current = Math.floor(angle2 / segmentAngle);

      // 수동 드래그 시에도 바늘(pointer)이 경계를 지날 때 진행 방향으로 튕기도록 물리 반응 강제 적용
      const dragDirection = Math.sign(deltaAngle) || 1;
      const dragSpeed = Math.abs(deltaAngle);
      const kickVelocity = 4 + Math.min(12, dragSpeed * 2.5);

      if (dragDirection > 0) {
        if (pointerRotationRef.current > 0) pointerRotationRef.current = 0;
        pointerVelocityRef.current = -kickVelocity;
      } else {
        if (pointerRotationRef.current < 0) pointerRotationRef.current = 0;
        pointerVelocityRef.current = kickVelocity;
      }

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }

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
  }, [getAngleFromEvent, items.length, playTickSound, animate]);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    
    if (wheelContainerRef.current) {
      (wheelContainerRef.current as HTMLElement).releasePointerCapture(e.pointerId);
    }
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);

    // 드래그 종료 시 각도를 React 상태에 동기화
    setRotation(rotationRef.current);

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
    
    initializeAudio(); // 터치 시작과 동시에 AudioContext 활성화
    
    isDraggingRef.current = true;
    const currentPointerAngle = getAngleFromEvent(e);
    lastPointerAngleRef.current = currentPointerAngle;
    velocityHistoryRef.current = [{ velocity: 0, time: performance.now() }];
    
    const segmentAngle = 360 / (items.length || 1);
    const pointerOffset = 180.0;
    lastDragSegmentIndexRef.current = Math.floor((rotationRef.current - pointerOffset) / segmentAngle);
    
    if (wheelContainerRef.current) {
      (wheelContainerRef.current as HTMLElement).setPointerCapture(e.pointerId);
    }

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  }, [getAngleFromEvent, handlePointerMove, handlePointerUp, initializeAudio, items.length]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
      let currentGroup = { item: items[0], count: 1, startIndex: 0 };
      for (let i = 1; i < items.length; i++) {
        if (items[i] === currentGroup.item) {
          currentGroup.count++;
        } else {
          groupedItems.push(currentGroup);
          currentGroup = { item: items[i], count: 1, startIndex: i };
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
      const pathData = [`M ${center},${center}`,`L ${start[0]},${start[1]}`,`A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]}`,'Z'].join(' ');
      
      const textAngle = startAngle + groupAngle / 2;
      const isReversed = textAngle > 90 && textAngle < 270;
      const textRotation = isReversed ? textAngle - 180 : textAngle;
      const textAnchor = isReversed ? 'start' : 'end';
      
      const textRadius = radius - 15;
      
      const textX = center + textRadius * Math.cos(textAngle * Math.PI / 180);
      const textY = center + textRadius * Math.sin(textAngle * Math.PI / 180);

      const truncatedItem = group.item.length > 15 ? group.item.substring(0, 14) + '…' : group.item;
      
      const baseFontSize = 30 - numItems * 0.5;
      const weightedFontSize = baseFontSize + (group.count - 1) * 5;
      const fontSize = Math.max(10, Math.min(50, weightedFontSize));

      return (
        <g key={group.startIndex}>
          <path d={pathData} fill={colorMap.get(group.item) || '#374151'} stroke="#1f2937" strokeWidth="2" />
          <text
            x={textX} y={textY}
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            fill="#111827" fontSize={fontSize} fontWeight="bold"
            textAnchor={textAnchor}
            alignmentBaseline="middle" className="select-none"
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
        style={{ touchAction: 'none' }}
    >
        <div 
            ref={pointerRef}
            className="absolute left-1/2 z-20"
            style={{ 
                width: '8%', 
                height: '12%', 
                top: '-11%',
                transform: `translateX(-50%) rotate(${pointerRotation}deg) translateZ(0)`,
                WebkitTransform: `translateX(-50%) rotate(${pointerRotation}deg) translateZ(0)`,
                transformOrigin: '50% 33.33%',
                WebkitTransformOrigin: '50% 33.33%',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transformStyle: 'preserve-3d',
                WebkitTransformStyle: 'preserve-3d'
            }}
        >
             <svg width="100%" height="100%" viewBox="0 0 40 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,60 C20,60 40,40 40,20 A20,20 0 1,0 0,20 C0,40 20,60 20,60 Z" fill="#fbbf24"/>
                <circle cx="20" cy="20" r="7" fill="#f59e0b"/>
            </svg>
        </div>
      <div
        ref={wheelGroupRef}
        className="w-full h-full"
        style={{
          transform: `rotate(${rotation + 90}deg) translateZ(0)`,
          WebkitTransform: `rotate(${rotation + 90}deg) translateZ(0)`,
          transformOrigin: '50% 50%',
          WebkitTransformOrigin: '50% 50%',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d'
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full"
        >
          <g>
            {renderSegments()}
            {numItems > 0 && items.map((_, index) => {
                const angleDeg = (360 / numItems) * index;
                const [x, y] = getCoordinatesForPercent(angleDeg / 360);
                return (
                    <circle key={`peg-${index}`} cx={x} cy={y} r={4} fill="#1f2937" stroke="#4b5563" strokeWidth="1" />
                );
            })}
          </g>
        </svg>
      </div>
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