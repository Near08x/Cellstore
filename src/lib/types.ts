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
  id?: string;
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
  date: string;
  status: 'Pagado' | 'Pendiente' | 'Atrasado' | 'Parcial';
  lateFee: number;
  dueDate: string;
};

export type Loan = {
  id: string;
  loanNumber: string;
  paymentType: 'mensual' | 'quincenal' | 'semanal' | 'diario';
  invoiceNumber: string;
  loanDate: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  interestRate: number;
  loanTerm: number;
  loanType: 'simple' | 'amortization';
  cashier: string;
  amountToPay: number;
  amountApplied: number;
  overdueAmount: number;
  lateFee: number;
  change: number;
  totalPending: number;
  installments: Installment[];
};

export type Role = 'admin' | 'cashier';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
};
