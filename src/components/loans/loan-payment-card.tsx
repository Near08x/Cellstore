'use client';

import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { Loan } from '@/lib/types';

const LoanPaymentCard = React.forwardRef<HTMLDivElement, { loan: Loan }>(
  ({ loan }, ref) => {
    return (
      <div
        ref={ref}
        style={{ fontFamily: 'monospace', fontSize: '12px', padding: '20px' }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '100px' }} />
          <h2>Comercial Familia Fernández</h2>
          <p>Tarjeta de Pagos</p>
        </div>

        {/* Datos */}
        <p><strong>Cliente:</strong> {loan.customerName}</p>
        <p><strong>No. Préstamo:</strong> {loan.loanNumber}</p>
        <p><strong>Monto:</strong> ${loan.amount.toFixed(2)}</p>
        <p><strong>Total a Pagar:</strong> ${loan.amountToPay.toFixed(2)}</p>

        <br />

        {/* Cuotas */}
        <pre>
{loan.installments.map((inst) => (
`#${inst.installmentNumber} | Fecha: ${inst.dueDate} | Monto: ${(inst.principal_amount + inst.interest_amount).toFixed(2)}
_________________________________________________________

`
)).join('')}
        </pre>

        {/* Firmas */}
        <br /><br />
        <p>_________________________        _________________________</p>
        <p>Firma del Cliente              Firma del Prestamista</p>
      </div>
    );
  }
);
LoanPaymentCard.displayName = 'LoanPaymentCard';

export default function LoanPaymentCardWithPrint({
  loan,
  onAfterPrint,
}: {
  loan: Loan;
  onAfterPrint?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Tarjeta-${loan.loanNumber}`,
     contentRef: cardRef, // 👈 HTML real
    onAfterPrint: () => {
      if (onAfterPrint) onAfterPrint();
    },
  });

  useEffect(() => {
    if (loan) {
      handlePrint();
    }
  }, [loan, handlePrint]);

  // 👇 Renderizamos fuera de pantalla pero en el DOM
  return (
    <div style={{ position: 'absolute', left: '-9999px' }}>
      <LoanPaymentCard ref={cardRef} loan={loan} />
    </div>
  );
}
