import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('URL:', supabaseUrl ? 'OK' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLoansData() {
  const { data, error } = await supabase
    .from('loans')
    .select(`
      id,
      loan_number,
      loan_installments (
        id,
        installment_number,
        due_date
      )
    `)
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Datos de préstamos:', JSON.stringify(data, null, 2));
  }
}

checkLoansData();
