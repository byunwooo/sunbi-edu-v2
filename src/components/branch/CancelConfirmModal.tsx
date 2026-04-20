"use client";

type Props = {
  branchName: string;
  stepLabel: string;
  canceling: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function CancelConfirmModal({ branchName, stepLabel, canceling, onClose, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-extrabold mb-2">평가 취소</h2>
        <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold">{branchName}</span>의 <span className="font-semibold" style={{ color: "var(--primary)" }}>{stepLabel}</span>
        </p>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          평가 결과를 취소하고 다시 평가할 수 있도록 되돌리시겠습니까?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-3 rounded-xl font-semibold border text-[14px] hover:opacity-80 transition-opacity cursor-pointer"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            onClick={onClose}
            disabled={canceling}
          >
            닫기
          </button>
          <button
            className="py-3 rounded-xl font-bold text-white text-[14px] shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: "var(--danger)" }}
            onClick={onConfirm}
            disabled={canceling}
          >
            {canceling ? "처리 중..." : "평가 취소"}
          </button>
        </div>
      </div>
    </div>
  );
}
