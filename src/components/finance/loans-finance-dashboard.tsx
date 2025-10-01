'use client';
import {
  BarChart,
  DollarSign,
  Landmark,
  Printer,
  TrendingUp,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import type { Loan } from '@/lib/types';
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
} from 'recharts';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
  startOfQuarter,
  startOfYear,
  isAfter,
  parseISO,
} from 'date-fns';

type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';
type LoanStatus = 'Al día' | 'Atrasado' | 'Pagado';

const chartConfig: ChartConfig = {
  capital: { label: 'Capital', color: 'hsl(var(--chart-1))' },
  interest: { label: 'Interés', color: 'hsl(var(--chart-2))' },
  status: { label: 'Estado', color: 'hsl(var(--chart-3))' },
};

const getLoanStatus = (loan: Loan): LoanStatus => {
  if (loan.totalPending <= 0) return 'Pagado';
  if (loan.overdueAmount > 0 || loan.lateFee > 0) return 'Atrasado';
  return 'Al día';
};

export default function LoansFinanceDashboard({ loans }: { loans: Loan[]; clients: any[] }) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const getStartDate = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case 'day': return startOfDay(now);
      case 'week': return startOfWeek(now);
      case 'month': return startOfMonth(now);
      case 'quarter': return startOfQuarter(now);
      case 'year': return startOfYear(now);
      default: return new Date(0);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (timeRange === 'all') return true;
    const startDate = getStartDate(timeRange);
    return isAfter(parseISO(loan.loanDate), startDate);
  });

  const totalCapitalLent = filteredLoans.reduce((acc, loan) => acc + loan.amount, 0);
  const totalAmountApplied = filteredLoans.reduce((acc, loan) => acc + loan.amountApplied, 0);
  const totalInterestCollected = filteredLoans.reduce((acc, loan) => 
    acc + loan.installments
      .filter(inst => inst.status === 'Pagado')
      .reduce((iAcc, inst) => iAcc + inst.interest_amount, 0),
  0);
  const capitalAtRisk = filteredLoans
    .filter(loan => getLoanStatus(loan) === 'Atrasado')
    .reduce((acc, loan) => acc + loan.totalPending, 0);

  const monthlyData = filteredLoans
    .reduce((acc, loan) => {
      const month = parseISO(loan.loanDate).toLocaleString('default', { month: 'short', year: 'numeric' });
      let monthEntry = acc.find((m) => m.month === month);
      
      const interestCollected = loan.installments.filter(i => i.status === 'Pagado').reduce((sum, i) => sum + i.interest_amount, 0);

      if (monthEntry) {
        monthEntry.capital += loan.amount;
        monthEntry.interest += interestCollected;
      } else {
        acc.push({ month, capital: loan.amount, interest: interestCollected });
      }
      return acc;
    }, [] as { month: string; capital: number; interest: number }[])
    .reverse();

  const loanStatusData = Object.entries(
    filteredLoans.reduce((acc, loan) => {
      const status = getLoanStatus(loan);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<LoanStatus, number>)
  ).map(([name, value]) => ({ name, value, fill: `hsl(var(--chart-${Object.keys(chartConfig).length + 1}))` }));


  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 printable-area">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Finanzas de Préstamos</h2>
          <p className="text-muted-foreground">
            Análisis de capital, intereses y rendimiento de préstamos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar rango" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Desde siempre</SelectItem>
              <SelectItem value="day">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handlePrint} size="sm" variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Reportes
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4">
        <SummaryCard
          title="Capital Prestado"
          value={`$${totalCapitalLent.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Landmark}
          description="Total de dinero prestado a clientes"
        />
        <SummaryCard
          title="Total Recuperado"
          value={`$${totalAmountApplied.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={Receipt}
          description="Suma de todos los pagos recibidos"
        />
        <SummaryCard
          title="Intereses Cobrados"
          value={`$${totalInterestCollected.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="Ganancias generadas por intereses"
        />
        <SummaryCard
          title="Capital en Riesgo"
          value={`$${capitalAtRisk.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={AlertTriangle}
          description="Suma pendiente de préstamos atrasados"
          variant="destructive"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rendimiento Mensual</CardTitle>
            <CardDescription>Capital prestado vs. interés cobrado por mes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <RechartsBarChart data={monthlyData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="capital" fill="var(--color-capital)" radius={4} />
                <Bar dataKey="interest" fill="var(--color-interest)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Préstamos</CardTitle>
            <CardDescription>Estado actual de la cartera de préstamos.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={loanStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de Préstamos Activos</CardTitle>
          <CardDescription>Detalles de los préstamos en curso y finalizados.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. Préstamo</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto Prestado</TableHead>
                <TableHead>Total Pendiente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoans.map((loan) => {
                const status = getLoanStatus(loan);
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.loanNumber}</TableCell>
                    <TableCell>{loan.customerName}</TableCell>
                    <TableCell>${loan.amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold">${loan.totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>
                      <Badge variant={status === 'Atrasado' ? 'destructive' : status === 'Pagado' ? 'secondary' : 'outline'}>
                        {status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
