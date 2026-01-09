
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import type { Product } from '@/lib/types'
import { apiHandler, ApiError } from '@/lib/api-handler'
import { createProductSchema, updateProductSchema } from '@/schemas'
import { logger } from '@/lib/logger'

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
export const POST = apiHandler(async (request) => {
  const body = await request.json()
  const product = createProductSchema.parse(body)

  logger.info('Creating product', { name: product.name })

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single()

  if (error) {
    logger.error('Error creating product', { error })
    throw new ApiError('Error creating product', 500)
  }

  logger.info('Product created successfully', { id: data.id })
  return NextResponse.json(data)
})

// PUT: actualizar producto
export const PUT = apiHandler(async (request) => {
  const body = await request.json()
  const product = updateProductSchema.parse(body)
  const { id, ...productData } = product

  logger.info('Updating product', { id })

  const { error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', id)

  if (error) {
    logger.error('Error updating product', { error, id })
    throw new ApiError('Error updating product', 500)
  }

  logger.info('Product updated successfully', { id })
  return NextResponse.json(product)
})

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
