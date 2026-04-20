-- ============================================
-- 지점별 교육 통계 View
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 지점별 교육 통계를 DB에서 계산
CREATE OR REPLACE VIEW branch_stats AS
SELECT
  b.id,
  b.name,
  b.owner_name,
  b.phone,
  b.start_date,
  b.last_step,
  b.created_at,
  -- 이수 완료된 고유 단계 수
  COUNT(DISTINCT CASE WHEN r.passed = true THEN r.step END) AS completed_steps,
  -- 전체 기록 수
  COUNT(r.id) AS total_records,
  -- 평균 점수
  ROUND(AVG(CASE WHEN r.score IS NOT NULL THEN r.score END)::numeric, 1) AS avg_score,
  -- 진행률 (11단계 기준)
  ROUND((COUNT(DISTINCT CASE WHEN r.passed = true THEN r.step END)::numeric / 11) * 100) AS pct,
  -- 상태
  CASE
    WHEN COUNT(DISTINCT CASE WHEN r.passed = true THEN r.step END) >= 11 THEN 'complete'
    WHEN COUNT(DISTINCT CASE WHEN r.passed = true THEN r.step END) > 0 THEN 'progress'
    ELSE 'notStarted'
  END AS status
FROM branches b
LEFT JOIN records r ON b.id = r.branch_id
GROUP BY b.id, b.name, b.owner_name, b.phone, b.start_date, b.last_step, b.created_at;

-- RLS 정책
-- View는 기본 테이블의 RLS를 따르므로 별도 설정 불필요
-- 단, branches 테이블에 RLS가 설정되어 있어야 함

-- 단계별 통계 View (analysis 페이지용)
CREATE OR REPLACE VIEW step_stats AS
SELECT
  r.step,
  COUNT(*) AS total,
  COUNT(CASE WHEN r.passed = true THEN 1 END) AS passed,
  COUNT(CASE WHEN r.passed = false THEN 1 END) AS failed,
  ROUND(AVG(CASE WHEN r.score IS NOT NULL THEN r.score END)::numeric, 1) AS avg_score
FROM records r
GROUP BY r.step
ORDER BY r.step;
