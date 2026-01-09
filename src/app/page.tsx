import MainLayout from '@/components/main-layout';
import DashboardClient from '@/components/dashboard/dashboard-client';
import type { Product, Sale } from '@/lib/types';
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

async function getSales(): Promise<Sale[]> {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        id,
        subtotal,
        tax,
        total,
        amount,
        amount_paid,
        change_returned,
        payment_method,
        created_at,
        customer_email,
        customer_name,
        clients ( name ),
        sale_items (
          id,
          product_id,
          quantity,
          unit_price,
          products ( name )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Normalize sales data
    const result = (sales ?? []).map((s: any) => ({
      id: s.id,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      amount: s.amount || s.total,
      amount_paid: s.amount_paid,
      change_returned: s.change_returned,
      payment_method: s.payment_method,
      created_at: s.created_at,
      date: s.created_at,
      customer_email: s.customer_email,
      customerEmail: s.customer_email,
      customer_name: s.customer_name || s.clients?.name || '',
      customerName: s.customer_name || s.clients?.name || '',
      items: (s.sale_items ?? []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        productId: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        price: item.unit_price,
        name: item.products?.name || '',
      })),
    }));

    return result;
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

export default async function Home() {
  const [products, sales] = await Promise.all([
    getProducts(),
    getSales(),
  ]);

  return (
    <MainLayout>
      <DashboardClient products={products} sales={sales} />
    </MainLayout>
  );
}

