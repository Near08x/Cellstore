import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinanceData() {
  console.log('🧪 Probando datos para página de finanzas...\n');

  // Simular lo que hace finance/page.tsx con JOIN
  const [productsRes, salesRes] = await Promise.all([
    supabase.from('products').select('*'),
    supabase.from('sales').select(`
      *,
      sale_items (
        id,
        product_id,
        quantity,
        unit_price
      )
    `),
  ]);

  if (productsRes.error || salesRes.error) {
    console.error('❌ Error:', productsRes.error || salesRes.error);
    return;
  }

  console.log(`✅ Productos: ${productsRes.data?.length || 0}`);
  console.log(`✅ Ventas: ${salesRes.data?.length || 0}\n`);

  // Normalizar ventas como lo hace el código
  const normalizeSale = (row: any) => {
    let rawItems: any[] = [];
    if (Array.isArray(row.sale_items)) {
      rawItems = row.sale_items;
    } else if (Array.isArray(row.items)) {
      rawItems = row.items;
    } else if (typeof row.items === 'string') {
      try {
        rawItems = JSON.parse(row.items);
      } catch {
        rawItems = [];
      }
    } else if (row.items == null && row.sale_items == null) {
      rawItems = [];
    }

    const items = rawItems.map((it: any) => {
      const productId = String(it.product_id ?? it.productId ?? it.id ?? it.product);
      const quantity = Number(it.quantity ?? it.qty ?? 0);
      const unitPrice = Number(it.unit_price ?? it.unitPrice ?? it.price ?? it.unit ?? 0);
      const total = Number(it.total ?? it.total_price ?? unitPrice * quantity);
      const price = Number(it.price ?? unitPrice);
      return {
        productId,
        quantity,
        unitPrice,
        total,
        price,
      };
    });

    const computedAmount = items.reduce((s: number, i: any) => s + (i.total || 0), 0);
    const amount = Number(row.amount ?? row.total ?? computedAmount);
    const subtotal = Number(row.subtotal ?? amount);
    const tax = Number(row.tax ?? 0);

    return {
      id: String(row.id ?? ''),
      customerName: row.customer_name ?? '',
      amount,
      tax,
      date: String(row.created_at ?? row.date ?? new Date().toISOString()),
      items,
    };
  };

  const sales = (salesRes.data ?? []).map(normalizeSale);

  console.log('📊 Ventas normalizadas:');
  sales.forEach((sale: any) => {
    console.log(`  - ID: ${sale.id.substring(0, 8)}... | $${sale.amount} | ${new Date(sale.date).toLocaleString()} | Items: ${sale.items.length}`);
  });

  console.log('\n🔍 Verificando items de las ventas:');
  const saleWithItems = sales.find((s: any) => s.items && s.items.length > 0);
  if (saleWithItems) {
    console.log('  ✅ Se encontró venta con items:', saleWithItems.items);
  } else {
    console.log('  ⚠️ Ninguna venta tiene items en el array');
    console.log('  💡 Esto significa que el problema está en cómo se guardan los items');
  }

  // Verificar estructura real de una venta
  console.log('\n🔎 Raw data de primera venta:');
  console.log(JSON.stringify(salesRes.data?.[0], null, 2));
}

testFinanceData().catch(console.error);
