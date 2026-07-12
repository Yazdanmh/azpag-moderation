import { getToken } from 'next-auth/jwt';
import { type NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  const backendUrl = new URL(`/api/${path.join('/')}`, BACKEND_URL);
  backendUrl.search = req.nextUrl.search;

  const isStreaming = ['GET', 'HEAD'].includes(req.method);
  const body = isStreaming ? undefined : await req.text();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  const headers = new Headers(req.headers);
  headers.set('Host', backendUrl.host);
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.delete('connection');
  if (token?.access_token) {
    headers.set('Authorization', `Bearer ${token.access_token}`);
  }

  const proxyReq = new Request(backendUrl, {
    method: req.method,
    headers,
    ...(isStreaming ? {} : { body: body || null }),
  });

  try {
    return fetch(proxyReq);
  } catch {
    return new Response(JSON.stringify({ error: 'Backend unreachable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
