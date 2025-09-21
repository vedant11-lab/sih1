import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import EventCard from '@/components/EventCard'

async function getUserProfile(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, role, status')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      // Return fallback profile for any errors
      return {
        full_name: 'User',
        role: 'STUDENT',
        status: 'APPROVED',
        id: userId
      }
    }

    return data
  } catch (err) {
    console.error('Profile fetch error:', err)
    return {
      full_name: 'User',
      role: 'STUDENT',
      status: 'APPROVED',
      id: userId
    }
  }
}

async function getEvents(supabase) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Events fetch error:', err)
    return []
  }
}

export default async function DashboardPage() {
  // Create Supabase client for server-side operations
  const supabase = await createClient()

  // Check for authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  // Redirect to signin if not authenticated
  if (authError || !user) {
    redirect('/signin')
  }

  // Fetch user profile and events in parallel
  const [userProfile, events] = await Promise.all([
    getUserProfile(supabase, user.id),
    getEvents(supabase)
  ])

  // Get display name (fallback to email if full_name not available)
  const displayName = userProfile?.full_name || user.email || 'User'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {displayName}!
          </h1>
          <p className="text-gray-600">
            Here's what's happening in your alumni community.
          </p>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              Upcoming Events
            </h2>
            {events.length > 0 && (
              <p className="text-sm text-gray-500">
                {events.length} event{events.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* Events Grid */}
          {events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  date={event.event_date}
                  location={event.location}
                  description={event.description}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No events scheduled
                </h3>
                <p className="text-gray-500">
                  There are currently no upcoming events. Check back later for new events and activities.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Dashboard Sections - Placeholder for future features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Events</span>
                <span className="font-medium text-gray-900">{events.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Your Role</span>
                <span className="font-medium text-gray-900">
                  {userProfile?.role === 'STUDENT' ? 'Student' : 
                   userProfile?.role === 'ALUMNUS' ? 'Alumnus' : 
                   userProfile?.role || 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="text-center py-8">
              <p className="text-gray-500">
                Activity tracking coming soon...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}