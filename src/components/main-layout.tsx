'use client';
import type { ReactNode } from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import Nav from '@/components/nav';
import Header from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from './ui/skeleton';

function FullScreenLoader() {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        </div>
    )
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <FullScreenLoader />;
  }
  
  return (
      <SidebarProvider>
        <Sidebar className="no-print">
          <Nav />
        </Sidebar>
        <SidebarInset>
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
  );
}
