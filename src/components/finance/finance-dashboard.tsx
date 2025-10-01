'use client';
import {
  BarChart,
  DollarSign,
  Package,
  Printer,
  TrendingUp,
} from 'lucide-react';
import type { Product, Sale } from '@/lib/types';
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
} from 'date-fns';

type MonthlySales = {
  month: string;
  revenue: number;
  profit: number;
};

type ProviderSpending = {
  provider: string;
  spending: number;
};

type ProductMargin = {
  name: string;
  profitMargin: number;
};

type TimeRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

const chartConfig = {
  revenue: {
    label: 'Ingresos',
    color: 'hsl(var(--chart-1))',
  },
  profit: {
    label: 'Ganancia',
    color: 'hsl(var(--chart-2))',
  },
  spending: {
    label: 'Gasto',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function FinanceDashboard({
  sales,
  products,
}: {
  sales: Sale[];
  products: Product[];
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const getStartDate = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case 'day':
        return startOfDay(now);
      case 'week':
        return startOfWeek(now);
      case 'month':
        return startOfMonth(now);
      case 'quarter':
        return startOfQuarter(now);
      case 'year':
        return startOfYear(now);
      case 'all':
      default:
        return new Date(0);
    }
  };

  const filteredSales = sales.filter((sale) => {
    if (timeRange === 'all') return true;
    const startDate = getStartDate(timeRange);
    return isAfter(new Date(sale.date), startDate);
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  const totalRevenue = filteredSales.reduce(
    (acc, sale) => acc + sale.amount,
    0
  );

  const totalCost = filteredSales.reduce((acc, sale) => {
    const saleItems = sale.items || [];
    return (
      acc +
      saleItems.reduce((itemAcc, item) => {
        const product = productMap.get(item.productId);
        return itemAcc + (product ? product.cost * item.quantity : 0);
      }, 0)
    );
  }, 0);

  const totalProfit = totalRevenue - totalCost;
  const averageProfitMargin =
    totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const monthlySalesData: MonthlySales[] = filteredSales
    .reduce((acc, sale) => {
      const month = new Date(sale.date).toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });
      const saleItems = sale.items || [];
      const saleCost = saleItems.reduce((itemAcc, item) => {
        const product = productMap.get(item.productId);
        return itemAcc + (product ? product.cost * item.quantity : 0);
      }, 0);
      const saleProfit = sale.amount - saleCost;

      let monthEntry = acc.find((m) => m.month === month);
      if (monthEntry) {
        monthEntry.revenue += sale.amount;
        monthEntry.profit += saleProfit;
      } else {
        acc.push({ month, revenue: sale.amount, profit: saleProfit });
      }
      return acc;
    }, [] as MonthlySales[])
    .reverse();

  const providerSpending: ProviderSpending[] = Object.values(
    products.reduce(
      (acc, product) => {
        if (!acc[product.provider]) {
          acc[product.provider] = { provider: product.provider, spending: 0 };
        }
        acc[product.provider].spending += product.cost * product.stock; // Assuming spending is based on current stock cost
        return acc;
      },
      {} as Record<string, ProviderSpending>
    )
  );

  const productMargins: ProductMargin[] = products
    .map((product) => {
      const profit = product.price - product.cost;
      const profitMargin =
        product.price > 0 ? (profit / product.price) * 100 : 0;
      return { name: product.name, profitMargin };
    })
    .sort((a, b) => b.profitMargin - a.profitMargin);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 printable-area">
      <div className="flex items-center justify-between no-print">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Finanzas de POS/Inventario
          </h2>
          <p className="text-muted-foreground">
            Análisis de ingresos, costos y ganancias de tus ventas.
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
          title="Ingresos Totales"
          value={`$${totalRevenue.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Suma de todas las ventas"
        />
        <SummaryCard
          title="Ganancia Total"
          value={`$${totalProfit.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={TrendingUp}
          description="Ingresos menos costos de productos"
        />
        <SummaryCard
          title="Margen de Ganancia Promedio"
          value={`${averageProfitMargin.toFixed(2)}%`}
          icon={BarChart}
          description="Ganancia / Ingresos"
        />
        <SummaryCard
          title="Costo Total de Inventario"
          value={`$${providerSpending
            .reduce((acc, p) => acc + p.spending, 0)
            .toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
          icon={Package}
          description="Valor del stock actual"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Mensuales</CardTitle>
            <CardDescription>
              Ingresos y ganancias de los últimos meses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <RechartsBarChart data={monthlySalesData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar dataKey="profit" fill="var(--color-profit)" radius={4} />
              </RechartsBarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Proveedor</CardTitle>
            <CardDescription>
              Distribución de costos de inventario por proveedor.
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
                  data={providerSpending}
                  dataKey="spending"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="var(--color-spending)"
                  label
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Análisis de Margen de Beneficio por Producto</CardTitle>
          <CardDescription>
            Productos ordenados por su margen de ganancia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">
                  Margen de Ganancia (%)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productMargins.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-right">
                    {p.profitMargin.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
