import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  const isPublicPage = pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/register');
    
    if (!token && !isPublicPage) 
    {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token && (pathname === '/login' || pathname === '/register')) return NextResponse.redirect(new URL('/feed', request.url));
    return NextResponse.next();
  }

export const config = {
  matcher: 
  [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|$).*)',
    '/' 
  ],
};