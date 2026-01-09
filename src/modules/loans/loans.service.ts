/**
 * Loans Service Module
 * 
 * Business logic layer for loan operations
 * Orchestrates between calculator and repository
 */

import type { Loan, Installment } from '@/lib/types';
import type { CreateLoanInput, ProcessPaymentInput, UpdateLoanInput } from '@/schemas';
import * as calculator from './loans.calculator';
import * as repository from './loans.repository';
import { logger } from '@/lib/logger';

// =========================
//    OBTENER PRÉSTAMOS
// =========================

/**
 * Obtiene todos los préstamos con sus agregados calculados
 * 
 * Recupera todos los préstamos de la base de datos y recalcula
 * los agregados (pending, overdue, lateFee, amountApplied) en base
 * a las cuotas actuales.
 * 
 * @returns Array de préstamos con agregados actualizados
 * @throws Error si hay problemas de conexión con la base de datos
 * 
 * @example
 * ```typescript
 * const loans = await getAllLoans();
 * console.log(loans[0].totalPending); // Monto pendiente recalculado
 * ```
 */
export async function getAllLoans(): Promise<Loan[]> {
  const loans = await repository.getAllLoans();
  
  // Recalcular agregados para cada préstamo
  return loans.map(loan => {
    const aggregates = calculator.computeLoanAggregates(loan.installments);
    return {
      ...loan,
      totalPending: aggregates.totalPending,
      overdueAmount: aggregates.overdueAmount,
      lateFee: aggregates.sumLateFees,
      amountApplied: aggregates.amountApplied,
    };
  });
}

/**
 * Obtiene un préstamo por ID con agregados calculados
 * 
 * @param loanId - ID del préstamo a recuperar
 * @returns Préstamo con agregados actualizados, o null si no existe
 * @throws Error si hay problemas de conexión con la base de datos
 * 
 * @example
 * ```typescript
 * const loan = await getLoanById('123');
 * if (loan) {
 *   console.log(loan.totalPending);
 *   console.log(loan.overdueAmount);
 * }
 * ```
 */
export async function getLoanById(loanId: string): Promise<Loan | null> {
  const loan = await repository.getLoanById(loanId);
  if (!loan) return null;

  const aggregates = calculator.computeLoanAggregates(loan.installments);
  return {
    ...loan,
    totalPending: aggregates.totalPending,
    overdueAmount: aggregates.overdueAmount,
    lateFee: aggregates.sumLateFees,
    amountApplied: aggregates.amountApplied,
  };
}

// =========================
//    CREAR PRÉSTAMO
// =========================

/**
 * Crea un nuevo préstamo con sus cuotas
 * 
 * Proceso completo:
 * 1. Calcula las cuotas usando el calculator
 * 2. Calcula el monto total a pagar
 * 3. Genera un número único de préstamo
 * 4. Crea el registro del préstamo en la base de datos
 * 5. Crea todas las cuotas asociadas
 * 6. Retorna el préstamo completo con sus cuotas
 * 
 * @param input - Datos del préstamo a crear (validados con Zod schema)
 * @returns Préstamo creado con todas sus cuotas
 * @throws Error si falla la creación o no se puede recuperar el préstamo creado
 * 
 * @example
 * ```typescript
 * const newLoan = await createLoan({
 *   client_id: '123',
 *   client_name: 'Juan Pérez',
 *   principal: 10000,
 *   interestRate: 12,
 *   loanTerm: 12,
 *   loanType: 'Mensual',
 *   startDate: '2025-01-01',
 *   cashier: 'Cajero 1'
 * });
 * console.log(newLoan.loan_number); // "LOAN-1735555555555-123"
 * console.log(newLoan.installments.length); // 12
 * ```
 */
export async function createLoan(input: CreateLoanInput): Promise<Loan> {
  logger.info('Creating new loan', { clientId: input.client_id, principal: input.principal });

  // 1. Calcular cuotas
  const calculatedInstallments = calculator.calculateInstallments(
    input.principal,
    input.interestRate,
    input.loanTerm,
    input.loanType,
    input.startDate
  );

  // 2. Calcular monto total
  const totalAmount = calculator.calculateTotalAmount(
    input.principal,
    input.interestRate,
    input.loanTerm,
    input.loanType
  );

  // 3. Generar número de préstamo
  const loanNumber = await generateLoanNumber();

  // 4. Crear registro de préstamo
  const loanData = {
    loan_number: loanNumber,
    client_id: input.client_id,
    client_name: input.client_name,
    principal: input.principal,
    interest_rate: input.interestRate,
    loan_term: input.loanTerm,
    loan_type: input.loanType,
    loan_date: calculator.todayLocal(),
    start_date: input.startDate,
    due_date: calculatedInstallments[calculatedInstallments.length - 1]?.dueDate ?? null,
    amount: input.principal,
    amount_to_pay: totalAmount,
    amount_applied: 0,
    overdue_amount: 0,
    late_fee: 0,
    total_pending: totalAmount,
    status: 'Pendiente',
    cashier: input.cashier,
  };

  const loanId = await repository.createLoan(loanData);

  // 5. Crear cuotas
  const installmentsData = calculatedInstallments.map(inst => ({
    installment_number: inst.installmentNumber,
    due_date: inst.dueDate,
    principal_amount: inst.principal_amount,
    interest_amount: inst.interest_amount,
    paid_amount: 0,
    late_fee: 0,
    status: 'Pendiente',
    payment_date: null,
  }));

  await repository.createInstallments(loanId, installmentsData);

  logger.info('Loan created successfully', { loanId, loanNumber });

  // 6. Retornar préstamo creado
  const createdLoan = await getLoanById(loanId);
  if (!createdLoan) throw new Error('Failed to retrieve created loan');
  
  return createdLoan;
}

