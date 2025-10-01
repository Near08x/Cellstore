'use server'
import type { User } from '@supabase/supabase-js';
import { NextResponse } from 'next/server'
import { supabaseAdmin, supabase } from '@/lib/supabaseServer'

// Crear usuario admin inicial si no existe
async function createInitialAdminUser() {
  const email = 'near9708@gmail.com'
  const password = 'robert1997'
  const name = 'Admin Near'
  const role = 'admin'

  // Verificar si ya existe
  const { data: userList, error: listError } =
    await supabaseAdmin.auth.admin.listUsers()

  if (listError) throw listError

  const exists = userList?.users?.some((u: User) => u.email === email)

  if (!exists) {
    const { data: createdUser, error } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      })

    if (error) throw error
    console.log('✅ Usuario admin creado:', createdUser?.user?.email)
  }
}

export async function POST(request: Request) {
  try {
    // Crear admin inicial si no existe
    await createInitialAdminUser()

    const { email, password } = (await request.json()) as {
      email: string
      password: string
    }

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.user) {
      return NextResponse.json(
        { message: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Retornar datos del usuario sin exponer nada sensible
    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name as string | undefined,
      role: data.user.user_metadata?.role as string | undefined,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
