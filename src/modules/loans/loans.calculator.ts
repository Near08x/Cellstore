/**
 * Loans Calculator Module
 * 
 * Pure functions for loan calculations:
 * - Installment generation
 * - Interest calculations
 * - Payment distributions
 * - Aggregate calculations (overdue, pending, late fees)
 */

import type { Installment } from '@/lib/types';

// =========================
//    TIPOS INTERNOS
// =========================

export type InstallmentCalculation = {
  installmentNumber: number;
  dueDate: string;
  principal_amount: number;
  interest_amount: number;
  status: 'Pendiente';
};

export type PaymentDistribution = {
  installmentNumber: number;
  amountToApply: number;
  newPaidAmount: number;
  newStatus: 'Pendiente' | 'Pagado' | 'Parcial';
};

export type LoanAggregates = {
  totalPending: number;
  overdueAmount: number;
  sumLateFees: number;
  amountApplied: number;
};

// =========================
//    UTILIDADES DE FECHA
// =========================

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * 
 * @returns Fecha actual en formato ISO (YYYY-MM-DD)
 * 
 * @example
 * ```typescript
 * const today = todayLocal();
 * console.log(today); // "2025-12-30"
 * ```
 */
export function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

/**
 * Convierte una fecha a formato YYYY-MM-DD local
 * 
 * @param d - Fecha en formato string o null
 * @returns Fecha en formato YYYY-MM-DD o null si la fecha es inválida
 * 
 * @example
 * ```typescript
 * toLocalYYYYMMDD('2025-12-30T10:00:00'); // "2025-12-30"
 * toLocalYYYYMMDD(null); // null
 * toLocalYYYYMMDD('invalid'); // null
 * ```
 */
export function toLocalYYYYMMDD(d?: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('en-CA');
}

/**
 * Agrega meses a una fecha
 * 
 * @param startDate - Fecha inicial en formato YYYY-MM-DD
 * @param months - Número de meses a agregar
 * @returns Nueva fecha en formato YYYY-MM-DD
 * 
 * @example
 * ```typescript
 * addMonths('2025-01-15', 3); // "2025-04-15"
 * addMonths('2025-12-30', 2); // "2026-02-28" (o 02-27 según mes)
 * ```
 */
export function addMonths(startDate: string, months: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + months);
  return date.toLocaleDateString('en-CA');
}

/**
 * Agrega días a una fecha
 * 
 * @param startDate - Fecha inicial en formato YYYY-MM-DD
 * @param days - Número de días a agregar
 * @returns Nueva fecha en formato YYYY-MM-DD
 * 
 * @example
 * ```typescript
 * addDays('2025-12-30', 7); // "2026-01-06"
 * addDays('2025-01-15', 15); // "2025-01-30"
 * ```
 */
export function addDays(startDate: string, days: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA');
}

// =========================
//    CÁLCULOS DE CUOTAS
// =========================

/**
 * Calcula las cuotas para un préstamo
 * 
 * @param principal - Monto del préstamo
 * @param interestRate - Tasa de interés anual (%)
 * @param loanTerm - Número de cuotas
 * @param loanType - Tipo de préstamo (Mensual, Quincenal, Semanal, Diario)
 * @param startDate - Fecha de inicio del préstamo
 * @returns Array de cuotas calculadas
 */
export function calculateInstallments(
  principal: number,
  interestRate: number,
  loanTerm: number,
  loanType: string,
  startDate: string
): InstallmentCalculation[] {
  const installments: InstallmentCalculation[] = [];
  
  // Calcular interés por cuota
  const periodsPerYear = getPeriodsPerYear(loanType);
  const interestPerPeriod = (interestRate / 100) / periodsPerYear;
  const totalInterest = principal * interestPerPeriod * loanTerm;
  
  // Distribución uniforme de principal e interés
  const principalPerInstallment = principal / loanTerm;
  const interestPerInstallment = totalInterest / loanTerm;

  for (let i = 1; i <= loanTerm; i++) {
    const dueDate = calculateDueDate(startDate, i, loanType);
    
    installments.push({
      installmentNumber: i,
      dueDate,
      principal_amount: Number(principalPerInstallment.toFixed(2)),
      interest_amount: Number(interestPerInstallment.toFixed(2)),
      status: 'Pendiente',
    });
  }

  return installments;
}

/**
 * Calcula la fecha de vencimiento de una cuota
 * 
 * @param startDate - Fecha de inicio del préstamo en formato YYYY-MM-DD
 * @param installmentNumber - Número de la cuota (1, 2, 3...)
 * @param loanType - Tipo de préstamo (Mensual, Quincenal, Semanal, Diario)
 * @returns Fecha de vencimiento en formato YYYY-MM-DD
 * 
 * @example
 * ```typescript
 * calculateDueDate('2025-01-01', 1, 'Mensual'); // "2025-02-01"
 * calculateDueDate('2025-01-01', 2, 'Semanal'); // "2025-01-15"
 * ```
 */
