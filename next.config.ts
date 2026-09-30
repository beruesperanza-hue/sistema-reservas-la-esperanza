import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Links cortos para imprimir, poner en el perfil de Instagram o mandar por
  // WhatsApp. Son redirecciones temporales (307) a propósito: si mañana la
  // página de reservas cambia de ruta, el link corto sigue funcionando sin
  // que quede cacheado para siempre en el navegador de la gente.
  async redirects() {
    return [
      { source: '/r', destination: '/reservas', permanent: false },
      { source: '/reservar', destination: '/reservas', permanent: false },
      { source: '/reserva', destination: '/reservas', permanent: false },
      { source: '/p', destination: '/pedidos', permanent: false },
      // La promo de octubre salió primero con este link a 3 clientes, antes de
      // acortarlo: que no les quede roto.
      { source: '/p/promo-octubre', destination: '/p/octubre', permanent: false },
      { source: '/pedir', destination: '/pedidos', permanent: false },
    ];
  },
  experimental: {
    // La importación de clientes manda miles de filas parseadas del
    // CSV/Excel en un solo llamado a la Server Action — el límite por
    // defecto (1mb) se queda corto para un export real de ~2700 clientes.
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
// Force update
