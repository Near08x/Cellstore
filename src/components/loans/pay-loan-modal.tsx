'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import type { Loan } from '@/lib/types'

type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed'

interface PayLoanModalProps {
  open: boolean
  onClose: () => void
  loan: Loan | null
  onPaymentSuccess: (updatedLoan: Loan) => void
}

export default function PayLoanModal({
  open,
  onClose,
  loan,
  onPaymentSuccess,
}: PayLoanModalProps) {
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showOverpaymentDialog, setShowOverpaymentDialog] = useState(false)
  const [overpaymentChoice, setOverpaymentChoice] = useState<'change' | 'apply' | null>(null)
  const [dueAmount, setDueAmount] = useState<number>(0)

  // ✅ calcular monto pendiente
  useEffect(() => {
    if (!loan) return
    const pendingInstallment = loan.installments.find(
      (i) =>
        i.status === 'Pendiente' ||
        i.status === 'Parcial' ||
        i.status === 'Atrasado'
    )
    if (pendingInstallment) {
      const totalDue =
        (pendingInstallment.principal_amount ?? 0) +
        (pendingInstallment.interest_amount ?? 0) -
        (pendingInstallment.paidAmount ?? 0) +
        (pendingInstallment.lateFee ?? 0)
      setDueAmount(totalDue)
      setPaymentAmount(totalDue)
    } else {
      setDueAmount(0)
      setPaymentAmount(0)
    }
  }, [loan])

  // ✅ cuando paga más, mostrar el diálogo
  useEffect(() => {
    if (paymentAmount > dueAmount && dueAmount > 0) {
      setShowOverpaymentDialog(true)
    } else {
      setShowOverpaymentDialog(false)
      setOverpaymentChoice(null)
    }
  }, [paymentAmount, dueAmount])

  const handleConfirmPayment = async () => {
    if (!loan) return
    setIsProcessing(true)
    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: loan.id,
          installmentId: loan.installments.find(
            (i) =>
              i.status === 'Pendiente' ||
              i.status === 'Parcial' ||
              i.status === 'Atrasado'
          )?.id,
          amountPaid: paymentAmount,
          paymentMethod,
          applyOverpaymentToPrincipal: overpaymentChoice === 'apply', // ✅ aquí se define si aplica o no
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error)

      onPaymentSuccess(data.loan)
      toast({
        title: 'Pago exitoso',
        description: overpaymentChoice === 'apply'
          ? 'El exceso fue abonado al capital.'
          : 'El cambio fue devuelto correctamente.',
      })
      onClose()
    } catch (error) {
      console.error('Error procesando pago:', error)
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      {/* ===================== */}
      {/* MODAL PRINCIPAL DE PAGO */}
      {/* ===================== */}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>

          {loan ? (
            <div className="space-y-4">
              <div>
                <Label>Préstamo</Label>
                <p className="font-medium text-sm">{loan.loanNumber}</p>
              </div>

              <div>
                <Label>Monto Adeudado</Label>
                <p className="text-lg font-bold text-destructive">${dueAmount.toFixed(2)}</p>
              </div>

              <div>
                <Label>Monto a Pagar</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  min={0}
                  step={0.01}
                />
              </div>

              <div>
                <Label>Método de Pago</Label>
                <Select onValueChange={(v: PaymentMethod) => setPaymentMethod(v)} value={paymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="mixed">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button onClick={handleConfirmPayment} disabled={isProcessing}>
                  {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <p>No hay préstamo seleccionado.</p>
          )}
        </DialogContent>
      </Dialog>

      {/* ===================== */}
      {/* SUBMODAL: EXCESO DE PAGO */}
      {/* ===================== */}
      <Dialog open={showOverpaymentDialog} onOpenChange={setShowOverpaymentDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Pago superior al monto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Has ingresado un monto mayor al adeudado (${(paymentAmount - dueAmount).toFixed(2)} extra).
            ¿Deseas devolver el cambio o aplicarlo al capital?
          </p>
          <div className="flex justify-around mt-4">
            <Button
              variant={overpaymentChoice === 'change' ? 'default' : 'outline'}
              onClick={() => setOverpaymentChoice('change')}
            >
              Devolver Cambio
            </Button>
            <Button
              variant={overpaymentChoice === 'apply' ? 'default' : 'outline'}
              onClick={() => setOverpaymentChoice('apply')}
            >
              Abonar al Capital
            </Button>
          </div>
          <DialogFooter className="mt-4">
            <Button
              onClick={() => setShowOverpaymentDialog(false)}
              disabled={!overpaymentChoice}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
