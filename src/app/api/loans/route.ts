'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

// ✅ Helper consistente para fechas locales "YYYY-MM-DD"
function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA'); // formato ISO local
}
function toLocalYYYYMMDD(d?: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString('en-CA');
}

type Installment = {
  id?: string;
  due_date?: string;
  principal_amount?: number;
  interest_amount?: number;
  paid_amount?: number;
  late_fee?: number;
  status?: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial';
  payment_date?: string;
};

type LoanInput = {
  id?: string;
  client_id?: string;
  principal: number;
  loan_number?: string;
  interest_rate: number;
  start_date?: string;
  status?: string;
  installments?: Installment[];
};

// =======================
// GET: obtener préstamos con cliente y cuotas
// =======================
export async function GET() {
  try {
    const [loansRes, clientsRes] = await Promise.all([
      supabase
        .from('loans')
        .select(`
          id, loan_number, principal, interest_rate, amount, amount_to_pay, total, balance,
          total_pending, amount_applied, start_date, status, created_at,
          clients (id, name),
          loan_installments (
            id, installment_number, due_date, principal_amount, interest_amount,
            paid_amount, late_fee, status, payment_date
          )
        `)
        .order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, email, phone, created_at'),
    ]);

    if (loansRes.error) throw loansRes.error;
    if (clientsRes.error) throw clientsRes.error;

    const loans = loansRes.data?.map((loan: any) => ({
      id: loan.id,
      loanNumber: loan.loan_number,
      principal: loan.principal ?? 0,
      interestRate: loan.interest_rate ?? 0,
      amount: loan.amount ?? 0,
      amountToPay: loan.amount_to_pay ?? loan.total ?? 0,
      total: loan.total ?? 0,
      balance: loan.balance ?? 0,
      totalPending: loan.total_pending ?? 0,
      startDate: toLocalYYYYMMDD(loan.start_date),
      status: loan.status,
      amountApplied: loan.amount_applied ?? 0,
      client_id: loan.clients?.id ?? null,
      client_name: loan.clients?.name ?? 'Consumidor Final',
      installments:
        loan.loan_installments?.map((i: any) => ({
          id: i.id,
          installmentNumber: i.installment_number,
          dueDate: toLocalYYYYMMDD(i.due_date),
          principal_amount: i.principal_amount ?? 0,
          interest_amount: i.interest_amount ?? 0,
          paidAmount: i.paid_amount ?? 0,
          lateFee: i.late_fee ?? 0,
          status: i.status ?? 'Pendiente',
          paymentDate: toLocalYYYYMMDD(i.payment_date),
        })) ?? [],
    }));

    return NextResponse.json({
      loans: loans ?? [],
      clients: clientsRes.data ?? [],
    });
  } catch (error) {
    console.error('Error fetching loans and clients:', error);
    return NextResponse.json(
      { message: 'Error fetching loans and clients', error },
      { status: 500 }
    );
  }
}

