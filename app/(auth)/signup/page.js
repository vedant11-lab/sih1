'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function SignUpPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: ''
  })
  
  const router = useRouter()

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
   * Handle role selection change
   */
  const handleRoleChange = (value) => {
    setFormData(prev => ({
      ...prev,
      role: value
    }))
    if (error) setError('')
  }

  /**
   * Validate form data before submission
   */
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required')
      return false
    }
    if (!formData.email.trim()) {
      setError('Email is required')
      return false
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (!formData.role) {
      setError('Please select a role')
      return false
    }
    return true
  }

  /**
   * Handle form submission
   * 1. Validate form data
   * 2. Create user account with Supabase Auth
   * 3. Create profile record in database
   * 4. Redirect to appropriate dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')
    
    try {
      console.log('Starting signup process...', { email: formData.email, role: formData.role })

      // Step 1: Create user account with Supabase Auth (no email confirmation)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            name: formData.fullName,
            role: formData.role
          }
        }
      })

      console.log('Auth signup result:', { authData, authError })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error('Failed to create user account')
      }

      console.log('User created successfully:', authData.user.id)

      // Step 2: Call profile ensure API with selected role so it persists
      const profileRes = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: authData.user.id,
            email: formData.email,
            role: formData.role
        })
      })
      let createdProfile = null
      if (profileRes.ok) {
        createdProfile = await profileRes.json()
        console.log('Profile ensure success:', createdProfile)
      } else {
        console.warn('Profile ensure failed (continuing sign up)')
      }

      const userStatus = createdProfile?.status || (formData.role === 'STUDENT' ? 'APPROVED' : 'PENDING')

      // Show success message based on resulting status
      setSuccess(userStatus === 'APPROVED'
        ? 'Account created successfully! You can now sign in.'
        : 'Account created successfully! Your account is pending admin approval.')
      
      // Force sign-out to ensure fresh role-based login (avoids stale session role)
      try { await supabase.auth.signOut() } catch {}
      // Redirect after short delay for UX
      setTimeout(() => { router.push('/signin') }, 1200)

    } catch (err) {
      console.error('Sign up error:', err)
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Join Alumni Platform</CardTitle>
          <CardDescription>
            Create your account to connect with students, alumni, and employers
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

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
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Choose a secure password (min 6 characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={handleRoleChange} value={formData.role} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STUDENT">Student</SelectItem>
                  <SelectItem value="ALUMNI">Alumnus</SelectItem>
                  <SelectItem value="ADMIN">Admin (University Head)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}