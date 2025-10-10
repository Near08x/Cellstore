export const dynamic = 'force-dynamic';

import MainLayout from '@/components/main-layout';
import InventoryClient from '@/components/inventory/inventory-client';
import type { Product } from '@/lib/types';
import { headers } from 'next/headers';

function resolveBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) return envBase;
  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';
  if (host) return `${proto}://${host}`;
  return 'http://localhost:9002';
}

// Obtener productos vía API interna con URL absoluta para Vercel
async function getProducts(): Promise<Product[]> {
  try {
    const base = resolveBaseUrl();
    const res = await fetch(`${base}/api/products`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as Product[]) : [];
  } catch (error) {
    console.error('Error fetching products (SSR):', error);
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
