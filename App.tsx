import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Wheel from './components/Wheel';
import Controls from './components/Controls';
import ResultModal from './components/ResultModal';
import ScreenPickerModal from './components/ScreenPickerModal';
import { DEFAULT_PRESETS, Preset } from './constants';

// --- 인라인 편집 가능한 텍스트 컴포넌트 ---
interface EditableTextProps {
  initialValue: string;
  onSave: (newValue: string) => void;
  className: string;
  as: 'h1' | 'p';
  ariaLabel: string;
}

const EditableText: React.FC<EditableTextProps> = ({ initialValue, onSave, className, as: Component, ariaLabel }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setValue(initialValue); // 비어 있으면 원래 값으로 되돌립니다.
    } else if (trimmedValue !== initialValue) {
      onSave(trimmedValue);
    }
    setIsEditing(false);
  }, [value, initialValue, onSave]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
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
    return (
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className={`${className} bg-transparent border-b-2 border-cyan-400 outline-none w-full text-center`}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <Component
      className={`${className} cursor-pointer hover:bg-slate-700/50 rounded-md px-2 transition-colors`}
      onClick={handleClick}
      title="클릭하여 수정"
    >
      {value || initialValue}
    </Component>
  );
};


const App: React.FC = () => {
  const [title, setTitle] = useState<string>(() => localStorage.getItem('spinningWheelTitle') || '돌려돌려~ 돌림판!');
  const [subtitle, setSubtitle] = useState<string>(() => localStorage.getItem('spinningWheelSubtitle') || 'Made by KMC');
  
  const [presets, setPresets] = useState<Preset[]>(() => {
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
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // 로컬 스토리지에서 아이템을 불러오거나 기본값으로 초기화합니다.
  const [items, setItems] = useState<string[]>(() => {
    try {
      const savedItems = localStorage.getItem('spinningWheelItems');
      if (savedItems) {
        const parsedItems = JSON.parse(savedItems);
        // 저장된 아이템이 유효한 배열인지 확인합니다.
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          return parsedItems;
        }
      }
    } catch (error) {
      console.error("저장된 아이템을 불러오는 데 실패했습니다:", error);
    }
    // 저장된 아이템이 없으면 기본 참가자 목록을 사용합니다.
    return DEFAULT_PRESETS[0].items;
  });
  
  const [winner, setWinner] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [screens, setScreens] = useState<any[]>([]);
  const [showScreenPicker, setShowScreenPicker] = useState(false);
  const wheelContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedVisibleHeight, setCollapsedVisibleHeight] = useState(128);
  const [isMuted, setIsMuted] = useState(true);
  const [isBoosterMode, setIsBoosterMode] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmBufferRef = useRef<AudioBuffer | null>(null);
  const bgmSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const isGeneratingBgmRef = useRef(false);

  // BGM 생성 함수
  const createBgm = useCallback(async (audioContext: AudioContext): Promise<AudioBuffer> => {
      const tempo = 140;
      const beatDuration = 60 / tempo;
      const noteDuration16th = beatDuration / 4;
      const totalBars = 16;
      const totalDuration = totalBars * 4 * beatDuration;

      const offlineCtx = new OfflineAudioContext(2, Math.ceil(audioContext.sampleRate * totalDuration), audioContext.sampleRate);

      const playNote = (oscType: OscillatorType, freq: number | null, time: number, duration: number, volume: number, adsr: { attack: number, decay: number, sustain: number }) => {
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
      
      const playDrum = (type: 'kick' | 'snare', time: number) => {
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
        } else { // snare
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

      const n = {
          C3: 130.81, F3: 174.61, G3: 196.00,
          G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99
      };
      const melody = [ n.C5, n.E5, n.G4, n.E5, null, n.C5, null, n.E5, n.G5, n.F5, n.E5, n.D5, n.C5, null, null, null, n.D5, n.F5, n.A4, n.F5, null, n.D5, null, n.F5, n.A4, n.G4, n.F5, n.E5, n.D5, null, null, null];
      const bassline = [n.C3, null, n.C3, null, n.C3, null, null, null, n.F3, null, n.F3, null, n.F3, null, null, null, n.G3, null, n.G3, null, n.G3, null, null, null, n.C3, null, n.C3, null, n.G3, null, null, null,];

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

  // BGM 재생/정지 효과
  useEffect(() => {
    const playBgm = async () => {
        if (!audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  // 전체 화면 상태 변경을 감지하는 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 제목 및 부제 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('spinningWheelTitle', title);
  }, [title]);

  useEffect(() => {
    localStorage.setItem('spinningWheelSubtitle', subtitle);
  }, [subtitle]);


  // 아이템 목록이 변경될 때마다 로컬 스토리지에 저장합니다.
  useEffect(() => {
    try {
      localStorage.setItem('spinningWheelItems', JSON.stringify(items));
    } catch (error) {
      console.error("아이템을 저장하는 데 실패했습니다:", error);
    }
  }, [items]);
  
  // 프리셋 목록이 변경될 때마다 로컬 스토리지에 저장합니다.
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
        return []; // 텍스트가 없거나 가중치가 0 이하인 경우 무시
      }
      return [trimmedItemStr];
    });

    if (expandedItems.length === 0) {
        return [];
    }
    
    // 복제 로직은 그대로 유지하여 최소 16개 항목을 보장합니다.
    // 이는 시각적 안정성과 부드러운 회전 경험을 위함입니다.
    if (expandedItems.length > 0 && expandedItems.length < 16) {
        const multiplier = Math.ceil(16 / expandedItems.length);
        return Array.from({ length: multiplier }, () => expandedItems).flat();
    }
    return expandedItems;
  }, [items]);


  const handleItemsChange = useCallback((newItems: string[]) => {
    setItems(newItems);
  }, []);
  
  const handleShuffle = useCallback(() => {
    setItems(prevItems => [...prevItems].sort(() => Math.random() - 0.5));
  }, []);

  const handleSpinEnd = useCallback((selectedItem: string) => {
    setWinner(selectedItem);
  }, []);

  const handleCloseModal = useCallback(() => {
    setWinner(null);
  }, []);

  const handleDeleteWinner = useCallback((winnerToDelete: string) => {
    setItems(prevItems => {
      // 첫 번째로 일치하는 항목(또는 가중치 항목)의 인덱스를 찾습니다.
      const index = prevItems.findIndex(itemStr => {
        const trimmedItemStr = itemStr.trim();
        if (!trimmedItemStr) return false;
        
        const match = trimmedItemStr.match(/^(.*)\*(\d+)$/);
        const itemName = match ? match[1].trim() : trimmedItemStr;
        return itemName === winnerToDelete;
      });

      if (index === -1) return prevItems; // 일치하는 항목이 없음

      const newItems = [...prevItems];
      const targetItemStr = newItems[index].trim();
      const match = targetItemStr.match(/^(.*)\*(\d+)$/);

      if (match) {
        // 가중치가 있는 항목인 경우, 가중치를 감소시키거나 1이면 제거합니다.
        const text = match[1].trim();
        const weight = parseInt(match[2], 10);
        if (weight > 1) {
          newItems[index] = `${text}*${weight - 1}`;
        } else {
          newItems.splice(index, 1);
        }
      } else {
        // 일반 항목인 경우 제거합니다.
        newItems.splice(index, 1);
      }
      return newItems;
    });
    setWinner(null); // 모달도 닫습니다.
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
        const screenDetails = await (window as any).getScreenDetails();
        setScreens(screenDetails.screens);
        setShowScreenPicker(true);
    } catch (err) {
        console.error("Error getting screen details:", err);
        alert(`화면 정보를 가져올 수 없습니다: ${(err as Error).message}`);
    }
  };

  const enterFullscreenOnScreen = (screen: any) => {
      // FIX: Cast FullscreenOptions to `any` to allow using the experimental `screen` property for multi-screen support.
      document.documentElement.requestFullscreen({ screen } as any).catch(err => {
          alert(`선택한 화면에서 전체 화면 모드를 시작할 수 없습니다: ${err.message}`);
      });
      setShowScreenPicker(false);
  };


  return (
    <>
      <div className="h-dvh text-gray-100 flex flex-col items-center p-4 font-sans overflow-hidden">
        <header className="w-full max-w-7xl text-center mb-4 flex-shrink-0">
          <EditableText
            initialValue={title}
            onSave={setTitle}
            as="h1"
            className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider"
            ariaLabel="타이틀 수정"
          />
          <EditableText
            initialValue={subtitle}
            onSave={setSubtitle}
            as="p"
            className="text-gray-400 mt-2"
            ariaLabel="부제 수정"
          />
        </header>

        <main className="w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8 items-stretch min-h-0">
          <div ref={wheelContainerRef} className="w-full lg:w-2/3 flex items-center justify-center">
            <Wheel items={wheelItems} onSpinEnd={handleSpinEnd} isBoosterMode={isBoosterMode} />
          </div>
          <div className="w-full lg:w-1/3 flex flex-col min-h-0 flex-grow">
            <Controls
              initialItems={items}
              onItemsChange={handleItemsChange}
              onShuffle={handleShuffle}
              presets={presets}
              setPresets={setPresets}
              selectedPresetId={selectedPresetId}
              setSelectedPresetId={setSelectedPresetId}
              expandedHeight="85dvh"
              collapsedVisibleHeight={collapsedVisibleHeight}
              isBoosterMode={isBoosterMode}
              onBoosterModeChange={setIsBoosterMode}
            />
          </div>
        </main>

        <ResultModal winner={winner} onClose={handleCloseModal} onDeleteWinner={handleDeleteWinner} />
        <ScreenPickerModal 
            show={showScreenPicker} 
            screens={screens} 
            onSelect={enterFullscreenOnScreen} 
            onClose={() => setShowScreenPicker(false)} 
        />
      </div>

      <div className="fixed bottom-4 right-4 z-30 flex flex-col items-end gap-3">
        <button
          onClick={toggleMute}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label={isMuted ? "BGM 켜기" : "BGM 끄기"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .89-1.077 1.337-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-6 6M13 9l6 6" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .89-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
          aria-label={isFullscreen ? "전체 화면 종료" : "전체 화면 시작"}
        >
          {isFullscreen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4 4m0 0v4m0-4h4M15 9l5-5m0 0v4m0-4h-4M9 15l-5 5m0 0v-4m0 4h4M15 15l5 5m0 0v-4m0 4h-4" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5M20 8V4m0 0h-4M20 4l-5 5M4 16v4m0 0h4M4 20l5-5M20 16v4m0 0h-4M20 20l-5-5" />
            </svg>
          )}
        </button>

        {!isFullscreen && 'getScreenDetails' in window && (
          <button
              onClick={handleSelectScreen}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
              aria-label="모니터 선택하여 전체 화면"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
          </button>
        )}
      </div>
    </>
  );
};

export default App;