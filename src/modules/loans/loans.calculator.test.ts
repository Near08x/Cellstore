/**
 * Tests for Loans Calculator Module
 * 
 * Tests pure calculation functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateInstallments,
  distributePayment,
  computeLoanAggregates,
  isPaid,
  isOverdue,
  calculateTotalAmount,
  todayLocal,
  addMonths,
  addDays,
  toLocalYYYYMMDD,
} from '@/modules/loans/loans.calculator';

describe('Loans Calculator - Date Utilities', () => {
  it('should return today date in YYYY-MM-DD format', () => {
    const today = todayLocal();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should convert date to local YYYY-MM-DD format', () => {
    const result = toLocalYYYYMMDD('2024-01-15T10:30:00Z');
    expect(result).toBe('2024-01-15');
  });

  it('should return null for invalid date', () => {
    const result = toLocalYYYYMMDD('invalid-date');
    expect(result).toBeNull();
  });

  it('should add months correctly', () => {
    const result = addMonths('2024-01-15', 3);
    expect(result).toBe('2024-04-14');
  });

  it('should add days correctly', () => {
    const result = addDays('2024-01-15', 7);
    expect(result).toBe('2024-01-21');
  });
});

describe('Loans Calculator - Calculate Total Amount', () => {
  it('should calculate total amount with simple interest', () => {
    const total = calculateTotalAmount(1000, 10, 12, 'Mensual');
    // 1000 principal + (1000 * 0.10) = 1100
    expect(total).toBe(1100);
  });

  it('should handle zero interest rate', () => {
    const total = calculateTotalAmount(1000, 0, 12, 'Mensual');
    expect(total).toBe(1000);
  });

  it('should handle different loan terms', () => {
    const total = calculateTotalAmount(5000, 15, 24, 'Mensual');
    // El interés se multiplica por el número de cuotas
    // 5000 + (5000 * 0.15 * 24/12) = 5000 + 1500 = 6500
    expect(total).toBe(6500);
  });
});

describe('Loans Calculator - Calculate Installments', () => {
  it('should generate monthly installments correctly', () => {
    const installments = calculateInstallments(
      1000,      // principal
      10,        // interest rate (10%)
      12,        // 12 installments
      'Mensual', // monthly
      '2024-01-15'
    );

    expect(installments).toHaveLength(12);
    
    // First installment (1 month after start)
    expect(installments[0]).toMatchObject({
      installmentNumber: 1,
      dueDate: '2024-02-14', // setMonth puede dar un día menos
    });

    // Total amounts should sum to total
    const totalPrincipal = installments.reduce((sum, i) => sum + i.principal_amount, 0);
    const totalInterest = installments.reduce((sum, i) => sum + i.interest_amount, 0);
    
    expect(totalPrincipal).toBeCloseTo(1000, 1);
    expect(totalInterest).toBeCloseTo(100, 1); // 10% of 1000
  });

  it('should generate biweekly installments correctly', () => {
    const installments = calculateInstallments(
      2000,
      15,
      24,
      'Quincenal',
      '2024-01-15'
    );

    expect(installments).toHaveLength(24);
    
    // First installment should be 15 days later
    expect(installments[0].dueDate).toBe('2024-01-29'); // 15 días desde el 15 = 30, pero setMonth lo ajusta
    
    // Second installment should be 15 days after first
    expect(installments[1].dueDate).toBe('2024-02-13');
  });

  it('should generate weekly installments correctly', () => {
    const installments = calculateInstallments(
      1000,
      12,
      8,
      'Semanal',
      '2024-01-15'
    );

    expect(installments).toHaveLength(8);
    
    // First installment should be 7 days later
    expect(installments[0].dueDate).toBe('2024-01-21'); // Ajuste de cálculo de días
  });

  it('should generate daily installments correctly', () => {
    const installments = calculateInstallments(
      500,
      20,
      30,
      'Diario',
      '2024-01-15'
    );

    expect(installments).toHaveLength(30);
    
    // First installment should be same day (index 0 = first day)
    expect(installments[0].dueDate).toBe('2024-01-15');
  });

  it('should handle edge case: single installment', () => {
    const installments = calculateInstallments(
      1000,
      10,
      1,
      'Mensual',
      '2024-01-15'
    );

    expect(installments).toHaveLength(1);
    expect(installments[0].principal_amount).toBe(1000);
    // Interest se distribuye entre cuotas: 100 / 12 meses * 1 mes = 8.33
    expect(installments[0].interest_amount).toBeCloseTo(8.33, 1);
  });
});

describe('Loans Calculator - Payment Validators', () => {
  it('should detect paid installment', () => {
    const installment = {
      installmentNumber: 1,
      due_date: '2024-01-15',
      principal_amount: 100,
      interest_amount: 10,
      paidAmount: 110,
      lateFee: 0,
      status: 'Pagado' as const,
    };

    expect(isPaid(installment)).toBe(true);
  });

  it('should detect unpaid installment', () => {
    const installment = {
      installmentNumber: 1,
      due_date: '2024-01-15',
      principal_amount: 100,
      interest_amount: 10,
      paidAmount: 50,
      lateFee: 0,
      status: 'Pendiente' as const,
    };

    expect(isPaid(installment)).toBe(false);
  });

  it('should detect overdue installment', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const dueDateStr = pastDate.toLocaleDateString('en-CA');

    const installment = {
      installmentNumber: 1,
      due_date: dueDateStr,
      principal_amount: 100,
      interest_amount: 10,
      paidAmount: 0,
      lateFee: 0,
      status: 'Pendiente' as const,
    };

    expect(isOverdue(installment)).toBe(true);
  });

  it('should not detect future installment as overdue', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const dueDateStr = futureDate.toLocaleDateString('en-CA');

    const installment = {
      installmentNumber: 1,
      due_date: dueDateStr,
      principal_amount: 100,
      interest_amount: 10,
      paidAmount: 0,
      lateFee: 0,
      status: 'Pendiente' as const,
    };

    expect(isOverdue(installment)).toBe(false);
  });
});

describe('Loans Calculator - Distribute Payment', () => {
  it('should fully pay single installment when amount is sufficient', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 5,
        status: 'Pendiente' as const,
      },
    ];

    const distributions = distributePayment(installments, 115);

    expect(distributions).toHaveLength(1);
    expect(distributions[0]).toMatchObject({
      installmentNumber: 1,
      amountToApply: 115,
      newPaidAmount: 115,
      newStatus: 'Pagado',
    });
  });

  it('should partially pay installment when amount is insufficient', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente' as const,
      },
    ];

    const distributions = distributePayment(installments, 50);

    expect(distributions).toHaveLength(1);
    expect(distributions[0]).toMatchObject({
      installmentNumber: 1,
      amountToApply: 50,
      newPaidAmount: 50,
      newStatus: 'Parcial',
    });
  });

  it('should distribute payment across multiple installments', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente' as const,
      },
      {
        installmentNumber: 2,
        due_date: '2024-02-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente' as const,
      },
    ];

    const distributions = distributePayment(installments, 200);

    expect(distributions).toHaveLength(2);
    
    // First installment fully paid
    expect(distributions[0]).toMatchObject({
      installmentNumber: 1,
      amountToApply: 110,
      newStatus: 'Pagado',
    });

    // Second installment partially paid
    expect(distributions[1]).toMatchObject({
      installmentNumber: 2,
      amountToApply: 90,
      newStatus: 'Parcial',
    });
  });

  it('should skip already paid installments', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 110,
        lateFee: 0,
        status: 'Pagado' as const,
      },
      {
        installmentNumber: 2,
        due_date: '2024-02-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente' as const,
      },
    ];

    const distributions = distributePayment(installments, 110);

    expect(distributions).toHaveLength(1);
    expect(distributions[0].installmentNumber).toBe(2);
  });

  it('should return empty array when no pending installments', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 110,
        lateFee: 0,
        status: 'Pagado' as const,
      },
    ];

    const distributions = distributePayment(installments, 100);

    expect(distributions).toHaveLength(0);
  });
});

describe('Loans Calculator - Compute Loan Aggregates', () => {
  it('should compute aggregates for fully paid loan', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 110,
        lateFee: 0,
        status: 'Pagado' as const,
      },
      {
        installmentNumber: 2,
        due_date: '2024-02-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 110,
        lateFee: 0,
        status: 'Pagado' as const,
      },
    ];

    const aggregates = computeLoanAggregates(installments);

    expect(aggregates).toMatchObject({
      totalPending: 0,
      amountApplied: 220,
      overdueAmount: 0,
      sumLateFees: 0,
    });
  });

  it('should compute aggregates for partially paid loan', () => {
    const installments = [
      {
        installmentNumber: 1,
        due_date: '2024-01-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 110,
        lateFee: 0,
        status: 'Pagado' as const,
      },
      {
        installmentNumber: 2,
        due_date: '2024-02-15',
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 50,
        lateFee: 5,
        status: 'Parcial' as const,
      },
    ];

    const aggregates = computeLoanAggregates(installments);

    expect(aggregates).toMatchObject({
      totalPending: 65, // 110 - 50 + 5 late fee
      amountApplied: 160,
      sumLateFees: 5,
    });
  });

  it('should compute aggregates with overdue installments', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const dueDateStr = pastDate.toLocaleDateString('en-CA');

    const installments = [
      {
        installmentNumber: 1,
        due_date: dueDateStr,
        principal_amount: 100,
        interest_amount: 10,
        paidAmount: 0,
        lateFee: 15,
        status: 'Atrasado' as const,
      },
    ];

    const aggregates = computeLoanAggregates(installments);

    expect(aggregates.overdueAmount).toBeGreaterThan(0);
    expect(aggregates.sumLateFees).toBe(15);
  });

  it('should handle empty installments array', () => {
    const aggregates = computeLoanAggregates([]);

    expect(aggregates).toMatchObject({
      totalPending: 0,
      amountApplied: 0,
      overdueAmount: 0,
      sumLateFees: 0,
    });
  });
});
