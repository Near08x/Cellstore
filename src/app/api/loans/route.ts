'use server'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

type Installment = {
  id?: number
  due_date?: string
  principal_amount?: number
  interest_amount?: number
  paid_amount?: number
  status?: 'Pendiente' | 'Pagado' | 'Atrasado' | 'Parcial'
}

type LoanInput = {
  id?: string
  client_id?: string
  principal: number
  interest_rate: number
  start_date?: string
  due_date?: string
  installments?: Installment[]
}

// =======================
// GET: obtener préstamos con cliente y cuotas
// =======================
export async function GET() {
  try {
    const { data: loans, error } = await supabase
      .from('loans')
      .select(`
        *,
        clients(name, email),
        loan_installments(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = loans?.map((loan: any) => ({
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
      customerName: loan.clients?.name ?? 'Consumidor Final',
      customerEmail: loan.clients?.email ?? null,
      installments: loan.loan_installments ?? [],
    }))

    return NextResponse.json(result ?? [])
  } catch (error) {
    console.error('Error fetching loans:', error)
    return NextResponse.json({ message: 'Error fetching loans', error }, { status: 500 })
  }
}

// =======================
// POST: crear préstamo con cuotas
// =======================
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoanInput
    const { installments, ...loanData } = body

    const principal = Number(loanData.principal) || 0
    const interestRate = Number(loanData.interest_rate) || 0
    const interest = principal * (interestRate / 100)
    const total = principal + interest

    // 1️⃣ Insertar préstamo
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        client_id: loanData.client_id,
        principal,
        interest_rate: interestRate,
        amount: principal,
        total,
        balance: total,
        amount_to_pay: total,
        total_pending: total,
        start_date: loanData.start_date || new Date().toISOString(),
        due_date: loanData.due_date || null,
        status: 'pending',
      })
      .select()
      .single()

    if (loanError) throw loanError

    let createdInstallments: any[] = []

    // 2️⃣ Insertar cuotas
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

    // 3️⃣ Devolver préstamo + cuotas
    return NextResponse.json({
      ...loan,
      installments: createdInstallments,
    })
  } catch (error) {
    console.error('Error creating loan:', error)
    return NextResponse.json({ message: 'Error creating loan', error }, { status: 500 })
  }
}

// =======================
// PUT: actualizar préstamo y cuotas
// =======================
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as LoanInput
    const { id, installments, ...loanData } = body

    if (!id) throw new Error('Loan ID is required for update')

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
      ...loanData,
      amount: principal,
      amountToPay: total,
      total,
      balance: total,
      totalPending: total,
      installments,
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

    if (!id) throw new Error('Loan ID is required for delete')

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

    if (!installmentId) throw new Error('Installment ID is required')

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

    // 2️⃣ Registrar el pago
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

    // 3️⃣ Recalcular el préstamo (total pendiente y balance)
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
