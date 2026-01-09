
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import { z } from 'zod'

type POSItem = {
  productId: string
  quantity: number
  price?: number // opcional, se fallbackea a products.price
}

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed'

// Schema de validación para POST
const createSaleRequestSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid('ID de producto inválido'),
    quantity: z.number().int().positive('´La cantidad debe ser mayor a 0'),
    price: z.number().nonnegative().optional(),
  })).min(1, 'Debe haber al menos un producto en la venta'),
  customer_email: z.string().email().optional(),
  customer_name: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mixed']).optional(),
  amount_paid: z.number().nonnegative().optional(),
});

// =======================
// GET: obtener ventas con cliente y detalles
// =======================
export async function GET() {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select(`
        id,
        subtotal,
        tax,
        total,
        amount,
        amount_paid,
        change_returned,
        payment_method,
        created_at,
        customer_email,
        customer_name,
        clients ( name ),
        sale_items (
          id,
          product_id,
          quantity,
          unit_price,
          products ( name )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const result = (sales ?? []).map((s: any) => ({
      id: s.id,
      subtotal: s.subtotal,
      tax: s.tax,
      total: s.total,
      amount: s.amount,
      amountPaid: s.amount_paid,
      changeReturned: s.change_returned,
      paymentMethod: s.payment_method,
      created_at: s.created_at,
      customerEmail: s.customer_email,
      customerName: s.clients?.name ?? s.customer_name ?? 'Consumidor Final',
      items: (s.sale_items ?? []).map((i: any) => ({
        id: i.id,
        productId: i.product_id,
        quantity: i.quantity,
        unitPrice: i.unit_price,
        productName: i.products?.name ?? 'N/A',
      })),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { message: 'Error fetching sales', error },
      { status: 500 }
    )
  }
}

// =======================
// POST: crear venta con items y actualizar stock
// =======================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validar request
    const validatedData = createSaleRequestSchema.parse(body)
    const { items, customer_email, customer_name, payment_method, amount_paid } = validatedData

    logger.info('Creating sale', { itemCount: items.length, customer_email })

    // --- calcular subtotal (usando unit_price) ---
    let subtotal = 0
    const itemsWithPrice: { productId: string; quantity: number; unitPrice: number }[] = []

    for (const it of items) {
      let unitPrice = it.price

      if (unitPrice == null) {
        const { data: product, error: prodError } = await supabase
          .from('products')
          .select('price')
          .eq('id', it.productId)
          .single()

        if (prodError) throw prodError
        if (!product) throw new Error(`Producto ${it.productId} no encontrado`)

        unitPrice = product.price
      }

      subtotal += (Number(unitPrice) || 0) * (Number(it.quantity) || 0)

      itemsWithPrice.push({
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: unitPrice ?? 0,
      })
    }

    // El subtotal es igual al total ya que los precios incluyen impuestos
    const total = subtotal
    const amount = subtotal

    // Calcular el impuesto (18%) a partir del precio que ya incluye impuestos
    // Fórmula: tax = precioConImpuesto - (precioConImpuesto / 1.18)
    const tax = Number((total - (total / 1.18)).toFixed(2))

    // --- cliente ---
    const emailToSave = customer_email || null
    const nameToSave = customer_name || (!customer_email ? 'Consumidor Final' : null)

    // --- pago ---
    const method: PaymentMethod = payment_method || 'cash'
    const amountPaid = amount_paid ?? total
    let changeReturned = 0

    if (method === 'cash') {
      changeReturned = amountPaid > total ? amountPaid - total : 0
    } else {
      changeReturned = 0
    }

    // 1) Crear la venta
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert({
        customer_email: emailToSave,
        customer_name: nameToSave,
        subtotal,
        tax, // 18% calculado del precio que incluye impuestos
        total,
        amount,
        amount_paid: amountPaid,
        change_returned: changeReturned,
        payment_method: method,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (saleError) throw saleError
    if (!sale) throw new Error('No se pudo crear la venta')

    // 2) Insertar items
    const itemsToInsert = itemsWithPrice.map((it) => ({
      sale_id: sale.id,
      product_id: it.productId,
      quantity: it.quantity,
      unit_price: it.unitPrice,
    }))

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    // 3) Actualizar stock
    for (const it of itemsWithPrice) {
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('stock')
        .eq('id', it.productId)
        .single()

      if (prodError) throw prodError
      if (!product) throw new Error(`Producto ${it.productId} no encontrado`)

      const newStock = Number(product.stock) - Number(it.quantity)
      if (newStock < 0) {
        throw new Error(`Stock insuficiente para producto ${it.productId}`)
      }

      const { error: updateErr } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', it.productId)

      if (updateErr) throw updateErr
    }

    // 4) Revalidate POS route so ISR/edge cache updates immediately
    try {
      await revalidatePath('/pos')
    } catch (revalErr) {
      // log but don't fail the request if revalidation errors
      logger.warn('Error revalidating /pos', { error: revalErr })
    }

    logger.info('Sale created successfully', { saleId: sale.id, total })

    return NextResponse.json({
      id: sale.id,
      items: itemsWithPrice,
      subtotal,
      total,
      amount,
      amount_paid: amountPaid,
      change_returned: changeReturned,
      payment_method: method,
      customer_email: emailToSave,
      customer_name: nameToSave,
    })
  } catch (error) {
    logger.error('Error creating sale', { error })
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { message: `Error creating sale: ${errorMessage}`, error },
      { status: 500 }
    )
  }
}
