# 🚀 Plan de Mejoras - Studio App
**Fecha:** 30 de Diciembre, 2025  
**Objetivo:** Mejorar calidad, performance y mantenibilidad sin romper funcionalidad existente

---

## 📊 Estado Actual

### Arquitectura
- **Framework:** Next.js 15.5.4 (App Router + SSR optimizado)
- **Base de datos:** Supabase PostgreSQL
- **Deployment:** Docker + Standalone
- **Testing:** 0% coverage ❌
- **Bundling:** 421 kB (Finance page)

### Módulos por Complejidad
| Módulo | LOC | Complejidad | Prioridad Refactor |
|--------|-----|-------------|-------------------|
| Loans | 857 | 🔴 Alta | 1 (Crítico) |
| Sales | 230 | 🟡 Media | 3 |
| Clients | 112 | 🟢 Baja | 5 |
| Products | 87 | 🟢 Baja | 6 |
| Users | 77 | 🟢 Baja | 7 |
| Capital | 68 | 🟢 Baja | 8 |
| Print | 70 | 🟢 Baja | 4 |
| Auth | 77 | 🟢 Baja | 2 |

### Issues Identificados
1. ✅ **SSR implementado** (recién completado)
2. ❌ **Sin tests** → Regresiones no detectadas
3. ❌ **Loans monolítico** → Difícil mantenimiento
4. ❌ **Sin validación centralizada** → Errores silenciosos
5. ❌ **Logging básico** → Debugging difícil
6. ❌ **N+1 queries potenciales** → Performance issues
7. ❌ **Debug logs en producción** → Seguridad/Performance
8. ❌ **Sin monitoring** → Problemas invisibles

---

## 🎯 Objetivos SMART

### Performance
- ✅ Response time < 300ms (avg)
- ✅ First Load JS < 150kB (crítico: dashboard)
- ✅ Lighthouse Score > 90

### Calidad
- ✅ Code Coverage > 60%
- ✅ 0 TypeScript errors (mantener)
- ✅ 0 vulnerabilidades críticas (mantener)

### Developer Experience
- ✅ Build time < 45s
- ✅ Hot reload < 1s
- ✅ Documentación completa

---

## 📅 Fases de Implementación

---

## **FASE 1: Fundación (Semana 1)**
**Objetivo:** Infraestructura de calidad sin tocar lógica de negocio  
**Riesgo:** 🟢 Bajo (no modifica funcionalidad)

### 1.1 Estructura de Carpetas
**Tiempo estimado:** 30 min

```
src/
├── modules/           # ← NUEVO
│   ├── loans/
│   ├── sales/
│   ├── clients/
│   └── shared/
├── lib/
│   ├── api-handler.ts    # ← NUEVO
│   ├── logger.ts         # ← NUEVO
│   └── errors.ts         # ← NUEVO
└── schemas/           # ← NUEVO
    ├── loan.schema.ts
    └── sale.schema.ts
```

**Validación:**
```bash
npm run typecheck  # Debe pasar
npm run build      # Debe pasar
```

---

### 1.2 API Error Handler Centralizado
**Tiempo estimado:** 45 min

**Crear:** `src/lib/api-handler.ts`
```typescript
import { NextResponse } from 'next/server';
import { logger } from './logger';

export function apiHandler<T>(
  handler: (req: Request) => Promise<T>
) {
  return async (req: Request) => {
    try {
      const result = await handler(req);
      return NextResponse.json(result);
    } catch (error) {
      logger.error('API Error', {
        url: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown'
      });

      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : 'Internal Server Error',
          timestamp: new Date().toISOString()
        },
        { status: error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500 }
      );
    }
  };
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Validación:**
- Crear test endpoint `/api/health/test`
- Lanzar error intencional
- Verificar response format correcto

---

### 1.3 Logger Estructurado
**Tiempo estimado:** 30 min

**Crear:** `src/lib/logger.ts`
```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private log(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(meta && { meta })
    };

    const output = `[${level.toUpperCase()}] ${timestamp} - ${message}`;
    
    switch (level) {
      case 'error':
        console.error(output, meta || '');
        break;
      case 'warn':
        console.warn(output, meta || '');
        break;
      default:
        console.log(output, meta || '');
    }

    // TODO Fase 3: Enviar a servicio externo (Sentry/LogRocket)
  }

  info(message: string, meta?: any) { this.log('info', message, meta); }
  warn(message: string, meta?: any) { this.log('warn', message, meta); }
  error(message: string, meta?: any) { this.log('error', message, meta); }
  debug(message: string, meta?: any) { 
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, meta); 
    }
  }
}

export const logger = new Logger();
```

**Validación:**
```typescript
// En /api/health/route.ts
logger.info('Health check called');
logger.debug('Database status', { connected: true });
```

---

### 1.4 Limpiar Debug Logs
**Tiempo estimado:** 15 min

**Archivos a limpiar:**
```typescript
// src/components/loans/loans-client.tsx:94-97
// ❌ REMOVER
// DEBUG: Log installments para ver qué llega
if (loans.length > 0) {
  console.log('🔍 DEBUG installments[0]:', loans[0].installments[0]);
}
```

**Script de búsqueda:**
```bash
# Buscar todos los console.log/debug
grep -r "console\\.log\\|console\\.debug" src/ --exclude-dir=node_modules
```

**Validación:**
- Build producción no debe mostrar logs
- Dev mode funciona normal

---

### 1.5 Quick Wins Performance
**Tiempo estimado:** 30 min

**Cambios:**

1. **Revalidate en páginas estáticas:**
```typescript
// src/app/inventory/page.tsx
export const revalidate = 300; // 5 minutos

