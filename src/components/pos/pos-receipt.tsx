'use client';

import React from 'react';
import type { SaleDetails } from './pos-client';

type PosReceiptProps = {
  details: SaleDetails;
};

const paymentMethodLabels: { [key: string]: string } = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  mixed: 'Mixto',
};

const PosReceipt = React.forwardRef<HTMLDivElement, PosReceiptProps>(
  ({ details }, ref) => {
    const {
      cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      amountPaid,
      change,
      date,
      customerName,
    } = details;

    return (
      <div
        ref={ref}
        className="p-2 bg-white text-black font-mono text-[11px] leading-tight"
      >
        <div className="w-[280px] mx-auto">
          {/* Encabezado con logo */}
          <div className="text-center mb-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-auto mx-auto mb-1"
            />
            <h2 className="text-sm font-bold">CellStore</h2>
            <p className="text-xs">Gracias por su compra</p>
            <p className="text-xs">{date}</p>
          </div>

          {/* Cliente */}
          <p className="text-xs mb-1">
            <strong>Cliente:</strong> {customerName}
          </p>

          <hr className="border-dashed border-t my-1" />

          {/* Detalle de artículos */}
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left w-10">Cant.</th>
                <th className="text-left">Artículo</th>
                <th className="text-right w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.id}>
                  <td>{item.quantity}</td>
                  <td>
                    {item.name}
                    {item.discount > 0 && ` (${item.discount}% off)`}
                  </td>
                  <td className="text-right">
                    $
                    {(
                      item.selectedPrice *
                      item.quantity *
                      (1 - item.discount / 100)
                    ).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <hr className="border-dashed border-t my-1" />

          {/* Totales */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuestos (18%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <hr className="border-dashed border-t my-1" />

          {/* Pago */}
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Método:</span>
              <span>{paymentMethodLabels[paymentMethod]}</span>
            </div>
            <div className="flex justify-between">
              <span>Recibido:</span>
              <span>${amountPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Cambio:</span>
              <span>${change.toFixed(2)}</span>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] mt-3">¡Vuelva pronto!</p>
        </div>
      </div>
    );
  }
);

PosReceipt.displayName = 'PosReceipt';
export default PosReceipt;
