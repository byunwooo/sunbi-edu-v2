"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch, type Record, type CompletionRequest } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";

function getToday() {
  const d = new Date();
  const w = ["일","월","화","수","목","금","토"];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${w[d.getDay()]}요일`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, role, signOut } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [requests, setRequests] = useState<CompletionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<CompletionRequest | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: branchData, error: branchError } = await supabase.from('branches').select('*');
      if (branchError) { alert('지점 데이터를 불러오는데 실패했습니다.'); console.error(branchError); }

      const { data: recordData, error: recordError } = await supabase.from('records').select('*');
      if (recordError) { alert('기록 데이터를 불러오는데 실패했습니다.'); console.error(recordError); }

      const { data: requestData } = await supabase.from('completion_requests').select('*').eq('status', 'pending');

      setBranches(branchData || []);
      setRecords(recordData || []);
      setRequests(requestData || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewModal || !user) return;
    setReviewSaving(true);
    const { error } = await supabase.from('completion_requests').update({
      status,
      reviewer_id: user.id,
      reviewer_comment: reviewComment,
      reviewed_at: new Date().toISOString(),
    }).eq('id', reviewModal.id);
    if (error) {
      alert('처리에 실패했습니다.');
      console.error(error);
    } else {
      // 승인 시 교육 기록(records) 자동 생성
      if (status === 'approved') {
        const step = CURRICULUM_STEPS.find(s => s.id === reviewModal.step);
        const checklistStatus: { [key: string]: boolean } = {};
        step?.checklist.forEach(item => { checklistStatus[item.id] = true; });
        await supabase.from('records').insert({
          branch_id: reviewModal.branch_id,
          step: reviewModal.step,
          passed: true,
          score: null,
          sv_comment: reviewComment || '',
          owner_comment: reviewModal.owner_message || '',
          checklist_status: checklistStatus,
        });
      }
      setRequests(prev => prev.filter(r => r.id !== reviewModal.id));
      setReviewModal(null);
      setReviewComment("");
    }
    setReviewSaving(false);
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
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm" style={{ borderColor: "var(--border-light)" }}>
        <div className="max-w-xl mx-auto px-5 pt-8 pb-4 flex justify-between items-center">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{getToday()}</p>
            <h1 className="text-xl font-extrabold mt-0.5">안녕하세요</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: role === "hq" ? "rgba(139,26,26,0.1)" : "rgba(52,152,219,0.1)", color: role === "hq" ? "var(--primary)" : "#3498db" }}>
                {role === "hq" ? "본사 관리자" : "SV"}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{user?.email}</span>
            </div>
          </div>
          <button onClick={async () => { await signOut(); router.push("/"); }} className="text-xs font-semibold px-3.5 py-2 rounded-lg border hover:opacity-70 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 메뉴 카드 */}
        <Link href="/record" className="block rounded-2xl p-5 mb-3 shadow-lg hover:opacity-95 transition-opacity no-underline" style={{ background: "var(--primary)" }}>
          <h2 className="text-[17px] font-bold text-white">교육 기록 입력</h2>
          <p className="text-[13px] mt-1" style={{ color: "rgba(255,255,255,0.7)" }}>지점별 교육 내용 및 평가 기록</p>
        </Link>

        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/branches" className="block bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow no-underline" style={{ borderColor: "var(--border-light)" }}>
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>지점 관리</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>등록 및 목록 관리</p>
          </Link>
          <Link href="/overview" className="block bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow no-underline" style={{ borderColor: "var(--border-light)" }}>
            <h3 className="text-[15px] font-bold" style={{ color: "var(--text)" }}>전체 현황</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>진행률 & 분석</p>
          </Link>
        </div>

        {/* 교육 진행 중 */}
        {requests.length > 0 && (() => {
          const grouped = requests.reduce<{ [branchId: string]: CompletionRequest[] }>((acc, req) => {
            if (!acc[req.branch_id]) acc[req.branch_id] = [];
            acc[req.branch_id].push(req);
            return acc;
          }, {});

          return (
            <div className="mb-6">
              <h2 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                교육 진행 중
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "#3498db" }}>{requests.length}</span>
              </h2>
              {Object.entries(grouped).map(([branchId, branchReqs]) => {
                const reqBranch = branches.find(b => b.id === branchId);
                const isExpanded = expandedRequest === branchId;
                return (
                  <div key={branchId} className="bg-white rounded-2xl mb-2 border shadow-sm overflow-hidden" style={{ borderColor: "rgba(52,152,219,0.3)", borderLeftWidth: 4, borderLeftColor: "#3498db" }}>
                    {/* 접힌 상태: 지점명 + 건수 */}
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center" onClick={() => setExpandedRequest(isExpanded ? null : branchId)}>
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-bold">{reqBranch?.name || "알 수 없는 지점"}</p>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(52,152,219,0.1)", color: "#3498db" }}>{branchReqs.length}건 대기</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{reqBranch?.owner_name}</span>
                        <span className="text-xs transition-transform" style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </div>
                    </div>

                    {/* 펼친 상태: 단계별 요청 목록 */}
                    {isExpanded && (
                      <div className="px-4 pb-3 border-t" style={{ borderColor: "rgba(52,152,219,0.15)" }}>
                        {branchReqs.map(req => {
                          const stepInfo = CURRICULUM_STEPS.find(s => s.id === req.step);
                          return (
                            <div key={req.id} className="mt-3 p-3 rounded-xl cursor-pointer hover:opacity-80 transition-opacity" style={{ background: "rgba(52,152,219,0.04)", border: "1px solid rgba(52,152,219,0.12)" }} onClick={() => { setReviewModal(req); setReviewComment(""); }}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-[13px] font-semibold">{stepInfo?.label}</p>
                                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{new Date(req.created_at).toLocaleDateString("ko-KR")} 시작</p>
                                </div>
                                <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(52,152,219,0.1)", color: "#3498db" }}>평가하기 →</span>
                              </div>
                              {req.owner_message && (
                                <div className="text-xs mt-2 p-2 rounded-lg" style={{ background: "var(--bg-warm)", color: "var(--text-secondary)" }}>
                                  <span className="font-semibold">점주 어려웠던 점:</span> {req.owner_message}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* 교육 현황 */}
        {(() => {
          const branchList = branches.map(branch => {
            const branchRecords = records.filter(r => r.branch_id === branch.id);
            const completedSteps = new Set(branchRecords.filter(r => r.passed).map(r => r.step)).size;
            const pct = Math.round((completedSteps / CURRICULUM_STEPS.length) * 100);
            const status = pct >= 100 ? "complete" : pct > 0 ? "progress" : "notStarted";
            return { ...branch, branchRecords, completedSteps, pct, status };
          });
          const completeCount = branchList.filter(b => b.status === "complete").length;
          const progressCount = branchList.filter(b => b.status === "progress").length;
          const notStartedCount = branchList.filter(b => b.status === "notStarted").length;

          return (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-bold">교육 현황</h2>
                <div className="flex gap-2">
                  {completeCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(26,122,58,0.1)", color: "var(--success)" }}>{completeCount} 완료</span>}
                  {progressCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(230,126,34,0.1)", color: "#e67e22" }}>{progressCount} 진행 중</span>}
                  {notStartedCount > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(149,165,166,0.1)", color: "#95a5a6" }}>{notStartedCount} 시작 전</span>}
                </div>
              </div>
              {branchList.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>등록된 지점이 없습니다</p>
                </div>
              )}
              {branchList.map(branch => {
                const statusColor = branch.status === "complete" ? "var(--success)" : branch.status === "progress" ? "#e67e22" : "#95a5a6";
                const statusBorder = branch.status === "complete" ? "rgba(26,122,58,0.3)" : branch.status === "progress" ? "rgba(230,126,34,0.3)" : "var(--border-light)";
                const statusLabel = branch.status === "complete" ? "완료" : branch.status === "progress" ? "진행 중" : "시작 전";
                const statusBg = branch.status === "complete" ? "rgba(26,122,58,0.08)" : branch.status === "progress" ? "rgba(230,126,34,0.08)" : "rgba(149,165,166,0.08)";
                const isExpanded = expandedBranch === branch.id;

                return (
                  <div key={branch.id} className="bg-white rounded-2xl mb-3 border shadow-sm overflow-hidden" style={{ borderColor: statusBorder, borderLeftWidth: 4, borderLeftColor: statusColor }}>
                    {/* 접힌 상태: 지점명 + 상태 + 퍼센트 */}
                    <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex justify-between items-center" onClick={() => setExpandedBranch(isExpanded ? null : branch.id)}>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold">{branch.name}</h3>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold" style={{ color: statusColor }}>{branch.pct}%</span>
                        <span className="text-xs transition-transform" style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                      </div>
                    </div>

                    {/* 펼친 상태: 상세 정보 */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--border-light)" }}>
                        <div className="flex justify-between items-center mt-3 mb-3">
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{branch.owner_name} · {branch.branchRecords.length}건 기록</p>
                          <p className="text-xs font-semibold" style={{ color: statusColor }}>{branch.completedSteps}/{CURRICULUM_STEPS.length}단계</p>
                        </div>

                        {/* 프로그레스 바 */}
                        <div className="h-1.5 rounded-full mb-4" style={{ background: "var(--bg-warm)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${branch.pct}%`, background: statusColor }} />
                        </div>

                        {/* 단계 칩 */}
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          {CURRICULUM_STEPS.map(step => {
                            const done = branch.branchRecords.some(r => r.step === step.id && r.passed);
                            return (
                              <div key={step.id} className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: done ? "var(--success-bg)" : "var(--bg-warm)", color: done ? "var(--success)" : "var(--text-muted)", opacity: done ? 1 : 0.4 }}>
                                {step.id}
                              </div>
                            );
                          })}
                        </div>

                        {/* 상세 보기 버튼 */}
                        <button className="w-full py-2.5 rounded-xl text-xs font-semibold border hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: statusBorder, color: statusColor, background: statusBg }} onClick={() => router.push(`/branch/${branch.id}`)}>
                          상세 보기 →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          );
        })()}
      </main>

      {/* 교육 평가 모달 (이수/미이수) */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-extrabold mb-1">교육 평가</h2>
            <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
              {branches.find(b => b.id === reviewModal.branch_id)?.name} · {branches.find(b => b.id === reviewModal.branch_id)?.owner_name}
            </p>
            <p className="text-sm font-semibold mb-4" style={{ color: "var(--primary)" }}>
              {CURRICULUM_STEPS.find(s => s.id === reviewModal.step)?.label}
            </p>

            {reviewModal.owner_message && (
              <div className="text-xs p-3 rounded-lg mb-4" style={{ background: "rgba(52,152,219,0.06)", border: "1px solid rgba(52,152,219,0.15)" }}>
                <span className="font-semibold" style={{ color: "#3498db" }}>점주가 어려웠던 점:</span>
                <p className="mt-1" style={{ color: "var(--text-secondary)" }}>{reviewModal.owner_message}</p>
              </div>
            )}

            <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>점주가 어려워했던 점 (선택)</label>
            <textarea
              className="w-full rounded-xl px-4 py-3 text-[14px] border mb-5 resize-none"
              style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }}
              placeholder="교육하면서 점주가 어려워했던 부분을 적어주세요"
              rows={3}
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
            />

            <div className="grid grid-cols-3 gap-2">
              <button className="py-3 rounded-xl font-semibold border text-[14px] hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => setReviewModal(null)}>닫기</button>
              <button className="py-3 rounded-xl font-bold text-white text-[14px] shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "var(--danger)" }} onClick={() => handleReview('rejected')} disabled={reviewSaving}>미이수</button>
              <button className="py-3 rounded-xl font-bold text-white text-[14px] shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "var(--success)" }} onClick={() => handleReview('approved')} disabled={reviewSaving}>이수</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
