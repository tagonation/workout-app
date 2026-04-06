# CLAUDE.md — Training App

## Project overview
CrossFit/HIIT training PWA for personal use. Built with React 18 + Vite 5 + Tailwind CSS 3.
Deployed to GitHub Pages at `https://tagonation.github.io/workout-app/`.

## Stack
- **React 18** — no router, view switching via `useState` in App.jsx
- **Vite 5** — `base: '/workout-app/'` in vite.config.js (critical for GitHub Pages)
- **Tailwind CSS 3** — utility classes only, custom colors inline
- **localStorage** — all persistence (no backend)

## Deploy workflow
```bash
npx vite build
git add .
git commit -m "..."
git push
```
GitHub Actions (`.github/workflows/deploy.yml`) builds and deploys `dist/` to GitHub Pages automatically on push to `main`.

## Project structure
```
src/
  App.jsx                  # Root: view state + navigation
  components/
    WorkoutsView.jsx       # Workout list with alphabetical grouping + letter index
    WorkoutDetailView.jsx  # Detail, result logging, delete
    CreateWorkoutView.jsx  # Create + edit workouts, superset linking
    CatalogView.jsx        # Exercise catalog with GIF demos
    ExerciseDemoModal.jsx  # GIF demo modal
    BottomNav.jsx          # Tab bar (Workouts / Catalog)
    Timer.jsx              # Floating timer (simple + interval mode)
  data/
    exercises.js           # Exercise list, WORKOUT_TYPES, gifUrl() helper
  hooks/
    useWorkouts.js         # CRUD + alphabetical sort, localStorage key: cf-workouts-v1
  index.css / main.jsx
public/
  assets/                  # GIF files + fanfare MP3
  icons/                   # PWA icons (192, 512)
  manifest.json            # PWA manifest, start_url: /workout-app/
```

## Key conventions

### Asset URLs
Always use `import.meta.env.BASE_URL` for public asset paths:
```js
const url = `${import.meta.env.BASE_URL}assets/filename.gif`
```
The helper `gifUrl(filename)` in `exercises.js` does this automatically.

### Design system
- Background: `#faf6f1` (warm off-white)
- Primary/accent: `#e8956d` (orange)
- Text primary: `#1a1511`
- Text secondary: `#6b5d52`, `#a89888`
- Borders: `#ede8e1`
- Surface: `#ffffff`, muted: `#f5f0ea`
- Success/green: `#6abf7a`
- Blue (interval rest): `#6ab0cf`
- All touch targets ≥ 44×44px

### Workout data shape
```js
{
  id: string,           // Date.now().toString()
  name: string,
  date: 'YYYY-MM-DD',
  type: string,         // 'for-time' | 'amrap' | 'emom' | 'rft' | ...
  timeCap: number|null,
  rounds: number|null,
  exercises: [{ exerciseId, exerciseName, detail, superset?: boolean }],
  notes: string,
  result?: { score, rxd, note },
  createdAt: ISO string,
}
```

### Superset logic
`exercises[i].superset = true` means exercise `i` is linked to `i-1` above it.
Visual: left orange border + adjusted corner rounding + "Superset" badge between cards.

## Timer — important details

### Simple mode
- Wall-clock based: stores `endTime = Date.now() + remaining * 1000` in localStorage (`timer-end-v1`)
- Tick reads `(endTimeRef.current - Date.now()) / 1000`
- localStorage keys: `timer-end-v1`, `timer-total-v1`, `timer-minutes-v1`

### Interval mode
- Config: `iWork` (seconds), `iRest` (seconds), `iRounds` — saved to `timer-iconfig-v1`
- Running: stores absolute start timestamp in `timer-istart-v1`
- Paused: stores `{ round, phase, rem }` in `timer-ipause-v1`
- Phase computed via `computePhase(elapsed, work, rest, rounds)` — pure function
- Resume reconstructs virtual start: `startMs = Date.now() - elapsedSecs * 1000`

### Audio
- `HTMLAudioElement` (not Web Audio API) — more reliable on iOS PWA
- Unlocked silently on first "Start" tap (volume=0, play, pause, reset volume)
- Fanfare file: `public/assets/Triumphant_brass_fanfare%2C_celebratory_and_uplifting.mp3`
- Comma in filename must be URL-encoded as `%2C` in the JS constant

### Wake Lock
- `navigator.wakeLock.request('screen')` on timer start
- Released on pause / reset / finish
- Re-acquired on visibilitychange / pageshow / focus if timer still running

## PWA notes
- `manifest.json` must have `start_url: "/workout-app/"` and `scope: "/workout-app/"`
- After changes to manifest or icons: user must delete home screen icon and re-add from Safari
- iOS 16.4+ required for Notification API (not currently used)
