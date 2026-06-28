import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WHEEL_COLORS } from '../constants';

// GPU 가속 Canvas Confetti 입자 클래스 정의
class ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  fadeSpeed: number;
  widthRatio: number; // 펄럭이는 3D 시각 효과를 위한 변수

  constructor(canvasWidth: number, canvasHeight: number) {
    // 하늘에서 내리는 눈송이 형태의 기본 꽃가루
    this.x = Math.random() * canvasWidth;
    this.y = -20;
    this.size = Math.random() * 6 + 6;
    this.color = WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)] || '#06b6d4';
    this.speedX = Math.random() * 3 - 1.5;
    this.speedY = Math.random() * 2.5 + 1.5;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = Math.random() * 6 - 3;
    this.opacity = 1;
    this.fadeSpeed = Math.random() * 0.003 + 0.0015;
    this.widthRatio = Math.random() * 2 - 1;
  }

  // 폭죽처럼 사방으로 뿜어져 나가는 꽃가루 생성
  static createBurst(canvasWidth: number, canvasHeight: number, originX: number, originY: number) {
    const p = new ConfettiParticle(canvasWidth, canvasHeight);
    p.x = originX;
    p.y = originY;
    
    // 위를 향해 사방으로 발사되는 삼각 기하학적 앵글 계산
    const angle = (Math.random() * 70 + 235) * (Math.PI / 180); // 235도 ~ 305도 (위쪽 방향 부채꼴)
    const speed = Math.random() * 14 + 6;
    p.speedX = Math.cos(angle) * speed;
    p.speedY = Math.sin(angle) * speed;
    
    p.size = Math.random() * 8 + 6;
    p.fadeSpeed = Math.random() * 0.008 + 0.004; // 뿜어져 나오는 파티클은 좀 더 빠르게 사라짐
    return p;
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.x += this.speedX;
    this.y += this.speedY;
    
    // 물리 시뮬레이션: 중력 작용 및 미세한 공기 저항
    this.speedY += 0.15; // 중력
    this.speedX *= 0.98; // 공기저항 감쇠
    this.rotation += this.rotationSpeed;
    this.opacity -= this.fadeSpeed;
    
    // 3D 펄럭임 효과 시뮬레이션
    this.widthRatio = Math.sin(this.rotation * 0.06);

    // 유효 범위 및 투명도 검사로 제거 대상 여부 리턴
    return this.y < canvasHeight + 50 && this.opacity > 0 && this.x > -50 && this.x < canvasWidth + 50;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.scale(this.widthRatio, 1.0); // 3D 회전하는 듯한 연출
    ctx.fillStyle = this.color;
    ctx.globalAlpha = this.opacity;
    
    // 꽃가루 모양의 이쁜 사각형 렌더링
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
    ctx.restore();
  }
}

interface ResultModalProps {
  winner: string | null;
  onClose: () => void;
  onDeleteWinner: (winner: string) => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ winner, onClose, onDeleteWinner }) => {
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const playFanfare = useCallback((audioContext: AudioContext) => {
    const playNote = (
      frequency: number,
      startTime: number,
      duration: number,
      volume = 0.3,
      type1: OscillatorType = 'sawtooth',
      type2: OscillatorType = 'square'
    ) => {
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      osc1.type = type1;
      osc2.type = type2;

      osc1.frequency.setValueAtTime(frequency, startTime);
      osc2.frequency.setValueAtTime(frequency * 1.005, startTime); // Detune for chorus effect

      // Envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, startTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc1.start(startTime);
      osc1.stop(startTime + duration);
      osc2.start(startTime);
      osc2.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    // C Major chord fanfare
    const C4 = 261.63;
    const G4 = 392.00;
    const C5 = 523.25;
    const E5 = 659.25;
    const G5 = 783.99;

    const short = 0.15;
    const long = 1.0;

    // Ba-da-da-daaa!
    playNote(C4, now, short, 0.3);
    playNote(G4, now + short, short, 0.3);
    
    // Chord for the final note
    const chordTime = now + short * 2;
    playNote(C5, chordTime, long, 0.4);
    playNote(E5, chordTime, long, 0.32);
    playNote(G5, chordTime, long, 0.25);
  }, []);

  useEffect(() => {
    let active = true;
    
    if (winner) {
      setIsVisible(true);
      if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100, 50, 300]);
      }
      
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
        }
        
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => playFanfare(ctx));
        } else {
            playFanfare(ctx);
        }
      } catch (e) {
        console.error("오디오 컨텍스트를 생성하거나 팡파레를 재생할 수 없습니다:", e);
      }

      // Canvas 파티클 시뮬레이션 설정
      let particles: ConfettiParticle[] = [];
      const canvas = canvasRef.current;
      
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const handleResize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.setTransform(1, 0, 0, 1, 0, 0); // 매번 변환 리셋 후 스케일 적용
            ctx.scale(dpr, dpr);
          };

          handleResize();
          window.addEventListener('resize', handleResize);

          // 초기 폭발 (Burst) 파티클 양방향 발사 (왼쪽 아래 & 오른쪽 아래)
          const w = window.innerWidth;
          const h = window.innerHeight;
          for (let i = 0; i < 50; i++) {
            particles.push(ConfettiParticle.createBurst(w, h, w * 0.1, h * 0.9));
            particles.push(ConfettiParticle.createBurst(w, h, w * 0.9, h * 0.9));
          }

          // 애니메이션 렌더 60fps 루프
          const renderLoop = () => {
            if (!active) return;
            
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

            // 잔잔한 꽃가루비 공급 (최대 160개 유지)
            if (particles.length < 160 && Math.random() < 0.3) {
              particles.push(new ConfettiParticle(window.innerWidth, window.innerHeight));
            }

            // 물리 업데이트 및 그리기
            particles = particles.filter(p => {
              const alive = p.update(window.innerWidth, window.innerHeight);
              if (alive) {
                p.draw(ctx);
              }
              return alive;
            });

            animationFrameRef.current = requestAnimationFrame(renderLoop);
          };

          // 프레임 애니메이션 시작
          animationFrameRef.current = requestAnimationFrame(renderLoop);

          return () => {
            active = false;
            window.removeEventListener('resize', handleResize);
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }
          };
        }
      }

    } else {
      setIsVisible(false);
      // 리소스 해제를 위한 오디오 컨텍스트 클로즈
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().then(() => {
              audioContextRef.current = null;
          });
      }
    }
  }, [winner, playFanfare]);

  const handleTransitionEnd = () => {
    // 닫힘 모션이 끝나면 내부 상태 정리는 useEffect의 winner 감지에서 canvas 리셋을 통해 유기적으로 흐름
  };
  
  const handleConfirmDelete = () => {
    if (winner) {
      onDeleteWinner(winner);
    }
  };

  if (!winner && !isVisible) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}
      onClick={onClose}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* 고성능 GPU 가속 Canvas Confetti 레이어 */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-0"
        style={{ willChange: 'transform' }}
      />
      
      <div 
        className={`flex flex-col items-center justify-center transform transition-all duration-700 ease-out z-10 ${isVisible ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p 
          className="font-extrabold text-white text-center break-words"
          style={{ 
            fontSize: 'clamp(3rem, 15vw, 12rem)',
            lineHeight: '1',
            textShadow: '0 5px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(250, 204, 21, 0.8)'
          }}
        >
          {winner}
        </p>
        
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
                onClick={handleConfirmDelete}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400"
            >
                당첨된 항목 지우기
            </button>
            <button
                onClick={onClose}
                className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-400"
            >
                닫기
            </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;