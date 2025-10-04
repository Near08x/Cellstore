'use server'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

type Installment = {
  id?: string
  due_date?: string
  principal_amount?: number
  interest_amount?: number
  paid_amount?: number
  late_fee?: number
  status?: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial'
  payment_date?: string
}

type LoanInput = {
  id?: string
  client_id?: string
  principal: number
  loan_number?: string
  interest_rate: number
  start_date?: string
  due_date?: string
  status?: string  
  installments?: Installment[]
}

// =======================
// GET: obtener préstamos con cliente y cuotas
// =======================
export async function GET() {
  try {
    const [loansRes, clientsRes] = await Promise.all([
      supabase
        .from("loans")
        .select(`
          id, loan_number, principal, interest_rate, amount, amount_to_pay, total, balance, total_pending, amount_applied, start_date, due_date, status, created_at,
          clients (id, name),
          loan_installments (
            id, installment_number, due_date, principal_amount, interest_amount, paid_amount, late_fee, status, payment_date
          )
        `)
        .order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name, email, phone, created_at")
    ])

    if (loansRes.error) throw loansRes.error
    if (clientsRes.error) throw clientsRes.error

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
      startDate: loan.start_date,
      dueDate: loan.due_date,
      status: loan.status,
      amountApplied: loan.amount_applied ?? 0,
      customerId: loan.clients?.id ?? null,
      customerName: loan.clients?.name ?? "Consumidor Final",
      installments: loan.loan_installments?.map((i: any) => ({
        id: i.id,
        installmentNumber: i.installment_number,
        dueDate: i.due_date,
        principal_amount: i.principal_amount ?? 0,
        interest_amount: i.interest_amount ?? 0,
        paidAmount: i.paid_amount ?? 0,
        lateFee: i.late_fee ?? 0,
        status: i.status ?? "Pendiente",
        paymentDate: i.payment_date ?? null,
      })) ?? [],
    }))

    return NextResponse.json({
      loans: loans ?? [],
      clients: clientsRes.data ?? [],
    })
  } catch (error) {
    console.error("Error fetching loans and clients:", error)
    return NextResponse.json(
      { message: "Error fetching loans and clients", error },
      { status: 500 }
    )
  }
}

// =======================
// POST: crear préstamo con cuotas
// =======================
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoanInput
    const { installments, ...loanData } = body

    if (!loanData.client_id) {
      return NextResponse.json(
        { message: "Debe seleccionar un cliente válido para crear un préstamo" },
        { status: 400 }
      )
    }

    const principal = Number(loanData.principal) || 0
    const interestRate = Number(loanData.interest_rate) || 0
    const interest = principal * (interestRate / 100)
    const total = principal + interest

    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        client_id: loanData.client_id,
        loan_number: loanData.loan_number || `LN-${Date.now()}`, // fallback
        principal,
        interest_rate: interestRate,
        amount: principal,
        total,
        balance: total,
        amount_to_pay: total,
        total_pending: total,
        start_date: loanData.start_date || new Date().toISOString(),
        due_date: loanData.due_date || null,
        status: loanData.status || 'Pendiente',
      })
      .select()
      .single()

    if (loanError) throw loanError

    let createdInstallments: any[] = []

    if (installments && installments.length > 0) {
      const today = new Date().toISOString().slice(0, 10)
      const installmentsWithLoan = installments.map((i, idx) => ({
        loan_id: loan.id,
        installment_number: idx + 1,
        due_date: i.due_date || today,
        principal_amount: i.principal_amount ?? 0,
        interest_amount: i.interest_amount ?? 0,
        paid_amount: 0,
        late_fee: 0,
        status: i.status || 'Pendiente',
      }))

      const { data: instData, error: instError } = await supabase
        .from('loan_installments')
        .insert(installmentsWithLoan)
        .select()

      if (instError) throw instError
      createdInstallments = instData ?? []
    }

    return NextResponse.json({
      id: loan.id,
      loanNumber: loan.loan_number,
      principal: loan.principal ?? 0,
      interestRate: loan.interest_rate ?? 0,
      amount: loan.amount ?? 0,
      amountToPay: loan.amount_to_pay ?? loan.total ?? 0,
      total: loan.total ?? 0,
      balance: loan.balance ?? 0,
      totalPending: loan.total_pending ?? 0,
      startDate: loan.start_date,
      dueDate: loan.due_date,
      status: loan.status,
      amountApplied: loan.amount_applied ?? 0,
      customerId: loan.client_id ?? null,
      customerName: "", // opcional, frontend puede resolverlo
      installments: createdInstallments ?? [],
    })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json({ message: 'Error creating loan', error }, { status: 500 })
  }
}
// =======================
// PUT: actualizar préstamo con cuotas
// =======================
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as LoanInput
    const { id, installments, ...loanData } = body

    if (!id) {
      return NextResponse.json(
        { message: 'Loan ID is required for update' },
        { status: 400 }
      )
    }

    const principal = Number(loanData.principal) || 0
    const interestRate = Number(loanData.interest_rate) || 0
    const interest = principal * (interestRate / 100)
    const total = principal + interest

    const { error: loanError } = await supabase
      .from('loans')
      .update({
        ...loanData,
        principal,
        interest_rate: interestRate,
        amount: principal,
        total,
        balance: total,
        amount_to_pay: total,
        total_pending: total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (loanError) throw loanError

    if (installments) {
      // 🔄 Primero eliminamos cuotas anteriores
      await supabase.from('loan_installments').delete().eq('loan_id', id)

      const today = new Date().toISOString().slice(0, 10)
      const installmentsWithLoan = installments.map((i, idx) => ({
        loan_id: id,
        installment_number: idx + 1,
        due_date: i.due_date || today,
        principal_amount: i.principal_amount ?? 0,
        interest_amount: i.interest_amount ?? 0,
        paid_amount: 0,
        late_fee: 0,
        status: i.status || 'Pendiente',
      }))

      const { error: instError } = await supabase
        .from('loan_installments')
        .insert(installmentsWithLoan)

      if (instError) throw instError
    }

    return NextResponse.json({
      id,
      loanNumber: loanData.loan_number ?? "",
      principal,
      interestRate,
      amount: principal,
      amountToPay: total,
      total,
      balance: total,
      totalPending: total,
      startDate: loanData.start_date || new Date().toISOString(),
      dueDate: loanData.due_date || null,
      status: loanData.status || "Pendiente",
      amountApplied: 0,
      customerId: loanData.client_id ?? null,
      customerName: "",
      installments: installments ?? [],
    })
  } catch (error) {
    console.error('Error updating loan:', error)
    return NextResponse.json({ message: 'Error updating loan', error }, { status: 500 })
  }
}

