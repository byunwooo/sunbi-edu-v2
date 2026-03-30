"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch } from "@/lib/constants";

export default function RecordPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [stepId, setStepId] = useState("");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [ownerComment, setOwnerComment] = useState("");
  const [svComment, setSvComment] = useState("");

  useEffect(() => {
    async function fetchBranches() {
      setLoading(true);
      const { data, error } = await supabase.from('branches').select('*');
      if (error) { alert('지점 데이터를 불러오는데 실패했습니다.'); console.error(error); }
      setBranches(data || []);
      setLoading(false);
    }
    fetchBranches();
  }, []);

  const selectedBranch = branches.find(b => b.id === branchId);

  const handleBranchChange = (id: string) => {
    setBranchId(id);
    const branch = branches.find(b => b.id === id);
    setOwnerName(branch?.owner_name || "");
    setStepId("");
    setPassed(null);
    setScore(null);
  };

  const getAvailableSteps = () => {
    const lastStep = selectedBranch?.last_step || 0;
    return CURRICULUM_STEPS.map(s => ({ ...s, disabled: s.id > lastStep + 1, hint: s.id <= lastStep ? "이수 완료" : s.id === lastStep + 1 ? "현재 단계" : "이전 단계 이수 필요" }));
  };

  const handleSave = async () => {
    if (!branchId || !stepId || passed === null) { alert("필수 항목을 모두 입력해주세요."); return; }
    if (passed && score === null) { alert("점수를 선택해주세요."); return; }

    setSaving(true);
    try {
      // 기록 저장
      const { error: insertError } = await supabase.from('records').insert({
        branch_id: branchId,
        step: parseInt(stepId),
        passed,
        score: passed ? score : null,
        owner_comment: ownerComment,
        sv_comment: svComment,
      });

      if (insertError) {
        alert('기록 저장에 실패했습니다.');
        console.error(insertError);
        setSaving(false);
        return;
      }

      // 이수 완료 시 branches.last_step 업데이트
      if (passed) {
        const currentStep = parseInt(stepId);
        const currentLastStep = selectedBranch?.last_step || 0;
        if (currentStep > currentLastStep) {
          const { error: updateError } = await supabase
            .from('branches')
            .update({ last_step: currentStep })
            .eq('id', branchId);

          if (updateError) {
            console.error('last_step 업데이트 실패:', updateError);
          }
        }
      }

      alert("교육 기록이 저장되었습니다.");
      router.push("/dashboard");
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setSaving(false);
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
        <h1 className="text-base font-bold">교육 기록 입력</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 지점 선택 */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>지점 <span style={{ color: "var(--danger)" }}>*</span></label>
          <div className="relative">
            <select className="w-full appearance-none rounded-xl px-4 py-3.5 text-[15px] border cursor-pointer" style={{ background: branchId ? "rgba(139,26,26,0.05)" : "white", borderColor: branchId ? "var(--primary)" : "var(--border)" }} value={branchId} onChange={e => handleBranchChange(e.target.value)}>
              <option value="">지점 선택</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          </div>
        </div>

        {/* 점주 이름 (자동) */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>점주 이름</label>
          <div className="rounded-xl px-4 py-3.5 text-[15px] border" style={{ background: "var(--bg-warm)", borderColor: "var(--border-light)", color: ownerName ? "var(--text)" : "var(--text-muted)" }}>
            {ownerName || "지점을 선택하면 자동 입력됩니다"}
          </div>
        </div>

        {/* 커리큘럼 단계 */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>커리큘럼 단계 <span style={{ color: "var(--danger)" }}>*</span></label>
          <div className="relative">
            <select className="w-full appearance-none rounded-xl px-4 py-3.5 text-[15px] border cursor-pointer" style={{ background: stepId ? "rgba(139,26,26,0.05)" : "white", borderColor: stepId ? "var(--primary)" : "var(--border)", opacity: !branchId ? 0.5 : 1 }} value={stepId} onChange={e => { setStepId(e.target.value); setPassed(null); setScore(null); }} disabled={!branchId}>
              <option value="">단계 선택</option>
              {getAvailableSteps().map(s => <option key={s.id} value={s.id} disabled={s.disabled}>{s.label} ({s.hint})</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-muted)" }} />
          </div>
        </div>

        {/* 이수 여부 */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>이수 여부 <span style={{ color: "var(--danger)" }}>*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <button className={`py-4 rounded-xl font-semibold text-[15px] border-2 transition-all cursor-pointer ${passed === true ? "border-green-600 bg-green-50 text-green-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`} onClick={() => { setPassed(true); setScore(null); }}>
              O  이수 완료
            </button>
            <button className={`py-4 rounded-xl font-semibold text-[15px] border-2 transition-all cursor-pointer ${passed === false ? "border-red-600 bg-red-50 text-red-700" : "border-gray-200 text-gray-400 hover:border-gray-300"}`} onClick={() => { setPassed(false); setScore(null); }}>
              X  미이수
            </button>
          </div>
        </div>

        {/* 점수 (이수 시) */}
        {passed === true && (
          <div className="mb-5">
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>점수 <span style={{ color: "var(--danger)" }}>*</span></label>
            <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={`py-3.5 rounded-xl text-lg font-bold border-2 transition-all cursor-pointer ${score === n ? "text-white" : "text-gray-400 border-gray-200 hover:border-gray-300"}`} style={score === n ? { background: "var(--primary)", borderColor: "var(--primary)" } : {}} onClick={() => setScore(n)}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "var(--text-muted)" }}>1점 (미흡) ~ 5점 (우수)</p>
          </div>
        )}

        {/* 미이수 경고 */}
        {passed === false && (
          <div className="mb-5 p-4 rounded-xl text-sm leading-relaxed" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
            미이수 처리 시 다음 단계로 넘어갈 수 없습니다. 해당 단계를 재교육 후 이수 완료로 변경해주세요.
          </div>
        )}

        {/* 점주 코멘트 */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>점주 코멘트</label>
          <textarea className="w-full rounded-xl px-4 py-3.5 text-[15px] border resize-none" style={{ borderColor: "var(--border)", minHeight: 100 }} placeholder="점주의 교육 피드백을 입력하세요" value={ownerComment} onChange={e => setOwnerComment(e.target.value)} />
        </div>

        {/* SV 코멘트 */}
        <div className="mb-5">
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>SV 코멘트</label>
          <textarea className="w-full rounded-xl px-4 py-3.5 text-[15px] border resize-none" style={{ borderColor: "var(--border)", minHeight: 100 }} placeholder="교육 내용 요약 및 특이사항을 입력하세요" value={svComment} onChange={e => setSvComment(e.target.value)} />
        </div>

        <button className="w-full py-4 rounded-xl text-white font-bold text-base shadow-md hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "var(--primary)" }} onClick={handleSave} disabled={saving}>
          {saving ? "저장 중..." : "기록 저장"}
        </button>
      </main>
    </div>
  );
}
