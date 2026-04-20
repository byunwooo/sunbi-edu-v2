"use client";
import { useState, useEffect } from "react";
import { CURRICULUM_STEPS, type CurriculumStep } from "./constants";
import { fetchCurriculum } from "./curriculum";

/**
 * 커리큘럼 데이터를 DB에서 가져오는 훅.
 * DB 미설정 시 하드코딩 fallback 자동 사용.
 */
export function useCurriculum() {
  const [curriculum, setCurriculum] = useState<CurriculumStep[]>(CURRICULUM_STEPS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchCurriculum().then(data => {
      setCurriculum(data);
      setLoaded(true);
    });
  }, []);

  return { curriculum, loaded };
}
