// 돌림판 세그먼트에 사용될 색상 팔레트입니다.
export const WHEEL_COLORS = [
  '#f87171', // red-400
  '#fb923c', // orange-400
  '#facc15', // yellow-400
  '#a3e635', // lime-400
  '#4ade80', // green-400
  '#34d399', // emerald-400
  '#2dd4bf', // teal-400
  '#67e8f9', // cyan-300
  '#60a5fa', // blue-400
  '#818cf8', // indigo-400
  '#a78bfa', // violet-400
  '#c084fc', // purple-400
  '#f472b6', // pink-400
  '#fb7185', // rose-400
];

// 프리셋 목록의 타입 정의
export interface Preset {
  id: string;
  name: string;
  items: string[];
}

// 사용자가 쉽게 불러올 수 있는 기본으로 제공되는 미리 설정된 아이템 목록입니다.
export const DEFAULT_PRESETS: Preset[] = [
  { id: 'participants', name: '참가자', items: ['철수*3', '영희*2', '민준', '서연', '지훈', '하은', '도윤', '유진'] },
  { id: 'numbers', name: '숫자', items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
  { id: 'rps', name: '가위바위보', items: ['가위', '바위', '보'] },
  { id: 'pros-cons', name: '찬반', items: ['찬성', '반대'] },
];