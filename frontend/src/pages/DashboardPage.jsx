import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { apiFetch } from '../lib/api'
import { formatDisplayDate } from '../lib/date'

const MotionDiv = motion.div

function GroupSkeleton() {
  return (
    <div className="card card-elevated overflow-hidden">
      <div className="skeleton-line w-12 h-12 rounded-xl mb-5" />
      <div className="skeleton-line h-5 w-2/3 mb-2 rounded-lg" />
      <div className="skeleton-line h-3 w-1/3 rounded-lg" />
      <div className="skeleton-line h-3 w-1/2 rounded-lg mt-6" />
    </div>
  )
}

export default function DashboardPage({ user }) {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [joinId, setJoinId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const avatarColors = ['#6ee89a', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#60a5fa']

  const fetchGroups = async () => {
    setLoading(true)
    try {
      const data = await apiFetch('/groups')
      setGroups(data.groups || [])
    } catch (error) {
      toast.error(error.message || 'Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleCreateGroup = async (event) => {
    event.preventDefault()
    if (!groupName.trim()) return

    setSubmitting(true)
    try {
      const data = await apiFetch('/create-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() }),
      })

      toast.success(`Group "${data.group?.name || groupName}" created`)
      setGroupName('')
      setCreateOpen(false)
      await fetchGroups()
    } catch (error) {
      toast.error(error.message || 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoinGroup = async (event) => {
    event.preventDefault()
    if (!joinId.trim()) return

    setSubmitting(true)
    try {
      await apiFetch('/join-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: joinId.trim() }),
      })

      toast.success('Joined group successfully')
      setJoinId('')
      setJoinOpen(false)
      await fetchGroups()
    } catch (error) {
      toast.error(error.message || 'Failed to join group')
    } finally {
      setSubmitting(false)
    }
  }

  const openCreate = () => {
    setCreateOpen(true)
    setJoinOpen(false)
  }

  const openJoin = () => {
    setJoinOpen(true)
    setCreateOpen(false)
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar user={user} variant="light" />

      <MotionDiv
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-hero px-6 py-10"
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-dark/60 text-sm font-medium mb-1">
            Hello, {user?.user_metadata?.full_name || user?.email?.split('@')[0]}
          </p>
          <h1 className="text-3xl font-extrabold text-dark">Your Groups</h1>
          <p className="text-dark/60 mt-2 max-w-2xl">
            Manage trips, compare availability, and keep planning momentum without losing the original SyncUp feel.
          </p>
        </div>
      </MotionDiv>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap gap-3 mb-8">
          <button id="create-group-btn" onClick={openCreate} className="btn-primary">
            + Create Group
          </button>
          <button id="join-group-btn" onClick={openJoin} className="btn-secondary">
            Join with ID
          </button>
        </div>

        {(createOpen || joinOpen) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {createOpen && (
              <div className="card card-elevated animate-fade-up">
                <h2 className="font-bold text-dark text-lg mb-2">Create a New Group</h2>
                <p className="text-dark/55 text-sm mb-5">Start a fresh planning space and invite people with a shareable group ID.</p>
                <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                  <input
                    id="group-name-input"
                    type="text"
                    className="input"
                    placeholder="Weekend Trip, Team Lunch, Goa Escape..."
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                      {submitting ? 'Creating...' : 'Create Group'}
                    </button>
                    <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {joinOpen && (
              <div className="card card-elevated animate-fade-up">
                <h2 className="font-bold text-dark text-lg mb-2">Join a Group</h2>
                <p className="text-dark/55 text-sm mb-5">Paste the full group ID to jump straight into the shared planning space.</p>
                <form onSubmit={handleJoinGroup} className="flex flex-col gap-3">
                  <input
                    id="join-id-input"
                    type="text"
                    className="input"
                    placeholder="Paste Group ID"
                    value={joinId}
                    onChange={(event) => setJoinId(event.target.value)}
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
                      {submitting ? 'Joining...' : 'Join Group'}
                    </button>
                    <button type="button" onClick={() => setJoinOpen(false)} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => <GroupSkeleton key={item} />)}
          </div>
        ) : groups.length === 0 ? (
          <div className="card card-elevated text-center py-16">
            <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
              Plan
            </div>
            <h3 className="text-xl font-bold text-dark mb-2">No groups yet</h3>
            <p className="text-dark/60 mb-6 max-w-md mx-auto">
              Create your first SyncUp group or join one with an invite ID to start collecting availability.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={openCreate} className="btn-primary">Create Your First Group</button>
              <button onClick={openJoin} className="btn-secondary">Join with ID</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => {
              const groupNameValue = group.group_name || group.name || 'Untitled Group'

              return (
                <MotionDiv
                  key={group.id}
                  id={`group-card-${group.id}`}
                  onClick={() => navigate(`/group/${group.id}`)}
                  className="group-card group"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold mb-4 shadow-sm"
                    style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                  >
                    {groupNameValue.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="font-bold text-dark text-lg mb-1 truncate">{groupNameValue}</h3>
                  <p className="text-dark/50 text-xs mb-4">
                    ID: <span className="font-mono">{group.id.slice(0, 8)}...</span>
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-dark/50">{formatDisplayDate(group.created_at)}</span>
                    <span className="text-dark/40 transition-transform duration-300 group-hover:translate-x-1">View</span>
                  </div>
                </MotionDiv>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
