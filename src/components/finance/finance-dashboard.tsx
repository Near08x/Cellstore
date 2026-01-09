'use client';
import {
  BarChart,
  DollarSign,
  Package,
  Printer,
  TrendingUp,
} from 'lucide-react';
import type { Product, Sale, Loan, Client } from '@/lib/types';
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
  Cell,
} from 'recharts';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useState } from 'react';
import LoansBIDashboard from './loans-bi-dashboard';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  isAfter,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ChartPoint = {
  label: string;
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
  loans,
  clients,
}: {
  sales: Sale[];
  products: Product[];
  loans: Loan[];
  clients: Client[];
}) {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('sales');

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

  const totalTax = filteredSales.reduce(
    (acc, sale) => acc + (sale.tax || 0),
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

  // Build time-range aware chart data
  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const weekDays = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const now = new Date();

  let chartData: ChartPoint[] = [];
  if (timeRange === 'day') {
    // Hours 0-23 for today
    const buckets = Array.from({ length: 24 }, (_, h) => ({ label: `${h}:00`, revenue: 0, profit: 0 }));
    for (const sale of filteredSales) {
      const d = new Date(sale.date);
      const hour = d.getHours();
      const saleCost = (sale.items || []).reduce((s, it) => {
        const p = productMap.get(it.productId);
        return s + (p ? p.cost * it.quantity : 0);
      }, 0);
      buckets[hour].revenue += sale.amount;
      buckets[hour].profit += sale.amount - saleCost;
    }
    chartData = buckets;
  } else if (timeRange === 'week') {
    // Monday-Sunday
    const buckets = weekDays.map((d) => ({ label: d, revenue: 0, profit: 0 }));
    for (const sale of filteredSales) {
      const d = new Date(sale.date);
      const idx = (d.getDay() + 6) % 7; // convert Sun(0)..Sat(6) -> Mon(0)..Sun(6)
      const saleCost = (sale.items || []).reduce((s, it) => {
        const p = productMap.get(it.productId);
        return s + (p ? p.cost * it.quantity : 0);
      }, 0);
      buckets[idx].revenue += sale.amount;
      buckets[idx].profit += sale.amount - saleCost;
    }
    chartData = buckets;
  } else if (timeRange === 'month') {
    // Days of current month
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const buckets = Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), revenue: 0, profit: 0 }));
    for (const sale of filteredSales) {
      const d = new Date(sale.date);
      const day = d.getDate();
      const saleCost = (sale.items || []).reduce((s, it) => {
        const p = productMap.get(it.productId);
        return s + (p ? p.cost * it.quantity : 0);
      }, 0);
      buckets[day - 1].revenue += sale.amount;
      buckets[day - 1].profit += sale.amount - saleCost;
    }
    chartData = buckets;
  } else {
    // quarter/year/all -> aggregate by month
    const buckets = monthNames.map((m) => ({ label: m, revenue: 0, profit: 0 }));
    for (const sale of filteredSales) {
      const d = new Date(sale.date);
      const m = d.getMonth();
      const saleCost = (sale.items || []).reduce((s, it) => {
        const p = productMap.get(it.productId);
        return s + (p ? p.cost * it.quantity : 0);
      }, 0);
      buckets[m].revenue += sale.amount;
      buckets[m].profit += sale.amount - saleCost;
    }
    chartData = buckets;
  }

  // Gastos por proveedor: basado en inventario actual (cost × stock) - INMUTABLE
  const providerSpendingMap = products.reduce((acc, p) => {
    if (!acc[p.provider]) {
      acc[p.provider] = { provider: p.provider, spending: 0 };
    }
    acc[p.provider].spending += p.cost * p.stock;
    return acc;
  }, {} as Record<string, ProviderSpending>);
  
  const providerSpending: ProviderSpending[] = Object.values(providerSpendingMap).filter(
    (ps) => ps.spending > 0
  );

  // Color palette for providers — will cycle if there are more providers than colors
  const providerColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f472b6', // pink
    '#a3e635', // lime
  ];

  // Obtener lista única de proveedores (todos)
  const providers = Array.from(new Set(products.map((p) => p.provider))).sort();

  // Calcular ventas y márgenes reales por producto/proveedor en el periodo
  const salesByProduct = new Map<string, { revenue: number; cost: number; provider: string; name: string }>();
  
  for (const sale of filteredSales) {
    for (const it of sale.items || []) {
      const p = productMap.get(it.productId);
      if (!p) continue;
      
      const existing = salesByProduct.get(it.productId);
      const itemRevenue = it.quantity * (it.unitPrice || it.price || p.price);
      const itemCost = it.quantity * p.cost;
      
      if (existing) {
        existing.revenue += itemRevenue;
        existing.cost += itemCost;
      } else {
        salesByProduct.set(it.productId, {
          revenue: itemRevenue,
          cost: itemCost,
          provider: p.provider,
          name: p.name,
        });
      }
    }
  }

  // Obtener proveedores que tienen ventas en el periodo
  const soldProviders = Array.from(
    new Set(Array.from(salesByProduct.values()).map((s) => s.provider))
  ).sort();

  const productMargins: ProductMargin[] =
    selectedProvider === 'all'
      ? // Cuando "all", agrupar por proveedor y calcular margen real de ventas
        soldProviders
          .map((provider) => {
            const providerSales = Array.from(salesByProduct.values()).filter(
              (s) => s.provider === provider
            );
            const totalRevenue = providerSales.reduce((sum, s) => sum + s.revenue, 0);
            const totalCost = providerSales.reduce((sum, s) => sum + s.cost, 0);
            const profit = totalRevenue - totalCost;
            const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
            return { name: provider, profitMargin };
          })
          .sort((a, b) => b.profitMargin - a.profitMargin)
      : // Cuando un proveedor específico, mostrar productos individuales vendidos
        Array.from(salesByProduct.values())
          .filter((s) => s.provider === selectedProvider)
          .map((s) => {
            const profit = s.revenue - s.cost;
            const profitMargin = s.revenue > 0 ? (profit / s.revenue) * 100 : 0;
            return { name: s.name, profitMargin };
          })
          .sort((a, b) => b.profitMargin - a.profitMargin);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'day': return 'Hoy';
      case 'week': return 'Esta semana';
      case 'month': return 'Este mes';
      case 'quarter': return 'Este trimestre';
      case 'year': return 'Este año';
      case 'all': return 'Desde siempre';
      default: return 'Todos';
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 20;

      // Encabezado
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Reporte Financiero', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 8;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Periodo: ${getTimeRangeLabel()}`, pageWidth / 2, yPos, { align: 'center' });
      pdf.text(`Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, pageWidth / 2, yPos + 6, { align: 'center' });
      
      yPos += 20;

      // Resumen de métricas
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Resumen Ejecutivo', 14, yPos);
      yPos += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const metrics = [
        ['Ingresos Totales:', `$${totalRevenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
        ['Ganancia Total:', `$${totalProfit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
        ['Margen Promedio:', `${averageProfitMargin.toFixed(2)}%`],
        ['ITBIS (18%):', `$${totalTax.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
        ['Costo Inventario:', `$${providerSpending.reduce((acc, p) => acc + p.spending, 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`],
      ];

      metrics.forEach(([label, value]) => {
        pdf.text(label, 14, yPos);
        pdf.text(value, 100, yPos);
        yPos += 6;
      });

      yPos += 10;

      // Tabla de ventas por periodo
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detalle de Ventas por Periodo', 14, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Periodo', 14, yPos);
      pdf.text('Ingresos', 60, yPos);
      pdf.text('Ganancia', 100, yPos);
      yPos += 5;

      pdf.setFont('helvetica', 'normal');
      chartData.forEach((point) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(point.label, 14, yPos);
        pdf.text(`$${point.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 60, yPos);
        pdf.text(`$${point.profit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 100, yPos);
        yPos += 5;
      });

      yPos += 10;

      // Nueva página para proveedores
      pdf.addPage();
      yPos = 20;

      // Gastos por proveedor (TODOS los proveedores)
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Inventario por Proveedor', 14, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Proveedor', 14, yPos);
      pdf.text('Costo Inventario', 120, yPos);
      pdf.text('% Total', 170, yPos);
      yPos += 5;

      const totalInventoryCost = providerSpending.reduce((acc, p) => acc + p.spending, 0);
      pdf.setFont('helvetica', 'normal');
      providerSpending.forEach((ps) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        const percentage = totalInventoryCost > 0 ? (ps.spending / totalInventoryCost * 100).toFixed(2) : '0.00';
        pdf.text(ps.provider, 14, yPos);
        pdf.text(`$${ps.spending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 120, yPos);
        pdf.text(`${percentage}%`, 170, yPos);
        yPos += 5;
      });

      yPos += 10;

      // Ventas por proveedor en el periodo
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ventas por Proveedor (Periodo Seleccionado)', 14, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Proveedor', 14, yPos);
      pdf.text('Ingresos', 90, yPos);
      pdf.text('Costo', 130, yPos);
      pdf.text('Ganancia', 170, yPos);
      yPos += 5;

      // Calcular ventas por proveedor
      const salesByProvider = new Map<string, { revenue: number; cost: number }>();
      for (const sale of filteredSales) {
        for (const it of sale.items || []) {
          const p = productMap.get(it.productId);
          if (!p) continue;
          
          const existing = salesByProvider.get(p.provider);
          const itemRevenue = it.quantity * (it.unitPrice || it.price || p.price);
          const itemCost = it.quantity * p.cost;
          
          if (existing) {
            existing.revenue += itemRevenue;
            existing.cost += itemCost;
          } else {
            salesByProvider.set(p.provider, { revenue: itemRevenue, cost: itemCost });
          }
        }
      }

      // Incluir TODOS los proveedores (incluso sin ventas)
      pdf.setFont('helvetica', 'normal');
      providers.forEach((provider) => {
        if (yPos > pageHeight - 20) {
          pdf.addPage();
          yPos = 20;
        }
        const providerData = salesByProvider.get(provider) || { revenue: 0, cost: 0 };
        const profit = providerData.revenue - providerData.cost;
        
        pdf.text(provider, 14, yPos);
        pdf.text(`$${providerData.revenue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 90, yPos);
        pdf.text(`$${providerData.cost.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 130, yPos);
        pdf.text(`$${profit.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, 170, yPos);
        yPos += 5;
      });

      // Guardar PDF
      pdf.save(`reporte-financiero-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Por favor intenta de nuevo.');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="sales">Ventas e Inventario</TabsTrigger>
        <TabsTrigger value="loans">Préstamos</TabsTrigger>
      </TabsList>

      <TabsContent value="sales">
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
            Descargar PDF
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
          description="Total de ventas (incluye ITBIS)"
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
        <SummaryCard
          title="Total ITBIS (18%)"
          value={`$${totalTax.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={BarChart}
          description="Total de impuestos recaudados"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por periodo</CardTitle>
            <CardDescription>
              Ingresos y ganancias según el rango seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[300px] w-full"
            >
              <RechartsBarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="label"
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
                  label
                >
                  {providerSpending.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={providerColors[i % providerColors.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análisis de Margen de Beneficio {selectedProvider === 'all' ? 'por Proveedor' : 'por Producto'}</CardTitle>
              <CardDescription>
                {selectedProvider === 'all'
                  ? 'Margen de ganancia promedio por proveedor.'
                  : 'Productos ordenados por su margen de ganancia.'}
              </CardDescription>
            </div>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por proveedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proveedores</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              profitMargin: {
                label: 'Margen (%)',
                color: 'hsl(var(--chart-2))',
              },
            }}
            className="min-h-[400px] w-full"
          >
            <RechartsBarChart
              data={productMargins}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid horizontal={false} />
              <XAxis type="number" />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="profitMargin"
                fill="hsl(var(--chart-2))"
                radius={[0, 4, 4, 0]}
              />
            </RechartsBarChart>
          </ChartContainer>
        </CardContent>
      </Card>
        </div>
      </TabsContent>

      <TabsContent value="loans">
        <LoansBIDashboard loans={loans} clients={clients} />
      </TabsContent>
    </Tabs>
  );
}
