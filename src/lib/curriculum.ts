import { supabase } from "./supabase";
import { CURRICULUM_STEPS, type CurriculumStep } from "./constants";

/**
 * DB에서 커리큘럼을 가져옴. 실패 시 하드코딩 fallback 사용.
 * 한 번 로드하면 메모리에 캐싱.
 */
let cachedCurriculum: CurriculumStep[] | null = null;

export async function fetchCurriculum(): Promise<CurriculumStep[]> {
  if (cachedCurriculum) return cachedCurriculum;

  try {
    const [stepsRes, checklistRes, equipmentRes] = await Promise.all([
      supabase.from('curriculum_steps').select('*').order('sort_order'),
      supabase.from('checklist_items').select('*').order('sort_order'),
      supabase.from('equipment_items').select('*').order('sort_order'),
    ]);

    if (stepsRes.error || !stepsRes.data?.length) {
      // DB 테이블이 없거나 비어있으면 fallback
      return CURRICULUM_STEPS;
    }

    const steps: CurriculumStep[] = stepsRes.data.map(s => ({
      id: s.step_number,
      label: s.label,
      short: s.short,
      checklist: (checklistRes.data || [])
        .filter(c => c.step_number === s.step_number)
        .map(c => ({ id: c.id, label: c.label, required: c.required })),
      ...(equipmentRes.data?.some(e => e.step_number === s.step_number) && {
        equipment: (equipmentRes.data || [])
          .filter(e => e.step_number === s.step_number)
          .map(e => ({ name: e.name, usage: e.usage })),
      }),
    }));

    cachedCurriculum = steps;
    return steps;
  } catch {
    // 네트워크 오류 등 → fallback
    return CURRICULUM_STEPS;
  }
}

/** 캐시 무효화 (관리자가 커리큘럼 수정 시 호출) */
export function invalidateCurriculumCache() {
  cachedCurriculum = null;
}
