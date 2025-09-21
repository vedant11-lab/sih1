/**
 * Debug Page for Testing Authentication
 * 
 * This page helps debug authentication issues and test Supabase connection.
 * Remove this file in production.
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DebugPage() {
  const [status, setStatus] = useState('Initializing...')
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, { timestamp, message, type }])
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  useEffect(() => {
    testConnection()
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        addLog(`Auth state changed: ${event}`, 'info')
        if (session?.user) {
          setUser(session.user)
          await fetchProfile(session.user.id)
        } else {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const testConnection = async () => {
    try {
      addLog('Testing Supabase connection...', 'info')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        addLog(`Connection error: ${error.message}`, 'error')
        setStatus('❌ Connection Failed')
      } else {
        addLog('Database connection successful', 'success')
        setStatus('✅ Connected')
      }

      // Test auth session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        addLog(`Current user: ${session.user.email}`, 'info')
        setUser(session.user)
        await fetchProfile(session.user.id)
      } else {
        addLog('No active session', 'info')
      }

    } catch (err) {
      addLog(`Test failed: ${err.message}`, 'error')
      setStatus('❌ Test Failed')
    }
  }

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        addLog(`Profile fetch error: ${error.message}`, 'error')
      } else {
        addLog(`Profile loaded: ${data.full_name} (${data.role})`, 'success')
        setProfile(data)
      }
    } catch (err) {
      addLog(`Profile fetch failed: ${err.message}`, 'error')
    }
  }

  const testSignup = async () => {
    try {
      addLog('Testing signup...', 'info')
      
      const testEmail = `test+${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpass123',
        options: {
          data: {
            full_name: 'Test User',
            role: 'STUDENT'
          }
        }
      })

      if (error) {
        addLog(`Signup error: ${error.message}`, 'error')
      } else {
        addLog(`Signup successful: ${data.user?.email}`, 'success')
      }
    } catch (err) {
      addLog(`Signup test failed: ${err.message}`, 'error')
    }
  }

  const testSignout = async () => {
    try {
      addLog('Testing signout...', 'info')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addLog(`Signout error: ${error.message}`, 'error')
      } else {
        addLog('Signout successful', 'success')
        setUser(null)
        setProfile(null)
      }
    } catch (err) {
      addLog(`Signout test failed: ${err.message}`, 'error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg mb-4">{status}</p>
              <Button onClick={testConnection} variant="outline">
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current User</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>ID:</strong> {user.id}</p>
                  {profile && (
                    <>
                      <p><strong>Name:</strong> {profile.full_name}</p>
                      <p><strong>Role:</strong> {profile.role}</p>
                    </>
                  )}
                  <Button onClick={testSignout} variant="destructive" size="sm">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <p>No user signed in</p>
              )}
            </CardContent>
          </Card>

          {/* Test Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={testSignup} variant="outline" className="w-full">
                Test Signup
              </Button>
              <Button 
                onClick={() => window.open('/signup', '_blank')} 
                variant="outline" 
                className="w-full"
              >
                Open Signup Page
              </Button>
              <Button 
                onClick={() => window.open('/signin', '_blank')} 
                variant="outline" 
                className="w-full"
              >
                Open Signin Page
              </Button>
            </CardContent>
          </Card>

          {/* Logs Card */}
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 overflow-y-auto bg-gray-900 text-white p-3 rounded font-mono text-sm">
                {logs.map((log, index) => (
                  <div key={index} className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' : 
                    log.type === 'success' ? 'text-green-400' : 
                    'text-gray-300'
                  }`}>
                    <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
              <Button 
                onClick={() => setLogs([])} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Clear Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}