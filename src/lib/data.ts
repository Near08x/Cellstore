import type { Product, Sale, Loan, Client } from './types';

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Galaxy S24 Ultra',
    description: 'The ultimate Android experience with AI features.',
    price: 1299.99,
    price2: 1250.0,
    price3: 1200.0,
    cost: 950.0,
    provider: 'Samsung Electronics',
    stock: 15,
  },
  {
    id: 'p2',
    name: 'iPhone 15 Pro',
    description: 'The latest premium smartphone with a powerful camera system.',
    price: 999.99,
    price2: 950.0,
    price3: 900.0,
    cost: 750.0,
    provider: 'Apple Inc.',
    stock: 25,
  },
  {
    id: 'p3',
    name: 'Pixel 8 Pro',
    description: "Google's flagship phone with an exceptional camera.",
    price: 899.0,
    price2: 850.0,
    price3: 800.0,
    cost: 650.0,
    provider: 'Google LLC',
    stock: 8,
  },
  {
    id: 'p4',
    name: 'OnePlus 12',
    description: 'A performance-focused phone with fast charging.',
    price: 799.0,
    price2: 750.0,
    price3: 700.0,
    cost: 550.0,
    provider: 'OnePlus',
    stock: 12,
  },
  {
    id: 'p5',
    name: 'Galaxy Z Fold 5',
    description: 'A foldable smartphone that opens up into a small tablet.',
    price: 1799.99,
    price2: 1750.0,
    price3: 1700.0,
    cost: 1400.0,
    provider: 'Samsung Electronics',
    stock: 5,
  },
  {
    id: 'p6',
    name: 'iPhone SE',
    description: 'A compact and affordable smartphone with powerful internals.',
    price: 429.0,
    price2: 400.0,
    price3: 380.0,
    cost: 300.0,
    provider: 'Apple Inc.',
    stock: 30,
  },
  {
    id: 'p7',
    name: 'Nothing Phone (2)',
    description: 'A smartphone with a unique transparent design and light interface.',
    price: 599.0,
    price2: 550.0,
    price3: 520.0,
    cost: 450.0,
    provider: 'Nothing Technology',
    stock: 18,
  },
  {
    id: 'p8',
    name: 'Xiaomi 14',
    description: 'A flagship phone with Leica co-engineered cameras.',
    price: 949.0,
    price2: 900.0,
    price3: 850.0,
    cost: 700.0,
    provider: 'Xiaomi Corp',
    stock: 0,
  },
];

export const sales: Sale[] = [
  {
    id: 'sale1',
    customerName: 'Olivia Martin',
    customerEmail: 'olivia.martin@email.com',
    subtotal: 1299.99,
    amount: 1299.99,
    tax: Number((1299.99 - (1299.99 / 1.18)).toFixed(2)),
    date: '2024-05-23',
    items: [{ productId: 'p1', quantity: 1, unitPrice: 1299.99, price: 1299.99, total: 1299.99 }],
  },
  {
    id: 'sale2',
    customerName: 'Jackson Lee',
    customerEmail: 'jackson.lee@email.com',
    subtotal: 999.99,
    amount: 999.99,
    tax: Number((999.99 - (999.99 / 1.18)).toFixed(2)),
    date: '2024-05-15',
    items: [{ productId: 'p2', quantity: 1, unitPrice: 999.99, price: 999.99, total: 999.99 }],
  },
  {
    id: 'sale3',
    customerName: 'Isabella Nguyen',
    customerEmail: 'isabella.nguyen@email.com',
    subtotal: 429.0,
    amount: 429.0,
    tax: Number((429.0 - (429.0 / 1.18)).toFixed(2)),
    date: '2024-05-05',
    items: [{ productId: 'p6', quantity: 1, unitPrice: 429.0, price: 429.0, total: 429.0 }],
  },
  {
    id: 'sale4',
    customerName: 'William Kim',
    customerEmail: 'will@email.com',
    subtotal: 1799.99,
    amount: 1799.99,
    tax: Number((1799.99 - (1799.99 / 1.18)).toFixed(2)),
    date: '2024-04-28',
    items: [{ productId: 'p5', quantity: 1, unitPrice: 1799.99, price: 1799.99, total: 1799.99 }],
  },
  {
    id: 'sale5',
    customerName: 'Sofia Davis',
    customerEmail: 'sofia.davis@email.com',
    subtotal: 1798.0,
    amount: 1798.0,
    tax: Number((1798.0 - (1798.0 / 1.18)).toFixed(2)),
    date: '2024-04-12',
    items: [{ productId: 'p3', quantity: 2, unitPrice: 899.0, price: 899.0, total: 1798.0 }],
  },
  {
    id: 'sale6',
    customerName: 'Olivia Martin',
    customerEmail: 'olivia.martin@email.com',
    subtotal: 1428.99,
    amount: 1428.99,
    tax: Number((1428.99 - (1428.99 / 1.18)).toFixed(2)),
    date: '2024-04-28',
    items: [
      { productId: 'p2', quantity: 1, unitPrice: 999.99, price: 999.99, total: 999.99 },
      { productId: 'p6', quantity: 1, unitPrice: 429.0, price: 429.0, total: 429.0 },
    ],
  },
];

