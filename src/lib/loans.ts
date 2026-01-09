import { supabase } from '@/lib/supabaseServer';

export type InstallmentRow = {
  id?: number | string;
  loan_id?: string;
  installment_number?: number;
  due_date?: string | null;
  principal_amount?: number | null;
  interest_amount?: number | null;
  paid_amount?: number | null;
  late_fee?: number | null;
  status?: string | null;
  payment_date?: string | null;
};

export function isPaid(installment: InstallmentRow) {
  const total =
    Number(installment.principal_amount ?? 0) +
    Number(installment.interest_amount ?? 0) +
    Number(installment.late_fee ?? 0);
  const paid = Number(installment.paid_amount ?? 0);
  return paid >= total - 1e-6;
}

export function isOverdue(installment: InstallmentRow) {
  if (!installment?.due_date) return false;
  const due = new Date(installment.due_date);
  if (isNaN(due.getTime())) return false;
  const today = new Date(new Date().toLocaleDateString('en-CA'));
  return due < today && installment.status !== 'Pagado';
}

// Pure function that computes aggregates from an array of installments
export function computeAggregatesFromInstallments(installs: InstallmentRow[] = []) {
  const instArray = Array.isArray(installs) ? installs : [];
  let sumLateFees = 0;
  let overdueAmount = 0;
  let totalPending = 0;

  for (const i of instArray) {
    const principal = Number(i.principal_amount ?? 0);
    const interest = Number(i.interest_amount ?? 0);
    const fee = Number(i.late_fee ?? 0);
    const paid = Number(i.paid_amount ?? 0);
    const cuotaTotal = principal + interest + fee;
    const pendiente = Math.max(cuotaTotal - paid, 0);

    sumLateFees += fee;
    totalPending += pendiente;

    const paidFlag = isPaid(i);
    const overdueFlag = isOverdue(i);
    if (!paidFlag && overdueFlag) overdueAmount += pendiente;
  }

  return { sumLateFees, overdueAmount, totalPending };
}

export async function computeLoanAggregates(loanId: string) {
  const { data: inst, error } = await supabase
    .from('loan_installments')
    .select('*')
    .eq('loan_id', loanId);

  if (error) throw error;

  return computeAggregatesFromInstallments(inst ?? []);
}
