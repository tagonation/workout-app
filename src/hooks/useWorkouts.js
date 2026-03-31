import { useState, useCallback } from 'react'

const STORAGE_KEY = 'cf-workouts-v1'
const GIF_STORAGE_KEY = 'cf-gif-urls-v1'

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState(() => load(STORAGE_KEY, []))

  const addWorkout = useCallback((workout) => {
    const entry = {
      ...workout,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }
    setWorkouts(prev => {
      const updated = [entry, ...prev]
      save(STORAGE_KEY, updated)
      return updated
    })
    return entry
  }, [])

  const updateWorkout = useCallback((id, updates) => {
    setWorkouts(prev => {
      const updated = prev.map(w => w.id === id ? { ...w, ...updates } : w)
      save(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const deleteWorkout = useCallback((id) => {
    setWorkouts(prev => {
      const updated = prev.filter(w => w.id !== id)
      save(STORAGE_KEY, updated)
      return updated
    })
  }, [])

  const sorted = [...workouts].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' })
  )

  return { workouts: sorted, addWorkout, updateWorkout, deleteWorkout }
}

export function useCustomGifs() {
  const [gifs, setGifs] = useState(() => load(GIF_STORAGE_KEY, {}))

  const setGifUrl = useCallback((exerciseId, url) => {
    setGifs(prev => {
      const updated = { ...prev, [exerciseId]: url }
      save(GIF_STORAGE_KEY, updated)
      return updated
    })
  }, [])

  return { gifs, setGifUrl }
}
