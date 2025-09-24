import { createClient } from '@supabase/supabase-js'

// POST /api/profile  -> ensures a profile exists for current auth user
export async function POST(req) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !anon || !service) {
      return new Response(JSON.stringify({ error: 'Missing Supabase env vars' }), { status: 500 })
    }

    const supabase = createClient(supabaseUrl, service)

    // Get auth user from header (supabase client will call this with user's token via fetch options) not available by default
    // Instead pass userId in body from client after getUser
    const body = await req.json().catch(() => ({}))
    const { userId, email, role: requestedRole, status: requestedStatus } = body
    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'userId and email required' }), { status: 400 })
    }

    // Check existing
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, name, role, status, email')
      .eq('id', userId)
      .maybeSingle()

    if (existing) {
      // If role upgrade requested (e.g., ALUMNI -> ADMIN) apply it
      const allowedRoles = ['STUDENT','ALUMNI','RECRUITER','ADMIN']
      if (requestedRole && allowedRoles.includes(requestedRole) && requestedRole !== existing.role) {
        const { data: updated, error: updateErr } = await supabase
          .from('profiles')
          .update({ role: requestedRole })
          .eq('id', userId)
          .select('id, name, role, status, email')
          .single()
        if (updateErr) {
          return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 })
        }
        return new Response(JSON.stringify(updated), { status: 200 })
      }
      return new Response(JSON.stringify(existing), { status: 200 })
    }

    if (fetchErr && fetchErr.code !== 'PGRST116') {
      return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 })
    }

  const name = email.split('@')[0]
  // Allow specific roles from client only if in allow list; fallback to ALUMNI
  const allowedRoles = ['STUDENT','ALUMNI','RECRUITER','ADMIN']
  const role = allowedRoles.includes(requestedRole) ? requestedRole : 'ALUMNI'
  // Students auto-approved, others pending unless explicitly passed
  const status = (role === 'STUDENT' || role === 'ADMIN' || role === 'ALUMNI')
    ? 'APPROVED'
    : (requestedStatus || 'PENDING')
  const payload = { id: userId, name, role, status, email }
  console.log('[api/profile] creating profile', payload)

    const { data: created, error: insertErr } = await supabase
      .from('profiles')
      .insert([payload])
      .select('id, name, role, status')
      .single()

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), { status: 500 })
    }

    return new Response(JSON.stringify(created), { status: 201 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || 'Unexpected error' }), { status: 500 })
  }
}
