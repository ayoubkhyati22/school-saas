import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = ['/login', '/setup'];

export async function middleware(req: NextRequest) {
  // IMPORTANT: must create response first, then pass to supabase so it can
  // set/refresh the session cookie on the response headers.
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // This call refreshes the session if expired and writes the updated cookie
  // to `res`. Always await it even if you don't use the return value.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Unauthenticated user trying to access protected page → login
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user on login/setup → dashboard
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Return the response with refreshed session cookie
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
