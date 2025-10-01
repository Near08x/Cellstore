
'use client';

import type { Product, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  MinusCircle,
  PlusCircle,
  Search,
  ShoppingCart,
  Trash2,
  X,
  Printer,
  CreditCard,
  Landmark,
  Wallet,
  Coins,
  UserPlus,
} from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import PosReceipt from './pos-receipt';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import AddClientForm from '../clients/add-client-form';
import { useReactToPrint } from 'react-to-print';

type CartItem = Product & {
  quantity: number;
  discount: number;
  selectedPrice: number;
};
type PaymentMethod = 'cash' | 'transfer' | 'card' | 'mixed';
type PriceTier = 'price' | 'price2' | 'price3';

export type SaleDetails = {
  id: string;
  cart: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  date: string;
  customerName: string;
  customerEmail: string;
};

const ProductCard = ({
  product,
  onAddToCart,
}: {
  product: Product;
  onAddToCart: (product: Product, price: number) => void;
}) => {
  const [selectedPriceTier, setSelectedPriceTier] = useState<PriceTier>('price');

  const handleAddToCartClick = () => {
    onAddToCart(product, product[selectedPriceTier]);
  };

  return (
    <Card className="group overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-base">{product.name}</CardTitle>
        <CardDescription>Stock: {product.stock}</CardDescription>
        <div className="flex items-center gap-2">
          <Select
            defaultValue="price"
            onValueChange={(value) => setSelectedPriceTier(value as PriceTier)}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">P1</SelectItem>
              <SelectItem value="price2">P2</SelectItem>
              <SelectItem value="price3">P3</SelectItem>
            </SelectContent>
          </Select>
          <span className="font-semibold text-lg">
            ${product[selectedPriceTier].toFixed(2)}
          </span>
        </div>
      </CardHeader>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={handleAddToCartClick}
          disabled={product.stock === 0}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir
        </Button>
      </CardFooter>
    </Card>
  );
};


export default function PosClient({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState(0);
  const [completedSaleDetails, setCompletedSaleDetails] =
    useState<SaleDetails | null>(null);

  const { toast } = useToast();
  const receiptRef = useRef<HTMLDivElement>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddClientOpen, setAddClientOpen] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch('/api/clients');
        if (res.ok) {
          const data: Client[] = await res.json();
          // Filter out duplicate clients based on email
          const uniqueClients = Array.from(new Map(data.map(client => [client.email, client])).values());
          setClients(uniqueClients);
        }
      } catch (error) {
        console.error("Failed to fetch clients", error);
      }
    };
    fetchClients();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !cart.some((item) => item.id === product.id)
    );
  }, [searchQuery, products, cart]);

  const handleAddToCart = (product: Product, price: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return prevCart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          toast({
            title: 'Agotado',
            description: `No se pueden agregar más ${product.name}.`,
            variant: 'destructive',
          });
          return prevCart;
        }
      }
      return [
        ...prevCart,
        { ...product, quantity: 1, discount: 0, selectedPrice: price },
      ];
    });
    setSearchQuery('');
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find((item) => item.id === productId);
      if (!itemToUpdate) return prevCart;

      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      if (newQuantity > itemToUpdate.stock) {
        toast({
          title: 'Agotado',
          description: `Solo ${itemToUpdate.stock} unidades de ${itemToUpdate.name} disponibles.`,
          variant: 'destructive',
        });
        return prevCart;
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleDiscountChange = (productId: string, discount: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              discount: Math.max(0, Math.min(100, discount)),
            }
          : item
      )
    );
  };

  const subtotal = cart.reduce((acc, item) => {
    const itemTotal = item.selectedPrice * item.quantity;
    const discountAmount = itemTotal * (item.discount / 100);
    return acc + itemTotal - discountAmount;
  }, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const change = amountPaid - total;

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) {
      toast({
        title: 'Carrito Vacío',
        description:
          'Por favor, agregue artículos al carrito antes de completar una venta.',
        variant: 'destructive',
      });
      return;
    }
    setAmountPaid(total);
    setPaymentModalOpen(true);
  };

