import type { SupabaseClient } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getUsers(
  supabase: SupabaseClient,
): Promise<{ data: Profile[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return { data: null, error }
  return { data: data as Profile[], error: null }
}

export async function getUserById(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<Profile>()
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: Profile['role'],
) {
  const adminClient = createAdminClient()

  // 1. Create auth user
  const { data: authData, error: authError } =
    await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    })

  if (authError || !authData.user) return { data: null, error: authError }

  // 2. Create profile
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      name,
      role,
      is_active: true,
    })
    .select()
    .single<Profile>()

  if (profileError) return { data: null, error: profileError }

  return { data: profile, error: null }
}

export async function updateUser(
  supabase: SupabaseClient,
  userId: string,
  data: Partial<Pick<Profile, 'name' | 'role' | 'is_active' | 'profile_picture'>>,
) {
  return supabase
    .from('profiles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single<Profile>()
}

export async function deactivateUser(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single<Profile>()
}

export async function deleteUser(userId: string) {
  const adminClient = createAdminClient()

  // Delete auth user (profile cascades via FK)
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  return { error }
}
