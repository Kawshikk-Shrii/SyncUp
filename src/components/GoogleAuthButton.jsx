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
      className="inline-flex w-full items-center justify-center gap-3 rounded-[20px] border border-[#E5D7B7] bg-white/80 px-4 py-3 text-sm font-extrabold text-dark shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#4285f4]">
        G
      </span>
      {loading ? 'Connecting to Google...' : 'Continue with Google'}
    </button>
  )
}
