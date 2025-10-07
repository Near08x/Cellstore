import type { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

// Inicializamos next-pwa con opciones
const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

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
  // ✅ Propiedades válidas de devIndicators
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'top-right',
  },

  // ✅ Opcional: permitir peticiones desde dominios específicos (CORS)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // o pon tu dominio: 'https://cluster-fsmcisrvfbb5cr5mvra3hr3qyg.cloudworkstations.dev'
          },
        ],
      },
    ];
  },
};

export default withPWA(nextConfig);
