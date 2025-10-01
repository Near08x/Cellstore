import MainLayout from '@/components/main-layout';
import PosClient from '@/components/pos/pos-client';
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

export default async function PosPage() {
  const productData = await getProducts();

  return (
    <MainLayout>
      <PosClient products={productData} />
    </MainLayout>
  );
}
