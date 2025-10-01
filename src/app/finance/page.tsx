import MainLayout from '@/components/main-layout';
import FinanceDashboard from '@/components/finance/finance-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoansFinanceDashboard from '@/components/finance/loans-finance-dashboard';
import type { Product, Sale, Loan, Client } from '@/lib/types';
import { supabase } from "@/lib/supabaseClient";

// 🔹 Reemplazamos fetch por consultas Supabase
async function getData() {
  try {
    const [productsRes, salesRes, loansRes, clientsRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("sales").select("*"),
      supabase.from("loans").select("*"),
      supabase.from("clients").select("*"),
    ]);

    // Manejo de errores
    if (productsRes.error || salesRes.error || loansRes.error || clientsRes.error) {
      throw new Error(
        `Supabase error: ${productsRes.error?.message || ""} 
        ${salesRes.error?.message || ""} 
        ${loansRes.error?.message || ""} 
        ${clientsRes.error?.message || ""}`
      );
    }

    return {
      products: (productsRes.data as Product[]) ?? [],
      sales: (salesRes.data as Sale[]) ?? [],
      loans: (loansRes.data as Loan[]) ?? [],
      clients: (clientsRes.data as Client[]) ?? [],
    };
  } catch (error) {
    console.error("Error fetching finance data:", error);
    return { products: [], sales: [], loans: [], clients: [] };
  }
}

export default async function FinancePage() {
  const { products, sales, loans, clients } = await getData();

  return (
    <MainLayout>
      <Tabs defaultValue="pos" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pos">Finanzas de POS/Inventario</TabsTrigger>
          <TabsTrigger value="loans">Finanzas de Préstamos</TabsTrigger>
        </TabsList>
        <TabsContent value="pos">
          <FinanceDashboard sales={sales} products={products} />
        </TabsContent>
        <TabsContent value="loans">
          <LoansFinanceDashboard loans={loans} clients={clients} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
