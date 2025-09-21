/**
 * Recruiter Dashboard
 * 
 * This is the dedicated interface for corporate partners and recruiters.
 * It provides tools for posting jobs and connecting with talent.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function RecruiterDashboard() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/signin')
        return
      }

      setUser(session.user)

      // Get user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Check if user is recruiter
      if (profileData?.role !== 'RECRUITER') {
        router.push('/dashboard')
        return
      }

      setProfile(profileData)
      setLoading(false)
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Recruiter Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome, {profile?.full_name} - Connect with top talent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Create and manage job postings and internships.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidate Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Browse profiles of students and alumni.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Review and manage job applications.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Manage your company information and branding.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Track job posting performance and metrics.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Host recruitment events and info sessions.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}