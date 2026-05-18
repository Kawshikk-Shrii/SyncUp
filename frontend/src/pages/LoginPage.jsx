import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const MotionDiv = motion.div

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Welcome back to SyncUp')
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <div className="bg-hero px-6 py-4">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <span className="w-2.5 h-2.5 rounded-full bg-dark inline-block" />
          <span className="text-dark font-heading font-bold text-lg tracking-tight">SyncUp</span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <MotionDiv
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="auth-card"
        >
          <div className="mb-8">
            <div className="w-12 h-12 bg-hero rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <span className="text-sm font-bold text-dark">IN</span>
            </div>
            <h1 className="text-2xl font-bold text-dark mb-1">Welcome back</h1>
            <p className="text-dark/60 text-sm">Sign in to continue planning with your group.</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">Email</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/70 mb-1.5 uppercase tracking-wide">Password</label>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="Your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary justify-center py-3 mt-2 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-dark/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-dark font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </MotionDiv>
      </div>
    </div>
  )
}
