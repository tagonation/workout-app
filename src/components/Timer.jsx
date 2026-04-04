import { useState, useEffect, useRef, useCallback } from 'react'

const R    = 54
const CIRC = 2 * Math.PI * R

// Simple timer
const LS_END     = 'timer-end-v1'
const LS_TOTAL   = 'timer-total-v1'
const LS_MINUTES = 'timer-minutes-v1'
// Interval timer
const LS_I_START  = 'timer-istart-v1'
const LS_I_CONFIG = 'timer-iconfig-v1'
const LS_I_PAUSE  = 'timer-ipause-v1'
const LS_MODE     = 'timer-mode-v1'

const FANFARE_URL = `${import.meta.env.BASE_URL}assets/Triumphant_brass_fanfare%2C_celebratory_and_uplifting.mp3`

// Compute current interval phase from elapsed seconds
function computePhase(elapsed, work, rest, rounds) {
  const cycleLen = work + rest
  const total    = work * rounds + rest * (rounds - 1)
  if (elapsed >= total) return { done: true }
  const c   = Math.floor(elapsed / cycleLen)
  const pos = elapsed % cycleLen
  if (c >= rounds) return { done: true }
  if (c === rounds - 1 && pos >= work) return { done: true }
  if (pos < work) return { done: false, phase: 'work', round: c + 1, left: work - pos }
  return { done: false, phase: 'rest', round: c + 1, left: work + rest - pos }
}

