import React from 'react';

interface ScreenDetail {
  label: string;
  width: number;
  height: number;
  isPrimary: boolean;
  // Add other properties as needed from the ScreenDetailed interface
}

interface ScreenPickerModalProps {
  show: boolean;
  screens: ScreenDetail[];
  onSelect: (screen: ScreenDetail) => void;
  onClose: () => void;
}

const ScreenPickerModal: React.FC<ScreenPickerModalProps> = ({ show, screens, onSelect, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">전체 화면으로 표시할 모니터 선택</h2>
        <p className="text-gray-400 mb-6">사용 가능한 디스플레이 목록입니다. 하나를 선택하여 전체 화면으로 전환하세요.</p>
        <div className="flex flex-col gap-3">
          {screens.map((screen, index) => (
            <button
              key={screen.label || index}
              onClick={() => onSelect(screen)}
              className="w-full text-left p-4 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <div className="font-bold text-lg text-gray-100">
                모니터 {index + 1} {screen.isPrimary && <span className="text-xs font-normal bg-cyan-500 text-slate-900 px-2 py-0.5 rounded-full ml-2">기본</span>}
              </div>
              <div className="text-sm text-gray-400">
                해상도: {screen.width} x {screen.height}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScreenPickerModal;
