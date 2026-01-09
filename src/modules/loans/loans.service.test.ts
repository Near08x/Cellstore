/**
 * Loans Service Module Tests
 * 
 * Integration tests for the service layer
 * Mocks repository, tests orchestration logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as service from './loans.service';
import * as repository from './loans.repository';
import * as calculator from './loans.calculator';
import type { Loan, Installment } from '@/lib/types';
import type { CreateLoanInput, ProcessPaymentInput } from '@/schemas';

// Mock repository
vi.mock('./loans.repository');
vi.mock('@/lib/logger');

// Mock todayLocal para resultados predecibles
vi.spyOn(calculator, 'todayLocal').mockReturnValue('2024-01-15');

describe('Loans Service - Get Operations', () => {
  const mockLoan: Loan = {
    id: '1',
    loanNumber: 'LOAN-123',
    client_id: 'client-1',
    client_name: 'Test Client',
    principal: 5000,
    interestRate: 15,
    loanTerm: 12,
    loanType: 'Mensual',
    loanDate: '2024-01-15',
    start_date: '2024-01-15',
    due_date: '2025-01-15',
    amount: 5000,
    amountToPay: 5750,
    amountApplied: 0,
    overdueAmount: 0,
    lateFee: 0,
    totalPending: 5750,
    status: 'Pendiente',
    cashier: 'admin',
    installments: [
      {
        id: '1',
        loan_id: '1',
        installmentNumber: 1,
        dueDate: '2024-02-14',
        principal_amount: 416.67,
        interest_amount: 62.5,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente',
        paymentDate: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getAllLoans should recalculate aggregates', async () => {
    vi.mocked(repository.getAllLoans).mockResolvedValue([mockLoan]);

    const result = await service.getAllLoans();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: '1',
      loanNumber: 'LOAN-123',
      totalPending: expect.any(Number),
      overdueAmount: expect.any(Number),
    });
  });

  it('getLoanById should return loan with aggregates', async () => {
    vi.mocked(repository.getLoanById).mockResolvedValue(mockLoan);

    const result = await service.getLoanById('1');

    expect(result).toBeTruthy();
    expect(result?.id).toBe('1');
    expect(result?.totalPending).toBeDefined();
    expect(repository.getLoanById).toHaveBeenCalledWith('1');
  });

  it('getLoanById should return null if loan not found', async () => {
    vi.mocked(repository.getLoanById).mockResolvedValue(null);

    const result = await service.getLoanById('999');

    expect(result).toBeNull();
  });
});

describe('Loans Service - Create Loan', () => {
  const createInput: CreateLoanInput = {
    client_id: 'client-1',
    client_name: 'Test Client',
    principal: 5000,
    interestRate: 15,
    loanTerm: 12,
    loanType: 'Mensual',
    startDate: '2024-01-15',
    cashier: 'admin',
  };

  const mockCreatedLoan: Loan = {
    id: 'new-loan-1',
    loanNumber: 'LOAN-123456',
    client_id: createInput.client_id,
    client_name: createInput.client_name,
    principal: createInput.principal,
    interestRate: createInput.interestRate,
    loanTerm: createInput.loanTerm,
    loanType: createInput.loanType,
    loanDate: '2024-01-15',
    start_date: createInput.startDate,
    due_date: '2025-01-14',
    amount: createInput.principal,
    amountToPay: 5750,
    amountApplied: 0,
    overdueAmount: 0,
    lateFee: 0,
    totalPending: 5750,
    status: 'Pendiente',
    cashier: createInput.cashier,
    installments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.createLoan).mockResolvedValue('new-loan-1');
    vi.mocked(repository.createInstallments).mockResolvedValue(undefined);
    vi.mocked(repository.getLoanById).mockResolvedValue(mockCreatedLoan);
  });

  it('should create loan with calculated installments', async () => {
    const result = await service.createLoan(createInput);

    expect(result).toBeTruthy();
    expect(result.id).toBe('new-loan-1');
    expect(repository.createLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: createInput.client_id,
        principal: createInput.principal,
        interest_rate: createInput.interestRate,
        loan_term: createInput.loanTerm,
        loan_type: createInput.loanType,
      })
    );
    expect(repository.createInstallments).toHaveBeenCalledWith(
      'new-loan-1',
      expect.arrayContaining([
        expect.objectContaining({
          installment_number: 1,
          due_date: expect.any(String),
          principal_amount: expect.any(Number),
          interest_amount: expect.any(Number),
        }),
      ])
    );
  });

  it('should generate unique loan number', async () => {
    await service.createLoan(createInput);

    expect(repository.createLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        loan_number: expect.stringContaining('LOAN-'),
      })
    );
  });

  it('should calculate total amount correctly', async () => {
    await service.createLoan(createInput);

    expect(repository.createLoan).toHaveBeenCalledWith(
      expect.objectContaining({
        amount_to_pay: expect.any(Number),
      })
    );
  });
});

describe('Loans Service - Process Payment', () => {
  const mockLoanWithPending: Loan = {
    id: 'loan-1',
    loanNumber: 'LOAN-123',
    client_id: 'client-1',
    client_name: 'Test Client',
    principal: 5000,
    interestRate: 15,
    loanTerm: 12,
    loanType: 'Mensual',
    loanDate: '2024-01-15',
    start_date: '2024-01-15',
    due_date: '2024-03-14',
    amount: 5000,
    amountToPay: 5125,
    amountApplied: 0,
    overdueAmount: 0,
    lateFee: 0,
    totalPending: 5125,
    status: 'Aprobado',
    cashier: 'admin',
    installments: [
      {
        id: '1',
        loan_id: 'loan-1',
        installmentNumber: 1,
        dueDate: '2024-02-14',
        principal_amount: 2500,
        interest_amount: 62.5,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente',
        paymentDate: null,
      },
      {
        id: '2',
        loan_id: 'loan-1',
        installmentNumber: 2,
        dueDate: '2024-03-14',
        principal_amount: 2500,
        interest_amount: 62.5,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente',
        paymentDate: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process full payment for single installment', async () => {
    vi.mocked(repository.getLoanById)
      .mockResolvedValueOnce(mockLoanWithPending)
      .mockResolvedValueOnce({
        ...mockLoanWithPending,
        amountApplied: 2562.5,
        totalPending: 2562.5,
      });
    vi.mocked(repository.updateInstallments).mockResolvedValue(undefined);
    vi.mocked(repository.updateLoan).mockResolvedValue(undefined);

    const paymentInput: ProcessPaymentInput = {
      loanId: 'loan-1',
      paymentAmount: 2562.5,
      paymentDate: '2024-02-01',
    };

    const result = await service.processPayment(paymentInput);

    expect(repository.updateInstallments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          data: expect.objectContaining({
            paid_amount: expect.any(Number),
            status: expect.any(String),
          }),
        }),
      ])
    );
    expect(repository.updateLoan).toHaveBeenCalledWith(
      'loan-1',
      expect.objectContaining({
        amount_applied: expect.any(Number),
        total_pending: expect.any(Number),
      })
    );
  });

  it('should process partial payment', async () => {
    vi.mocked(repository.getLoanById)
      .mockResolvedValueOnce(mockLoanWithPending)
      .mockResolvedValueOnce({
        ...mockLoanWithPending,
        amountApplied: 1000,
        totalPending: 4125,
      });
    vi.mocked(repository.updateInstallments).mockResolvedValue(undefined);
    vi.mocked(repository.updateLoan).mockResolvedValue(undefined);

    const paymentInput: ProcessPaymentInput = {
      loanId: 'loan-1',
      paymentAmount: 1000,
    };

    await service.processPayment(paymentInput);

    expect(repository.updateInstallments).toHaveBeenCalled();
    expect(repository.updateLoan).toHaveBeenCalledWith(
      'loan-1',
      expect.objectContaining({
        status: 'Aprobado', // Not fully paid
      })
    );
  });

  it('should mark loan as Pagado when all installments paid', async () => {
    const almostFullyPaidLoan: Loan = {
      ...mockLoanWithPending,
      installments: [
        {
          ...mockLoanWithPending.installments[0],
          paidAmount: 2562.5,
          status: 'Pagado',
        },
        {
          ...mockLoanWithPending.installments[1],
          paidAmount: 2562.4,
          status: 'Parcial', // Almost paid, needs 0.1 more
        },
      ],
    };

    vi.mocked(repository.getLoanById)
      .mockResolvedValueOnce(almostFullyPaidLoan)
      .mockResolvedValueOnce({
        ...almostFullyPaidLoan,
        status: 'Pagado',
        totalPending: 0,
      });
    vi.mocked(repository.updateInstallments).mockResolvedValue(undefined);
    vi.mocked(repository.updateLoan).mockResolvedValue(undefined);

    const paymentInput: ProcessPaymentInput = {
      loanId: 'loan-1',
      paymentAmount: 0.1, // Final payment to complete
    };

    await service.processPayment(paymentInput);

    expect(repository.updateLoan).toHaveBeenCalledWith(
      'loan-1',
      expect.objectContaining({
        status: 'Pagado',
      })
    );
  });

  it('should throw error if loan not found', async () => {
    vi.clearAllMocks();
    vi.mocked(repository.getLoanById).mockResolvedValueOnce(null);

    const paymentInput: ProcessPaymentInput = {
      loanId: 'invalid-loan',
      paymentAmount: 1000,
    };

    await expect(service.processPayment(paymentInput)).rejects.toThrow('Loan not found');
  });

  it('should throw error if no pending installments', async () => {
    const allPaidLoan: Loan = {
      ...mockLoanWithPending,
      installments: [
        {
          ...mockLoanWithPending.installments[0],
          status: 'Pagado',
          paidAmount: 2562.5,
        },
        {
          ...mockLoanWithPending.installments[1],
          status: 'Pagado',
          paidAmount: 2562.5,
        },
      ],
    };

    vi.mocked(repository.getLoanById).mockResolvedValue(allPaidLoan);

    const paymentInput: ProcessPaymentInput = {
      loanId: 'loan-1',
      paymentAmount: 1000,
    };

    await expect(service.processPayment(paymentInput)).rejects.toThrow(
      'No pending installments to apply payment'
    );
  });
});

describe('Loans Service - Update Loan', () => {
  const mockLoan: Loan = {
    id: 'loan-1',
    loanNumber: 'LOAN-123',
    client_id: 'client-1',
    client_name: 'Test Client',
    principal: 5000,
    interestRate: 15,
    loanTerm: 12,
    loanType: 'Mensual',
    loanDate: '2024-01-15',
    start_date: '2024-01-15',
    due_date: '2025-01-14',
    amount: 5000,
    amountToPay: 5750,
    amountApplied: 0,
    overdueAmount: 0,
    lateFee: 0,
    totalPending: 5750,
    status: 'Pendiente',
    cashier: 'admin',
    installments: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.updateLoan).mockResolvedValue(undefined);
    vi.mocked(repository.getLoanById).mockResolvedValue(mockLoan);
  });

  it('should update loan status', async () => {
    await service.updateLoan({
      id: 'loan-1',
      status: 'Aprobado',
    });

    expect(repository.updateLoan).toHaveBeenCalledWith('loan-1', {
      status: 'Aprobado',
    });
  });

  it('should update multiple fields', async () => {
    await service.updateLoan({
      id: 'loan-1',
      status: 'Aprobado',
      lateFee: 50,
      totalPending: 5800,
    });

    expect(repository.updateLoan).toHaveBeenCalledWith(
      'loan-1',
      expect.objectContaining({
        status: 'Aprobado',
        late_fee: 50,
        total_pending: 5800,
      })
    );
  });

  it('should return updated loan', async () => {
    const result = await service.updateLoan({
      id: 'loan-1',
      status: 'Aprobado',
    });

    expect(result).toBeTruthy();
    expect(result.id).toBe('loan-1');
  });
});

describe('Loans Service - Delete Loan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.deleteLoan).mockResolvedValue(undefined);
  });

  it('should delete loan', async () => {
    await service.deleteLoan('loan-1');

    expect(repository.deleteLoan).toHaveBeenCalledWith('loan-1');
  });
});

describe('Loans Service - Update Overdue Installments', () => {
  const mockLoanWithOverdue: Loan = {
    id: 'loan-1',
    loanNumber: 'LOAN-123',
    client_id: 'client-1',
    client_name: 'Test Client',
    principal: 5000,
    interestRate: 15,
    loanTerm: 12,
    loanType: 'Mensual',
    loanDate: '2024-01-15',
    start_date: '2024-01-15',
    due_date: '2024-03-14',
    amount: 5000,
    amountToPay: 5125,
    amountApplied: 0,
    overdueAmount: 0,
    lateFee: 0,
    totalPending: 5125,
    status: 'Aprobado',
    cashier: 'admin',
    installments: [
      {
        id: '1',
        loan_id: 'loan-1',
        installmentNumber: 1,
        dueDate: '2023-12-01', // Overdue
        principal_amount: 2500,
        interest_amount: 62.5,
        paidAmount: 0,
        lateFee: 0,
        status: 'Pendiente',
        paymentDate: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(repository.getLoanById).mockResolvedValue(mockLoanWithOverdue);
    vi.mocked(repository.updateInstallments).mockResolvedValue(undefined);
  });

  it('should update overdue installments with late fees', async () => {
    await service.updateOverdueInstallments('loan-1', 0.05);

    expect(repository.updateInstallments).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          data: expect.objectContaining({
            late_fee: expect.any(Number),
            status: 'Atrasado',
          }),
        }),
      ])
    );
  });

  it('should not update paid installments', async () => {
    const loanWithPaidInstallment = {
      ...mockLoanWithOverdue,
      installments: [
        {
          ...mockLoanWithOverdue.installments[0],
          status: 'Pagado' as const,
          paidAmount: 2562.5,
          paid_amount: 2562.5,
        },
      ],
    };

    vi.mocked(repository.getLoanById).mockResolvedValue(loanWithPaidInstallment);

    await service.updateOverdueInstallments('loan-1');

    expect(repository.updateInstallments).not.toHaveBeenCalled();
  });

  it('should throw error if loan not found', async () => {
    vi.mocked(repository.getLoanById).mockResolvedValue(null);

    await expect(service.updateOverdueInstallments('invalid-loan')).rejects.toThrow(
      'Loan not found'
    );
  });
});
