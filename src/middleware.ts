import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/';
  const isOwnerRoute = request.nextUrl.pathname.startsWith('/owner');
  const isAdminRoute = !isLoginPage && !isOwnerRoute;
  const role = user?.app_metadata?.role || user?.user_metadata?.role || null;

  // 리다이렉트 시 세션 쿠키를 유지하는 헬퍼
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  };

  // 비인증 사용자 → 로그인 페이지로
  if (!user && !isLoginPage) {
    return redirectTo('/');
  }

  // 인증 사용자가 로그인 페이지 접근 → 역할별 리다이렉트
  if (user && isLoginPage) {
    return redirectTo(role === 'owner' ? '/owner' : '/dashboard');
  }

  // owner가 관리자 페이지 접근 차단
  if (user && role === 'owner' && isAdminRoute) {
    return redirectTo('/owner');
  }

  // hq/sv가 owner 페이지 접근 차단
  if (user && role !== 'owner' && isOwnerRoute) {
    return redirectTo('/dashboard');
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpeg|api/).*)'],
};
