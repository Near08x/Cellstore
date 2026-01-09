
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Correo y contraseña son requeridos.' },
        { status: 400 }
      )
    }

    // Buscar usuario en profiles
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { message: 'Usuario no encontrado.' },
        { status: 401 }
      )
    }

    // Comparar contraseñas
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return NextResponse.json(
        { message: 'Contraseña incorrecta.' },
        { status: 401 }
      )
    }

    // Retornar usuario sin exponer el hash
    const safeUser = {
      id: user.id,
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    }

    console.log('✅ Usuario autenticado:', safeUser.email)

    // Puedes guardar sesión con cookie o en client-side
    return NextResponse.json({ user: safeUser })
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { message: 'Error interno en el login.' },
      { status: 500 }
    )
  }
}
