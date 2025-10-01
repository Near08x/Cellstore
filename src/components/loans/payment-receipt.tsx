
'use client';

import React from 'react';
import type { Loan } from '@/lib/types';
import Image from 'next/image';

type ReceiptDetails = {
  loan: Loan;
  amountPaid: number;
  change: number;
  principalApplied: number;
};

type PaymentReceiptProps = {
  details: ReceiptDetails;
};

const PaymentReceipt = React.forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ details }, ref) => {
    const { loan, amountPaid, change, principalApplied } = details;

    return (
      <div ref={ref} className="p-4 bg-white text-black font-sans text-sm">
        <div className="w-[300px] border border-dashed border-black p-4">
          <div className="text-center mb-4">
            <Image src="https://i.imgur.com/z4bBD24.png" alt="Logo" width={60} height={60} className="mx-auto" style={{ width: '60px', height: '60px' }} />
            <h2 className="text-lg font-bold">Comercial Familia Fernandez</h2>
            <p className="text-xs">Recibo de Pago de Préstamo</p>
          </div>

          <div className="space-y-1">
            <p>
              <strong>Fecha:</strong> {new Date().toLocaleDateString('es-ES')}
            </p>
            <p>
              <strong>Cliente:</strong> {loan.customerName}
            </p>
            <p>
              <strong>No. Préstamo:</strong> {loan.loanNumber}
            </p>
          </div>

          <hr className="border-dashed my-2" />

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Monto Recibido:</span>
              <span>
                ${(amountPaid + change).toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
             {principalApplied > 0 && (
               <div className="flex justify-between">
                <span>Abono a Capital:</span>
                <span>
                  -${principalApplied.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Devuelta:</span>
              <span>
                ${change.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Monto Aplicado al Préstamo:</span>
              <span>
                ${amountPaid.toLocaleString('es-ES', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <hr className="border-dashed my-2" />

          <div className="flex justify-between font-bold text-base mt-2">
            <span>Balance Pendiente:</span>
            <span>
              ${loan.totalPending.toLocaleString('es-ES', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="mt-6 border-t border-black pt-2 text-center">
            <p className="text-xs">_________________________</p>
            <p className="text-xs">Firma del Cajero</p>
          </div>
          <p className="text-center text-xs mt-4">¡Gracias por su pago!</p>
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';
export default PaymentReceipt;
