import MainLayout from '@/components/main-layout';
import InventoryClient from '@/components/inventory/inventory-client';
import type { Product } from '@/lib/types';
import { supabase } from "@/lib/supabaseClient";

// 🔹 Obtener productos desde Supabase
async function getProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function InventoryPage() {
  const productData = await getProducts();

  return (
    <MainLayout>
      <InventoryClient products={productData} />
    </MainLayout>
  );
}
