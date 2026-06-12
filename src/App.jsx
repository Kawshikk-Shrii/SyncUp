import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { syncCurrentUserProfile } from './lib/authProfile'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DashboardPage from './pages/DashboardPage'
import GroupPage from './pages/GroupPage'
import ErrorBoundary from './components/ErrorBoundary'

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (session) {
        syncCurrentUserProfile().catch(error => {
          console.error('Unable to sync existing user profile:', error)
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (event === 'SIGNED_IN' && session) {
        syncCurrentUserProfile().catch(error => {
          console.error('Unable to sync signed-in user profile:', error)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="app-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark border-t-transparent" />
          <p className="font-semibold text-dark">Loading SyncUp...</p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '16px',
              background: '#1E2430',
              color: '#fff',
              fontSize: '14px',
              boxShadow: '0 16px 45px rgba(31, 41, 55, 0.24)',
            },
            success: { iconTheme: { primary: '#93D365', secondary: '#1E2430' } },
            error: { iconTheme: { primary: '#EB5A5A', secondary: '#1E2430' } },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group/:id"
            element={
              <ProtectedRoute user={user}>
                <GroupPage user={user} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
