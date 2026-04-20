"use client";
import { BookOpen } from "lucide-react";
import type { CurriculumStep, Record, CompletionRequest } from "@/lib/constants";
import ManualViewer from "./ManualViewer";
import Timeline from "./Timeline";

type Props = {
  step: CurriculumStep;
  records: Record[];
  completionRequests: CompletionRequest[];
  // 매뉴얼 토글
  manualStep: number | null;
  onManualToggle: (stepId: number) => void;
  // 코멘트 수정
  isEditing: boolean;
  editSv: string;
  editOwner: string;
  editScore: number | null;
  savingRecord: boolean;
  canEditRole: boolean;
  onStartEdit: (stepId: number, record: Record) => void;
  onEditSvChange: (v: string) => void;
  onEditOwnerChange: (v: string) => void;
  onEditScoreChange: (v: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: (recordId: string) => void;
  // 평가 취소
  onCancelConfirm: (data: { step: number; recordId: string; requestId: string }) => void;
};

export default function StepCard({
  step, records, completionRequests,
  manualStep, onManualToggle,
  isEditing, editSv, editOwner, editScore, savingRecord, canEditRole,
  onStartEdit, onEditSvChange, onEditOwnerChange, onEditScoreChange, onCancelEdit, onSaveEdit,
  onCancelConfirm,
}: Props) {
  const stepRecords = records.filter(r => r.step === step.id);
  const passed = stepRecords.some(r => r.passed);
  const latestRecord = stepRecords[stepRecords.length - 1];
  const stepRequests = completionRequests.filter(r => r.step === step.id);

  return (
    <div className={`bg-white rounded-xl p-4 mb-2 border ${passed ? "border-green-300" : ""}`} style={{ borderColor: passed ? undefined : "var(--border-light)" }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{
            background: passed ? "var(--success-bg)" : "var(--bg-warm)",
            color: passed ? "var(--success)" : "var(--text-muted)"
          }}>
            {step.id}
          </div>
          <div>
            <p className="text-sm font-semibold">{step.short}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {passed ? "이수 완료" : stepRecords.length > 0 ? "미이수" : "미진행"}
              {latestRecord?.started_at && passed && (() => {
                const start = new Date(latestRecord.started_at);
                const end = new Date(latestRecord.created_at);
                const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                return <span style={{ color: "var(--primary)" }}> ({days}일 소요)</span>;
              })()}
            </p>
          </div>
        </div>
        {latestRecord && (
          <div className="text-right">
            {latestRecord.score && (
              <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>{latestRecord.score}<span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>/5</span></span>
            )}
            <p className={`text-xs font-semibold ${passed ? "text-green-600" : "text-red-500"}`}>
              {passed ? "PASS" : "FAIL"}
            </p>
          </div>
        )}
        {!latestRecord && (
          <span className="text-xs px-2 py-1 rounded-md" style={{ background: "var(--bg-warm)", color: "var(--text-muted)" }}>대기</span>
        )}
      </div>

      {/* 매뉴얼 학습 */}
      <div className="mt-3">
        <button
          className="w-full py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-2 border transition-all"
          style={{
            borderColor: manualStep === step.id ? "var(--primary)" : "var(--border-light)",
            background: manualStep === step.id ? "rgba(139,26,26,0.05)" : "var(--bg-warm)",
            color: manualStep === step.id ? "var(--primary)" : "var(--text-secondary)",
          }}
          onClick={() => onManualToggle(step.id)}
        >
          <BookOpen size={13} />
          {manualStep === step.id ? "매뉴얼 닫기" : "매뉴얼 보기"}
        </button>
        {manualStep === step.id && <ManualViewer stepId={step.id} />}
      </div>

      {/* 체크리스트 현황 */}
      {latestRecord && latestRecord.checklist_status && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex flex-wrap gap-1.5">
            {step.checklist.map(item => {
              const checked = latestRecord.checklist_status[item.id];
              return (
                <span key={item.id} className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg" style={{
                  background: checked ? "var(--success-bg)" : "var(--bg-warm)",
                  color: checked ? "var(--success)" : "var(--text-muted)",
                  fontWeight: item.required ? 700 : 400,
                }}>
                  {checked ? "\u2713" : "\u25cb"} {item.required && "\u2605"}{item.label}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 교육 이력 타임라인 */}
      <Timeline requests={stepRequests} />

      {/* 코멘트 - 읽기 모드 */}
      {latestRecord && !isEditing && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
          {latestRecord.sv_comment && (
            <p className="text-xs mb-1"><span className="font-semibold" style={{ color: "var(--primary)" }}>SV:</span> <span style={{ color: "var(--text-secondary)" }}>{latestRecord.sv_comment}</span></p>
          )}
          {latestRecord.owner_comment && (
            <p className="text-xs"><span className="font-semibold" style={{ color: "var(--text-secondary)" }}>점주:</span> <span style={{ color: "var(--text-secondary)" }}>{latestRecord.owner_comment}</span></p>
          )}
          {!latestRecord.sv_comment && !latestRecord.owner_comment && (
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>코멘트 없음</p>
          )}
          {canEditRole && (
            <div className="flex gap-3 mt-2">
              <button className="text-xs font-semibold hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => onStartEdit(step.id, latestRecord)}>
                코멘트 수정
              </button>
              {(() => {
                const matchingRequest = completionRequests
                  .filter(r => r.step === step.id && (r.status === 'approved' || r.status === 'rejected'))
                  .sort((a, b) => new Date(b.reviewed_at || b.created_at).getTime() - new Date(a.reviewed_at || a.created_at).getTime())[0];
                if (!matchingRequest) return null;
                return (
                  <button
                    className="text-xs font-semibold hover:opacity-70 cursor-pointer"
                    style={{ color: "var(--danger)" }}
                    onClick={() => onCancelConfirm({ step: step.id, recordId: latestRecord.id, requestId: matchingRequest.id })}
                  >
                    평가 취소
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* 코멘트 - 수정 모드 */}
      {latestRecord && isEditing && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
          {passed && (
            <div className="mb-3">
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>점수</label>
              <div className="flex gap-1.5">
                {[1,2,3,4,5].map(n => (
                  <button key={n} className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer ${editScore === n ? "text-white" : "border-gray-200 hover:border-gray-300"}`} style={editScore === n ? { background: "var(--primary)", borderColor: "var(--primary)" } : { color: "var(--text-muted)" }} onClick={() => onEditScoreChange(n)}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <label className="block text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>SV 코멘트</label>
          <textarea className="w-full rounded-lg px-3 py-2 text-xs border resize-none mb-2" style={{ borderColor: "var(--border)", minHeight: 60 }} value={editSv} onChange={e => onEditSvChange(e.target.value)} placeholder="SV 코멘트를 입력하세요" />

          <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주 코멘트</label>
          <textarea className="w-full rounded-lg px-3 py-2 text-xs border resize-none mb-2" style={{ borderColor: "var(--border)", minHeight: 60 }} value={editOwner} onChange={e => onEditOwnerChange(e.target.value)} placeholder="점주 코멘트를 입력하세요" />

          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-lg text-xs font-semibold border hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={onCancelEdit}>취소</button>
            <button className="flex-1 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 cursor-pointer" style={{ background: "var(--primary)" }} onClick={() => onSaveEdit(latestRecord.id)} disabled={savingRecord}>{savingRecord ? "저장 중..." : "저장"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
