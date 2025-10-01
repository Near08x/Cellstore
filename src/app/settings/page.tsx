'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import MainLayout from '@/components/main-layout';
import { useAuth } from '@/hooks/use-auth';
import UserManagement from '@/components/settings/user-management';
import { ShieldAlert } from 'lucide-react';
import type { User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

async function getUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    try {
        const res = await fetch('/api/users', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch users');
        return await res.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}


export default function SettingsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<Omit<User, 'passwordHash'>[]>([]);

  useEffect(() => {
    async function loadUsers() {
        if (role === 'admin') {
            const fetchedUsers = await getUsers();
            setUsers(fetchedUsers);
        }
    }
    loadUsers();
  }, [role]);

  const handleAddUser = async (newUser: Omit<User, 'id' | 'passwordHash'> & {password: string}) => {
      try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message ||'Failed to add user');

        setUsers(prev => [...prev, result]);
        toast({ title: 'Éxito', description: 'Usuario creado correctamente.' });
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'No se pudo crear el usuario.';
          toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
        const response = await fetch('/api/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: userId }),
        });
        if (!response.ok) throw new Error('Failed to delete user');
        setUsers(prev => prev.filter(u => u.id !== userId));
        toast({ title: 'Éxito', description: 'Usuario eliminado correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el usuario.', variant: 'destructive' });
    }
  };

  if (role !== 'admin') {
    return (
      <MainLayout>
        <div className="flex h-[70vh] items-center justify-center">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No tienes permisos para acceder a esta sección. Contacta a un administrador.
              </p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configuración</h2>
          <p className="text-muted-foreground">
            Gestiona los usuarios y otros ajustes de la aplicación.
          </p>
        </div>
         <UserManagement users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} />
      </div>
    </MainLayout>
  );
}
