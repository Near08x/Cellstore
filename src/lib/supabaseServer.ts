import { createClient } from '@supabase/supabase-js'

// ⚠️ IMPORTANTE: Nunca expongas la service_role en el cliente.
// Usa estas keys solo en server-side code o en rutas API.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// Cliente público (anon) → se puede usar en frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Cliente administrador (service_role) → SOLO en server-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
  },
})
