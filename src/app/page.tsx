'use client';
import { CreditCard, DollarSign, Package } from 'lucide-react';
import SummaryCard from '@/components/dashboard/summary-card';
import RecentSales from '@/components/dashboard/recent-sales';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RecentClients from '@/components/dashboard/recent-clients';
import MainLayout from '@/components/main-layout';
import { useEffect, useState } from 'react';
import type { Product, Sale } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[Dashboard] Mounted   estoy en /');

    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('[Dashboard] Fetching /api/products y /api/sales ...');

        const [productsRes, salesRes] = await Promise.all([
          fetch(`/api/products`, { cache: 'no-store' }),
          fetch(`/api/sales`, { cache: 'no-store' }),
        ]);

        console.log('[Dashboard] productsRes.ok:', productsRes.ok, 'salesRes.ok:', salesRes.ok);

        if (!productsRes.ok || !salesRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const productsData = await productsRes.json();
        const salesData = await salesRes.json();

        console.log('[Dashboard] Datos recibidos:', {
          products: productsData,
          sales: salesData,
        });

        setProducts(productsData);
        setSales(salesData);
      } catch (error) {
        console.error('[Dashboard] Error al obtener datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.amount, 0);
  const totalSales = sales.length;
  const lowStockItems = products.filter((product) => product.stock < 10).length;
  const totalProducts = products.length;

  console.log('[Dashboard] Render  ', { products, sales, loading });

  if (loading) {
    return (
      <MainLayout>
        <DashboardSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
    </MainLayout>
  );
}

