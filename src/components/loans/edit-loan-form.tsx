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
  loanNumber: z.string().optional(),
  client_id: z.string().min(1, 'Por favor, selecciona un cliente.'),
  principal: z.coerce.number().positive('El monto debe ser positivo.'),
  interestRate: z.coerce
    .number()
    .min(0, 'La tasa de interés no puede ser negativa.'),
  startDate: z.string(),
  dueDate: z.string().optional(),
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
  const { principal, interestRate, startDate, dueDate } = loanData;

  if (!principal || interestRate === undefined || !startDate) {
    return existingInstallments;
  }

  const installments: Installment[] = [];
  const total = principal + principal * (interestRate / 100);

  // ✅ En esta versión simplificamos: solo 1 cuota con total
  const existing = existingInstallments[0];
  installments.push({
    id: existing?.id || `new-inst-1-${Date.now()}`,
    installmentNumber: 1,
    principal_amount: principal,
    interest_amount: principal * (interestRate / 100),
    paidAmount: existing?.paidAmount || 0,
    status: existing?.status || 'Pendiente',
    lateFee: existing?.lateFee || 0,
    dueDate: dueDate || new Date(startDate).toISOString().split('T')[0],
    paymentDate: existing?.paymentDate || undefined,
  });

  return installments;
};
export default function EditLoanForm({
  loan,
  clients,
  onUpdateLoan,
}: EditLoanFormProps) {
  const [installments, setInstallments] = useState<Installment[]>(
    loan.installments || []
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanNumber: loan.loanNumber,
      client_id: loan.client_id,
      principal: loan.principal,
      interestRate: loan.interestRate,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
    },
  });

  const watchedValues = useWatch({ control: form.control });

  useEffect(() => {
    const newInstallments = calculateInstallments(
      watchedValues,
      loan.installments || []
    );
    setInstallments(newInstallments);
  }, [watchedValues, loan.installments]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const finalInstallments = calculateInstallments(
      values,
      loan.installments || []
    );

    const amountToPay = finalInstallments.reduce(
      (acc, inst) => acc + inst.principal_amount + inst.interest_amount,
      0
    );

    const amountApplied = finalInstallments
      .filter((i) => i.status === 'Pagado' || i.status === 'Parcial')
      .reduce((acc, inst) => acc + (i.paidAmount ?? 0), 0);

    const client = clients.find((c) => c.id === values.client_id);

    const updatedLoan: Loan = {
      ...loan,
      ...values,
      client_id: values.client_id,
      customerName: client?.name || loan.customerName,
      installments: finalInstallments,
      amountToPay,
      amountApplied,
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
        {/* Columna izquierda: datos préstamo */}
        <div className="col-span-1 space-y-6">
          <h3 className="text-lg font-medium">Detalles del Préstamo</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
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
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <FormField
              control={form.control}
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (Capital)</FormLabel>
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
                  <FormLabel>Tasa Interés (%)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="12" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Límite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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

        {/* Columna derecha: cuotas */}
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
                      <TableCell>${(inst.lateFee ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inst.status === 'Pagado'
                              ? 'secondary'
                              : inst.status === 'Atrasado'
                              ? 'destructive'
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
                ${(loan.amountToPay ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto Aplicado</p>
              <p className="text-lg font-medium">
                ${(loan.amountApplied ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Monto Atrasado</p>
              <p className="text-lg font-medium text-destructive">
                ${(loan.overdueAmount ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mora</p>
              <p className="text-lg font-medium text-destructive">
                ${(loan.lateFee ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Devuelta</p>
              <p className="text-lg font-medium">
                ${(loan.change ?? 0).toFixed(2)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Pendiente</p>
              <p className="text-2xl font-bold text-primary">
                ${(loan.totalPending ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
