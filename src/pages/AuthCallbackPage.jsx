import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { syncCurrentUserProfile } from '../lib/authProfile'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Finishing sign in...')

  useEffect(() => {
    let active = true

    async function completeSignIn() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        }

        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!session) throw new Error('No active session was returned by Google.')

        if (active) setMessage('Preparing your SyncUp workspace...')
        await syncCurrentUserProfile()

        toast.success('Signed in with Google')
        navigate('/dashboard', { replace: true })
      } catch (error) {
        toast.error(error.message || 'Google sign in failed')
        navigate('/login', { replace: true })
      }
    }

    completeSignIn()

    return () => {
      active = false
    }
  }, [navigate])

  return (
    <div className="app-surface flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-dark border-t-transparent" />
        <p className="font-semibold text-dark">{message}</p>
      </div>
    </div>
  )
}
