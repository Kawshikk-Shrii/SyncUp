import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

const MotionDiv = motion.div

export default function Navbar({ user, variant = 'hero' }) {
  const navigate = useNavigate()
  const isHero = variant === 'hero'
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('Signed out')
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 px-4 pt-3 sm:px-6">
      <MotionDiv
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`navbar-shell ${isHero ? 'navbar-shell-hero' : 'navbar-shell-light'} mx-auto max-w-6xl`}
      >
        <div className="flex min-h-10 items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-dark text-sm font-extrabold text-white shadow-sm">
              S
            </span>
            <span className="font-heading text-2xl font-bold tracking-tight text-dark">SyncUp</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <a href="/#features" className="nav-link">Features</a>
            <a href="/#about" className="nav-link">How it works</a>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <button onClick={handleSignOut} className="btn-primary">Sign Out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Sign in</Link>
                <Link to="/signup" className="btn-primary">Create Group</Link>
              </>
            )}
          </div>

          <button
            className="flex flex-col gap-1.5 rounded-xl p-2 transition-colors hover:bg-white/60 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`h-0.5 w-5 bg-dark transition-all duration-200 ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`h-0.5 w-5 bg-dark transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`h-0.5 w-5 bg-dark transition-all duration-200 ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-col gap-4 overflow-hidden border-t border-dark/10 px-2 pt-4 md:hidden"
            >
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#about" className="nav-link">How it works</a>
              {user ? (
                <>
                  <Link to="/dashboard" className="nav-link">Dashboard</Link>
                  <button onClick={handleSignOut} className="btn-primary w-fit">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="nav-link">Sign in</Link>
                  <Link to="/signup" className="btn-primary w-fit">Create Group</Link>
                </>
              )}
            </MotionDiv>
          )}
        </AnimatePresence>
      </MotionDiv>
    </nav>
  )
}
