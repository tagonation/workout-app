import { WORKOUT_TYPE_COLORS, WORKOUT_TYPES } from '../data/exercises'

function fmtDate(iso) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('de-DE', { weekday: 'short', day: '2-digit', month: 'short' }).format(d)
}

export default function WorkoutsView({ workouts, onSelect, onCreate }) {
  const sorted = [...workouts].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#1a1511]">Meine Workouts</h1>
        <button onClick={onCreate} className="text-[#e8956d] text-sm font-medium active:opacity-70">
          + Neu
        </button>
      </div>

      {workouts.length === 0 && (
        <div className="text-center py-20 text-[#a89888]">
          <div className="text-5xl mb-4">🏋️</div>
          <p className="text-lg font-medium text-[#6b5d52] mb-1">Noch kein Workout</p>
          <p className="text-sm">Tippe auf + um dein erstes WOD einzutragen.</p>
        </div>
      )}

      <div className="space-y-3">
        {sorted.map(w => (
          <WorkoutCard key={w.id} workout={w} onClick={() => onSelect(w.id)} />
        ))}
      </div>
    </div>
  )
}

function WorkoutCard({ workout, onClick }) {
  const typeInfo = WORKOUT_TYPES.find(t => t.id === workout.type)
  const typeColor = WORKOUT_TYPE_COLORS[workout.type] || 'text-[#a89888]'
  const exercises = workout.exercises || []

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

      {workout.result?.score && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="text-xs bg-[#fde8dc] text-[#c4663d] px-2 py-0.5 rounded-full font-medium">
            {workout.result.score}
          </span>
          {workout.result.rxd && (
            <span className="text-xs bg-[#dcf0e0] text-[#3d8c52] px-2 py-0.5 rounded-full font-medium">RX</span>
          )}
        </div>
      )}
    </button>
  )
}
