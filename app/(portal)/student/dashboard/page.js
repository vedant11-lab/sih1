'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, GraduationCap, BookOpen, Users, Briefcase, MessageSquare } from 'lucide-react'

export default function StudentDashboardPage() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [mentorshipRequests, setMentorshipRequests] = useState([])
  const router = useRouter()
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true
    init()
  }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/signin')
        return
      }
      setUser(user)

        // Ensure profile exists via API (send metadata role to allow upgrade)
        const metaRole = user?.user_metadata?.role
        const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email, role: metaRole })
      })
      const data = await res.json()
      setProfile(data)

        // If role mismatch but metadata says student, try once more to upgrade
        if (data.role && data.role !== 'STUDENT' && metaRole === 'STUDENT') {
          try {
            const res2 = await fetch('/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, email: user.email, role: 'STUDENT' })
            })
            if (res2.ok) {
              const d2 = await res2.json()
              setProfile(d2)
              if (d2.role !== 'STUDENT') {
                router.replace('/dashboard'); return
              }
            } else {
              router.replace('/dashboard'); return
            }
          } catch {
            router.replace('/dashboard'); return
          }
        } else if (data.role && data.role !== 'STUDENT') {
          // Not a student – send to their default dashboard
          router.replace('/dashboard')
          return
        }

      await Promise.all([
        fetchEvents(),
        fetchMentorshipRequests(user.id)
      ])
    } catch (e) {
      console.error('Student dashboard init error:', e)
      router.replace('/signin')
    } finally {
      setLoading(false)
    }
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .limit(4)
    if (data) setEvents(data)
  }

  async function fetchMentorshipRequests(studentId) {
    const { data } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5)
    if (data) setMentorshipRequests(data)
  }

  async function createMentorshipRequest(formData) {
    const goal = formData.get('goal')?.toString().trim()
    if (!goal) return
    const { data, error } = await supabase
      .from('mentorship_requests')
      .insert([{ student_id: user.id, goal }])
      .select('*')
      .single()
    if (data) setMentorshipRequests(prev => [data, ...prev].slice(0,5))
    if (error) console.error('Mentorship request error:', error)
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='h-12 w-12 rounded-full border-b-2 border-blue-600 animate-spin mx-auto mb-4'></div>
          <p className='text-sm text-gray-500'>Loading student dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <div className='flex items-center space-x-4'>
            <GraduationCap className='h-8 w-8 text-blue-600' />
            <div>
              <h1 className='text-2xl font-bold text-gray-900'>Student Dashboard</h1>
              <p className='text-sm text-gray-500'>Welcome, {profile?.name || user?.email}</p>
            </div>
          </div>
          <Badge variant='secondary' className='bg-green-100 text-green-800'>Student</Badge>
        </div>
      </header>

      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10'>
        {/* Overview Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-2xl font-bold'>{events.length}</p>
                  <p className='text-sm text-gray-500'>Upcoming Events</p>
                </div>
                <Calendar className='h-8 w-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-2xl font-bold'>{mentorshipRequests.length}</p>
                  <p className='text-sm text-gray-500'>Mentorship Requests</p>
                </div>
                <Users className='h-8 w-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-2xl font-bold'>0</p>
                  <p className='text-sm text-gray-500'>Job Applications</p>
                </div>
                <Briefcase className='h-8 w-8 text-indigo-500' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-2xl font-bold'>Soon</p>
                  <p className='text-sm text-gray-500'>Messages</p>
                </div>
                <MessageSquare className='h-8 w-8 text-green-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Mentorship Form */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-8'>
            {/* Events */}
            <section>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold text-gray-900'>Upcoming Events</h2>
                <Button variant='outline' size='sm'>View All</Button>
              </div>
              {events.length > 0 ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {events.map(ev => (
                    <Card key={ev.id} className='hover:shadow-md transition-shadow'>
                      <CardHeader className='pb-2'>
                        <CardTitle className='text-base'>{ev.title}</CardTitle>
                        <CardDescription>{new Date(ev.date).toLocaleDateString()}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className='text-sm text-gray-600 line-clamp-3 mb-4'>{ev.description}</p>
                        <Button size='sm' variant='outline'>RSVP</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className='p-8 text-center'>
                    <Calendar className='h-10 w-10 text-gray-300 mx-auto mb-4' />
                    <p className='text-gray-600 mb-2 font-medium'>No upcoming events</p>
                    <p className='text-sm text-gray-500'>Check back later for new campus activities.</p>
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Mentorship Requests */}
            <section>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-semibold text-gray-900'>Mentorship Requests</h2>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  await createMentorshipRequest(formData)
                  e.currentTarget.reset()
                }}
                className='mb-6 space-y-4'
              >
                <div>
                  <label className='block text-sm font-medium mb-1'>Goal / What do you need help with?</label>
                  <textarea
                    name='goal'
                    className='w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    placeholder='e.g., Guidance on internships, career path in data science...'
                    rows={3}
                  />
                </div>
                <Button size='sm' type='submit'>Submit Request</Button>
              </form>

              {mentorshipRequests.length > 0 ? (
                <div className='space-y-4'>
                  {mentorshipRequests.map(r => (
                    <Card key={r.id} className='border border-gray-200'>
                      <CardContent className='py-4'>
                        <div className='flex items-start justify-between'>
                          <div>
                            <p className='text-sm text-gray-700 whitespace-pre-line'>{r.goal}</p>
                            <p className='text-xs mt-2 text-gray-400'>Status: {r.status}</p>
                          </div>
                          <Badge variant='outline' className='text-xs'>{new Date(r.created_at).toLocaleDateString()}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className='text-sm text-gray-500'>No requests yet. Submit one above to get started.</p>
              )}
            </section>
          </div>

          {/* Resources Sidebar */}
          <aside className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Quick Resources</CardTitle>
                <CardDescription>Helpful links & materials</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3 text-sm'>
                <div className='p-3 rounded bg-blue-50 border border-blue-100'>Resume templates & guides (coming soon)</div>
                <div className='p-3 rounded bg-green-50 border border-green-100'>Interview preparation set</div>
                <div className='p-3 rounded bg-purple-50 border border-purple-100'>Scholarship & grant notices</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Next Up</CardTitle>
                <CardDescription>Your progress snapshot</CardDescription>
              </CardHeader>
              <CardContent className='text-sm space-y-2'>
                <p>• Complete profile details</p>
                <p>• Submit first mentorship request</p>
                <p>• Explore events and RSVP</p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  )
}
