import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'
import SchedulingIllustration from '../components/SchedulingIllustration'

const MotionDiv = motion.div

const features = [
  {
    icon: '👥',
    title: 'Create Groups',
    desc: 'Create a scheduling group and invite everyone with one shareable ID.',
  },
  {
    icon: '📅',
    title: 'Add Availability',
    desc: 'Each member picks their free dates and time ranges without endless back-and-forth.',
  },
  {
    icon: '⏰',
    title: 'Find Common Time',
    desc: 'SyncUp instantly finds the overlap when everyone is actually free.',
  },
  {
    icon: '🗺️',
    title: 'Smart Recommendations',
    desc: 'Once you have a date, SyncUp suggests the best seasonal places to go.',
  },
]

export default function LandingPage({ user }) {
  return (
    <div className="min-h-screen">
      <div className="bg-hero">
        <Navbar user={user} variant="hero" />

        <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col md:flex-row items-center gap-12">
          <MotionDiv
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex-1 max-w-lg"
          >
            <div className="section-badge mb-6">
              {/* <span className="w-4 h-4">+</span> */}
              <span>Travel planning for groups, clubs, and friend circles</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-dark leading-[1.05] mb-4">
              Plan Together,
              <br />
              <span className="text-muted font-extrabold">Without the chaos.</span>
            </h1>

            <p className="text-dark/70 text-lg leading-relaxed mb-8 max-w-md">
              SyncUp helps groups find the right day, the right time, and even the right place in one polished travel-first flow.
            </p>

            <div className="flex items-center gap-5 flex-wrap">
              <Link to="/signup" id="hero-cta" className="btn-primary text-base px-7 py-3">
                Get Started
              </Link>
              <a href="#features" className="btn-ghost text-base">See how it works</a>
            </div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex-1 flex justify-center md:justify-end"
          >
            <SchedulingIllustration />
          </MotionDiv>
        </section>
      </div>

      <section id="features" className="bg-light py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">Features</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark max-w-2xl mx-auto leading-tight">
              Everything your group
              <br />
              needs to sync up.
            </h2>
            <p className="text-dark/60 mt-4 text-lg max-w-xl mx-auto">
              From group creation to common slots to travel-ready recommendations, the workflow stays smooth.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <MotionDiv
                key={feature.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="card-mint rounded-2xl p-6 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-sm font-bold mb-4 shadow-sm text-dark">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-dark text-lg mb-2">{feature.title}</h3>
                <p className="text-dark/60 text-sm leading-relaxed">{feature.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-muted mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-dark leading-tight">
              Three steps to your
              <br />
              perfect meeting time.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create a Group', desc: 'Name the group and share the unique Group ID with everyone.' },
              { step: '02', title: 'Add Availability', desc: 'Each member adds free dates and time slots in seconds.' },
              { step: '03', title: 'Find the Overlap', desc: 'SyncUp reveals the shared window and suggests where to go.' },
            ].map((item, index) => (
              <MotionDiv
                key={item.step}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="flex flex-col gap-4"
              >
                <span className="text-6xl font-black text-hero">{item.step}</span>
                <h3 className="text-xl font-bold text-dark">{item.title}</h3>
                <p className="text-dark/60 leading-relaxed">{item.desc}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-hero py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-dark mb-4">
            Ready to stop the scheduling chaos?
          </h2>
          <p className="text-dark/70 text-lg mb-8 max-w-md mx-auto">
            Create your first group for free and start planning with a cleaner, faster shared flow.
          </p>
          <Link to="/signup" id="cta-banner-btn" className="btn-primary text-base px-8 py-3.5">
            Create a Group for Free
          </Link>
        </div>
      </section>

      <footer className="bg-dark py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-hero inline-block" />
            <span className="text-white font-bold">SyncUp</span>
          </div>
          <p className="text-white/40 text-sm">© 2026 SyncUp. Plan together, effortlessly.</p>
        </div>
      </footer>
    </div>
  )
}
