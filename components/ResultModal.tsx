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

  const handleConfettiAnimationEnd = useCallback((id: number) => {
    setConfetti(current => current.filter(c => c.id !== id));
  }, []);
  
  useEffect(() => {
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setInterval> to use the correct return type
    // for setInterval in the current environment (which is `number` in the browser).
    let interval: ReturnType<typeof setInterval> | null = null;
    if (winner) {
      setIsVisible(true);
      
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
    }
    
    return () => {
      if(interval) clearInterval(interval);
    }
  }, [winner]);
  
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