// =======================
// DELETE: eliminar préstamo
// =======================
export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string }

    if (!id) {
      return NextResponse.json(
        { message: 'Loan ID is required for delete' },
        { status: 400 }
      )
    }

    // 🔄 Eliminar cuotas relacionadas antes del préstamo
    await supabase.from('loan_installments').delete().eq('loan_id', id)

    const { error } = await supabase.from('loans').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Loan deleted successfully' })
  } catch (error) {
    console.error('Error deleting loan:', error)
    return NextResponse.json({ message: 'Error deleting loan', error }, { status: 500 })
  }
}

// =======================
// PATCH: pagar una cuota
// =======================
export async function PATCH(request: Request) {
  try {
    const { loanId, installmentId, amountPaid, paymentMethod } = await request.json()

    if (!loanId) {
      return NextResponse.json({ message: 'Loan ID is required' }, { status: 400 })
    }
    if (!installmentId) {
      return NextResponse.json({ message: 'Installment ID is required' }, { status: 400 })
    }

    // 1️⃣ Actualizar la cuota
    const { data: updatedInst, error: instError } = await supabase
      .from('loan_installments')
      .update({
        paid_amount: amountPaid,
        status: 'Pagado',
        payment_date: new Date().toISOString(),
      })
      .eq('id', installmentId)
      .select()
      .single()

    if (instError) throw instError

    // 2️⃣ Registrar pago en tabla de pagos
    const { error: payError } = await supabase
      .from('loan_payments')
      .insert({
        loan_id: loanId,
        installment_id: installmentId,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      })

    if (payError) throw payError

    // 3️⃣ Recalcular saldo pendiente del préstamo
    const { data: allInst, error: allInstError } = await supabase
      .from('loan_installments')
      .select('*')
      .eq('loan_id', loanId)

    if (allInstError) throw allInstError

    const totalPending = allInst.reduce(
      (acc, inst) =>
        acc +
        (inst.principal_amount ?? 0) +
        (inst.interest_amount ?? 0) -
        (inst.paid_amount ?? 0),
      0
    )

    const { error: loanUpdateError } = await supabase
      .from('loans')
      .update({
        total_pending: totalPending,
        balance: totalPending,
        updated_at: new Date().toISOString(),
      })
      .eq('id', loanId)

    if (loanUpdateError) throw loanUpdateError

    return NextResponse.json({
      message: 'Installment paid successfully',
      installment: updatedInst,
      totalPending,
    })
  } catch (error) {
    console.error('Error paying installment:', error)
    return NextResponse.json({ message: 'Error paying installment', error }, { status: 500 })
  }
}
