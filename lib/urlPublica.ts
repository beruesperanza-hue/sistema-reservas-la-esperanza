import type { NextRequest } from 'next/server';

/**
 * URL absoluta para redirigir. Detrás del proxy de Railway `request.url` trae
 * el host interno del contenedor (localhost:8080), así que un redirect armado
 * con eso manda al navegador a una dirección que no existe.
 */
export function urlPublicaDesde(request: NextRequest, ruta: string): URL {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return new URL(ruta, request.url);
  const protocolo = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return new URL(ruta, `${protocolo}://${host}`);
}
