'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Client, Loan, Installment } from '@/lib/types';
import { Separator } from '../ui/separator';
import { useEffect, useState } from 'react';
import { addMonths, addWeeks, addDays, format } from 'date-fns';
import { toast } from 'react-hot-toast';

// ======================
// 🧩 FORM SCHEMA
// ======================
const formSchema = z.object({
  loanType: z.enum(['simple', 'amortization']),
  loanNumber: z.string().optional(),
  customerEmail: z.string().min(1, 'Por favor, selecciona un cliente.'),
  amount: z.coerce.number().positive('El monto debe ser positivo.'),
  interestRate: z.coerce.number().min(0, 'La tasa de interés no puede ser negativa.'),
  loanTerm: z.coerce.number().int().positive('El plazo debe ser un número entero positivo.'),
  paymentType: z.enum(['mensual', 'quincenal', 'semanal', 'diario']),
  startDate: z.string(),
  invoiceNumber: z.string().min(1, 'El número de factura es requerido.'),
  cashier: z.string().default('Admin'),
});

type NewLoanFormProps = {
  clients: Client[];
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  nextLoanNumber: string;
};

// ✅ helper formato
const toYYYYMMDD = (d: Date) => format(d, 'yyyy-MM-dd');

// ======================
// 🧮 CALCULAR CUOTAS
// ======================
const calculateInstallments = (
  loanData: Partial<z.infer<typeof formSchema>>
): Omit<Installment, 'id'>[] => {
  const { amount, interestRate, loanTerm, paymentType, startDate, loanType } = loanData;

  if (!amount || interestRate === undefined || !loanTerm || !paymentType || !startDate) {
    return [];
  }

  const installments: Omit<Installment, 'id'>[] = [];
  const principal = amount;
  const term = loanTerm;
  const annualRate = interestRate / 100;

  let paymentFrequencyPerYear: number;
  let addPeriod: (date: Date, count: number) => Date;

  switch (paymentType) {
    case 'mensual':
      paymentFrequencyPerYear = 12;
      addPeriod = addMonths;
      break;
    case 'quincenal':
      paymentFrequencyPerYear = 24;
      addPeriod = (date, count) => addWeeks(date, count * 2);
      break;
    case 'semanal':
      paymentFrequencyPerYear = 52;
      addPeriod = addWeeks;
      break;
    case 'diario':
      paymentFrequencyPerYear = 365;
      addPeriod = addDays;
      break;
    default:
      return [];
  }

  const ratePerPeriod = annualRate / paymentFrequencyPerYear;

  if (loanType === 'amortization') {
    const installmentAmount =
      (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, term)) /
      (Math.pow(1 + ratePerPeriod, term) - 1);
    let remainingBalance = principal;

    for (let i = 1; i <= term; i++) {
      const interest = remainingBalance * ratePerPeriod;
      const principalPayment = installmentAmount - interest;
      remainingBalance -= principalPayment;

      const dueDate: Date = addPeriod(new Date(startDate), i);

      installments.push({
        installmentNumber: i,
        principal_amount: Number(principalPayment.toFixed(2)),
        interest_amount: Number(interest.toFixed(2)),
        paidAmount: 0,
        paymentDate: undefined,
        status: 'Pendiente',
        lateFee: 0,
        dueDate: toYYYYMMDD(dueDate),
      });
    }
  } else {
    const totalInterest = principal * annualRate;
    const principalPerInstallment = principal / term;
    const interestPerInstallment = totalInterest / term;

    for (let i = 1; i <= term; i++) {
      const dueDate: Date = addPeriod(new Date(startDate), i);

      installments.push({
        installmentNumber: i,
        principal_amount: Number(principalPerInstallment.toFixed(2)),
        interest_amount: Number(interestPerInstallment.toFixed(2)),
        paidAmount: 0,
        paymentDate: undefined,
        status: 'Pendiente',
        lateFee: 0,
        dueDate: toYYYYMMDD(dueDate),
      });
    }
  }

  return installments;
};
// ======================
// 🧾 COMPONENTE PRINCIPAL
// ======================
export default function NewLoanForm({ clients, onAddLoan, nextLoanNumber }: NewLoanFormProps) {
  const [installments, setInstallments] = useState<Omit<Installment, 'id'>[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanType: 'amortization',
      startDate: toYYYYMMDD(new Date()),
      loanNumber: nextLoanNumber,
      customerEmail: '',
      amount: 0,
      interestRate: 0,
      loanTerm: 0,
      paymentType: 'mensual',
      invoiceNumber: '',
      cashier: 'Admin',
    },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const newInstallments = calculateInstallments(watchedValues);
    setInstallments(newInstallments);
  }, [watchedValues]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const finalInstallments = calculateInstallments(values).map((inst, i) => ({
  ...inst,
  id: Date.now() + i, // 🔹 número temporal válido
}));


    const amountToPay = finalInstallments.reduce(
      (acc, inst) => acc + inst.principal_amount + inst.interest_amount,
      0
    );

    const client = clients.find((c) => c.email === values.customerEmail);
    if (!client) {
      toast.error('Debe seleccionar un cliente válido.');
      return;
    }

    // ✅ Calcular fecha límite final (última cuota)
    const lastDueDate =
      finalInstallments.length > 0
        ? finalInstallments[finalInstallments.length - 1].dueDate
        : values.startDate;

    const newLoan: Omit<Loan, 'id'> = {
      client_id: client.id,
      client_name: client.name,
      loanNumber: nextLoanNumber,
      principal: values.amount,
      interestRate: values.interestRate,
      amount: values.amount,
      amountToPay,
      amountApplied: 0,
      overdueAmount: 0,
      lateFee: 0,
      change: 0,
      totalPending: amountToPay,
      startDate: values.startDate,
      dueDate: lastDueDate, // 🔹 ✅ Ahora se guarda correctamente
      status: 'Pendiente',
      installments: finalInstallments,
      cashier: values.cashier,
      loanDate: new Date().toISOString(),
    };

    onAddLoan(newLoan);
    form.reset();
    toast.success('✅ Préstamo guardado correctamente');
  };

  const totalToPay = installments.reduce(
    (acc, inst) => acc + inst.principal_amount + inst.interest_amount,
    0
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () =>
          toast.error('Por favor completa todos los campos correctamente.')
        )}
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {/* Columna izquierda: datos préstamo */}
        <div className="col-span-1 space-y-6">
          <h3 className="text-lg font-medium">Detalles del Préstamo</h3>
          <div className="space-y-4">
            {/* Tipo y cliente */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Préstamo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="simple">Simple</SelectItem>
                        <SelectItem value="amortization">Amortización</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.email} value={client.email}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Montos */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interestRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tasa Interés (Anual %)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Plazo y frecuencia */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plazo (cuotas)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frecuencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Frecuencia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="diario">Diario</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quincenal">Quincenal</SelectItem>
                        <SelectItem value="mensual">Mensual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fecha e invoice */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Factura</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="FAC-0001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Guardar Préstamo
            </Button>
          </div>
        </div>

        {/* Columna derecha: cuotas */}
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium">Cuotas Generadas</h3>
          <div className="rounded-md border h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Intereses</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.length > 0 ? (
                  installments.map((inst, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{inst.installmentNumber}</TableCell>
                      <TableCell>{inst.dueDate}</TableCell>
                      <TableCell>${inst.principal_amount.toFixed(2)}</TableCell>
                      <TableCell>${inst.interest_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        ${(inst.principal_amount + inst.interest_amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{inst.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground h-32">
                      Ajusta los datos para generar las cuotas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Monto Solicitado</p>
              <p className="text-lg font-medium">
                ${Number(watchedValues.amount || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Intereses Totales</p>
              <p className="text-lg font-medium text-destructive">
                ${Number(
                  installments.reduce((acc, inst) => acc + inst.interest_amount, 0) || 0
                ).toFixed(2)}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">Monto Total a Pagar</p>
              <p className="text-2xl font-bold text-primary">
                ${Number(totalToPay || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
