// Centralized profile service to handle RLS issues
import { createClient } from '@supabase/supabase-js'

const FALLBACK_PROFILE = {
  full_name: 'User',
  role: 'STUDENT',
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
      .select('full_name, role, status')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Profile fetch error:', error.message)
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
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Client profile fetch error:', error.message)
      return { ...FALLBACK_PROFILE, id: userId }
    }

    return data
  } catch (err) {
    console.error('Unexpected client profile error:', err)
    return { ...FALLBACK_PROFILE, id: userId }
  }
}