// Firma/verificación del token de sesión de admin. Usa Web Crypto
// (globalThis.crypto.subtle) en vez de node:crypto porque este módulo lo
// importa también middleware.ts, que corre en el runtime Edge — ahí
// createHmac/timingSafeEqual de node:crypto no funcionan de verdad (fallan
// en silencio, la firma nunca valida). Web Crypto sí está disponible tanto
// en Edge como en Node (18.19+/20+), así que un solo algoritmo sirve para
// los dos lugares donde se usa (login en Node, verificación en Edge).
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmac(payload: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toHex(sig);
}

/**
 * Token de sesión de admin: username + timestamp + firma HMAC, todo en un
 * string base64url. No hace falta guardar sesiones en la base — alcanza con
 * poder verificar la firma y la expiración al vuelo (ver verifySessionToken).
 */
export async function generateSessionToken(username: string): Promise<string> {
  const payload = `${username}.${Date.now()}`;
  const sig = await hmac(payload);
  return toBase64Url(`${payload}.${sig}`);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  try {
    const decoded = fromBase64Url(token);
    const [username, ts, sig] = decoded.split('.');
    if (!username || !ts || !sig) return false;

    const expected = await hmac(`${username}.${ts}`);

    // Comparación en tiempo constante sin node:crypto (no disponible en Edge).
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
    if (diff !== 0) return false;

    return Date.now() - Number(ts) < SESSION_MAX_AGE_MS;
  } catch {
    return false;
  }
}