// =======================
// POST: crear préstamo (usa start_date y calcula due_date)
// =======================
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoanInput;
    const { installments, ...loanData } = body;

    if (!loanData.client_id) {
      return NextResponse.json(
        { message: 'Debe seleccionar un cliente válido para crear un préstamo' },
        { status: 400 }
      );
    }

    const principal = Number(loanData.principal) || 0;
    const interestRate = Number(loanData.interest_rate) || 0;
    const interest = principal * (interestRate / 100);
    const total = principal + interest;

    // ✅ Fechas de inicio y vencimiento
    const start_date = loanData.start_date
      ? toLocalYYYYMMDD(loanData.start_date)
      : todayLocal();

    const due_date =
      installments && installments.length > 0
        ? toLocalYYYYMMDD(
            (installments[installments.length - 1] as any).dueDate ??
              (installments[installments.length - 1] as any).due_date
          )
        : start_date;

    // ✅ Insertar préstamo principal
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        client_id: loanData.client_id,
        loan_number: loanData.loan_number || `LN-${Date.now()}`,
        principal,
        interest_rate: interestRate,
        amount: principal,
        total,
        balance: total,
        amount_to_pay: total,
        total_pending: total,
        start_date,
        due_date,
        status: loanData.status || 'Pendiente',
      })
      .select()
      .single();

    if (loanError) throw loanError;

    // ✅ Insertar cuotas vinculadas
    let createdInstallments: any[] = [];

    if (installments && installments.length > 0) {
      const fallback = todayLocal();

      const installmentsWithLoan = installments.map((i: any, idx: number) => ({
        loan_id: loan.id,
        installment_number:
          i.installmentNumber ?? i.installment_number ?? idx + 1,
        due_date: toLocalYYYYMMDD(i.dueDate ?? i.due_date ?? fallback),
        principal_amount: i.principal_amount ?? 0,
        interest_amount: i.interest_amount ?? 0,
        paid_amount: 0,
        late_fee: 0,
        status: i.status || 'Pendiente',
      }));

      const { data: instData, error: instError } = await supabase
        .from('loan_installments')
        .insert(installmentsWithLoan)
        .select();

      if (instError) throw instError;

      createdInstallments = (instData ?? []).map((i: any) => ({
        ...i,
        due_date: toLocalYYYYMMDD(i.due_date),
        payment_date: i.payment_date
          ? toLocalYYYYMMDD(i.payment_date)
          : null,
      }));
    }

    await supabase
      .from('clients')
      .update({ last_loan_id: loan.id })
      .eq('id', loan.client_id);

    return NextResponse.json({
      id: loan.id,
      loanNumber: loan.loan_number,
      principal: loan.principal ?? 0,
      interestRate: loan.interest_rate ?? 0,
      total: loan.total ?? 0,
      balance: loan.balance ?? 0,
      totalPending: loan.total_pending ?? 0,
      startDate: toLocalYYYYMMDD(loan.start_date),
      dueDate: toLocalYYYYMMDD(loan.due_date),
      status: loan.status,
      amountApplied: loan.amount_applied ?? 0,
      clientId: loan.client_id ?? null,
      clientName: '',
      installments: createdInstallments ?? [],
    });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json(
      { message: 'Error creating loan', error },
      { status: 500 }
    );
  }
}



// =======================
// PUT: actualizar préstamo (solo mantiene start_date)
// =======================
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as LoanInput;
    const { id, installments, ...loanData } = body;

    if (!id) {
      return NextResponse.json({ message: 'Loan ID is required for update' }, { status: 400 });
    }

    const principal = Number(loanData.principal) || 0;
    const interestRate = Number(loanData.interest_rate) || 0;
    const interest = principal * (interestRate / 100);
    const total = principal + interest;

    const start_date = loanData.start_date
      ? toLocalYYYYMMDD(loanData.start_date)
      : todayLocal();

    const { error: loanError } = await supabase
      .from('loans')
      .update({
        client_id: loanData.client_id,
        loan_number: loanData.loan_number,
        principal,
        interest_rate: interestRate,
        amount: principal,
        total,
        balance: total,
        amount_to_pay: total,
        total_pending: total,
        start_date,
        status: loanData.status || 'Pendiente',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (loanError) throw loanError;

    if (installments) {
      await supabase.from('loan_installments').delete().eq('loan_id', id);

      const fallback = todayLocal();
      const installmentsWithLoan = installments.map((i, idx) => ({
        loan_id: id,
        installment_number: idx + 1,
        due_date: i.due_date ? toLocalYYYYMMDD(i.due_date) : fallback,
        principal_amount: i.principal_amount ?? 0,
        interest_amount: i.interest_amount ?? 0,
        paid_amount: 0,
        late_fee: 0,
        status: i.status || 'Pendiente',
      }));

      const { error: instError } = await supabase
        .from('loan_installments')
        .insert(installmentsWithLoan);

      if (instError) throw instError;
    }

    return NextResponse.json({
      id,
      loanNumber: loanData.loan_number ?? '',
      principal,
      interestRate,
      total,
      totalPending: total,
      startDate: start_date,
      status: loanData.status || 'Pendiente',
      installments: installments ?? [],
    });
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ message: 'Error updating loan', error }, { status: 500 });
  }
}

// =======================
// DELETE y PATCH se mantienen igual (ya correctos)
// =======================

