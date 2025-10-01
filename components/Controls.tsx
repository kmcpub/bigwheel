import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Preset } from '../constants';

interface ControlsProps {
  initialItems: string[];
  onItemsChange: (items: string[]) => void;
  onShuffle: () => void;
  presets: Preset[];
  setPresets: React.Dispatch<React.SetStateAction<Preset[]>>;
  selectedPresetId: string | null;
  setSelectedPresetId: (id: string | null) => void;
}

interface EditablePresetButtonProps {
    preset: Preset;
    isSelected: boolean;
    onSelect: () => void;
    onNameChange: (newName: string) => void;
}

const EditablePresetButton: React.FC<EditablePresetButtonProps> = ({ preset, isSelected, onSelect, onNameChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(preset.name);
    const inputRef = useRef<HTMLInputElement>(null);

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
            setValue(preset.name); // Revert on empty or no change
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
            <div className={`${baseClasses} ${selectedClasses} inline-flex items-center justify-center`}>
                 <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent outline-none text-center p-0 m-0 w-24"
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        )
    }

    return (
        <button
            onClick={handleClick}
            className={`${baseClasses} ${selectedClasses}`}
            title={isSelected ? "이름을 수정하려면 다시 클릭하세요" : preset.name}
        >
          {preset.name}
        </button>
    );
};


const Controls: React.FC<ControlsProps> = ({ initialItems, onItemsChange, onShuffle, presets, setPresets, selectedPresetId, setSelectedPresetId }) => {
  const [text, setText] = useState(initialItems.join('\n'));
  const isComposingRef = useRef(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    const itemsFromCurrentText = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    if (JSON.stringify(itemsFromCurrentText) !== JSON.stringify(initialItems)) {
        setText(initialItems.join('\n'));
    }
  }, [initialItems]);
  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsExpanded(false); // Close sheet on resize to desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value;
    setText(newText);
    setSelectedPresetId(null);

    // When using IME, `onChange` fires on every character.
    // We wait for `onCompositionEnd` to finalize the items.
    if (!isComposingRef.current) {
      const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
      onItemsChange(newItems);
    }
  }, [onItemsChange, setSelectedPresetId]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback((event: React.CompositionEvent<HTMLTextAreaElement>) => {
    isComposingRef.current = false;
    const newText = (event.target as HTMLTextAreaElement).value;
    const newItems = newText.split('\n').map(item => item.trim()).filter(item => item.length > 0);
    onItemsChange(newItems);
    setSelectedPresetId(null); // Deselect preset on manual edit
  }, [onItemsChange, setSelectedPresetId]);

  const handleAddPreset = () => {
    if (initialItems.length === 0) return;
    const newPreset: Preset = {
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
  
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    dragStartY.current = e.clientY;
    // Capture the pointer to handle movements outside the element
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const deltaY = e.clientY - dragStartY.current;

    // A significant drag toggles state, a small drag/tap also toggles
    if (Math.abs(deltaY) > 50) { // Threshold for swipe
      setIsExpanded(deltaY < 0); // Swipe up expands
    } else { // Tap or small drag
      setIsExpanded(prev => !prev);
    }
    (e.target as HTMLDivElement).releasePointerCapture(e.pointerId);
  };
  
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      // Prevent text selection/page scroll while dragging
      if (isDragging.current) {
          e.preventDefault();
      }
  };
  
  const handleTextareaFocus = () => {
    // Expand the sheet when textarea is focused on mobile
    if (window.innerWidth < 1024) {
      setIsExpanded(true);
    }
  };

  const controlsContent = (
    <div className="px-6 pb-6 lg:p-0 h-full flex flex-col overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">돌림판 설정</h2>
      <div className="mb-4">
        <h3 className="font-semibold mb-2 text-gray-300">미리 설정된 목록</h3>
        <div className="flex items-center justify-between gap-4 mt-2">
            <div className="flex flex-wrap gap-2 flex-grow">
              {presets.map(preset => (
                <EditablePresetButton
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetId === preset.id}
                  onSelect={() => {
                    onItemsChange(preset.items);
                    setSelectedPresetId(preset.id);
                  }}
                  onNameChange={(newName) => {
                    setPresets(currentPresets =>
                      currentPresets.map(p =>
                        p.id === preset.id ? { ...p, name: newName } : p
                      )
                    );
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <button
                    onClick={handleAddPreset}
                    disabled={initialItems.length === 0}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-cyan-400 hover:bg-slate-700 hover:text-cyan-300 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                    aria-label="현재 항목으로 목록 추가"
                    title="현재 항목으로 목록 추가"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                </button>
                <button
                    onClick={handleDeletePreset}
                    disabled={!selectedPresetId}
                    className="flex items-center justify-center w-8 h-8 rounded-full text-red-500 hover:bg-slate-700 hover:text-red-400 transition-colors disabled:text-gray-500 disabled:cursor-not-allowed"
                    aria-label="선택 목록 삭제"
                    title="선택 목록 삭제"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
      </div>
      <div className="flex-grow flex flex-col">
        <label htmlFor="items" className="block font-semibold mb-2 text-gray-300">항목 (한 줄에 하나씩)</label>
        <textarea
          id="items"
          value={text}
          onChange={handleTextChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onFocus={handleTextareaFocus}
          className="w-full flex-grow bg-slate-700 text-gray-200 p-3 rounded-md border-2 border-slate-600 focus:border-cyan-500 focus:outline-none focus:ring-0 transition-colors"
          placeholder="항목 1&#x0a;항목 2&#x0a;항목 3"
          rows={5}
        />
        <p className="text-sm text-gray-500 mt-1">{initialItems.length} 개 항목</p>
      </div>

      <div className="mt-4 pt-4 flex flex-col gap-3">
        <div className="flex gap-3">
          <button onClick={onShuffle} className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-300">순서 섞기</button>
          <button
            onClick={() => {
              onItemsChange([]);
              setSelectedPresetId(null);
            }}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            전체 삭제
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Backdrop for expanded sheet on mobile */}
      {isExpanded && <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setIsExpanded(false)} />}
      
      <div className={`
        lg:h-full lg:relative lg:transform-none
        fixed inset-x-0 bottom-0 z-30
        transition-transform duration-300 ease-out
        ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-128px)]'}
      `}>
        <div 
          className="bg-slate-800 lg:p-6 rounded-t-2xl lg:rounded-lg shadow-2xl h-full flex flex-col"
          style={isExpanded ? { height: '85dvh' } : {}}
        >
          {/* Mobile handle */}
          <div
            className="w-full py-4 flex-shrink-0 flex justify-center items-center cursor-grab lg:hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
            style={{ touchAction: 'none' }}
            aria-label={isExpanded ? "설정 패널 축소" : "설정 패널 확장"}
          >
            <div className="w-10 h-1.5 bg-slate-600 rounded-full" />
          </div>
          {controlsContent}
        </div>
      </div>
    </>
  );
};

export default Controls;