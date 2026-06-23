import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import { syncCurrentUserProfile } from '../lib/authProfile'
import GoogleAuthButton from '../components/GoogleAuthButton'
import toast from 'react-hot-toast'

const MotionDiv = motion.div

export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (event) => {
    event.preventDefault()

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      toast.error(error.message)
    } else {
      if (data.session) {
        try {
          await syncCurrentUserProfile()
        } catch (syncError) {
          console.error('Unable to sync user profile:', syncError)
        }
      }
      toast.success('Account created. You can start planning right away.')
      navigate('/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="app-surface flex flex-col">
      <div className="px-6 py-3">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-dark text-sm font-extrabold text-white">S</span>
          <span className="font-heading text-2xl font-bold tracking-tight text-dark">SyncUp</span>
        </Link>
      </div>

      <div className="flex flex-1 items-start justify-center px-6 pb-4 pt-0 sm:pt-0">
        <MotionDiv
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="auth-card"
        >
          <div className="mb-8">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-mint text-dark shadow-card">
              <span className="text-sm font-extrabold">GO</span>
            </div>
            <p className="eyebrow mb-3">Get started</p>
            <h1 className="mb-2 text-4xl font-bold text-dark">Create your account</h1>
            <p className="text-sm text-muted">Set up SyncUp and bring your whole group into one planning space.</p>
          </div>

          <div className="mb-6">
            <GoogleAuthButton />
            <div className="mt-5 flex items-center gap-3 text-xs font-extrabold uppercase tracking-wide text-muted/70">
              <span className="h-px flex-1 bg-[#E5D7B7]" />
              <span>or</span>
              <span className="h-px flex-1 bg-[#E5D7B7]" />
            </div>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-muted">Full Name</label>
              <input
                id="signup-name"
                type="text"
                className="input"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-muted">Email</label>
              <input
                id="signup-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-muted">Password</label>
              <input
                id="signup-password"
                type="password"
                className="input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 justify-center py-3 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-dark font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </MotionDiv>
      </div>
    </div>
  )
}
