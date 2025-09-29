import React, { useState, useCallback, useEffect } from 'react';
import Wheel from './components/Wheel';
import Controls from './components/Controls';
import ResultModal from './components/ResultModal';
import { PRESET_ITEMS } from './constants';

const App: React.FC = () => {
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
    return PRESET_ITEMS.participants;
  });
  
  const [winner, setWinner] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 전체 화면 상태 변경을 감지하는 이벤트 리스너
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  // 아이템 목록이 변경될 때마다 로컬 스토리지에 저장합니다.
  useEffect(() => {
    try {
      localStorage.setItem('spinningWheelItems', JSON.stringify(items));
    } catch (error) {
      console.error("아이템을 저장하는 데 실패했습니다:", error);
    }
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

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        alert(`전체 화면 모드를 시작할 수 없습니다: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  return (
    <>
      <div className="h-screen text-gray-100 flex flex-col items-center p-4 font-sans overflow-hidden">
        <header className="w-full max-w-7xl text-center mb-4 flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
            돌려돌려~ 돌림판!
          </h1>
          <p className="text-gray-400 mt-2">햇반 뽑기 시스템</p>
        </header>

        <main className="w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8 items-stretch min-h-0">
          <div className="w-full lg:w-2/3 flex items-center justify-center">
            <Wheel items={items} onSpinEnd={handleSpinEnd} />
          </div>
          <div className="w-full lg:w-1/3 flex flex-col min-h-0">
            <Controls initialItems={items} onItemsChange={handleItemsChange} onShuffle={handleShuffle} />
          </div>
        </main>

        <ResultModal winner={winner} onClose={handleCloseModal} />
      </div>

      <button
        onClick={toggleFullscreen}
        className="fixed bottom-4 right-4 z-30 bg-slate-700 hover:bg-slate-600 text-white font-bold w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors"
        aria-label={isFullscreen ? "전체 화면 종료" : "전체 화면 시작"}
      >
        {isFullscreen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 1v4m0 0h-4m4 0l-5-5" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m7-5h4m0 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m7 5h4m0 0v4m0-4l-5-5" />
          </svg>
        )}
      </button>
    </>
  );
};

export default App;