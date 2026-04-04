export const CURRICULUM_STEPS = [
  {
    id: 1,
    label: '1단계 - 브랜드 & 메뉴 이해',
    short: '브랜드·메뉴',
    checklist: [
      { id: 'c1_1', label: '브랜드 히스토리 및 가치관', required: false },
      { id: 'c1_2', label: '메뉴판 전체 숙지 (메뉴명, 가격)', required: true },
      { id: 'c1_3', label: '메뉴별 주요 재료 및 특징 이해', required: false },
      { id: 'c1_4', label: '고객 추천 멘트 연습', required: false },
      { id: 'c1_5', label: '경쟁 브랜드 대비 차별점 이해', required: false },
    ],
  },
  {
    id: 2,
    label: '2단계 - 위생 및 안전',
    short: '위생·안전',
    checklist: [
      { id: 'c2_1', label: '식품위생법 기본 이해', required: false },
      { id: 'c2_2', label: '개인 위생 관리 (복장, 손 세척, 건강관리)', required: true },
      { id: 'c2_3', label: '식자재 교차오염 방지 원칙', required: false },
      { id: 'c2_4', label: '화기, 칼, 제면기 사용 시 안전수칙', required: false },
      { id: 'c2_5', label: '화상/화재 응급 대처법', required: false },
      { id: 'c2_6', label: '매장 청결 기준 및 점검 방법', required: false },
      { id: 'c2_7', label: '해충·방역 관리', required: false },
      { id: 'c2_8', label: '안전 장비 위치 및 비상 대응', required: false },
    ],
  },
  {
    id: 3,
    label: '3단계 - 주방 공간 적응 & 동선',
    short: '주방 동선',
    checklist: [
      { id: 'c3_1', label: '주방 구역별 역할 파악 (조리, 세척, 보관)', required: true },
      { id: 'c3_2', label: '효율적인 조리 동선 이해', required: false },
      { id: 'c3_3', label: '피크타임 동선 시뮬레이션', required: false },
      { id: 'c3_4', label: '안전한 이동 경로 숙지', required: false },
    ],
  },
  {
    id: 4,
    label: '4단계 - 주방기물 세팅',
    short: '기물 세팅',
    checklist: [
      { id: 'c4_1', label: '조리도구 종류 및 용도 파악', required: true },
      { id: 'c4_2', label: '조리대·서빙대 기물 배치 위치 숙지', required: false },
      { id: 'c4_3', label: '기물 세척 및 소독 방법', required: false },
      { id: 'c4_4', label: '영업 전/후 기물 점검 루틴', required: false },
    ],
    equipment: [
      { name: '제면기 + 칼국수날', usage: '매장 직접 제면' },
      { name: '슬러시아', usage: '육수 보관' },
      { name: '사리냉각기', usage: '면 식히기 (콩국수, 냉국수)' },
      { name: '냉장동', usage: '주방 메인 냉장/냉동' },
      { name: '테이블냉동·냉장고', usage: '작업대 겸용' },
      { name: '반찬냉장고', usage: '홀용 반찬 보관' },
      { name: '음료냉장고', usage: '음료 진열' },
      { name: '간택기', usage: '메인 조리 화구' },
      { name: '낮은렌지', usage: '보조 화구' },
      { name: '식기세척기', usage: '집기류 세척' },
      { name: '세척씽크대', usage: '세척용' },
      { name: '전기만두찜기', usage: '만두 찜용' },
      { name: '믹서기', usage: '무즙, 양파/무 갈기' },
      { name: '전기밥솥', usage: '홀 셀프바 밥' },
      { name: '작업대', usage: '조리 작업용' },
      { name: '벽선반', usage: '건조 식자재/소모품 보관' },
    ],
  },
  {
    id: 5,
    label: '5단계 - 식자재 전처리 및 보관',
    short: '전처리·보관',
    checklist: [
      { id: 'c5_1', label: '식자재별 전처리 방법 (채소, 육류, 해산물)', required: true },
      { id: 'c5_2', label: '올바른 보관법', required: false },
      { id: 'c5_3', label: '유통기한 관리 및 선입선출 원칙', required: false },
      { id: 'c5_4', label: '식자재 상태 검수 방법', required: false },
    ],
  },
  {
    id: 6,
    label: '6단계 - 조리 실습',
    short: '조리 실습',
    checklist: [
      { id: 'c6_1', label: '주방 빌지 체크', required: true },
      { id: 'c6_2', label: '레시피 숙지', required: false },
      { id: 'c6_3', label: '조리법 숙달', required: false },
      { id: 'c6_4', label: '조리 타이밍 맞추기 (동시 주문 처리)', required: false },
      { id: 'c6_5', label: '일관성 유지 (계량, 면 굵기 등)', required: false },
    ],
  },
  {
    id: 7,
    label: '7단계 - 음식 세팅',
    short: '음식 세팅',
    checklist: [
      { id: 'c7_1', label: '플레이팅 (고명)', required: true },
      { id: 'c7_2', label: '셀프바 관리 (리필 및 정리정돈)', required: false },
      { id: 'c7_3', label: '메뉴별 세팅 속도 연습', required: false },
      { id: 'c7_4', label: '주문서 대비 조리 정확도 체크', required: true },
    ],
  },
  {
    id: 8,
    label: '8단계 - 홀 & 고객 응대',
    short: '홀·응대',
    checklist: [
      { id: 'c8_1', label: '고객 맞이 인사 및 안내', required: false },
      { id: 'c8_2', label: '주문 접수 방법 (테이블 오더/구두)', required: false },
      { id: 'c8_3', label: '서빙 매너 및 동선', required: false },
      { id: 'c8_4', label: '고객 불만/클레임 대응 매뉴얼', required: true },
      { id: 'c8_5', label: '단골 고객 응대 팁', required: false },
    ],
  },
  {
    id: 9,
    label: '9단계 - 포스 & 정산',
    short: '포스·정산',
    checklist: [
      { id: 'c9_1', label: '메인 포스기 개점·주문·결제 조작', required: true },
      { id: 'c9_2', label: '결제 유형별 처리 (카드/현금/복합/모바일)', required: false },
      { id: 'c9_3', label: '반품(취소)·영수증·현금영수증 처리', required: false },
      { id: 'c9_4', label: '마감 정산 및 마감 취소', required: false },
      { id: 'c9_5', label: '테이블 오더 관리자 모드 및 테블릿 관리', required: false },
      { id: 'c9_6', label: '테이블 오더 결제 (개인/더치페이)', required: false },
    ],
  },
  {
    id: 10,
    label: '10단계 - 오픈/마감 및 발주 관리',
    short: '오픈·마감·발주',
    checklist: [
      { id: 'c10_1', label: '매장 오픈 준비 체크리스트', required: true },
      { id: 'c10_2', label: '마감 청소 루틴 및 체크리스트', required: true },
      { id: 'c10_3', label: '식자재 발주 방법 및 주기', required: true },
      { id: 'c10_4', label: '재고 관리 및 로스율 체크', required: true },
    ],
  },
  {
    id: 11,
    label: '11단계 - 최종 테스트',
    short: '최종 테스트',
    checklist: [
      { id: 'c11_1', label: '전 단계 종합 실기 평가', required: false },
      { id: 'c11_2', label: '조리 속도 및 품질 테스트', required: false },
      { id: 'c11_3', label: '고객 응대 롤플레잉', required: false },
      { id: 'c11_4', label: '오픈 시뮬레이션 (실제 영업 환경)', required: false },
    ],
  },
];

export type ChecklistItem = {
  id: string;
  label: string;
  required: boolean;
};

export type EquipmentItem = {
  name: string;
  usage: string;
};

export type CurriculumStep = {
  id: number;
  label: string;
  short: string;
  checklist: ChecklistItem[];
  equipment?: EquipmentItem[];
};

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
  started_at: string;
  checklist_status: { [key: string]: boolean };
  created_at: string;
};

export type CompletionRequest = {
  id: string;
  branch_id: string;
  step: number;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected';
  owner_message: string;
  reviewer_id: string | null;
  reviewer_comment: string;
  created_at: string;
  reviewed_at: string | null;
};

export type FinalComment = {
  id: string;
  branch_id: string;
  sv_comment: string;
  owner_comment: string;
  ai_analysis: string;
  created_at: string;
};