const handlePrint = () => {
  const printWindow = window.open('', '', 'width=300,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Factura</title>
          <style>
            body { font-family: monospace; font-size: 12px; }
            .center { text-align: center; }
            hr { border: 1px dashed black; }
          </style>
        </head>
        <body>
          <div class="center">
            <img src="/logo.png" width="80" />
            <h2>CellStore</h2>
            <p>Gracias por su compra</p>
            <hr />
          </div>
          <p><strong>Cliente:</strong> Juan Pérez</p>
          <p><strong>Total:</strong> $120.00</p>
          <p><strong>Método:</strong> Efectivo</p>
          <hr />
          <p class="center">¡Vuelva pronto!</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }
};


  const handleCompleteSale = async () => {
    const salePayload = {
      customerName: selectedClient?.name || 'Cliente General',
      customerEmail: selectedClient?.email || 'cliente@general.com',
      amount: total,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.selectedPrice,
        total: item.selectedPrice * item.quantity * (1 - item.discount / 100)
      }))
    };

    try {
        const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(salePayload),
        });

        if (!response.ok) throw new Error('Failed to complete sale');
        const newSale = await response.json();

        const saleDetails: SaleDetails = {
          id: newSale.id,
          cart,
          subtotal,
          tax,
          total,
          paymentMethod,
          amountPaid,
          change: Math.max(0, change),
          date: new Date().toLocaleString('es-ES'),
          customerName: salePayload.customerName,
          customerEmail: salePayload.customerEmail,
        };
        setCompletedSaleDetails(saleDetails);

        setTimeout(() => {
          handlePrint();
          setPaymentModalOpen(false);
          setCart([]);
          setAmountPaid(0);
          setPaymentMethod('cash');
          setSelectedClient(null);
          setCompletedSaleDetails(null);
          // Optionally, refresh products to show updated stock
        }, 100);

    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo completar la venta.', variant: 'destructive' });
    }
  };

    const handleAddClient = async (newClientData: Omit<Client, 'id'>) => {
    try {
        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClientData),
        });
        if (!response.ok) throw new Error('Failed to add client');
        const newClient = await response.json();
        
        if (!clients.some(c => c.email === newClient.email)) {
            setClients((prev) => [newClient, ...prev]);
        }
        
        setAddClientOpen(false);
        setSelectedClient(newClient);
        toast({ title: 'Éxito', description: 'Cliente añadido y seleccionado.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo añadir el cliente.', variant: 'destructive' });
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 no-print">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar productos para añadir al carrito..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg bg-background pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1.5 top-1.5 h-6 w-6"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <p className="py-8 text-center text-muted-foreground">
                No se encontraron productos.
              </p>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <Search className="h-12 w-12" />
                <p className="mt-4">
                  Comienza a buscar para añadir productos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart /> Venta Actual
            </CardTitle>
            <div className='flex items-center gap-2 pt-2'>
                <Select onValueChange={(email) => setSelectedClient(clients.find(c => c.email === email) || null)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Cliente General" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="general">Cliente General</SelectItem>
                        {clients.map(client => (
                            <SelectItem key={client.email} value={client.email}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon" variant="outline"><UserPlus className='h-4 w-4'/></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Añadir Nuevo Cliente</DialogTitle>
                        <DialogDescription>
                            Rellena los detalles para añadir un nuevo cliente.
                        </DialogDescription>
                        </DialogHeader>
                        <AddClientForm onAddClient={handleAddClient} />
                    </DialogContent>
                </Dialog>
            </div>
            {selectedClient && (
                <CardDescription className='pt-2 flex items-center justify-between'>
                    <span>Facturando a: <strong>{selectedClient.name}</strong></span>
                    <Button variant='ghost' size='icon' className='h-6 w-6' onClick={() => setSelectedClient(null)}><X className='h-4 w-4'/></Button>
                </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground">
                El carrito está vacío
              </p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>${item.selectedPrice.toFixed(2)}</span>
                        <div className="flex items-center gap-1 rounded-md border">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                          >
                            <MinusCircle className="h-4 w-4" />
                          </Button>
                          <span className="w-4 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <label
                          htmlFor={`discount-${item.id}`}
                          className="text-xs text-muted-foreground"
                        >
                          Desc. %
                        </label>
                        <Input
                          id={`discount-${item.id}`}
                          type="number"
                          value={item.discount}
                          onChange={(e) =>
                            handleDiscountChange(
                              item.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="h-7 w-16"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        $
                        {(
                          item.selectedPrice *
                          item.quantity *
                          (1 - item.discount / 100)
                        ).toFixed(2)}
                      </p>
                      {item.discount > 0 && (
                        <p className="text-xs text-destructive line-through">
                          ${(item.selectedPrice * item.quantity).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleUpdateQuantity(item.id, 0)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Impuesto (18%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              size="lg"
              onClick={handleOpenPaymentModal}
            >
              Completar Venta
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Pago</DialogTitle>
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
                onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}
              >
                <Label
                  htmlFor="cash"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="cash" id="cash" className="sr-only" />
                  <Wallet className="mb-3 h-6 w-6" />
                  Efectivo
                </Label>
                <Label
                  htmlFor="card"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="card" id="card" className="sr-only" />
                  <CreditCard className="mb-3 h-6 w-6" />
                  Tarjeta
                </Label>
                 <Label
                  htmlFor="transfer"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="transfer" id="transfer" className="sr-only" />
                  <Landmark className="mb-3 h-6 w-6" />
                  Transferencia
                </Label>
                 <Label
                  htmlFor="mixed"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary"
                >
                  <RadioGroupItem value="mixed" id="mixed" className="sr-only" />
                  <Coins className="mb-3 h-6 w-6" />
                  Mixto
                </Label>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount-paid">Monto Recibido</Label>
              <Input
                id="amount-paid"
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            <Separator />
            <div className="space-y-4 text-lg">
              <div className="flex justify-between font-semibold">
                <span>Total a Pagar:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div
                className={`flex justify-between font-bold ${
                  change < 0 ? 'text-destructive' : 'text-primary'
                }`}
              >
                <span>Cambio:</span>
                <span>${Math.max(0, change).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleCompleteSale} disabled={change < 0}>
              <Printer className="mr-2 h-4 w-4" /> Confirmar e Imprimir Recibo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="printable-area absolute left-0 top-0 -z-10 h-0 w-0 overflow-hidden">
        {completedSaleDetails && (
          <PosReceipt ref={receiptRef} details={completedSaleDetails} />
        )}
      </div>
    </div>
  );
}
