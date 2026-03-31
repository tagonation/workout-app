import { useState, useEffect, useRef, useCallback } from 'react'

const R    = 54
const CIRC = 2 * Math.PI * R

const LS_END     = 'timer-end-v1'
const LS_TOTAL   = 'timer-total-v1'
const LS_MINUTES = 'timer-minutes-v1'

const FANFARE_PATH = `${import.meta.env.BASE_URL}assets/Triumphant_brass_fanfare,_celebratory_and_uplifting.mp3`

export default function Timer({ hasNav }) {
  const [open, setOpen]       = useState(false)
  const [minutes, setMinutes] = useState(() => parseInt(localStorage.getItem(LS_MINUTES) || '10'))
  const [total, setTotal]     = useState(() => parseInt(localStorage.getItem(LS_TOTAL)   || '600'))
  const [remaining, setRemaining] = useState(600)
  const [running, setRunning] = useState(false)
  const [finished, setFinished]   = useState(false)

  const endTimeRef        = useRef(null)
  const intervalRef       = useRef(null)
  const audioCtxRef       = useRef(null)
  const fanfareBufferRef  = useRef(null)
  const scheduledSrcRef   = useRef(null)
  const keepAliveSrcRef   = useRef(null)
  const audioReadyRef     = useRef(false)

  // ── Load fanfare MP3 into decoded buffer ───────────────────────────────────
  const loadFanfare = useCallback(async (ctx) => {
    if (fanfareBufferRef.current) return
    try {
      const res = await fetch(FANFARE_PATH)
      const buf = await res.arrayBuffer()
      fanfareBufferRef.current = await ctx.decodeAudioData(buf)
    } catch (e) {
      console.warn('Fanfare load error:', e)
    }
  }, [])

  // ── Init audio (must be called from user gesture) ──────────────────────────
  const initAudio = useCallback(async () => {
    if (audioReadyRef.current) return
    const ctx = new AudioContext()
    audioCtxRef.current = ctx
    if (ctx.state === 'suspended') await ctx.resume()
    await loadFanfare(ctx)

    // Silent looping buffer keeps iOS audio session alive in background
    const silentBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const keepAlive = ctx.createBufferSource()
    keepAlive.buffer = silentBuf
    keepAlive.loop = true
    keepAlive.connect(ctx.destination)
    keepAlive.start()
    keepAliveSrcRef.current = keepAlive

    audioReadyRef.current = true
  }, [loadFanfare])

  // ── Schedule fanfare at a specific audio-clock offset (seconds from now) ──
  const scheduleFanfare = useCallback((secondsFromNow) => {
    const ctx = audioCtxRef.current
    if (!ctx || !fanfareBufferRef.current) return
    // cancel previous
    if (scheduledSrcRef.current) {
      try { scheduledSrcRef.current.stop() } catch {}
    }
    const src = ctx.createBufferSource()
    src.buffer = fanfareBufferRef.current
    src.connect(ctx.destination)
    src.start(ctx.currentTime + Math.max(0, secondsFromNow))
    scheduledSrcRef.current = src
  }, [])

  const cancelFanfare = useCallback(() => {
    if (scheduledSrcRef.current) {
      try { scheduledSrcRef.current.stop() } catch {}
      scheduledSrcRef.current = null
    }
  }, [])

  const playFanfareNow = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx || !fanfareBufferRef.current) return
    cancelFanfare()
    const src = ctx.createBufferSource()
    src.buffer = fanfareBufferRef.current
    src.connect(ctx.destination)
    src.start(ctx.currentTime)
    scheduledSrcRef.current = src
  }, [cancelFanfare])

  // ── Finish ─────────────────────────────────────────────────────────────────
  const finish = useCallback((playSound = true) => {
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    localStorage.removeItem(LS_END)
    setRunning(false)
    setFinished(true)
    setRemaining(0)
    if (playSound) playFanfareNow()
  }, [playFanfareNow])

  // ── Tick ───────────────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    if (!endTimeRef.current) return
    const left = Math.round((endTimeRef.current - Date.now()) / 1000)
    if (left <= 0) { finish(false); return } // fanfare already scheduled via Web Audio
    setRemaining(left)
  }, [finish])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(tick, 500)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, tick])

  // ── Visibility change: screen unlock ───────────────────────────────────────
  useEffect(() => {
    const onVisible = async () => {
      if (document.hidden) return
      // Resume audio context if suspended by OS
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume()
      }
      if (!endTimeRef.current) return
      const left = Math.round((endTimeRef.current - Date.now()) / 1000)
      if (left <= 0) {
        finish(true) // play fanfare now (screen was off when it finished)
      } else {
        setRemaining(left)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [finish])

  // ── Restore state on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const savedEnd = localStorage.getItem(LS_END)
    if (!savedEnd) return
    const endMs   = parseInt(savedEnd)
    const left    = Math.round((endMs - Date.now()) / 1000)
    const savedTotal = parseInt(localStorage.getItem(LS_TOTAL)   || '600')
    const savedMin   = parseInt(localStorage.getItem(LS_MINUTES) || '10')
    setTotal(savedTotal)
    setMinutes(savedMin)
    if (left > 0) {
      endTimeRef.current = endMs
      setRemaining(left)
      setRunning(true)
      // Note: fanfare needs to be rescheduled after user interaction
    } else {
      localStorage.removeItem(LS_END)
      setFinished(true)
      setRemaining(0)
    }
  }, [])

  // ── Controls ───────────────────────────────────────────────────────────────
  const start = async () => {
    await initAudio() // user gesture → unlocks audio session

    const secs  = finished ? total : remaining
    const endMs = Date.now() + secs * 1000
    endTimeRef.current = endMs
    localStorage.setItem(LS_END, endMs.toString())

    // Schedule fanfare via audio clock — works even when screen is off
    scheduleFanfare(secs)

    if (finished) {
      setRemaining(total)
      setFinished(false)
    }
    setRunning(true)
  }

  const pause = () => {
    cancelFanfare()
    if (endTimeRef.current) {
      const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000))
      setRemaining(left)
    }
    endTimeRef.current = null
    localStorage.removeItem(LS_END)
    setRunning(false)
  }

  const reset = () => {
    cancelFanfare()
    clearInterval(intervalRef.current)
    endTimeRef.current = null
    localStorage.removeItem(LS_END)
    setRunning(false)
    setFinished(false)
    setRemaining(total)
  }

  const setDuration = (min) => {
    if (running) return
    cancelFanfare()
    const secs = min * 60
    setMinutes(min)
    setTotal(secs)
    setRemaining(secs)
    setFinished(false)
    endTimeRef.current = null
    localStorage.removeItem(LS_END)
    localStorage.setItem(LS_TOTAL,   secs.toString())
    localStorage.setItem(LS_MINUTES, min.toString())
  }

  // ── Display ────────────────────────────────────────────────────────────────
  const progress   = total > 0 ? remaining / total : 1
  const dashOffset = CIRC * (1 - progress)
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const ringColor  = finished ? '#6abf7a' : '#e8956d'
  const bottomClass = hasNav ? 'bottom-24' : 'bottom-6'

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`fixed right-4 ${bottomClass} z-30 shadow-md active:scale-95 transition-transform flex items-center justify-center
            ${running || finished
              ? 'h-10 px-3.5 rounded-full bg-white border-2 border-[#e8956d] gap-1.5'
              : 'w-12 h-12 rounded-full bg-white border-2 border-[#ede8e1]'}`}
        >
          {running ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-[#e8956d] animate-pulse" />
              <span className="text-sm font-bold text-[#e8956d] tabular-nums">{mm}:{ss}</span>
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-[#1a1511]">Timer</h2>
                <button onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Analog ring */}
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
                      style={{ transition: running ? 'stroke-dashoffset 0.5s linear' : 'stroke-dashoffset 0.3s ease' }}
                    />
                    <circle cx="64" cy="64" r="3" fill={ringColor}/>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-bold tabular-nums tracking-tight ${finished ? 'text-[#6abf7a]' : 'text-[#1a1511]'}`}>
                      {finished ? '🎉' : `${mm}:${ss}`}
                    </span>
                    <span className="text-xs text-[#a89888] mt-1">
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
                  type="range" min="1" max="60" step="1"
                  value={minutes} disabled={running}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-40"
                  style={{ accentColor: '#e8956d' }}
                />
              </div>

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
                  className="flex-1 h-12 rounded-full bg-[#e8956d] text-white font-semibold text-sm active:opacity-90 flex items-center justify-center gap-2 shadow-sm">
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
