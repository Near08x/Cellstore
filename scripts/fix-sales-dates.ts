import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSalesDates() {
  console.log('🔧 Actualizando fechas de ventas...\n');

  // Obtener todas las ventas sin el campo date
  const { data: sales, error: fetchError } = await supabase
    .from('sales')
    .select('id, created_at, date')
    .is('date', null);

  if (fetchError) {
    console.error('❌ Error obteniendo ventas:', fetchError);
    return;
  }

  console.log(`📝 Ventas sin fecha: ${sales?.length || 0}\n`);

  if (!sales || sales.length === 0) {
    console.log('✅ Todas las ventas tienen fecha');
    return;
  }

  // Actualizar cada venta para copiar created_at a date
  let updated = 0;
  for (const sale of sales) {
    const { error: updateError } = await supabase
      .from('sales')
      .update({ date: sale.created_at })
      .eq('id', sale.id);

    if (updateError) {
      console.error(`❌ Error actualizando venta ${sale.id}:`, updateError);
    } else {
      updated++;
      console.log(`✅ Actualizada venta ${sale.id}`);
    }
  }

  console.log(`\n✅ Actualizadas ${updated} de ${sales.length} ventas`);
}

fixSalesDates().catch(console.error);
