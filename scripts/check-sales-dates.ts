import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSalesDates() {
  console.log('🔍 Inspeccionando fechas de ventas...\n');

  const { data: sales, error } = await supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📅 Últimas 5 ventas (raw data):\n');
  sales?.forEach((sale: any, i: number) => {
    console.log(`Venta ${i + 1}:`);
    console.log(`  ID: ${sale.id}`);
    console.log(`  date: ${sale.date} (type: ${typeof sale.date})`);
    console.log(`  created_at: ${sale.created_at}`);
    console.log(`  amount: ${sale.amount}`);
    console.log(`  customer_name: ${sale.customer_name}`);
    console.log('');
  });

  // Probar conversión
  const firstSale = sales?.[0];
  if (firstSale) {
    console.log('🧪 Prueba de conversión de fecha:');
    console.log(`  Raw date: ${firstSale.date}`);
    console.log(`  new Date(date): ${new Date(firstSale.date)}`);
    console.log(`  new Date(created_at): ${new Date(firstSale.created_at)}`);
  }
}

checkSalesDates().catch(console.error);
