// Bundled by AI Engineer for GitHub Pages deployment
(function () {
  'use strict';

  const { useState, useCallback, useEffect, useRef, useMemo, StrictMode, createElement, Fragment } = React;

  // --- START OF constants.ts ---
  const WHEEL_COLORS = [
    '#f87171', '#fb923c', '#facc15', '#a3e635', '#4ade80', '#34d399',
    '#2dd4bf', '#67e8f9', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc',
    '#f472b6', '#fb7185',
  ];
  const PRESET_ITEMS = {
    participants: ['철수', '영희', '민준', '서연', '지훈', '하은', '도윤', '유진'],
    numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    choices: ['예', '아니오', '아마도', '나중에 다시 물어보기'],
  };

  // --- START OF components/ResultModal.tsx ---
  const ConfettiPiece = ({ style }) => createElement("div", { className: "absolute w-2 h-4 rounded-sm confetti", style: style });

  const ResultModal = ({ winner, onClose }) => {
    const [confetti, setConfetti] = useState([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (winner) {
        setIsVisible(true);
        const newConfetti = Array.from({ length: 150 }).map((_, i) => {
          const style = {
            left: `${Math.random() * 100}%`,
            backgroundColor: WHEEL_COLORS[Math.floor(Math.random() * WHEEL_COLORS.length)],
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          };
          return createElement(ConfettiPiece, { key: i, style: style });
        });
        setConfetti(newConfetti);
      } else {
        setIsVisible(false);
      }
    }, [winner]);

    const handleAnimationEnd = () => {
      if (!winner) {
        setConfetti([]);
      }
    };

    if (!winner && !isVisible) {
      return null;
    }

    return createElement("div", {
        className: `fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`,
        onClick: onClose,
        onTransitionEnd: handleAnimationEnd
      },
      createElement("div", { className: "absolute inset-0 overflow-hidden pointer-events-none" }, confetti),
      createElement("div", {
          className: `transform transition-all duration-700 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`,
          onClick: (e) => e.stopPropagation()
        },
        createElement("p", {
          className: "font-extrabold text-white text-center break-words",
          style: {
            fontSize: 'clamp(3rem, 15vw, 12rem)',
            lineHeight: '1',
            textShadow: '0 5px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(250, 204, 21, 0.8)'
          }
        }, winner)
      )
    );
  };

  // --- START OF components/Controls.tsx ---
  const Controls = ({ initialItems, onItemsChange, onShuffle }) => {
    const [text, setText] = useState(initialItems.join('\n'));
    const isComposingRef = useRef(false);

    useEffect(() => {
      const itemsFromCurrentText = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      if (itemsFromCurrentText.length !== initialItems.length || itemsFromCurrentText.some((item, index) => item !== initialItems[index])) {
        setText(initialItems.join('\n'));
      }
    }, [initialItems]);

    const handleTextChange = useCallback((event) => {
      const newText = event.target.value;
      setText(newText);
      if (!isComposingRef.current) {
        const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        onItemsChange(newItems);
      }
    }, [onItemsChange]);

    const handleCompositionStart = useCallback(() => { isComposingRef.current = true; }, []);
    const handleCompositionEnd = useCallback((event) => {
      isComposingRef.current = false;
      const newText = event.target.value;
      const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      onItemsChange(newItems);
    }, [onItemsChange]);

    const handlePreset = useCallback((preset) => {
      const newItems = PRESET_ITEMS[preset];
      setText(newItems.join('\n'));
      onItemsChange(newItems);
    }, [onItemsChange]);

    return createElement("div", { className: "bg-slate-800 p-6 rounded-lg shadow-2xl h-full flex flex-col overflow-y-auto" },
      createElement("h2", { className: "text-2xl font-bold mb-4 text-cyan-400" }, "돌림판 설정"),
      createElement("div", { className: "mb-4" },
        createElement("h3", { className: "font-semibold mb-2 text-gray-300" }, "미리 설정된 목록"),
        createElement("div", { className: "flex flex-wrap gap-2" },
          createElement("button", { onClick: () => handlePreset('participants'), className: "bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors" }, "참가자"),
          createElement("button", { onClick: () => handlePreset('numbers'), className: "bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors" }, "숫자"),
          createElement("button", { onClick: () => handlePreset('choices'), className: "bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors" }, "선택")
        )
      ),
      createElement("div", { className: "flex-grow flex flex-col" },
        createElement("label", { htmlFor: "items", className: "block font-semibold mb-2 text-gray-300" }, "항목 (한 줄에 하나씩)"),
        createElement("textarea", {
          id: "items", value: text, onChange: handleTextChange, onCompositionStart: handleCompositionStart, onCompositionEnd: handleCompositionEnd,
          className: "w-full flex-grow bg-slate-700 text-gray-200 p-3 rounded-md border-2 border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-0 transition-colors",
          placeholder: "항목 1\n항목 2\n항목 3",
          rows: 5
        }),
        createElement("p", { className: "text-sm text-gray-500 mt-1" }, `${initialItems.length} 개 항목`)
      ),
      createElement("div", { className: "mt-4 pt-4 flex flex-col gap-3" },
        createElement("div", { className: "flex gap-3" },
          createElement("button", { onClick: onShuffle, className: "w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-300" }, "순서 섞기"),
          createElement("button", { onClick: () => { setText(''); onItemsChange([]); }, className: "w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300" }, "전체 삭제")
        )
      )
    );
  };

  // --- START OF components/Wheel.tsx ---
  const Wheel = ({ items, onSpinEnd }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [pointerRotation, setPointerRotation] = useState(0);

    const isSpinningRef = useRef(false);
    const settlingRef = useRef(false);
    const velocityRef = useRef(0);
    const rotationRef = useRef(0);
    const lastRotationRef = useRef(0);
    const pointerRotationRef = useRef(0);
    const pointerVelocityRef = useRef(0);
    const animationFrameRef = useRef(null);
    const audioContextRef = useRef(null);

    const displayItems = useMemo(() => {
      const n = items.length;
      if (n > 0 && n < 16) {
        const repeatCount = Math.ceil(16 / n);
        return Array.from({ length: repeatCount }).flatMap(() => items);
      }
      return items;
    }, [items]);

    const colorMap = useMemo(() => {
      const map = new Map();
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

    const animate = useCallback(() => {
      const POINTER_STIFFNESS = 0.3;
      const POINTER_DAMPING = 0.85;
      
      const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
      pointerVelocityRef.current += restoringForce;
      pointerVelocityRef.current *= POINTER_DAMPING;
      pointerRotationRef.current += pointerVelocityRef.current;
      setPointerRotation(pointerRotationRef.current);

      if (isSpinningRef.current) {
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

        const nextRotation = rotationRef.current + velocity;
        const lastSegmentIndex = Math.floor(rotationRef.current / segmentAngle);
        const currentSegmentIndex = Math.floor(nextRotation / segmentAngle);
        
        if (currentSegmentIndex !== lastSegmentIndex) {
          playTickSound();
          const kickDirection = Math.sign(velocity) || (currentSegmentIndex > lastSegmentIndex ? 1 : -1);
          const bounceStrength = Math.abs(velocity);
          const kickVelocity = 12 + bounceStrength * 1.5;

          if (kickDirection > 0) {
            if (pointerRotationRef.current < 0) pointerRotationRef.current = 0;
            pointerVelocityRef.current = kickVelocity;
          } else {
            if (pointerRotationRef.current > 0) pointerRotationRef.current = 0;
            pointerVelocityRef.current = -kickVelocity;
          }
          velocity *= 0.97;
        }
        
        if (Math.abs(velocity) < STOP_VELOCITY) {
          settlingRef.current = true;
        }

        if (settlingRef.current && Math.abs(velocity) < 0.001) {
          velocity = 0;
          isSpinningRef.current = false;
          settlingRef.current = false;
          setIsSpinning(false);
          
          const finalRotation = rotationRef.current;
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
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          console.error("Web Audio API is not supported in this browser.");
        }
      }
      isSpinningRef.current = true;
      settlingRef.current = false;
      setIsSpinning(true);
      velocityRef.current = Math.random() * 15 + 25;
      lastRotationRef.current = rotationRef.current;
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    useEffect(() => {
      return () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };
    }, []);

    const getCoordinatesForPercent = (percent) => {
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
        const pathData = `M ${center},${center} L ${start[0]},${start[1]} A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]} Z`;
        const textAngle = startAngle + segmentAngle / 2;
        const textRotation = textAngle > 90 && textAngle < 270 ? textAngle - 180 : textAngle;
        const textX = center + (radius / 1.5) * Math.cos(textAngle * Math.PI / 180);
        const textY = center + (radius / 1.5) * Math.sin(textAngle * Math.PI / 180);
        const truncatedItem = item.length > 15 ? item.substring(0, 14) + '…' : item;
        const fontSize = Math.max(8, 28 - numItems * 0.5);
        return createElement("g", { key: index },
          createElement("path", { d: pathData, fill: colorMap.get(item) || '#374151', stroke: "#1f2937", strokeWidth: "2" }),
          createElement("text", {
            x: textX, y: textY,
            transform: `rotate(${textRotation}, ${textX}, ${textY})`,
            fill: "#111827", fontSize: fontSize, fontWeight: "bold",
            textAnchor: "middle", alignmentBaseline: "middle", className: "select-none"
          }, truncatedItem)
        );
      });
    };

    return createElement("div", { className: "relative w-full aspect-square flex items-center justify-center" },
      createElement("div", {
        className: "absolute left-1/2 -translate-x-1/2 z-20",
        style: {
          width: '8%', height: '12%', top: '-10%',
          filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.3))',
          transform: `rotate(${pointerRotation}deg)`,
          transformOrigin: '50% 41.66%'
        }
      },
        createElement("svg", { width: "100%", height: "100%", viewBox: "0 0 40 60", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
          createElement("path", { d: "M20 60C20 60 40 35.8333 40 25C40 11.1929 31.0457 0 20 0C8.9543 0 0 11.1929 0 25C0 35.8333 20 60 20 60Z", fill: "#facc15" }),
          createElement("circle", { cx: "20", cy: "25", r: "5", fill: "#eab308" })
        )
      ),
      createElement("svg", { viewBox: `0 0 ${size} ${size}`, className: "w-full h-full", style: { transform: 'rotate(90deg)' } },
        createElement("g", { style: { transform: `rotate(${rotation}deg)`, transformOrigin: 'center' } },
          renderSegments(),
          numItems > 0 && displayItems.map((_, index) => {
            const angleDeg = (360 / numItems) * index;
            const [x, y] = getCoordinatesForPercent(angleDeg / 360);
            return createElement("circle", { key: `peg-${index}`, cx: x, cy: y, r: 4, fill: "#1f2937", stroke: "#4b5563", strokeWidth: "1" });
          })
        )
      ),
      createElement("button", {
        onClick: handleSpin, disabled: isSpinning || items.length < 2,
        className: "absolute z-10 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold w-24 h-24 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 flex items-center justify-center text-xl",
        "aria-label": "돌림판 돌리기"
      }, isSpinning ? '...' : '돌리기!')
    );
  };

  // --- START OF App.tsx ---
  const App = () => {
    const [items, setItems] = useState(() => {
      try {
        const savedItems = localStorage.getItem('spinningWheelItems');
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems);
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            return parsedItems;
          }
        }
      } catch (error) {
        console.error("저장된 아이템을 불러오는 데 실패했습니다:", error);
      }
      return PRESET_ITEMS.participants;
    });
    const [winner, setWinner] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
      try {
        localStorage.setItem('spinningWheelItems', JSON.stringify(items));
      } catch (error) {
        console.error("아이템을 저장하는 데 실패했습니다:", error);
      }
    }, [items]);

    const handleItemsChange = useCallback((newItems) => { setItems(newItems); }, []);
    const handleShuffle = useCallback(() => { setItems(prevItems => [...prevItems].sort(() => Math.random() - 0.5)); }, []);
    const handleSpinEnd = useCallback((selectedItem) => { setWinner(selectedItem); }, []);
    const handleCloseModal = useCallback(() => { setWinner(null); }, []);

    const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          alert(`전체 화면 모드를 시작할 수 없습니다: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }, []);

    return createElement(Fragment, null,
      createElement("div", { className: "h-screen text-gray-100 flex flex-col items-center p-4 font-sans overflow-hidden" },
        createElement("header", { className: "w-full max-w-7xl text-center mb-4 flex-shrink-0" },
          createElement("h1", { className: "text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider" }, "돌려돌려~ 돌림판!"),
          createElement("p", { className: "text-gray-400 mt-2" }, "햇반 뽑기 시스템")
        ),
        createElement("main", { className: "w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8 items-stretch min-h-0" },
          createElement("div", { className: "w-full lg:w-2/3 flex items-center justify-center" },
            createElement(Wheel, { items: items, onSpinEnd: handleSpinEnd })
          ),
          createElement("div", { className: "w-full lg:w-1/3 flex flex-col min-h-0" },
            createElement(Controls, { initialItems: items, onItemsChange: handleItemsChange, onShuffle: handleShuffle })
          )
        ),
        createElement(ResultModal, { winner: winner, onClose: handleCloseModal })
      ),
      createElement("button", {
        onClick: toggleFullscreen,
        className: "fixed bottom-4 right-4 z-30 bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors",
        "aria-label": isFullscreen ? "전체 화면 종료" : "전체 화면 시작"
      }, isFullscreen ?
        createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
          createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" })
        ) :
        createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
          createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 8V4m0 0h4M4 4l5 5m7-5h4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m7 5h4m0 0v4m0-4l-5-5" })
        )
      )
    );
  };

  // --- START OF index.tsx ---
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(createElement(StrictMode, null, createElement(App, null)));

})();