function calculateDueDate(startDate: string, installmentNumber: number, loanType: string): string {
  switch (loanType.toLowerCase()) {
    case 'mensual':
      return addMonths(startDate, installmentNumber);
    case 'quincenal':
      return addDays(startDate, installmentNumber * 15);
    case 'semanal':
      return addDays(startDate, installmentNumber * 7);
    case 'diario':
      return addDays(startDate, installmentNumber);
    default:
      return addMonths(startDate, installmentNumber);
  }
}

/**
 * Obtiene el número de períodos por año según el tipo de préstamo
 * 
 * @param loanType - Tipo de préstamo (Mensual, Quincenal, Semanal, Diario)
 * @returns Número de períodos por año (12, 24, 52, 365)
 * 
 * @example
 * ```typescript
 * getPeriodsPerYear('Mensual'); // 12
 * getPeriodsPerYear('Quincenal'); // 24
 * getPeriodsPerYear('Semanal'); // 52
 * getPeriodsPerYear('Diario'); // 365
 * ```
 */
function getPeriodsPerYear(loanType: string): number {
  switch (loanType.toLowerCase()) {
    case 'mensual':
      return 12;
    case 'quincenal':
      return 24;
    case 'semanal':
      return 52;
    case 'diario':
      return 365;
    default:
      return 12;
  }
}

// =========================
//    VALIDACIÓN DE ESTADO
// =========================

/**
 * Verifica si una cuota está completamente pagada
 * 
 * @param installment - Cuota a verificar
 * @returns true si la cuota está pagada (paidAmount >= total), false en caso contrario
 * 
 * @example
 * ```typescript
 * const installment = {
 *   principal_amount: 100,
 *   interest_amount: 10,
 *   lateFee: 5,
 *   paidAmount: 115
 * };
 * isPaid(installment); // true
 * 
 * const partial = { ...installment, paidAmount: 50 };
 * isPaid(partial); // false
 * ```
 */
export function isPaid(installment: Partial<Installment>): boolean {
  const total =
    Number(installment.principal_amount ?? 0) +
    Number(installment.interest_amount ?? 0) +
    Number(installment.lateFee ?? 0);
  const paid = Number(installment.paidAmount ?? 0);
  return paid >= total - 1e-6; // Tolerancia para redondeo
}

/**
 * Verifica si una cuota está vencida
 * 
 * @param installment - Cuota a verificar
 * @returns true si la cuota está vencida y no pagada, false en caso contrario
 * 
 * @example
 * ```typescript
 * const overdue = {
 *   due_date: '2025-12-01',
 *   status: 'Pendiente'
 * };
 * isOverdue(overdue); // true (si hoy es después del 2025-12-01)
 * 
 * const paid = { ...overdue, status: 'Pagado' };
 * isOverdue(paid); // false
 * ```
 */
export function isOverdue(installment: Partial<Installment>): boolean {
  const dueDate = installment.due_date ?? installment.dueDate;
  if (!dueDate) return false;
  
  const due = new Date(dueDate);
  if (isNaN(due.getTime())) return false;
  
  const today = new Date(todayLocal());
  return due < today && installment.status !== 'Pagado';
}

// =========================
//    DISTRIBUCIÓN DE PAGOS
// =========================

/**
 * Distribuye un pago entre las cuotas pendientes
 * 
 * Aplica el pago a las cuotas en orden (primero las más antiguas),
 * actualizando el monto pagado y estado de cada una.
 * 
 * @param installments - Array de cuotas del préstamo
 * @param paymentAmount - Monto total del pago a distribuir
 * @returns Array de distribuciones indicando cuánto se aplicó a cada cuota
 * 
 * @example
 * ```typescript
 * const installments = [
 *   { installmentNumber: 1, principal_amount: 100, interest_amount: 10, paidAmount: 0 },
 *   { installmentNumber: 2, principal_amount: 100, interest_amount: 10, paidAmount: 0 }
 * ];
 * 
 * const distributions = distributePayment(installments, 150);
 * // [
 * //   { installmentNumber: 1, amountToApply: 110, newPaidAmount: 110, newStatus: 'Pagado' },
 * //   { installmentNumber: 2, amountToApply: 40, newPaidAmount: 40, newStatus: 'Parcial' }
 * // ]
 * ```
 */
