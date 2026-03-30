"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch, type Record } from "@/lib/constants";

export default function AnalysisPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: b } = await supabase.from("branches").select("*");
      const { data: r } = await supabase.from("records").select("*");
      setBranches(b || []);
      setRecords(r || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAnalyze = async () => {
    if (records.length === 0) { setError("분석할 교육 기록이 없습니다. 먼저 교육 기록을 입력해주세요."); return; }

    setAnalyzing(true);
    setError("");
    setAnalysis(null);

    try {
      // branch_id를 이름으로 매핑
      const enrichedRecords = records.map(r => ({
        ...r,
        branch_id: branches.find(b => b.id === r.branch_id)?.name || r.branch_id,
      }));

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branches,
          records: enrichedRecords,
          curriculum: CURRICULUM_STEPS,
        }),
      });

      if (!res.ok) throw new Error("분석 요청 실패");

      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError("AI 분석에 실패했습니다. 다시 시도해주세요.");
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // 간단한 통계
  const totalRecords = records.length;
  const passedRecords = records.filter(r => r.passed).length;
  const failedRecords = records.filter(r => !r.passed).length;
  const avgScore = records.filter(r => r.score).length > 0
    ? (records.filter(r => r.score).reduce((s, r) => s + (r.score || 0), 0) / records.filter(r => r.score).length).toFixed(1)
    : "-";

  // 단계별 통계
  const stepStats = CURRICULUM_STEPS.map(step => {
    const stepRecords = records.filter(r => r.step === step.id);
    const passed = stepRecords.filter(r => r.passed).length;
    const failed = stepRecords.filter(r => !r.passed).length;
    const scores = stepRecords.filter(r => r.score).map(r => r.score!);
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : "-";
    return { ...step, total: stepRecords.length, passed, failed, avg };
  });

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
        <h1 className="text-base font-bold">AI 교육 분석</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 요약 통계 */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <div className="bg-white rounded-xl p-3 text-center border" style={{ borderColor: "var(--border-light)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--primary)" }}>{totalRecords}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>총 기록</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border" style={{ borderColor: "var(--border-light)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--success)" }}>{passedRecords}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>이수</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border" style={{ borderColor: "var(--border-light)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--danger)" }}>{failedRecords}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>미이수</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center border" style={{ borderColor: "var(--border-light)" }}>
            <p className="text-xl font-extrabold" style={{ color: "var(--primary)" }}>{avgScore}</p>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>평균 점수</p>
          </div>
        </div>

        {/* 단계별 현황 */}
        <h2 className="text-[15px] font-bold mb-3">단계별 현황</h2>
        <div className="bg-white rounded-xl border mb-5 overflow-hidden" style={{ borderColor: "var(--border-light)" }}>
          {stepStats.map((step, i) => (
            <div key={step.id} className={`flex items-center px-4 py-3 ${i > 0 ? "border-t" : ""}`} style={{ borderColor: "var(--border-light)" }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold mr-3" style={{ background: step.passed > 0 ? "var(--success-bg)" : "var(--bg-warm)", color: step.passed > 0 ? "var(--success)" : "var(--text-muted)" }}>
                {step.id}
              </div>
              <span className="flex-1 text-sm">{step.short}</span>
              <span className="text-xs mr-3" style={{ color: "var(--success)" }}>{step.passed}이수</span>
              <span className="text-xs mr-3" style={{ color: step.failed > 0 ? "var(--danger)" : "var(--text-muted)" }}>{step.failed}미이수</span>
              <span className="text-xs font-bold w-10 text-right" style={{ color: "var(--primary)" }}>{step.avg}</span>
            </div>
          ))}
        </div>

        {/* AI 분석 버튼 */}
        <button
          className="w-full py-4 rounded-xl text-white font-bold text-base shadow-md hover:opacity-90 transition-opacity cursor-pointer mb-5"
          style={{ background: analyzing ? "var(--text-muted)" : "var(--primary)" }}
          onClick={handleAnalyze}
          disabled={analyzing}
        >
          {analyzing ? "AI 분석 중... (약 10초 소요)" : "AI 교육 분석 시작"}
        </button>

        {error && <div className="text-sm mb-4 p-3 rounded-lg" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{error}</div>}

        {/* AI 분석 결과 */}
        {analysis && (
          <div className="bg-white rounded-xl border p-5" style={{ borderColor: "var(--border-light)" }}>
            <h2 className="text-[15px] font-bold mb-4" style={{ color: "var(--primary)" }}>AI 분석 결과</h2>
            <div className="prose prose-sm max-w-none text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: analysis.replace(/\n/g, '<br/>').replace(/##\s*(.*?)(<br\/>)/g, '<h3 class="text-base font-bold mt-4 mb-2" style="color:#1a1a1a">$1</h3>').replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a1a">$1</strong>').replace(/- (.*?)(<br\/>)/g, '<div style="padding-left:12px;margin-bottom:4px">• $1</div>') }} />
          </div>
        )}
      </main>
    </div>
  );
}
