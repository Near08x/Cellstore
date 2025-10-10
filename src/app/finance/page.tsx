import MainLayout from '@/components/main-layout';
import FinanceDashboard from '@/components/finance/finance-dashboard';
import type { Product, Sale } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

async function getData() {
  try {
    const [productsRes, salesRes] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('sales').select('*'),
    ]);

    if (productsRes.error || salesRes.error) {
      throw new Error(
        `Supabase error: ${productsRes.error?.message || ''} ${salesRes.error?.message || ''}`
      );
    }

    return {
      products: (productsRes.data as Product[]) ?? [],
      sales: (salesRes.data as Sale[]) ?? [],
    };
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return { products: [], sales: [] };
  }
}

export default async function FinancePage() {
  const { products, sales } = await getData();

  return (
    <MainLayout>
      <FinanceDashboard sales={sales} products={products} />
    </MainLayout>
  );
}



