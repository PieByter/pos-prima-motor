import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

export async function signIn(
  supabase: SupabaseClient,
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) return { data: null, error }

  // Fetch profile using admin client to bypass RLS
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  return { data: { user: data.user, session: data.session, profile }, error: null }
}

export async function signUp(
  supabase: SupabaseClient,
  email: string,
  password: string,
  metadata: { name: string; role: Profile['role'] },
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: metadata.name,
        role: metadata.role,
      },
    },
  })
  if (error) return { data: null, error }

  if (data.user) {
    const admin = createAdminClient()

    // Auto-confirm email using admin client
    try {
      await admin.auth.admin.updateUserById(data.user.id, {
        email_confirm: true,
      })
    } catch (confirmError) {
      console.warn("Could not auto-confirm email:", confirmError)
    }

    // Create profile record using admin client (bypasses RLS)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: data.user.id,
        name: metadata.name,
        role: metadata.role,
        is_active: true,
      })

    if (profileError) return { data: null, error: profileError }
  }

  return { data, error: null }
}

export async function signOut(supabase: SupabaseClient) {
  return supabase.auth.signOut()
}

export async function getCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { data: null, error }

  // Fetch profile using admin client to bypass RLS
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { data: { user, profile: profile as Profile | null }, error: null }
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  // Use admin for profile reads to bypass RLS
  const admin = createAdminClient()
  return admin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<Pick<Profile, 'name' | 'profile_picture'>>,
) {
  // Use admin for profile updates to bypass RLS
  const admin = createAdminClient()
  return admin
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single<Profile>()
}
