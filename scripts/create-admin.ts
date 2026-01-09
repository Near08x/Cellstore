'use server';
import { supabaseAdmin } from "../src/lib/supabaseServer";

export async function createInitialAdminUser() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'near9708@gmail.com',
    password: 'robert123',
    email_confirm: true,
    user_metadata: { name: 'Admin Near', role: 'admin' },
  });

  if (error) throw error;
  console.log('✅ Usuario admin creado:', data.user.email);
}
