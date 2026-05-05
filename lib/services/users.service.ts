import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import type { Profile } from '@/lib/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

type DbProfile = {
  id: string
  name: string
  role: 'admin' | 'mekanik'
  is_active: boolean
  profile_picture: string | null
  created_at: Date
  updated_at: Date
}

const mapProfile = (row: DbProfile): Profile => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

export async function getUsers(): Promise<{ data: Profile[] | null; error: Error | null }> {
  try {
    const rows = await db.select().from(profiles).orderBy(desc(profiles.created_at))
    return { data: (rows as DbProfile[]).map(mapProfile), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getUserById(
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const [row] = await db.select().from(profiles).where(eq(profiles.id, userId))
    if (!row) return { data: null, error: new Error('User not found') }
    return { data: mapProfile(row as DbProfile), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: Profile['role'],
): Promise<{ data: Profile | null; error: Error | null }> {
  const adminClient = createAdminClient()

  // 1. Create auth user via Supabase Admin Auth
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (authError || !authData.user) return { data: null, error: authError ?? new Error('Failed to create auth user') }

  // 2. Create profile via Drizzle
  try {
    const [profile] = await db
      .insert(profiles)
      .values({ id: authData.user.id, name, role, is_active: true })
      .returning()
    return { data: mapProfile(profile as DbProfile), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateUser(
  userId: string,
  data: Partial<Pick<Profile, 'name' | 'role' | 'is_active' | 'profile_picture'>>,
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(profiles)
      .set({ ...data, updated_at: new Date() })
      .where(eq(profiles.id, userId))
      .returning()
    if (!row) return { data: null, error: new Error('User not found') }
    return { data: mapProfile(row as DbProfile), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deactivateUser(
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(profiles)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(profiles.id, userId))
      .returning()
    if (!row) return { data: null, error: new Error('User not found') }
    return { data: mapProfile(row as DbProfile), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteUser(userId: string): Promise<{ error: Error | null }> {
  const adminClient = createAdminClient()
  // Auth delete will cascade the profile via FK trigger in Supabase
  const { error } = await adminClient.auth.admin.deleteUser(userId)
  return { error }
}
