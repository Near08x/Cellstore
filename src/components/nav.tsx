'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Boxes,
  Home,
  Landmark,
  LogOut,
  PiggyBank,
  Settings,
  ShoppingCart,
  Users,
} from 'lucide-react';

import {
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from './ui/separator';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

const allMenuItems = [
  { href: '/', label: 'Tablero', icon: Home, roles: ['admin'] },
  { href: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'cashier'] },
  { href: '/inventory', label: 'Inventario', icon: Boxes, roles: ['admin', 'cashier'] },
  { href: '/clients', label: 'Clientes', icon: Users, roles: ['admin'] },
  { href: '/finance', label: 'Finanzas', icon: PiggyBank, roles: ['admin'] },
  { href: '/loans', label: 'Préstamos', icon: Landmark, roles: ['admin', 'cashier'] },
];

export default function Nav() {
  const pathname = usePathname();
  const { role, logout } = useAuth();
  
  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center justify-center gap-2.5">
          <Image
            src="/logo.png"
            alt="CellStore Logo"
            width={120}
            height={120}
          />
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="my-2" />
        <SidebarMenu>
            <SidebarMenuItem>
              <Link href="/settings">
                <SidebarMenuButton isActive={pathname === '/settings'} tooltip="Configuración">
                  <Settings />
                  <span>Configuración</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Cerrar Sesión" onClick={logout}>
              <LogOut />
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

