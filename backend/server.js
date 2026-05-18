require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes         = require('./routes/auth')
const groupRoutes        = require('./routes/groups')
const availabilityRoutes = require('./routes/availability')
const scheduleRoutes     = require('./routes/schedule')
const chatRoutes         = require('./routes/chat')

const app = express()
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// ── Middleware ──────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}))
app.use(express.json())

// ── Request logger ──────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})

// ── Routes ──────────────────────────────────────────
app.use('/', authRoutes)          // POST /signup, POST /login
app.use('/', groupRoutes)         // GET /groups, POST /create-group, POST /join-group
app.use('/', availabilityRoutes)  // POST /add-availability, GET /availability/:group_id
app.use('/', scheduleRoutes)      // GET /schedule/:group_id
app.use('/', chatRoutes)          // GET/POST /groups/:groupId/messages

// ── Health check ────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'SyncUp API', time: new Date().toISOString() }))

// ── 404 handler ─────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// ── Error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 SyncUp API running on http://localhost:${PORT}`)
  console.log(`📡 Accepting requests from: ${FRONTEND_URL}\n`)
})
