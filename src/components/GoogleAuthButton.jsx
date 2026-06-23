import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import toast from 'react-hot-toast'

export default function GoogleAuthButton() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data?.url) {
      window.location.assign(data.url)
    } else {
      toast.error('Google sign in is not available yet.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-dark/10 bg-white/80 px-4 py-3 text-sm font-extrabold text-dark shadow-sm transition-all duration-200 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eef4ff] text-sm font-extrabold text-[#4285f4]">
        G
      </span>
      {loading ? 'Connecting to Google...' : 'Continue with Google'}
    </button>
  )
}
