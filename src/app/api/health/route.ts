import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

/**
 * Health check endpoint con validación de dependencias
 * - Verifica conexión a Supabase
 * - Reporta uso de memoria
 * - Retorna 503 si alguna dependencia falla
 */
export async function GET() {
  const checks = {
    status: 'ok' as 'ok' | 'degraded' | 'error',
    timestamp: new Date().toISOString(),
    service: 'studio-app',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
    },
    database: 'checking...' as string,
  };

  // Check Supabase connection
  try {
    const { error } = await supabase
      .from('clients')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) {
      checks.database = `error: ${error.message}`;
      checks.status = 'degraded';
    } else {
      checks.database = 'connected';
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'unknown error';
    checks.database = `error: ${errorMsg}`;
    checks.status = 'error';
  }

  // Determine HTTP status
  const httpStatus = checks.status === 'ok' ? 200 : 503;

  return NextResponse.json(checks, { status: httpStatus });
}
