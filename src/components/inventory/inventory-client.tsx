
'use client';

import { useState } from 'react';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/lib/types';
import { Input } from '../ui/input';
import { Tabs, TabsContent } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import AddProductForm from './add-product-form';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import EditProductForm from './edit-product-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

type ProductTableProps = {
  products: Product[];
  onDeleteProduct: (id: string) => void;
  onEditProduct: (product: Product) => void;
};

function ProductTable({ products, onDeleteProduct, onEditProduct }: ProductTableProps) {
  const { role } = useAuth();
  
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden md:table-cell">P1 (Ind.)</TableHead>
          <TableHead className="hidden md:table-cell">P2 (Mayor)</TableHead>
          <TableHead className="hidden md:table-cell">P3 (Oferta)</TableHead>
          <TableHead className="hidden md:table-cell">Costo</TableHead>
          <TableHead className="hidden md:table-cell">Stock</TableHead>
          <TableHead>
            <span className="sr-only">Acciones</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>
              <Badge
                variant={
                  product.stock > 10
                    ? 'secondary'
                    : product.stock > 0
                    ? 'outline'
                    : 'destructive'
                }
              >
                {product.stock > 10
                  ? 'En Stock'
                  : product.stock > 0
                  ? 'Poco Stock'
                  : 'Agotado'}
              </Badge>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              ${product.price.toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              ${product.price2.toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              ${product.price3.toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              ${product.cost.toFixed(2)}
            </TableCell>
            <TableCell className="hidden md:table-cell">
              {product.stock}
            </TableCell>
            <TableCell>
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
                    <DropdownMenuItem onClick={() => onEditProduct(product)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeleteProduct(product.id)}>Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function InventoryClient({
  products: initialProducts,
}: {
  products: Product[];
}) {
  const { role } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isAddProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleAddProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProduct),
        });
        if (!response.ok) throw new Error('Failed to add product');
        const addedProduct = await response.json();
        setProducts((prev) => [addedProduct, ...prev]);
        setAddProductOpen(false);
        toast({ title: 'Éxito', description: 'Producto añadido correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo añadir el producto.', variant: 'destructive' });
    }
  };
  
  const handleDeleteProduct = async (id: string) => {
    try {
        const response = await fetch('/api/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        if (!response.ok) throw new Error('Failed to delete product');
        setProducts((prev) => prev.filter((product) => product.id !== id));
        toast({ title: 'Éxito', description: 'Producto eliminado correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo eliminar el producto.', variant: 'destructive' });
    }
  }

  const handleEditProduct = (productToEdit: Product) => {
    setEditingProduct(productToEdit);
  }

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
        const response = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedProduct),
        });
        if (!response.ok) throw new Error('Failed to update product');
        const returnedProduct = await response.json();
        setProducts(prev => prev.map(p => p.id === returnedProduct.id ? returnedProduct : p));
        setEditingProduct(null);
        toast({ title: 'Éxito', description: 'Producto actualizado correctamente.' });
    } catch (error) {
        toast({ title: 'Error', description: 'No se pudo actualizar el producto.', variant: 'destructive' });
    }
  }

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((product) => {
      if (activeTab === 'all') return true;
      if (activeTab === 'active') return product.stock > 10;
      if (activeTab === 'low') return product.stock > 0 && product.stock <= 10;
      if (activeTab === 'draft') return product.stock === 0;
      return true;
    });

  return (
    <Tabs defaultValue="all" onValueChange={setActiveTab}>
      <div className="flex items-center">
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {role === 'admin' && (
            <Dialog open={isAddProductOpen} onOpenChange={setAddProductOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9 gap-1">
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Añadir Producto
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Añadir Nuevo Producto</DialogTitle>
                  <DialogDescription>
                    Rellena los detalles para añadir un nuevo producto al inventario.
                  </DialogDescription>
                </DialogHeader>
                <AddProductForm onAddProduct={handleAddProduct} />
              </DialogContent>
            </Dialog>
          )}
           <Dialog open={!!editingProduct} onOpenChange={(isOpen) => !isOpen && setEditingProduct(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Producto</DialogTitle>
                  <DialogDescription>
                    Actualiza los detalles del producto.
                  </DialogDescription>
                </DialogHeader>
                {editingProduct && <EditProductForm product={editingProduct} onUpdateProduct={handleUpdateProduct} />}
              </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card className="mt-2">
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            Gestiona tus productos y consulta el estado de su inventario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabsContent value="all">
            <ProductTable products={filteredProducts} onDeleteProduct={handleDeleteProduct} onEditProduct={handleEditProduct}/>
          </TabsContent>
          <TabsContent value="active">
            <ProductTable products={filteredProducts} onDeleteProduct={handleDeleteProduct} onEditProduct={handleEditProduct}/>
          </TabsContent>
          <TabsContent value="low">
            <ProductTable products={filteredProducts} onDeleteProduct={handleDeleteProduct} onEditProduct={handleEditProduct}/>
          </TabsContent>
          <TabsContent value="draft">
            <ProductTable products={filteredProducts} onDeleteProduct={handleDeleteProduct} onEditProduct={handleEditProduct}/>
          </TabsContent>
        </CardContent>
      </Card>
    </Tabs>
  );
}
