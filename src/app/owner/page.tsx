"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CURRICULUM_STEPS, type Branch, type Record, type CompletionRequest } from "@/lib/constants";
import { useAuth } from "@/lib/auth-context";
import { CheckCircle2, Circle, Star, ChevronDown, ChevronUp, LogOut, BookOpen, Play, Clock, XCircle, MessageSquare } from "lucide-react";
import { MANUAL_CONTENT } from "@/lib/manual-content";

function getToday() {
  const d = new Date();
  const w = ["일","월","화","수","목","금","토"];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 ${w[d.getDay()]}요일`;
}

export default function OwnerPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [manualStep, setManualStep] = useState<number | null>(null);
  const [noBranch, setNoBranch] = useState(false);
  const [requests, setRequests] = useState<CompletionRequest[]>([]);
  const [requestModal, setRequestModal] = useState<number | null>(null);
  const [requestMsg, setRequestMsg] = useState("");
  const [requestSaving, setRequestSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      // user_metadata에서 branch_id 가져오기
      const branchId = user!.user_metadata?.branch_id || user!.app_metadata?.branch_id;

      if (!branchId) {
        setNoBranch(true);
        setLoading(false);
        return;
      }

      const { data: branchData } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .single();

      if (!branchData) {
        setNoBranch(true);
        setLoading(false);
        return;
      }

      const { data: recordData } = await supabase
        .from("records")
        .select("*")
        .eq("branch_id", branchId);

      const { data: requestData } = await supabase
        .from("completion_requests")
        .select("*")
        .eq("branch_id", branchId);

      setBranch(branchData);
      setRecords(recordData || []);
      setRequests(requestData || []);
      setLoading(false);
    }
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)" }}>로딩 중...</p>
      </div>
    );
  }

  if (noBranch) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <p className="text-lg font-bold mb-2">연결된 지점이 없습니다</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>담당 SV 또는 본사에 문의해주세요.</p>
          <button onClick={async () => { await signOut(); router.push("/"); }} className="text-sm font-semibold px-4 py-2 rounded-lg border hover:opacity-70" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 교육 시작 (모달 없이 바로)
  const startEducation = async (step: number) => {
    if (!user || !branch) return;
    const { data, error } = await supabase.from("completion_requests").insert({
      branch_id: branch.id,
      step,
      owner_id: user.id,
      owner_message: "",
    }).select().single();
    if (error) {
      alert("교육 시작에 실패했습니다.");
      console.error(error);
    } else if (data) {
      setRequests(prev => [...prev, data]);
    }
  };

  // 어려웠던 점 저장 (모달에서)
  const submitMessage = async (step: number) => {
    if (!user || !branch) return;
    setRequestSaving(true);
    const existingPending = requests.find(r => r.step === step && r.status === "pending");
    if (existingPending) {
      const { error } = await supabase.from("completion_requests")
        .update({ owner_message: requestMsg })
        .eq("id", existingPending.id);
      if (error) {
        alert("저장에 실패했습니다.");
        console.error(error);
      } else {
        setRequests(prev => prev.map(r => r.id === existingPending.id ? { ...r, owner_message: requestMsg } : r));
        setRequestModal(null);
        setRequestMsg("");
      }
    }
    setRequestSaving(false);
  };

  const completedSteps = new Set(records.filter(r => r.passed).map(r => r.step));
  const totalSteps = CURRICULUM_STEPS.length;
  const pct = Math.round((completedSteps.size / totalSteps) * 100);

  // 소요일수 계산
  const startDate = branch?.start_date ? new Date(branch.start_date) : null;
  const today = new Date();
  const daysDiff = startDate ? Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* 헤더 */}
      <header className="bg-white border-b shadow-sm" style={{ borderColor: "var(--border-light)" }}>
        <div className="max-w-xl mx-auto px-5 pt-8 pb-4 flex justify-between items-center">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{getToday()}</p>
            <h1 className="text-xl font-extrabold mt-0.5">{branch?.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(139,26,26,0.1)", color: "var(--primary)" }}>
                점주
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>{branch?.owner_name}</span>
            </div>
          </div>
          <button onClick={async () => { await signOut(); router.push("/"); }} className="text-xs font-semibold px-3.5 py-2 rounded-lg border hover:opacity-70 transition-opacity" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <LogOut size={14} className="inline mr-1" />로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-6">
        {/* 진행 상황 카드 */}
        <div className="bg-white rounded-2xl p-6 mb-5 shadow-sm border" style={{ borderColor: "var(--border-light)" }}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-[15px] font-bold">내 교육 진행률</h2>
              {daysDiff !== null && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>교육 시작 {daysDiff}일차</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-3xl font-extrabold" style={{ color: pct >= 100 ? "var(--success)" : pct > 0 ? "#e67e22" : "#95a5a6" }}>{pct}%</span>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{completedSteps.size}/{totalSteps}단계 완료</p>
            </div>
          </div>
          <div className="h-2 rounded-full" style={{ background: "var(--bg-warm)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? "var(--success)" : pct > 0 ? "#e67e22" : "#95a5a6" }} />
          </div>
        </div>

        {/* 단계별 커리큘럼 */}
        <h2 className="text-[15px] font-bold mb-3">단계별 교육 현황</h2>

        {CURRICULUM_STEPS.map(step => {
          const stepRecord = records.find(r => r.step === step.id && r.passed);
          const failedRecord = records.find(r => r.step === step.id && !r.passed);
          const isCompleted = !!stepRecord;
          const isFailed = !isCompleted && !!failedRecord;
          const latestRequest = requests.filter(r => r.step === step.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          const isRejected = !isCompleted && latestRequest?.status === "rejected";
          const isExpanded = expandedStep === step.id;
          const checklistStatus = stepRecord?.checklist_status || failedRecord?.checklist_status || {};

          const statusColor = isCompleted ? "var(--success)" : isRejected ? "var(--danger)" : isFailed ? "#e67e22" : "#95a5a6";
          const statusBg = isCompleted ? "rgba(26,122,58,0.08)" : isRejected ? "rgba(231,76,60,0.08)" : isFailed ? "rgba(230,126,34,0.08)" : "rgba(149,165,166,0.05)";
          const statusLabel = isCompleted ? "이수" : isRejected ? "반려" : isFailed ? "진행 중" : "미시작";

          return (
            <div key={step.id} className="bg-white rounded-2xl mb-3 border shadow-sm overflow-hidden" style={{ borderColor: isCompleted ? "rgba(26,122,58,0.3)" : isRejected ? "rgba(231,76,60,0.3)" : "var(--border-light)", borderLeftWidth: 4, borderLeftColor: statusColor }}>
              <button
                className="w-full px-5 py-4 flex items-center justify-between text-left"
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                style={{ background: statusBg }}
              >
                <div className="flex items-center gap-3">
                  {isCompleted
                    ? <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
                    : <Circle size={20} style={{ color: statusColor }} />
                  }
                  <div>
                    <p className="text-[14px] font-bold">{step.label}</p>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={18} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--text-muted)" }} />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 pt-2">
                  {/* 매뉴얼 학습 / 교육 시작 버튼 */}
                  {(() => {
                    const hasStarted = requests.some(r => r.step === step.id);
                    if (!hasStarted && !isCompleted) {
                      // 교육 시작 전 — 교육 시작 버튼
                      return (
                        <button
                          className="w-full mb-3 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 text-white shadow-sm hover:opacity-90 transition-opacity"
                          style={{ background: "#3498db" }}
                          onClick={() => startEducation(step.id)}
                        >
                          <Play size={14} /> 교육 시작
                        </button>
                      );
                    }
                    // 교육 시작 후 — 매뉴얼 학습 버튼
                    return (
                      <button
                        className="w-full mb-3 py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 border transition-all"
                        style={{
                          borderColor: manualStep === step.id ? "var(--primary)" : "var(--border-light)",
                          background: manualStep === step.id ? "rgba(139,26,26,0.05)" : "var(--bg-warm)",
                          color: manualStep === step.id ? "var(--primary)" : "var(--text-secondary)",
                        }}
                        onClick={() => setManualStep(manualStep === step.id ? null : step.id)}
                      >
                        <BookOpen size={14} />
                        {manualStep === step.id ? "매뉴얼 닫기" : "매뉴얼 학습"}
                      </button>
                    );
                  })()}

                  {/* 매뉴얼 콘텐츠 */}
                  {manualStep === step.id && (() => {
                    const manual = MANUAL_CONTENT.find(m => m.stepId === step.id);
                    if (!manual) return null;
                    return (
                      <div className="mb-4 p-4 rounded-xl border" style={{ background: "rgba(139,26,26,0.02)", borderColor: "rgba(139,26,26,0.15)" }}>
                        <p className="text-xs font-semibold mb-3" style={{ color: "var(--primary)" }}>{manual.overview}</p>
                        {manual.sections.map(section => (
                          <div key={section.checklistId} className="mb-3 last:mb-0">
                            <p className="text-[12px] font-bold mb-1" style={{ color: "var(--text)" }}>{section.title}</p>
                            <div className="text-[11px] leading-relaxed whitespace-pre-wrap font-[inherit]">
                              {section.content.split('\n').map((line, li) => {
                                const isImportant = line.includes('★');
                                const displayLine = line.replace(/★/g, '');
                                return (
                                  <span key={li} style={{ color: isImportant ? "var(--danger)" : "var(--text-secondary)", fontWeight: isImportant ? 700 : 400 }}>
                                    {isImportant && '⚠ '}{displayLine}{'\n'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* 체크리스트 */}
                  <div className="space-y-2">
                    {step.checklist.map(item => {
                      const checked = checklistStatus[item.id] === true;
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-[13px]">
                          {checked
                            ? <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                            : <Circle size={16} style={{ color: "#ccc" }} />
                          }
                          <span style={{ color: checked ? "var(--text)" : "var(--text-muted)" }}>
                            {item.required && <Star size={12} className="inline mr-1" style={{ color: "#e67e22", fill: "#e67e22" }} />}
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* 교육 시작/진행 상태 */}
                  {!isCompleted && (() => {
                    const stepRequests = requests.filter(r => r.step === step.id).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                    const latestReq = stepRequests[0];

                    // 교육 진행 중 (SV 평가 대기)
                    if (latestReq?.status === "pending") {
                      return (
                        <div className="mt-3">
                          <div className="p-3 rounded-xl" style={{ background: "rgba(52,152,219,0.08)", border: "1px solid rgba(52,152,219,0.2)" }}>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={14} style={{ color: "#3498db" }} />
                              <span className="text-[12px] font-semibold" style={{ color: "#3498db" }}>교육 진행 중</span>
                              <span className="text-[11px] ml-auto" style={{ color: "var(--text-muted)" }}>{new Date(latestReq.created_at).toLocaleDateString("ko-KR")} 시작</span>
                            </div>
                            {latestReq.owner_message && (
                              <div className="text-[11px] p-2 rounded-lg mb-2" style={{ background: "rgba(52,152,219,0.05)" }}>
                                <span className="font-semibold">내가 어려웠던 점:</span> {latestReq.owner_message}
                              </div>
                            )}
                            {!latestReq.owner_message && (
                              <button
                                className="w-full py-2 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 border hover:opacity-80 transition-opacity"
                                style={{ borderColor: "rgba(52,152,219,0.3)", color: "#3498db" }}
                                onClick={() => { setRequestModal(step.id); setRequestMsg(""); }}
                              >
                                <MessageSquare size={12} /> 어려웠던 점 작성하기
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // 미이수 (재교육 필요)
                    if (latestReq?.status === "rejected") {
                      return (
                        <div className="mt-3">
                          <div className="p-3 rounded-xl mb-2" style={{ background: "var(--danger-bg)", border: "1px solid rgba(231,76,60,0.2)" }}>
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle size={14} style={{ color: "var(--danger)" }} />
                              <span className="text-[12px] font-semibold" style={{ color: "var(--danger)" }}>미이수 — 재교육 필요</span>
                            </div>
                            {latestReq.reviewer_comment && (
                              <div className="text-[11px] mt-1 p-2 rounded-lg" style={{ background: "rgba(231,76,60,0.05)" }}>
                                <span className="font-semibold">SV 피드백:</span> {latestReq.reviewer_comment}
                              </div>
                            )}
                            {latestReq.owner_message && (
                              <div className="text-[11px] mt-1 p-2 rounded-lg" style={{ background: "rgba(231,76,60,0.05)" }}>
                                <span className="font-semibold">내가 어려웠던 점:</span> {latestReq.owner_message}
                              </div>
                            )}
                          </div>
                          <button
                            className="w-full py-2.5 rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 border hover:opacity-80 transition-opacity"
                            style={{ borderColor: "#3498db", color: "#3498db" }}
                            onClick={() => startEducation(step.id)}
                          >
                            <Play size={14} /> 재교육 시작
                          </button>
                        </div>
                      );
                    }

                    // 이수 완료된 이전 기록 표시 (approved)
                    if (latestReq?.status === "approved") {
                      return (
                        <div className="mt-3 p-3 rounded-xl" style={{ background: "var(--success-bg)", border: "1px solid rgba(26,122,58,0.2)" }}>
                          {latestReq.reviewer_comment && (
                            <div className="text-[11px] p-2 rounded-lg mb-1" style={{ background: "rgba(26,122,58,0.05)" }}>
                              <span className="font-semibold">SV 피드백:</span> {latestReq.reviewer_comment}
                            </div>
                          )}
                          {latestReq.owner_message && (
                            <div className="text-[11px] p-2 rounded-lg" style={{ background: "rgba(26,122,58,0.05)" }}>
                              <span className="font-semibold">내가 어려웠던 점:</span> {latestReq.owner_message}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // 아직 시작 안 한 단계 — 교육 시작 버튼은 상단으로 이동됨
                    return null;
                  })()}

                  {/* 점수 & 코멘트 */}
                  {(stepRecord || failedRecord) && (
                    <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--border-light)" }}>
                      {stepRecord?.score && (
                        <p className="text-xs mb-2">
                          <span className="font-semibold">평가 점수:</span>{" "}
                          <span style={{ color: "var(--primary)", fontWeight: 700 }}>{stepRecord.score}/5</span>
                        </p>
                      )}
                      {(stepRecord?.sv_comment || failedRecord?.sv_comment) && (
                        <div className="text-xs p-3 rounded-lg mb-2" style={{ background: "var(--bg-warm)" }}>
                          <span className="font-semibold">SV 코멘트:</span> {stepRecord?.sv_comment || failedRecord?.sv_comment}
                        </div>
                      )}
                      {stepRecord?.started_at && (
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                          이수일: {new Date(stepRecord.created_at).toLocaleDateString("ko-KR")}
                          {stepRecord.started_at && ` (소요 ${Math.ceil((new Date(stepRecord.created_at).getTime() - new Date(stepRecord.started_at).getTime()) / (1000 * 60 * 60 * 24))}일)`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 전체 완료 시 축하 메시지 */}
        {pct >= 100 && (
          <div className="mt-5 p-6 rounded-2xl text-center" style={{ background: "var(--success-bg)" }}>
            <p className="text-lg font-extrabold" style={{ color: "var(--success)" }}>교육 전 과정을 이수했습니다!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>수고하셨습니다. 성공적인 매장 운영을 응원합니다.</p>
          </div>
        )}

        {/* 어려웠던 점 작성 모달 */}
        {requestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-5" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-extrabold mb-1">어려웠던 점 작성</h2>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                {CURRICULUM_STEPS.find(s => s.id === requestModal)?.label}
              </p>

              <label className="block text-xs font-bold mb-1" style={{ color: "var(--text-secondary)" }}>어려웠던 점</label>
              <textarea
                className="w-full rounded-xl px-4 py-3 text-[14px] border mb-5 resize-none"
                style={{ borderColor: "var(--border)", background: "var(--bg-warm)" }}
                placeholder="교육을 받으면서 어려웠던 점을 적어주세요"
                rows={3}
                value={requestMsg}
                onChange={e => setRequestMsg(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <button className="py-3.5 rounded-xl font-semibold border text-[15px] hover:opacity-80 transition-opacity cursor-pointer" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }} onClick={() => setRequestModal(null)}>취소</button>
                <button className="py-3.5 rounded-xl font-bold text-white text-[15px] shadow-sm hover:opacity-90 transition-opacity cursor-pointer" style={{ background: "#3498db" }} onClick={() => submitMessage(requestModal)} disabled={requestSaving}>{requestSaving ? "저장 중..." : "저장"}</button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-8 mb-4" style={{ color: "var(--text-muted)" }}>&copy; 2026 (주)GGC 선비칼국수</p>
      </main>
    </div>
  );
}