// src/app/clients/page.tsx
export const revalidate = 600; // 10 minutos
```

2. **Comprimir bundle:**
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts']
  }
};
```

3. **Lazy load componentes pesados:**
```typescript
// src/app/finance/page.tsx
import dynamic from 'next/dynamic';

const FinanceDashboard = dynamic(
  () => import('@/components/finance/finance-dashboard'),
  { loading: () => <div>Cargando...</div> }
);
```

**Validación:**
```bash
npm run build
# Verificar tamaño del bundle reducido
```

---

### ✅ Checklist Fase 1
- [ ] Estructura de carpetas creada
- [ ] api-handler.ts implementado y probado
- [ ] logger.ts implementado y probado
- [ ] Debug logs removidos
- [ ] Revalidate agregado a páginas
- [ ] Build pasa sin errores
- [ ] App funciona en dev y producción
- [ ] Bundle size reducido (medir antes/después)

**Criterio de éxito:** App funciona igual, código más limpio

---

## **FASE 2: Validación y Schemas (Semana 2)**
**Objetivo:** Prevenir errores con validación fuerte  
**Riesgo:** 🟡 Medio (puede romper si schemas mal definidos)

### 2.1 Setup Zod
**Tiempo estimado:** 15 min

```bash
# Ya está instalado: zod@3.24.2
```

**Crear estructura:**
```
src/schemas/
├── loan.schema.ts
├── sale.schema.ts
├── client.schema.ts
└── product.schema.ts
```

---

### 2.2 Schema para Loans (Crítico)
**Tiempo estimado:** 1 hora

**Crear:** `src/schemas/loan.schema.ts`
```typescript
import { z } from 'zod';

export const installmentInputSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  due_date: z.string().optional(),
  dueDate: z.string().optional(),
  principal_amount: z.number().positive().optional(),
  interest_amount: z.number().nonnegative().optional(),
  paid_amount: z.number().nonnegative().optional(),
  late_fee: z.number().nonnegative().optional(),
  status: z.enum(['Pendiente', 'Pagado', 'Atrasado', 'Parcial']).optional(),
  payment_date: z.string().nullable().optional(),
});

export const createLoanSchema = z.object({
  client_id: z.string().uuid('ID de cliente inválido'),
  principal: z.number().positive('El monto principal debe ser mayor a 0'),
  interest_rate: z.number().min(0, 'Tasa de interés no puede ser negativa').max(100, 'Tasa máxima 100%'),
  start_date: z.string().optional(),
  status: z.string().optional(),
  installments: z.array(installmentInputSchema).optional(),
});

export const processPaymentSchema = z.object({
  loanId: z.string().uuid('ID de préstamo inválido'),
  installmentId: z.string().uuid('ID de cuota inválido').optional(),
  amountPaid: z.number().positive('El monto pagado debe ser mayor a 0'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mixed']).default('cash'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
```

**Implementar en route:**
```typescript
// src/app/api/loans/route.ts
import { createLoanSchema, processPaymentSchema } from '@/schemas/loan.schema';
import { apiHandler, ApiError } from '@/lib/api-handler';

export const POST = apiHandler(async (request: Request) => {
  const body = await request.json();
  
  // Validar con Zod
  const validated = createLoanSchema.parse(body);
  
  // Si llega aquí, los datos son válidos
  // ... resto de lógica
});

export const PATCH = apiHandler(async (request: Request) => {
  const body = await request.json();
  const validated = processPaymentSchema.parse(body);
  // ... lógica de pago
});
```

**Validación:**
- Enviar payload inválido → debe rechazar con error claro
- Enviar payload válido → debe funcionar normal
- TypeScript debe autocompletar tipos

---

### 2.3 Schemas para Otros Módulos
**Tiempo estimado:** 2 horas

**Sale Schema:**
```typescript
// src/schemas/sale.schema.ts
export const createSaleSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional(),
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive().optional(),
  })).min(1, 'Debe incluir al menos un producto'),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'mixed']),
  amountPaid: z.number().positive(),
});
```

**Client Schema:**
```typescript
// src/schemas/client.schema.ts
export const createClientSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?[\d\s-()]+$/, 'Teléfono inválido'),
});
```

**Product Schema:**
```typescript
// src/schemas/product.schema.ts
export const createProductSchema = z.object({
  name: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  price2: z.number().nonnegative(),
  price3: z.number().nonnegative(),
  cost: z.number().nonnegative(),
  provider: z.string(),
  stock: z.number().int().nonnegative(),
});
```

**Aplicar en routes:**
- `/api/sales/route.ts`
- `/api/clients/route.ts`
- `/api/products/route.ts`

---