function fmtSecs(s) {
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60), r = s % 60
  return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`
}

function loadIConfig() {
  try { return JSON.parse(localStorage.getItem(LS_I_CONFIG)) || {} } catch { return {} }
}

export default function Timer({ hasNav }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(() => localStorage.getItem(LS_MODE) || 'simple')

  // ── Simple timer state ─────────────────────────────────────────────────────
  const [minutes, setMinutes]     = useState(() => parseInt(localStorage.getItem(LS_MINUTES) || '10'))
  const [total, setTotal]         = useState(() => parseInt(localStorage.getItem(LS_TOTAL) || '600'))
  const [remaining, setRemaining] = useState(() => {
    const m = localStorage.getItem(LS_MODE)
    if (m === 'interval') {
      const { work = 40 } = loadIConfig()
      return work
    }
    return parseInt(localStorage.getItem(LS_TOTAL) || '600')
  })
  const [running, setRunning]   = useState(false)
  const [finished, setFinished] = useState(false)

  // ── Interval timer state ───────────────────────────────────────────────────
  const cfg = loadIConfig()
  const [iWork,   setIWork]   = useState(cfg.work   || 40)
  const [iRest,   setIRest]   = useState(cfg.rest   || 20)
  const [iRounds, setIRounds] = useState(cfg.rounds || 8)
  const [iPhase,  setIPhase]  = useState('work')
  const [iRound,  setIRound]  = useState(1)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const endTimeRef  = useRef(null)  // simple mode: absolute end timestamp
  const iStartRef   = useRef(null)  // interval mode: virtual start timestamp
  const intervalRef = useRef(null)
  const audioRef    = useRef(null)
  const wakeLockRef = useRef(null)

  // ── Wake Lock ──────────────────────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try { wakeLockRef.current = await navigator.wakeLock.request('screen') } catch {}
  }, [])

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }, [])

  // ── Audio ──────────────────────────────────────────────────────────────────
  const initAudio = useCallback(() => {
    if (audioRef.current) return
    const audio = new Audio(FANFARE_URL)
    audio.preload = 'auto'
    audioRef.current = audio
    audio.volume = 0
    audio.play()
      .then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 1 })
      .catch(() => { audio.volume = 1 })
  }, [])

  const playFanfare = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.volume = 1
    a.currentTime = 0
    a.play().catch(() => {})
  }, [])

  // ── Finish ─────────────────────────────────────────────────────────────────
  const finish = useCallback(() => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    iStartRef.current  = null
    localStorage.removeItem(LS_END)
    localStorage.removeItem(LS_I_START)
    localStorage.removeItem(LS_I_PAUSE)
    setRunning(false)
    setFinished(true)
    setRemaining(0)
    releaseWakeLock()
    playFanfare()
  }, [playFanfare, releaseWakeLock])

  // ── Ticks ──────────────────────────────────────────────────────────────────
  const tickSimple = useCallback(() => {
    if (!endTimeRef.current) return
    const left = Math.round((endTimeRef.current - Date.now()) / 1000)
    if (left <= 0) { finish(); return }
    setRemaining(left)
  }, [finish])

  const tickInterval = useCallback(() => {
    if (!iStartRef.current) return
    const elapsed = (Date.now() - iStartRef.current) / 1000
    const s = computePhase(elapsed, iWork, iRest, iRounds)
    if (s.done) { finish(); return }
    setIPhase(s.phase)
    setIRound(s.round)
    setRemaining(Math.ceil(s.left))
  }, [finish, iWork, iRest, iRounds])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(mode === 'interval' ? tickInterval : tickSimple, 250)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode, tickSimple, tickInterval])

  // ── Resume handler (screen-on / app-restore) ───────────────────────────────
  useEffect(() => {
    const onResume = () => {
      if (document.hidden) return
      if (endTimeRef.current || iStartRef.current) requestWakeLock()
      if (mode === 'simple' && endTimeRef.current) {
        const left = Math.round((endTimeRef.current - Date.now()) / 1000)
        if (left <= 0) finish(); else setRemaining(left)
      }
      if (mode === 'interval' && iStartRef.current) {
        const s = computePhase((Date.now() - iStartRef.current) / 1000, iWork, iRest, iRounds)
        if (s.done) finish()
        else { setIPhase(s.phase); setIRound(s.round); setRemaining(Math.ceil(s.left)) }
      }
    }
    document.addEventListener('visibilitychange', onResume)
    window.addEventListener('pageshow', onResume)
    window.addEventListener('focus', onResume)
    return () => {
      document.removeEventListener('visibilitychange', onResume)
      window.removeEventListener('pageshow', onResume)
      window.removeEventListener('focus', onResume)
    }
  }, [finish, requestWakeLock, mode, iWork, iRest, iRounds])

  // ── Restore on PWA reopen ──────────────────────────────────────────────────
  useEffect(() => {
    // Interval: running
    const iStartSaved = localStorage.getItem(LS_I_START)
    if (iStartSaved) {
      const startMs = parseInt(iStartSaved)
      const elapsed = (Date.now() - startMs) / 1000
      const s = computePhase(elapsed, iWork, iRest, iRounds)
      if (!s.done) {
        setMode('interval'); localStorage.setItem(LS_MODE, 'interval')
        iStartRef.current = startMs
        setIPhase(s.phase); setIRound(s.round); setRemaining(Math.ceil(s.left))
        setRunning(true); requestWakeLock()
        return
      }
      localStorage.removeItem(LS_I_START)
    }
    // Interval: paused
    const iPauseSaved = localStorage.getItem(LS_I_PAUSE)
    if (iPauseSaved) {
      try {
        const { round, phase, rem } = JSON.parse(iPauseSaved)
        setMode('interval'); localStorage.setItem(LS_MODE, 'interval')
        setIRound(round); setIPhase(phase); setRemaining(rem)
      } catch {}
      return
    }
    // Simple: running
    const savedEnd = localStorage.getItem(LS_END)
    if (!savedEnd) return
    const endMs      = parseInt(savedEnd)
    const savedTotal = parseInt(localStorage.getItem(LS_TOTAL) || '600')
    const savedMin   = parseInt(localStorage.getItem(LS_MINUTES) || '10')
    const left       = Math.round((endMs - Date.now()) / 1000)
    setTotal(savedTotal); setMinutes(savedMin)
    if (left > 0) {
      endTimeRef.current = endMs; setRemaining(left); setRunning(true); requestWakeLock()
    } else {
      localStorage.removeItem(LS_END); setFinished(true); setRemaining(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Save interval config ───────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS_I_CONFIG, JSON.stringify({ work: iWork, rest: iRest, rounds: iRounds }))
  }, [iWork, iRest, iRounds])

  // ── Controls ───────────────────────────────────────────────────────────────
  const switchMode = (m) => {
    if (running) return
    setMode(m); localStorage.setItem(LS_MODE, m)
    setFinished(false); setIRound(1); setIPhase('work')
    if (m === 'simple') setRemaining(total)
    else setRemaining(iWork)
  }

  const start = () => {
    initAudio()
    if (mode === 'simple') {
      const secs  = finished ? total : remaining
      const endMs = Date.now() + secs * 1000
      endTimeRef.current = endMs
      localStorage.setItem(LS_END, endMs.toString())
      if (finished) { setRemaining(total); setFinished(false) }
    } else {
      let startMs
      if (finished) {
        startMs = Date.now()
        setIRound(1); setIPhase('work'); setRemaining(iWork); setFinished(false)
      } else {
        // Reconstruct virtual start from paused state
        const posInCycle = iPhase === 'work'
          ? iWork - remaining
          : iWork + iRest - remaining
        const elapsedSecs = (iRound - 1) * (iWork + iRest) + posInCycle
        startMs = Date.now() - elapsedSecs * 1000
      }
      iStartRef.current = startMs
      localStorage.setItem(LS_I_START, startMs.toString())
      localStorage.removeItem(LS_I_PAUSE)
    }
    setRunning(true); requestWakeLock()
  }

  const pause = () => {
    if (mode === 'simple') {
      if (endTimeRef.current)
        setRemaining(Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000)))
      endTimeRef.current = null
      localStorage.removeItem(LS_END)
    } else {
      localStorage.setItem(LS_I_PAUSE, JSON.stringify({ round: iRound, phase: iPhase, rem: remaining }))
      iStartRef.current = null
      localStorage.removeItem(LS_I_START)
    }
    setRunning(false); releaseWakeLock()
  }

  const reset = () => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null; iStartRef.current = null
    localStorage.removeItem(LS_END)
    localStorage.removeItem(LS_I_START)
    localStorage.removeItem(LS_I_PAUSE)
    setRunning(false); setFinished(false)
    if (mode === 'simple') { setRemaining(total) }
    else { setIRound(1); setIPhase('work'); setRemaining(iWork) }
    releaseWakeLock()
  }

  const setDuration = (min) => {
    if (running) return
    const secs = min * 60
    setMinutes(min); setTotal(secs); setRemaining(secs); setFinished(false)
    endTimeRef.current = null
    localStorage.removeItem(LS_END)
    localStorage.setItem(LS_TOTAL, secs.toString())
    localStorage.setItem(LS_MINUTES, min.toString())
  }

  const adjustWork = (d) => {
    if (running) return
    const v = Math.max(5, Math.min(300, iWork + d))
    setIWork(v); setIRound(1); setIPhase('work'); setRemaining(v); setFinished(false)
  }
  const adjustRest = (d) => {
    if (running) return
    setIRest(v => Math.max(5, Math.min(300, v + d)))
    setIRound(1); setIPhase('work'); setRemaining(iWork); setFinished(false)
  }
  const adjustRounds = (d) => {
    if (running) return
    setIRounds(v => Math.max(1, Math.min(30, v + d))); setFinished(false)
  }

  // ── Display ────────────────────────────────────────────────────────────────
  let progress, ringColor, centerLabel, subLabel

  if (mode === 'simple') {
    progress    = total > 0 ? remaining / total : 1
    ringColor   = finished ? '#6abf7a' : '#e8956d'
    centerLabel = finished ? '🎉' : `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`
    subLabel    = finished ? 'Fertig!' : `${minutes} min`
  } else {
    const phaseTotal = iPhase === 'work' ? iWork : iRest
    progress    = finished ? 1 : (phaseTotal > 0 ? remaining / phaseTotal : 1)
    ringColor   = finished ? '#6abf7a' : iPhase === 'work' ? '#e8956d' : '#6ab0cf'
    centerLabel = finished ? '🎉' : `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`
    subLabel    = finished ? 'Fertig!' : `${iPhase === 'work' ? 'Training' : 'Pause'} · ${iRound}/${iRounds}`
  }

  const dashOffset  = CIRC * (1 - progress)
  const mm          = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss          = String(remaining % 60).padStart(2, '0')
  const bottomClass = hasNav ? 'bottom-24' : 'bottom-6'
  const dotColor    = mode === 'interval' && iPhase === 'rest' && running ? '#6ab0cf' : '#e8956d'

  const startLabel = finished ? 'Nochmal'
    : mode === 'simple' ? (remaining < total ? 'Weiter' : 'Start')
    : (iRound > 1 || iPhase !== 'work' || remaining < iWork ? 'Weiter' : 'Start')

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-4 ${bottomClass} z-30 shadow-md active:scale-95 transition-transform flex items-center justify-center
            ${running || finished
              ? 'h-10 px-3.5 rounded-full bg-white border-2 gap-1.5'
              : 'w-12 h-12 rounded-full bg-white border-2 border-[#ede8e1]'}`}
          style={running || finished ? { borderColor: dotColor } : {}}
        >
          {running ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: dotColor }} />
              <span className="text-sm font-bold tabular-nums" style={{ color: dotColor }}>{mm}:{ss}</span>
            </>
          ) : finished ? (
            <span className="text-lg">🎉</span>
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
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-[#ede8e1] rounded-full" />
            </div>

            <div className="px-6 pt-1 pb-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#1a1511]">Timer</h2>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Mode toggle */}
              <div className="flex bg-[#f5f0ea] rounded-xl p-1 mb-5">
                {['simple', 'interval'].map(m => (
                  <button key={m}
                    onClick={() => switchMode(m)}
                    disabled={running}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50
                      ${mode === m ? 'bg-white text-[#1a1511] shadow-sm' : 'text-[#a89888]'}`}
                  >
                    {m === 'simple' ? 'Einfach' : 'Intervall'}
                  </button>
                ))}
              </div>

              {/* Ring */}
              <div className="flex justify-center mb-5">
                <div className="relative w-44 h-44">
                  <svg width="176" height="176" viewBox="0 0 128 128">
                    {Array.from({ length: 60 }, (_, i) => {
                      const angle = (i / 60) * 360 - 90
                      const rad   = (angle * Math.PI) / 180
                      const isMajor = i % 5 === 0
                      const r1 = isMajor ? 58 : 60
                      return (
                        <line key={i}
                          x1={64 + r1 * Math.cos(rad)} y1={64 + r1 * Math.sin(rad)}
                          x2={64 + 63 * Math.cos(rad)} y2={64 + 63 * Math.sin(rad)}
                          stroke={isMajor ? '#d4c4b8' : '#ede8e1'}
                          strokeWidth={isMajor ? 1.5 : 1} strokeLinecap="round"
                        />
                      )
                    })}
                    <circle cx="64" cy="64" r={R} fill="none" stroke="#f5f0ea" strokeWidth="9"/>
                    <circle cx="64" cy="64" r={R}
                      fill="none" stroke={ringColor} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={CIRC} strokeDashoffset={dashOffset}
                      transform="rotate(-90 64 64)"
                      style={{ transition: running ? 'stroke-dashoffset 0.25s linear' : 'stroke-dashoffset 0.3s ease' }}
                    />
                    <circle cx="64" cy="64" r="3" fill={ringColor}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold tabular-nums tracking-tight ${finished ? 'text-[#6abf7a]' : 'text-[#1a1511]'}`}>
                      {centerLabel}
                    </span>
                    <span className="text-xs mt-1" style={{ color: ringColor }}>{subLabel}</span>
                  </div>
                </div>
              </div>

              {/* Config */}
              {mode === 'simple' ? (
                <div className="mb-6 px-1">
                  <div className="flex justify-between text-xs text-[#a89888] mb-2">
                    <span>1 min</span>
                    <span className="font-semibold text-[#6b5d52]">{minutes} Minuten</span>
                    <span>60 min</span>
                  </div>
                  <input
                    type="range" min="1" max="60" step="1"
                    value={minutes} disabled={running}
                    onChange={e => setDuration(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40"
                    style={{ accentColor: '#e8956d' }}
                  />
                </div>
              ) : (
                <div className="mb-6 space-y-2">
                  <IntervalRow label="Training" value={fmtSecs(iWork)}   onDec={() => adjustWork(-5)}   onInc={() => adjustWork(+5)}   disabled={running} color="#e8956d" />
                  <IntervalRow label="Pause"    value={fmtSecs(iRest)}   onDec={() => adjustRest(-5)}   onInc={() => adjustRest(+5)}   disabled={running} color="#6ab0cf" />
                  <IntervalRow label="Runden"   value={`${iRounds}×`}    onDec={() => adjustRounds(-1)} onInc={() => adjustRounds(+1)} disabled={running} color="#a89888" />
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button onClick={reset}
                  className="w-12 h-12 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52] active:opacity-70">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10"/>
                    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                  </svg>
                </button>
                <button onClick={running ? pause : start}
                  className="flex-1 h-12 rounded-full text-white font-semibold text-sm active:opacity-90 flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: running ? '#b0a89e' : ringColor }}
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
                      {startLabel}
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

function IntervalRow({ label, value, onDec, onInc, disabled, color }) {
  return (
    <div className="flex items-center justify-between bg-[#f5f0ea] rounded-xl px-4 py-2.5">
      <span className="text-sm font-medium text-[#6b5d52] w-16">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={onDec} disabled={disabled}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm active:opacity-70 disabled:opacity-30 text-xl font-light text-[#6b5d52]">
          −
        </button>
        <span className="text-sm font-bold w-14 text-center tabular-nums" style={{ color }}>{value}</span>
        <button onClick={onInc} disabled={disabled}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm active:opacity-70 disabled:opacity-30 text-xl font-light text-[#6b5d52]">
          +
        </button>
      </div>
    </div>
  )
}
