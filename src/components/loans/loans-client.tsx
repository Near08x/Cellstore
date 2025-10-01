
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
import LoanPaymentCard from './loan-payment-card';
import PaymentReceipt from './payment-receipt';
import { isPast, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { useToast } from '@/hooks/use-toast';


type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';

export default function LoansClient({
  loans: initialLoans,
  clients,
}: {
  loans: Loan[];
  clients: Client[];
}) {
  const { role } = useAuth();
  const { toast } = useToast();
  const [loans, setLoans] = useState<Loan[]>(initialLoans);
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
  
  // useEffect(() => {
  //   const fetchCapital = async () => {
  //     try {
  //       const capitalDocRef = doc(db, 'config', 'capital');
  //       const docSnap = await getDoc(capitalDocRef);
  //       if (docSnap.exists()) {
  //         const data = docSnap.data();
  //         setTotalCapital(data.total);
  //         setNewCapital(data.total);
  //       } else {
  //           await setDoc(capitalDocRef, { total: 100000 });
  //           setTotalCapital(100000); // fallback
  //           setNewCapital(100000);
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch capital', error);
  //       setTotalCapital(100000); // fallback
  //       setNewCapital(100000);
  //     }
  //   };
  //   fetchCapital();
  // }, []);


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
        pendingInstallment.principal_amount +
        pendingInstallment.interest_amount -
        pendingInstallment.paidAmount +
        pendingInstallment.lateFee
      );
    }
    return loanToPay.totalPending;
  }, [loanToPay]);

  const change = paymentAmount - dueAmount;

  useEffect(() => {
    if (loanToPay) {
      setPaymentAmount(dueAmount);
    }
  }, [loanToPay, dueAmount]);

  const lentCapital = loans.reduce((acc, loan) => acc + loan.amount, 0);
  const availableCapital = totalCapital - lentCapital;

  const handleAddLoan = async (newLoanData: Omit<Loan, 'id'>) => {
    //  try {
    //     const { installments, ...loanDetails } = newLoanData;
    //     const batch = writeBatch(db);

    //     const loanRef = doc(collection(db, 'loans'));
    //     batch.set(loanRef, loanDetails);

    //     installments.forEach(inst => {
    //         const installmentRef = doc(collection(db, 'loans', loanRef.id, 'installments'));
    //         batch.set(installmentRef, inst);
    //     });

    //     await batch.commit();
        
    //     const newLoan = { id: loanRef.id, ...newLoanData };

    //     setLoans((prev) => [newLoan, ...prev]);
    //     setNewLoanOpen(false);
    //     setLoanForCard(newLoan);
    //     toast({ title: 'Éxito', description: 'Préstamo añadido correctamente.' });
    // } catch (error) {
    //     toast({ title: 'Error', description: 'No se pudo añadir el préstamo.', variant: 'destructive' });
    // }
    const newLoan = { id: `mock-loan-${Date.now()}`, ...newLoanData };
    setLoans((prev) => [newLoan, ...prev]);
    setNewLoanOpen(false);
    setLoanForCard(newLoan);
    toast({ title: 'Éxito (Simulado)', description: 'Préstamo añadido correctamente.' });
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoan(loan);
  };

  const handleUpdateLoan = async (updatedLoanData: Loan) => {
    // try {
    //     const { id, installments, ...loanDetails } = updatedLoanData;
    //     const batch = writeBatch(db);

    //     const loanRef = doc(db, 'loans', id);
    //     batch.update(loanRef, loanDetails);

    //     installments.forEach(inst => {
    //         const installmentRef = inst.id.startsWith('new-inst-') 
    //             ? doc(collection(db, 'loans', id, 'installments')) 
    //             : doc(db, 'loans', id, 'installments', inst.id);
    //         batch.set(installmentRef, inst, { merge: true });
    //     });

    //     await batch.commit();

    //     setLoans((prev) =>
    //         prev.map((l) => (l.id === id ? updatedLoanData : l))
    //     );
    //     setEditingLoan(null);
    //     toast({ title: 'Éxito', description: 'Préstamo actualizado correctamente.' });
    // } catch (error) {
    //     toast({ title: 'Error', description: 'No se pudo actualizar el préstamo.', variant: 'destructive' });
    // }
    setLoans((prev) => prev.map((l) => (l.id === updatedLoanData.id ? updatedLoanData : l)));
    setEditingLoan(null);
    toast({ title: 'Éxito (Simulado)', description: 'Préstamo actualizado correctamente.' });
  };

  const handleDeleteLoan = async (loanId: string) => {
    //  try {
    //     await deleteDoc(doc(db, 'loans', loanId));
    //     setLoans((prev) => prev.filter((loan) => loan.id !== loanId));
    //     toast({ title: 'Éxito', description: 'Préstamo eliminado correctamente.' });
    // } catch (error) {
    //     toast({ title: 'Error', description: 'No se pudo eliminar el préstamo.', variant: 'destructive' });
    // }
    setLoans((prev) => prev.filter((loan) => loan.id !== loanId));
    toast({ title: 'Éxito (Simulado)', description: 'Préstamo eliminado correctamente.' });
  };

  const handleUpdateCapital = async () => {
    // try {
    //   const capitalDocRef = doc(db, 'config', 'capital');
    //   await updateDoc(capitalDocRef, { total: newCapital });
    //   setTotalCapital(newCapital);
    //   setEditCapitalOpen(false);
    //   toast({ title: 'Éxito', description: 'Capital actualizado correctamente.' });
    // } catch (error) {
    //   toast({ title: 'Error', description: 'No se pudo actualizar el capital.', variant: 'destructive' });
    // }
    setTotalCapital(newCapital);
    setEditCapitalOpen(false);
    toast({ title: 'Éxito (Simulado)', description: 'Capital actualizado correctamente.' });
  };


  const updateLoanWithLateFees = (loan: Loan): Loan => {
    const today = new Date();
    let totalLateFee = 0;
    const updatedInstallments = loan.installments.map((inst) => {
      const dueDate = parseISO(inst.dueDate);
      const isOverdue = isPast(dueDate) && inst.status !== 'Pagado';
      let newLateFee = inst.lateFee;
      let newStatus = inst.status;

      if (isOverdue && inst.status !== 'Atrasado' && inst.status !== 'Parcial' && inst.paidAmount === 0) {
        const installmentAmount = inst.principal_amount + inst.interest_amount;
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
          acc + (inst.principal_amount + inst.interest_amount - inst.paidAmount),
        0
      );

    const totalPending =
      loan.amountToPay - loan.amountApplied + totalLateFee;

    return {
      ...loan,
      installments: updatedInstallments,
      lateFee: totalLateFee,
      overdueAmount,
      totalPending,
    };
  };

  const handleSelectClient = (clientEmail: string) => {
    const client = clients.find((c) => c.email === clientEmail);
    if (client) {
      setLoans((prevLoans) =>
        prevLoans.map((loan) => {
          if (loan.customerEmail === client.email) {
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

  const handleProcessPayment = () => {
    if (!loanToPay || paymentAmount <= 0) return;

    let amountToApply = paymentAmount;
    let change = 0;
    let principalAppliedFromOverpayment = 0;
    const updatedInstallments = [...loanToPay.installments];

    const installmentsToPay = updatedInstallments.filter(
      (i) => i.status === 'Pendiente' || i.status === 'Parcial' || i.status === 'Atrasado'
    );

    for (const inst of installmentsToPay) {
      if (amountToApply <= 0) break;

      // 1. Pay Late Fee
      const feeToPay = Math.min(amountToApply, inst.lateFee);
      if (feeToPay > 0) {
        inst.lateFee -= feeToPay;
        amountToApply -= feeToPay;
        inst.paidAmount += feeToPay;
      }
      
      if (amountToApply <= 0) break;

      // 2. Pay Interest
      const principalPaidSoFar = Math.max(0, inst.paidAmount - inst.interest_amount);
      const interestPaidSoFar = inst.paidAmount - principalPaidSoFar;
      const interestDue = Math.max(0, inst.interest_amount - interestPaidSoFar);

      const interestToPay = Math.min(amountToApply, interestDue);
      if (interestToPay > 0) {
        amountToApply -= interestToPay;
        inst.paidAmount += interestToPay;
      }

      if (amountToApply <= 0) break;
      
      // 3. Pay Principal
      const principalDue = inst.principal_amount - principalPaidSoFar;
      const principalToPay = Math.min(amountToApply, principalDue);
      if (principalToPay > 0) {
        amountToApply -= principalToPay;
        inst.paidAmount += principalToPay;
      }
      
      if (inst.paidAmount >= inst.principal_amount + inst.interest_amount) {
         inst.status = 'Pagado';
         inst.date = new Date().toISOString().split('T')[0];
      } else if (inst.paidAmount > 0) {
         inst.status = 'Parcial';
         inst.date = new Date().toISOString().split('T')[0];
      }
    }


    if (amountToApply > 0) {
      if (applyOverpaymentToPrincipal) {
        principalAppliedFromOverpayment = amountToApply;
        amountToApply = 0;
      } else {
        change = amountToApply;
      }
    }

    const totalPaid =
      loanToPay.amountApplied + (paymentAmount - change);

    const totalLateFees = updatedInstallments.reduce(
      (sum, inst) => sum + inst.lateFee,
      0
    );

    const totalAmountToPay = loanToPay.amountToPay - principalAppliedFromOverpayment;
    
    const updatedLoan = {
      ...loanToPay,
      installments: updatedInstallments,
      amountApplied: totalPaid,
      amountToPay: totalAmountToPay,
      totalPending:
        totalAmountToPay - totalPaid + totalLateFees,
      change: change > 0 ? change : 0,
      lateFee: totalLateFees,
    };

    handleUpdateLoan(updatedLoan);

    setReceiptDetails({
      loan: updatedLoan,
      amountPaid: paymentAmount - change,
      change,
      principalApplied: principalAppliedFromOverpayment,
    });

    setPayModalOpen(false);
    setLoanToPay(null);
    setPaymentAmount(0);
    setPaymentMethod('cash');
    setApplyOverpaymentToPrincipal(false);
  };

  const clientLoans = selectedClient
    ? loans.filter((loan) => loan.customerEmail === selectedClient.email)
    : [];

  const filteredClients = clientSearch
    ? clients.filter(
        (c) =>
          c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(clientSearch.toLowerCase())
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
                  ${totalCapital.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-16 min-w-[120px] flex-col justify-center rounded-lg border bg-card p-2 text-center text-destructive">
                <h3 className="font-medium text-muted-foreground">
                  Capital Prestado
                </h3>
                <p className="text-lg font-bold">
                  ${lentCapital.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex h-16 min-w-[120px] flex-col justify-center rounded-lg border bg-card p-2 text-center text-green-600">
                <h3 className="font-medium text-muted-foreground">
                  Capital Disp.
                </h3>
                <p className="text-lg font-bold">
                  ${availableCapital.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Dialog open={isEditCapitalOpen} onOpenChange={setEditCapitalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-full self-stretch"
                >
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
                  <Button onClick={handleUpdateCapital}>
                    Guardar Cambios
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

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
                          key={client.email}
                          onClick={() => handleSelectClient(client.email)}
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
              <Select onValueChange={handleSelectClient} value={selectedClient?.email || ''}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="O selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.email} value={c.email}>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedClient(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!selectedClient ? (
            <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
              <Search className="h-12 w-12" />
              <p className="mt-4">
                Selecciona un cliente para ver sus préstamos.
              </p>
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
                          ${loan.amount.toLocaleString('es-ES', {
                            minimumFractionDigits: 2, maximumFractionDigits: 2
                          })}{' '}
                          - {loan.loanDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">
                          Pendiente: ${loan.totalPending.toLocaleString(
                            'es-ES',
                            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pagado: ${loan.amountApplied.toLocaleString('es-ES', {
                            minimumFractionDigits: 2, maximumFractionDigits: 2
                          })}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4 flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenPayModal(loan)}
                      >
                        Realizar Pago
                      </Button>
                      {role === 'admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleEditLoan(loan)}
                            >
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
                          <TableRow key={`${loan.id}-${inst.installmentNumber}`}>
                            <TableCell>{inst.installmentNumber}</TableCell>
                            <TableCell>{inst.dueDate}</TableCell>
                            <TableCell>
                              ${inst.principal_amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell>
                              ${inst.interest_amount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell>
                              ${inst.paidAmount.toLocaleString('es-ES', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell>
                              ${inst.lateFee.toLocaleString('es-ES', {
                                minimumFractionDigits: 2, maximumFractionDigits: 2
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  inst.status === 'Pagado'
                                    ? 'secondary'
                                    : inst.status === 'Atrasado'
                                    ? 'destructive'
                                    : inst.status === 'Parcial'
                                    ? 'outline'
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

      <Dialog
        open={!!editingLoan}
        onOpenChange={(isOpen) => !isOpen && setEditingLoan(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar Préstamo</DialogTitle>
          </DialogHeader>
          {editingLoan && (
            <EditLoanForm
              loan={editingLoan}
              clients={clients}
              onUpdateLoan={handleUpdateLoan}
            />
          )}
        </DialogContent>
      </Dialog>

      {loanToPay && (
        <Dialog open={isPayModalOpen} onOpenChange={setPayModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Procesar Pago para {loanToPay.loanNumber}
              </DialogTitle>
              <DialogDescription>
                Seleccione el método de pago e ingrese el monto recibido.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Método de Pago</Label>
                <RadioGroup
                  defaultValue="cash"
                  className="grid grid-cols-2 gap-4"
                  onValueChange={(value: PaymentMethod) =>
                    setPaymentMethod(value)
                  }
                >
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem
                      value="cash"
                      id="cash"
                      className="sr-only"
                    />
                    <Wallet className="mb-3 h-6 w-6" />
                    Efectivo
                  </Label>
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem
                      value="card"
                      id="card"
                      className="sr-only"
                    />
                    <CreditCard className="mb-3 h-6 w-6" />
                    Tarjeta
                  </Label>
                  <Label
                    htmlFor="transfer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem
                      value="transfer"
                      id="transfer"
                      className="sr-only"
                    />
                    <Landmark className="mb-3 h-6 w-6" />
                    Transferencia
                  </Label>
                  <Label
                    htmlFor="mixed"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                  >
                    <RadioGroupItem
                      value="mixed"
                      id="mixed"
                      className="sr-only"
                    />
                    <Coins className="mb-3 h-6 w-6" />
                    Mixto
                  </Label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-amount">Monto Recibido</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              {change > 0 && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="apply-overpayment"
                    checked={applyOverpaymentToPrincipal}
                    onCheckedChange={setApplyOverpaymentToPrincipal}
                  />
                  <Label htmlFor="apply-overpayment">
                    Abonar ${change.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} al capital
                  </Label>
                </div>
              )}
              <Separator />
              <div className="space-y-4 text-lg">
                <div className="flex justify-between font-semibold">
                  <span>Total a Pagar (cuota actual):</span>
                  <span>
                    ${dueAmount.toLocaleString('es-ES', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })}
                  </span>
                </div>
                <div
                  className={`flex justify-between font-bold ${
                    change < 0
                      ? 'text-destructive'
                      : 'text-primary'
                  }`}
                >
                  <span>
                    {applyOverpaymentToPrincipal && change > 0
                      ? 'Abono a Capital:'
                      : 'Cambio:'}
                  </span>
                  <span>
                    ${Math.max(0, change).toLocaleString('es-ES', {
                      minimumFractionDigits: 2, maximumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleProcessPayment} disabled={paymentAmount <= 0}>
                <Printer className="mr-2 h-4 w-4" /> Confirmar e Imprimir Recibo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {loanForCard && (
        <Dialog
          open={!!loanForCard}
          onOpenChange={(isOpen) => {
            if (!isOpen) setLoanForCard(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Préstamo Creado Exitosamente</DialogTitle>
              <DialogDescription>
                El préstamo ha sido guardado. ¿Desea imprimir la tarjeta de
                control?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setLoanForCard(null)}>
                Cerrar
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir Tarjeta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {receiptDetails && (
        <Dialog
          open={!!receiptDetails}
          onOpenChange={(isOpen) => {
            if (!isOpen) setReceiptDetails(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pago Procesado</DialogTitle>
              <DialogDescription>
                El pago ha sido registrado. ¿Desea imprimir un recibo?
              </DialogDescription>
            </DialogHeader>
            <div className="text-sm">
              <p>
                <strong>Monto Pagado:</strong> ${receiptDetails.amountPaid.toLocaleString(
                  'es-ES',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </p>
              {receiptDetails.principalApplied > 0 && (
                 <p>
                  <strong>Abono a Capital:</strong> ${receiptDetails.principalApplied.toLocaleString(
                    'es-ES',
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                  )}
                </p>
              )}
              <p>
                <strong>Devuelta:</strong> ${receiptDetails.change.toLocaleString(
                  'es-ES',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </p>
              <p>
                <strong>Balance Pendiente:</strong> ${receiptDetails.loan.totalPending.toLocaleString(
                  'es-ES',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReceiptDetails(null)}
              >
                Cerrar
              </Button>
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Imprimir Recibo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="printable-area absolute left-0 top-0 -z-10 h-0 w-0 overflow-hidden">
        {loanForCard && <LoanPaymentCard ref={cardRef} loan={loanForCard} />}
        {receiptDetails && <PaymentReceipt ref={receiptRef} details={receiptDetails} />}
      </div>
    </div>
  );
}
