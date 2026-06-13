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

export function userFirstName(user: AuthUser | null) {
  const displayName = userDisplayName(user)
  return displayName.split(/\s+/)[0] || displayName
}

export function userAvatarUrl(user: AuthUser | null) {
  if (!user) return null

  const avatar =
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    user.user_metadata?.photo_url

  return typeof avatar === 'string' && avatar.trim() ? avatar : null
}
