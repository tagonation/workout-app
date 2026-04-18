import { useRef, useState } from 'react'
import { WORKOUT_TYPE_COLORS, WORKOUT_TYPES, EXERCISES, FOCUS_LABELS, FOCUS_COLORS, computeWorkoutFocus } from '../data/exercises'

function fmtDate(iso) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }).format(d)
}

function getLetter(workout) {
  const name = workout.name?.trim()
  if (!name) return '#'
  const ch = name[0].toUpperCase()
  return /[A-Z]/.test(ch) ? ch : '#'
}

const FOCUS_FILTERS = [
  { key: 'all', label: 'Alle' },
  ...Object.entries(FOCUS_LABELS).map(([key, label]) => ({ key, label })),
]

export default function WorkoutsView({ workouts, onSelect, onCreate }) {
  const sectionRefs = useRef({})
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all'
    ? workouts
    : workouts.filter(w => computeWorkoutFocus(w, EXERCISES) === activeFilter)

  // group by first letter
  const groups = []
  for (const w of filtered) {
    const letter = getLetter(w)
    const last = groups[groups.length - 1]
    if (last && last.letter === letter) {
      last.items.push(w)
    } else {
      groups.push({ letter, items: [w] })
    }
  }

  const letters = groups.map(g => g.letter)

  const scrollTo = (letter) => {
    sectionRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative px-4 pt-6 pr-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1511]">Meine Workouts</h1>
        <button onClick={onCreate} className="text-[#e8956d] text-sm font-medium active:opacity-70">
          + Neu
        </button>
      </div>

      {/* Focus filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-2 -mx-4 px-4 scrollbar-none">
        {FOCUS_FILTERS.map(({ key, label }) => {
          const active = activeFilter === key
          const colors = key !== 'all' ? FOCUS_COLORS[key] : null
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? key === 'all'
                    ? 'bg-[#e8956d] text-white border-[#e8956d]'
                    : `${colors.bg} ${colors.text} ${colors.border}`
                  : 'bg-white text-[#a89888] border-[#ede8e1]'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 && workouts.length === 0 && (
        <div className="text-center py-20 text-[#a89888]">
          <div className="text-5xl mb-4">🏋️</div>
          <p className="text-lg font-medium text-[#6b5d52] mb-1">Noch kein Workout</p>
          <p className="text-sm">Tippe auf + um dein erstes WOD einzutragen.</p>
        </div>
      )}

      {filtered.length === 0 && workouts.length > 0 && (
        <div className="text-center py-16 text-[#a89888]">
          <p className="text-sm">Keine Workouts in dieser Kategorie.</p>
        </div>
      )}

      <div className="space-y-5 pb-6">
        {groups.map(({ letter, items }) => (
          <div key={letter} ref={el => sectionRefs.current[letter] = el}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#e8956d] w-5">{letter}</span>
              <div className="flex-1 h-px bg-[#ede8e1]" />
            </div>
            <div className="space-y-3">
              {items.map(w => (
                <WorkoutCard key={w.id} workout={w} onClick={() => onSelect(w.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Alphabet index — right edge, only letters with workouts */}
      {letters.length > 0 && (
        <div className="fixed right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-0.5">
          {letters.map(letter => (
            <button
              key={letter}
              onClick={() => scrollTo(letter)}
              className="text-[10px] font-bold text-[#e8956d] w-5 h-5 flex items-center justify-center active:bg-[#e8956d] active:text-white rounded-full"
            >
              {letter}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WorkoutCard({ workout, onClick }) {
  const typeInfo = WORKOUT_TYPES.find(t => t.id === workout.type)
  const typeColor = WORKOUT_TYPE_COLORS[workout.type] || 'text-[#a89888]'
  const exercises = workout.exercises || []
  const focus = computeWorkoutFocus(workout, EXERCISES)
  const focusColors = FOCUS_COLORS[focus]
  const focusLabel = FOCUS_LABELS[focus]

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-[#ede8e1] rounded-2xl p-4 active:scale-[0.98] transition-transform shadow-sm"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate text-[#1a1511]">
            {workout.name || typeInfo?.label || 'Workout'}
          </p>
          <p className="text-xs text-[#a89888] mt-0.5">
            {fmtDate(workout.date || workout.createdAt)}
          </p>
        </div>
        <span className={`text-xs font-bold uppercase tracking-wide flex-shrink-0 ${typeColor}`}>
          {typeInfo?.label || workout.type}
        </span>
      </div>

      {exercises.length > 0 && (
        <div className="text-sm text-[#8c7d6e] mb-2 line-clamp-2">
          {exercises.slice(0, 4).map(e => e.detail ? `${e.exerciseName} (${e.detail})` : e.exerciseName).join(' · ')}
          {exercises.length > 4 && ` +${exercises.length - 4}`}
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {exercises.length > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${focusColors.bg} ${focusColors.text} ${focusColors.border}`}>
            {focusLabel}
          </span>
        )}
        {workout.result?.score && (
          <span className="text-xs bg-[#fde8dc] text-[#c4663d] px-2 py-0.5 rounded-full font-medium">
            {workout.result.score}
          </span>
        )}
        {workout.result?.rxd && (
          <span className="text-xs bg-[#dcf0e0] text-[#3d8c52] px-2 py-0.5 rounded-full font-medium">RX</span>
        )}
      </div>
    </button>
  )
}
