/**
 * OAuth Callback Handler
 * 
 * This page handles OAuth redirects (like Google Sign-In) and processes
 * the authentication tokens returned by the OAuth provider.
 * 
 * Features:
 * - Processes OAuth callback parameters
 * - Exchanges auth code for session
 * - Creates user profile if needed
 * - Redirects to appropriate dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'

export default function AuthCallback() {
  const [status, setStatus] = useState('Processing authentication...')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('Authentication failed. Redirecting to sign in...')
          setTimeout(() => router.push('/signin'), 2000)
          return
        }

        if (data.session?.user) {
          // Check if user has a profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single()

          if (profileError || !profile) {
            // Create a basic profile for OAuth users
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: data.session.user.id,
                full_name: data.session.user.user_metadata?.full_name || 
                          data.session.user.user_metadata?.name || 
                          data.session.user.email,
                role: 'STUDENT' // Default role for OAuth users
              })

            if (insertError) {
              console.error('Error creating profile:', insertError)
            }
          }

          setStatus('Authentication successful! Redirecting...')
          
          // Redirect based on role
          if (profile?.role === 'ADMIN') {
            router.push('/admin')
          } else if (profile?.role === 'RECRUITER') {
            router.push('/recruiter')
          } else {
            router.push('/portal')
          }
        } else {
          setStatus('No session found. Redirecting to sign in...')
          setTimeout(() => router.push('/signin'), 2000)
        }
      } catch (err) {
        console.error('Callback error:', err)
        setStatus('An error occurred. Redirecting to sign in...')
        setTimeout(() => router.push('/signin'), 2000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}