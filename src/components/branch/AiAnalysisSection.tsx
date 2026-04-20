"use client";
import { sanitizeAnalysis } from "@/lib/sanitize";
import type { Branch, Record } from "@/lib/constants";

type Props = {
  pct: number;
  aiAnalysis: string;
  aiLoading: boolean;
  aiError: string;
  canEditRole: boolean;
  branch: Branch | null;
  records: Record[];
  onRetry: (branch: Branch, records: Record[]) => void;
};

export default function AiAnalysisSection({
  pct, aiAnalysis, aiLoading, aiError, canEditRole, branch, records, onRetry,
}: Props) {
  if (pct < 100) return null;

  return (
    <>
      <h3 className="text-[15px] font-bold mt-6 mb-3">AI 교육 분석</h3>
      <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border-light)" }}>
        {aiLoading && (
          <div className="text-center py-6">
            <p className="text-sm font-semibold" style={{ color: "var(--primary)" }}>AI가 교육 데이터를 분석하고 있습니다...</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>약 10초 소요</p>
          </div>
        )}
        {aiError && (
          <div className="p-3 rounded-lg mb-3" style={{ background: "var(--warning-bg)" }}>
            <p className="text-sm" style={{ color: "var(--warning)" }}>{aiError}</p>
            {canEditRole && (
              <button className="text-xs font-semibold mt-2 hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => branch && onRetry(branch, records)}>
                다시 시도
              </button>
            )}
          </div>
        )}
        {aiAnalysis && !aiLoading && (
          <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: sanitizeAnalysis(aiAnalysis) }} />
        )}
        {!aiAnalysis && !aiLoading && !aiError && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>AI 분석 결과가 없습니다.</p>
        )}
      </div>
    </>
  );
}