### ✅ Checklist Fase 2
- [ ] Todos los schemas creados
- [ ] Validación implementada en POST endpoints
- [ ] Validación implementada en PATCH/PUT endpoints
- [ ] Tests manuales con payloads inválidos
- [ ] TypeScript types generados desde schemas
- [ ] Errores de validación devuelven mensajes claros
- [ ] App funciona en producción

**Criterio de éxito:** API rechaza datos inválidos con mensajes útiles

---

## **FASE 3: Refactorización Loans (Semanas 3-4)**
**Objetivo:** Modularizar el código más complejo  
**Riesgo:** 🔴 Alto (lógica crítica de negocio)

### 3.1 Extraer Calculadora Financiera
**Tiempo estimado:** 3 horas

**Crear:** `src/modules/loans/loans.calculator.ts`
```typescript
/**
 * Funciones puras de cálculos financieros
 * 100% testeables, sin efectos secundarios
 */

export interface LoanCalculationInput {
  principal: number;
  interestRate: number;
  numInstallments: number;
}

export interface LoanCalculationResult {
  interest: number;
  total: number;
  installmentAmount: number;
}

/**
 * Calcula interés simple
 */
export function calculateInterest(principal: number, rate: number): number {
  if (principal < 0) throw new Error('Principal must be positive');
  if (rate < 0 || rate > 100) throw new Error('Rate must be 0-100');
  
  return principal * (rate / 100);
}

/**
 * Calcula cuota por período
 */
export function calculateInstallmentAmount(
  total: number,
  numInstallments: number
): number {
  if (numInstallments <= 0) throw new Error('Number of installments must be positive');
  
  return total / numInstallments;
}

/**
 * Genera plan de pagos completo
 */
export function generatePaymentPlan(
  input: LoanCalculationInput,
  startDate: Date
): Array<{
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
}> {
  const { principal, interestRate, numInstallments } = input;
  
  const interest = calculateInterest(principal, interestRate);
  const total = principal + interest;
  const installmentAmount = calculateInstallmentAmount(total, numInstallments);
  
  const plan = [];
  
  for (let i = 0; i < numInstallments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (i * 30)); // Cada 30 días
    
    plan.push({
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString().split('T')[0],
      principalAmount: principal / numInstallments,
      interestAmount: interest / numInstallments,
      totalAmount: installmentAmount,
    });
  }
  
  return plan;
}

/**
 * Calcula mora por días de atraso
 */
export function calculateLateFee(
  amount: number,
  daysLate: number,
  dailyRate: number = 0.01 // 1% diario default
): number {
  if (daysLate <= 0) return 0;
  return amount * dailyRate * daysLate;
}

/**
 * Calcula días de atraso
 */
export function calculateDaysLate(dueDate: string, today: string = new Date().toISOString()): number {
  const due = new Date(dueDate);
  const now = new Date(today);
  
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
```

**Validación:**
- Crear tests (ver Fase 4)
- Reemplazar cálculos en route.ts con funciones
- Verificar mismos resultados

---

### 3.2 Extraer Repository Pattern
**Tiempo estimado:** 4 horas

