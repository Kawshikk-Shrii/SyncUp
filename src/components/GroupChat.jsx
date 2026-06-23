import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabaseClient'
import { apiFetch } from '../lib/api'

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
  const messagesRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

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
    if (!shouldStickToBottomRef.current) return

    const messagesElement = messagesRef.current
    if (!messagesElement) return

    messagesElement.scrollTop = messagesElement.scrollHeight
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
      shouldStickToBottomRef.current = true
      setContent('')
    } catch (error) {
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card card-elevated flex h-full min-h-[560px] flex-col">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-dark">Group Chat</h2>
          <p className="mt-1 text-sm text-muted">Slack-lite conversation for this group only.</p>
        </div>
        <span className="btn-chip">Live</span>
      </div>

      <div className="chat-shell flex flex-1 flex-col overflow-hidden">
        <div
          ref={messagesRef}
          onScroll={(event) => {
            const element = event.currentTarget
            const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight
            shouldStickToBottomRef.current = distanceFromBottom < 80
          }}
          className="chat-messages flex-1 overflow-y-auto pr-1"
        >
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="chat-skeleton">
                  <div className="skeleton-line h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-line h-4 w-28 rounded-lg" />
                    <div className="skeleton-line h-12 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="availability-empty flex h-full items-center justify-center text-center">
              No messages yet. Start the plan with a quick "When works for everyone?"
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`chat-row ${message.user_id === currentUserId || message.is_current_user ? 'chat-row-own' : ''}`}
                >
                  <div className={`chat-avatar ${message.user_id === currentUserId || message.is_current_user ? 'chat-avatar-own' : ''}`}>
                    {(message.sender_name || 'M').charAt(0).toUpperCase()}
                  </div>
                  <div className={`chat-bubble ${message.user_id === currentUserId || message.is_current_user ? 'chat-bubble-own' : ''}`}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-muted">
                        {message.user_id === currentUserId || message.is_current_user ? 'You' : message.sender_name}
                      </p>
                      <span className="text-[11px] text-muted">{formatMessageTime(message.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-dark/85">{message.message}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <form onSubmit={handleSend} className="mt-4 border-t border-dark/10 pt-4">
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
