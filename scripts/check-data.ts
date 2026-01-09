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

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas');
  console.error('   Asegúrate de tener .env.local con:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log('🔍 Verificando datos en Supabase...');
  console.log(`📡 Conectando a: ${supabaseUrl}\n`);

  // Verificar productos
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*');

  if (productsError) {
    console.error('❌ Error obteniendo productos:', productsError);
  } else {
    console.log(`✅ Productos encontrados: ${products?.length || 0}`);
    if (products && products.length > 0) {
      console.log('   Primeros 3 productos:');
      products.slice(0, 3).forEach((p: any) => {
        console.log(`   - ${p.name} (${p.provider}) - Stock: ${p.stock}`);
      });
    }
  }

  console.log('');

  // Verificar ventas
  const { data: sales, error: salesError } = await supabase
    .from('sales')
    .select('*');

  if (salesError) {
    console.error('❌ Error obteniendo ventas:', salesError);
  } else {
    console.log(`✅ Ventas encontradas: ${sales?.length || 0}`);
    if (sales && sales.length > 0) {
      console.log('   Últimas 3 ventas:');
      sales.slice(-3).forEach((s: any) => {
        const fecha = new Date(s.created_at || s.date);
        console.log(`   - ${s.customer_name || 'Sin nombre'} - $${s.amount} - ${fecha.toLocaleDateString()}`);
      });
    } else {
      console.log('   ⚠️ No hay ventas registradas en la base de datos');
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`   - Productos: ${products?.length || 0}`);
  console.log(`   - Ventas: ${sales?.length || 0}`);

  if (!sales || sales.length === 0) {
    console.log('\n💡 Los gráficos están vacíos porque no hay ventas en la base de datos.');
    console.log('   Para ver datos en los gráficos, necesitas:');
    console.log('   1. Ir a la sección POS');
    console.log('   2. Realizar algunas ventas de prueba');
    console.log('   3. Volver a la sección de Finanzas');
  }
}

checkData().catch(console.error);
