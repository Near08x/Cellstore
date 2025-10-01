import MainLayout from '@/components/main-layout';
import ClientsClient from '@/components/clients/clients-client';
import type { Client, Sale } from '@/lib/types';
import { supabase } from "@/lib/supabaseClient";

// 🔹 Obtener clientes directo de la tabla "clients"
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

// 🔹 Obtener ventas directo de la tabla "sales"
async function getSales(): Promise<Sale[]> {
  try {
    const { data, error } = await supabase.from("sales").select("*");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

export default async function ClientsPage() {
  const [clientsData, salesData] = await Promise.all([
    getClients(),
    getSales(),
  ]);

  return (
    <MainLayout>
      <ClientsClient initialClients={clientsData} sales={salesData} />
    </MainLayout>
  );
}
