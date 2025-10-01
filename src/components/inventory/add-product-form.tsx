
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Product } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'El nombre debe tener al menos 2 caracteres.',
  }),
  description: z.string().min(10, {
    message: 'La descripción debe tener al menos 10 caracteres.',
  }),
  price: z.coerce.number().positive({
    message: 'El precio debe ser un número positivo.',
  }),
  price2: z.coerce.number().positive({
    message: 'El precio 2 debe ser un número positivo.',
  }),
  price3: z.coerce.number().positive({
    message: 'El precio 3 debe ser un número positivo.',
  }),
  cost: z.coerce.number().positive({
    message: 'El costo debe ser un número positivo.',
  }),
  provider: z.string().min(2, {
    message: 'El proveedor debe tener al menos 2 caracteres.',
  }),
  stock: z.coerce.number().int().min(0, {
    message: 'El stock debe ser un número entero no negativo.',
  }),
});

type AddProductFormProps = {
  onAddProduct: (product: Omit<Product, 'id'>) => void;
};

export default function AddProductForm({ onAddProduct }: AddProductFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      price2: 0,
      price3: 0,
      cost: 0,
      provider: '',
      stock: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddProduct(values);
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Galaxy S25 Ultra" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el producto..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio 1 (Individual)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1399.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio 2 (Mayor)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1350.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="price3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio 3 (Oferta)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1300.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
           <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="999.99" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor</FormLabel>
                <FormControl>
                  <Input placeholder="Samsung" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="25" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" className="w-full">Añadir Producto</Button>
      </form>
    </Form>
  );
}
