
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import type { Client } from '@/lib/types'
import { apiHandler, ApiError } from '@/lib/api-handler'
import { createClientSchema } from '@/schemas'
import { logger } from '@/lib/logger'

// =======================
// GET: obtener todos los clientes
// =======================
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name, email, phone, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(data as Client[])
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { message: 'Error fetching clients', error },
      { status: 500 }
    )
  }
}

// =======================
// POST: crear cliente (o devolver existente si ya está)
// =======================
export const POST = apiHandler(async (request) => {
  const body = await request.json()
  const client = createClientSchema.parse(body)

  logger.info('Creating client', { email: client.email })

  // Verificar si ya existe por email
  const { data: existing, error: fetchError } = await supabase
    .from('clients')
    .select('id, name, email, phone, created_at')
    .eq('email', client.email)
    .maybeSingle()

  if (fetchError) {
    logger.error('Error checking existing client', { error: fetchError })
    throw new ApiError('Error checking existing client', 500)
  }

  if (existing) {
    logger.info('Client already exists', { id: existing.id })
    return NextResponse.json(existing)
  }

  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: client.name,
      email: client.email,
      phone: client.phone,
    })
    .select('id, name, email, phone, created_at')
    .single()

  if (error) {
    logger.error('Error creating client', { error })
    throw new ApiError('Error creating client', 500)
  }

  logger.info('Client created successfully', { id: data.id })
  return NextResponse.json(data)
})

// =======================
// DELETE: eliminar cliente por email
// =======================
export async function DELETE(request: Request) {
  try {
    const { email } = (await request.json()) as { email: string }

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const { data: existing, error: fetchError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (fetchError) throw fetchError
    if (!existing) {
      return NextResponse.json(
        { message: 'Client not found' },
        { status: 404 }
      )
    }

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', existing.id)

    if (error) throw error

    return NextResponse.json({ message: 'Client deleted successfully' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { message: 'Error deleting client', error },
      { status: 500 }
    )
  }
}
