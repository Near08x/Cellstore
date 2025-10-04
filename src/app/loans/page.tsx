import MainLayout from '@/components/main-layout';
import LoansClient from '@/components/loans/loans-client';
import type { Loan, Client } from '@/lib/types';

async function getData(): Promise<{ loans: Loan[]; clients: Client[] }> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/loans`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Error fetching loans");
    const json = await res.json();
    return {
      loans: json.loans ?? [],
      clients: json.clients ?? [],
    };
  } catch (err) {
    console.error("Error en getData:", err);
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
