"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch, type Record } from "@/lib/constants";

export default function OverviewPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all"|"progress"|"complete">("all");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: branchData } = await supabase.from("branches").select("*");
      const { data: recordData } = await supabase.from("records").select("*");
      setBranches(branchData || []);
      setRecords(recordData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const branchData = branches.map(b => {
    const branchRecords = records.filter(r => r.branch_id === b.id);
    const completedSteps = Array.from(new Set(branchRecords.filter(r => r.passed).map(r => r.step)));
    const pct = Math.round((completedSteps.length / CURRICULUM_STEPS.length) * 100);
    const scoredRecords = branchRecords.filter(r => r.score);
    const avgScore = scoredRecords.length > 0 ? +(scoredRecords.reduce((s,r) => s + (r.score||0), 0) / scoredRecords.length).toFixed(1) : 0;
    return { ...b, completedSteps, pct, totalRecords: branchRecords.length, avgScore, isComplete: pct >= 100 };
  });

  const filtered = branchData.filter(b => {
    const matchSearch = b.name.includes(search) || b.owner_name.includes(search);
    if (tab === "progress") return matchSearch && !b.isComplete;
    if (tab === "complete") return matchSearch && b.isComplete;
    return matchSearch;
  });

  const completedCount = branchData.filter(b => b.isComplete).length;
  const progressCount = branchData.filter(b => !b.isComplete).length;

  // 단계별 통계
  const stepStats = CURRICULUM_STEPS.map(step => {
    const stepRecords = records.filter(r => r.step === step.id);
    const passed = stepRecords.filter(r => r.passed).length;
    const failed = stepRecords.filter(r => !r.passed).length;
    const scores = stepRecords.filter(r => r.score).map(r => r.score!);
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";
    const failRate = (passed + failed) > 0 ? Math.round((failed / (passed + failed)) * 100) : 0;
    return { ...step, total: stepRecords.length, passed, failed, avg, failRate };
  });

  const runGlobalAnalysis = async () => {
    if (records.length === 0) { setAiError("분석할 교육 기록이 없습니다."); return; }
    setAiLoading(true);
    setAiError("");
    try {
      const enrichedRecords = records.map(r => ({
        ...r,
        branch_id: branches.find(b => b.id === r.branch_id)?.name || r.branch_id,
      }));
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branches, records: enrichedRecords, curriculum: CURRICULUM_STEPS }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error?.includes("credit") ? "AI 크레딧이 부족합니다. 관리자에게 문의하세요." : "AI 분석에 실패했습니다.");
        return;
      }
      setAiAnalysis(data.analysis);
      setShowAnalysis(true);
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

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <header className="text-white py-4 px-5 flex items-center justify-between" style={{ background: "var(--primary)" }}>
        <h1 className="text-base font-bold">전체 현황</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <div className="rounded-2xl p-4 text-center shadow-md" style={{ background: "var(--primary)" }}>
            <p className="text-2xl font-extrabold text-white">{branchData.length}</p>
            <p className="text-xs text-white/70 mt-0.5">전체 지점</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-md" style={{ background: "var(--success)" }}>
            <p className="text-2xl font-extrabold text-white">{completedCount}</p>
            <p className="text-xs text-white/70 mt-0.5">교육 완료</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-md" style={{ background: "var(--warning)" }}>
            <p className="text-2xl font-extrabold text-white">{progressCount}</p>
            <p className="text-xs text-white/70 mt-0.5">진행 중</p>
          </div>
        </div>

        {/* 단계별 현황 테이블 */}
        <h2 className="text-[15px] font-bold mb-3">단계별 현황</h2>
        <div className="bg-white rounded-xl border mb-5 overflow-hidden" style={{ borderColor: "var(--border-light)" }}>
          {stepStats.map((step, i) => (
            <div key={step.id} className={`flex items-center px-4 py-3 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--border-light)" }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mr-3" style={{ background: step.failRate > 20 ? "var(--danger-bg)" : step.passed > 0 ? "var(--success-bg)" : "var(--bg-warm)", color: step.failRate > 20 ? "var(--danger)" : step.passed > 0 ? "var(--success)" : "var(--text-muted)" }}>
                {step.id}
              </div>
              <span className="flex-1 text-sm">{step.short}</span>
              <span className="text-xs mr-2" style={{ color: "var(--success)" }}>{step.passed}</span>
              <span className="text-xs mr-2" style={{ color: step.failed > 0 ? "var(--danger)" : "var(--text-muted)" }}>{step.failed > 0 ? `${step.failed}` : "-"}</span>
              {step.failRate > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded mr-2" style={{ background: step.failRate > 20 ? "var(--danger-bg)" : "var(--warning-bg)", color: step.failRate > 20 ? "var(--danger)" : "var(--warning)" }}>{step.failRate}%</span>}
              <span className="text-xs font-bold w-8 text-right" style={{ color: "var(--primary)" }}>{step.avg}</span>
            </div>
          ))}
        </div>

        {/* AI 전체 분석 */}
        <button
          className="w-full py-3.5 rounded-xl font-bold text-[15px] shadow-md hover:opacity-90 transition-opacity cursor-pointer mb-5"
          style={{ background: aiLoading ? "var(--text-muted)" : "var(--primary)", color: "white" }}
          onClick={runGlobalAnalysis}
          disabled={aiLoading}
        >
          {aiLoading ? "AI 분석 중... (약 15초)" : aiAnalysis ? "AI 전체 분석 다시 실행" : "AI 전체 분석 실행"}
        </button>

        {aiError && (
          <div className="p-3 rounded-xl mb-4 text-sm" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>{aiError}</div>
        )}

        {aiAnalysis && showAnalysis && (
          <div className="bg-white rounded-xl border p-5 mb-5" style={{ borderColor: "var(--border-light)" }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[15px] font-bold" style={{ color: "var(--primary)" }}>AI 전체 분석 결과</h2>
              <button className="text-xs hover:opacity-70 cursor-pointer" style={{ color: "var(--text-muted)" }} onClick={() => setShowAnalysis(false)}>접기</button>
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\n/g, "<br/>").replace(/##\s*(.*?)(<br\/>)/g, '<h4 style="font-size:14px;font-weight:700;color:#1a1a1a;margin-top:16px;margin-bottom:8px">$1</h4>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a1a">$1</strong>').replace(/\| /g, "| ").replace(/- (.*?)(<br\/>)/g, '<div style="padding-left:12px;margin-bottom:4px">- $1</div>') }} />
          </div>
        )}

        {/* 지점 목록 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold">지점 목록</h2>
        </div>

        <input className="w-full rounded-xl px-4 py-3 text-sm border mb-3" style={{ borderColor: "var(--border)" }} placeholder="지점명 또는 점주 검색" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />

        <div className="grid grid-cols-3 gap-2 mb-4">
          {([["all","전체"],["progress","진행 중"],["complete","완료"]] as const).map(([key, label]) => (
            <button key={key} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${tab === key ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`} style={tab === key ? { background: "var(--primary)" } : { color: "var(--text-muted)" }} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{filtered.length}개 지점</p>

        {filtered.map(b => (
          <div key={b.id} className={`bg-white rounded-2xl p-5 mb-3 border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${b.isComplete ? "border-green-400" : ""}`} style={{ borderColor: b.isComplete ? undefined : "var(--border-light)" }} onClick={() => router.push(`/branch/${b.id}`)}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">{b.name}</h3>
                  {b.isComplete && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--success-bg)", color: "var(--success)" }}>완료</span>}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{b.owner_name} / 기록 {b.totalRecords}건 / 평균 {b.avgScore}점</p>
              </div>
              <span className="text-2xl font-extrabold" style={{ color: b.isComplete ? "var(--success)" : "var(--primary)" }}>{b.pct}%</span>
            </div>
            <div className="h-1 rounded-full mb-3" style={{ background: "var(--bg-warm)" }}>
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.isComplete ? "var(--success)" : "var(--primary)" }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CURRICULUM_STEPS.map(step => {
                const done = b.completedSteps.includes(step.id);
                return (
                  <span key={step.id} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg" style={{ background: done ? "var(--success-bg)" : "var(--bg-warm)", color: done ? "var(--success)" : "var(--text-muted)", fontWeight: done ? 600 : 400 }}>
                    {step.id} {step.short}
                  </span>
                );
              })}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>검색 결과가 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
