/**
 * User Sign-In Page Component
 * 
 * This page allows existing users to log into the Alumni Platform.
 * 
 * Features:
 * - Email and password authentication
 * - Google OAuth integration
 * - Remember me functionality
 * - Error handling and validation
 * - Automatic redirection to appropriate portal based on role
 * 
 * Security:
 * - Uses Supabase Auth for secure authentication
 * - OAuth integration for third-party login
 * - Session management and persistence
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  
  const router = useRouter()

  /**
   * Check if user is already authenticated on page load
   */
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // User is already logged in, redirect to home
        router.push('/')
      }
    }
    
    checkAuth()
  }, [router])

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  /**
   * Validate form data before submission
   */
  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    return true
  }

  /**
   * Handle email/password sign in
   */
  const handleEmailSignIn = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    
    try {
      console.log('Starting email signin...', { email: formData.email })

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      console.log('Auth signin result:', { data, authError })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!data.user) {
        throw new Error('Sign in failed')
      }

      console.log('User signed in successfully:', data.user.id)

      // Get user profile to determine redirect destination
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      console.log('Profile fetch result:', { profile, profileError })

      // Redirect based on user role
      if (profile?.role === 'ADMIN') {
        console.log('Redirecting to admin dashboard')
        router.push('/admin')
      } else if (profile?.role === 'RECRUITER') {
        console.log('Redirecting to recruiter dashboard')
        router.push('/recruiter')
      } else {
        console.log('Redirecting to portal dashboard')
        router.push('/portal')
      }

    } catch (err) {
      console.error('Sign in error:', err)
      setError(err.message || 'An error occurred during sign in')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle Google OAuth sign in
   */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    
    try {
      console.log('Starting Google OAuth signin...')

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      console.log('Google OAuth result:', { error })

      if (error) {
        if (error.message.includes('provider is not enabled') || error.message.includes('Unsupported provider')) {
          throw new Error(
            'Google Sign-In is not enabled. Please enable Google OAuth in your Supabase project settings:\n' +
            '1. Go to Supabase Dashboard → Authentication → Providers\n' +
            '2. Enable Google provider\n' +
            '3. Add your Google OAuth credentials'
          )
        } else {
          throw new Error(error.message)
        }
      }

      // The redirect will happen automatically if successful
      
    } catch (err) {
      console.error('Google sign in error:', err)
      setError(err.message || 'An error occurred during Google sign in')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to your Alumni Platform account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading || googleLoading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading || googleLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200 whitespace-pre-line">
                {error}
              </div>
            )}

            {/* Email Sign In Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || googleLoading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              'Connecting to Google...'
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign up here
            </Link>
          </div>

          {/* Forgot Password Link */}
          <div className="mt-2 text-center text-sm">
            <Link href="/forgot-password" className="text-gray-600 hover:text-gray-800">
              Forgot your password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}