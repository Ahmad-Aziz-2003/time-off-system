import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'auth-storage';

type CookieState = {
  state?: {
    employee?: {
      role?: 'EMPLOYEE' | 'MANAGER';
    } | null;
    isAuthenticated?: boolean;
  };
};

const readAuthFromCookie = (request: NextRequest): CookieState | null => {
  const value = request.cookies.get(AUTH_COOKIE)?.value;
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value)) as CookieState;
  } catch {
    return null;
  }
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const auth = readAuthFromCookie(request);
  const isAuthenticated = Boolean(auth?.state?.isAuthenticated);
  const role = auth?.state?.employee?.role;

  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/request')) && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/manager')) {
    if (!isAuthenticated || role !== 'MANAGER') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname.startsWith('/login') && isAuthenticated) {
    const destination = role === 'MANAGER' ? '/manager' : '/dashboard';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*', '/request/:path*', '/manager/:path*'],
};
