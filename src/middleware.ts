import { NextRequest, NextResponse } from 'next/server';
import { logger } from './lib/logger';

/**
 * Middleware para medir performance de API requests
 * - Agrega header X-Response-Time
 * - Logea requests lentas (> 1000ms)
 * - Monitorea todas las rutas /api/*
 */
export function middleware(request: NextRequest) {
  const start = Date.now();
  const url = request.nextUrl.pathname;

  // Solo procesar API routes
  if (!url.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Crear response y medir tiempo
  const response = NextResponse.next();
  
  // Calcular duración después de procesar
  response.headers.set('X-Request-Start', start.toString());
  
  // Log asíncrono para no bloquear request
  Promise.resolve().then(() => {
    const duration = Date.now() - start;
    
    // Header de timing para debugging
    response.headers.set('X-Response-Time', `${duration}ms`);

    // Log de requests lentas (> 1 segundo)
    if (duration > 1000) {
      logger.warn('Slow API request detected', {
        url,
        method: request.method,
        duration: `${duration}ms`,
        userAgent: request.headers.get('user-agent'),
      });
    }

    // Log normal para todas las requests
    logger.debug('API request completed', {
      url,
      method: request.method,
      duration: `${duration}ms`,
    });
  });

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
