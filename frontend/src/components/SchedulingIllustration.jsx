// Inline SVG scheduling illustration matching the reference screenshot
// Concentric rings + calendar icon + floating UI badges + avatar dots
export default function SchedulingIllustration() {
  return (
    <div className="relative w-full max-w-[420px] h-[340px] flex items-center justify-center select-none">
      {/* Outermost ring */}
      <div className="absolute w-[320px] h-[320px] rounded-full border border-dark/10" />
      {/* Middle ring */}
      <div className="absolute w-[230px] h-[230px] rounded-full border border-dark/15" />
      {/* Inner ring */}
      <div className="absolute w-[150px] h-[150px] rounded-full border border-dark/20" />

      {/* Center calendar icon */}
      <div className="relative z-10 w-16 h-16 bg-dark rounded-2xl flex items-center justify-center shadow-lg">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="4" width="18" height="18" rx="3" stroke="#6ee89a" strokeWidth="1.8"/>
          <path d="M3 9h18" stroke="#6ee89a" strokeWidth="1.8"/>
          <path d="M8 2v4M16 2v4" stroke="#6ee89a" strokeWidth="1.8" strokeLinecap="round"/>
          <rect x="7" y="13" width="2" height="2" rx="0.5" fill="#6ee89a"/>
          <rect x="11" y="13" width="2" height="2" rx="0.5" fill="#6ee89a"/>
          <rect x="15" y="13" width="2" height="2" rx="0.5" fill="#6ee89a"/>
          <rect x="7" y="17" width="2" height="2" rx="0.5" fill="#6ee89a"/>
          <rect x="11" y="17" width="2" height="2" rx="0.5" fill="#6ee89a"/>
        </svg>
      </div>

      {/* "Friday 3–5 PM" badge — top right */}
      <div className="absolute top-8 right-4 bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-xs font-semibold text-dark animate-float">
        <span>📅</span>
        <span>Friday 3–5 PM</span>
      </div>

      {/* "3 members free" badge — bottom left */}
      <div className="absolute bottom-12 left-2 bg-white rounded-full px-4 py-2 shadow-card flex items-center gap-2 text-xs font-semibold text-dark" style={{animationDelay:'1s'}}>
        <span className="w-2 h-2 rounded-full bg-[#3acc78] inline-block" />
        <span>3 members free</span>
      </div>

      {/* Avatar badges scattered on rings */}
      {/* Top center */}
      <div className="absolute top-[24px] left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#a78bfa] flex items-center justify-center text-white text-[10px] font-bold shadow">U</div>
      {/* Left middle */}
      <div className="absolute top-1/2 left-[18px] -translate-y-1/2 w-8 h-8 rounded-full bg-[#34d399] flex items-center justify-center text-white text-[10px] font-bold shadow">CD</div>
      {/* Right bottom */}
      <div className="absolute bottom-[38px] right-[22px] w-8 h-8 rounded-full bg-dark flex items-center justify-center text-[#6ee89a] text-[10px] font-bold shadow">AB</div>
      {/* Bottom right far */}
      <div className="absolute bottom-[80px] right-[10px] w-7 h-7 rounded-full bg-[#fbbf24] flex items-center justify-center text-white text-[9px] font-bold shadow">OH</div>
    </div>
  )
}
