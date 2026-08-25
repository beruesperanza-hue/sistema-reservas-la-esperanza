import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionToken } from '@/lib/adminSession';

// Protege /admin y /api/admin/* con una sesión real (ver lib/auth.ts). Antes
// de esto la cookie admin_token no se validaba contra nada: alcanzaba con que
// existiera. /admin es la propia pantalla de login, así que queda afuera.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const valido = verifySessionToken(request.cookies.get('admin_token')?.value);

  if (pathname.startsWith('/api/admin')) {
    if (!valido) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (pathname !== '/admin' && !valido) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
