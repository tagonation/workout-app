import { useState } from 'react'
import { WORKOUT_TYPES, WORKOUT_TYPE_COLORS, EXERCISES, CATEGORY_COLORS, gifUrl } from '../data/exercises'
import ExerciseDemoModal from './ExerciseDemoModal'

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(d)
}

export default function WorkoutDetailView({ workout, gifs, onBack, onUpdate, onDelete, onEdit }) {
  const [logMode, setLogMode] = useState(false)
  const [score, setScore] = useState(workout.result?.score || '')
  const [rxd, setRxd] = useState(workout.result?.rxd ?? false)
  const [resultNote, setResultNote] = useState(workout.result?.note || '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [demoExercise, setDemoExercise] = useState(null)

  const typeInfo = WORKOUT_TYPES.find(t => t.id === workout.type)
  const typeColor = WORKOUT_TYPE_COLORS[workout.type] || 'text-gray-400'

  const saveResult = () => {
    onUpdate(workout.id, {
      result: { score: score.trim(), rxd, note: resultNote.trim() }
    })
    setLogMode(false)
  }

  const getExerciseData = (exerciseId) => EXERCISES.find(e => e.id === exerciseId)

  return (
    <div className="px-4 pt-6 pb-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-gray-400 active:opacity-70">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={onEdit} className="text-gray-400 active:text-orange-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-gray-600 active:text-red-400"
          >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
          </svg>
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-5">
        <span className={`text-xs font-bold uppercase tracking-wider ${typeColor}`}>
          {typeInfo?.label || workout.type}
          {workout.timeCap && ` · ${workout.timeCap} min`}
          {workout.rounds && ` · ${workout.rounds} Runden`}
        </span>
        <h1 className="text-2xl font-bold mt-1">
          {workout.name || typeInfo?.label || 'Workout'}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{fmtDate(workout.date || workout.createdAt)}</p>
      </div>

      {/* Exercises */}
      {workout.exercises?.length > 0 && (
        <div className="mb-5">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-3">Übungen</p>
          <div className="space-y-2">
            {workout.exercises.map((ex, i) => {
              const exData = getExerciseData(ex.exerciseId)
              const resolvedGif = gifs?.[ex.exerciseId] || gifUrl(exData?.gif) || ''
              const catColors = exData ? CATEGORY_COLORS[exData.category] : null

              return (
                <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ex.exerciseName}</p>
                    {ex.detail && (
                      <p className="text-xs text-orange-300 mt-0.5">{ex.detail}</p>
                    )}
                  </div>
                  {exData && (
                    <button
                      onClick={() => setDemoExercise(exData)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 active:text-gray-300"
                    >
                      {resolvedGif ? (
                        <img src={resolvedGif} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                          Demo
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {workout.notes && (
        <div className="mb-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wider mb-1">Notizen</p>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{workout.notes}</p>
        </div>
      )}

      {/* Result */}
      {workout.result?.score ? (
        <div className="mb-5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium uppercase tracking-wider">Ergebnis</p>
            <button onClick={() => setLogMode(true)} className="text-xs text-orange-400">Ändern</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-400">{workout.result.score}</span>
            {workout.result.rxd && (
              <span className="text-sm bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-medium">RX</span>
            )}
          </div>
          {workout.result.note && (
            <p className="text-sm text-gray-500 mt-1">{workout.result.note}</p>
          )}
        </div>
      ) : (
        !logMode && (
          <button
            onClick={() => setLogMode(true)}
            className="w-full bg-orange-500 text-white font-semibold py-3.5 rounded-2xl text-sm active:opacity-90 transition-opacity"
          >
            Ergebnis eintragen
          </button>
        )
      )}

      {/* Log result form */}
      {logMode && (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-4 space-y-3">
          <p className="text-sm font-semibold">Ergebnis eintragen</p>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Score / Zeit / Runden+Reps</label>
            <input
              autoFocus
              type="text"
              placeholder='z.B. "12:34", "5+3 Reps", "120 kg"'
              value={score}
              onChange={e => setScore(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setRxd(!rxd)}
              className={`w-10 h-6 rounded-full transition-colors relative ${rxd ? 'bg-green-500' : 'bg-[#333]'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${rxd ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm">RX (ohne Skalierung)</span>
          </label>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">Notiz (optional)</label>
            <textarea
              rows={2}
              placeholder="Wie lief es? Scaling, Gefühl…"
              value={resultNote}
              onChange={e => setResultNote(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={saveResult} className="flex-1 bg-orange-500 text-white rounded-xl py-2.5 text-sm font-semibold">
              Speichern
            </button>
            <button onClick={() => setLogMode(false)} className="flex-1 bg-[#2a2a2a] text-gray-300 rounded-xl py-2.5 text-sm">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-sm text-center">
            <p className="font-bold text-lg mb-1">Workout löschen?</p>
            <p className="text-sm text-gray-500 mb-5">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 bg-[#2a2a2a] text-gray-300 rounded-xl py-3 text-sm">
                Abbrechen
              </button>
              <button onClick={() => onDelete(workout.id)} className="flex-1 bg-red-500 text-white rounded-xl py-3 text-sm font-semibold">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo modal */}
      {demoExercise && (
        <ExerciseDemoModal
          exercise={demoExercise}
          gifUrl={gifs?.[demoExercise.id] || gifUrl(demoExercise.gif)}
          onSetGifUrl={() => {}}
          onClose={() => setDemoExercise(null)}
        />
      )}
    </div>
  )
}
