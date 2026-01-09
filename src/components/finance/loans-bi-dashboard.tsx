'use client';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Printer,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { Loan, Client } from '@/lib/types';
import SummaryCard from '../dashboard/summary-card';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart as RechartsBarChart,
  Pie,
  PieChart,
  Cell,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { useState } from 'react';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  isAfter,
  isBefore,
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import { Button } from '../ui/button';

type TimeRange = 'day' | 'week' | 'month' | 'all';

const chartConfig = {
  amount: {
    label: 'Monto',
    color: 'hsl(var(--chart-1))',
  },
  profit: {
    label: 'Ganancia',
    color: 'hsl(var(--chart-2))',
  },
  count: {
    label: 'Cantidad',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export default function LoansBIDashboard({
  loans,
  clients,
}: {
  loans: Loan[];
  clients: Client[];
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  // Helper para obtener el nombre del cliente
  const getClientName = (loan: Loan): string => {
    // Primero intentar con el nombre guardado en el loan
    if (loan.client_name) return loan.client_name;
    if (loan.customerName) return loan.customerName;
    
    // Si no, buscar en el array de clientes usando client_id
    if (loan.client_id) {
      const client = clients.find(c => c.id === loan.client_id);
      if (client && client.name) return client.name;
    }
    
    return 'Sin nombre';
  };

  const getStartDate = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case 'day':
        return startOfDay(now);
      case 'week':
        return startOfWeek(now);
      case 'month':
        return startOfMonth(now);
      case 'all':
      default:
        return new Date(0);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (timeRange === 'all') return true;
    const startDate = getStartDate(timeRange);
    const loanDate = parseISO(loan.loanDate || loan.start_date || loan.startDate || new Date().toISOString());
    return isAfter(loanDate, startDate);
  });

  // Calcular métricas principales
  const totalLoaned = filteredLoans.reduce((acc, loan) => acc + loan.principal, 0);
  const totalToPay = filteredLoans.reduce((acc, loan) => acc + loan.amountToPay, 0);
  const totalPaid = filteredLoans.reduce((acc, loan) => acc + loan.amountApplied, 0);
  const totalProfit = totalPaid - filteredLoans.reduce((acc, loan) => {
    // Calcular cuánto del principal ya se pagó
    const paidInstallments = loan.installments.filter(i => i.status === 'Pagado').length;
    const totalInstallments = loan.installments.length;
    const principalPaid = totalInstallments > 0 ? (loan.principal * paidInstallments) / totalInstallments : 0;
    return acc + principalPaid;
  }, 0);
  
  const totalPending = filteredLoans.reduce((acc, loan) => acc + loan.totalPending, 0);
  
  // Calcular mora correctamente: 4% por cuota vencida
  const now = new Date();
  const calculateLoanLateFee = (loan: Loan): number => {
    let lateFee = 0;
    loan.installments.forEach(inst => {
      // Solo cuotas vencidas (fecha pasada) y no pagadas
      if ((inst.status === 'Pendiente' || inst.status === 'Atrasado') && inst.due_date) {
        const dueDate = new Date(inst.due_date);
        if (dueDate < now) {
          // 4% del monto de la cuota (principal + interés)
          const installmentAmount = (inst.principal_amount || 0) + (inst.interest_amount || 0);
          lateFee += installmentAmount * 0.04;
        }
      }
    });
    return lateFee;
  };

  // Recalcular totales con la nueva lógica de mora
  const loansWithCalculatedFees = filteredLoans.map(loan => ({
    ...loan,
    calculatedLateFee: calculateLoanLateFee(loan),
  }));

  const totalLateFee = loansWithCalculatedFees.reduce((acc, loan) => acc + loan.calculatedLateFee, 0);
  const totalOverdue = filteredLoans.reduce((acc, loan) => acc + loan.overdueAmount, 0);

  // Estados de préstamos
  const activeLoans = filteredLoans.filter(l => l.status !== 'Pagado' && l.status !== 'Cancelado');
  const paidLoans = filteredLoans.filter(l => l.status === 'Pagado');
  const overdueLoans = loansWithCalculatedFees.filter(l => l.calculatedLateFee > 0 || l.overdueAmount > 0);

  // Préstamos por estado
  const loansByStatus = [
    { name: 'Al Día', value: activeLoans.filter(l => l.overdueAmount === 0).length, color: '#10b981' },
    { name: 'En Mora', value: overdueLoans.length, color: '#ef4444' },
    { name: 'Pagados', value: paidLoans.length, color: '#3b82f6' },
  ];

  // Cuotas que vencen hoy, esta semana, este mes (acumulativo)
  const startToday = startOfDay(now);
  const endOfToday = addDays(startToday, 1);
  const startWeek = startOfWeek(now);
  const endOfWeek = addWeeks(startWeek, 1);
  const startMonth = startOfMonth(now);
  const endOfMonth = addMonths(startMonth, 1);

  const dueTodayInstallments: Array<{ loan: Loan; installment: any; client: string }> = [];
  const dueThisWeekInstallments: Array<{ loan: Loan; installment: any; client: string }> = [];
  const dueThisMonthInstallments: Array<{ loan: Loan; installment: any; client: string }> = [];

  activeLoans.forEach(loan => {
    loan.installments
      .filter(i => i.status === 'Pendiente' || i.status === 'Atrasado')
      .forEach(installment => {
        const dueDate = parseISO(installment.due_date || installment.dueDate || '');
        const clientName = getClientName(loan);
        
        // Vence HOY: solo las cuotas con fecha de hoy
        if (!isBefore(dueDate, startToday) && isBefore(dueDate, endOfToday)) {
          dueTodayInstallments.push({ loan, installment, client: clientName });
        }
        
        // Vence ESTA SEMANA: desde hoy hasta fin de semana (incluye hoy)
        if (!isBefore(dueDate, startToday) && isBefore(dueDate, endOfWeek)) {
          dueThisWeekInstallments.push({ loan, installment, client: clientName });
        }
        
        // Vence ESTE MES: desde hoy hasta fin de mes (incluye hoy y esta semana)
        if (!isBefore(dueDate, startToday) && isBefore(dueDate, endOfMonth)) {
          dueThisMonthInstallments.push({ loan, installment, client: clientName });
        }
      });
  });

  // Margen de beneficio por préstamo
  const profitMargins = filteredLoans
    .map(loan => {
      const totalInterest = loan.amountToPay - loan.principal;
      const margin = loan.principal > 0 ? (totalInterest / loan.principal) * 100 : 0;
      return {
        clientName: getClientName(loan),
        loanNumber: loan.loanNumber,
        margin: margin,
        principal: loan.principal,
        interest: totalInterest,
      };
    })
    .sort((a, b) => b.margin - a.margin)
    .slice(0, 10);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'all': return 'Desde Siempre';
      default: return 'Todos';
    }
  };

  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let yPos = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de BI - Préstamos', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${getTimeRangeLabel()}`, pageWidth / 2, yPos, { align: 'center' });
    doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, yPos + 5, { align: 'center' });
    
    yPos += 15;

    // Resumen Ejecutivo
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', margin, yPos);
    yPos += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      `Total Prestado: $${totalLoaned.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      `Ganancia Generada: $${totalProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      `Por Cobrar: $${totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`,
      `En Mora: $${totalOverdue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} (+ $${totalLateFee.toFixed(2)} multas)`,
    ];
    summaryData.forEach(line => {
      doc.text(line, margin, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Estado de Préstamos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado de Préstamos', margin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    loansByStatus.forEach(status => {
      doc.text(`${status.name}: ${status.value} préstamo(s)`, margin + 5, yPos);
      yPos += 5;
    });

    yPos += 5;

    // Cuotas por Vencer
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Calendario de Pagos', margin, yPos);
    yPos += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Vencen Hoy: ${dueTodayInstallments.length} cuota(s)`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Esta Semana: ${dueThisWeekInstallments.length} cuota(s)`, margin + 5, yPos);
    yPos += 5;
    doc.text(`Este Mes: ${dueThisMonthInstallments.length} cuota(s)`, margin + 5, yPos);
    yPos += 8;

    // Préstamos en Mora
    if (overdueLoans.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Préstamos en Mora (${overdueLoans.length})`, margin, yPos);
      yPos += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Cliente', margin, yPos);
      doc.text('Préstamo #', margin + 50, yPos);
      doc.text('Principal', margin + 85, yPos);
      doc.text('Vencido', margin + 120, yPos);
      doc.text('Mora', margin + 150, yPos);
      doc.text('Pendiente', margin + 170, yPos);
      yPos += 5;

      doc.setFont('helvetica', 'normal');
      overdueLoans.forEach((loan, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const clientName = getClientName(loan);
        const calculatedFee = calculateLoanLateFee(loan);
        doc.text(clientName.substring(0, 18), margin, yPos);
        doc.text(loan.loanNumber, margin + 50, yPos);
        doc.text(`$${loan.principal.toFixed(2)}`, margin + 85, yPos);
        doc.text(`$${loan.overdueAmount.toFixed(2)}`, margin + 120, yPos);
        doc.text(`$${calculatedFee.toFixed(2)}`, margin + 150, yPos);
        doc.text(`$${loan.totalPending.toFixed(2)}`, margin + 170, yPos);
        yPos += 5;
      });
    }

    // Top Márgenes de Beneficio
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    yPos += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top 10 - Márgenes de Beneficio', margin, yPos);
    yPos += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente', margin, yPos);
    doc.text('Préstamo #', margin + 60, yPos);
    doc.text('Principal', margin + 100, yPos);
    doc.text('Interés', margin + 135, yPos);
    doc.text('Margen %', margin + 170, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    profitMargins.forEach(item => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item.clientName.substring(0, 20), margin, yPos);
      doc.text(item.loanNumber, margin + 60, yPos);
      doc.text(`$${item.principal.toFixed(2)}`, margin + 100, yPos);
      doc.text(`$${item.interest.toFixed(2)}`, margin + 135, yPos);
      doc.text(`${item.margin.toFixed(2)}%`, margin + 170, yPos);
      yPos += 5;
    });

    // Guardar PDF
    const fileName = `reporte_prestamos_${getTimeRangeLabel()}_${format(new Date(), 'ddMMyyyy', { locale: es })}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            BI de Préstamos
          </h2>
          <p className="text-muted-foreground">
            Análisis de rentabilidad y gestión de cartera de préstamos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Desde siempre</SelectItem>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleGeneratePDF} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Prestado"
          value={`$${totalLoaned.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Capital total en préstamos"
        />
        <SummaryCard
          title="Ganancia Generada"
          value={`$${totalProfit.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={TrendingUp}
          description="Intereses cobrados"
        />
        <SummaryCard
          title="Por Cobrar"
          value={`$${totalPending.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={Clock}
          description="Saldo pendiente total"
        />
        <SummaryCard
          title="En Mora"
          value={`$${totalOverdue.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={AlertCircle}
          description={`+ $${totalLateFee.toFixed(2)} en multas`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de Préstamos</CardTitle>
            <CardDescription>
              Distribución de préstamos por estado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={loansByStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {loansByStatus.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 - Márgenes de Beneficio</CardTitle>
            <CardDescription>
              Clientes con préstamos de mayor % de ganancia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <RechartsBarChart
                data={profitMargins}
                layout="vertical"
                margin={{ left: 120 }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis
                  dataKey="clientName"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={120}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="margin"
                  fill="hsl(var(--chart-2))"
                  radius={[0, 4, 4, 0]}
                />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cuotas por vencer */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Vencen Hoy ({dueTodayInstallments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {dueTodayInstallments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay cuotas que venzan hoy
                </p>
              ) : (
                dueTodayInstallments.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{item.client}</p>
                      <p className="text-muted-foreground">
                        Préstamo #{item.loan.loanNumber} - Cuota #{item.installment.installmentNumber}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      ${(item.installment.principal_amount + item.installment.interest_amount).toFixed(2)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Esta Semana ({dueThisWeekInstallments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {dueThisWeekInstallments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay cuotas esta semana
                </p>
              ) : (
                dueThisWeekInstallments.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{item.client}</p>
                      <p className="text-muted-foreground">
                        Préstamo #{item.loan.loanNumber} - Cuota #{item.installment.installmentNumber}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      ${(item.installment.principal_amount + item.installment.interest_amount).toFixed(2)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Este Mes ({dueThisMonthInstallments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {dueThisMonthInstallments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay más cuotas este mes
                </p>
              ) : (
                dueThisMonthInstallments.map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-sm border-b pb-2">
                    <div>
                      <p className="font-medium">{item.client}</p>
                      <p className="text-muted-foreground">
                        Préstamo #{item.loan.loanNumber} - Cuota #{item.installment.installmentNumber}
                      </p>
                    </div>
                    <Badge>
                      ${(item.installment.principal_amount + item.installment.interest_amount).toFixed(2)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de préstamos en mora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Préstamos en Mora ({overdueLoans.length})
          </CardTitle>
          <CardDescription>
            Clientes con pagos atrasados que requieren seguimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Préstamo #</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Monto Vencido</TableHead>
                <TableHead>Mora</TableHead>
                <TableHead>Total Pendiente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueLoans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No hay préstamos en mora
                  </TableCell>
                </TableRow>
              ) : (
                overdueLoans.map((loan) => {
                  const calculatedFee = calculateLoanLateFee(loan);
                  return (
                    <TableRow key={loan.id}>
                      <TableCell className="font-medium">
                        {getClientName(loan)}
                      </TableCell>
                      <TableCell>{loan.loanNumber}</TableCell>
                      <TableCell>
                        ${loan.principal.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-destructive font-medium">
                        ${loan.overdueAmount.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-destructive">
                        ${calculatedFee.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        ${loan.totalPending.toLocaleString('es-ES', {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive">En Mora</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
