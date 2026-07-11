import { getToken } from 'next-auth/jwt';
import { type NextRequest } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;

  const backendUrl = new URL(`/api/${path.join('/')}`, BACKEND_URL);
  backendUrl.search = req.nextUrl.search;

  const proxyReq = new Request(backendUrl, req);

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token?.access_token) {
    proxyReq.headers.set('Authorization', `Bearer ${token.access_token}`);
  }

  proxyReq.headers.delete('Host');

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
