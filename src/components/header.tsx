'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { usePathname } from 'next/navigation';

const getTitleFromPathname = (pathname: string): string => {
  if (pathname === '/') return 'Tablero';

  const routeName = pathname.split('/').pop()?.replace(/-/g, ' ') ?? '';

  const titles: { [key: string]: string } = {
    pos: 'POS',
    inventory: 'Inventario',
    clients: 'Clientes',
    finance: 'Finanzas',
    loans: 'Gestión de Préstamos',
    settings: 'Configuración',
  };

  const title = titles[routeName] || (routeName.charAt(0).toUpperCase() + routeName.slice(1));
  return title;
}

export default function Header() {
  const pathname = usePathname();
  const title = getTitleFromPathname(pathname);
  
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6 no-print">
      <SidebarTrigger className="md:hidden" />
      <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      <div className="ml-auto flex items-center gap-4">
        <UserNav />
      </div>
    </header>
  );
}

