
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'
import type { User } from '@/lib/types'

// GET: listar usuarios
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (error) throw error

    const userList = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name ?? null,
      role: u.user_metadata?.role ?? null,
    })) as Omit<User, 'passwordHash'>[]

    return NextResponse.json(userList)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { message: 'Error fetching users', error },
      { status: 500 }
    )
  }
}

// POST: crear usuario
export async function POST(request: Request) {
  try {
    const { name, email, password, role } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { message: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const { data: list, error: listError } =
      await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    if (list.users.some((u) => u.email === email)) {
      return NextResponse.json(
        { message: 'El usuario ya existe' },
        { status: 409 }
      )
    }

    // Crear usuario en Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

    if (error) throw error

    return NextResponse.json({
      id: data.user?.id,
      email: data.user?.email,
      name: data.user?.user_metadata?.name,
      role: data.user?.user_metadata?.role,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { message: 'Error creating user', error },
      { status: 500 }
    )
  }
}

// DELETE: eliminar usuario
export async function DELETE(request: Request) {
  try {
    const { id } = (await request.json()) as { id: string }
    if (!id) {
      return NextResponse.json(
        { message: 'ID de usuario es requerido' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) throw error

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { message: 'Error deleting user', error },
      { status: 500 }
    )
  }
}
