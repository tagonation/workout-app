import { useState } from 'react'
import { CATEGORY_COLORS } from '../data/exercises'

export default function ExerciseDemoModal({ exercise, gifUrl, onSetGifUrl, onClose }) {
  const [editing, setEditing] = useState(false)
  const [inputUrl, setInputUrl] = useState(gifUrl || '')
  const [imgError, setImgError] = useState(false)

  const colors = CATEGORY_COLORS[exercise.category] || {}
  const effectiveUrl = gifUrl || ''

  const handleSave = () => {
    onSetGifUrl(inputUrl.trim())
    setEditing(false)
    setImgError(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-[480px] bg-white rounded-t-3xl sm:rounded-3xl border border-[#ede8e1] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
              {exercise.category}
            </span>
            <h2 className="text-xl font-bold mt-0.5 text-[#1a1511]">{exercise.name}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-[#f5f0ea] flex items-center justify-center text-[#6b5d52] active:opacity-70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* GIF area */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden bg-[#f5f0ea] aspect-video flex items-center justify-center">
          {effectiveUrl && !imgError ? (
            <img
              src={effectiveUrl}
              alt={exercise.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="text-center px-6">
              {imgError && (
                <p className="text-red-400 text-xs mb-3">GIF konnte nicht geladen werden.</p>
              )}
              <p className="text-[#bfb4a8] text-sm mb-3">Kein Demo hinterlegt</p>
              <button onClick={() => setEditing(true)} className="text-[#e8956d] text-sm underline">
                GIF-URL hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Edit URL */}
        {editing ? (
          <div className="px-5 mb-4">
            <p className="text-xs text-[#a89888] mb-2">GIF-URL einfügen</p>
            <input
              autoFocus
              type="url"
              placeholder="https://…/animation.gif"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              className="w-full bg-[#f5f0ea] border border-[#ede8e1] rounded-xl px-4 py-2.5 text-sm text-[#1a1511] placeholder-[#bfb4a8] mb-2"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="flex-1 bg-[#e8956d] text-white rounded-xl py-2.5 text-sm font-semibold">
                Speichern
              </button>
              <button onClick={() => setEditing(false)} className="flex-1 bg-[#f5f0ea] text-[#6b5d52] rounded-xl py-2.5 text-sm">
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-2 flex gap-2">
            <button
              onClick={() => { setEditing(true); setInputUrl(effectiveUrl) }}
              className="text-xs text-[#a89888] flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {effectiveUrl ? 'GIF ändern' : 'GIF hinterlegen'}
            </button>
          </div>
        )}

        {/* Description + muscles */}
        <div className="px-5 pb-6">
          <p className="text-sm text-[#6b5d52] leading-relaxed mb-3">{exercise.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {exercise.muscles.map(m => (
              <span key={m} className="text-xs bg-[#f5f0ea] text-[#8c7d6e] px-2.5 py-1 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
