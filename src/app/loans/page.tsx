export const dynamic = 'force-dynamic';

import MainLayout from '@/components/main-layout';
import LoansClient from '@/components/loans/loans-client';
import type { Loan, Client } from '@/lib/types';
import { supabase as supabaseServer } from '@/lib/supabaseServer';

async function getData(): Promise<{ loans: Loan[]; clients: Client[] }> {
  try {
    const [loansRes, clientsRes] = await Promise.all([
      supabaseServer.from('loans').select(`
        *,
        loan_installments (*),
        clients (
          id,
          name,
          email,
          phone
        )
      `),
      supabaseServer.from('clients').select('*'),
    ]);

    if (loansRes.error || clientsRes.error) {
      throw new Error(
        `Supabase error: ${loansRes.error?.message || ''} ${clientsRes.error?.message || ''}`
      );
    }

    // Normalize loans data
    const normalizeLoan = (row: any): Loan => {
      // Normalizar installments
      const rawInstallments = Array.isArray(row.loan_installments) 
        ? row.loan_installments 
        : [];
      
      const installments = rawInstallments.map((inst: any) => ({
        id: inst.id,
        loan_id: inst.loan_id,
        installmentNumber: inst.installment_number || inst.installmentNumber,
        due_date: inst.due_date,
        dueDate: inst.due_date || inst.dueDate,
        principal_amount: Number(inst.principal_amount || 0),
        interest_amount: Number(inst.interest_amount || 0),
        paidAmount: Number(inst.paid_amount || inst.paidAmount || 0),
        lateFee: Number(inst.late_fee || inst.lateFee || 0),
        status: inst.status || 'Pendiente',
        payment_date: inst.payment_date,
      }));
      
      // Obtener el nombre del cliente del JOIN
      const clientName = row.clients?.name || row.client_name || row.customerName || '';
      
      return {
        id: row.id,
        loanNumber: row.loan_number || row.loanNumber || '',
        client_id: row.client_id,
        client_name: clientName,
        customerName: clientName,
        loanDate: row.loan_date || row.loanDate || row.created_at || new Date().toISOString(),
        start_date: row.start_date,
        startDate: row.start_date,
        due_date: row.due_date,
        dueDate: row.due_date,
        principal: Number(row.principal || 0),
        interestRate: Number(row.interest_rate || row.interestRate || 0),
        amount: Number(row.amount || 0),
        amountToPay: Number(row.amount_to_pay || row.amountToPay || 0),
        amountApplied: Number(row.amount_applied || row.amountApplied || 0),
        overdueAmount: Number(row.overdue_amount || row.overdueAmount || 0),
        lateFee: Number(row.late_fee || row.lateFee || 0),
        totalPending: Number(row.total_pending || row.totalPending || 0),
        installments: installments,
        status: row.status || 'Pendiente',
      };
    };

    const loans = (loansRes.data ?? []).map(normalizeLoan);
    const clients = (clientsRes.data as Client[]) ?? [];

    return { loans, clients };
  } catch (error) {
    console.error('Error fetching loans data:', error);
    return { loans: [], clients: [] };
  }
}

export default async function LoansPage() {
  const { loans, clients } = await getData();
  return (
    <MainLayout>
      <LoansClient loans={loans} clients={clients} />
    </MainLayout>
  );
}