// =========================
//    PROCESAR PAGO
// =========================

/**
 * Procesa un pago en un préstamo
 * 
 * Proceso:
 * 1. Recupera el préstamo y sus cuotas
 * 2. Distribuye el pago entre cuotas pendientes (más antiguas primero)
 * 3. Actualiza las cuotas afectadas (paidAmount, status, paymentDate)
 * 4. Recalcula los agregados del préstamo
 * 5. Actualiza el estado del préstamo (Pagado si totalPending = 0)
 * 6. Retorna el préstamo actualizado
 * 
 * @param input - Datos del pago (loanId, paymentAmount, paymentDate opcional)
 * @returns Préstamo actualizado con el pago aplicado
 * @throws Error si el préstamo no existe o no hay cuotas pendientes
 * 
 * @example
 * ```typescript
 * const updatedLoan = await processPayment({
 *   loanId: '123',
 *   paymentAmount: 500,
 *   paymentDate: '2025-12-30'
 * });
 * console.log(updatedLoan.amountApplied); // Monto total pagado
 * console.log(updatedLoan.totalPending); // Monto pendiente actualizado
 * ```
 */
export async function processPayment(input: ProcessPaymentInput): Promise<Loan> {
  logger.info('Processing payment', { loanId: input.loanId, amount: input.paymentAmount });

  // 1. Obtener préstamo actual
  const loan = await repository.getLoanById(input.loanId);
  if (!loan) throw new Error('Loan not found');

  // 2. Distribuir pago entre cuotas
  const distributions = calculator.distributePayment(
    loan.installments,
    input.paymentAmount
  );

  if (distributions.length === 0) {
    throw new Error('No pending installments to apply payment');
  }

  // 3. Actualizar cuotas
  const paymentDate = input.paymentDate ?? calculator.todayLocal();
  const installmentUpdates = distributions.map(dist => {
    const installment = loan.installments.find(
      i => i.installmentNumber === dist.installmentNumber
    );
    if (!installment?.id) throw new Error('Installment not found');

    return {
      id: Number(installment.id),
      data: {
        paid_amount: dist.newPaidAmount,
        status: dist.newStatus,
        payment_date: dist.newStatus === 'Pagado' ? paymentDate : null,
      },
    };
  });

  await repository.updateInstallments(installmentUpdates);

  // 4. Recalcular agregados del préstamo
  const updatedInstallments = loan.installments.map(inst => {
    const dist = distributions.find(d => d.installmentNumber === inst.installmentNumber);
    if (!dist) return inst;

    return {
      ...inst,
      paidAmount: dist.newPaidAmount,
      status: dist.newStatus as 'Pendiente' | 'Pagado' | 'Parcial' | 'Atrasado',
      payment_date: dist.newStatus === 'Pagado' ? paymentDate : null,
      paymentDate: dist.newStatus === 'Pagado' ? paymentDate : null,
    };
  });

  const aggregates = calculator.computeLoanAggregates(updatedInstallments);

  // 5. Actualizar préstamo
  const allPaid = aggregates.totalPending === 0;
  await repository.updateLoan(input.loanId, {
    amount_applied: aggregates.amountApplied,
    total_pending: aggregates.totalPending,
    overdue_amount: aggregates.overdueAmount,
    late_fee: aggregates.sumLateFees,
    status: allPaid ? 'Pagado' : 'Aprobado',
  });

  logger.info('Payment processed successfully', { 
    loanId: input.loanId, 
    installmentsUpdated: distributions.length 
  });

  // 6. Retornar préstamo actualizado
  const updatedLoan = await getLoanById(input.loanId);
  if (!updatedLoan) throw new Error('Failed to retrieve updated loan');
  
  return updatedLoan;
}

// =========================
//    ACTUALIZAR PRÉSTAMO
// =========================

/**
 * Actualiza un préstamo existente
 * 
 * Permite actualizar campos específicos del préstamo:
 * - status: Estado del préstamo
 * - lateFee: Mora total
 * - amountApplied: Monto pagado
 * - totalPending: Monto pendiente
 * 
 * @param input - Datos a actualizar (solo los campos presentes se modifican)
 * @returns Préstamo actualizado
 * @throws Error si el préstamo no existe
 * 
 * @example
 * ```typescript
 * const updated = await updateLoan({
 *   id: '123',
 *   status: 'Rechazado',
 *   lateFee: 50
 * });
 * console.log(updated.status); // "Rechazado"
 * ```
 */
