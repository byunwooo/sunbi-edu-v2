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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: branchData, error: branchError } = await supabase.from('branches').select('*');
      if (branchError) { alert('지점 데이터를 불러오는데 실패했습니다.'); console.error(branchError); }

      const { data: recordData, error: recordError } = await supabase.from('records').select('*');
      if (recordError) { alert('기록 데이터를 불러오는데 실패했습니다.'); console.error(recordError); }

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
        <h1 className="text-base font-bold">전체 현황 대시보드</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 요약 */}
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

        {/* 검색 */}
        <input className="w-full rounded-xl px-4 py-3 text-sm border mb-3" style={{ borderColor: "var(--border)" }} placeholder="지점명 또는 점주 검색" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />

        {/* 탭 */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {([["all","전체"],["progress","진행 중"],["complete","완료"]] as const).map(([key, label]) => (
            <button key={key} className={`py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${tab === key ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`} style={tab === key ? { background: "var(--primary)" } : { color: "var(--text-muted)" }} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{filtered.length}개 지점</p>

        {filtered.map(b => (
          <div key={b.id} className={`bg-white rounded-2xl p-5 mb-3 border shadow-sm ${b.isComplete ? "border-green-400" : ""}`} style={{ borderColor: b.isComplete ? undefined : "var(--border-light)" }}>
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

            <div className="h-1 rounded-full mb-4" style={{ background: "var(--bg-warm)" }}>
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
