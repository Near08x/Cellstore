// register-user.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza con tus claves reales
const SUPABASE_URL = 'https://ycvksxpxgykwfvauyjnt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdmtzeHB4Z3lrd2Z2YXV5am50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTE5MjEzNSwiZXhwIjoyMDc0NzY4MTM1fQ.YDfSbHxBb4SEeO7sWWhg3j-YMQBhAyA4dtCE973CHdI'; // ⚠️ Solo para backend seguro

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const registerUser = async (email, password, role = 'cashier') => {
  try {
    // 🔐 Crear usuario
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) throw error;

    const userId = data.user.id;

    // 🧾 Insertar perfil en tabla 'profiles'
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{ user_id: userId, email, role }]);

    if (profileError) throw profileError;

    console.log(`✅ Usuario creado: ${email} con rol ${role}`);
  } catch (err) {
    console.error('❌ Error al registrar usuario:', err.message);
  }
};

// Ejecutar desde terminal con argumentos
const [email, password, role] = process.argv.slice(2);
if (!email || !password) {
  console.error('❌ Uso: node register-user.js <email> <password> [role]');
  process.exit(1);
}

registerUser(email, password, role);