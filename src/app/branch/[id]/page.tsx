"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch, type Record, type FinalComment } from "@/lib/constants";

export default function BranchDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [finalComment, setFinalComment] = useState<FinalComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editSv, setEditSv] = useState("");
  const [editOwner, setEditOwner] = useState("");
  const [editScore, setEditScore] = useState<number | null>(null);
  const [finalSv, setFinalSv] = useState("");
  const [finalOwner, setFinalOwner] = useState("");
  const [editingFinal, setEditingFinal] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);
  const [savingFinal, setSavingFinal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data: branchData, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single();
      if (branchError) { console.error(branchError); }

      const { data: recordData, error: recordError } = await supabase
        .from('records')
        .select('*')
        .eq('branch_id', id)
        .order('created_at', { ascending: true });
      if (recordError) { console.error(recordError); }

      const { data: finalData, error: finalError } = await supabase
        .from('final_comments')
        .select('*')
        .eq('branch_id', id)
        .single();
      if (finalError && finalError.code !== 'PGRST116') { console.error(finalError); }

      setBranch(branchData || null);
      setRecords(recordData || []);
      if (finalData) {
        setFinalComment(finalData);
        setFinalSv(finalData.sv_comment || "");
        setFinalOwner(finalData.owner_comment || "");
        setAiAnalysis(finalData.ai_analysis || "");
      }

      // 교육 완료 시 AI 분석 자동 실행 (아직 분석이 없을 때만)
      const completedCount = new Set((recordData || []).filter((r: Record) => r.passed).map((r: Record) => r.step)).size;
      if (completedCount >= CURRICULUM_STEPS.length && branchData && (!finalData || !finalData.ai_analysis)) {
        runAiAnalysis(branchData, recordData || []);
      }

      setLoading(false);
    }
    fetchData();
  }, [id]);

  const runAiAnalysis = async (branchInfo: Branch, recordList: Record[]) => {
    setAiLoading(true);
    setAiError("");
    try {
      const enrichedRecords = recordList.map(r => ({
        ...r,
        branch_id: branchInfo.name,
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branches: [branchInfo],
          records: enrichedRecords,
          curriculum: CURRICULUM_STEPS,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("credit")) {
          setAiError("AI 크레딧이 부족합니다. 관리자에게 문의하세요.");
        } else {
          setAiError("AI 분석에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }
        return;
      }

      setAiAnalysis(data.analysis);

      // DB에 AI 분석 결과 저장
      await supabase
        .from('final_comments')
        .upsert({
          branch_id: branchInfo.id,
          sv_comment: finalSv,
          owner_comment: finalOwner,
          ai_analysis: data.analysis,
        }, { onConflict: 'branch_id' });
    } catch {
      setAiError("AI 분석 요청에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  };

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
  const pct = Math.round((completedStepIds.size / CURRICULUM_STEPS.length) * 100);

  const startEdit = (stepId: number, record: Record) => {
    setEditingStep(stepId);
    setEditSv(record.sv_comment);
    setEditOwner(record.owner_comment);
    setEditScore(record.score);
  };

  const saveEdit = async (recordId: string) => {
    setSavingRecord(true);
    const { error } = await supabase
      .from('records')
      .update({ sv_comment: editSv, owner_comment: editOwner, score: editScore })
      .eq('id', recordId);

    if (error) {
      alert('저장에 실패했습니다.');
      console.error(error);
      setSavingRecord(false);
      return;
    }

    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, sv_comment: editSv, owner_comment: editOwner, score: editScore } : r));
    setEditingStep(null);
    setSavingRecord(false);
  };

  const saveFinalComment = async () => {
    setSavingFinal(true);
    const { error } = await supabase
      .from('final_comments')
      .upsert({
        branch_id: branch.id,
        sv_comment: finalSv,
        owner_comment: finalOwner,
      }, { onConflict: 'branch_id' });

    if (error) {
      alert('최종 코멘트 저장에 실패했습니다.');
      console.error(error);
      setSavingFinal(false);
      return;
    }

    setFinalComment({ id: finalComment?.id || '', branch_id: branch.id, sv_comment: finalSv, owner_comment: finalOwner, ai_analysis: aiAnalysis, created_at: finalComment?.created_at || new Date().toISOString() });
    setEditingFinal(false);
    setSavingFinal(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="text-white py-4 px-5 flex items-center justify-between" style={{ background: "var(--primary)" }}>
        <h1 className="text-base font-bold">{branch.name}</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 지점 정보 */}
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
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{completedStepIds.size}/{CURRICULUM_STEPS.length}단계</p>
            </div>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: "var(--bg-warm)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : "var(--primary)" }} />
          </div>
        </div>

        {/* 커리큘럼 단계별 현황 */}
        <h3 className="text-[15px] font-bold mb-3">커리큘럼 진행 현황</h3>

        {CURRICULUM_STEPS.map(step => {
          const stepRecords = records.filter(r => r.step === step.id);
          const passed = stepRecords.some(r => r.passed);
          const latestRecord = stepRecords[stepRecords.length - 1];
          const isEditing = editingStep === step.id;

          return (
            <div key={step.id} className={`bg-white rounded-xl p-4 mb-2 border ${passed ? "border-green-300" : ""}`} style={{ borderColor: passed ? undefined : "var(--border-light)" }}>
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
                  <button className="text-xs font-semibold mt-2 hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => startEdit(step.id, latestRecord)}>
                    코멘트 수정
                  </button>
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
                          <button key={n} className={`w-10 h-10 rounded-lg text-sm font-bold border-2 transition-all cursor-pointer ${editScore === n ? "text-white" : "border-gray-200 hover:border-gray-300"}`} style={editScore === n ? { background: "var(--primary)", borderColor: "var(--primary)" } : { color: "var(--text-muted)" }} onClick={() => setEditScore(n)}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>SV 코멘트</label>
                  <textarea className="w-full rounded-lg px-3 py-2 text-xs border resize-none mb-2" style={{ borderColor: "var(--border)", minHeight: 60 }} value={editSv} onChange={e => setEditSv(e.target.value)} placeholder="SV 코멘트를 입력하세요" />

                  <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주 코멘트</label>
                  <textarea className="w-full rounded-lg px-3 py-2 text-xs border resize-none mb-2" style={{ borderColor: "var(--border)", minHeight: 60 }} value={editOwner} onChange={e => setEditOwner(e.target.value)} placeholder="점주 코멘트를 입력하세요" />

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold border hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => setEditingStep(null)}>취소</button>
                    <button className="flex-1 py-2 rounded-lg text-xs font-bold text-white hover:opacity-90 cursor-pointer" style={{ background: "var(--primary)" }} onClick={() => saveEdit(latestRecord.id)} disabled={savingRecord}>{savingRecord ? "저장 중..." : "저장"}</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 최종 코멘트 */}
        <h3 className="text-[15px] font-bold mt-6 mb-3">최종 코멘트</h3>
        <div className="bg-white rounded-xl p-5 border" style={{ borderColor: "var(--border-light)" }}>
          {pct >= 100 ? (
            editingFinal ? (
              <>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>SV 종합 평가</label>
                <textarea className="w-full rounded-lg px-3 py-2 text-sm border resize-none mb-3" style={{ borderColor: "var(--border)", minHeight: 80 }} value={finalSv} onChange={e => setFinalSv(e.target.value)} />

                <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주 소감</label>
                <textarea className="w-full rounded-lg px-3 py-2 text-sm border resize-none mb-3" style={{ borderColor: "var(--border)", minHeight: 80 }} value={finalOwner} onChange={e => setFinalOwner(e.target.value)} />

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold border hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => setEditingFinal(false)}>취소</button>
                  <button className="flex-1 py-2.5 rounded-lg text-sm font-bold text-white hover:opacity-90 cursor-pointer" style={{ background: "var(--primary)" }} onClick={saveFinalComment} disabled={savingFinal}>{savingFinal ? "저장 중..." : "저장"}</button>
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
                <button className="text-xs font-semibold hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => setEditingFinal(true)}>
                  코멘트 {finalComment ? "수정" : "작성"}
                </button>
              </>
            )
          ) : (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
              모든 단계를 이수하면 최종 코멘트를 작성할 수 있습니다.
            </p>
          )}
        </div>

        {/* AI 분석 결과 */}
        {pct >= 100 && (
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
                  <button className="text-xs font-semibold mt-2 hover:opacity-70 cursor-pointer" style={{ color: "var(--primary)" }} onClick={() => branch && runAiAnalysis(branch, records)}>
                    다시 시도
                  </button>
                </div>
              )}
              {aiAnalysis && !aiLoading && (
                <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, '<br/>').replace(/##\s*(.*?)(<br\/>)/g, '<h4 style="font-size:14px;font-weight:700;color:#1a1a1a;margin-top:16px;margin-bottom:8px">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a1a">$1</strong>').replace(/- (.*?)(<br\/>)/g, '<div style="padding-left:12px;margin-bottom:4px">- $1</div>') }} />
              )}
              {!aiAnalysis && !aiLoading && !aiError && (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>AI 분석 결과가 없습니다.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
