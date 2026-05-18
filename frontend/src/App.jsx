import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
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
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-dark border-t-transparent animate-spin" />
          <p className="text-dark font-semibold">Loading SyncUp…</p>
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
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '16px',
              background: '#1a2e1a',
              color: '#fff',
              fontSize: '14px',
              boxShadow: '0 16px 45px rgba(26, 46, 26, 0.24)',
            },
            success: { iconTheme: { primary: '#6ee89a', secondary: '#1a2e1a' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#1a2e1a' } },
          }}
        />
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
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
