// Firma/verificación del token de sesión de admin. Vive separado de
// lib/auth.ts (que usa bcryptjs) porque este módulo lo importa también
// middleware.ts, y bcryptjs no corre en el runtime de Middleware.
import { createHmac, timingSafeEqual } from 'crypto';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: string): string {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Token de sesión de admin: username + timestamp + firma HMAC, todo en un
 * string base64url. No hace falta guardar sesiones en la base — alcanza con
 * poder verificar la firma y la expiración al vuelo (ver verifySessionToken).
 */
export function generateSessionToken(username: string): string {
  const payload = `${username}.${Date.now()}`;
  return Buffer.from(`${payload}.${sign(payload)}`).toString('base64url');
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [username, ts, sig] = decoded.split('.');
    if (!username || !ts || !sig) return false;

    const expected = sign(`${username}.${ts}`);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      timingSafeEqual(a, a);
      return false;
    }
    if (!timingSafeEqual(a, b)) return false;

    return Date.now() - Number(ts) < SESSION_MAX_AGE_MS;
  } catch {
    return false;
  }
}
