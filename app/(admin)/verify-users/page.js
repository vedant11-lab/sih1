import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase-server'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

/**
 * Server Action: Approve User
 * Updates user status from PENDING to APPROVED
 */
async function approveUser(userId) {
  'use server'
  
  const supabase = await createClient()
  
  try {
    // Update user status to APPROVED
    const { error } = await supabase
      .from('profiles')
      .update({ status: 'APPROVED' })
      .eq('id', userId)
    
    if (error) {
      console.error('Error approving user:', error)
      throw error
    }
    
    console.log('User approved successfully:', userId)
    
    // Refresh the page data
    revalidatePath('/admin/verify-users')
  } catch (error) {
    console.error('Failed to approve user:', error)
    throw error
  }
}

/**
 * Get current user's profile and verify admin access
 */
async function getCurrentUserProfile(supabase) {
  try {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, role, status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return null
    }

    return profile
  } catch (err) {
    console.error('Profile fetch error:', err)
    return null
  }
}

/**
 * Get all pending users
 */
async function getPendingUsers(supabase) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, created_at')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending users:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Pending users fetch error:', err)
    return []
  }
}

/**
 * Get user email from auth.users
 */
async function getUsersWithEmails(supabase, userIds) {
  if (userIds.length === 0) return []
  
  try {
    // Note: In production, you might need to use Supabase Admin API
    // to access auth.users table. For now, we'll use a workaround
    const { data, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('Error fetching user emails:', error)
      return userIds.map(id => ({ id, email: 'Email not available' }))
    }

    return data.users
      .filter(user => userIds.includes(user.id))
      .map(user => ({ id: user.id, email: user.email }))
  } catch (err) {
    console.error('Users email fetch error:', err)
    return userIds.map(id => ({ id, email: 'Email not available' }))
  }
}

/**
 * Role display helper
 */
function getRoleDisplayName(role) {
  switch (role) {
    case 'STUDENT':
      return 'Student'
      case 'ALUMNUS': // legacy string; treat as ALUMNI
        return 'Alumnus'
    case 'RECRUITER':
      return 'Recruiter'
    case 'ADMIN':
      return 'Admin'
    default:
      return role || 'Unknown'
  }
}

/**
 * Role badge variant helper
 */
function getRoleBadgeVariant(role) {
  switch (role) {
    case 'ALUMNUS':
      case 'ALUMNUS': // legacy ALUMNI
        return 'primary'
    case 'RECRUITER':
      return 'secondary'
    case 'ADMIN':
      return 'destructive'
    default:
      return 'outline'
  }
}

export default async function VerifyUsersPage() {
  // Create Supabase client for server-side operations
  const supabase = await createClient()

  // Check authentication and admin access
  const currentUser = await getCurrentUserProfile(supabase)
  
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch pending users
  const pendingUsers = await getPendingUsers(supabase)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Verification
          </h1>
          <p className="text-gray-600">
            Review and approve pending user registrations.
          </p>
        </div>

        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Approvals</CardDescription>
              <CardTitle className="text-2xl font-bold text-orange-600">
                {pendingUsers.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Users awaiting verification
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending User Registrations</CardTitle>
            <CardDescription>
              Review and approve new user accounts that require admin verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingUsers.length > 0 ? (
              <Table>
                <TableCaption>
                  {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} pending approval.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || 'No name provided'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {/* Note: Email would need admin API access */}
                        Email protected
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <form action={approveUser.bind(null, user.id)}>
                          <Button 
                            type="submit"
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              /* Empty State */
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-500">
                    There are no pending user registrations at this time.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}