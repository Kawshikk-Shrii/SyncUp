import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import { apiFetch } from '../lib/api'

const MotionDiv = motion.div

function formatDate(date) {
  if (!date) return 'Unknown date'

  const parsedDate = new Date(date)
  if (Number.isNaN(parsedDate.getTime())) return 'Unknown date'

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCreatedDate(date) {
  const formattedDate = formatDate(date)
  return formattedDate === 'Unknown date' ? formattedDate : `Created ${formattedDate}`
}

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

  const avatarColors = ['#6EA8FE', '#93D365', '#F6B93B', '#B59CFF', '#EB5A5A', '#1E2430']
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0]

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
    <div className="app-surface">
      <Navbar user={user} variant="light" />

      <MotionDiv
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-hero dashboard-hero"
      >
        <div className="page-wrapper flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow mb-3">Dashboard</p>
            <h1 className="text-4xl font-bold text-dark md:text-6xl">Welcome back, {displayName}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
              Manage groups, invite members, and turn scattered availability into a clear meeting plan.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button id="create-group-btn" onClick={openCreate} className="btn-primary">
              Create Group
            </button>
            <button id="join-group-btn" onClick={openJoin} className="btn-secondary">
              Join with ID
            </button>
          </div>
        </div>
      </MotionDiv>

      <div className="page-wrapper py-10">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { label: 'My Groups', value: groups.length, accent: 'bg-blue' },
            { label: 'Quick Actions', value: 2, accent: 'bg-mint' },
            { label: 'Availability', value: loading ? '-' : 'Ready', accent: 'bg-yellow' },
            { label: 'Scheduling', value: 'Auto', accent: 'bg-lavender' },
          ].map((item) => (
            <div key={item.label} className="card p-5">
              <div className={`mb-4 h-1.5 w-12 rounded-full ${item.accent}`} />
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">{item.label}</p>
              <p className="mt-3 text-3xl font-extrabold text-dark">{item.value}</p>
            </div>
          ))}
        </div>

        {(createOpen || joinOpen) && (
          <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {createOpen && (
              <div className="card card-elevated animate-fade-up">
                <h2 className="mb-2 text-3xl font-bold text-dark">Create a New Group</h2>
                <p className="mb-5 text-sm text-muted">Start a fresh planning space and invite people with a shareable group ID.</p>
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
                <h2 className="mb-2 text-3xl font-bold text-dark">Join a Group</h2>
                <p className="mb-5 text-sm text-muted">Paste the full group ID to jump straight into the shared planning space.</p>
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
          <div className="card card-elevated py-16 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-yellow/35 text-lg font-extrabold text-dark">
              Plan
            </div>
            <h3 className="mb-2 text-4xl font-bold text-dark">No groups yet</h3>
            <p className="mx-auto mb-6 max-w-md text-muted">
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
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg text-xl font-bold text-white shadow-sm"
                    style={{ backgroundColor: avatarColors[index % avatarColors.length] }}
                  >
                    {groupNameValue.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="mb-1 truncate text-3xl font-bold text-dark">{groupNameValue}</h3>
                  <p className="mb-4 text-xs text-muted">
                    ID: <span className="font-mono">{group.id.slice(0, 8)}...</span>
                  </p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{formatCreatedDate(group.created_at)}</span>
                    <span className="font-bold text-dark/50 transition-transform duration-300 group-hover:translate-x-1">View</span>
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
