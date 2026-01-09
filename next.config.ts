import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';
import bundleAnalyzer from '@next/bundle-analyzer';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// 🚀 CSP totalmente permisiva (bypass completo)
const openCSP = `
  default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
  script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
  script-src-elem * 'unsafe-inline' 'unsafe-eval' data: blob:;
  style-src * 'unsafe-inline' 'unsafe-eval' data:;
  style-src-elem * 'unsafe-inline' 'unsafe-eval' data:;
  img-src * data: blob:;
  connect-src *;
  font-src * data:;
  frame-src *;
`;

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Permitir que el build continúe sin variables de entorno en build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },


  // � Optimizaciones de rendimiento - Fase 1
  compiler: {
    // Remover console.log en producción
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  experimental: {
    // Optimizar imports de paquetes grandes
    optimizePackageImports: ['recharts', 'lucide-react', 'date-fns'],
  },

  // �🔓 CORS + CSP sin restricciones
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: openCSP.replace(/\n/g, ' '),
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(withPWA(nextConfig));
