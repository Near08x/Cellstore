'use client';

import { useState } from 'react';
import { Search, Trash2, UserPlus } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Client, Sale } from '@/lib/types';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import AddClientForm from './add-client-form';
import { useToast } from '@/hooks/use-toast';

export default function ClientsClient({ initialClients, sales }: { initialClients: Client[], sales: Sale[] }) {
  const [search, setSearch] = useState('');
  const [isAddClientOpen, setAddClientOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const { toast } = useToast();


  const handleAddClient = async (newClientData: Omit<Client, 'id'>) => {
    try {
        const response = await fetch('/api/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newClientData),
        });
        if (!response.ok) throw new Error('Failed to add client');
        const newClient = await response.json();
        
        // Avoid adding duplicates if client already exists
        if (!clients.some(c => c.email === newClient.email)) {
            setClients((prev) => [newClient, ...prev]);
        }
        
        setAddClientOpen(false);
        toast({ title: 'Éxito', description: 'Cliente añadido correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo añadir el cliente.', variant: 'destructive' });
    }
  };
  
  const handleDeleteClient = async (clientEmail: string) => {
    try {
        const response = await fetch('/api/clients', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: clientEmail }),
        });
        if (!response.ok) throw new Error('Failed to delete client');
        setClients((prev) => prev.filter(client => client.email !== clientEmail));
        toast({ title: 'Éxito', description: 'Cliente eliminado correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el cliente. Es posible que esté asociado a ventas o préstamos.', variant: 'destructive' });
    }
  }

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email.toLowerCase().includes(search.toLowerCase()) ||
      client.phone.includes(search)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Gestiona tus clientes y visualiza su historial de compras.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar clientes..."
                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Añadir Cliente
                  </span>
                </Button>
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
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.email}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{client.phone}</TableCell>
                <TableCell className="text-right">
                  <Button disabled variant="ghost" size="icon" className="text-destructive hover:text-destructive h-8 w-8" onClick={() => handleDeleteClient(client.email)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar cliente</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
