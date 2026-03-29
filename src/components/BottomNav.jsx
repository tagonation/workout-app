export default function BottomNav({ active, onChange, onCreate }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40" style={{ maxWidth: 480, margin: '0 auto', left: 0, right: 0 }}>
      <div className="bg-[#1a1a1a] border-t border-[#2a2a2a] flex items-center h-16 px-4"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <NavBtn
          label="Workouts"
          active={active === 'workouts'}
          onClick={() => onChange('workouts')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
        />

        <button
          onClick={onCreate}
          className="mx-auto w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        <NavBtn
          label="Katalog"
          active={active === 'catalog'}
          onClick={() => onChange('catalog')}
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
            </svg>
          }
        />
      </div>
    </nav>
  )
}

function NavBtn({ label, active, onClick, icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-1 text-xs transition-colors ${
        active ? 'text-orange-400' : 'text-gray-500'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
