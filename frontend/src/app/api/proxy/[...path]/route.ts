import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function handleProxy(request: NextRequest) {
  // context.params could be a Promise in Next.js 15+, but let's just use the URL
  const path = request.nextUrl.pathname.replace(/^\/api\/proxy/, '');
  const searchParams = request.nextUrl.search;
  const url = `${BACKEND_URL}${path}${searchParams}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cookie');
  headers.delete('connection');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let body: BodyInit | null = request.body;
  const method = request.method;

  // Intercept refresh token request
  if (path === '/api/identity/refresh-token' && method === 'POST') {
    const refreshToken = cookieStore.get('refreshToken')?.value;
    
    if (!refreshToken || !token) {
        return NextResponse.json({ message: 'No tokens available' }, { status: 401 });
    }
    
    body = JSON.stringify({
        accessToken: token,
        refreshToken: refreshToken
    });
    headers.set('Content-Type', 'application/json');
  } 
  
  // Intercept logout request (simulate frontend logout)
  if (path === '/api/identity/logout' && method === 'POST') {
    const nextResponse = NextResponse.json({ message: 'Logged out successfully' });
    nextResponse.cookies.delete('accessToken');
    nextResponse.cookies.delete('refreshToken');
    return nextResponse;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      duplex: 'half',
      redirect: 'manual',
    } as RequestInit);

    const contentType = response.headers.get('content-type') || '';

    // Intercept successful login/refresh to save cookies
    if (response.ok && contentType.includes('application/json') && 
       (path === '/api/identity/login' || path === '/api/identity/google-login' || path === '/api/identity/refresh-token')) {
        
        const data = await response.json();
        
        const nextResponse = NextResponse.json(data, { 
            status: response.status,
            statusText: response.statusText,
        });

        const newAccessToken = data.token || data.Token;
        const newRefreshToken = data.refreshToken || data.RefreshToken;

        if (newAccessToken) {
            nextResponse.cookies.set('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60, // 1 hour
            });
        }

        if (newRefreshToken) {
            nextResponse.cookies.set('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60, // 7 days
            });
        }

        return nextResponse;
    }

    // Pass through other responses
    const nextResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
    });
    
    response.headers.forEach((value, key) => {
        if (!['set-cookie', 'content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
            nextResponse.headers.set(key, value);
        }
    });

    return nextResponse;
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
