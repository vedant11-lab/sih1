/**
 * Supabase Client Configuration
 * 
 * This file creates and exports a reusable Supabase client for browser-side operations.
 * It uses the @supabase/ssr library which provides optimal performance and security
 * for Next.js applications with server-side rendering support.
 * 
 * Key Features:
 * - Browser-optimized client using createBrowserClient
 * - Secure environment variable configuration
 * - Automatic authentication state management
 * - Compatible with Next.js App Router
 * - Ready for both client and server components
 * 
 * Usage Examples:
 * import { supabase } from '@/lib/supabase-client'
 * 
 * // Query data
 * const { data, error } = await supabase.from('profiles').select('*')
 * 
 * // Authentication
 * const { data, error } = await supabase.auth.signUp({ email, password })
 */

import { createBrowserClient } from '@supabase/ssr'

/**
 * Environment Variables Validation
 * Ensures required Supabase credentials are available and valid
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are set and not placeholder values
const isPlaceholderUrl = !supabaseUrl || 
  supabaseUrl === 'your_supabase_project_url_here' || 
  supabaseUrl === 'https://your-project-id.supabase.co'

const isPlaceholderKey = !supabaseAnonKey || 
  supabaseAnonKey === 'your_supabase_anon_key_here' ||
  supabaseAnonKey === 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key-here'

if (isPlaceholderUrl || isPlaceholderKey) {
    console.warn(
        '⚠️  Supabase credentials not configured properly.\n' +
        'Please update your .env.local file with actual values:\n' +
        '1. NEXT_PUBLIC_SUPABASE_URL (from Supabase Dashboard → Settings → API)\n' +
        '2. NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase Dashboard → Settings → API)\n' +
        'Using fallback values for development...'
    )
} else {
    console.log('Supabase credentials configured successfully')
}

/**
 * Supabase Browser Client
 * 
 * This client is optimized for browser-side operations and handles:
 * - Authentication state persistence
 * - Automatic token refresh
 * - Real-time subscriptions
 * - Database queries and mutations
 * 
 * The client is configured with your project's URL and anon key,
 * which allows public operations while maintaining security through
 * Row Level Security (RLS) policies defined in your database.
 */

// Create the Supabase client
let supabase

if (isPlaceholderUrl || isPlaceholderKey) {
    // Create a mock client that doesn't make real API calls when credentials are not configured
    console.warn('Using mock Supabase client - credentials not configured')
    supabase = {
        from: () => ({
            select: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            insert: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            update: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            delete: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            })
        }),
        auth: {
            signUp: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            signInWithPassword: () => Promise.resolve({
                data: null,
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            signOut: () => Promise.resolve({
                error: { message: 'Please configure your Supabase credentials in .env.local' }
            }),
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({
                data: {
                    subscription: { unsubscribe: () => { } }
                }
            })
        }
    }
} else {
    // Create real Supabase client with actual credentials
    try {
        supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
        console.error('Failed to create Supabase client:', error.message)
        // Fallback to mock client if creation fails
        supabase = {
            from: () => ({
                select: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
                insert: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
                update: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
                delete: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } })
            }),
            auth: {
                signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
                signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase client creation failed' } }),
                signOut: () => Promise.resolve({ error: { message: 'Supabase client creation failed' } }),
                getSession: () => Promise.resolve({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
            }
        }
    }
}

export { supabase }

/**
 * Database Schema Reference (for documentation)
 * 
 * Our database tables have the following structure:
 * 
 * PROFILES TABLE:
 * - id: string (UUID, references auth.users)
 * - name: string
 * - avatar_url: string (optional)
 * - role: 'STUDENT' | 'ALUMNI' (legacy 'ALUMNUS') | 'ADMIN' | 'RECRUITER'
 * - status: 'PENDING' | 'APPROVED' (default: 'PENDING')
 * - created_at: timestamp
 * - updated_at: timestamp
 * 
 * EVENTS TABLE:
 * - id: string (UUID)
 * - title: string
 * - description: string
 * - event_date: timestamp
 * - location: string
 * - created_by: string (UUID, references profiles.id)
 * - created_at: timestamp
 * - updated_at: timestamp
 * 
 * JOBS TABLE:
 * - id: string (UUID)
 * - title: string
 * - description: string
 * - company_name: string
 * - location: string
 * - posted_by: string (UUID, references profiles.id)
 * - created_at: timestamp
 * - updated_at: timestamp
 */

/**
 * Export the client as default for convenience
 * Allows: import supabase from '@/lib/supabase-client'
 */
export default supabase