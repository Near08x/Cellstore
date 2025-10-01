import MainLayout from '@/components/main-layout';
import LoansClient from '@/components/loans/loans-client';
import type { Loan, Client } from '@/lib/types';
import { supabase } from "@/lib/supabaseClient";

// 🔹 Obtener préstamos desde Supabase
async function getLoans(): Promise<Loan[]> {
  try {
    const { data, error } = await supabase.from("loans").select("*");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching loans:", error);
    return [];
  }
}

// 🔹 Obtener clientes desde Supabase
async function getClients(): Promise<Client[]> {
  try {
    const { data, error } = await supabase.from("clients").select("*");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export default async function LoansPage() {
  const [loansData, clientsData] = await Promise.all([
    getLoans(),
    getClients(),
  ]);

  return (
    <MainLayout>
      <LoansClient loans={loansData} clients={clientsData} />
    </MainLayout>
  );
}
