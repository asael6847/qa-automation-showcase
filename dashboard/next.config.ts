import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // SSR: el dashboard consume el backend FastAPI en cada request, con fallback a
  // los JSON estáticos (ver lib/data.ts). `output: 'standalone'` produce un
  // bundle autocontenido ideal para una imagen Docker mínima (next start).
  output: 'standalone',
  images: { unoptimized: true },
};

export default nextConfig;
