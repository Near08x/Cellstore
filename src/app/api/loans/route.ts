export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabaseServer';
import { apiHandler, ApiError } from '@/lib/api-handler';
import { logger } from '@/lib/logger';
import { createLoanSchema, processPaymentSchema, updateLoanSchema } from '@/schemas';
import * as loansService from '@/modules/loans/loans.service';
import type { CreateLoanInput, ProcessPaymentInput, UpdateLoanInput } from '@/schemas';

// =======================
//    Helpers
// =======================
function toLocalYYYYMMDD(d?: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('en-CA');
}

// =======================
// GET: Listar préstamos completos (con cliente, cuotas y pagos)
// =======================
export const GET = apiHandler(async () => {
  logger.info('GET /api/loans - Fetching all loans');

  // Usar servicio para obtener préstamos con agregados
  const loans = await loansService.getAllLoans();

  // Obtener clientes para el selector
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, name, email');

  if (clientError) {
    logger.error('Failed to fetch clients', { error: clientError });
    throw new ApiError('Failed to fetch clients', 500);
  }

  logger.info('Loans fetched successfully', { count: loans.length });
  return NextResponse.json({ loans, clients });
});

// =======================
// POST: Crear préstamo
// =======================
export const POST = apiHandler(async (request) => {
  logger.info('POST /api/loans - Creating new loan');

  const body = await request.json();
  const validated = createLoanSchema.parse(body) as CreateLoanInput;

  // Crear préstamo usando servicio
  const loan = await loansService.createLoan(validated);

  // Actualizar capital disponible
  await updateCapitalOnLoanCreation(loan.principal);

  logger.info('Loan created successfully', { loanId: loan.id });
  revalidatePath('/loans');
  
  return NextResponse.json(loan, { status: 201 });
});

// =======================
// PUT: Actualizar préstamo
// =======================
export const PUT = apiHandler(async (request) => {
  logger.info('PUT /api/loans - Updating loan');

  const body = await request.json();
  const validated = updateLoanSchema.parse(body) as UpdateLoanInput;

  if (!validated.id) {
    throw new ApiError('Loan ID is required', 400);
  }

  const loan = await loansService.updateLoan(validated);

  logger.info('Loan updated successfully', { loanId: loan.id });
  revalidatePath('/loans');
  
  return NextResponse.json(loan);
});

// =======================
// PATCH: Procesar pago
// =======================
export const PATCH = apiHandler(async (request) => {
  logger.info('PATCH /api/loans - Processing payment');

  const body = await request.json();
  const validated = processPaymentSchema.parse(body) as ProcessPaymentInput;

  // Procesar pago usando servicio
  const loan = await loansService.processPayment(validated);

  // Actualizar capital con el efectivo recibido
  const netCashIn = Number(validated.paymentAmount || 0);
  const capitalTotal = await updateCapitalOnPayment(netCashIn);

  logger.info('Payment processed successfully', { loanId: loan.id });
  revalidatePath('/loans');
  
  return NextResponse.json({
    message: 'Pago procesado correctamente',
    loan,
    updatedLoan: loan,
    totalPending: loan.totalPending,
    capitalTotal,
  });
});

// =======================
// DELETE: Eliminar préstamo
// =======================
export const DELETE = apiHandler(async (request) => {
  logger.info('DELETE /api/loans - Deleting loan');

  const { id } = await request.json();

  if (!id) {
    throw new ApiError('Loan ID is required', 400);
  }

  await loansService.deleteLoan(id);

  logger.info('Loan deleted successfully', { loanId: id });
  revalidatePath('/loans');
  
  return NextResponse.json({ message: 'Loan deleted successfully' });
});

// =======================
//    Capital Helpers
// =======================

/**
 * Actualiza capital disponible al crear préstamo
 */
async function updateCapitalOnLoanCreation(principal: number): Promise<void> {
  try {
    const { data: cap } = await supabase
      .from('capital')
      .select('id, total')
      .eq('id', 1)
      .maybeSingle();

    const current = Number(cap?.total ?? 0);
    let newTotal: number;

    if (current >= principal) {
      newTotal = current - principal;
    } else {
      // Si el capital actual es menor, se aumenta por el excedente
      const excedente = principal - current;
      newTotal = excedente;
    }

    await supabase.from('capital').upsert({ id: 1, total: newTotal });
    logger.info('Capital updated after loan creation', { previous: current, new: newTotal });
  } catch (error) {
    logger.warn('Failed to update capital after loan creation', { error });
  }
}

/**
 * Actualiza capital con el pago recibido
 */
async function updateCapitalOnPayment(netCashIn: number): Promise<number | null> {
  try {
    if (!netCashIn || isNaN(netCashIn) || netCashIn === 0) {
      return null;
    }

    const { data: cap } = await supabase
      .from('capital')
      .select('id, total')
      .eq('id', 1)
      .maybeSingle();

    const current = Number(cap?.total ?? 0);
    const newTotal = current + netCashIn;

    await supabase.from('capital').upsert({ id: 1, total: newTotal });
    logger.info('Capital updated after payment', { previous: current, new: newTotal });
    
    return newTotal;
  } catch (error) {
    logger.warn('Failed to update capital after payment', { error });
    return null;
  }
}
