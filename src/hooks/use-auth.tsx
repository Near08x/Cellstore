'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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

  // Cargar usuario persistido (localStorage)
  const loadUser = useCallback(async () => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('app_user') : null;
      const rawRole = typeof window !== 'undefined' ? localStorage.getItem('app_role') : null;
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u as unknown as User);
        setIsAuthenticated(true);
        if (rawRole) setRoleState(rawRole as Role);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.warn('[AuthProvider] Error loading persisted user', e);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Redirección
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && pathname !== '/login') router.push('/login');
    if (isAuthenticated && pathname === '/login') router.push('/');
  }, [isAuthenticated, isLoading, pathname, router]);

  // Login usando API /profiles (persistencia local)
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        toast({
          title: 'Error de autenticación',
          description: 'Correo o contraseña incorrectos.',
          variant: 'destructive',
        });
        return false;
      }

      const { user: apiUser } = await res.json();
      setSession(null);
      setUser(apiUser as unknown as User);
      setIsAuthenticated(true);
      setRoleState((apiUser as any).role as Role);

      try {
        localStorage.setItem('app_user', JSON.stringify(apiUser));
        localStorage.setItem('app_role', String((apiUser as any).role));
      } catch {}

      toast({
        title: 'Inicio de sesión exitoso',
        description: `Bienvenido ${(apiUser as any).username || (apiUser as any).email}`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo conectar con el servidor.',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_role');
    } catch {}
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
