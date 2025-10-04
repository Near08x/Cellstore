export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  price2: number;
  price3: number;
  cost: number;
  provider: string;
  stock: number;
};

export type SaleDetail = {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  price: number;
};

export type Sale = {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
  items: SaleDetail[];
};

export type Client = {
  id: string;       // ✅ obligatorio, porque Supabase siempre devuelve un id
  name: string;
  email: string;
  phone: string;
};

export type Installment = {
  id: string;
  installmentNumber: number;
  principal_amount: number;
  interest_amount: number;
  paidAmount: number;
  lateFee: number;
  dueDate: string;
  paymentDate?: string;   // ✅ opcional para cuando ya se pagó
  status: 'Pagado' | 'Pendiente' | 'Atrasado' | 'Parcial';
};

export type LoanStatus = 'Pendiente' | 'Aprobado' | 'Pagado' | 'Cancelado';

export type Loan = {
  id: string;
  loanNumber: string;

  // Fechas
  loanDate: string;     // fecha de creación del préstamo
  startDate?: string;   // ✅ fecha de inicio real del préstamo
  dueDate?: string;     // ✅ fecha límite final del préstamo

  // Relación con cliente
  client_id: string | null;   // viene de client_id en la tabla loans
  customerName: string;        // se muestra en UI

  // Datos financieros
  principal: number;
  interestRate: number;
  amount: number;
  amountToPay: number;
  amountApplied: number;
  overdueAmount: number;
  lateFee: number;
  change?: number;
  totalPending: number;

  // Cuotas
  installments: Installment[];

  // ✅ Nuevos campos para resolver errores
  loanType?: string;             // tipo de préstamo (ej. "Quincenal", "Mensual")
  invoiceNumber?: string;        // número de factura asociado
  cashier?: string;              // cajero que registró el préstamo
  status?: LoanStatus;           // estado actual del préstamo
};

export type Role = 'admin' | 'cashier';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
};
