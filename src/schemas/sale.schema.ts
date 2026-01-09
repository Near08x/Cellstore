import { z } from 'zod';

// =========================
//    VALIDACIÓN DE DETALLES DE VENTA
// =========================

export const saleDetailSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().nonnegative('El precio unitario no puede ser negativo'),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  total: z.number().nonnegative('El total no puede ser negativo'),
});

// =========================
//    VALIDACIÓN DE VENTAS
// =========================

export const saleSchema = z.object({
  id: z.string().uuid().optional(),
  customerName: z.string().min(1, 'El nombre del cliente es requerido').max(255),
  customerEmail: z.string().email('Email inválido'),
  subtotal: z.number().nonnegative('El subtotal no puede ser negativo'),
  amount: z.number().nonnegative('El monto no puede ser negativo'),
  tax: z.number().nonnegative('El impuesto no puede ser negativo'),
  date: z.string(),
  items: z.array(saleDetailSchema).min(1, 'Debe haber al menos un producto en la venta'),
});

// =========================
//    SCHEMAS PARA API
// =========================

// Crear venta (campos requeridos)
export const createSaleSchema = z.object({
  customerName: z.string().min(1, 'El nombre del cliente es requerido').max(255),
  customerEmail: z.string().email('Email inválido'),
  items: z.array(saleDetailSchema).min(1, 'Debe haber al menos un producto en la venta'),
  // Los totales se calcularán automáticamente en el servidor
}).refine(
  (data) => {
    // Validar que todos los items tengan valores coherentes
    return data.items.every((item) => {
      const calculatedTotal = item.quantity * item.price;
      // Permitir pequeña diferencia por redondeo (0.01)
      return Math.abs(calculatedTotal - item.total) < 0.01;
    });
  },
  {
    message: 'Los totales de los items no coinciden con cantidad * precio',
  }
);

// Actualizar venta (solo estado/fecha)
export const updateSaleSchema = z.object({
  id: z.string().uuid('ID de venta inválido'),
  date: z.string().optional(),
});

// Buscar venta por ID
export const saleIdSchema = z.object({
  id: z.string().uuid('ID de venta inválido'),
});

// Buscar ventas por rango de fechas
export const salesByDateRangeSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

// Tipos inferidos
export type SaleDetailInput = z.infer<typeof saleDetailSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type SaleIdInput = z.infer<typeof saleIdSchema>;
export type SalesByDateRangeInput = z.infer<typeof salesByDateRangeSchema>;
