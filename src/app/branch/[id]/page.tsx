"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { type Branch, type Record, type FinalComment, type CompletionRequest } from "@/lib/constants";
import { useCurriculum } from "@/lib/use-curriculum";
import { useAuth, canEdit } from "@/lib/auth-context";
import StepCard from "@/components/branch/StepCard";
import FinalCommentSection from "@/components/branch/FinalCommentSection";
import AiAnalysisSection from "@/components/branch/AiAnalysisSection";
import CancelConfirmModal from "@/components/branch/CancelConfirmModal";

export default function BranchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { role } = useAuth();
  const { curriculum } = useCurriculum();

  // 데이터 상태
  const [branch, setBranch] = useState<Branch | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [completionRequests, setCompletionRequests] = useState<CompletionRequest[]>([]);
  const [finalComment, setFinalComment] = useState<FinalComment | null>(null);
  const [loading, setLoading] = useState(true);

  // 코멘트 수정 상태
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editSv, setEditSv] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editScore, setEditScore] = useState<number | null>(null);
  const [savingRecord, setSavingRecord] = useState(false);

  // 최종 코멘트 상태
  const [finalSv, setFinalSv] = useState("");
  const [finalOwner, setFinalOwner] = useState("");
  const [editingFinal, setEditingFinal] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);

  // AI 분석 상태
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // UI 상태
  const [manualStep, setManualStep] = useState<number | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<{ step: number; recordId: string; requestId: string } | null>(null);
  const [canceling, setCanceling] = useState(false);

  // --- 데이터 페칭 ---
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [branchRes, recordRes, requestRes, finalRes] = await Promise.all([
        supabase.from('branches').select('*').eq('id', id).single(),
        supabase.from('records').select('*').eq('branch_id', id).order('created_at', { ascending: true }),
        supabase.from('completion_requests').select('*').eq('branch_id', id).order('created_at', { ascending: true }),
        supabase.from('final_comments').select('*').eq('branch_id', id).single(),
      ]);

      setBranch(branchRes.data || null);
      setRecords(recordRes.data || []);
      setCompletionRequests(requestRes.data || []);

      if (finalRes.data) {
        setFinalComment(finalRes.data);
        setFinalSv(finalRes.data.sv_comment || "");
        setFinalOwner(finalRes.data.owner_comment || "");
        setAiAnalysis(finalRes.data.ai_analysis || "");
      }

      // 교육 완료 시 AI 분석 자동 실행
      const completedCount = new Set((recordRes.data || []).filter((r: Record) => r.passed).map((r: Record) => r.step)).size;
      if (completedCount >= curriculum.length && branchRes.data && (!finalRes.data || !finalRes.data.ai_analysis)) {
        runAiAnalysis(branchRes.data, recordRes.data || []);
      }

      setLoading(false);
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // --- AI 분석 ---
  const runAiAnalysis = async (branchInfo: Branch, recordList: Record[]) => {
    setAiLoading(true);
    setAiError("");
    try {
      const enrichedRecords = recordList.map(r => ({ ...r, branch_id: branchInfo.name }));
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branches: [branchInfo], records: enrichedRecords, curriculum: curriculum }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error?.includes("credit") ? "AI 크레딧이 부족합니다. 관리자에게 문의하세요." : "AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }

      setAiAnalysis(data.analysis);
      await supabase.from('final_comments').upsert({
        branch_id: branchInfo.id, sv_comment: finalSv, owner_comment: finalOwner, ai_analysis: data.analysis,
      }, { onConflict: 'branch_id' });
    } catch {
      setAiError("AI 분석 요청에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

  // --- 코멘트 수정 ---
  const startEdit = (stepId: number, record: Record) => {
    setEditingStep(stepId);
    setEditSv(record.sv_comment);
    setEditOwner(record.owner_comment);
    setEditScore(record.score);
  };

  const saveEdit = async (recordId: string) => {
    setSavingRecord(true);
    const { error } = await supabase.from('records').update({ sv_comment: editSv, owner_comment: editOwner, score: editScore }).eq('id', recordId);
    if (error) { alert('저장에 실패했습니다.'); console.error(error); setSavingRecord(false); return; }
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, sv_comment: editSv, owner_comment: editOwner, score: editScore } : r));
    setEditingStep(null);
    setSavingRecord(false);
  };

  // --- 평가 취소 ---
  const cancelEvaluation = async () => {
    if (!cancelConfirm) return;
    setCanceling(true);

    const { error: deleteError } = await supabase.from('records').delete().eq('id', cancelConfirm.recordId);
    if (deleteError) { alert('평가 취소에 실패했습니다.'); setCanceling(false); return; }

    const { error: updateError } = await supabase.from('completion_requests').update({
      status: 'pending', reviewer_id: null, reviewer_comment: '', reviewed_at: null,
    }).eq('id', cancelConfirm.requestId);
    if (updateError) { alert('요청 상태 복원에 실패했습니다.'); setCanceling(false); return; }

    setRecords(prev => prev.filter(r => r.id !== cancelConfirm.recordId));
    setCompletionRequests(prev => prev.map(r =>
      r.id === cancelConfirm.requestId
        ? { ...r, status: 'pending' as const, reviewer_id: null, reviewer_comment: '', reviewed_at: null }
        : r
    ));
    setCancelConfirm(null);
    setCanceling(false);
  };

  // --- 최종 코멘트 저장 ---
  const saveFinalComment = async () => {
    if (!branch) return;
    setSavingFinal(true);
    const { error } = await supabase.from('final_comments').upsert({ branch_id: branch.id, sv_comment: finalSv, owner_comment: finalOwner }, { onConflict: 'branch_id' });
    if (error) { alert('최종 코멘트 저장에 실패했습니다.'); setSavingFinal(false); return; }
    setFinalComment({ id: finalComment?.id || '', branch_id: branch.id, sv_comment: finalSv, owner_comment: finalOwner, ai_analysis: aiAnalysis, created_at: finalComment?.created_at || new Date().toISOString() });
    setEditingFinal(false);
    setSavingFinal(false);
  };

  // --- 렌더링 ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>로딩 중...</p>
      </div>
    );
  }

  if (!branch) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <p style={{ color: "var(--text-muted)" }}>지점을 찾을 수 없습니다.</p>
    </div>
  );

  const completedStepIds = new Set(records.filter(r => r.passed).map(r => r.step));
  const pct = Math.round((completedStepIds.size / curriculum.length) * 100);
  const isHq = canEdit(role);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="text-white py-4 px-5 flex items-center justify-between" style={{ background: "var(--primary)" }}>
        <h1 className="text-base font-bold">{branch.name}</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 지점 정보 카드 */}
        <div className="bg-white rounded-2xl p-5 mb-4 border shadow-sm" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-lg font-bold">{branch.name}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>점주: {branch.owner_name}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>연락처: {branch.phone}</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>교육 시작일: {branch.start_date}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold" style={{ color: pct >= 100 ? "var(--success)" : "var(--primary)" }}>{pct}%</span>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{completedStepIds.size}/{curriculum.length}단계</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "var(--bg-warm)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "var(--primary)" }} />
          </div>
        </div>

        {/* 커리큘럼 단계별 현황 */}
        <h3 className="text-[15px] font-bold mb-3">커리큘럼 진행 현황</h3>
        {curriculum.map(step => (
          <StepCard
            key={step.id}
            step={step}
            records={records}
            completionRequests={completionRequests}
            manualStep={manualStep}
            onManualToggle={(id) => setManualStep(manualStep === id ? null : id)}
            isEditing={editingStep === step.id}
            editSv={editSv}
            editOwner={editOwner}
            editScore={editScore}
            savingRecord={savingRecord}
            canEditRole={isHq}
            onStartEdit={startEdit}
            onEditSvChange={setEditSv}
            onEditOwnerChange={setEditOwner}
            onEditScoreChange={setEditScore}
            onCancelEdit={() => setEditingStep(null)}
            onSaveEdit={saveEdit}
            onCancelConfirm={setCancelConfirm}
          />
        ))}

        {/* 최종 코멘트 */}
        <FinalCommentSection
          pct={pct}
          editingFinal={editingFinal}
          finalSv={finalSv}
          finalOwner={finalOwner}
          finalComment={finalComment}
          savingFinal={savingFinal}
          canEditRole={isHq}
          onFinalSvChange={setFinalSv}
          onFinalOwnerChange={setFinalOwner}
          onEditingFinalChange={setEditingFinal}
          onSave={saveFinalComment}
        />

        {/* AI 분석 */}
        <AiAnalysisSection
          pct={pct}
          aiAnalysis={aiAnalysis}
          aiLoading={aiLoading}
          aiError={aiError}
          canEditRole={isHq}
          branch={branch}
          records={records}
          onRetry={runAiAnalysis}
        />
      </main>

      {/* 평가 취소 모달 */}
      {cancelConfirm && (
        <CancelConfirmModal
          branchName={branch.name}
          stepLabel={curriculum.find(s => s.id === cancelConfirm.step)?.label || `${cancelConfirm.step}단계`}
          canceling={canceling}
          onClose={() => setCancelConfirm(null)}
          onConfirm={cancelEvaluation}
        />
      )}
    </div>
  );
}
