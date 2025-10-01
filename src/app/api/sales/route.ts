'use server'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'

type POSItem = {
  productId: string
  quantity: number
  price?: number // opcional, se fallbackea a products.price
}

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'mixed'

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
    const body = (await request.json()) as {
      items: POSItem[]
      customer_email?: string
      customer_name?: string
      payment_method?: PaymentMethod
      amount_paid?: number
    }

    const { items, customer_email, customer_name, payment_method, amount_paid } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('La venta debe contener al menos un item')
    }

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

    const TAX_RATE = 0.18
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax
    const amount = total

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
        tax,
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

    return NextResponse.json({
      id: sale.id,
      items: itemsWithPrice,
      subtotal,
      tax,
      total,
      amount,
      amount_paid: amountPaid,
      change_returned: changeReturned,
      payment_method: method,
      customer_email: emailToSave,
      customer_name: nameToSave,
    })
  } catch (error) {
    console.error('Error creating sale:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { message: `Error creating sale: ${errorMessage}`, error },
      { status: 500 }
    )
  }
}
