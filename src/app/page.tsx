"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
      <div className="absolute top-[-100px] right-[-60px] w-[260px] h-[260px] rounded-full opacity-60" style={{ background: "rgba(139,26,26,0.08)" }} />
      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-10">
          <div className="inline-block rounded-full p-3 mb-4" style={{ background: "var(--bg)" }}>
            <img src="/logo.jpeg" alt="선비칼국수 로고" className="w-[80px] h-auto rounded-full" style={{ mixBlendMode: "multiply" }} />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--primary)" }}>선비칼국수</h1>
          <div className="w-7 h-0.5 mx-auto my-3 rounded" style={{ background: "var(--primary)", opacity: 0.25 }} />
          <p className="text-sm tracking-widest" style={{ color: "var(--text-muted)" }}>교육 관리 시스템</p>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-lg text-center">
          <h2 className="text-xl font-bold mb-1">로그인</h2>
          <p className="text-sm mb-7" style={{ color: "var(--text-muted)" }}>본사 관리자 또는 SV 계정으로 로그인하세요</p>

          {error && <div className="text-sm mb-4 p-3 rounded-lg text-left" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>{error}</div>}

          <label className="block text-xs font-bold mb-1.5 tracking-wide text-center" style={{ color: "var(--text-secondary)" }}>이메일</label>
          <input
            className="w-full rounded-xl px-4 py-3.5 text-[15px] text-center mb-5 border transition-colors"
            style={{ background: "var(--bg-warm)", borderColor: "var(--border-light)" }}
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            autoComplete="email"
          />

          <label className="block text-xs font-bold mb-1.5 tracking-wide text-center" style={{ color: "var(--text-secondary)" }}>비밀번호</label>
          <div className="relative mb-6">
            <input
              className="w-full rounded-xl px-4 py-3.5 pr-16 text-[15px] text-center border transition-colors"
              style={{ background: "var(--bg-warm)", borderColor: "var(--border-light)" }}
              type={showPw ? "text" : "password"}
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:opacity-70" onClick={() => setShowPw(!showPw)} style={{ color: "var(--text-muted)" }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            className="w-full py-4 rounded-xl text-white font-bold text-base shadow-md hover:opacity-90 transition-opacity cursor-pointer"
            style={{ background: loading ? "var(--text-muted)" : "var(--primary)" }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>&copy; 2026 (주)GGC 선비칼국수</p>
      </div>
    </div>
  );
}
