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
    { 
      id: 'bonihani', 
      name: '보니하니', 
      items: [
        '어린이용 스마트워치',
        '어린이백과사전*2',
        '인형집 세트',
        '문학동화전집*3',
        '학용품 세트',
        '3D 입체블럭교구',
        '어린이 스킨케어 세트',
        '캠핑숙박권',
        '어린이 멀티비타민세트',
        '영어전집세트*3',
        '어린이 킥보드',
        '스케이트보드',
        '창작동화전집*3',
        '놀이공원 이용권',
        '스마트 코딩로봇',
        '자석블록세트'
      ] 
    },
    { 
      id: 'people', 
      name: '인물', 
      items: [
        '영수*3',
        '영호*2',
        '영식',
        '영철',
        '광수',
        '상철',
        '순자',
        '영자',
        '정숙',
        '영숙',
        '옥순',
        '현숙'
      ] 
    },
    { id: 'rps', name: '가위바위보', items: ['가위', '바위', '보'] },
    { id: 'pros-cons', name: '찬반', items: ['찬성', '반대'] },
    { 
      id: 'goods', 
      name: '상품', 
      items: [
        '소원 성취권',
        '랜덤 과자',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '급식 우선권',
        '발표 우선권',
        '더 큰 과자',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '짝꿍 초대권',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '더 큰 과자',
        '랜덤 과자',
        '발표 우선권',
        '일일 DJ권',
        '발표 우선권',
        '랜덤 과자',
        '더 큰 과자',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '일인일역 우선권',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '더 큰 과자',
        '랜덤 과자',
        '발표 우선권',
        '급식 우선권',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '더 큰 과자',
        '발표 우선권',
        '자리 선택권',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
        '더 큰 과자',
        '랜덤 과자',
        '발표 우선권',
        '일일 DJ권',
        '발표 우선권',
        '랜덤 과자',
        '더 큰 과자',
        '발표 우선권',
        '랜덤 과자',
        '발표 우선권',
      ]
    },
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
        
        // 당첨 시 진동 효과
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100, 50, 300]); // 짧은 진동 두 번, 긴 진동 한 번
        }
        
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


  const Controls = ({ initialItems, onItemsChange, onShuffle, presets, setPresets, selectedPresetId, setSelectedPresetId, expandedHeight, collapsedVisibleHeight, isBoosterMode, onBoosterModeChange }) => {
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
        createElement("div", { className: "mt-4 pt-4 border-t border-slate-700 flex flex-col gap-4" },
            createElement("div", { className: "flex justify-between items-center" },
                createElement("label", { htmlFor: "booster-mode", className: "font-semibold text-gray-300 cursor-pointer" },
                    "부스터 모드",
                    createElement("p", { className: "text-sm text-gray-500 font-normal" }, "결과를 즉시 확인합니다.")
                ),
                createElement("button", {
                    id: "booster-mode",
                    role: "switch",
                    "aria-checked": isBoosterMode,
                    onClick: () => onBoosterModeChange(prev => !prev),
                    className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 ${isBoosterMode ? 'bg-cyan-500' : 'bg-slate-600'}`
                },
                    createElement("span", {
                        className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBoosterMode ? 'translate-x-6' : 'translate-x-1'}`
                    })
                )
            ),
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
  const Wheel = ({ items, onSpinEnd, isBoosterMode }) => {
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

    const boosterAnimState = useRef({
      startTime: 0,
      startRotation: 0,
      targetRotation: 0,
      winnerIndex: 0,
      lastRotation: 0,
    });

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
        if ('vibrate' in navigator) {
            navigator.vibrate(15);
        }
        if (!audioContextRef.current || !tickBufferRef.current) return;
        const audioContext = audioContextRef.current;
        const source = audioContext.createBufferSource();
        source.buffer = tickBufferRef.current;
        source.connect(audioContext.destination);
        source.start();
    }, []);

    const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);

    const boosterAnimate = useCallback(() => {
      const DURATION = 900;
      const { startTime, startRotation, targetRotation, winnerIndex } = boosterAnimState.current;
      
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / DURATION, 1);
      const easedProgress = easeOutQuint(progress);

      const currentRotation = startRotation + (targetRotation - startRotation) * easedProgress;
      
      rotationRef.current = currentRotation;
      setRotation(currentRotation);
      
      const POINTER_STIFFNESS = 0.3;
      const POINTER_DAMPING = 0.85;
      const restoringForce = -pointerRotationRef.current * POINTER_STIFFNESS;
      pointerVelocityRef.current += restoringForce;
      pointerVelocityRef.current *= POINTER_DAMPING;
      pointerRotationRef.current += pointerVelocityRef.current;
      setPointerRotation(pointerRotationRef.current);

      const segmentAngle = 360 / (items.length || 1);
      const pointerOffset = 180.0;
      const lastSegIdx = Math.floor((boosterAnimState.current.lastRotation - pointerOffset) / segmentAngle);
      const currentSegIdx = Math.floor((currentRotation - pointerOffset) / segmentAngle);

      if (currentSegIdx !== lastSegIdx) {
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
          if (items[winnerIndex]) {
              onSpinEnd(items[winnerIndex]);
          }
      }
    }, [items, onSpinEnd, playTickSound]);

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

    const startSpin = useCallback((initialVelocity) => {
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
            } catch(e) {
                console.error('오디오 틱 버퍼를 생성하는 데 실패했습니다:', e);
            }
        }
        
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

      const groupedItems = [];
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
        const pathData = [`M ${center},${center}`, `L ${start[0]},${start[1]}`, `A ${radius},${radius} 0 ${largeArcFlag} 1 ${end[0]},${end[1]}`, 'Z'].join(' ');
        
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

        return createElement("g", { key: group.startIndex },
          createElement("path", { d: pathData, fill: colorMap.get(group.item) || '#374151', stroke: "#1f2937", strokeWidth: "2" }),
          createElement("text", {
            x: textX, y: textY,
            transform: `rotate(${textRotation}, ${textX}, ${textY})`,
            fill: "#111827", fontSize: fontSize, fontWeight: "bold",
            textAnchor: textAnchor, 
            alignmentBaseline: "middle", 
            className: "select-none"
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
        onPointerDown: (e) => e.stopPropagation(),
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
    const [subtitle, setSubtitle] = useState(() => localStorage.getItem('spinningWheelSubtitle') || 'Made by KMC');

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
    const [isMuted, setIsMuted] = useState(true);
    const [isBoosterMode, setIsBoosterMode] = useState(false);
    const audioContextRef = useRef(null);
    const bgmBufferRef = useRef(null);
    const bgmSourceRef = useRef(null);
    const isGeneratingBgmRef = useRef(false);

    const createBgm = useCallback(async (audioContext) => {
        const tempo = 140;
        const beatDuration = 60 / tempo;
        const noteDuration16th = beatDuration / 4;
        const totalBars = 16;
        const totalDuration = totalBars * 4 * beatDuration;
        const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioContext.sampleRate * totalDuration), audioContext.sampleRate);

        const playNote = (oscType, freq, time, duration, volume, adsr) => {
            if (freq === null) return;
            const osc = offlineCtx.createOscillator();
            osc.type = oscType;
            const gain = offlineCtx.createGain();
            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.frequency.setValueAtTime(freq, time);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(volume * adsr.sustain, time + adsr.attack);
            gain.gain.exponentialRampToValueAtTime(volume, time + adsr.attack + adsr.decay);
            gain.gain.linearRampToValueAtTime(0, time + duration);
            osc.start(time);
            osc.stop(time + duration);
        };
        const playDrum = (type, time) => {
            if (type === 'kick') {
                const osc = offlineCtx.createOscillator();
                const gain = offlineCtx.createGain();
                osc.connect(gain);
                gain.connect(offlineCtx.destination);
                osc.frequency.setValueAtTime(150, time);
                osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
                gain.gain.setValueAtTime(0.5, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
                osc.start(time);
                osc.stop(time + 0.1);
            } else {
                const noise = offlineCtx.createBufferSource();
                const bufferSize = offlineCtx.sampleRate * 0.1;
                const buffer = offlineCtx.createBuffer(1, bufferSize, offlineCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const filter = offlineCtx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.value = 1500;
                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(0.4, time);
                gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
                noise.connect(filter).connect(gain).connect(offlineCtx.destination);
                noise.start(time);
                noise.stop(time + 0.08);
            }
        };
        const n = { C3: 130.81, F3: 174.61, G3: 196.00, G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
        const melody = [n.C5, n.E5, n.G4, n.E5, null, n.C5, null, n.E5, n.G5, n.F5, n.E5, n.D5, n.C5, null, null, null, n.D5, n.F5, n.A4, n.F5, null, n.D5, null, n.F5, n.A4, n.G4, n.F5, n.E5, n.D5, null, null, null];
        const bassline = [n.C3, null, n.C3, null, n.C3, null, null, null, n.F3, null, n.F3, null, n.F3, null, null, null, n.G3, null, n.G3, null, n.G3, null, null, null, n.C3, null, n.C3, null, n.G3, null, null, null];
        for (let bar = 0; bar < totalBars; bar++) {
            for (let beat = 0; beat < 4; beat++) {
                const time = (bar * 4 + beat) * beatDuration;
                playDrum('kick', time);
                if (beat % 2 === 1) playDrum('snare', time);
                for (let i = 0; i < 4; i++) {
                    const step = beat * 4 + i;
                    const noteTime = time + i * noteDuration16th;
                    const patternIndex = (bar * 16 + step) % 32;
                    playNote('square', melody[patternIndex], noteTime, noteDuration16th * 0.9, 0.05, { attack: 0.01, decay: 0.02, sustain: 0.8 });
                    playNote('triangle', bassline[patternIndex], noteTime, noteDuration16th, 0.125, { attack: 0.01, decay: 0.1, sustain: 0.5 });
                }
            }
        }
        return await offlineCtx.startRendering();
    }, []);

    useEffect(() => {
        const playBgm = async () => {
            if (!audioContextRef.current) {
                try {
                    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
                } catch (e) {
                    console.error("Web Audio API가 이 브라우저에서 지원되지 않습니다."); return;
                }
            }
            const audioContext = audioContextRef.current;
            if (audioContext.state === 'suspended') await audioContext.resume();
            if (!bgmBufferRef.current && !isGeneratingBgmRef.current) {
                isGeneratingBgmRef.current = true;
                try {
                    bgmBufferRef.current = await createBgm(audioContext);
                } catch (e) { console.error("BGM 생성 실패", e); } 
                finally { isGeneratingBgmRef.current = false; }
            }
            if (bgmBufferRef.current && bgmSourceRef.current === null) {
                const source = audioContext.createBufferSource();
                source.buffer = bgmBufferRef.current;
                source.loop = true;
                source.connect(audioContext.destination);
                source.start(0);
                bgmSourceRef.current = source;
            }
        };
        const stopBgm = () => {
            if (bgmSourceRef.current) {
                bgmSourceRef.current.stop();
                bgmSourceRef.current.disconnect();
                bgmSourceRef.current = null;
            }
        };
        if (!isMuted) playBgm();
        else stopBgm();
        return () => { stopBgm(); };
    }, [isMuted, createBgm]);

    const toggleMute = () => setIsMuted(m => !m);
    
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
      if (items.length === 0) {
        return [];
      }
      const expandedItems = items.flatMap(itemStr => {
        const trimmedItemStr = itemStr.trim();
        if (!trimmedItemStr) return [];
        const match = trimmedItemStr.match(/^(.*)\*(\d+)$/);
        if (match) {
          const text = match[1].trim();
          const weight = parseInt(match[2], 10);
          if (text && weight > 0) {
            return Array(weight).fill(text);
          }
          return [];
        }
        return [trimmedItemStr];
      });
      if (expandedItems.length === 0) {
        return [];
      }
      if (expandedItems.length > 0 && expandedItems.length < 16) {
        const multiplier = Math.ceil(16 / expandedItems.length);
        return Array.from({ length: multiplier }, () => expandedItems).flat();
      }
      return expandedItems;
    }, [items]);

    const handleItemsChange = useCallback((newItems) => { setItems(newItems); }, []);
    const handleShuffle = useCallback(() => { setItems(prevItems => [...prevItems].sort(() => Math.random() - 0.5)); }, []);
    const handleSpinEnd = useCallback((selectedItem) => { setWinner(selectedItem); }, []);
    const handleCloseModal = useCallback(() => { setWinner(null); }, []);

    const handleDeleteWinner = useCallback((winnerToDelete) => {
      setItems(prevItems => prevItems.filter(itemStr => {
        const trimmedItemStr = itemStr.trim();
        if (!trimmedItemStr) return false;
        const match = trimmedItemStr.match(/^(.*)\*(\d+)$/);
        const text = match ? match[1].trim() : trimmedItemStr;
        if (!text) return false;
        return text !== winnerToDelete;
      }));
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
            createElement(Wheel, { items: wheelItems, onSpinEnd: handleSpinEnd, isBoosterMode: isBoosterMode })
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
              isBoosterMode: isBoosterMode,
              onBoosterModeChange: setIsBoosterMode,
            })
          )
        ),
        createElement(ResultModal, { winner: winner, onClose: handleCloseModal, onDeleteWinner: handleDeleteWinner }),
        createElement(ScreenPickerModal, { show: showScreenPicker, screens: screens, onSelect: enterFullscreenOnScreen, onClose: () => setShowScreenPicker(false) })
      ),
      createElement("div", { className: "fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3" },
        createElement("button", {
            onClick: toggleMute,
            className: "bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors",
            "aria-label": isMuted ? "BGM 켜기" : "BGM 끄기"
        },
            isMuted ?
                createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                    createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .89-1.077 1.337-1.707.707L5.586 15z" }),
                    createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 9l-6 6M13 9l6 6" })
                ) :
                createElement("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2 },
                    createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .89-1.077 1.337-1.707.707L5.586 15z" })
                )
        ),
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