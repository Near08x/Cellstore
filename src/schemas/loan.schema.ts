/**
 * Loan Schema Module
 * 
 * Schemas de validación Zod para préstamos y cuotas
 * Usados en API routes para validar inputs del cliente
 */

import { z } from 'zod';

// =========================
//    VALIDACIÓN DE CUOTAS
// =========================

/**
 * Estados válidos de una cuota
 * - Pendiente: No ha sido pagada
 * - Pagado: Completamente pagada
 * - Parcial: Parcialmente pagada
 * - Atrasado: Vencida y no pagada
 */
export const installmentStatusSchema = z.enum([
  'Pendiente',
  'Pagado',
  'Parcial',
  'Atrasado',
]);

/**
 * Schema de validación para una cuota (installment)
 * 
 * Soporta campos duales (snake_case y camelCase) para compatibilidad
 * entre frontend y backend.
 * 
 * @example
 * ```typescript
 * const validInstallment = {
 *   installmentNumber: 1,
 *   dueDate: '2025-01-01',
 *   principal_amount: 100,
 *   interest_amount: 10,
 *   status: 'Pendiente'
 * };
 * installmentSchema.parse(validInstallment); // ✓
 * ```
 */
export const installmentSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  loan_id: z.string().uuid().optional(),
  installmentNumber: z.number().int().positive(),
  
  // Fechas (soporta ambos formatos)
  due_date: z.string().optional(),
  dueDate: z.string().optional(),
  
  // Montos
  principal_amount: z.number().nonnegative(),
  interest_amount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative().optional().default(0),
  lateFee: z.number().nonnegative().optional().default(0),
  
  status: installmentStatusSchema,
  
  // Fecha de pago (nullable)
  payment_date: z.string().nullable().optional(),
  paymentDate: z.string().nullable().optional(),
});

// =========================
//    VALIDACIÓN DE PRÉSTAMOS
// =========================

/**
 * Estados válidos de un préstamo
 * - Pendiente: Solicitud pendiente de aprobación
 * - Aprobado: Préstamo activo
 * - Pagado: Completamente liquidado
 * - Cancelado: Rechazado o cancelado
 */
export const loanStatusSchema = z.enum([
  'Pendiente',
  'Aprobado',
  'Pagado',
  'Cancelado',
]);

/**
 * Schema de validación para un préstamo completo
 * 
 * Incluye todos los campos del préstamo y sus cuotas.
 * Soporta campos duales para compatibilidad frontend/backend.
 * 
 * @example
 * ```typescript
 * const validLoan = {
 *   loanNumber: 'LOAN-123',
 *   client_name: 'Juan Pérez',
 *   principal: 10000,
 *   interestRate: 12,
 *   loanDate: '2025-01-01',
 *   amount: 10000,
 *   amountToPay: 11200,
 *   totalPending: 11200,
 *   installments: []
 * };
 * loanSchema.parse(validLoan); // ✓
 * ```
 */
export const loanSchema = z.object({
  id: z.string().uuid().optional(),
  loanNumber: z.string().min(1, 'Número de préstamo requerido'),
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().optional(),
  customerName: z.string().optional(),
  paymentType: z.string().optional(),
  loanTerm: z.number().int().positive().optional(),
  
  // Fechas
  loanDate: z.string(),
  start_date: z.string().optional(),
  startDate: z.string().optional(),
  due_date: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  
  // Datos financieros
  principal: z.number().positive('El capital debe ser mayor a 0'),
  interestRate: z.number().nonnegative('La tasa de interés no puede ser negativa').max(100, 'Tasa de interés inválida'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  amountToPay: z.number().nonnegative(),
  amountApplied: z.number().nonnegative().default(0),
  overdueAmount: z.number().nonnegative().default(0),
  lateFee: z.number().nonnegative().default(0),
  change: z.number().optional(),
  totalPending: z.number().nonnegative(),
  
  // Cuotas
  installments: z.array(installmentSchema),
  
  // Extras
  loanType: z.string().optional(),
  invoiceNumber: z.string().optional(),
  cashier: z.string().optional(),
  status: loanStatusSchema.optional(),
});

// =========================
//    SCHEMAS PARA API
// =========================

/**
 * Schema para crear un nuevo préstamo
 * 
 * Valida los campos mínimos requeridos para crear un préstamo.
 * Las cuotas se generan automáticamente en el servicio.
 * 
 * @example
 * ```typescript
 * const input = {
 *   client_id: 'abc-123',
 *   client_name: 'Juan Pérez',
 *   principal: 10000,
 *   interestRate: 12,
 *   loanTerm: 12,
 *   loanType: 'Mensual',
 *   startDate: '2025-01-01'
 * };
 * createLoanSchema.parse(input); // ✓
 * ```
 */
export const createLoanSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  client_name: z.string().min(1, 'Nombre del cliente requerido'),
  principal: z.number().positive('El capital debe ser mayor a 0'),
  interestRate: z.number().nonnegative('La tasa de interés no puede ser negativa').max(100),
  loanTerm: z.number().int().positive('El plazo debe ser mayor a 0'),
  loanType: z.string().min(1, 'Tipo de préstamo requerido'),
  startDate: z.string(),
  cashier: z.string().optional(),
});

/**
 * Schema para procesar un pago en un préstamo
 * 
 * Valida los datos necesarios para aplicar un pago.
 * El pago se distribuye automáticamente entre cuotas pendientes.
 * 
 * @example
 * ```typescript
 * const payment = {
 *   loanId: 'abc-123',
 *   paymentAmount: 500,
 *   paymentDate: '2025-12-30' // opcional
 * };
 * processPaymentSchema.parse(payment); // ✓
 * ```
 */
export const processPaymentSchema = z.object({
  loanId: z.string().uuid('ID de préstamo inválido'),
  paymentAmount: z.number().positive('El monto del pago debe ser mayor a 0'),
  paymentDate: z.string().optional(),
  applyToInstallments: z.array(z.number().int().positive()).optional(),
});

/**
 * Schema para actualizar un préstamo existente
 * 
 * Permite actualizar campos específicos del préstamo.
 * Todos los campos excepto 'id' son opcionales.
 * 
 * @example
 * ```typescript
 * const update = {
 *   id: 'abc-123',
 *   status: 'Pagado',
 *   totalPending: 0
 * };
 * updateLoanSchema.parse(update); // ✓
 * ```
 */
export const updateLoanSchema = z.object({
  id: z.string().uuid('ID de préstamo inválido'),
  status: loanStatusSchema.optional(),
  lateFee: z.number().nonnegative().optional(),
  amountApplied: z.number().nonnegative().optional(),
  totalPending: z.number().nonnegative().optional(),
});

/**
 * Tipos TypeScript inferidos de los schemas Zod
 * 
 * - CreateLoanInput: Datos para crear un préstamo
 * - ProcessPaymentInput: Datos para procesar un pago
 * - UpdateLoanInput: Datos para actualizar un préstamo
 * - LoanInput: Préstamo completo validado
 * - InstallmentInput: Cuota validada
 */
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type LoanInput = z.infer<typeof loanSchema>;
export type InstallmentInput = z.infer<typeof installmentSchema>;
