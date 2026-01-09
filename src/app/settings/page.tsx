export const dynamic = 'force-dynamic';

import MainLayout from '@/components/main-layout';
import SettingsClient from '@/components/settings/settings-client';
import type { User } from '@/lib/types';
import { supabase } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';

async function getUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role');
    
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function getCurrentUserRole(): Promise<string | null> {
  try {
    // Obtener rol desde localStorage (que se almacena en cookies en producción)
    const cookieStore = await cookies();
    const roleFromCookie = cookieStore.get('app_role')?.value;
    
    if (roleFromCookie) {
      return roleFromCookie;
    }

    // Fallback: obtener desde localStorage del usuario
    // En SSR, esto no estará disponible, así que retornamos null
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const role = await getCurrentUserRole();
  const users = role === 'admin' ? await getUsers() : [];

  return (
    <MainLayout>
      <SettingsClient users={users} role={role} />
    </MainLayout>
  );
}
