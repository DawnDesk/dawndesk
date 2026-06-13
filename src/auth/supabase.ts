import { createClient, type Session, type User } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as
  | string
  | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  : null

export type AuthUser = Pick<User, 'id' | 'email' | 'user_metadata'>

export type AuthState = {
  loading: boolean
  session: Session | null
  user: AuthUser | null
}

export function userDisplayName(user: AuthUser | null) {
  if (!user) return 'Signed in'

  const name = user.user_metadata?.full_name ?? user.user_metadata?.name
  if (typeof name === 'string' && name.trim()) return name

  return user.email ?? 'Signed in'
}
