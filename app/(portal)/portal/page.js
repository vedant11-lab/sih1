/**
 * Community Portal Dashboard
 * 
 * This is the main dashboard for Students and Alumni users.
 * It provides access to community features, events, and networking.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function PortalDashboard() {
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
            Welcome back, {profile?.full_name}!
          </h1>
          <p className="text-gray-600">
            {profile?.role === 'STUDENT' ? 'Student Portal' : 'Alumni Portal'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Discover upcoming networking events and workshops.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Board</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Browse job opportunities and internships.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Connect with alumni and fellow students.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}