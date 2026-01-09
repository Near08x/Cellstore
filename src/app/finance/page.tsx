import MainLayout from '@/components/main-layout';
import dynamic from 'next/dynamic';
import type { Product, Sale, Loan, Client } from '@/lib/types';
// Use the server-side Supabase client when fetching data in a server component
import { supabase as supabaseServer } from '@/lib/supabaseServer';

// Lazy load FinanceDashboard para reducir el bundle inicial
// Este componente contiene Recharts que es muy pesado (~247 kB)
const FinanceDashboard = dynamic(
  () => import('@/components/finance/finance-dashboard'),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Cargando dashboard...</div>
      </div>
    ),
  }
);

async function getData() {
  try {
    const [productsRes, salesRes, loansRes, clientsRes] = await Promise.all([
      supabaseServer.from('products').select('*'),
      supabaseServer.from('sales').select(`
        *,
        sale_items (
          id,
          product_id,
          quantity,
          unit_price
        )
      `),
      supabaseServer.from('loans').select(`
        *,
        loan_installments (*),
        clients (
          id,
          name,
          email,
          phone
        )
      `),
      supabaseServer.from('clients').select('*'),
    ]);

    if (productsRes.error || salesRes.error || loansRes.error || clientsRes.error) {
      throw new Error(
        `Supabase error: ${productsRes.error?.message || ''} ${salesRes.error?.message || ''} ${loansRes.error?.message || ''} ${clientsRes.error?.message || ''}`
      );
    }

    // Normalize product rows (they usually match Product)
    const products = (productsRes.data as Product[]) ?? [];

    // Normalize sales rows into the frontend `Sale` shape.
  const normalizeSale = (row: any) => {
      // items vienen de la relación sale_items
      let rawItems: any[] = [];
      if (Array.isArray(row.sale_items)) {
        rawItems = row.sale_items;
      } else if (Array.isArray(row.items)) {
        rawItems = row.items;
      } else if (typeof row.items === 'string') {
        try {
          rawItems = JSON.parse(row.items);
        } catch {
          rawItems = [];
        }
      } else if (row.items == null && row.sale_items == null) {
        rawItems = [];
      }

      const items = rawItems.map((it: any) => {
        const productId = String(it.product_id ?? it.productId ?? it.id ?? it.product);
        const quantity = Number(it.quantity ?? it.qty ?? 0);
        const unitPrice = Number(it.unit_price ?? it.unitPrice ?? it.price ?? it.unit ?? 0);
        const total = Number(it.total ?? it.total_price ?? unitPrice * quantity);
        const price = Number(it.price ?? unitPrice);
        return {
          productId,
          quantity,
          unitPrice,
          total,
          price,
        } as any;
      });

      const computedAmount = items.reduce((s: number, i: any) => s + (i.total || 0), 0);
      const amount = Number(row.amount ?? row.total ?? computedAmount);
      const subtotal = Number(row.subtotal ?? amount);
      const tax = Number(row.tax ?? 0);

      return {
        id: String(row.id ?? row.sale_id ?? row._id ?? ''),
        customerName: row.customer_name ?? row.customerName ?? row.customer ?? '',
        customerEmail: row.customer_email ?? row.customerEmail ?? row.customerEmail ?? '',
        subtotal,
        amount,
        tax,
        date: String(row.created_at ?? row.date ?? row.sale_date ?? new Date().toISOString()),
        items,
      } as Sale;
    };

    const sales = (salesRes.data ?? []).map(normalizeSale) as Sale[];
    
    // Normalize loans data
    const normalizeLoan = (row: any): Loan => {
      const installments = Array.isArray(row.loan_installments) 
        ? row.loan_installments 
        : [];
      
      // Obtener el nombre del cliente del JOIN
      const clientName = row.clients?.name || row.client_name || row.customerName || '';
      
      return {
        id: row.id,
        loanNumber: row.loan_number || row.loanNumber || '',
        client_id: row.client_id,
        client_name: clientName,
        customerName: clientName,
        loanDate: row.loan_date || row.loanDate || row.created_at || new Date().toISOString(),
        start_date: row.start_date,
        startDate: row.start_date,
        due_date: row.due_date,
        dueDate: row.due_date,
        principal: Number(row.principal || 0),
        interestRate: Number(row.interest_rate || row.interestRate || 0),
        amount: Number(row.amount || 0),
        amountToPay: Number(row.amount_to_pay || row.amountToPay || 0),
        amountApplied: Number(row.amount_applied || row.amountApplied || 0),
        overdueAmount: Number(row.overdue_amount || row.overdueAmount || 0),
        lateFee: Number(row.late_fee || row.lateFee || 0),
        totalPending: Number(row.total_pending || row.totalPending || 0),
        installments: installments,
        status: row.status || 'Pendiente',
      };
    };

    const loans = (loansRes.data ?? []).map(normalizeLoan);
    const clients = (clientsRes.data as Client[]) ?? [];

    return { products, sales, loans, clients };
  } catch (error) {
    console.error('Error fetching finance data:', error);
    return { products: [], sales: [], loans: [], clients: [] };
  }
}

export default async function FinancePage() {
  const { products, sales, loans, clients } = await getData();

  return (
    <MainLayout>
      <FinanceDashboard sales={sales} products={products} loans={loans} clients={clients} />
    </MainLayout>
  );
}



