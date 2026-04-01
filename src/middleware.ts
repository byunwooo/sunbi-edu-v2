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

  // 비인증 사용자 → 로그인 페이지로
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 인증 사용자가 로그인 페이지 접근 → 역할별 리다이렉트
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = role === 'owner' ? '/owner' : '/dashboard';
    return NextResponse.redirect(url);
  }

  // owner가 관리자 페이지 접근 차단
  if (user && role === 'owner' && isAdminRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/owner';
    return NextResponse.redirect(url);
  }

  // hq/sv가 owner 페이지 접근 차단
  if (user && role !== 'owner' && isOwnerRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.jpeg|api/).*)'],
};
