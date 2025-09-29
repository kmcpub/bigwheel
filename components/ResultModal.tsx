import React, { useEffect, useState } from 'react';
import { WHEEL_COLORS } from '../constants';

interface ConfettiPieceProps {
  style: React.CSSProperties;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ style }) => (
  <div className="absolute w-2 h-4 rounded-sm confetti" style={style}></div>
);


interface ResultModalProps {
  winner: string | null;
  onClose: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ winner, onClose }) => {
  const [confetti, setConfetti] = useState<React.ReactElement[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (winner) {
      setIsVisible(true);
      
      // 색종이 생성
      const newConfetti = Array.from({ length: 150 }).map((_, i) => {
        const style = {
          left: `${Math.random() * 100}%`,
          backgroundColor: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
          animationDelay: `${Math.random() * 2}s`,
          transform: `rotate(${Math.random() * 360}deg)`
        };
        return <ConfettiPiece key={i} style={style} />;
      });
      setConfetti(newConfetti);
    } else {
      setIsVisible(false);
    }
  }, [winner]);
  
  const handleAnimationEnd = () => {
    if (!winner) {
        setConfetti([]); // 애니메이션이 끝나고 모달이 닫히면 색종이 제거
    }
  }

  if (!winner && !isVisible) {
    return null;
  }

  return (
    <div 
        className={`fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`}
        onClick={onClose}
        onTransitionEnd={handleAnimationEnd}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti}
      </div>
      <div 
        className={`transform transition-all duration-700 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`}
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
      </div>
    </div>
  );
};

export default ResultModal;