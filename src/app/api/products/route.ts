'use server'

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import type { Product } from '@/lib/types'

// GET: obtener todos los productos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data as Product[])
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { message: 'Error fetching products', error },
      { status: 500 }
    )
  }
}

// POST: crear producto
export async function POST(request: Request) {
  try {
    const product = (await request.json()) as Omit<Product, 'id'>

    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { message: 'Error creating product', error },
      { status: 500 }
    )
  }
}

// PUT: actualizar producto
export async function PUT(request: Request) {
  try {
    const product = (await request.json()) as Product
    const { id, ...productData } = product

    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { message: 'Error updating product', error },
      { status: 500 }
    )
  }
}

// DELETE: eliminar producto
export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string }

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { message: 'Error deleting product', error },
      { status: 500 }
    )
  }
}
