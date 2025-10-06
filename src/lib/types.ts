// =========================
// 📦 PRODUCTOS
// =========================
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

// =========================
// 🧾 DETALLES DE VENTA
// =========================
export type SaleDetail = {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  price: number;
};

// =========================
// 💰 VENTAS
// =========================
export type Sale = {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
  items: SaleDetail[];
};

// =========================
// 👤 CLIENTES
// =========================
export type Client = {
  id: string;       // UUID generado por Supabase
  name: string;
  email: string;
  phone: string;
  loans?: Loan[];   // Relación 1:N con préstamos
};

// =========================
// 🧮 CUOTAS (loan_installments)
// =========================
export type InstallmentStatus =
  | 'Pendiente'
  | 'Pagado'
  | 'Parcial'
  | 'Atrasado';

export type Installment = {
  id: number;                     // SERIAL
  loan_id?: string;               // FK a loans.id
  installmentNumber: number;      // corresponde a installment_number
  dueDate: string;                // due_date (fecha límite)
  principal_amount: number;       // principal_amount
  interest_amount: number;        // interest_amount
  paidAmount: number;             // paid_amount
  lateFee: number;                // late_fee
  status: InstallmentStatus;      // estado de la cuota
  paymentDate?: string | null;    // payment_date opcional
};

// =========================
// 💳 PRÉSTAMOS (loans)
// =========================
export type LoanStatus =
  | 'Pendiente'
  | 'Aprobado'
  | 'Pagado'
  | 'Cancelado';

export type Loan = {
  id: string;                     // uuid
  loanNumber: string;             // loan_number
  client_id: string | null;       // FK a clients.id
  client_name?: string;           // nombre del cliente para UI

  // Fechas
  loanDate: string;               // fecha de creación del préstamo
  startDate?: string;             // start_date (inicio real)
  dueDate: string | null;         // due_date (fecha final del préstamo)

  // Datos financieros
  principal: number;
  interestRate: number;           // interest_rate (anual %)
  amount: number;                 // monto solicitado
  amountToPay: number;            // total a pagar
  amountApplied: number;          // total abonado
  overdueAmount: number;          // monto vencido
  lateFee: number;                // mora acumulada
  change?: number;                // cambio devuelto
  totalPending: number;           // saldo total pendiente

  // Cuotas
  installments: Installment[];

  // Extras para interfaz
  loanType?: string;              // tipo (Mensual, Quincenal...)
  invoiceNumber?: string;         // factura asociada
  cashier?: string;               // cajero
  status?: LoanStatus;            // estado del préstamo
};

// =========================
// 👥 ROLES Y USUARIOS
// =========================
export type Role = 'admin' | 'cashier' | 'employee' | 'user';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
};
