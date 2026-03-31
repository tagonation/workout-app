import { useState, useEffect, useRef } from 'react'

const R = 54
const CIRC = 2 * Math.PI * R

function playBeep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.5, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 1)
  } catch {}
}

export default function Timer({ hasNav }) {
  const [open, setOpen] = useState(false)
  const [minutes, setMinutes] = useState(10)
  const [total, setTotal] = useState(600)
  const [remaining, setRemaining] = useState(600)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            setFinished(true)
            playBeep()
            return 0
          }
          return r - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running])

  const setDuration = (min) => {
    if (running) return
    setMinutes(min)
    const secs = min * 60
    setTotal(secs)
    setRemaining(secs)
    setFinished(false)
  }

  const start = () => {
    if (finished) {
      setRemaining(total)
      setFinished(false)
    }
    setRunning(true)
  }
  const pause = () => setRunning(false)
  const reset = () => {
    setRunning(false)
    setFinished(false)
    setRemaining(total)
  }

  const progress = total > 0 ? remaining / total : 1
  const dashOffset = CIRC * (1 - progress)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')

  const ringColor = finished ? '#6abf7a' : running ? '#e8956d' : '#e8956d'
  const bottomClass = hasNav ? 'bottom-24' : 'bottom-6'

  return (
    <>
      {/* Floating pill */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-4 ${bottomClass} z-30 shadow-lg active:scale-95 transition-transform flex items-center justify-center
            ${running || finished
              ? 'h-10 px-4 rounded-full bg-white border-2 border-[#e8956d] gap-2'
              : 'w-12 h-12 rounded-full bg-white border-2 border-[#ede8e1]'
            }`}
        >
          {running ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-[#e8956d] animate-pulse" />
              <span className="text-sm font-bold text-[#e8956d] tabular-nums">{mm}:{ss}</span>
            </>
          ) : finished ? (
            <span className="text-sm font-bold text-[#6abf7a]">✓ {mm}:{ss}</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e8956d" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          )}
        </button>
      )}

      {/* Timer sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-[480px] bg-white rounded-t-3xl border border-[#ede8e1] shadow-xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[#ede8e1] rounded-full" />
            </div>

            <div className="px-6 pt-1 pb-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#1a1511]">Timer</h2>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Analog ring + digital display */}
              <div className="flex justify-center mb-5">
                <div className="relative w-44 h-44">
                  <svg width="176" height="176" viewBox="0 0 128 128">
                    {/* Tick marks */}
                    {Array.from({ length: 60 }, (_, i) => {
                      const angle = (i / 60) * 360 - 90
                      const rad = (angle * Math.PI) / 180
                      const isMajor = i % 5 === 0
                      const r1 = isMajor ? 58 : 60
                      const r2 = 63
                      return (
                        <line
                          key={i}
                          x1={64 + r1 * Math.cos(rad)}
                          y1={64 + r1 * Math.sin(rad)}
                          x2={64 + r2 * Math.cos(rad)}
                          y2={64 + r2 * Math.sin(rad)}
                          stroke={i % 5 === 0 ? '#d4c4b8' : '#ede8e1'}
                          strokeWidth={isMajor ? 1.5 : 1}
                          strokeLinecap="round"
                        />
                      )
                    })}
                    {/* Track */}
                    <circle cx="64" cy="64" r={R} fill="none" stroke="#f5f0ea" strokeWidth="9"/>
                    {/* Progress arc */}
                    <circle
                      cx="64" cy="64" r={R}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeDasharray={CIRC}
                      strokeDashoffset={dashOffset}
                      transform="rotate(-90 64 64)"
                      style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease' }}
                    />
                    {/* Center dot */}
                    <circle cx="64" cy="64" r="3" fill={ringColor}/>
                  </svg>

                  {/* Digital time overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold tabular-nums tracking-tight ${
                      finished ? 'text-[#6abf7a]' : 'text-[#1a1511]'
                    }`}>
                      {mm}:{ss}
                    </span>
                    <span className="text-xs text-[#a89888] mt-0.5">
                      {finished ? 'Fertig!' : `${minutes} min`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Slider */}
              <div className="mb-6 px-1">
                <div className="flex justify-between text-xs text-[#a89888] mb-2">
                  <span>1 min</span>
                  <span className="font-semibold text-[#6b5d52]">{minutes} Minuten</span>
                  <span>60 min</span>
                </div>
                <input
                  type="range"
                  min="1" max="60" step="1"
                  value={minutes}
                  disabled={running}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-50"
                  style={{ accentColor: '#e8956d' }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="w-12 h-12 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52] active:opacity-70"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                </button>

                <button
                  onClick={running ? pause : start}
                  className="flex-1 h-12 rounded-full bg-[#e8956d] text-white font-semibold text-sm active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
                >
                  {running ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <rect x="6" y="4" width="4" height="16" rx="1"/>
                        <rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                      Pause
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      {finished ? 'Nochmal' : remaining < total ? 'Weiter' : 'Start'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
