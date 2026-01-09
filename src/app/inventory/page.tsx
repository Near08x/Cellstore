export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidar cada 60 segundos

import MainLayout from '@/components/main-layout';
import InventoryClient from '@/components/inventory/inventory-client';
import type { Product } from '@/lib/types';
import { supabase } from '@/lib/supabaseServer';

async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export default async function InventoryPage() {
  const products = await getProducts();

  return (
    <MainLayout>
      <InventoryClient products={products} />
    </MainLayout>
  );
}
