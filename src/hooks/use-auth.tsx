'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { User, Session } from '@supabase/supabase-js';
import type { Role } from '@/lib/types';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: Role;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRoleState] = useState<Role>('cashier');

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // 🔹 Cargar sesión inicial
  const loadUser = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[AuthProvider] Error loading session', error);
    }
    setSession(data.session);
    setUser(data.session?.user ?? null);
    setIsAuthenticated(!!data.session?.user);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    return () => listener.subscription.unsubscribe();
  }, [loadUser]);

  // 🔹 Redirección
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && pathname !== '/login') router.push('/login');
    if (isAuthenticated && pathname === '/login') router.push('/');
  }, [isAuthenticated, isLoading, pathname, router]);

  // 🔹 Login
  const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      toast({
        title: 'Error de autenticación',
        description: 'Correo o contraseña incorrectos.',
        variant: 'destructive',
      })
      return false
    }

    const { user } = await res.json()
    setUser(user)
    setIsAuthenticated(true)
    setRole(user.role)

    toast({
      title: 'Inicio de sesión exitoso',
      description: `Bienvenido ${user.username}`,
    })
    return true
  } catch (error) {
    toast({
      title: 'Error',
      description: 'No se pudo conectar con el servidor.',
      variant: 'destructive',
    })
    return false
  }
}

  // 🔹 Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const setRole = (newRole: Role) => setRoleState(newRole);

  return (
    <AuthContext.Provider value={{ user, session, role, isAuthenticated, isLoading, login, logout, setRole }}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center">Cargando...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
