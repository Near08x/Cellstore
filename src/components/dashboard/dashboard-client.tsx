
'use client';
import { CreditCard, DollarSign, Package } from 'lucide-react';
import SummaryCard from '@/components/dashboard/summary-card';
import RecentSales from '@/components/dashboard/recent-sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RecentClients from '@/components/dashboard/recent-clients';
import type { Product, Sale } from '@/lib/types';

export default function DashboardClient({
  products,
  sales,
}: {
  products: Product[];
  sales: Sale[];
}) {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.subtotal, 0);
  const totalSales = sales.length;
  const lowStockItems = products.filter((product) => product.stock < 10).length;
  const totalProducts = products.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Ingresos Totales"
          value={`$${totalRevenue.toLocaleString('es-ES', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="+20.1% desde el mes pasado"
        />
        <SummaryCard
          title="Ventas"
          value={`+${totalSales}`}
          icon={CreditCard}
          description="+180.1% desde el mes pasado"
        />
        <SummaryCard
          title="Poco Stock"
          value={`${lowStockItems} Artículos`}
          icon={Package}
          description="Alertas para artículos que necesitan reabastecimiento"
          variant="destructive"
        />
        <SummaryCard
          title="Productos Totales"
          value={totalProducts}
          icon={Package}
          description="Número actual de productos únicos"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentSales sales={sales} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentClients sales={sales} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
