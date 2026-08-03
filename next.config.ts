import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