export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string };

    if (!id) {
      return NextResponse.json(
        { message: 'Loan ID is required for delete' },
        { status: 400 }
      );
    }

    // Primero eliminamos cuotas relacionadas
    await supabase.from('loan_installments').delete().eq('loan_id', id);

    // (Opcional) Si quisieras eliminar pagos, descomenta:
    // await supabase.from('loan_payments').delete().eq('loan_id', id);

    const { error } = await supabase.from('loans').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ message: 'Error deleting loan', error }, { status: 500 });
  }
}

// =======================
// PATCH: procesar pago de préstamo
// =======================
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { loanId, installmentId, amountPaid, paymentMethod } = body;

    if (!loanId || !amountPaid) {
      return NextResponse.json(
        { error: 'Faltan datos para procesar el pago' },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener préstamo e cuotas
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*, loan_installments(*)')
      .eq('id', loanId)
      .single();

    if (loanError || !loan) throw loanError || new Error('Préstamo no encontrado');

    let remainingPayment = Number(amountPaid);
    const installments = [...(loan.loan_installments || [])].sort(
      (a, b) => a.installment_number - b.installment_number
    );

    let totalApplied = 0;
    let totalChange = 0;

    // 2️⃣ Aplicar pago a las cuotas en orden
    for (const inst of installments) {
      if (remainingPayment <= 0) break;

      const cuotaTotal =
        Number(inst.principal_amount) +
        Number(inst.interest_amount) +
        Number(inst.late_fee ?? 0);
      const pendiente = cuotaTotal - Number(inst.paid_amount ?? 0);

      if (pendiente <= 0) continue;

      if (remainingPayment >= pendiente) {
        // 🔹 Se paga completamente esta cuota
        const { error: updateError } = await supabase
          .from('loan_installments')
          .update({
            paid_amount: cuotaTotal,
            status: 'Pagado',
            payment_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', inst.id);

        if (updateError) throw updateError;

        totalApplied += pendiente;
        remainingPayment -= pendiente;
      } else {
        // 🔹 Pago parcial
        const nuevoAbono = Number(inst.paid_amount ?? 0) + remainingPayment;

        const { error: partialError } = await supabase
          .from('loan_installments')
          .update({
            paid_amount: nuevoAbono,
            status: 'Parcial',
            payment_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', inst.id);

        if (partialError) throw partialError;

        totalApplied += remainingPayment;
        remainingPayment = 0;
      }
    }

    // 3️⃣ Calcular cambio si sobró dinero
    if (remainingPayment > 0) {
      totalChange = remainingPayment;
      remainingPayment = 0;
    }

    // 4️⃣ Actualizar préstamo principal
    const totalPagado = Number(loan.amount_applied ?? 0) + totalApplied;
    const totalPendiente = Math.max(
      Number(loan.total_pending ?? 0) - totalApplied,
      0
    );
    const statusFinal = totalPendiente <= 0 ? 'Pagado' : loan.status;

    const { error: loanUpdateError } = await supabase
      .from('loans')
      .update({
        amount_applied: totalPagado,
        total_pending: totalPendiente,
        balance: totalPendiente,
        status: statusFinal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId);

    if (loanUpdateError) throw loanUpdateError;

    // 5️⃣ Registrar pago
    const { error: payError } = await supabase.from('loan_payments').insert({
      loan_id: loanId,
      installment_id: installmentId,
      amount_paid: amountPaid,
      payment_method: paymentMethod || 'cash',
      principal_applied: totalApplied,
      change_returned: totalChange,
      created_at: new Date().toISOString(),
    });

    if (payError) throw payError;

    // 6️⃣ Obtener préstamo actualizado con cuotas
    const { data: updatedLoan } = await supabase
      .from('loans')
      .select('*, loan_installments(*)')
      .eq('id', loanId)
      .single();

    return NextResponse.json({
      message: 'Pago procesado correctamente',
      totalApplied,
      totalChange,
      updatedLoan,
    });
  } catch (error) {
    console.error('❌ Error procesando pago:', error);
    return NextResponse.json(
      { error: 'Error procesando pago', details: String(error) },
      { status: 500 }
    );
  }
}
