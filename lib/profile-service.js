// Centralized profile service to handle RLS issues
import { createClient } from '@supabase/supabase-js'

const FALLBACK_PROFILE = {
  name: 'User',
  role: 'ALUMNI',
  status: 'APPROVED'
}

// For server-side usage
export async function getUserProfileSafe(userId) {
  try {
    // Create server client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    const { data, error } = await supabase
      .from('profiles')
      .select('name, role, status')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) {
      console.error('Profile fetch error:', error?.message || 'No profile found')
      return { ...FALLBACK_PROFILE, id: userId }
    }

    return data
  } catch (err) {
    console.error('Unexpected profile service error:', err)
    return { ...FALLBACK_PROFILE, id: userId }
  }
}

// For client-side usage
export async function getUserProfileClient(supabase, userId) {
  try {
    // 1. Try to fetch existing profile
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, status')
      .eq('id', userId)
      .maybeSingle()

    // Return if found
    if (data) return data

    // If an unexpected error (not just "no rows") – log and fall back
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn('Client profile fetch error (non-empty result):', error.message)
      return { ...FALLBACK_PROFILE, id: userId }
    }

    // 2. No profile exists – attempt to create one (assuming RLS allows it)
    try {
      // Fetch user email (needed for profile) – safe extra call
      const { data: { user } } = await supabase.auth.getUser()
      const emailName = user?.email ? user.email.split('@')[0] : 'User'

      const insertPayload = {
        id: userId,
        name: emailName,
        role: 'ALUMNI',
        status: 'APPROVED'
      }

      const { data: created, error: insertError } = await supabase
        .from('profiles')
        .insert([insertPayload])
        .select('id, name, role, status')
        .single()

      if (created) {
        console.info('Auto-created missing profile for user:', userId)
        return created
      }

      if (insertError) {
        // Most common cause: missing RLS policy for insert
        console.warn('Could not auto-create profile (check RLS insert policy):', insertError.message)
      }
    } catch (createErr) {
      console.warn('Profile auto-create attempt failed:', createErr.message)
    }

    // 3. Fallback object (silently, no scary error spam in console)
    return { ...FALLBACK_PROFILE, id: userId, autoFallback: true }
  } catch (err) {
    console.error('Unexpected client profile error:', err)
    return { ...FALLBACK_PROFILE, id: userId, autoFallback: true }
  }
}

// Helper SQL (run in Supabase) if auto-create keeps failing due to RLS:
// -- Ensure table has these columns (id UUID PK, name text, role text, status text)
// create policy "Enable profile insert for user" on profiles
//   for insert to authenticated
//   with check ( auth.uid() = id );
// create policy "Enable profile select for user" on profiles
//   for select to authenticated
//   using ( auth.uid() = id );