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
import { addDays, addMonths, addWeeks } from 'date-fns';

const formSchema = z.object({
  loanType: z.enum(['simple', 'amortization']),
  loanNumber: z.string().optional(),
  customerEmail: z.string().min(1, 'Por favor, selecciona un cliente.'),
  amount: z.coerce.number().positive('El monto debe ser positivo.'),
  interestRate: z.coerce
    .number()
    .min(0, 'La tasa de interés no puede ser negativa.'),
  loanTerm: z.coerce
    .number()
    .int()
    .positive('El plazo debe ser un número entero positivo.'),
  paymentType: z.enum(['mensual', 'quincenal', 'semanal', 'diario']),
  loanDate: z.string(),
  invoiceNumber: z.string().min(1, 'El número de factura es requerido.'),
  cashier: z.string().default('Admin'),
});

type EditLoanFormProps = {
  loan: Loan;
  clients: Client[];
  onUpdateLoan: (loan: Loan) => void;
};

const calculateInstallments = (
  loanData: Partial<z.infer<typeof formSchema>>,
  existingInstallments: Installment[]
): Installment[] => {
  const { amount, interestRate, loanTerm, paymentType, loanDate, loanType } =
    loanData;

  if (
    !amount ||
    interestRate === undefined ||
    !loanTerm ||
    !paymentType ||
    !loanDate
  ) {
    return existingInstallments;
  }

  const installments: Installment[] = [];
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
      return existingInstallments;
  }

  const ratePerPeriod = annualRate / paymentFrequencyPerYear;

  if (loanType === 'amortization') {
    const installmentAmount = (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, term)) / (Math.pow(1 + ratePerPeriod, term) - 1);
    let remainingBalance = principal;

    for (let i = 1; i <= term; i++) {
      const interest = remainingBalance * ratePerPeriod;
      const principalPayment = installmentAmount - interest;
      remainingBalance -= principalPayment;

      const dueDate: Date = addPeriod(new Date(loanDate), i);

      const existing = existingInstallments.find(
        (inst) => inst.installmentNumber === i
      );

      if (existing?.status === 'Pagado') {
        installments.push(existing);
        continue;
      }
      
      installments.push({
        id: existing?.id || `new-inst-${i}-${Date.now()}`,
        installmentNumber: i,
        principal_amount: principalPayment,
        interest_amount: interest,
        paidAmount: existing?.paidAmount || 0,
        date: existing?.date || '',
        status: existing?.status || 'Pendiente',
        lateFee: existing?.lateFee || 0,
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }
  } else {
    // Simple Interest
    const totalInterest = principal * (annualRate / 12) * (term * (paymentFrequencyPerYear/12));
    const principalPerInstallment = principal / term;
    const interestPerInstallment = totalInterest / term;

    for (let i = 1; i <= term; i++) {
      const dueDate: Date = addPeriod(new Date(loanDate), i);

      const existing = existingInstallments.find(
        (inst) => inst.installmentNumber === i
      );

      if (existing?.status === 'Pagado') {
        installments.push(existing);
        continue;
      }

      installments.push({
        id: existing?.id || `new-inst-${i}-${Date.now()}`,
        installmentNumber: i,
        principal_amount: principalPerInstallment,
        interest_amount: interestPerInstallment,
        paidAmount: existing?.paidAmount || 0,
        date: existing?.date || '',
        status: existing?.status || 'Pendiente',
        lateFee: existing?.lateFee || 0,
        dueDate: dueDate.toISOString().split('T')[0],
      });
    }
  }
  return installments;
};

export default function EditLoanForm({
  loan,
  clients,
  onUpdateLoan,
}: EditLoanFormProps) {
  const [installments, setInstallments] = useState<Installment[]>(
    loan.installments
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanType: loan.loanType,
      loanDate: loan.loanDate,
      loanNumber: loan.loanNumber,
      customerEmail: loan.customerEmail,
      amount: loan.amount,
      interestRate: loan.interestRate,
      loanTerm: loan.loanTerm,
      paymentType: loan.paymentType,
      invoiceNumber: loan.invoiceNumber,
      cashier: loan.cashier,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const newInstallments = calculateInstallments(
      watchedValues,
      loan.installments
    );
    setInstallments(newInstallments);
  }, [watchedValues, loan.installments]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const finalInstallments = calculateInstallments(values, loan.installments);
    const amountToPay = finalInstallments.reduce(
      (acc, inst) => acc + inst.principal_amount + inst.interest_amount,
      0
    );
    const amountApplied = finalInstallments
      .filter((i) => i.status === 'Pagado' || i.status === 'Parcial')
      .reduce((acc, inst) => acc + inst.paidAmount, 0);

    const client = clients.find(c => c.email === values.customerEmail);

    const updatedLoan: Loan = {
      ...loan,
      ...values,
      customerName: client?.name || loan.customerName,
      installments: finalInstallments,
      amountToPay: amountToPay,
      amountApplied: amountApplied,
      totalPending: amountToPay - amountApplied,
    };
    onUpdateLoan(updatedLoan);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        <div className="col-span-1 space-y-6">
          <h3 className="text-lg font-medium">Detalles del Préstamo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Préstamo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanTerm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plazo del Préstamo</FormLabel>
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
                    <FormLabel>Frecuencia de Pago</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Factura</FormLabel>
                    <FormControl>
                      <Input placeholder="INV00X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loanDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del Préstamo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="loanNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. Préstamo</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="LP00X" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cashier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cajero</FormLabel>
                    <FormControl>
                      <Input disabled {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <Button type="submit" className="w-full">
            Actualizar Préstamo
          </Button>
        </div>
        <div className="col-span-1 md:col-span-2 space-y-4">
          <h3 className="text-lg font-medium">Cuotas y Resumen de Pago</h3>
          <div className="rounded-md border h-64 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Fecha Límite</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Intereses</TableHead>
                  <TableHead>Mora</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.length > 0 ? (
                  installments.map((inst) => (
                    <TableRow key={inst.id}>
                      <TableCell>{inst.installmentNumber}</TableCell>
                      <TableCell>{inst.dueDate}</TableCell>
                      <TableCell>${inst.principal_amount.toFixed(2)}</TableCell>
                      <TableCell>${inst.interest_amount.toFixed(2)}</TableCell>
                      <TableCell>${inst.lateFee.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inst.status === 'Pagado'
                              ? 'secondary'
                              : inst.status === 'Atrasado'
                              ? 'destructive'
                              : inst.status === 'Parcial'
                              ? 'outline'
                              : 'outline'
                          }
                        >
                          {inst.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground h-32"
                    >
                      Ajusta los detalles para generar las cuotas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto a Pagar</p>
              <p className="text-lg font-medium">
                ${loan.amountToPay.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto Aplicado</p>
              <p className="text-lg font-medium">
                ${loan.amountApplied.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto Atrasado</p>
              <p className="text-lg font-medium text-destructive">
                ${loan.overdueAmount.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mora</p>
              <p className="text-lg font-medium text-destructive">
                ${loan.lateFee.toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Devuelta</p>
              <p className="text-lg font-medium">${loan.change.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Pendiente</p>
              <p className="text-2xl font-bold text-primary">
                ${loan.totalPending.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}

    
    