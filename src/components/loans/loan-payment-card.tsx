
'use client';

import React from 'react';
import type { Loan } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Checkbox } from '../ui/checkbox';
import Image from 'next/image';

type LoanPaymentCardProps = {
  loan: Loan;
};

const LoanPaymentCard = React.forwardRef<HTMLDivElement, LoanPaymentCardProps>(({ loan }, ref) => {
  const totalInterest = loan.installments.reduce((acc, inst) => acc + inst.interest_amount, 0);

  return (
    <div ref={ref} className="p-4 bg-white text-black printable-area">
      <Card className="w-full border-2 border-black">
        <CardHeader className="text-center border-b-2 border-black pb-4">
            <Image src="/logo.png" alt="Logo" width={80} height={80} className="mx-auto h-auto w-auto" />
            <CardTitle className="text-2xl font-bold">Comercial Familia Fernandez</CardTitle>
            <CardDescription className="font-semibold">Tarjeta de Control de Préstamo</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div><strong>Cliente:</strong> {loan.customerName}</div>
            <div><strong>No. Préstamo:</strong> {loan.loanNumber}</div>
            <div><strong>Fecha:</strong> {loan.loanDate}</div>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm font-semibold">
            <div><strong>Monto:</strong> ${loan.amount.toFixed(2)}</div>
            <div><strong>Interés ({loan.interestRate}%):</strong> ${totalInterest.toFixed(2)}</div>
            <div><strong>Total a Pagar:</strong> ${loan.amountToPay.toFixed(2)}</div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 border border-black text-center">Pagado</TableHead>
                <TableHead className="border border-black text-center">#</TableHead>
                <TableHead className="border border-black text-center">Fecha Venc.</TableHead>
                <TableHead className="border border-black text-center">Cuota</TableHead>
                <TableHead className="border border-black text-center">Monto Pagado</TableHead>
                <TableHead className="border border-black text-center">Firma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.installments.map((inst) => (
                <TableRow key={inst.installmentNumber}>
                  <TableCell className="text-center h-10 border border-black">
                    <div className="h-6 w-6 border border-black mx-auto"></div>
                  </TableCell>
                  <TableCell className="border border-black text-center">{inst.installmentNumber}</TableCell>
                  <TableCell className="border border-black text-center">{inst.dueDate}</TableCell>
                  <TableCell className="border border-black text-center">${(inst.principal_amount + inst.interest_amount).toFixed(2)}</TableCell>
                  <TableCell className="border h-10 border-black">
                    <div className="h-full border-b border-black"></div>
                  </TableCell>
                  <TableCell className="border h-10 border-black">
                    <div className="h-full border-b border-black"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-8 text-xs">
            <p><strong>Nota:</strong> Este es un registro de control para el cliente. Los pagos deben ser registrados en el sistema para ser válidos. Se aplicará un cargo por mora en caso de retraso.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

LoanPaymentCard.displayName = 'LoanPaymentCard';
export default LoanPaymentCard;
