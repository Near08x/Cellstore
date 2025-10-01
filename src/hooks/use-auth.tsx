'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Role } from '@/lib/types';
import type { User, Session } from '@supabase/supabase-js';

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
  // 🔹 Siempre autenticado en modo dev
  const [user, setUser] = useState<User | null>({
    id: 'dev-user',
    email: 'dev@example.com',
  } as User);
  const [session] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoading] = useState(false);
  const [role, setRoleState] = useState<Role>('admin');

  const router = useRouter();

  // 🔹 Login simulado
  const login = async (_email: string, _password: string): Promise<boolean> => {
    console.log('[AuthProvider] 🔓 Login bypass (dev mode)');
    setIsAuthenticated(true);
    return true;
  };

  // 🔹 Logout simulado (ya no redirige a /login)
  const logout = async () => {
    console.log('[AuthProvider] 🔒 Logout bypass (dev mode)');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/'); // 👈 redirige a home
  };

  const setRole = (newRole: Role) => {
    console.log('[AuthProvider] setRole() →', newRole);
    setRoleState(newRole);
  };

  const value: AuthContextType = {
    user,
    session,
    role,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
