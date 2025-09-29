import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PRESET_ITEMS } from '../constants';

interface ControlsProps {
  initialItems: string[];
  onItemsChange: (items: string[]) => void;
  onShuffle: () => void;
}

const Controls: React.FC<ControlsProps> = ({ initialItems, onItemsChange, onShuffle }) => {
  const [text, setText] = useState(initialItems.join('\n'));
  const isComposingRef = useRef(false); // IME 조합 중인지 여부를 추적

  useEffect(() => {
    // 이 효과는 부모의 상태가 외부 소스(예: 셔플, 프리셋)에 의해 변경될 때 textarea를 동기화합니다.
    // 사용자의 입력을 덮어쓰는 것을 방지하기 위해, 현재 텍스트에서 파생된 항목과 들어오는 항목을 비교합니다.
    const itemsFromCurrentText = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    
    // 간단한 배열 비교. 동일하지 않은 경우에만 외부 변경이 발생한 것으로 간주합니다.
    if (itemsFromCurrentText.length !== initialItems.length || 
        itemsFromCurrentText.some((item, index) => item !== initialItems[index])) {
      setText(initialItems.join('\n'));
    }
  }, [initialItems]);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText); // 입력 필드의 반응성을 위해 항상 내부 상태를 업데이트합니다.

    // IME 입력 중이 아닐 때만 부모 컴포넌트로 변경 사항을 실시간 전파합니다.
    if (!isComposingRef.current) {
      const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      onItemsChange(newItems);
    }
  }, [onItemsChange]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    // IME 입력이 최종 완료되었으므로, 확정된 텍스트로 부모 컴포넌트 상태를 업데이트합니다.
    const newText = (event.target as HTMLTextAreaElement).value;
    const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    onItemsChange(newItems);
  }, [onItemsChange]);


  const handlePreset = useCallback((preset: keyof typeof PRESET_ITEMS) => {
    const newItems = PRESET_ITEMS[preset];
    setText(newItems.join('\n'));
    onItemsChange(newItems);
  }, [onItemsChange]);

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-2xl h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">돌림판 설정</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-gray-300">미리 설정된 목록</h3>
        <div className="flex flex-wrap gap-2">
            <button onClick={() => handlePreset('participants')} className="bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors">참가자</button>
            <button onClick={() => handlePreset('numbers')} className="bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors">숫자</button>
            <button onClick={() => handlePreset('choices')} className="bg-violet-500 hover:bg-violet-600 text-sm text-white font-semibold py-1 px-3 rounded-full transition-colors">선택</button>
        </div>
      </div>

      <div className="flex-grow flex flex-col">
        <label htmlFor="items" className="block font-semibold mb-2 text-gray-300">
          항목 (한 줄에 하나씩)
        </label>
        <textarea
          id="items"
          value={text}
          onChange={handleTextChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          className="w-full flex-grow bg-slate-700 text-gray-200 p-3 rounded-md border-2 border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-0 transition-colors"
          placeholder="항목 1&#10;항목 2&#10;항목 3"
        />
        <p className="text-sm text-gray-500 mt-1">
          {initialItems.length} 개 항목
        </p>
      </div>

      <div className="mt-4 pt-4 flex flex-col gap-3">
        <div className="flex gap-3">
            <button
              onClick={onShuffle}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-300"
            >
              순서 섞기
            </button>
            <button
              onClick={() => {
                setText('');
                onItemsChange([]);
              }}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              전체 삭제
            </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;