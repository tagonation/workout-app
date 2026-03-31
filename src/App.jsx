import { useState } from 'react'
import { useWorkouts, useCustomGifs } from './hooks/useWorkouts'
import BottomNav from './components/BottomNav'
import WorkoutsView from './components/WorkoutsView'
import CatalogView from './components/CatalogView'
import CreateWorkoutView from './components/CreateWorkoutView'
import WorkoutDetailView from './components/WorkoutDetailView'

export default function App() {
  const [view, setView] = useState('workouts')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const { workouts, addWorkout, updateWorkout, deleteWorkout } = useWorkouts()
  const { gifs, setGifUrl } = useCustomGifs()

  const go = (v, id = null) => {
    setView(v)
    if (id !== undefined) setSelectedWorkoutId(id)
    window.scrollTo(0, 0)
  }

  const selectedWorkout = workouts.find(w => w.id === selectedWorkoutId)

  return (
    <div className="flex flex-col min-h-dvh">
      <div className="flex-1 pb-20">
        {view === 'workouts' && (
          <WorkoutsView
            workouts={workouts}
            onSelect={(id) => go('detail', id)}
            onCreate={() => go('create')}
          />
        )}
        {view === 'catalog' && (
          <CatalogView gifs={gifs} setGifUrl={setGifUrl} />
        )}
        {view === 'create' && (
          <CreateWorkoutView
            onSave={(w) => { addWorkout(w); go('workouts') }}
            onCancel={() => go('workouts')}
          />
        )}
        {view === 'detail' && selectedWorkout && (
          <WorkoutDetailView
            workout={selectedWorkout}
            gifs={gifs}
            onBack={() => go('workouts')}
            onUpdate={(id, u) => updateWorkout(id, u)}
            onDelete={(id) => { deleteWorkout(id); go('workouts') }}
            onEdit={() => go('edit', selectedWorkoutId)}
          />
        )}
        {view === 'edit' && selectedWorkout && (
          <CreateWorkoutView
            initialData={selectedWorkout}
            onSave={(w) => { updateWorkout(selectedWorkout.id, w); go('detail', selectedWorkout.id) }}
            onCancel={() => go('detail', selectedWorkoutId)}
          />
        )}
      </div>

      {(view === 'workouts' || view === 'catalog') && (
        <BottomNav
          active={view}
          onChange={(v) => go(v)}
          onCreate={() => go('create')}
        />
      )}
    </div>
  )
}
