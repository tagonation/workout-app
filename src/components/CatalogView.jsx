import { useState } from 'react'
import { EXERCISES, CATEGORIES, CATEGORY_COLORS, gifUrl } from '../data/exercises'
import ExerciseDemoModal from './ExerciseDemoModal'

export default function CatalogView({ gifs, setGifUrl }) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [selected, setSelected] = useState(null)

  const filtered = EXERCISES.filter(e => {
    const matchCat = !activeCategory || e.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || e.name.toLowerCase().includes(q) || e.muscles.some(m => m.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  const grouped = {}
  for (const e of filtered) {
    if (!grouped[e.category]) grouped[e.category] = []
    grouped[e.category].push(e)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#1a1511] mb-4">Übungskatalog</h1>

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a89888]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-[#ede8e1] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#1a1511] placeholder-[#bfb4a8]"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a89888]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <Chip label="Alle" active={!activeCategory} onClick={() => setActiveCategory(null)} />
        {CATEGORIES.map(cat => (
          <Chip key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} />
        ))}
      </div>

      {/* Exercise list */}
      {Object.keys(grouped).map(cat => (
        <div key={cat} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${CATEGORY_COLORS[cat]?.text} ${CATEGORY_COLORS[cat]?.bg} ${CATEGORY_COLORS[cat]?.border}`}>
              {cat}
            </span>
            <span className="text-xs text-[#bfb4a8]">{grouped[cat].length}</span>
          </div>
          <div className="space-y-1">
            {grouped[cat].map(ex => (
              <ExerciseRow
                key={ex.id}
                exercise={ex}
                gifUrl={gifs[ex.id] || gifUrl(ex.gif)}
                onClick={() => setSelected(ex)}
              />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-[#bfb4a8]">
          <p>Keine Übung gefunden.</p>
        </div>
      )}

      {selected && (
        <ExerciseDemoModal
          exercise={selected}
          gifUrl={gifs[selected.id] || gifUrl(selected.gif)}
          onSetGifUrl={(url) => setGifUrl(selected.id, url)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-[#e8956d] text-white'
          : 'bg-white border border-[#ede8e1] text-[#6b5d52]'
      }`}
    >
      {label}
    </button>
  )
}

function ExerciseRow({ exercise, gifUrl, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 bg-white border border-[#ede8e1] rounded-xl px-4 py-3 active:scale-[0.98] transition-transform shadow-sm"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a1511]">{exercise.name}</p>
        <p className="text-xs text-[#a89888] truncate">{exercise.muscles.join(', ')}</p>
      </div>
      {gifUrl ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#f5f0ea]">
          <img src={gifUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-[#f5f0ea] flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#bfb4a8" strokeWidth="1.5">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </div>
      )}
    </button>
  )
}
