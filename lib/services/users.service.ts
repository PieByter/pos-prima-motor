import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'

export async function getUsers(
  supabase: SupabaseClient,
): Promise<{ data: Profile[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: new Error(error.message) }
    return { data: (data ?? []) as Profile[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getUserById(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) return { data: null, error: new Error('User not found') }
    return { data: data as Profile, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
  name: string,
  role: Profile['role'],
): Promise<{ data: Profile | null; error: Error | null }> {
  // 1. Create auth user via Supabase Admin Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError || !authData.user) {
    return { data: null, error: authError ?? new Error('Failed to create auth user') }
  }

  // 2. Create profile record
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({ id: authData.user.id, name, role, is_active: true })
      .select()
      .single()

    if (error || !profile) {
      return { data: null, error: new Error(error?.message ?? 'Failed to create profile') }
    }
    return { data: profile as Profile, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<Pick<Profile, 'name' | 'role' | 'is_active' | 'profile_picture'>> & { password?: string },
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    // If password is provided, update auth password via admin API
    if (data.password) {
      const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
        password: data.password,
      })
      if (authError) return { data: null, error: new Error(authError.message) }
    }

    // Build profile update payload — only include fields that were actually provided
    const profileData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (data.name !== undefined) profileData.name = data.name
    if (data.role !== undefined) profileData.role = data.role
    if (data.is_active !== undefined) profileData.is_active = data.is_active
    if (data.profile_picture !== undefined) profileData.profile_picture = data.profile_picture

    const { data: row, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single()

    if (error || !row) {
      console.error('updateUser failed:', error?.message ?? 'User not found', 'for userId:', userId)
      return { data: null, error: new Error(error?.message ?? 'User not found') }
    }
    return { data: row as Profile, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deactivateUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('User not found') }
    return { data: row as Profile, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ error: Error | null }> {
  // Auth delete will cascade the profile via FK trigger in Supabase
  const { error } = await supabase.auth.admin.deleteUser(userId)
  return { error }
}
