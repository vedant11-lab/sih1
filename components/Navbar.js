'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { getUserProfileClient } from '@/lib/profile-service'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const router = useRouter()

  /**
   * Get user profile data from the database
   */
  const getUserProfile = async (userId) => {
    return await getUserProfileClient(supabase, userId)
  }

  /**
   * Initialize authentication state and set up listener
   */
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        setUser(session.user)
        const userProfile = await getUserProfile(session.user.id)
        setProfile(userProfile)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const userProfile = await getUserProfile(session.user.id)
          setProfile(userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [])

  /**
   * Handle user sign out
   */
  const handleSignOut = async () => {
    setSigningOut(true)
    
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Sign out error:', error)
        // Still continue with sign out process
      }
      
      // Clear local state
      setUser(null)
      setProfile(null)
      
      // Redirect to home page
      router.push('/')
      
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      setSigningOut(false)
    }
  }

  /**
   * Get dashboard link based on user role
   */
  const getDashboardLink = () => {
    if (!profile?.role) return '/dashboard'
    
    switch (profile.role) {
      case 'ADMIN':
        return '/admin'
      case 'RECRUITER':
        return '/recruiter'
      default:
        return '/dashboard'
    }
  }

  /**
   * Get role display name
   */
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'STUDENT':
        return 'Student'
      case 'ALUMNUS':
        return 'Alumnus'
      case 'RECRUITER':
        return 'Recruiter'
      case 'ADMIN':
        return 'Admin'
      default:
        return 'User'
    }
  }

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                Alumni Platform
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    )
  }

  /**
   * User Avatar Component
   */
  const UserAvatar = ({ className = "" }) => (
    <div className={`w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm ${className}`}>
      <span className="text-white text-sm font-medium">
        {(profile?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
      </span>
    </div>
  )

  /**
   * Mobile Menu Content
   */
  const MobileMenuContent = () => (
    <div className="space-y-4 p-4">
      {user ? (
        <>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <UserAvatar />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {profile?.full_name || user.email}
              </div>
              {profile?.role && (
                <div className="text-xs text-gray-500">
                  {getRoleDisplayName(profile.role)}
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Link
              href={getDashboardLink()}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">Dashboard</span>
            </Link>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleSignOut()
              }}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
              disabled={signingOut}
            >
              <LogOut className="h-5 w-5 text-gray-500" />
              <span className="text-gray-700">
                {signingOut ? 'Signing Out...' : 'Sign Out'}
              </span>
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Sign In
            </Button>
          </Link>
          <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full">
              Sign Up
            </Button>
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200"
            >
              Alumni Platform
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              /* Authenticated User View - Desktop */
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-auto px-3 hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <UserAvatar />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {profile?.full_name || user.email}
                        </div>
                        {profile?.role && (
                          <div className="text-xs text-gray-500">
                            {getRoleDisplayName(profile.role)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link 
                      href={getDashboardLink()}
                      className="flex items-center cursor-pointer"
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{signingOut ? 'Signing Out...' : 'Sign Out'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              /* Guest User View - Desktop */
              <>
                <Link href="/signin">
                  <Button variant="ghost" size="sm" className="hover:bg-gray-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-10 w-10 p-0 hover:bg-gray-50"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Alumni Platform</SheetTitle>
                  <SheetDescription>
                    Navigate to different sections of the platform
                  </SheetDescription>
                </SheetHeader>
                <MobileMenuContent />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}