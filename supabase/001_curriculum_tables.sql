-- ============================================
-- 커리큘럼 DB 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 1. 커리큘럼 단계 테이블
CREATE TABLE IF NOT EXISTS curriculum_steps (
  id SERIAL PRIMARY KEY,
  step_number INT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  short TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 2. 체크리스트 항목 테이블
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,          -- 기존 c1_1, c2_1 등의 ID 유지
  step_number INT NOT NULL REFERENCES curriculum_steps(step_number),
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

-- 3. 장비 항목 테이블 (4단계 전용)
CREATE TABLE IF NOT EXISTS equipment_items (
  id SERIAL PRIMARY KEY,
  step_number INT NOT NULL REFERENCES curriculum_steps(step_number),
  name TEXT NOT NULL,
  usage TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- RLS 정책: 모든 인증 사용자가 읽기 가능
ALTER TABLE curriculum_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "커리큘럼 읽기" ON curriculum_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "체크리스트 읽기" ON checklist_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "장비 읽기" ON equipment_items FOR SELECT TO authenticated USING (true);

-- ============================================
-- 시드 데이터: 11단계 커리큘럼
-- ============================================

INSERT INTO curriculum_steps (step_number, label, short, sort_order) VALUES
(1, '1단계 - 브랜드 & 메뉴 이해', '브랜드·메뉴', 1),
(2, '2단계 - 위생 및 안전', '위생·안전', 2),
(3, '3단계 - 주방 공간 적응 & 동선', '주방 동선', 3),
(4, '4단계 - 주방기물 세팅', '기물 세팅', 4),
(5, '5단계 - 식자재 전처리 및 보관', '전처리·보관', 5),
(6, '6단계 - 조리 실습', '조리 실습', 6),
(7, '7단계 - 음식 세팅', '음식 세팅', 7),
(8, '8단계 - 홀 & 고객 응대', '홀·응대', 8),
(9, '9단계 - 포스 & 정산', '포스·정산', 9),
(10, '10단계 - 오픈/마감 및 발주 관리', '오픈·마감·발주', 10),
(11, '11단계 - 최종 테스트', '최종 테스트', 11);

-- 1단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c1_1', 1, '브랜드 히스토리 및 가치관', FALSE, 1),
('c1_2', 1, '메뉴판 전체 숙지 (메뉴명, 가격)', TRUE, 2),
('c1_3', 1, '메뉴별 주요 재료 및 특징 이해', FALSE, 3),
('c1_4', 1, '고객 추천 멘트 연습', FALSE, 4),
('c1_5', 1, '경쟁 브랜드 대비 차별점 이해', FALSE, 5);

-- 2단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c2_1', 2, '식품위생법 기본 이해', FALSE, 1),
('c2_2', 2, '개인 위생 관리 (복장, 손 세척, 건강관리)', TRUE, 2),
('c2_3', 2, '식자재 교차오염 방지 원칙', FALSE, 3),
('c2_4', 2, '화기, 칼, 제면기 사용 시 안전수칙', FALSE, 4),
('c2_5', 2, '화상/화재 응급 대처법', FALSE, 5),
('c2_6', 2, '매장 청결 기준 및 점검 방법', FALSE, 6),
('c2_7', 2, '해충·방역 관리', FALSE, 7),
('c2_8', 2, '안전 장비 위치 및 비상 대응', FALSE, 8);

-- 3단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c3_1', 3, '주방 구역별 역할 파악 (조리, 세척, 보관)', TRUE, 1),
('c3_2', 3, '효율적인 조리 동선 이해', FALSE, 2),
('c3_3', 3, '피크타임 동선 시뮬레이션', FALSE, 3),
('c3_4', 3, '안전한 이동 경로 숙지', FALSE, 4);

-- 4단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c4_1', 4, '조리도구 종류 및 용도 파악', TRUE, 1),
('c4_2', 4, '조리대·서빙대 기물 배치 위치 숙지', FALSE, 2),
('c4_3', 4, '기물 세척 및 소독 방법', FALSE, 3),
('c4_4', 4, '영업 전/후 기물 점검 루틴', FALSE, 4);

-- 5단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c5_1', 5, '식자재별 전처리 방법 (채소, 육류, 해산물)', TRUE, 1),
('c5_2', 5, '올바른 보관법', FALSE, 2),
('c5_3', 5, '유통기한 관리 및 선입선출 원칙', FALSE, 3),
('c5_4', 5, '식자재 상태 검수 방법', FALSE, 4);

-- 6단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c6_1', 6, '주방 빌지 체크', TRUE, 1),
('c6_2', 6, '레시피 숙지', FALSE, 2),
('c6_3', 6, '조리법 숙달', FALSE, 3),
('c6_4', 6, '조리 타이밍 맞추기 (동시 주문 처리)', FALSE, 4),
('c6_5', 6, '일관성 유지 (계량, 면 굵기 등)', FALSE, 5);

-- 7단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c7_1', 7, '플레이팅 (고명)', TRUE, 1),
('c7_2', 7, '셀프바 관리 (리필 및 정리정돈)', FALSE, 2),
('c7_3', 7, '메뉴별 세팅 속도 연습', FALSE, 3),
('c7_4', 7, '주문서 대비 조리 정확도 체크', TRUE, 4);

-- 8단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c8_1', 8, '고객 맞이 인사 및 안내', FALSE, 1),
('c8_2', 8, '주문 접수 방법 (테이블오더/구두)', FALSE, 2),
('c8_3', 8, '서빙 매너 및 동선', FALSE, 3),
('c8_4', 8, '고객 불만/클레임 대응 매뉴얼', TRUE, 4),
('c8_5', 8, '단골 고객 응대 TIP', FALSE, 5);

-- 9단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c9_1', 9, '메인 포스기 개점·주문·결제 조작', TRUE, 1),
('c9_2', 9, '결제 유형별 처리 (카드/현금/복합/모바일)', FALSE, 2),
('c9_3', 9, '반품(취소)·영수증·현금영수증 처리', FALSE, 3),
('c9_4', 9, '마감 정산 및 마감 취소', FALSE, 4),
('c9_5', 9, '테이블오더 관리자 모드 및 테이블오더 기기 관리', FALSE, 5),
('c9_6', 9, '테이블오더 결제 (개인/더치페이)', FALSE, 6);

-- 10단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c10_1', 10, '매장 오픈 준비 체크리스트', TRUE, 1),
('c10_2', 10, '마감 청소 루틴 및 체크리스트', TRUE, 2),
('c10_3', 10, '식자재 발주 방법 및 주기', TRUE, 3),
('c10_4', 10, '재고 관리 및 로스율 체크', TRUE, 4);

-- 11단계 체크리스트
INSERT INTO checklist_items (id, step_number, label, required, sort_order) VALUES
('c11_1', 11, '전 단계 종합 실기 평가', FALSE, 1),
('c11_2', 11, '조리 속도 및 품질 테스트', FALSE, 2),
('c11_3', 11, '고객 응대 롤플레잉', FALSE, 3),
('c11_4', 11, '오픈 시뮬레이션 (실제 영업 환경)', FALSE, 4);

-- 4단계 장비 목록
INSERT INTO equipment_items (step_number, name, usage, sort_order) VALUES
(4, '제면기 + 칼국수날', '매장 직접 제면', 1),
(4, '슬러시아', '육수 보관', 2),
(4, '사리냉각기', '면 식히기 (콩국수, 냉국수)', 3),
(4, '45박스 냉장고', '주방 메인 냉장/냉동', 4),
(4, '테이블냉동·냉장고', '작업대 겸용', 5),
(4, '반찬냉장고', '홀용 반찬 보관', 6),
(4, '음료냉장고', '음료 진열', 7),
(4, '간택기', '메인 조리 화구', 8),
(4, '낮은렌지', '보조 화구', 9),
(4, '식기세척기', '집기류 세척', 10),
(4, '세척씽크대', '세척용', 11),
(4, '전기만두찜기', '만두 찜용', 12),
(4, '믹서기', '무즙, 무 갈기', 13),
(4, '전기밥솥', '홀 셀프바 밥', 14),
(4, '작업대', '조리 작업용', 15),
(4, '벽선반', '건조 식자재/소모품 보관', 16);
