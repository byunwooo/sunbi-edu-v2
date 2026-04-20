"use client";
import type { CompletionRequest } from "@/lib/constants";

type Props = {
  requests: CompletionRequest[];
};

export default function Timeline({ requests }: Props) {
  if (requests.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
      <p className="text-[11px] font-bold mb-2" style={{ color: "var(--text-secondary)" }}>교육 이력 ({requests.length}회)</p>
      <div className="space-y-2">
        {requests.map((req, idx) => {
          const statusColor = req.status === "approved" ? "var(--success)" : req.status === "rejected" ? "var(--danger)" : "#3498db";
          const statusLabel = req.status === "approved" ? "이수" : req.status === "rejected" ? "반려" : "진행 중";
          return (
            <div key={req.id} className="flex gap-2.5">
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full mt-1" style={{ background: statusColor }} />
                {idx < requests.length - 1 && <div className="w-0.5 flex-1 mt-1" style={{ background: "var(--border-light)" }} />}
              </div>
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold" style={{ color: statusColor }}>{statusLabel}</span>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    {new Date(req.created_at).toLocaleDateString("ko-KR")}
                    {req.reviewed_at ? ` → ${new Date(req.reviewed_at).toLocaleDateString("ko-KR")}` : ""}
                  </span>
                </div>
                {req.owner_message && (
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>점주: {req.owner_message}</p>
                )}
                {req.reviewer_comment && (
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>SV: {req.reviewer_comment}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
