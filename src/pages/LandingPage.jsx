import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import SchedulingIllustration from '../components/SchedulingIllustration'

const MotionDiv = motion.div

function Icon({ type }) {
  const icons = {
    users: (
      <>
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
        <path d="M9.5 10.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M21 20v-1.2a3.5 3.5 0 0 0-2.7-3.4" />
        <path d="M16.5 4a3.5 3.5 0 0 1 0 6.8" />
      </>
    ),
    calendar: (
      <>
        <path d="M7 3v3M17 3v3" />
        <path d="M4 8h16" />
        <rect x="4" y="5" width="16" height="16" rx="3" />
        <path d="M8 12h3M13 12h3M8 16h3" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
    spark: (
      <>
        <path d="M12 3 10.2 8.2 5 10l5.2 1.8L12 17l1.8-5.2L19 10l-5.2-1.8L12 3Z" />
        <path d="m19 15-.8 2.2L16 18l2.2.8L19 21l.8-2.2L22 18l-2.2-.8L19 15Z" />
      </>
    ),
    map: (
      <>
        <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" />
        <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" />
      </>
    ),
  }

  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {icons[type]}
      </g>
    </svg>
  )
}

const features = [
  {
    icon: 'users',
    title: 'Create Groups',
    desc: 'Start a group and invite members using a unique group ID.',
    color: 'bg-[#d9f2ff]',
  },
  {
    icon: 'calendar',
    title: 'Share Availability',
    desc: 'Members can add their available date and time ranges in a structured way.',
    color: 'bg-[#dff8e8]',
  },
  {
    icon: 'clock',
    title: 'Find Common Slots',
    desc: 'SyncUp automatically compares availability and finds the best overlapping free time.',
    color: 'bg-[#ffe2d3]',
  },
  {
    icon: 'spark',
    title: 'Smart Suggestions',
    desc: 'Get lightweight meetup ideas based on date, season, and context.',
    color: 'bg-[#e4ddff]',
  },
]

const steps = [
  'Create a group',
  'Invite your members',
  'Add availability',
  'Get the best meeting time',
]

export default function LandingPage({ user }) {
  const joinTarget = user ? '/dashboard' : '/login'

  return (
    <div className="min-h-screen bg-[#fff8ec]">
      <div className="relative overflow-hidden">
        <div className="absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-[#d9f2ff]/80 blur-3xl" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-[#ffe2d3]/80 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-80 w-80 rounded-full bg-[#dff8e8]/80 blur-3xl" />

        <Navbar user={user} variant="hero" />

        <section className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 pb-20 pt-12 lg:flex-row lg:pb-28 lg:pt-16">
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="max-w-2xl flex-1 text-center lg:text-left"
          >
            <div className="section-badge mb-6">
              <Icon type="calendar" />
              <span>Student-friendly scheduling for groups and teams</span>
            </div>

            <h1 className="mb-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-dark sm:text-6xl lg:text-[4rem]">
              Find places that work for everyone
            </h1>

            <p className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-dark/70 lg:mx-0">
              Share your group&apos;s locations and SyncUp suggests hangout spots near, between, and around everyone.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link to="/signup" id="hero-cta" className="btn-primary justify-center px-7 py-3.5 text-base">
                Create Your First Group
              </Link>
              <Link to={joinTarget} className="btn-secondary justify-center px-7 py-3.5 text-base">
                Join with Group ID
              </Link>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex w-full flex-1 justify-center lg:justify-end"
          >
            <SchedulingIllustration />
          </MotionDiv>
        </section>
      </div>

      <section id="features" className="bg-[#fffdf7] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted">Features</p>
            <h2 className="text-4xl font-extrabold leading-tight text-dark md:text-5xl">
              A calmer way to get everyone on the same calendar.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <MotionDiv
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className={`${feature.color} rounded-3xl p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover`}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-dark shadow-sm">
                  <Icon type={feature.icon} />
                </div>
                <h3 className="mb-2 text-xl font-extrabold text-dark">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-dark/65">{feature.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-[#fff8ec] py-20 lg:py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted">How It Works</p>
            <h2 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight text-dark md:text-5xl">
              From group chat chaos to a clear plan in four steps.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <MotionDiv
                key={step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="rounded-3xl border border-white/80 bg-white/75 p-6 shadow-card backdrop-blur"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark font-extrabold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-extrabold text-dark">{step}</h3>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf7] px-6 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 rounded-[32px] bg-dark p-8 text-center shadow-[0_24px_60px_rgba(26,46,26,0.2)] md:flex-row md:p-10 md:text-left">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/65">
              <Icon type="map" />
              Ready when your group is
            </p>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">Start planning your next meetup.</h2>
          </div>
          <Link to="/signup" id="cta-banner-btn" className="btn-primary justify-center bg-white px-7 py-3.5 text-base text-dark hover:bg-[#f5f5f0]">
            Create Your First Group
          </Link>
        </div>
      </section>

      <footer className="bg-[#fff8ec] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 border-t border-dark/10 pt-8 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-hero" />
            <span className="font-bold text-dark">SyncUp</span>
          </div>
          <p className="text-sm text-dark/45">&copy; 2026 SyncUp. Plan together, effortlessly.</p>
        </div>
      </footer>
    </div>
  )
}