**Crear:** `src/modules/loans/loans.repository.ts`
```typescript
import { supabase } from '@/lib/supabaseServer';
import type { Loan, Installment, Payment } from '@/lib/types';

/**
 * Capa de acceso a datos para Loans
 * Abstrae queries de Supabase
 */

export class LoansRepository {
  /**
   * Obtener préstamo completo con relaciones
   */
  async getLoanById(loanId: string) {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        clients(*),
        loan_installments(*),
        loan_payments(*)
      `)
      .eq('id', loanId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Listar todos los préstamos
   */
  async getAllLoans() {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        clients(id, name, email),
        loan_installments(*),
        loan_payments(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  /**
   * Crear préstamo
   */
  async createLoan(loanData: any) {
    const { data, error } = await supabase
      .from('loans')
      .insert(loanData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crear cuotas en batch
   */
  async createInstallments(installments: any[]) {
    const { data, error } = await supabase
      .from('loan_installments')
      .insert(installments)
      .select();

    if (error) throw error;
    return data;
  }

  /**
   * Actualizar cuota
   */
  async updateInstallment(installmentId: string, updates: Partial<Installment>) {
    const { data, error } = await supabase
      .from('loan_installments')
      .update(updates)
      .eq('id', installmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Crear registro de pago
   */
  async createPayment(payment: any) {
    const { data, error } = await supabase
      .from('loan_payments')
      .insert(payment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Actualizar préstamo
   */
  async updateLoan(loanId: string, updates: any) {
    const { data, error } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loanId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Eliminar préstamo (con cascada manual)
   */
  async deleteLoan(loanId: string) {
    // Eliminar relaciones primero
    await supabase.from('loan_payments').delete().eq('loan_id', loanId);
    await supabase.from('loan_installments').delete().eq('loan_id', loanId);
    
    // Eliminar préstamo
    const { error } = await supabase.from('loans').delete().eq('id', loanId);
    if (error) throw error;
  }
}

export const loansRepository = new LoansRepository();
```

---

### 3.3 Extraer Service Layer
**Tiempo estimado:** 6 horas

**Crear:** `src/modules/loans/loans.service.ts`
```typescript
import { loansRepository } from './loans.repository';
import { 
  calculateInterest, 
  generatePaymentPlan,
  calculateLateFee,
  calculateDaysLate 
} from './loans.calculator';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/api-handler';
import type { CreateLoanInput, ProcessPaymentInput } from '@/schemas/loan.schema';

/**
 * Lógica de negocio para Loans
 */
export class LoansService {
  /**
   * Crear préstamo con cuotas
   */
  async createLoan(input: CreateLoanInput) {
    logger.info('Creating loan', { clientId: input.client_id });

    // 1. Calcular totales
    const interest = calculateInterest(input.principal, input.interest_rate);
    const total = input.principal + interest;

    // 2. Generar plan de pagos
    const startDate = input.start_date ? new Date(input.start_date) : new Date();
    const numInstallments = input.installments?.length || 1;
    
    const paymentPlan = generatePaymentPlan(
      {
        principal: input.principal,
        interestRate: input.interest_rate,
        numInstallments,
      },
      startDate
    );

    // 3. Crear préstamo
    const loanData = {
      client_id: input.client_id,
      principal: input.principal,
      interest_rate: input.interest_rate,
      amount: interest,
      total,
      amount_to_pay: total,
      amount_applied: 0,
      total_pending: total,
      balance: total,
      start_date: startDate.toISOString().split('T')[0],
      due_date: paymentPlan[paymentPlan.length - 1].dueDate,
      status: input.status || 'Pendiente',
    };

    const loan = await loansRepository.createLoan(loanData);

    // 4. Crear cuotas
    const installmentsData = paymentPlan.map((plan) => ({
      loan_id: loan.id,
      installment_number: plan.installmentNumber,
      due_date: plan.dueDate,
      principal_amount: plan.principalAmount,
      interest_amount: plan.interestAmount,
      paid_amount: 0,
      late_fee: 0,
      status: 'Pendiente',
    }));

    const installments = await loansRepository.createInstallments(installmentsData);

    logger.info('Loan created successfully', { loanId: loan.id });

    return {
      loan,
      installments,
    };
  }

  /**
   * Procesar pago de préstamo
   */
  async processPayment(input: ProcessPaymentInput) {
    logger.info('Processing payment', { loanId: input.loanId });

    // 1. Obtener préstamo
    const loan = await loansRepository.getLoanById(input.loanId);
    if (!loan) {
      throw new ApiError('Préstamo no encontrado', 404);
    }

    // 2. Obtener cuotas pendientes (ordenadas por fecha)
    const installments = (loan.loan_installments || [])
      .filter((i: any) => i.status !== 'Pagado')
      .sort((a: any, b: any) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );

    if (installments.length === 0) {
      throw new ApiError('No hay cuotas pendientes', 400);
    }

    // 3. Distribuir pago entre cuotas
    let remainingPayment = input.amountPaid;
    const updatedInstallments = [];
    let totalApplied = 0;

    for (const installment of installments) {
      if (remainingPayment <= 0) break;

      // Calcular mora si aplica
      const daysLate = calculateDaysLate(installment.due_date);
      const lateFee = calculateLateFee(
        installment.principal_amount + installment.interest_amount,
        daysLate
      );

      const totalDue = 
        installment.principal_amount + 
        installment.interest_amount + 
        lateFee - 
        installment.paid_amount;

      const amountToApply = Math.min(remainingPayment, totalDue);

      // Actualizar cuota
      const updatedInstallment = await loansRepository.updateInstallment(
        installment.id,
        {
          paid_amount: installment.paid_amount + amountToApply,
          late_fee: lateFee,
          status: (installment.paid_amount + amountToApply >= totalDue) ? 'Pagado' : 'Parcial',
          payment_date: new Date().toISOString(),
        }
      );

      updatedInstallments.push(updatedInstallment);

      // Registrar pago
      await loansRepository.createPayment({
        loan_id: loan.id,
        installment_id: installment.id,
        amount_paid: amountToApply,
        payment_method: input.paymentMethod,
        principal_applied: amountToApply,
        change_returned: 0,
      });

      remainingPayment -= amountToApply;
      totalApplied += amountToApply;
    }

    // 4. Actualizar préstamo
    const newAmountApplied = loan.amount_applied + totalApplied;
    const newBalance = loan.total - newAmountApplied;

    await loansRepository.updateLoan(loan.id, {
      amount_applied: newAmountApplied,
      balance: newBalance,
      total_pending: newBalance,
      status: newBalance <= 0 ? 'Pagado' : 'Pendiente',
    });

    const change = remainingPayment;

    logger.info('Payment processed successfully', {
      loanId: loan.id,
      totalApplied,
      change,
    });

    return {
      totalApplied,
      change,
      updatedInstallments,
    };
  }

  /**
   * Obtener préstamos con clientes
   */
  async getLoansWithClients() {
    const loans = await loansRepository.getAllLoans();
    
    // Mapear a formato esperado por el cliente
    return loans.map((loan: any) => ({
      id: loan.id,
      loanNumber: loan.loan_number,
      clientId: loan.client_id,
      clientName: loan.clients?.name || '',
      clientEmail: loan.clients?.email || '',
      principal: loan.principal,
      interestRate: loan.interest_rate,
      amount: loan.amount,
      total: loan.total,
      balance: loan.balance,
      status: loan.status,
      startDate: loan.start_date,
      dueDate: loan.due_date,
      installments: loan.loan_installments || [],
      payments: loan.loan_payments || [],
    }));
  }
}

export const loansService = new LoansService();
```

---

### 3.4 Refactorizar Route Handler
**Tiempo estimado:** 2 horas

**Modificar:** `src/app/api/loans/route.ts`
```typescript
import { apiHandler } from '@/lib/api-handler';
import { loansService } from '@/modules/loans/loans.service';
import { createLoanSchema, processPaymentSchema } from '@/schemas/loan.schema';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET: Listar préstamos
 */
export const GET = apiHandler(async () => {
  const loans = await loansService.getLoansWithClients();
  return { loans, clients: [] }; // TODO: obtener clientes separado
});

/**
 * POST: Crear préstamo
 */
export const POST = apiHandler(async (request: Request) => {
  const body = await request.json();
  const validated = createLoanSchema.parse(body);
  
  const result = await loansService.createLoan(validated);
  
  return result;
});

/**
 * PATCH: Procesar pago
 */
export const PATCH = apiHandler(async (request: Request) => {
  const body = await request.json();
  const validated = processPaymentSchema.parse(body);
  
  const result = await loansService.processPayment(validated);
  
  return {
    message: 'Pago procesado correctamente',
    ...result,
  };
});

// PUT y DELETE quedan igual (refactor opcional)
```

**Resultado:**
- Route handler: ~50 líneas (era 857)
- Lógica en servicios testeables
- Separación de responsabilidades clara

---

### ✅ Checklist Fase 3
- [ ] loans.calculator.ts creado con funciones puras
- [ ] loans.repository.ts con todas las queries
- [ ] loans.service.ts con lógica de negocio
- [ ] route.ts refactorizado (< 100 líneas)
- [ ] Tests manuales: crear loan, procesar pago
- [ ] Comparar resultados antes/después (deben ser idénticos)
- [ ] No hay regresiones en producción
- [ ] TypeScript 0 errors

**Criterio de éxito:** Funcionalidad idéntica, código 10x más mantenible

---

## **FASE 4: Testing (Semana 5)**
**Objetivo:** Prevenir regresiones futuras  
**Riesgo:** 🟢 Bajo (solo agrega tests, no modifica código)

### 4.1 Setup Testing Framework
**Tiempo estimado:** 30 min

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

**Crear:** `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Crear:** `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

**Agregar scripts:**
```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

---

### 4.2 Tests para Calculator (Crítico)
**Tiempo estimado:** 2 horas

**Crear:** `src/modules/loans/__tests__/loans.calculator.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateInterest,
  calculateInstallmentAmount,
  generatePaymentPlan,
  calculateLateFee,
  calculateDaysLate,
} from '../loans.calculator';

describe('LoansCalculator', () => {
  describe('calculateInterest', () => {
    it('should calculate simple interest correctly', () => {
      expect(calculateInterest(10000, 5)).toBe(500);
      expect(calculateInterest(20000, 10)).toBe(2000);
      expect(calculateInterest(5000, 3.5)).toBe(175);
    });

    it('should handle 0% interest', () => {
      expect(calculateInterest(10000, 0)).toBe(0);
    });

    it('should throw on negative principal', () => {
      expect(() => calculateInterest(-1000, 5)).toThrow();
    });

    it('should throw on invalid rate', () => {
      expect(() => calculateInterest(1000, -5)).toThrow();
      expect(() => calculateInterest(1000, 101)).toThrow();
    });
  });

  describe('calculateInstallmentAmount', () => {
    it('should divide total evenly', () => {
      expect(calculateInstallmentAmount(12000, 12)).toBe(1000);
      expect(calculateInstallmentAmount(5000, 5)).toBe(1000);
    });

    it('should handle decimals', () => {
      expect(calculateInstallmentAmount(10000, 3)).toBeCloseTo(3333.33, 2);
    });

    it('should throw on zero installments', () => {
      expect(() => calculateInstallmentAmount(1000, 0)).toThrow();
    });
  });

  describe('generatePaymentPlan', () => {
    it('should generate correct number of installments', () => {
      const plan = generatePaymentPlan(
        { principal: 10000, interestRate: 5, numInstallments: 12 },
        new Date('2025-01-01')
      );

      expect(plan).toHaveLength(12);
    });

    it('should have sequential installment numbers', () => {
      const plan = generatePaymentPlan(
        { principal: 10000, interestRate: 5, numInstallments: 3 },
        new Date('2025-01-01')
      );

      expect(plan[0].installmentNumber).toBe(1);
      expect(plan[1].installmentNumber).toBe(2);
      expect(plan[2].installmentNumber).toBe(3);
    });

    it('should have dates 30 days apart', () => {
      const plan = generatePaymentPlan(
        { principal: 10000, interestRate: 5, numInstallments: 2 },
        new Date('2025-01-01')
      );

      expect(plan[0].dueDate).toBe('2025-01-01');
      expect(plan[1].dueDate).toBe('2025-01-31');
    });

    it('should sum to total amount', () => {
      const plan = generatePaymentPlan(
        { principal: 10000, interestRate: 10, numInstallments: 12 },
        new Date('2025-01-01')
      );

      const totalPrincipal = plan.reduce((sum, p) => sum + p.principalAmount, 0);
      const totalInterest = plan.reduce((sum, p) => sum + p.interestAmount, 0);

      expect(totalPrincipal).toBeCloseTo(10000, 2);
      expect(totalInterest).toBeCloseTo(1000, 2);
    });
  });

  describe('calculateLateFee', () => {
    it('should calculate daily late fee', () => {
      expect(calculateLateFee(1000, 10, 0.01)).toBe(100); // 1% * 10 días
      expect(calculateLateFee(5000, 5, 0.02)).toBe(500);   // 2% * 5 días
    });

    it('should return 0 for no late days', () => {
      expect(calculateLateFee(1000, 0)).toBe(0);
      expect(calculateLateFee(1000, -5)).toBe(0);
    });
  });

  describe('calculateDaysLate', () => {
    it('should calculate days between dates', () => {
      const dueDate = '2025-01-01';
      const today = '2025-01-11';
      expect(calculateDaysLate(dueDate, today)).toBe(10);
    });

    it('should return 0 if not late', () => {
      const dueDate = '2025-01-15';
      const today = '2025-01-10';
      expect(calculateDaysLate(dueDate, today)).toBe(0);
    });
  });
});
```

**Ejecutar:**
```bash
npm test
```

**Coverage target:** > 90% para calculator

---

### 4.3 Tests para Service (Integración)
**Tiempo estimado:** 3 horas

**Crear:** `src/modules/loans/__tests__/loans.service.test.ts`
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LoansService } from '../loans.service';
import { loansRepository } from '../loans.repository';

// Mock del repository
vi.mock('../loans.repository', () => ({
  loansRepository: {
    createLoan: vi.fn(),
    createInstallments: vi.fn(),
    getLoanById: vi.fn(),
    updateInstallment: vi.fn(),
    createPayment: vi.fn(),
    updateLoan: vi.fn(),
  },
}));

describe('LoansService', () => {
  let service: LoansService;

  beforeEach(() => {
    service = new LoansService();
    vi.clearAllMocks();
  });

  describe('createLoan', () => {
    it('should create loan with installments', async () => {
      const mockLoan = { id: 'loan-123', total: 10500 };
      const mockInstallments = [{ id: 'inst-1' }, { id: 'inst-2' }];

      vi.mocked(loansRepository.createLoan).mockResolvedValue(mockLoan);
      vi.mocked(loansRepository.createInstallments).mockResolvedValue(mockInstallments);

      const result = await service.createLoan({
        client_id: 'client-123',
        principal: 10000,
        interest_rate: 5,
      });

      expect(result.loan).toBe(mockLoan);
      expect(result.installments).toBe(mockInstallments);
      expect(loansRepository.createLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          principal: 10000,
          interest_rate: 5,
        })
      );
    });
  });

  describe('processPayment', () => {
    it('should apply payment to oldest installment first', async () => {
      const mockLoan = {
        id: 'loan-123',
        total: 10500,
        amount_applied: 0,
        loan_installments: [
          {
            id: 'inst-1',
            due_date: '2025-01-01',
            principal_amount: 5000,
            interest_amount: 250,
            paid_amount: 0,
            status: 'Pendiente',
          },
          {
            id: 'inst-2',
            due_date: '2025-02-01',
            principal_amount: 5000,
            interest_amount: 250,
            paid_amount: 0,
            status: 'Pendiente',
          },
        ],
      };

      vi.mocked(loansRepository.getLoanById).mockResolvedValue(mockLoan);
      vi.mocked(loansRepository.updateInstallment).mockResolvedValue({} as any);
      vi.mocked(loansRepository.createPayment).mockResolvedValue({} as any);
      vi.mocked(loansRepository.updateLoan).mockResolvedValue({} as any);

      await service.processPayment({
        loanId: 'loan-123',
        amountPaid: 3000,
        paymentMethod: 'cash',
      });

      // Verificar que se actualizó el primer installment
      expect(loansRepository.updateInstallment).toHaveBeenCalledWith(
        'inst-1',
        expect.objectContaining({
          paid_amount: 3000,
          status: 'Parcial',
        })
      );
    });

    it('should throw if loan not found', async () => {
      vi.mocked(loansRepository.getLoanById).mockResolvedValue(null);

      await expect(
        service.processPayment({
          loanId: 'invalid',
          amountPaid: 1000,
          paymentMethod: 'cash',
        })
      ).rejects.toThrow('Préstamo no encontrado');
    });
  });
});
```

---

### 4.4 Tests para Schemas (Validación)
**Tiempo estimado:** 1 hora

**Crear:** `src/schemas/__tests__/loan.schema.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { createLoanSchema, processPaymentSchema } from '../loan.schema';

describe('Loan Schemas', () => {
  describe('createLoanSchema', () => {
    it('should validate correct loan data', () => {
      const validData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        principal: 10000,
        interest_rate: 5,
      };

      expect(() => createLoanSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid client_id', () => {
      const invalidData = {
        client_id: 'not-a-uuid',
        principal: 10000,
        interest_rate: 5,
      };

      expect(() => createLoanSchema.parse(invalidData)).toThrow();
    });

    it('should reject negative principal', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        principal: -1000,
        interest_rate: 5,
      };

      expect(() => createLoanSchema.parse(invalidData)).toThrow('mayor a 0');
    });

    it('should reject interest rate > 100', () => {
      const invalidData = {
        client_id: '123e4567-e89b-12d3-a456-426614174000',
        principal: 10000,
        interest_rate: 150,
      };

      expect(() => createLoanSchema.parse(invalidData)).toThrow();
    });
  });

  describe('processPaymentSchema', () => {
    it('should validate correct payment data', () => {
      const validData = {
        loanId: '123e4567-e89b-12d3-a456-426614174000',
        amountPaid: 5000,
        paymentMethod: 'cash' as const,
      };

      expect(() => processPaymentSchema.parse(validData)).not.toThrow();
    });

    it('should reject invalid payment method', () => {
      const invalidData = {
        loanId: '123e4567-e89b-12d3-a456-426614174000',
        amountPaid: 5000,
        paymentMethod: 'bitcoin', // No válido
      };

      expect(() => processPaymentSchema.parse(invalidData)).toThrow();
    });
  });
});
```

---

### ✅ Checklist Fase 4
- [ ] Vitest configurado
- [ ] Tests para calculator (> 90% coverage)
- [ ] Tests para service (> 70% coverage)
- [ ] Tests para schemas (100% coverage)
- [ ] `npm test` pasa sin errores
- [ ] Coverage report generado
- [ ] CI/CD configurado para ejecutar tests

**Criterio de éxito:** > 60% coverage total, 0 tests fallando

---

## **FASE 5: Optimización y Monitoreo (Semana 6)**
**Objetivo:** Performance y visibilidad  
**Riesgo:** 🟢 Bajo

### 5.1 Middleware de Performance
**Tiempo estimado:** 1 hora

**Crear:** `src/middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from './lib/logger';

export function middleware(request: NextRequest) {
  const start = Date.now();
  const url = request.nextUrl.pathname;

  // Solo loggear API routes
  if (!url.startsWith('/api/')) {
    return NextResponse.next();
  }

  return NextResponse.next().then((response) => {
    const duration = Date.now() - start;

    // Agregar header de timing
    response.headers.set('X-Response-Time', `${duration}ms`);

    // Log de requests lentas
    if (duration > 1000) {
      logger.warn('Slow API request', {
        url,
        method: request.method,
        duration: `${duration}ms`,
      });
    }

    // Log normal
    logger.debug('API request', {
      url,
      method: request.method,
      status: response.status,
      duration: `${duration}ms`,
    });

    return response;
  });
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 5.2 Health Checks Mejorados
**Tiempo estimado:** 30 min

**Modificar:** `src/app/api/health/route.ts`
```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
    database: 'checking...',
  };

  // Check Supabase connection
  try {
    const { error } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    checks.database = error ? 'error' : 'connected';
  } catch (e) {
    checks.database = 'error';
    checks.status = 'degraded';
  }

  const status = checks.database === 'connected' ? 200 : 503;

  return NextResponse.json(checks, { status });
}
```

---

### 5.3 Implementar Rate Limiting (Opcional)
**Tiempo estimado:** 1 hora

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Crear:** `src/lib/rate-limit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Configurar en .env.local:
// UPSTASH_REDIS_REST_URL=...
// UPSTASH_REDIS_REST_TOKEN=...

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 10 requests por 10 segundos
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});
```

**Usar en middleware:**
```typescript
// src/middleware.ts
const identifier = request.ip ?? 'anonymous';
const { success } = await ratelimit.limit(identifier);

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429 }
  );
}
```

---

### 5.4 Bundle Analysis
**Tiempo estimado:** 30 min

```bash
npm install -D @next/bundle-analyzer
```

**Modificar:** `next.config.ts`
```typescript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withPWA(nextConfig));
```

**Analizar:**
```bash
ANALYZE=true npm run build
```

**Optimizaciones comunes:**
- Tree-shake librerías pesadas (recharts, lucide-react)
- Code splitting en componentes grandes
- Lazy load modales y dialogs

---

### ✅ Checklist Fase 5
- [ ] Middleware de performance implementado
- [ ] Health checks robustos
- [ ] Bundle analyzer configurado
- [ ] Análisis de bundle ejecutado
- [ ] Optimizaciones aplicadas (lazy loading, etc.)
- [ ] Rate limiting (opcional)
- [ ] Lighthouse score > 90

**Criterio de éxito:** Response time < 300ms, bundle optimizado

---

## **FASE 6: Documentación y Cleanup (Semana 7)**
**Objetivo:** Código auto-documentado y limpio  
**Riesgo:** 🟢 Bajo

### 6.1 JSDoc para Funciones Públicas
**Tiempo estimado:** 2 horas

**Todas las funciones exportadas deben tener:**
```typescript
/**
 * Calcula el interés simple de un préstamo
 * 
 * @param principal - Monto principal del préstamo
 * @param rate - Tasa de interés (0-100)
 * @returns Monto de interés calculado
 * @throws {Error} Si principal es negativo o rate fuera de rango
 * 
 * @example
 * ```typescript
 * const interest = calculateInterest(10000, 5);
 * console.log(interest); // 500
 * ```
 */
export function calculateInterest(principal: number, rate: number): number {
  // ...
}
```

---

### 6.2 README Actualizado
**Tiempo estimado:** 1 hora

**Agregar secciones:**
```markdown
## 🏗️ Arquitectura

### Estructura de Carpetas
\`\`\`
src/
├── modules/          # Lógica de negocio modular
│   ├── loans/
│   │   ├── loans.service.ts      # Orquestación
│   │   ├── loans.repository.ts   # Data access
│   │   └── loans.calculator.ts   # Funciones puras
│   └── sales/
├── schemas/          # Validación Zod
├── lib/              # Utilidades compartidas
└── app/              # Next.js routes
\`\`\`

### Flujo de Datos
\`\`\`
Route Handler → Service → Repository → Supabase
      ↓            ↓           ↓
 Validación   Lógica     Queries
  (Zod)     Negocio
\`\`\`

## 🧪 Testing

\`\`\`bash
# Ejecutar tests
npm test

# Con UI
npm run test:ui

# Coverage
npm run test:coverage
\`\`\`

## 📊 Monitoreo

### Health Check
\`\`\`bash
curl http://localhost:9000/api/health
\`\`\`

### Performance Metrics
Ver headers `X-Response-Time` en responses
```

---

### 6.3 Limpiar Código Legacy
**Tiempo estimado:** 1 hora

**Eliminar:**
```typescript
// src/lib/firebase.ts - Ya no se usa
// src/app/api/loans/route.ts (versión vieja - ahora está modularizada)
// Cualquier comentario TODO/FIXME resuelto
```

**Verificar:**
```bash
# Buscar imports de firebase
grep -r "firebase" src/

# Buscar TODOs pendientes
grep -r "TODO\|FIXME" src/
```

---

### ✅ Checklist Fase 6
- [ ] JSDoc en todas las funciones públicas
- [ ] README actualizado con arquitectura
- [ ] Código legacy eliminado
- [ ] firebase.ts removido
- [ ] TODOs resueltos o documentados
- [ ] Guías de contribución actualizadas

---

## 📈 Métricas de Éxito

### Antes vs Después

| Métrica | Antes | Después | Objetivo |
|---------|-------|---------|----------|
| **Loans route LOC** | 857 | ~50 | ✅ -94% |
| **Test Coverage** | 0% | 60%+ | ✅ |
| **Avg Response Time** | 800ms | 200ms | ✅ -75% |
| **Bundle Size (Finance)** | 421 kB | 350 kB | ✅ -17% |
| **TypeScript Errors** | 0 | 0 | ✅ |
| **Vulnerabilities** | 0 | 0 | ✅ |
| **Lighthouse Score** | ? | 90+ | ✅ |
| **Build Time** | ? | < 45s | ✅ |

---

## 🚨 Estrategia de Rollback

### Por Fase

**Fase 1-2:** Bajo riesgo
- Revertir commits si algo falla
- No afecta funcionalidad

**Fase 3:** Alto riesgo
- ⚠️ **Branch separado:** `feature/loans-refactor`
- Testing exhaustivo antes de merge
- Deploy gradual (feature flag)
- Rollback: `git revert <commit>`

**Fase 4-6:** Bajo riesgo
- Agregan features, no modifican existentes
- Rollback individual por commit

### Feature Flags (Opcional)
```typescript
// src/lib/feature-flags.ts
export const features = {
  useNewLoansService: process.env.USE_NEW_LOANS === 'true',
};

// En route
const service = features.useNewLoansService 
  ? new LoansService() 
  : legacyLoansHandler;
```

---

## 📋 Checklist General

### Pre-Implementación
- [ ] Backup de base de datos
- [ ] Branch `main` protegido
- [ ] CI/CD configurado
- [ ] Staging environment disponible

### Durante Implementación
- [ ] Commits atómicos y descriptivos
- [ ] Tests pasan antes de cada commit
- [ ] Code review para cambios críticos (Fase 3)
- [ ] Documentación actualizada

### Post-Implementación
- [ ] Deploy a staging
- [ ] Testing manual completo
- [ ] Performance metrics capturadas
- [ ] Deploy a producción
- [ ] Monitoreo activo 24h
- [ ] Retrospectiva del equipo

---

## 🎯 Próximos Pasos

1. **Revisar este plan** con el equipo
2. **Estimar tiempos** reales según disponibilidad
3. **Priorizar fases** si hay limitaciones de tiempo
4. **Setup environment** (staging, CI/CD)
5. **Comenzar Fase 1** (bajo riesgo, alto impacto)

---

## 📞 Contacto y Soporte

- **Revisión de código:** Solicitar antes de mergear Fase 3
- **Dudas técnicas:** Consultar documentación de módulos
- **Emergencias:** Procedimiento de rollback activado

---

**Última actualización:** 30 Diciembre 2025  
**Estado:** ✅ Listo para ejecutar  
**Aprobado por:** [Pending]
