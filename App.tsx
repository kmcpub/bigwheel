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

  return (
    <div className="h-screen text-gray-100 flex flex-col items-center p-4 font-sans overflow-hidden">
      <header className="w-full max-w-7xl text-center mb-4 flex-shrink-0">
        <h1 className="text-4xl md:text-5xl font-bold text-cyan-400 tracking-wider">
          돌려돌려~ 돌림판!
        </h1>
        <p className="text-gray-400 mt-2">햇반 뽑기 시스템</p>
      </header>

      <main className="w-full max-w-7xl flex-grow flex flex-col lg:flex-row gap-8 items-stretch">
        <div className="w-full lg:w-2/3 flex items-center justify-center">
          <Wheel items={items} onSpinEnd={handleSpinEnd} />
        </div>
        <div className="w-full lg:w-1/3 flex flex-col">
          <Controls initialItems={items} onItemsChange={handleItemsChange} onShuffle={handleShuffle} />
        </div>
      </main>

      <ResultModal winner={winner} onClose={handleCloseModal} />
    </div>
  );
};

export default App;