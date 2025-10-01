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
  const DEFAULT_PRESETS = [
    { id: 'participants', name: '참가자', items: ['철수', '영희', '민준', '서연', '지훈', '하은', '도윤', '유진'] },
    { id: 'numbers', name: '숫자', items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
    { id: 'rps', name: '가위바위보', items: ['가위', '바위', '보'] },
    { id: 'pros-cons', name: '찬반', items: ['찬성', '반대'] },
  ];

  // --- START OF components/ResultModal.tsx ---
  const ConfettiPiece = ({ id, style, onAnimationEnd }) => (
    createElement("div", {
      className: "absolute w-2 h-4 rounded-sm confetti",
      style: style,
      onAnimationEnd: () => onAnimationEnd(id)
    })
  );

  const ResultModal = ({ winner, onClose, onDeleteWinner }) => {
    const [confetti, setConfetti] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const nextId = useRef(0);
    const audioContextRef = useRef(null);

    const playFanfare = useCallback((audioContext) => {
      const playNote = (
        frequency,
        startTime,
        duration,
        volume = 0.3,
        type1 = 'sawtooth',
        type2 = 'square'
      ) => {
        // Layering oscillators for a richer, brassy tone
        const osc1 = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc1.type = type1;
        osc2.type = type2;

        osc1.frequency.setValueAtTime(frequency, startTime);
        // Slightly detune the second oscillator for a chorus effect
        osc2.frequency.setValueAtTime(frequency * 1.005, startTime);

        // ADSR-like envelope for a punchier sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02); // Fast attack
        gainNode.gain.exponentialRampToValueAtTime(volume * 0.7, startTime + 0.1); // Decay
        gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Release

        osc1.start(startTime);
        osc1.stop(startTime + duration);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      // Frequencies for a C major scale
      const C4 = 261.63;
      const G4 = 392.00;
      const C5 = 523.25;
      const E5 = 659.25;
      const G5 = 783.99;

      const short = 0.15;
      const long = 1.0;

      // Phrase 1: Quick ascending arpeggio
      playNote(C4, now, short, 0.3);
      playNote(G4, now + short, short, 0.3);
      
      // Phrase 2: The final, rich C-major chord
      const chordTime = now + short * 2;
      playNote(C5, chordTime, long, 0.4);  // Root
      playNote(E5, chordTime, long, 0.32); // Major third
      playNote(G5, chordTime, long, 0.25); // Perfect fifth
    }, []);

    const handleConfettiAnimationEnd = useCallback((id) => {
      setConfetti(current => current.filter(c => c.id !== id));
    }, []);

    useEffect(() => {
      let interval = null;
      if (winner) {
        setIsVisible(true);
        
        // 팡파레 생성 및 재생
        try {
          if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          }
          if (audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume();
          }
          playFanfare(audioContextRef.current);
        } catch (e) {
          console.error("오디오 컨텍스트를 생성하거나 팡파레를 재생할 수 없습니다:", e);
        }

        const addConfetti = () => {
          const newPieces = Array.from({ length: 10 }).map(() => {
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
        };
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
        if (interval) clearInterval(interval);
      };
    }, [winner, playFanfare]);

    const handleTransitionEnd = () => {
      if (!winner) {
        setConfetti([]);
      }
    };
    
    const handleConfirmDelete = () => {
      if (winner) {
        onDeleteWinner(winner);
      }
    };

    if (!winner && !isVisible) {
      return null;
    }

    return createElement("div", {
        className: `fixed inset-0 bg-black flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${isVisible ? 'bg-opacity-75' : 'bg-opacity-0 pointer-events-none'}`,
        onClick: onClose,
        onTransitionEnd: handleTransitionEnd
      },
      createElement("div", { className: "absolute inset-0 overflow-hidden pointer-events-none" },
        confetti.map(c =>
          createElement(ConfettiPiece, {
            key: c.id,
            id: c.id,
            style: c.style,
            onAnimationEnd: handleConfettiAnimationEnd
          })
        )
      ),
      createElement("div", {
          className: `flex flex-col items-center justify-center transform transition-all duration-700 ease-out ${isVisible ? 'scale-100 opacity-100' : 'scale-125 opacity-0'}`,
          onClick: (e) => e.stopPropagation()
        },
        createElement("p", {
          className: "font-extrabold text-white text-center break-words",
          style: {
            fontSize: 'clamp(3rem, 15vw, 12rem)',
            lineHeight: '1',
            textShadow: '0 5px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(250, 204, 21, 0.8)'
          }
        }, winner),
        createElement("div", { className: "mt-12 flex flex-col sm:flex-row items-center justify-center gap-4" },
            createElement("button", {
                onClick: handleConfirmDelete,
                className: "w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-400"
            }, "당첨된 항목 지우기"),
            createElement("button", {
                onClick: onClose,
                className: "w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-slate-400"
            }, "닫기")
        )
      )
    );
  };
  
  // --- START OF components/ScreenPickerModal.tsx ---
  const ScreenPickerModal = ({ show, screens, onSelect, onClose }) => {
    if (!show) {
      return null;
    }

    return createElement("div", {
        className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4",
        onClick: onClose,
        "aria-modal": "true",
        role: "dialog"
      },
      createElement("div", {
          className: "bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md",
          onClick: (e) => e.stopPropagation()
        },
        createElement("h2", { className: "text-2xl font-bold mb-4 text-cyan-400" }, "전체 화면으로 표시할 모니터 선택"),
        createElement("p", { className: "text-gray-400 mb-6" }, "사용 가능한 디스플레이 목록입니다. 하나를 선택하여 전체 화면으로 전환하세요."),
        createElement("div", { className: "flex flex-col gap-3" },
          screens.map((screen, index) =>
            createElement("button", {
                key: screen.label || index,
                onClick: () => onSelect(screen),
                className: "w-full text-left p-4 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
              },
              createElement("div", { className: "font-bold text-lg text-gray-100" },
                screen.label || `모니터 ${index + 1}`,
                screen.isPrimary && createElement("span", { className: "text-xs font-normal bg-cyan-500 text-slate-900 px-2 py-0.5 rounded-full ml-2" }, "기본")
              ),
              createElement("div", { className: "text-sm text-gray-400" },
                `해상도: ${screen.width} x ${screen.height}`
              )
            )
          )
        ),
        createElement("div", { className: "mt-6 text-right" },
          createElement("button", {
            onClick: onClose,
            className: "bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          }, "취소")
        )
      )
    );
  };


  // --- START OF components/Controls.tsx ---
  const EditablePresetButton = ({ preset, isSelected, onSelect, onNameChange }) => {
      const [isEditing, setIsEditing] = useState(false);
      const [value, setValue] = useState(preset.name);
      const inputRef = useRef(null);

      useEffect(() => {
          setValue(preset.name);
      }, [preset.name]);

      useEffect(() => {
          if (isEditing) {
              inputRef.current?.focus();
              inputRef.current?.select();
          }
      }, [isEditing]);

      const handleSave = () => {
          const trimmedValue = value.trim();
          if (trimmedValue && trimmedValue !== preset.name) {
              onNameChange(trimmedValue);
          } else {
              setValue(preset.name);
          }
          setIsEditing(false);
      };

      const handleKeyDown = (e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
              setValue(preset.name);
              setIsEditing(false);
          }
      };

      const handleClick = () => {
          if (isSelected && !isEditing) {
              setIsEditing(true);
          } else if (!isEditing) {
              onSelect();
          }
      };

      const baseClasses = "text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors flex-shrink-0";
      const selectedClasses = isSelected ? "ring-2 ring-cyan-400 bg-violet-700" : "bg-violet-500 hover:bg-violet-600";
      
      if (isEditing) {
          return (
              createElement("div", { className: `${baseClasses} ${selectedClasses} inline-flex items-center justify-center` },
                   createElement("input", {
                      ref: inputRef,
                      type: "text",
                      value: value,
                      onChange: (e) => setValue(e.target.value),
                      onBlur: handleSave,
                      onKeyDown: handleKeyDown,
                      className: "bg-transparent outline-none text-center p-0 m-0 w-24",
                      onClick: (e) => e.stopPropagation()
                  })
              )
          )
      }

      return (
          createElement("button", {
              onClick: handleClick,
              className: `${baseClasses} ${selectedClasses}`,
              title: isSelected ? "이름을 수정하려면 다시 클릭하세요" : preset.name
          }, preset.name)
      );
  };


  const Controls = ({ initialItems, onItemsChange, onShuffle, presets, setPresets, selectedPresetId, setSelectedPresetId, expandedHeight, collapsedVisibleHeight }) => {
    const [text, setText] = useState(initialItems.join('\n'));
    const isComposingRef = useRef(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const dragStartY = useRef(0);
    const isDragging = useRef(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
      const itemsFromCurrentText = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      if (JSON.stringify(itemsFromCurrentText) !== JSON.stringify(initialItems)) {
          setText(initialItems.join('\n'));
      }
    }, [initialItems]);
    
    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile) {
          setIsExpanded(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleTextChange = useCallback((event) => {
      const newText = event.target.value;
      setText(newText);
      setSelectedPresetId(null);

      if (!isComposingRef.current) {
        const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
        onItemsChange(newItems);
      }
    }, [onItemsChange, setSelectedPresetId]);

    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback((event) => {
      isComposingRef.current = false;
      const newText = event.target.value;
      const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      onItemsChange(newItems);
      setSelectedPresetId(null);
    }, [onItemsChange, setSelectedPresetId]);

    const handleAddPreset = () => {
      if (initialItems.length === 0) return;
      const newPreset = {
        id: Date.now().toString(),
        name: `새 목록 ${presets.length + 1}`,
        items: initialItems,
      };
      setPresets(prev => [...prev, newPreset]);
      setSelectedPresetId(newPreset.id);
    };

    const handleDeletePreset = () => {
      if (!selectedPresetId) return;
      setPresets(prev => prev.filter(p => p.id !== selectedPresetId));
      setSelectedPresetId(null);
    };
    
    const handlePointerDown = (e) => {
      isDragging.current = true;
      dragStartY.current = e.clientY;
      e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerUp = (e) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const deltaY = e.clientY - dragStartY.current;
      if (Math.abs(deltaY) > 50) {
        setIsExpanded(deltaY < 0);
      } else {
        setIsExpanded(prev => !prev);
      }
      e.target.releasePointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
      if (isDragging.current) {
        e.preventDefault();
      }
    };
    
    const handleTextareaFocus = () => {
      if (window.innerWidth < 1024) {
        setIsExpanded(true);
      }
    };

    const controlsContent = createElement("div", { className: "px-6 pb-6 lg:p-0 h-full flex flex-col overflow-y-auto" },
      createElement("h2", { className: "text-2xl font-bold mb-4 text-cyan-400" }, "돌림판 설정"),
      createElement("div", { className: "mb-4" },
        createElement("h3", { className: "font-semibold mb-2 text-gray-300" }, "미리 설정된 목록"),
        createElement("div", { className: "flex items-center justify-between gap-4 mt-2" },
            createElement("div", { className: "flex flex-wrap gap-2 flex-grow" },
              presets.map(preset =>
                createElement(EditablePresetButton, {
                  key: preset.id,
                  preset: preset,
                  isSelected: selectedPresetId === preset.id,
                  onSelect: () => {
                    onItemsChange(preset.items);
                    setSelectedPresetId(preset.id);
                  },
                  onNameChange: (newName) => {
                    setPresets(currentPresets =>
                      currentPresets.map(p =>
                        p.id === preset.id ? { ...p, name: newName } : p
                      )
                    );
                  }
                })
              )
            ),
            createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
                createElement("button", {
                    onClick: handleAddPreset,
                    disabled: initialItems.length === 0,
                    className: "flex items-center justify-center w-8 h-8 rounded-full text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed",
                    "aria-label": "현재 항목으로 목록 추가",
                    title: "현재 항목으로 목록 추가"
                },
                    createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5 },
                        createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4v16m8-8H4" })
                    )
                ),
                createElement("button", {
                    onClick: handleDeletePreset,
                    disabled: !selectedPresetId,
                    className: "flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-slate-700 hover:text-red-400 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed",
                    "aria-label": "선택 목록 삭제",
                    title: "선택 목록 삭제"
                },
                    createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5 },
                        createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
                    )
                )
            )
        )
      ),
      createElement("div", { className: "flex-grow flex flex-col" },
        createElement("label", { htmlFor: "items", className: "block font-semibold mb-2 text-gray-300" }, "항목 (한 줄에 하나씩)"),
        createElement("textarea", {
          id: "items",
          value: text,
          onChange: handleTextChange,
          onCompositionStart: handleCompositionStart,
          onCompositionEnd: handleCompositionEnd,
          onFocus: handleTextareaFocus,
          className: "w-full flex-grow bg-slate-700 text-gray-200 p-3 rounded-md border-2 border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-0 transition-colors",
          placeholder: "항목 1\n항목 2\n항목 3",
          rows: 5
        }),
        createElement("p", { className: "text-sm text-gray-500 mt-1" }, `${initialItems.length} 개 항목`)
      ),
      createElement("div", { className: "mt-4 pt-4 flex flex-col gap-3" },
        createElement("div", { className: "flex gap-3" },
          createElement("button", { onClick: onShuffle, className: "w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-300" }, "순서 섞기"),
          createElement("button", {
            onClick: () => {
              onItemsChange([]);
              setSelectedPresetId(null);
            },
            className: "w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          }, "전체 삭제")
        )
      )
    );

    const containerStyle = {};
    if (isMobile) {
        containerStyle.transform = isExpanded
            ? 'translateY(0)'
            : `translateY(calc(100% - ${collapsedVisibleHeight}px))`;
    }

    return createElement(Fragment, null,
      isExpanded && isMobile && createElement("div", { className: "fixed inset-0 bg-black/60 z-20 lg:hidden", onClick: () => setIsExpanded(false) }),
      createElement("div", {
        className: `
          lg:h-full lg:relative lg:transform-none
          fixed inset-x-0 bottom-0 z-30
          transition-transform duration-300 ease-out
        `,
        style: containerStyle
      },
        createElement("div", {
          className: "bg-slate-800 lg:p-6 rounded-t-2xl lg:rounded-lg shadow-2xl h-full flex flex-col",
          style: isMobile ? { height: expandedHeight } : {}
        },
          createElement("div", {
            className: "w-full py-4 flex-shrink-0 flex justify-center items-center cursor-grab lg:hidden",
            onPointerDown: handlePointerDown,
            onPointerUp: handlePointerUp,
            onPointerMove: handlePointerMove,
            style: { touchAction: 'none' },
            "aria-label": isExpanded ? "설정 패널 축소" : "설정 패널 확장"
          },
            createElement("div", { className: "w-10 h-1.5 bg-slate-600 rounded-full" })
          ),
          controlsContent
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
    const peakRotationRef = useRef(0);
    const isReversingRef = useRef(false);
    const animationFrameRef = useRef(null);
    const audioContextRef = useRef(null);
    const tickBufferRef = useRef(null);
    
    const wheelContainerRef = useRef(null);
    const isDraggingRef = useRef(false);
    const lastPointerAngleRef = useRef(0);
    const velocityHistoryRef = useRef([]);

    const colorMap = useMemo(() => {
      const map = new Map();
      const uniqueItems = Array.from(new Set(items));
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

    const playTickSound = useCallback(() => {
        if (!audioContextRef.current || !tickBufferRef.current) return;
        const audioContext = audioContextRef.current;
        const source = audioContext.createBufferSource();
        source.buffer = tickBufferRef.current;
        source.connect(audioContext.destination);
        source.start();
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
          } else {
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

      if (!isSpinningRef.current && Math.abs(pointerVelocityRef.current) < 0.01 && Math.abs(pointerRotationRef.current) < 0.01) {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
        return;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }, [items, onSpinEnd, playTickSound]);

    const startSpin = useCallback(async (initialVelocity) => {
        if (isSpinningRef.current || items.length < 2) return;
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
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
            } catch (e) {
                console.error('오디오 틱 버퍼를 생성하는 데 실패했습니다:', e);
            }
        }
        isSpinningRef.current = true;
        settlingRef.current = false;
        isReversingRef.current = false;
        setIsSpinning(true);
        velocityRef.current = initialVelocity;
        if (!animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(animate);
        }
    }, [animate, items.length]);

    const handleSpin = () => {
        const randomVelocity = Math.random() * 15 + 25;
        startSpin(randomVelocity);
    };

    const getPointerPosition = useCallback((e) => {
        return { x: e.clientX, y: e.clientY };
    }, []);

    const getAngleFromEvent = useCallback((e) => {
        if (!wheelContainerRef.current) return 0;
        const rect = wheelContainerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const { x, y } = getPointerPosition(e);
        if (x === 0 && y === 0) return lastPointerAngleRef.current;
        const angleRad = Math.atan2(y - centerY, x - centerX);
        return (angleRad * 180) / Math.PI;
    }, [getPointerPosition]);
    
    const handlePointerMove = useCallback((e) => {
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

    const handlePointerUp = useCallback((e) => {
        if (!isDraggingRef.current) return;
        isDraggingRef.current = false;
        
        if (wheelContainerRef.current) {
            wheelContainerRef.current.releasePointerCapture(e.pointerId);
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

    const handlePointerDown = useCallback((e) => {
        if (isSpinningRef.current) return;
        
        isDraggingRef.current = true;
        const currentPointerAngle = getAngleFromEvent(e);
        lastPointerAngleRef.current = currentPointerAngle;
        velocityHistoryRef.current = [{ velocity: 0, time: performance.now() }];
        
        if (wheelContainerRef.current) {
            wheelContainerRef.current.setPointerCapture(e.pointerId);
        }

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    }, [getAngleFromEvent, handlePointerMove, handlePointerUp]);

    useEffect(() => {
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }, [handlePointerMove, handlePointerUp]);

    const getCoordinatesForPercent = (percent) => {
      const x = center + radius * Math.cos(2 * Math.PI * percent);
      const y = center + radius * Math.sin(2 * Math.PI * percent);
      return [x, y];
    };

    const renderSegments = () => {
      if (numItems === 0) return null;
      const segmentAngle = 360 / numItems;
      return items.map((item, index) => {
        const startAngle = segmentAngle * index;
        const endAngle = startAngle + segmentAngle;
        const start = getCoordinatesForPercent(startAngle / 360);
        const end = getCoordinatesForPercent(endAngle / 360);
        const largeArcFlag = segmentAngle > 180 ? 1 : 0;
        const pathData = [`M ${center},${center}`, `L ${start[0]},${start[1]}`, `A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]}`, 'Z'].join(' ');
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

    return createElement("div", { 
        ref: wheelContainerRef,
        className: "relative w-full aspect-square flex items-center justify-center cursor-grab active:cursor-grabbing select-none",
        onPointerDown: handlePointerDown,
        style: { touchAction: 'none' }
      },
      createElement("div", {
        className: "absolute left-1/2 z-20",
        style: {
          width: '8%',
          height: '12%',
          top: '-11%',
          transform: `translateX(-50%) rotate(${pointerRotation}deg)`,
          transformOrigin: '50% 33.33%',
          filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.4))'
        }
      },
      createElement("svg", { width: "100%", height: "100%", viewBox: "0 0 40 60", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        createElement("path", { d: "M20,60 C20,60 40,40 40,20 A20,20 0 1,0 0,20 C0,40 20,60 20,60 Z", fill: "#fbbf24" }),
        createElement("circle", { cx: "20", cy: "20", r: "7", fill: "#f59e0b" })
      )),
      createElement("svg", { viewBox: `0 0 ${size} ${size}`, className: "w-full h-full", style: { transform: 'rotate(90deg)' } },
        createElement("g", { style: { transform: `rotate(${rotation}deg)`, transformOrigin: 'center' } },
          renderSegments(),
          numItems > 0 && items.map((_, index) => {
            const angleDeg = (360 / numItems) * index;
            const [x, y] = getCoordinatesForPercent(angleDeg / 360);
            return createElement("circle", { key: `peg-${index}`, cx: x, cy: y, r: 4, fill: "#1f2937", stroke: "#4b5563", strokeWidth: "1" });
          })
        )
      ),
      createElement("button", {
        onClick: handleSpin,
        disabled: isSpinning || items.length < 2,
        className: "absolute z-10 bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold w-24 h-24 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-cyan-300 flex items-center justify-center text-xl",
        "aria-label": "돌림판 돌리기"
      }, isSpinning ? '...' : '돌리기!')
    );
  };
  
  // --- EditableText Component ---
  const EditableText = ({ initialValue, onSave, className, as: Component, ariaLabel }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue);
    const inputRef = useRef(null);

    useEffect(() => {
      setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    const handleSave = useCallback(() => {
      const trimmedValue = value.trim();
      if (trimmedValue === '') {
        setValue(initialValue);
      } else if (trimmedValue !== initialValue) {
        onSave(trimmedValue);
      }
      setIsEditing(false);
    }, [value, initialValue, onSave]);

    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        handleSave();
      } else if (event.key === 'Escape') {
        setValue(initialValue);
        setIsEditing(false);
      }
    };
    
    const handleClick = () => {
      if (!isEditing) {
        setIsEditing(true);
      }
    };

    if (isEditing) {
      return createElement("input", {
        ref: inputRef,
        type: "text",
        value: value,
        onChange: (e) => setValue(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        className: `${className} bg-transparent border-b-2 border-cyan-400 outline-none w-full text-center`,
        "aria-label": ariaLabel,
      });
    }

    return createElement(Component, {
      className: `${className} cursor-pointer hover:bg-slate-700/50 rounded-md px-2 transition-colors`,
      onClick: handleClick,
      title: "클릭하여 수정",
    }, value || initialValue);
  };
  
  // --- START OF App.tsx ---
  const App = () => {
    const [title, setTitle] = useState(() => localStorage.getItem('spinningWheelTitle') || '돌려돌려~ 돌림판!');
    const [subtitle, setSubtitle] = useState(() => localStorage.getItem('spinningWheelSubtitle') || '햇반 뽑기 시스템');

    const [presets, setPresets] = useState(() => {
      try {
        const savedPresets = localStorage.getItem('spinningWheelPresets');
        if (savedPresets) {
          const parsed = JSON.parse(savedPresets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) { console.error("미리 설정된 목록을 불러오는 데 실패했습니다:", e); }
      return DEFAULT_PRESETS;
    });
    const [selectedPresetId, setSelectedPresetId] = useState(null);

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
      return DEFAULT_PRESETS[0].items;
    });

    const [winner, setWinner] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [screens, setScreens] = useState([]);
    const [showScreenPicker, setShowScreenPicker] = useState(false);
    const wheelContainerRef = useRef(null);
    const [collapsedVisibleHeight, setCollapsedVisibleHeight] = useState(128);
    
    useEffect(() => {
        const calculateHeight = () => {
            if (wheelContainerRef.current && window.innerWidth < 1024) {
                const rect = wheelContainerRef.current.getBoundingClientRect();
                const margin = 16; // 1rem gap from wheel
                const height = window.innerHeight - rect.bottom - margin;
                
                // Set a minimum height for the visible part of the collapsed controls.
                setCollapsedVisibleHeight(Math.max(128, height));
            } else {
                setCollapsedVisibleHeight(128); // Reset to default for desktop
            }
        };

        window.addEventListener('resize', calculateHeight);
        // Initial calculation after a short delay to allow layout to settle.
        const timeoutId = setTimeout(calculateHeight, 100);

        return () => {
            window.removeEventListener('resize', calculateHeight);
            clearTimeout(timeoutId);
        };
    }, []);

    useEffect(() => {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);
    
    useEffect(() => {
        localStorage.setItem('spinningWheelTitle', title);
    }, [title]);

    useEffect(() => {
        localStorage.setItem('spinningWheelSubtitle', subtitle);
    }, [subtitle]);

    useEffect(() => {
      try {
        localStorage.setItem('spinningWheelItems', JSON.stringify(items));
      } catch (error) {
        console.error("아이템을 저장하는 데 실패했습니다:", error);
      }
    }, [items]);

    useEffect(() => {
      try {
        localStorage.setItem('spinningWheelPresets', JSON.stringify(presets));
      } catch (error) {
        console.error("프리셋을 저장하는 데 실패했습니다:", error);
      }
    }, [presets]);

    const wheelItems = useMemo(() => {
      if (items.length === 0) return [];
      if (items.length > 0 && items.length < 16) {
        const multiplier = Math.ceil(16 / items.length);
        return Array.from({ length: multiplier }, () => items).flat();
      }
      return items;
    }, [items]);

    const handleItemsChange = useCallback((newItems) => { setItems(newItems); }, []);
    const handleShuffle = useCallback(() => { setItems(prevItems => [...prevItems].sort(() => Math.random() - 0.5)); }, []);
    const handleSpinEnd = useCallback((selectedItem) => { setWinner(selectedItem); }, []);
    const handleCloseModal = useCallback(() => { setWinner(null); }, []);

    const handleDeleteWinner = useCallback((winnerToDelete) => {
        setItems(prevItems => prevItems.filter(item => item !== winnerToDelete));
        setWinner(null);
    }, []);

    const toggleFullscreen = useCallback(() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          alert(`전체 화면 모드를 시작할 수 없습니다: ${err.message} (${err.name})`);
        });
      } else {
        document.exitFullscreen();
      }
    }, []);
    
    const handleSelectScreen = async () => {
        if (!('getScreenDetails' in window)) {
            alert('이 브라우저에서는 화면 선택 기능을 지원하지 않습니다.');
            return;
        }
        try {
            const screenDetails = await window.getScreenDetails();
            setScreens(screenDetails.screens);
            setShowScreenPicker(true);
        } catch (err) {
            console.error("Error getting screen details:", err);
            alert(`화면 정보를 가져올 수 없습니다: ${err.message}`);
        }
    };
    
    const enterFullscreenOnScreen = (screen) => {
        document.documentElement.requestFullscreen({ screen }).catch(err => {
            alert(`선택한 화면에서 전체 화면 모드를 시작할 수 없습니다: ${err.message}`);
        });
        setShowScreenPicker(false);
    };

    return createElement(Fragment, null,
      createElement("div", { className: "h-dvh text-gray-100 flex flex-col items-center p-4 font-sans overflow-hidden" },
        createElement("header", { className: "w-full max-w-7xl text-center mb-4 flex-shrink-0" },
          createElement(EditableText, {
            initialValue: title,
            onSave: setTitle,
            as: "h1",
            className: "text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider",
            ariaLabel: "타이틀 수정",
          }),
          createElement(EditableText, {
            initialValue: subtitle,
            onSave: setSubtitle,
            as: "p",
            className: "text-gray-400 mt-2",
            ariaLabel: "부제 수정",
          })
        ),
        createElement("main", { className: "w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8 items-stretch min-h-0" },
          createElement("div", { ref: wheelContainerRef, className: "w-full lg:w-2/3 flex items-center justify-center" },
            createElement(Wheel, { items: wheelItems, onSpinEnd: handleSpinEnd })
          ),
          createElement("div", { className: "w-full lg:w-1/3 flex flex-col min-h-0 flex-grow" },
            createElement(Controls, {
              initialItems: items,
              onItemsChange: handleItemsChange,
              onShuffle: handleShuffle,
              presets: presets,
              setPresets: setPresets,
              selectedPresetId: selectedPresetId,
              setSelectedPresetId: setSelectedPresetId,
              expandedHeight: "85dvh",
              collapsedVisibleHeight: collapsedVisibleHeight,
            })
          )
        ),
        createElement(ResultModal, { winner: winner, onClose: handleCloseModal, onDeleteWinner: handleDeleteWinner }),
        createElement(ScreenPickerModal, { show: showScreenPicker, screens: screens, onSelect: enterFullscreenOnScreen, onClose: () => setShowScreenPicker(false) })
      ),
      createElement("div", { className: "fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3" },
        createElement("button", { onClick: toggleFullscreen, className: "bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors", "aria-label": isFullscreen ? "전체 화면 종료" : "전체 화면 시작" },
          isFullscreen ?
            createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
              createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 9L4 4m0 0v4m0-4h4M15 9l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4M15 15l5 5m0 0v-4m0 4h-4" })
            ) :
            createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
              createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4M20 4l-5 5M4 16v4m0 0h4M4 20l5-5M20 16v4m0 0h-4M20 20l-5-5" })
            )
        ),
        !isFullscreen && 'getScreenDetails' in window &&
        createElement("button", { onClick: handleSelectScreen, className: "bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors", "aria-label": "모니터 선택하여 전체 화면" },
          createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
            createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" })
          )
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
  root.render(
    createElement(StrictMode, null,
      createElement(App)
    )
  );

})();