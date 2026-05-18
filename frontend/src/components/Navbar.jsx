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
    <nav className="sticky top-0 z-50 px-4 pt-4 sm:px-6">
      <MotionDiv
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`navbar-shell ${isHero ? 'navbar-shell-hero' : 'navbar-shell-light'} max-w-6xl mx-auto`}
      >
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-dark inline-block" />
            <span className="text-dark font-heading font-bold text-lg tracking-tight">SyncUp</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="/#features" className="nav-link">Features</a>
            <a href="/#about" className="nav-link">About</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
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
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-white/60 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`w-5 h-0.5 bg-dark transition-all duration-200 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-dark transition-all duration-200 ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-dark transition-all duration-200 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pt-4 border-t border-dark/10 flex flex-col gap-4 px-2 overflow-hidden"
            >
              <a href="/#features" className="nav-link">Features</a>
              <a href="/#about" className="nav-link">About</a>
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
