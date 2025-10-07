'use client';
import type { Loan, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  MoreHorizontal,
  PlusCircle,
  Edit,
  Search,
  User,
  X,
  Printer,
  CreditCard,
  Landmark,
  Wallet,
  Coins,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../ui/dialog';
import NewLoanForm from './new-loan-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useEffect, useState, useMemo, useRef } from 'react';
import EditLoanForm from './edit-loan-form';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { Badge } from '../ui/badge';
import LoanPaymentCardWithPrint from './loan-payment-card';
import PaymentReceiptWithPrint from './payment-receipt';
import { isPast } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';
import PayLoanModal from './pay-loan-modal';

type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';

export default function LoansClient({
  loans: initialLoans,
  clients: initialClients,
}: {
  loans: Loan[];
  clients: Client[];
}) {
  const { role } = useAuth();
  const { toast } = useToast();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loanToPrint, setLoanToPrint] = useState<Loan | null>(null);
  
  // 🔹 Estados locales
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
  const [clients, setClients] = useState<Client[]>(initialClients);

  const [isNewLoanOpen, setNewLoanOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [totalCapital, setTotalCapital] = useState(100000);
  const [isEditCapitalOpen, setEditCapitalOpen] = useState(false);
  const [newCapital, setNewCapital] = useState(100000);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [isPayModalOpen, setPayModalOpen] = useState(false);
  const [loanToPay, setLoanToPay] = useState<Loan | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [applyOverpaymentToPrincipal, setApplyOverpaymentToPrincipal] =
    useState(false);

  const [loanForCard, setLoanForCard] = useState<Loan | null>(null);
  const [receiptDetails, setReceiptDetails] = useState<{
    loan: Loan;
    amountPaid: number;
    change: number;
    principalApplied: number;
  } | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // ✅ FIXED: fetch estándar sin NEXT_PUBLIC_API_URL (usa rutas internas)
  useEffect(() => {
  const fetchLoansAndClients = async () => {
    try {
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

      const res = await fetch(`${baseUrl}/api/loans`, { cache: 'no-store' });
      const data = await res.json();

        if (res.ok) {
          setLoans(Array.isArray(data?.loans) ? data.loans : []);
          setClients(Array.isArray(data?.clients) ? data.clients : []);
        } else {
          setLoans([]);
          setClients([]);
          toast({
            title: 'Error',
            description: 'No se pudieron cargar préstamos/clientes',
            variant: 'destructive',
          });
        }
      } catch (err) {
        console.error('Error fetching loans and clients:', err);
        setLoans([]);
        setClients([]);
        toast({
          title: 'Error',
          description: 'Fallo al conectar con la API',
          variant: 'destructive',
        });
      }
    };

    if (!initialLoans?.length || !initialClients?.length) {
      fetchLoansAndClients();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => {
    window.print();
  };

  const dueAmount = useMemo(() => {
    if (!loanToPay) return 0;
    const pendingInstallment = loanToPay.installments.find(
      (i) =>
        i.status === 'Pendiente' ||
        i.status === 'Parcial' ||
        i.status === 'Atrasado'
    );
    if (pendingInstallment) {
      return (
        (pendingInstallment.principal_amount ?? 0) +
        (pendingInstallment.interest_amount ?? 0) -
        (pendingInstallment.paidAmount ?? 0) +
        (pendingInstallment.lateFee ?? 0)
      );
    }
    return loanToPay.totalPending ?? 0;
  }, [loanToPay]);

  const change = paymentAmount - dueAmount;

  useEffect(() => {
    if (loanToPay) {
      setPaymentAmount(dueAmount);
    }
  }, [loanToPay, dueAmount]);

  const lentCapital = (Array.isArray(loans) ? loans : []).reduce(
    (acc, loan) => acc + (loan?.amount ?? 0),
    0
  );
  const availableCapital = totalCapital - lentCapital;

// 🔹 Crear préstamo (con refresco y apertura automática)
const handleAddLoan = async (newLoanData: Omit<Loan, 'id'>) => {
  try {
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoanData),
    });

    const data = await res.json();
    if (!res.ok)
      throw new Error(data.message || data.error || 'Error creando préstamo');

    // ✅ 1. Agregar el nuevo préstamo al estado global
    setLoans((prev) => [data, ...prev]);

    // ✅ 2. Si pertenece al cliente seleccionado, refresca su lista
    if (selectedClient && data.clientId === selectedClient.id) {
      const baseUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

      const resLoans = await fetch(`${baseUrl}/api/loans`, { cache: 'no-store' });
      const jsonLoans = await resLoans.json();

      if (resLoans.ok && Array.isArray(jsonLoans?.loans)) {
        const filtered = jsonLoans.loans.filter(
          (loan: Loan) => loan.client_id === selectedClient.id
        );
        setClientLoans(filtered);

        // 🔄 Forzar re-render del cliente actual
        setSelectedClient({
          ...selectedClient,
          lastUpdatedAt: Date.now(),
        } as Client);
      }
    }

    // ✅ 3. Cerrar modal
    setNewLoanOpen(false);

    // ✅ 4. Mostrar toast confirmando
    toast({
      title: 'Éxito',
      description: `Préstamo ${data.loanNumber} añadido correctamente.`,
    });

    // ✅ 5. Esperar un poco y abrir automáticamente el préstamo recién creado
    setTimeout(() => {
      const element = document.querySelector(`[data-state][value="${data.id}"]`);
      if (element) {
        (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        const trigger = element.querySelector('button');
        if (trigger) trigger.click();
      }
    }, 600);
  } catch (error) {
    console.error('❌ Error en handleAddLoan:', error);
    toast({
      title: 'Error',
      description: 'No se pudo añadir el préstamo.',
      variant: 'destructive',
    });
  }
};




// 🔹 Preparar edición de préstamo
const handleEditLoan = (loan: Loan) => {
  setEditingLoan(loan);
};

  // 🔹 Actualizar préstamo
  const handleUpdateLoan = async (updatedLoanData: Loan) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLoanData),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || 'Error actualizando préstamo');

      setLoans((prev) =>
        prev.map((l) => (l.id === updatedLoanData.id ? data : l))
      );
      setEditingLoan(null);

      toast({
        title: 'Éxito',
        description: 'Préstamo actualizado correctamente.',
      });
    } catch (error) {
      console.error('❌ Error en handleUpdateLoan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el préstamo.',
        variant: 'destructive',
      });
    }
  };

  // 🔹 Eliminar préstamo
  const handleDeleteLoan = async (loanId: string) => {
    try {
      const res = await fetch('/api/loans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loanId }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || data.error || 'Error eliminando préstamo');

      setLoans((prev) => prev.filter((loan) => loan.id !== loanId));

      toast({
        title: 'Éxito',
        description: 'Préstamo eliminado correctamente.',
      });
    } catch (error) {
      console.error('❌ Error en handleDeleteLoan:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el préstamo.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCapital = async () => {
    setTotalCapital(newCapital);
    setEditCapitalOpen(false);
    toast({
      title: 'Éxito (Simulado)',
      description: 'Capital actualizado correctamente.',
    });
  };

  // ✅ FIXED: reemplazamos parseISO + UTC drift
  const updateLoanWithLateFees = (loan: Loan): Loan => {
    let totalLateFee = 0;
    const updatedInstallments = loan.installments.map((inst) => {
      let isOverdue = false;
      if (inst?.dueDate) {
        const dueDateObj = new Date(inst.dueDate); // ✅ FIXED
        if (!isNaN(dueDateObj.getTime())) {
          isOverdue = isPast(dueDateObj) && inst.status !== 'Pagado';
        } else {
          console.warn('Fecha inválida en cuota:', inst.dueDate);
        }
      }

      let newLateFee = inst.lateFee ?? 0;
      let newStatus = inst.status;

      if (
        isOverdue &&
        inst.status !== 'Atrasado' &&
        inst.status !== 'Parcial' &&
        (inst.paidAmount ?? 0) === 0
      ) {
        const installmentAmount =
          (inst.principal_amount ?? 0) + (inst.interest_amount ?? 0);
        newLateFee += installmentAmount * 0.04;
        newStatus = 'Atrasado';
      }

      totalLateFee += newLateFee;

      return {
        ...inst,
        lateFee: newLateFee,
        status: newStatus,
      };
    });

    const overdueAmount = updatedInstallments
      .filter((inst) => inst.status === 'Atrasado')
      .reduce(
        (acc, inst) =>
          acc +
          ((inst.principal_amount ?? 0) +
            (inst.interest_amount ?? 0) -
            (inst.paidAmount ?? 0)),
        0
      );

    const totalPending =
      (loan.amountToPay ?? 0) - (loan.amountApplied ?? 0) + totalLateFee;

    return {
      ...loan,
      installments: updatedInstallments,
      lateFee: totalLateFee,
      overdueAmount,
      totalPending,
    };
  };

  // 🔹 Seleccionar cliente
  const handleSelectClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setLoans((prevLoans) =>
        prevLoans.map((loan) => {
          if (loan.client_id === client.id) {
            return updateLoanWithLateFees(loan);
          }
          return loan;
        })
      );
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
    setClientSearch('');
  };

  const handleOpenPayModal = (loan: Loan) => {
    setLoanToPay(loan);
    setPayModalOpen(true);
  };

  // 🔹 Procesar pago
  const handleProcessPayment = async () => {
    if (!loanToPay || paymentAmount <= 0) return;
    try {
      const res = await fetch('/api/loans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanId: loanToPay.id,
          installmentId: loanToPay.installments.find(
            (i) =>
              i.status === 'Pendiente' ||
              i.status === 'Parcial' ||
              i.status === 'Atrasado'
          )?.id,
          amountPaid: paymentAmount,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error procesando pago');

      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === loanToPay.id
            ? {
                ...loan,
                totalPending: data.totalPending,
                installments: loan.installments.map((inst) =>
                  inst.id === data.installment.id ? data.installment : inst
                ),
              }
            : loan
        )
      );

      setReceiptDetails({
        loan: { ...loanToPay, totalPending: data.totalPending },
        amountPaid: paymentAmount,
        change: data.change || 0,
        principalApplied: data.principalApplied || 0,
      });

      setPayModalOpen(false);
      setLoanToPay(null);
      setPaymentAmount(0);
      setPaymentMethod('cash');
      setApplyOverpaymentToPrincipal(false);

      toast({
        title: 'Éxito',
        description: 'Pago procesado correctamente.',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar el pago.',
        variant: 'destructive',
      });
    }
  };

  // ✅ FIXED: corregido filtro (usa client_id)
  // ✅ recalcula cada vez que loans o selectedClient cambian
const [clientLoans, setClientLoans] = useState<Loan[]>([]);

useEffect(() => {
  if (selectedClient) {
    const filtered = loans.filter((loan) => loan.client_id === selectedClient.id);
    setClientLoans(filtered);
  } else {
    setClientLoans([]);
  }
}, [loans, selectedClient]);

    
  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (c.email?.toLowerCase() ?? '').includes(clientSearch.toLowerCase())
      )
    : [];

  return (
    <div className="space-y-6">
      {role === 'admin' && (
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center no-print">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2 text-center text-sm">
              <div className="flex h-16 min-w-[120px] flex-col justify-center rounded-lg border bg-card p-2 text-center">
                <h3 className="font-medium text-muted-foreground">
                  Capital Total
                </h3>
                <p className="text-lg font-bold">
                  {`$${totalCapital.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </p>
              </div>

              <div className="flex h-16 min-w-[120px] flex-col justify-center rounded-lg border bg-card p-2 text-center text-destructive">
                <h3 className="font-medium text-muted-foreground">
                  Capital Prestado
                </h3>
                <p className="text-lg font-bold">
                  {`$${lentCapital.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </p>
              </div>
              <div className="flex h-16 min-w-[120px] flex-col justify-center rounded-lg border bg-card p-2 text-center text-green-600">
                <h3 className="font-medium text-muted-foreground">
                  Capital Disp.
                </h3>
                <p className="text-lg font-bold">
                  {`$${availableCapital.toLocaleString('es-ES', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </p>
              </div>
            </div>
            <Dialog open={isEditCapitalOpen} onOpenChange={setEditCapitalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-full self-stretch">
                  <Edit className="mr-2 h-4 w-4" />
                  Modificar Capital
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Modificar Capital Total</DialogTitle>
                  <DialogDescription>
                    Actualiza el capital total disponible para operar.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="capital" className="text-right">
                      Capital
                    </Label>
                    <Input
                      id="capital"
                      type="number"
                      value={newCapital}
                      onChange={(e) => setNewCapital(Number(e.target.value))}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleUpdateCapital}>Guardar Cambios</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      {/* ======================== */}
      {/* CLIENTE Y NUEVO PRÉSTAMO */}
      {/* ======================== */}
      <Card className="no-print">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar o seleccionar un cliente..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="pl-8"
                />
                {filteredClients.length > 0 && (
                  <Card className="absolute top-full z-10 mt-1 w-full">
                    <CardContent className="p-2">
                      {filteredClients.map((client) => (
                        <div
                          key={client.id}
                          onClick={() => handleSelectClient(client.id!)}
                          className="cursor-pointer rounded-md p-2 hover:bg-accent"
                        >
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {client.email}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <Select
                onValueChange={handleSelectClient}
                value={selectedClient?.id || ''}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="O selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id!}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'admin' && (
              <Dialog open={isNewLoanOpen} onOpenChange={setNewLoanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Nuevo Préstamo
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Préstamo</DialogTitle>
                  </DialogHeader>
                  <NewLoanForm
                    clients={clients}
                    onAddLoan={handleAddLoan}
                    nextLoanNumber={`LP00${loans.length + 1}`}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {selectedClient && (
            <div className="mt-4 flex items-center justify-between rounded-md border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5" />
                <div>
                  <p className="font-semibold">{selectedClient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.email}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>

        {/* ======================== */}
        {/* LISTADO DE PRÉSTAMOS */}
        {/* ======================== */}
        <CardContent>
          {!selectedClient ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <Search className="h-12 w-12" />
              <p className="mt-4">Selecciona un cliente para ver sus préstamos.</p>
            </div>
          ) : clientLoans.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <User className="h-12 w-12" />
              <p className="mt-4">Este cliente no tiene préstamos activos.</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {clientLoans.map((loan) => (
                <AccordionItem value={loan.id} key={loan.id}>
                  <AccordionTrigger>
                    <div className="flex w-full items-center justify-between pr-4">
                      <div className="text-left">
  <p className="font-semibold">{loan.loanNumber}</p>
  <p className="text-sm text-muted-foreground">
    {`$${(loan.amount ?? 0).toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} — ${
      loan.startDate
        ? new Date(loan.startDate as string).toLocaleDateString('es-DO')
        : 'Sin fecha'
    }`}
  </p>
</div>

                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          {`Pendiente: $${(loan.totalPending ?? 0).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {`Pagado: $${(loan.amountApplied ?? 0).toLocaleString('es-ES', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4 flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleOpenPayModal(loan)}>
                        Realizar Pago
                      </Button>
                      {role === 'admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEditLoan(loan)}>
                              Editar Préstamo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteLoan(loan.id)}
                            >
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* ======================== */}
                    {/* TABLA DE CUOTAS */}
                    {/* ======================== */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Fecha Límite</TableHead>
                          <TableHead>Capital</TableHead>
                          <TableHead>Intereses</TableHead>
                          <TableHead>Abonado</TableHead>
                          <TableHead>Mora</TableHead>
                          <TableHead>Estado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loan.installments.map((inst) => (
                          <TableRow key={inst.id || `${loan.id}-${inst.installmentNumber}`}>
                            <TableCell>{inst.installmentNumber}</TableCell>

                            {/* ✅ FIXED: mostrar fecha local segura */}
                            <TableCell>
                              {inst.dueDate
                                ? new Date(inst.dueDate).toLocaleDateString('es-DO')
                                : '—'}
                            </TableCell>

                            <TableCell>
                              {`$${(inst.principal_amount ?? 0).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                            </TableCell>
                            <TableCell>
                              {`$${(inst.interest_amount ?? 0).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                            </TableCell>
                            <TableCell>
                              {`$${(inst.paidAmount ?? 0).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                            </TableCell>
                            <TableCell>
                              {`$${(inst.lateFee ?? 0).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  inst.status === 'Pagado'
                                    ? 'secondary'
                                    : inst.status === 'Atrasado'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {inst.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* ======================== */}
      {/* MODAL EDITAR PRÉSTAMO */}
      {/* ======================== */}
      <Dialog open={!!editingLoan} onOpenChange={(isOpen) => !isOpen && setEditingLoan(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Préstamo</DialogTitle>
          </DialogHeader>
          {editingLoan && (
            <EditLoanForm loan={editingLoan} clients={clients} onUpdateLoan={handleUpdateLoan} />
          )}
        </DialogContent>
      </Dialog>

{/* ======================== */}
{/* NUEVO MODAL DE PAGO (PayLoanModal) */}
{/* ======================== */}
<PayLoanModal
  open={isPayModalOpen}
  onClose={() => {
    setPayModalOpen(false);
    setLoanToPay(null);
  }}
  loan={loanToPay}
  onPaymentSuccess={async (updatedLoan: Loan) => {
    try {
      if (!updatedLoan || !updatedLoan.id) {
        console.warn('⚠️ No se recibió un préstamo actualizado válido:', updatedLoan);
        return;
      }

      // ✅ 1. Actualiza el préstamo en memoria
      setLoans((prev) =>
        prev.map((loan) =>
          loan.id === updatedLoan.id ? { ...loan, ...updatedLoan } : loan
        )
      );

      // ✅ 2. Si pertenece al cliente seleccionado, fuerza refresco visual
      if (selectedClient && updatedLoan.client_id === selectedClient.id) {
        setSelectedClient({
          ...selectedClient,
          lastUpdatedAt: Date.now(),
        } as Client);

        // 🔄 3. Fetch rápido para recargar los préstamos del cliente
        const baseUrl =
          typeof window !== 'undefined'
            ? window.location.origin
            : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:9002';

        const res = await fetch(`${baseUrl}/api/loans`, { cache: 'no-store' });
        const data = await res.json();

        if (res.ok && Array.isArray(data?.loans)) {
          const filtered = data.loans.filter(
            (loan: Loan) => loan.client_id === selectedClient.id
          );
          setClientLoans(filtered);
        } else {
          console.warn('⚠️ No se pudieron recargar los préstamos del cliente');
        }
      }

      // ✅ 4. Cierra el modal
      setLoanToPay(null);
      setPayModalOpen(false);

      // ✅ 5. Feedback visual
      toast({
        title: 'Pago procesado',
        description: `El pago del préstamo ${updatedLoan.loanNumber} fue registrado correctamente.`,
      });
    } catch (error) {
      console.error('❌ Error refrescando préstamos tras el pago:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la lista de préstamos.',
        variant: 'destructive',
      });
    }
  }}
/>


      {/* ======================== */}
      {/* ÁREA IMPRIMIBLE */}
      {/* ======================== */}
      <div className="printable-area absolute left-0 top-0 -z-10 h-0 w-0 overflow-hidden">
        {loanToPrint && <LoanPaymentCardWithPrint loan={loanToPrint} />}
        {receiptDetails && <PaymentReceiptWithPrint details={receiptDetails} />}
      </div>
    </div>
  )
}
