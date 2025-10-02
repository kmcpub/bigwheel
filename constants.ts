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
];