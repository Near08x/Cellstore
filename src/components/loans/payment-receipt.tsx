'use client';

import React, { useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { Loan } from '@/lib/types';

type ReceiptDetails = {
  loan: Loan;
  amountPaid: number;
  change: number;
  principalApplied: number;
};

type PaymentReceiptProps = {
  details: ReceiptDetails;
};

// 🔹 El componente del recibo (forwardRef)
const PaymentReceipt = React.forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ details }, ref) => {
    const { loan, amountPaid, change, principalApplied } = details;

    return (
      <div
        ref={ref}
        className="font-mono text-[12px] leading-tight text-black bg-white p-2"
        style={{ width: '280px' }} // ancho típico 58mm
      >
        <div className="text-center mb-2">
          <h2 className="font-bold text-sm">Comercial Familia Fernández</h2>
          <p className="text-xs">Recibo de Pago de Préstamo</p>
        </div>

        <p><strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}</p>
        <p><strong>Cliente:</strong> {loan.customerName}</p>
        <p><strong>No. Préstamo:</strong> {loan.loanNumber}</p>

        <hr className="border-dashed my-2" />

        <div>
          <div className="flex justify-between">
            <span>Monto Recibido:</span>
            <span>${(amountPaid + change).toFixed(2)}</span>
          </div>
          {principalApplied > 0 && (
            <div className="flex justify-between">
              <span>Abono a Capital:</span>
              <span>- ${principalApplied.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Devuelta:</span>
            <span>${change.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Aplicado al Préstamo:</span>
            <span>${amountPaid.toFixed(2)}</span>
          </div>
        </div>

        <hr className="border-dashed my-2" />

        <div className="flex justify-between font-bold">
          <span>Balance Pendiente:</span>
          <span>${loan.totalPending.toFixed(2)}</span>
        </div>

        <div className="mt-4 text-center">
          <p>_________________________</p>
          <p className="text-xs">Firma del Cajero</p>
        </div>

        <p className="text-center text-xs mt-2">¡Gracias por su pago!</p>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';

// 🔹 Wrapper que renderiza el recibo oculto y abre la impresión automáticamente
export default function PaymentReceiptWithPrint({ details }: { details: ReceiptDetails }) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: `Recibo-${details.loan.loanNumber}`,
    contentRef: receiptRef,  // ✅ ahora se pasa aquí
    onBeforePrint: async () => {
      console.log('🖨 Preparando impresión...');
    },
    onAfterPrint: async () => {
      console.log('✅ Impresión completada');
    },
  });

  useEffect(() => {
    if (details) {
      handlePrint(); // ✅ ya no necesita argumentos
    }
  }, [details, handlePrint]);

  return (
    <div className="hidden">
      <PaymentReceipt ref={receiptRef} details={details} />
    </div>
  );
}
