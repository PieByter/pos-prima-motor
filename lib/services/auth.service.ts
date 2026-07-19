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

// ─── Password Reset ──────────────────────────────────────────────────────────

/**
 * Direct password reset using admin (service role) client.
 * No email/Gmail/OTP required — looks up user by email via listUsers(),
 * then updates the password directly. Returns { data, error }.
 */
export async function adminResetPassword(email: string, newPassword: string) {
  const admin = createAdminClient()

  // 1. Find user by email
  const { data: users, error: listError } = await admin.auth.admin.listUsers()
  if (listError) return { data: null, error: listError }

  const user = users?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  )
  if (!user) {
    return { data: null, error: new Error('Email tidak ditemukan.') }
  }

  // 2. Update password directly
  const { data, error } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  return { data, error }
}

/**
 * Change own password while logged in.
 * Verifies current password first, then updates.
 */
export async function changeOwnPassword(
  supabase: SupabaseClient,
  currentPassword: string,
  newPassword: string,
) {
  // Re-authenticate to verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: (await supabase.auth.getUser()).data.user?.email ?? '',
    password: currentPassword,
  })
  if (signInError) {
    return { data: null, error: new Error('Password saat ini salah.') }
  }

  // Update to new password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}
