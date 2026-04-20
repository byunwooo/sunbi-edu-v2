"use client";

type Props = {
  pct: number;
  editingFinal: boolean;
  finalSv: string;
  finalOwner: string;
  finalComment: { id: string } | null;
  savingFinal: boolean;
  canEditRole: boolean;
  onFinalSvChange: (v: string) => void;
  onFinalOwnerChange: (v: string) => void;
  onEditingFinalChange: (v: boolean) => void;
  onSave: () => void;
};

export default function FinalCommentSection({
  pct, editingFinal, finalSv, finalOwner, finalComment, savingFinal,
  canEditRole, onFinalSvChange, onFinalOwnerChange, onEditingFinalChange, onSave,
}: Props) {
  return (
    <>
      <h3 className="text-[15px] font-bold mt-6 mb-3">최종 코멘트</h3>
      <div className="bg-white rounded-xl p-5 border" style={{ borderColor: "var(--border-light)" }}>
        {pct >= 100 ? (
          editingFinal ? (
            <>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>SV 종합 평가</label>
              <textarea className="w-full rounded-lg px-3 py-2 text-sm border resize-none mb-3" style={{ borderColor: "var(--border)", minHeight: 80 }} value={finalSv} onChange={e => onFinalSvChange(e.target.value)} />

              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주 소감</label>
              <textarea className="w-full rounded-lg px-3 py-2 text-sm border resize-none mb-3" style={{ borderColor: "var(--border)", minHeight: 80 }} value={finalOwner} onChange={e => onFinalOwnerChange(e.target.value)} />

              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold border hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => onEditingFinalChange(false)}>취소</button>
                <button className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 cursor-pointer" style={{ background: "var(--primary)" }} onClick={onSave} disabled={savingFinal}>{savingFinal ? "저장 중..." : "저장"}</button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>SV 종합 평가</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{finalSv || "아직 작성되지 않았습니다."}</p>
              </div>
              <div className="mb-3">
                <p className="text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주 소감</p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{finalOwner || "아직 작성되지 않았습니다."}</p>
              </div>
              {canEditRole && (
                <button className="text-xs font-semibold hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => onEditingFinalChange(true)}>
                  코멘트 {finalComment ? "수정" : "작성"}
                </button>
              )}
            </>
          )
        ) : (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
            모든 단계를 이수하면 최종 코멘트를 작성할 수 있습니다.
          </p>
        )}
      </div>
    </>
  );
}