export const clients: Client[] = [
  ...new Map(
    sales.map((sale) => [
      sale.customerEmail,
      { id: sale.customerEmail, name: sale.customerName, email: sale.customerEmail, phone: '555-0101' },
    ])
  ).values(),
  { id: 'liam.j@email.com', name: 'Liam Johnson', email: 'liam.j@email.com', phone: '555-0102' },
  { id: 'ava.b@email.com', name: 'Ava Brown', email: 'ava.b@email.com', phone: '555-0103' },
];

const generateLoan = (id: string, customerName: string, amount: number, date: string, term: number, interestRate: number, type: 'simple' | 'amortization', status: 'paid' | 'late' | 'current'): Loan => {
  const loanNumber = `LP00${id}`;
  const installments: any[] = [];
  let principal = amount;
  let amountToPay = 0;
  let amountApplied = 0;

  if (type === 'amortization') {
    const ratePerPeriod = (interestRate / 100) / 12;
    const installmentAmount = (principal * ratePerPeriod * Math.pow(1 + ratePerPeriod, term)) / (Math.pow(1 + ratePerPeriod, term) - 1);
    let remainingBalance = principal;
    for (let i = 1; i <= term; i++) {
      const interest = remainingBalance * ratePerPeriod;
      const principalPayment = installmentAmount - interest;
      remainingBalance -= principalPayment;
      const dueDate = new Date(date);
      dueDate.setMonth(dueDate.getMonth() + i);
      amountToPay += principalPayment + interest;
      const isPaid = status === 'paid' || (status === 'current' && i < term / 2);
      if(isPaid) amountApplied += principalPayment + interest;
      const dueISO = dueDate.toISOString().split('T')[0];
      installments.push({
        id: i,
        installmentNumber: i,
        principal_amount: principalPayment,
        interest_amount: interest,
        paidAmount: isPaid ? principalPayment + interest : 0,
        payment_date: isPaid ? dueISO : null,
        status: isPaid ? 'Pagado' : 'Pendiente',
        lateFee: 0,
        due_date: dueISO,
        dueDate: dueISO,
      });
    }
  } else { // simple
    const totalInterest = principal * (interestRate / 100 / 12) * term;
    amountToPay = principal + totalInterest;
    for (let i = 1; i <= term; i++) {
      const principalPayment = principal / term;
      const interestPayment = totalInterest / term;
      const dueDate = new Date(date);
      dueDate.setMonth(dueDate.getMonth() + i);
      const isPaid = status === 'paid' || (status === 'current' && i < term / 2);
      if(isPaid) amountApplied += principalPayment + interestPayment;

      const dueISO = dueDate.toISOString().split('T')[0];
      installments.push({
        id: i,
        installmentNumber: i,
        principal_amount: principalPayment,
        interest_amount: interestPayment,
        paidAmount: isPaid ? principalPayment + interestPayment : 0,
        payment_date: isPaid ? dueISO : null,
        status: isPaid ? 'Pagado' : 'Pendiente',
        lateFee: 0,
        due_date: dueISO,
        dueDate: dueISO,
      });
    }
  }
  
  // Make one late if applicable
  if (status === 'late') {
    const lateInstallment = installments.find(i => i.status === 'Pendiente');
    if (lateInstallment) {
      lateInstallment.status = 'Atrasado';
      lateInstallment.lateFee = (lateInstallment.principal + lateInstallment.interest) * 0.04;
    }
  }

  const totalPending = amountToPay - amountApplied + (installments.reduce((acc, i) => acc + i.lateFee, 0));


  return {
    id: `loan${id}`,
    loanNumber,
    invoiceNumber: `INV-${id}`,
    loanDate: date,
    startDate: date,
    start_date: date,
    dueDate: installments[installments.length - 1].dueDate,
    due_date: installments[installments.length - 1].due_date,
    client_name: customerName,
    customerName,
    principal: amount,
    amount: amount,
    interestRate,
    loanTerm: term,
    loanType: type,
    cashier: 'Admin',
    amountToPay,
    amountApplied,
    overdueAmount: status === 'late' ? installments.find(i => i.status === 'Atrasado')?.principal_amount || 0 : 0,
    lateFee: installments.reduce((acc, i) => acc + (i.lateFee || 0), 0),
    change: 0,
    totalPending,
    installments,
    paymentType: type === 'simple' ? 'Simple' : 'Amortización',
    status: status === 'paid' ? 'Pagado' : status === 'late' ? 'Pendiente' : 'Pendiente'
  };
};

export const loans: Loan[] = [
  generateLoan('1', 'Olivia Martin', 500, '2024-01-15', 6, 24, 'amortization', 'current'),
  generateLoan('2', 'Jackson Lee', 1200, '2024-02-01', 12, 18, 'simple', 'late'),
  generateLoan('3', 'Isabella Nguyen', 800, '2023-11-20', 8, 20, 'amortization', 'paid'),
  generateLoan('4', 'William Kim', 2500, '2024-03-10', 24, 15, 'amortization', 'current'),
  generateLoan('5', 'Sofia Davis', 300, '2024-04-05', 4, 36, 'simple', 'current'),
  generateLoan('6', 'Liam Johnson', 1500, '2023-09-01', 18, 22, 'amortization', 'paid'),
  generateLoan('7', 'Ava Brown', 650, '2024-05-01', 6, 25, 'simple', 'late'),
];
