/**
 * API Routes Tests - Loans
 * 
 * Tests de endpoints HTTP para el módulo de préstamos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST, PUT, PATCH, DELETE } from './route';
import * as loansService from '@/modules/loans/loans.service';
import { supabase } from '@/lib/supabaseServer';
import type { Loan } from '@/lib/types';

// Mock de dependencias
vi.mock('@/modules/loans/loans.service');
vi.mock('@/lib/supabaseServer');
vi.mock('@/lib/logger');
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Loans API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/loans', () => {
    it('should return loans and clients successfully', async () => {
      const mockLoans: Loan[] = [
        {
          id: 'loan-1',
          loanNumber: 'LOAN-001',
          client_id: 'client-1',
          client_name: 'Juan Pérez',
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
        },
      ];

      const mockClients = [
        { id: 'client-1', name: 'Juan Pérez', email: 'juan@test.com' },
      ];

      vi.mocked(loansService.getAllLoans).mockResolvedValue(mockLoans);
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
        }),
      } as any);

      const mockRequest = {} as Request;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data).toEqual({
        loans: mockLoans,
        clients: mockClients,
      });
      expect(response.status).toBe(200);
      expect(loansService.getAllLoans).toHaveBeenCalledOnce();
    });

    it('should handle error when fetching clients fails', async () => {
      vi.mocked(loansService.getAllLoans).mockResolvedValue([]);
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      } as any);

      const mockRequest = {} as Request;
      const response = await GET(mockRequest);
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/loans', () => {
    it('should create loan successfully', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          client_id: '550e8400-e29b-41d4-a716-446655440000',
          client_name: 'Juan Pérez',
          principal: 5000,
          interestRate: 15,
          loanTerm: 12,
          loanType: 'Mensual',
          startDate: '2024-01-15',
        }),
      } as any;

      const mockCreatedLoan: Loan = {
        id: 'new-loan-1',
        loanNumber: 'LOAN-002',
        client_id: 'client-1',
        client_name: 'Juan Pérez',
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

      vi.mocked(loansService.createLoan).mockResolvedValue(mockCreatedLoan);
      
      // Mock capital update
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 1, total: 10000 },
              error: null,
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const response = await POST(mockRequest);
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.id).toBe('new-loan-1');
      expect(data.loanNumber).toBe('LOAN-002');
      expect(loansService.createLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: '550e8400-e29b-41d4-a716-446655440000',
          principal: 5000,
        })
      );
    });

    it('should reject invalid loan data', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          client_id: 'client-1',
          principal: -100, // Invalid negative
          interestRate: 15,
          loanTerm: 12,
        }),
      } as any;

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle service errors', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          client_id: 'client-1',
          principal: 5000,
          interestRate: 15,
          loanTerm: 12,
          loanType: 'Mensual',
          loanDate: '2024-01-15',
        }),
      } as any;

      vi.mocked(loansService.createLoan).mockRejectedValue(
        new Error('Service error')
      );

      const response = await POST(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('PUT /api/loans', () => {
    it('should update loan successfully', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          id: '550e8400-e29b-41d4-a716-446655440001',
          status: 'Pagado',
          totalPending: 0,
        }),
      } as any;

      const mockUpdatedLoan: Loan = {
        id: 'loan-1',
        loanNumber: 'LOAN-001',
        client_id: 'client-1',
        client_name: 'Juan Pérez',
        principal: 5000,
        interestRate: 15,
        loanTerm: 12,
        loanType: 'Mensual',
        loanDate: '2024-01-15',
        start_date: '2024-01-15',
        due_date: '2025-01-14',
        amount: 5000,
        amountToPay: 5750,
        amountApplied: 5750,
        overdueAmount: 0,
        lateFee: 0,
        totalPending: 0,
        status: 'Pagado',
        cashier: 'admin',
        installments: [],
      };

      vi.mocked(loansService.updateLoan).mockResolvedValue(mockUpdatedLoan);

      const response = await PUT(mockRequest);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.id).toBe('loan-1');
      expect(data.status).toBe('Pagado');
      expect(loansService.updateLoan).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '550e8400-e29b-41d4-a716-446655440001',
          status: 'Pagado',
        })
      );
    });

    it('should reject update without loan ID', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          status: 'Pagado',
        }),
      } as any;

      const response = await PUT(mockRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBeTruthy();
      // "validation error" is correct, Zod returns this message
    });
  });

  describe('PATCH /api/loans', () => {
    it('should process payment successfully', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          loanId: '550e8400-e29b-41d4-a716-446655440001',
          installmentId: 'inst-1',
          paymentAmount: 500,
          paymentMethod: 'cash',
        }),
      } as any;

      const mockLoanAfterPayment: Loan = {
        id: 'loan-1',
        loanNumber: 'LOAN-001',
        client_id: 'client-1',
        client_name: 'Juan Pérez',
        principal: 5000,
        interestRate: 15,
        loanTerm: 12,
        loanType: 'Mensual',
        loanDate: '2024-01-15',
        start_date: '2024-01-15',
        due_date: '2025-01-14',
        amount: 5000,
        amountToPay: 5750,
        amountApplied: 500,
        overdueAmount: 0,
        lateFee: 0,
        totalPending: 5250,
        status: 'Pendiente',
        cashier: 'admin',
        installments: [],
      };

      vi.mocked(loansService.processPayment).mockResolvedValue(mockLoanAfterPayment);
      
      // Mock capital update
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 1, total: 5000 },
              error: null,
            }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as any);

      const response = await PATCH(mockRequest);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.message).toBe('Pago procesado correctamente');
      expect(data.loan.totalPending).toBe(5250);
      expect(data.capitalTotal).toBe(5500);
      expect(loansService.processPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          loanId: '550e8400-e29b-41d4-a716-446655440001',
          paymentAmount: 500,
        })
      );
    });

    it('should reject invalid payment amount', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          loanId: 'loan-1',
          installmentId: 'inst-1',
          paymentAmount: -100, // Invalid negative
        }),
      } as any;

      const response = await PATCH(mockRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('should handle zero payment amount', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          loanId: '550e8400-e29b-41d4-a716-446655440001',
          installmentId: 'inst-1',
          paymentAmount: 0,
          paymentMethod: 'cash',
        }),
      } as any;

      const mockLoan: Loan = {
        id: 'loan-1',
        loanNumber: 'LOAN-001',
        client_id: 'client-1',
        client_name: 'Juan Pérez',
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

      vi.mocked(loansService.processPayment).mockResolvedValue(mockLoan);

      const response = await PATCH(mockRequest);
      expect(response.status).toBe(400); // Zero is invalid
      
      const data = await response.json();
      expect(data.error).toBeTruthy();
      // Zod returns 'Validation error' as generic error message
    });
  });

  describe('DELETE /api/loans', () => {
    it('should delete loan successfully', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          id: 'loan-1',
        }),
      } as any;

      vi.mocked(loansService.deleteLoan).mockResolvedValue();

      const response = await DELETE(mockRequest);
      const data = await response.json();

      expect(data.message).toBe('Loan deleted successfully');
      expect(loansService.deleteLoan).toHaveBeenCalledWith('loan-1');
    });

    it('should reject delete without loan ID', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({}),
      } as any;

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Loan ID is required');
    });

    it('should handle service errors during deletion', async () => {
      const mockRequest = {
        json: vi.fn().mockResolvedValue({
          id: 'loan-1',
        }),
      } as any;

      vi.mocked(loansService.deleteLoan).mockRejectedValue(
        new Error('Loan not found')
      );

      const response = await DELETE(mockRequest);
      expect(response.status).toBeGreaterThanOrEqual(400);
      
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
