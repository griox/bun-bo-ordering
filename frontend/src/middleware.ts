import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // First, run the next-intl middleware to handle locales
  const response = intlMiddleware(request);

  // Check auth
  const token = request.cookies.get('accessToken')?.value;
  const path = request.nextUrl.pathname;

  // Protect these routes (ignoring locale prefix via regex or just checking include)
  const protectedPaths = ['/admin', '/history', '/vouchers'];
  const isProtected = protectedPaths.some((p) => path.includes(p));

  if (isProtected && !token) {
    // Redirect to login page, preserving the locale if present
    // next-intl automatically handles redirect to localized path if we use a relative URL or clone NextUrl
    const url = request.nextUrl.clone();
    url.pathname = '/login'; // Let next-intl handle prefixing if needed, or we just do /login
    return NextResponse.redirect(url);
  }

  // If going to login page but already logged in, redirect to home
  if (path.includes('/login') && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
