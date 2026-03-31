"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch } from "@/lib/constants";
import { useAuth, canEdit } from "@/lib/auth-context";

function formatPhone(v: string) {
  const nums = v.replace(/[^0-9]/g, "").slice(0, 11);
  if (nums.length > 7) return nums.slice(0,3) + "-" + nums.slice(3,7) + "-" + nums.slice(7);
  if (nums.length > 3) return nums.slice(0,3) + "-" + nums.slice(3);
  return nums;
}

export default function BranchesPage() {
  const router = useRouter();
  const { role } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ name: "", owner_name: "", phones: [""], start_date: "" });
  const [branchType, setBranchType] = useState<"new" | "existing">("new");
  const [existingComments, setExistingComments] = useState<{ [step: number]: string }>({});
  const [saving, setSaving] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('branches').select('*');
    if (error) { alert('지점 데이터를 불러오는데 실패했습니다.'); console.error(error); }
    setBranches(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBranches(); }, []);

  const filtered = branches.filter(b => b.name.includes(search) || b.owner_name.includes(search));

  const openAdd = () => { setEditing(null); setForm({ name: "", owner_name: "", phones: [""], start_date: new Date().toISOString().slice(0,10) }); setBranchType("new"); setExistingComments({}); setModal(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm({ name: b.name, owner_name: b.owner_name, phones: b.phone ? b.phone.split(", ") : [""], start_date: b.start_date }); setModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.owner_name) { alert("지점명과 점주 이름은 필수입니다."); return; }
    const phoneStr = form.phones.filter(p => p.trim()).join(", ");
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('branches')
          .update({ name: form.name, owner_name: form.owner_name, phone: phoneStr, start_date: form.start_date })
          .eq('id', editing.id);
        if (error) { alert('수정에 실패했습니다.'); console.error(error); setSaving(false); return; }
      } else {
        const lastStep = branchType === "existing" ? 11 : 0;
        const { data: newBranch, error } = await supabase
          .from('branches')
          .insert({ name: form.name, owner_name: form.owner_name, phone: phoneStr, start_date: form.start_date, last_step: lastStep })
          .select()
          .single();
        if (error || !newBranch) { alert('등록에 실패했습니다.'); console.error(error); setSaving(false); return; }

        // 기존 오픈 지점: 11단계 전부 이수 완료 + 코멘트 저장
        if (branchType === "existing") {
          const records = Array.from({ length: 11 }, (_, i) => ({
            branch_id: newBranch.id,
            step: i + 1,
            passed: true,
            score: null,
            sv_comment: existingComments[i + 1] || "",
            owner_comment: "",
          }));
          const { error: recError } = await supabase.from('records').insert(records);
          if (recError) { console.error('기록 저장 실패:', recError); }
        }
      }
      setModal(false);
      await fetchBranches();
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 지점을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('branches').delete().eq('id', id);
    if (error) { alert('삭제에 실패했습니다.'); console.error(error); return; }
    await fetchBranches();
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
        <h1 className="text-base font-bold">지점 관리</h1>
        <button onClick={() => router.push("/dashboard")} className="text-sm opacity-80 hover:opacity-100">뒤로</button>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        <div className="flex gap-2 mb-3">
          <input className="flex-1 rounded-xl px-4 py-3 text-sm border" style={{ borderColor: "var(--border)" }} placeholder="지점명 또는 점주 검색" value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
          <button className="px-4 rounded-xl text-white text-sm font-bold whitespace-nowrap shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "var(--primary)" }} onClick={openAdd}>+ 지점등록</button>
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>전체 <strong style={{ color: "var(--text)" }}>{filtered.length}개</strong> 지점</p>

        {filtered.map(b => {
          const statusColor = b.last_step >= CURRICULUM_STEPS.length ? "var(--success)" : b.last_step > 0 ? "#e67e22" : "#95a5a6";
          const statusLabel = b.last_step >= CURRICULUM_STEPS.length ? "완료" : b.last_step > 0 ? "진행 중" : "시작 전";
          const statusBg = b.last_step >= CURRICULUM_STEPS.length ? "rgba(26,122,58,0.08)" : b.last_step > 0 ? "rgba(230,126,34,0.08)" : "rgba(149,165,166,0.08)";
          return (
          <div key={b.id} className="bg-white rounded-2xl p-5 mb-3 border shadow-sm flex justify-between" style={{ borderColor: "var(--border-light)", borderLeftWidth: 4, borderLeftColor: statusColor }}>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">{b.name}</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{b.owner_name} · {b.phone || "연락처 없음"}</p>
              <span className="inline-block text-xs mt-2 px-2 py-0.5 rounded-md" style={{ background: "var(--bg-warm)", color: "var(--text-secondary)" }}>교육 시작일: {b.start_date}</span>
            </div>
            {canEdit(role) && (
              <div className="flex flex-col justify-center gap-1.5">
                <button className="text-xs font-bold px-3 py-1.5 rounded-lg border-2 hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: "var(--primary)", color: "var(--primary)" }} onClick={() => openEdit(b)}>수정</button>
                <button className="text-xs font-bold px-3 py-1.5 rounded-lg border-2 hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => handleDelete(b.id)}>삭제</button>
              </div>
            )}
          </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-base font-semibold" style={{ color: "var(--text-secondary)" }}>등록된 지점이 없습니다</p>
            <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>상단의 &apos;+ 지점등록&apos; 버튼으로 추가하세요</p>
          </div>
        )}
      </main>

      {/* 모달 */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-extrabold mb-5">{editing ? "지점 수정" : "지점 등록"}</h2>

            {/* 신규/기존 선택 (등록 시에만) */}
            {!editing && (
              <div className="mb-5">
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>등록 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${branchType === "new" ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`}
                    style={branchType === "new" ? { background: "var(--primary)" } : { color: "var(--text-muted)" }}
                    onClick={() => setBranchType("new")}
                  >
                    신규 교육
                  </button>
                  <button
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${branchType === "existing" ? "text-white border-transparent" : "border-gray-200 hover:border-gray-300"}`}
                    style={branchType === "existing" ? { background: "var(--success)" } : { color: "var(--text-muted)" }}
                    onClick={() => setBranchType("existing")}
                  >
                    기존 오픈 지점
                  </button>
                </div>
                {branchType === "existing" && (
                  <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>이미 교육이 완료된 지점입니다. 8단계 전체 이수 완료로 등록됩니다.</p>
                )}
              </div>
            )}

            <label className="block text-xs font-bold mb-1 mt-4" style={{ color: "var(--text-secondary)" }}>지점명 <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="w-full rounded-xl px-4 py-3 text-[15px] border" style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }} placeholder="지점명을 입력하세요" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />

            <label className="block text-xs font-bold mb-1 mt-4" style={{ color: "var(--text-secondary)" }}>점주 이름 <span style={{ color: "var(--danger)" }}>*</span></label>
            <input className="w-full rounded-xl px-4 py-3 text-[15px] border" style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }} placeholder="점주 이름을 입력하세요" value={form.owner_name} onChange={e => setForm(f => ({...f, owner_name: e.target.value}))} />

            <label className="block text-xs font-bold mb-1 mt-4" style={{ color: "var(--text-secondary)" }}>핸드폰 번호</label>
            {form.phones.map((phone, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <input className="flex-1 rounded-xl px-4 py-3 text-[15px] border" style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }} placeholder="010-0000-0000" value={phone} onChange={e => { const newPhones = [...form.phones]; newPhones[idx] = formatPhone(e.target.value); setForm(f => ({...f, phones: newPhones})); }} maxLength={13} />
                {form.phones.length > 1 && (
                  <button className="px-3 rounded-xl text-sm font-bold border-2 hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--danger)", color: "var(--danger)" }} onClick={() => setForm(f => ({...f, phones: f.phones.filter((_, i) => i !== idx)}))}>-</button>
                )}
              </div>
            ))}
            <button className="text-xs font-semibold hover:opacity-70 cursor-pointer mt-1" style={{ color: "var(--primary)" }} onClick={() => setForm(f => ({...f, phones: [...f.phones, ""]}))}>+ 연락처 추가</button>

            <label className="block text-xs font-bold mb-1 mt-4" style={{ color: "var(--text-secondary)" }}>교육 시작일</label>
            <input
              type="date"
              className="w-full rounded-xl px-4 py-3 text-[15px] border cursor-pointer"
              style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }}
              value={form.start_date}
              onChange={e => setForm(f => ({...f, start_date: e.target.value}))}
              onClick={e => (e.target as HTMLInputElement).showPicker?.()}
              min="2024-01-01"
              max="2036-12-31"
            />

            {/* 기존 오픈 지점: 단계별 코멘트 입력 */}
            {!editing && branchType === "existing" && (
              <div className="mt-5">
                <label className="block text-xs font-bold mb-2" style={{ color: "var(--text-secondary)" }}>단계별 코멘트 (선택)</label>
                {CURRICULUM_STEPS.map(step => (
                  <div key={step.id} className="mb-2">
                    <label className="block text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>{step.id}단계 - {step.short}</label>
                    <input
                      className="w-full rounded-lg px-3 py-2 text-xs border"
                      style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }}
                      placeholder="코멘트 (선택사항)"
                      value={existingComments[step.id] || ""}
                      onChange={e => setExistingComments(prev => ({ ...prev, [step.id]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button className="py-3.5 rounded-xl font-semibold border text-[15px] hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => setModal(false)}>취소</button>
              <button className="py-3.5 rounded-xl font-bold text-white text-[15px] shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "var(--primary)" }} onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : "저장"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
