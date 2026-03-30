export const CURRICULUM_STEPS = [
  { id: 1, label: '1단계 - 브랜드 & 메뉴 이해', short: '브랜드·메뉴' },
  { id: 2, label: '2단계 - 주방 공간 적응 & 동선', short: '주방 동선' },
  { id: 3, label: '3단계 - 주방기물 세팅', short: '기물 세팅' },
  { id: 4, label: '4단계 - 조리 실습', short: '조리 실습' },
  { id: 5, label: '5단계 - 음식 세팅', short: '음식 세팅' },
  { id: 6, label: '6단계 - 홀 & 고객 응대', short: '홀·응대' },
  { id: 7, label: '7단계 - 포스 & 정산', short: '포스·정산' },
  { id: 8, label: '8단계 - 최종 테스트', short: '최종 테스트' },
];

export type Branch = {
  id: string;
  name: string;
  owner_name: string;
  phone: string;
  start_date: string;
  last_step: number;
  created_at?: string;
};

export type Record = {
  id: string;
  branch_id: string;
  step: number;
  passed: boolean;
  score: number | null;
  owner_comment: string;
  sv_comment: string;
  created_at: string;
};

export type FinalComment = {
  id: string;
  branch_id: string;
  sv_comment: string;
  owner_comment: string;
  created_at: string;
};