export async function updateLoan(input: UpdateLoanInput): Promise<Loan> {
  logger.info('Updating loan', { loanId: input.id });

  const updates: any = {};
  if (input.status !== undefined) updates.status = input.status;
  if (input.lateFee !== undefined) updates.late_fee = input.lateFee;
  if (input.amountApplied !== undefined) updates.amount_applied = input.amountApplied;
  if (input.totalPending !== undefined) updates.total_pending = input.totalPending;

  await repository.updateLoan(input.id, updates);

  const updatedLoan = await getLoanById(input.id);
  if (!updatedLoan) throw new Error('Failed to retrieve updated loan');
  
  logger.info('Loan updated successfully', { loanId: input.id });
  return updatedLoan;
}

// =========================
//    ELIMINAR PRÉSTAMO
// =========================

/**
 * Elimina un préstamo y sus cuotas
 * 
 * ADVERTENCIA: Esta operación es irreversible.
 * Elimina el préstamo y todas sus cuotas asociadas.
 * 
 * @param loanId - ID del préstamo a eliminar
 * @returns Promise<void>
 * @throws Error si el préstamo no existe o falla la eliminación
 * 
 * @example
 * ```typescript
 * await deleteLoan('123');
 * // Préstamo y todas sus cuotas eliminados
 * ```
 */
export async function deleteLoan(loanId: string): Promise<void> {
  logger.info('Deleting loan', { loanId });
  await repository.deleteLoan(loanId);
  logger.info('Loan deleted successfully', { loanId });
}

// =========================
//    UTILIDADES
// =========================

/**
 * Genera un número único de préstamo
 * 
 * Formato: LOAN-{timestamp}-{random3digits}
 * Ejemplo: LOAN-1735555555555-123
 * 
 * @returns Número único de préstamo
 * 
 * @example
 * ```typescript
 * const loanNumber = await generateLoanNumber();
 * console.log(loanNumber); // "LOAN-1735555555555-789"
 * ```
 */
async function generateLoanNumber(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOAN-${timestamp}-${random}`;
}

/**
 * Actualiza las cuotas vencidas con mora
 * 
 * Calcula y aplica moras a todas las cuotas vencidas y no pagadas.
 * La mora se calcula como: (principal + interés) * lateFeeRate * meses_vencidos
 * 
 * @param loanId - ID del préstamo a procesar
 * @param lateFeeRate - Tasa de mora por mes (default: 0.05 = 5%)
 * @returns Promise<void>
 * @throws Error si el préstamo no existe
 * 
 * @example
 * ```typescript
 * // Aplicar mora del 5% mensual
 * await updateOverdueInstallments('123', 0.05);
 * 
 * // Usar tasa por defecto
 * await updateOverdueInstallments('123');
 * ```
 */
export async function updateOverdueInstallments(loanId: string, lateFeeRate: number = 0.05): Promise<void> {
  logger.info('Updating overdue installments', { loanId, lateFeeRate });

  const loan = await repository.getLoanById(loanId);
  if (!loan) throw new Error('Loan not found');

  const updates: Array<{ id: number; data: any }> = [];

  for (const installment of loan.installments) {
    if (calculator.isOverdue(installment) && !calculator.isPaid(installment)) {
      const daysOverdue = calculateDaysOverdue(installment.due_date ?? installment.dueDate);
      const principal = Number(installment.principal_amount ?? 0);
      const interest = Number(installment.interest_amount ?? 0);
      const totalDue = principal + interest;
      
      // Calcular mora (ejemplo: 5% del total por cada mes vencido)
      const monthsOverdue = Math.ceil(daysOverdue / 30);
      const lateFee = Number((totalDue * lateFeeRate * monthsOverdue).toFixed(2));

      if (installment.id && lateFee > (installment.lateFee ?? 0)) {
        updates.push({
          id: Number(installment.id),
          data: {
            late_fee: lateFee,
            status: 'Atrasado',
          },
        });
      }
    }
  }

  if (updates.length > 0) {
    await repository.updateInstallments(updates);
    logger.info('Overdue installments updated', { count: updates.length });
  }
}

/**
 * Calcula días de retraso desde la fecha de vencimiento
 * 
 * @param dueDate - Fecha de vencimiento en formato YYYY-MM-DD
 * @returns Número de días vencidos (0 si no está vencida o fecha inválida)
 * 
 * @example
 * ```typescript
 * calculateDaysOverdue('2025-12-01'); // Si hoy es 2025-12-30: 29
 * calculateDaysOverdue('2026-01-15'); // Si hoy es 2025-12-30: 0
 * calculateDaysOverdue(null); // 0
 * ```
 */
function calculateDaysOverdue(dueDate?: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date(calculator.todayLocal());
  const diff = today.getTime() - due.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
