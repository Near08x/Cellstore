import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
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
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'top-right',
  },

  // 🔓 CORS + CSP sin restricciones
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

export default withPWA(nextConfig);
