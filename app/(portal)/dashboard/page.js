'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  MessageSquare, 
  Heart, 
  Briefcase, 
  Users, 
  GraduationCap,
  Mail,
  Award
} from 'lucide-react'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeJobs: 0,
    upcomingEvents: 0,
    donations: 0
  })

  useEffect(() => {
    getUser()
    getStats()
  }, [])

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        redirect('/signin')
        return
      }
      setUser(user)

      // Call server endpoint to ensure profile exists (uses service role)
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      })

      if (res.ok) {
        const profileData = await res.json()
        setProfile(profileData)
      } else {
        const err = await res.json().catch(() => ({}))
        console.warn('Profile ensure failed:', err)
        // Soft fallback – allow dashboard but mark missing
        setProfile({ id: user.id, name: user.email.split('@')[0], role: 'ALUMNI', status: 'PENDING', fallback: true })
      }
    } catch (e) {
      console.error('Error ensuring user/profile:', e)
      redirect('/signin')
    } finally {
      setLoading(false)
    }
  }

  async function getStats() {
    try {
      // Get total alumni count
      const { count: alumniCount, error: alumniError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'ALUMNI')

      if (alumniError) {
        console.error('Error fetching alumni count:', alumniError)
      }

      // Get upcoming events count - handle case where events table might not exist
      let eventsCount = 0
      const { count: eventCountResult, error: eventsError } = await supabase
        .from('events')
        .select('*', { count: 'exact' })
        .gte('date', new Date().toISOString())

      if (eventsError) {
        console.log('Events table not found or error:', eventsError)
        // This is expected if events table doesn't exist yet
      } else {
        eventsCount = eventCountResult
      }

      setStats({
        totalAlumni: alumniCount || 0,
        activeJobs: 45,
        upcomingEvents: eventsCount || 0,
        donations: 125000
      })
    } catch (error) {
      console.error('Error in getStats:', error)
      // Set default stats if there's an error
      setStats({
        totalAlumni: 0,
        activeJobs: 45,
        upcomingEvents: 0,
        donations: 125000
      })
    }
  }

  async function handleSignOut() {
    try { await supabase.auth.signOut() } catch {}
    // Soft redirect then hard fallback
    try { redirect('/signin') } catch {}
    if (typeof window !== 'undefined') {
      setTimeout(() => { window.location.href = '/signin' }, 150)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const featureCards = [
    {
      title: "College Events",
      description: "Discover and register for upcoming college events, reunions, and networking sessions",
      icon: Calendar,
      color: "bg-blue-500",
      stats: `${stats.upcomingEvents} upcoming`
    },
    {
      title: "Messages & Chat", 
      description: "Connect and chat with fellow alumni and current students",
      icon: MessageSquare,
      color: "bg-green-500",
      stats: "12 new messages"
    },
    {
      title: "Donations",
      description: "Support your alma mater through various donation programs", 
      icon: Heart,
      color: "bg-red-500",
      stats: `₹${stats.donations.toLocaleString()} raised`
    },
    {
      title: "Job Board",
      description: "Explore career opportunities and post job openings",
      icon: Briefcase,
      color: "bg-purple-500", 
      stats: `${stats.activeJobs} active jobs`
    },
    {
      title: "Alumni Directory",
      description: "Search and connect with alumni across different batches",
      icon: Users,
      color: "bg-orange-500",
      stats: `${stats.totalAlumni} alumni`
    },
    {
      title: "Mentorship Program",
      description: "Mentor current students or find mentors in your field",
      icon: GraduationCap,
      color: "bg-indigo-500",
      stats: "25 mentors available"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Alumni Dashboard</h1>
                <p className="text-sm text-gray-500">Welcome back, {profile?.name || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-blue-100 text-blue-800">Alumni</Badge>
              <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Welcome to Alumni Platform</CardTitle>
                <CardDescription>Connect, contribute, and stay engaged with your alma mater</CardDescription>
              </div>
              <Button variant="outline" size="sm">Edit Profile</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{profile?.role || 'Alumni'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAlumni}</p>
                  <p className="text-sm text-gray-500">Total Alumni</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeJobs}</p>
                  <p className="text-sm text-gray-500">Active Jobs</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
                  <p className="text-sm text-gray-500">Upcoming Events</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.donations.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Total Donations</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feature Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Alumni Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featureCards.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${feature.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.stats}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {feature.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Explore →
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
