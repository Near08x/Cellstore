import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

// Inicializamos next-pwa con opciones
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

//  Definimos la política CSP que permite 'unsafe-eval'
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https:;
  font-src 'self' https:;
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
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'top-right',
  },

  // CORS + CSP headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          //  Política CSP con 'unsafe-eval'
          {
            key: 'Content-Security-Policy',
            value: ContentSecurityPolicy.replace(/\n/g, ''),
          },
          // CORS
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // o tu dominio en producción
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
