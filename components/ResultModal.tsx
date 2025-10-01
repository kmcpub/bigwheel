import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WHEEL_COLORS } from '../constants';

interface ConfettiState {
  id: number;
  style: React.CSSProperties;
}

interface ConfettiPieceProps {
  id: number;
  style: React.CSSProperties;
  onAnimationEnd: (id: number) => void;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ id, style, onAnimationEnd }) => (
  <div 
    className="absolute w-2 h-4 rounded-sm confetti" 
    style={style}
    onAnimationEnd={() => onAnimationEnd(id)}
  ></div>
);

interface ResultModalProps {
  winner: string | null;
  onClose: () => void;
  onDeleteWinner: (winner: string) => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ winner, onClose, onDeleteWinner }) => {
  const [confetti, setConfetti] = useState<ConfettiState[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const nextId = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playFanfare = useCallback((audioContext: AudioContext) => {
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.05); // Attack
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);   // Decay
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    const C4 = 261.63;
    const G4 = 392.00;
    const C5 = 523.25;

    playNote(C4, now, 0.15);
    playNote(G4, now + 0.2, 0.15);
    playNote(C5, now + 0.4, 0.5);
  }, []);

  const handleConfettiAnimationEnd = useCallback((id: number) => {
    setConfetti(current => current.filter(c => c.id !== id));
  }, []);
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (winner) {
      setIsVisible(true);

      // 팡파레 생성 및 재생
      try {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        playFanfare(audioContextRef.current);
      } catch (e) {
        console.error("오디오 컨텍스트를 생성하거나 팡파레를 재생할 수 없습니다:", e);
      }
      
      const addConfetti = () => {
        const newPieces: ConfettiState[] = Array.from({ length: 10 }).map(() => {
            const id = nextId.current++;
            return {
                id,
                style: {
                    left: `${Math.random() * 100}%`,
                    backgroundColor: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
                    animationDuration: `${Math.random() * 2 + 3}s`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animationDelay: '0s',
                },
            };
        });
        setConfetti(current => [...current, ...newPieces]);
      }
      
      interval = setInterval(addConfetti, 100);

    } else {
      setIsVisible(false);
      // 모달이 닫힐 때 오디오 컨텍스트 정리
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          audioContextRef.current = null;
        });
      }
    }
    
    return () => {
      if(interval) clearInterval(interval);
    }
  }, [winner, playFanfare]);
  
  const handleTransitionEnd = () => {
    if (!winner) {
        setConfetti([]); // 모달 닫힘 애니메이션이 끝나면 색종이를 모두 제거합니다.
    }
  }
  
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(c => 
          <ConfettiPiece 
            key={c.id} 
            id={c.id} 
            style={c.style} 
            onAnimationEnd={handleConfettiAnimationEnd} 
          />
        )}
      </div>
      <div 
        className={`flex flex-col items-center justify-center transform transition-all duration-700 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`}
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