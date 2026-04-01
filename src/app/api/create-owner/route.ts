import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // 요청자 인증 확인 (hq 또는 sv만 허용)
  const serverSupabase = await createServerSupabase();
  const { data: { user: caller } } = await serverSupabase.auth.getUser();

  if (!caller) {
    return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  }

  const callerRole = caller.app_metadata?.role || caller.user_metadata?.role;
  if (callerRole !== "hq" && callerRole !== "sv") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { email, password, branch_id, branch_name } = await request.json();

  if (!email || !password || !branch_id) {
    return NextResponse.json({ error: "이메일, 비밀번호, 지점 ID는 필수입니다." }, { status: 400 });
  }

  // service_role 키로 Admin 클라이언트 생성
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 점주 계정 생성
  const { data, error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role: "owner" },
    user_metadata: { branch_id, branch_name },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user, message: "점주 계정이 생성되었습니다." });
}
