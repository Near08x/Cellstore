export const dynamic = 'force-dynamic';

import MainLayout from '@/components/main-layout';
import LoansClient from '@/components/loans/loans-client';
import type { Loan, Client } from '@/lib/types';

async function getData(): Promise<{ loans: Loan[]; clients: Client[] }> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || '';
    const url = `${base}/api/loans`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      loans: Array.isArray(data?.loans) ? (data.loans as Loan[]) : [],
      clients: Array.isArray(data?.clients) ? (data.clients as Client[]) : [],
    };
  } catch (error) {
    console.error('Error en getData (/api/loans):', error);
    return { loans: [], clients: [] };
  }
}

export default async function LoansPage() {
  const { loans, clients } = await getData();
  return (
    <MainLayout>
      <LoansClient loans={loans} clients={clients} />
    </MainLayout>
  );
}

