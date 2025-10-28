import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

// 🔐 Política CSP segura (producción)
const prodCSP = `
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: https:;
  connect-src 'self' https:;
  font-src 'self' https:;
`;

// 🧪 Política CSP permisiva (desarrollo)
const devCSP = `
  default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
  script-src * 'unsafe-inline' 'unsafe-eval' data: blob:;
  style-src * 'unsafe-inline' data:;
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
  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const ContentSecurityPolicy = isDev ? devCSP : prodCSP;

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ' '),
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: isDev ? '*' : 'https://tu-dominio.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);