import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  APP_DATA_STORAGE_KEY,
  deleteWorkoutTemplate,
  deleteWorkout,
  readAppData,
  saveWorkout,
  saveWorkoutTemplate,
  updateWorkout,
} from '../lib/appDataStorage'
import type { WorkoutEntry, WorkoutIntensity, WorkoutTemplate } from '../types/workout'

type WorkoutFormState = {
  title: string
  category: string
  durationMinutes: string
  intensity: WorkoutIntensity
  performedAt: string
  notes: string
}

const intensityStyles: Record<WorkoutIntensity, string> = {
  low: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-200',
  moderate: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  high: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200',
}

function getDefaultPerformedAt() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 16)
}

const initialFormState: WorkoutFormState = {
  title: '',
  category: '',
  durationMinutes: '',
  intensity: 'moderate',
  performedAt: getDefaultPerformedAt(),
  notes: '',
}

function formatWorkoutDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function WorkoutsPage() {
  const [form, setForm] = useState<WorkoutFormState>(initialFormState)
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [feedback, setFeedback] = useState('')
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null)
  const [deletingWorkout, setDeletingWorkout] = useState<WorkoutEntry | null>(null)

  useEffect(() => {
    const appData = readAppData()
    setWorkouts(appData.workouts)
    setTemplates(appData.workoutTemplates)
  }, [])

  const totalMinutes = useMemo(
    () => workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0),
    [workouts],
  )
  const currentWeekSessions = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setHours(0, 0, 0, 0)
    startOfWeek.setDate(now.getDate() - now.getDay())

    return workouts.filter((workout) => new Date(workout.performedAt) >= startOfWeek).length
  }, [workouts])

  function resetForm() {
    setForm({
      ...initialFormState,
      performedAt: getDefaultPerformedAt(),
    })
    setEditingWorkoutId(null)
  }

  function startEdit(workout: WorkoutEntry) {
    setEditingWorkoutId(workout.id)
    setForm({
      title: workout.title,
      category: workout.category,
      durationMinutes: String(workout.durationMinutes),
      intensity: workout.intensity,
      performedAt: workout.performedAt.slice(0, 16),
      notes: workout.notes,
    })
    setFeedback(`Editing "${workout.title}". Update the session and save when ready.`)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = form.title.trim()
    const trimmedCategory = form.category.trim()
    const trimmedNotes = form.notes.trim()
    const durationMinutes = Number(form.durationMinutes)

    if (!trimmedTitle || !trimmedCategory) {
      setFeedback('Please provide both a workout title and category.')
      return
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setFeedback('Please enter a valid workout duration in minutes.')
      return
    }

    if (!form.performedAt) {
      setFeedback('Please choose when the workout happened.')
      return
    }

    const existingWorkout = workouts.find((workout) => workout.id === editingWorkoutId)
    const workoutToSave: WorkoutEntry = {
      id: editingWorkoutId ?? crypto.randomUUID(),
      title: trimmedTitle,
      category: trimmedCategory,
      durationMinutes: Math.round(durationMinutes),
      intensity: form.intensity,
      performedAt: new Date(form.performedAt).toISOString(),
      notes: trimmedNotes,
      createdAt: existingWorkout?.createdAt ?? new Date().toISOString(),
    }

    const nextData = editingWorkoutId ? updateWorkout(workoutToSave) : saveWorkout(workoutToSave)
    setWorkouts(nextData.workouts)
    resetForm()
    setFeedback(
      editingWorkoutId
        ? `Workout updated in localStorage under "${APP_DATA_STORAGE_KEY}".`
        : `Workout logged to localStorage under "${APP_DATA_STORAGE_KEY}".`,
    )
  }

  function handleSaveTemplate() {
    const trimmedTitle = form.title.trim()
    const trimmedCategory = form.category.trim()
    const trimmedNotes = form.notes.trim()
    const durationMinutes = Number(form.durationMinutes)

    if (!trimmedTitle || !trimmedCategory) {
      setFeedback('Add a workout name and category before saving a template.')
      return
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      setFeedback('Enter a valid duration before saving a template.')
      return
    }

    const templateToSave: WorkoutTemplate = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      category: trimmedCategory,
      durationMinutes: Math.round(durationMinutes),
      intensity: form.intensity,
      notes: trimmedNotes,
      createdAt: new Date().toISOString(),
    }

    const nextData = saveWorkoutTemplate(templateToSave)
    setTemplates(nextData.workoutTemplates)
    setFeedback(`Template "${templateToSave.title}" saved for future workout logs.`)
  }

  function applyTemplate(template: WorkoutTemplate) {
    setForm((prev) => ({
      ...prev,
      title: template.title,
      category: template.category,
      durationMinutes: String(template.durationMinutes),
      intensity: template.intensity,
      notes: template.notes,
    }))
    setEditingWorkoutId(null)
    setFeedback(`Template "${template.title}" applied to the workout form.`)
  }

  function handleDeleteTemplate(template: WorkoutTemplate) {
    const nextData = deleteWorkoutTemplate(template.id)
    setTemplates(nextData.workoutTemplates)
    setFeedback(`Template "${template.title}" was removed.`)
  }

  function confirmDelete() {
    if (!deletingWorkout) return

    const nextData = deleteWorkout(deletingWorkout.id)
    setWorkouts(nextData.workouts)

    if (editingWorkoutId === deletingWorkout.id) {
      resetForm()
    }

    setFeedback(`"${deletingWorkout.title}" was deleted from your workout log.`)
    setDeletingWorkout(null)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="surface-card p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-foreground">
            {editingWorkoutId ? 'Edit Workout Log' : 'Log Workout'}
          </h2>
          <p className="muted-copy mt-2 text-sm">
            Keep this page focused on session logging so every workout you record can feed your
            dashboard totals and recent activity.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Total sessions
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{workouts.length}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              This week
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{currentWeekSessions}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Total minutes
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">{totalMinutes}</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Workout Templates</h3>
              <p className="muted-copy mt-1 text-sm">
                Save your current form as a reusable routine, then apply it anytime before logging.
              </p>
            </div>
            <button type="button" onClick={handleSaveTemplate} className="ui-button w-fit">
              Save as template
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
              No templates yet. Build one from the form and save it here.
            </div>
          ) : (
            <div className="mt-4 grid max-h-[18rem] gap-3 overflow-y-auto pr-2">
              {templates.slice(0, 4).map((template) => (
                <article key={template.id} className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-foreground">{template.title}</h4>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${intensityStyles[template.intensity]}`}
                        >
                          {template.intensity}
                        </span>
                      </div>
                      <p className="muted-copy mt-1 text-sm">{template.category}</p>
                      <p className="muted-copy mt-2 text-sm">
                        {template.durationMinutes} min
                        {template.notes ? ` - ${template.notes}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => applyTemplate(template)}
                        className="ui-button"
                      >
                        Use template
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(template)}
                        className="ui-button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="workout-title" className="mb-1.5 block text-sm font-medium text-foreground">
              Workout name
            </label>
            <input
              id="workout-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Upper body strength"
              className="ui-input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="workout-category" className="mb-1.5 block text-sm font-medium text-foreground">
                Category
              </label>
              <input
                id="workout-category"
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                placeholder="Strength"
                className="ui-input"
              />
            </div>
            <div>
              <label htmlFor="workout-duration" className="mb-1.5 block text-sm font-medium text-foreground">
                Duration
              </label>
              <input
                id="workout-duration"
                type="number"
                min="1"
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, durationMinutes: event.target.value }))
                }
                placeholder="45"
                className="ui-input"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="workout-intensity" className="mb-1.5 block text-sm font-medium text-foreground">
                Intensity
              </label>
              <select
                id="workout-intensity"
                value={form.intensity}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    intensity: event.target.value as WorkoutIntensity,
                  }))
                }
                className="ui-input"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label htmlFor="workout-date" className="mb-1.5 block text-sm font-medium text-foreground">
                Performed at
              </label>
              <input
                id="workout-date"
                type="datetime-local"
                value={form.performedAt}
                onChange={(event) => setForm((prev) => ({ ...prev, performedAt: event.target.value }))}
                className="ui-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="workout-notes" className="mb-1.5 block text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              id="workout-notes"
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Main lifts, volume, cardio target, or how the session felt."
              rows={4}
              className="ui-input resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="ui-button bg-blue-600 text-white hover:bg-blue-700">
              {editingWorkoutId ? 'Update workout' : 'Log workout'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setFeedback('')
              }}
              className="ui-button"
            >
              {editingWorkoutId ? 'Cancel edit' : 'Clear'}
            </button>
          </div>
        </form>

        {feedback && (
          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {feedback}
          </p>
        )}
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Recent Workout Logs</h2>
            <p className="muted-copy mt-2 text-sm">
              Your latest sessions are stored locally and shown on the dashboard as part of your
              training overview.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {workouts.length} logged
          </span>
        </div>

        {workouts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No workout sessions logged yet. Add your first entry to start building your training
            history.
          </div>
        ) : (
          <div className="max-h-[42rem] space-y-3 overflow-auto rounded-md border border-border p-2">
            {workouts.map((workout) => (
              <article key={workout.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{workout.title}</h3>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${intensityStyles[workout.intensity]}`}
                      >
                        {workout.intensity}
                      </span>
                    </div>
                    <p className="muted-copy mt-1 text-sm">{workout.category}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    {workout.durationMinutes} min
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Performed at
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatWorkoutDate(workout.performedAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Logged
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatWorkoutDate(workout.createdAt)}
                    </p>
                  </div>
                </div>

                <p className="muted-copy mt-4 text-sm">
                  {workout.notes || 'No notes added for this session.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(workout)} className="ui-button">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingWorkout(workout)}
                    className="ui-button-danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {deletingWorkout && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete Workout</h3>
            <p className="muted-copy mt-2 text-sm">
              This will permanently remove "{deletingWorkout.title}" from your workout log.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingWorkout(null)} className="ui-button">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="ui-button-danger">
                Delete workout
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