export function distributePayment(
  installments: Partial<Installment>[],
  paymentAmount: number
): PaymentDistribution[] {
  const distributions: PaymentDistribution[] = [];
  let remainingAmount = paymentAmount;

  // Ordenar cuotas por número (pagar las más antiguas primero)
  const sortedInstallments = [...installments].sort(
    (a, b) => (a.installmentNumber ?? 0) - (b.installmentNumber ?? 0)
  );

  for (const installment of sortedInstallments) {
    if (remainingAmount <= 0) break;
    if (isPaid(installment)) continue;

    const principal = Number(installment.principal_amount ?? 0);
    const interest = Number(installment.interest_amount ?? 0);
    const lateFee = Number(installment.lateFee ?? 0);
    const alreadyPaid = Number(installment.paidAmount ?? 0);
    
    const totalDue = principal + interest + lateFee;
    const pending = totalDue - alreadyPaid;

    if (pending <= 0) continue;

    const amountToApply = Math.min(remainingAmount, pending);
    const newPaidAmount = alreadyPaid + amountToApply;
    
    let newStatus: 'Pendiente' | 'Pagado' | 'Parcial';
    if (newPaidAmount >= totalDue - 1e-6) {
      newStatus = 'Pagado';
    } else if (newPaidAmount > 0) {
      newStatus = 'Parcial';
    } else {
      newStatus = 'Pendiente';
    }

    distributions.push({
      installmentNumber: installment.installmentNumber ?? 0,
      amountToApply,
      newPaidAmount,
      newStatus,
    });

    remainingAmount -= amountToApply;
  }

  return distributions;
}

// =========================
//    CÁLCULO DE AGREGADOS
// =========================

/**
 * Calcula los agregados de un préstamo (totales, vencido, mora)
 * 
 * Suma todos los montos pendientes, vencidos, moras aplicadas,
 * y montos ya pagados de todas las cuotas.
 * 
 * @param installments - Array de cuotas del préstamo
 * @returns Objeto con totales calculados
 * 
 * @example
 * ```typescript
 * const installments = [
 *   { principal_amount: 100, interest_amount: 10, lateFee: 5, paidAmount: 50, due_date: '2025-12-01', status: 'Parcial' },
 *   { principal_amount: 100, interest_amount: 10, lateFee: 0, paidAmount: 0, due_date: '2026-01-01', status: 'Pendiente' }
 * ];
 * 
 * const aggregates = computeLoanAggregates(installments);
 * // {
 * //   totalPending: 175,      // (115-50) + 110
 * //   overdueAmount: 65,      // Primera cuota vencida: 115-50
 * //   sumLateFees: 5,         // Total de moras
 * //   amountApplied: 50       // Total pagado
 * // }
 * ```
 */
export function computeLoanAggregates(installments: Partial<Installment>[]): LoanAggregates {
  let totalPending = 0;
  let overdueAmount = 0;
  let sumLateFees = 0;
  let amountApplied = 0;

  for (const installment of installments) {
    const principal = Number(installment.principal_amount ?? 0);
    const interest = Number(installment.interest_amount ?? 0);
    const lateFee = Number(installment.lateFee ?? 0);
    const paid = Number(installment.paidAmount ?? 0);
    
    const totalDue = principal + interest + lateFee;
    const pending = Math.max(totalDue - paid, 0);

    totalPending += pending;
    sumLateFees += lateFee;
    amountApplied += paid;

    // Si está vencida y no pagada, sumar al monto vencido
    if (!isPaid(installment) && isOverdue(installment)) {
      overdueAmount += pending;
    }
  }

  return {
    totalPending: Number(totalPending.toFixed(2)),
    overdueAmount: Number(overdueAmount.toFixed(2)),
    sumLateFees: Number(sumLateFees.toFixed(2)),
    amountApplied: Number(amountApplied.toFixed(2)),
  };
}

/**
 * Calcula el monto total a pagar (principal + intereses)
 * 
 * @param principal - Monto del préstamo
 * @param interestRate - Tasa de interés anual (%)
 * @param loanTerm - Número de cuotas
 * @param loanType - Tipo de préstamo (Mensual, Quincenal, Semanal, Diario)
 * @returns Monto total a pagar (principal + intereses totales)
 * 
 * @example
 * ```typescript
 * calculateTotalAmount(10000, 12, 12, 'Mensual');
 * // 11200 (10000 + 1200 de interés)
 * 
 * calculateTotalAmount(5000, 10, 24, 'Quincenal');
 * // 5500 (5000 + 500 de interés)
 * ```
 */
export function calculateTotalAmount(principal: number, interestRate: number, loanTerm: number, loanType: string): number {
  const periodsPerYear = getPeriodsPerYear(loanType);
  const interestPerPeriod = (interestRate / 100) / periodsPerYear;
  const totalInterest = principal * interestPerPeriod * loanTerm;
  return Number((principal + totalInterest).toFixed(2));
}
