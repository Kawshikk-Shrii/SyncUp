import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { apiFetch } from '../lib/api'

const MotionDiv = motion.div

function formatMessageTime(value) {
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    day: 'numeric',
    month: 'short',
  }).format(date)
}

export default function GroupChat({ groupId, currentUserId }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const loadMessages = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    }

    try {
      const data = await apiFetch(`/groups/${groupId}/messages`)
      setMessages(data.messages || [])
    } catch (error) {
      if (!silent) {
        toast.error(error.message || 'Failed to load chat')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [groupId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadMessages({ silent: true })
        }
      )
      .subscribe()

    const interval = window.setInterval(() => {
      loadMessages({ silent: true })
    }, 12000)

    return () => {
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [groupId, loadMessages])

  const canSend = useMemo(() => content.trim().length > 0 && !sending, [content, sending])

  const handleSend = async (event) => {
    event.preventDefault()
    if (!content.trim()) return

    setSending(true)

    try {
      const data = await apiFetch(`/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim() }),
      })

      setMessages(previous => [...previous, data.message])
      setContent('')
    } catch (error) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card card-elevated h-full flex flex-col min-h-[560px]">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-bold text-dark text-lg">Group Chat</h2>
          <p className="text-dark/55 text-sm mt-1">Slack-lite conversation for this group only.</p>
        </div>
        <span className="btn-chip">Live</span>
      </div>

      <div className="chat-shell flex-1 overflow-hidden flex flex-col">
        <div className="chat-messages flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="chat-skeleton">
                  <div className="skeleton-line h-10 w-10 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-line h-4 w-28 rounded-lg" />
                    <div className="skeleton-line h-12 w-full rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="availability-empty h-full flex items-center justify-center text-center">
              No messages yet. Start the plan with a quick “When works for everyone?”
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <MotionDiv
                  key={message.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className={`chat-row ${message.user_id === currentUserId || message.is_current_user ? 'chat-row-own' : ''}`}
                >
                  <div className={`chat-avatar ${message.user_id === currentUserId || message.is_current_user ? 'chat-avatar-own' : ''}`}>
                    {(message.sender_name || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div className={`chat-bubble ${message.user_id === currentUserId || message.is_current_user ? 'chat-bubble-own' : ''}`}>
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark/55">
                        {message.user_id === currentUserId || message.is_current_user ? 'You' : message.sender_name}
                      </p>
                      <span className="text-[11px] text-dark/40">{formatMessageTime(message.created_at)}</span>
                    </div>
                    <p className="text-sm text-dark/85 leading-relaxed whitespace-pre-wrap break-words">{message.message}</p>
                  </div>
                </MotionDiv>
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="pt-4 mt-4 border-t border-[#dcefdc]">
          <div className="chat-input-shell">
            <textarea
              rows={2}
              className="chat-input"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Send a message to the group..."
              maxLength={1000}
            />
            <button type="submit" disabled={!canSend} className="btn-primary">
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
