import { useState } from 'react'
import { EXERCISES, WORKOUT_TYPES } from '../data/exercises'

const EMPTY = {
  name: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'for-time',
  timeCap: '',
  rounds: '',
  exercises: [],
  notes: '',
  result: null,
}

export default function CreateWorkoutView({ onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const [showExPicker, setShowExPicker] = useState(false)
  const [exSearch, setExSearch] = useState('')

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addExercise = (ex) => {
    set('exercises', [...form.exercises, { exerciseId: ex.id, exerciseName: ex.name, detail: '' }])
    setShowExPicker(false)
    setExSearch('')
  }

  const removeExercise = (i) => {
    set('exercises', form.exercises.filter((_, idx) => idx !== i))
  }

  const updateExDetail = (i, val) => {
    const updated = form.exercises.map((e, idx) => idx === i ? { ...e, detail: val } : e)
    set('exercises', updated)
  }

  const moveUp = (i) => {
    if (i === 0) return
    const arr = [...form.exercises]
    ;[arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]
    set('exercises', arr)
  }

  const moveDown = (i) => {
    if (i === form.exercises.length - 1) return
    const arr = [...form.exercises]
    ;[arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]
    set('exercises', arr)
  }

  const handleSave = () => {
    if (form.exercises.length === 0 && !form.name && !form.notes) return
    onSave({
      name: form.name.trim(),
      date: form.date,
      type: form.type,
      timeCap: form.timeCap ? Number(form.timeCap) : null,
      rounds: form.rounds ? Number(form.rounds) : null,
      exercises: form.exercises,
      notes: form.notes.trim(),
      result: null,
    })
  }

  const typeInfo = WORKOUT_TYPES.find(t => t.id === form.type)
  const showTimeCap = ['for-time', 'amrap', 'emom', 'chipper'].includes(form.type)
  const showRounds = ['rft', 'emom', 'amrap', 'tabata'].includes(form.type)

  const filteredEx = EXERCISES.filter(e => {
    const q = exSearch.toLowerCase()
    return !q || e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)
  })

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onCancel} className="text-gray-400 active:opacity-70">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="text-lg font-bold">Workout erstellen</h1>
        <button
          onClick={handleSave}
          className="text-orange-400 font-semibold text-sm active:opacity-70"
        >
          Speichern
        </button>
      </div>

      <div className="space-y-5">
        {/* Name */}
        <Field label="Name (optional)">
          <input
            type="text"
            placeholder='z.B. "Fran", "Murph", eigener Name…'
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600"
          />
        </Field>

        {/* Date */}
        <Field label="Datum">
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white"
          />
        </Field>

        {/* Type */}
        <Field label="Workout-Typ">
          <div className="grid grid-cols-3 gap-2">
            {WORKOUT_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => set('type', t.id)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  form.type === t.id
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-[#1a1a1a] border-[#2a2a2a] text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {typeInfo && (
            <p className="text-xs text-gray-600 mt-1.5">{typeInfo.desc}</p>
          )}
        </Field>

        {/* Rounds / TimeCap row */}
        {(showRounds || showTimeCap) && (
          <div className="flex gap-3">
            {showRounds && (
              <Field label="Runden" className="flex-1">
                <input
                  type="number"
                  min="1"
                  placeholder="—"
                  value={form.rounds}
                  onChange={e => set('rounds', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600"
                />
              </Field>
            )}
            {showTimeCap && (
              <Field label="Time Cap (min)" className="flex-1">
                <input
                  type="number"
                  min="1"
                  placeholder="—"
                  value={form.timeCap}
                  onChange={e => set('timeCap', e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600"
                />
              </Field>
            )}
          </div>
        )}

        {/* Exercises */}
        <Field label="Übungen">
          {form.exercises.length > 0 && (
            <div className="space-y-2 mb-2">
              {form.exercises.map((ex, i) => (
                <div key={i} className="flex items-start gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                  {/* Reorder */}
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <button onClick={() => moveUp(i)} className="text-gray-600 active:text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="18 15 12 9 6 15"/>
                      </svg>
                    </button>
                    <button onClick={() => moveDown(i)} className="text-gray-600 active:text-gray-300">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{ex.exerciseName}</p>
                    <input
                      type="text"
                      placeholder='Reps / Gewicht / Strecke… z.B. "21-15-9" oder "5 × 3 @ 80kg"'
                      value={ex.detail}
                      onChange={e => updateExDetail(i, e.target.value)}
                      className="w-full text-xs text-gray-400 placeholder-gray-700 mt-1 bg-transparent border-b border-[#2a2a2a] pb-0.5"
                    />
                  </div>

                  <button onClick={() => removeExercise(i)} className="text-gray-600 active:text-red-400 pt-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowExPicker(true)}
            className="w-full bg-[#1a1a1a] border border-dashed border-[#333] rounded-xl py-3 text-sm text-orange-400 font-medium active:opacity-70"
          >
            + Übung hinzufügen
          </button>
        </Field>

        {/* Notes */}
        <Field label="Notizen">
          <textarea
            rows={3}
            placeholder="Skalierung, Equipment, sonstige Hinweise…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none"
          />
        </Field>
      </div>

      {/* Exercise picker */}
      {showExPicker && (
        <ExercisePicker
          search={exSearch}
          setSearch={setExSearch}
          exercises={filteredEx}
          onSelect={addExercise}
          onClose={() => { setShowExPicker(false); setExSearch('') }}
        />
      )}
    </div>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

function ExercisePicker({ search, setSearch, exercises, onSelect, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[480px] bg-[#1a1a1a] rounded-t-3xl border border-[#2a2a2a] flex flex-col"
           style={{ maxHeight: '80dvh' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="font-bold text-lg">Übung wählen</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="px-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              autoFocus
              type="text"
              placeholder="Suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#111] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-1">
          {exercises.map(ex => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex)}
              className="w-full text-left flex items-center gap-3 bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3 active:bg-[#222]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{ex.name}</p>
                <p className="text-xs text-gray-600">{ex.category} · {ex.muscles.join(', ')}</p>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
