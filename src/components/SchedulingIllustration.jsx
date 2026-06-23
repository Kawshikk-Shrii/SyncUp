function Avatar({ initials, className }) {
  return (
    <span className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white text-xs font-extrabold text-white shadow-sm ${className}`}>
      {initials}
    </span>
  )
}

function TimeBlock({ day, time, color, width = 'w-full' }) {
  return (
    <div className={`${width} rounded-lg ${color} px-3 py-2`}>
      <p className="text-[11px] font-bold text-dark/70">{day}</p>
      <p className="text-sm font-extrabold text-dark">{time}</p>
    </div>
  )
}

export default function SchedulingIllustration() {
  return (
    <div className="relative w-full max-w-[520px]">
      <div className="relative overflow-hidden rounded-lg border border-dark/10 bg-card/80 p-4 shadow-[0_28px_70px_rgba(31,41,55,0.14)] backdrop-blur">
        <div className="rounded-lg bg-light p-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-dark/45">SyncUp Preview</p>
              <h3 className="mt-1 text-3xl font-bold text-dark">Design Club Meetup</h3>
            </div>
            <div className="rounded-lg bg-white px-3 py-2 text-right shadow-card">
              <p className="text-[11px] font-bold text-dark/45">Group ID</p>
              <p className="font-mono text-sm font-extrabold text-dark">A7K9</p>
            </div>
          </div>

          <div className="mb-5 flex items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-card">
            <div className="flex -space-x-3">
              <Avatar initials="AK" className="bg-blue" />
              <Avatar initials="MN" className="bg-mint" />
              <Avatar initials="RS" className="bg-coral" />
              <Avatar initials="JP" className="bg-lavender" />
            </div>
            <div className="rounded-md bg-yellow/25 px-4 py-2 text-sm font-bold text-dark">
              4 members invited
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-3">
              <TimeBlock day="Mon" time="3:00-5:00" color="bg-blue/25" />
              <TimeBlock day="Tue" time="1:30-4:00" color="bg-lavender/35" width="w-10/12" />
              <TimeBlock day="Wed" time="4:00-6:00" color="bg-mint/35" width="w-11/12" />
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-dark p-4 text-white shadow-card">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/55">Best slot</p>
                <p className="mt-2 text-xl font-extrabold leading-tight">Wed<br />4 PM</p>
              </div>
              <div className="rounded-lg bg-coral/20 p-4">
                <svg className="mb-2 h-6 w-6 text-dark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <p className="text-sm font-extrabold text-dark">Cafe nearby</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-white p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-dark">Availability match</p>
              <p className="text-sm font-extrabold text-[#15803d]">92%</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-[#eef3eb]">
              <div className="h-full w-[92%] rounded-full bg-mint" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
