import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  APP_DATA_STORAGE_KEY,
  deleteHabitPermanently,
  downloadAppDataFile,
  readAppData,
  saveHabit,
  setHabitCompletion,
  setHabitArchived,
  updateHabit,
} from '../lib/appDataStorage'
import {
  getCurrentStreak,
  getLastCompletedDate,
  getLocalDateKey,
  getRecentDays,
  hasCompletionOnDate,
  isHabitScheduledForDate,
  parseDateKey,
} from '../lib/habitMetrics'
import type { Frequency, Habit } from '../types/habit'

type HabitFormState = {
  name: string
  description: string
  frequency: Frequency
}

const initialFormState: HabitFormState = {
  name: '',
  description: '',
  frequency: 'daily',
}

const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

export default function HabitsPage() {
  const [form, setForm] = useState<HabitFormState>(initialFormState)
  const [habits, setHabits] = useState<Habit[]>([])
  const [feedback, setFeedback] = useState('')
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  const today = useMemo(() => new Date(), [])
  const todayKey = getLocalDateKey(today)
  const recentDays = useMemo(() => getRecentDays(today), [today])

  useEffect(() => {
    setHabits(readAppData().habits)
  }, [])

  const activeHabits = habits.filter((habit) => !habit.isArchived)
  const archivedHabits = habits.filter((habit) => habit.isArchived)
  const shouldScrollArchivedHabits = archivedHabits.length > 2
  const completedTodayCount = activeHabits.filter((habit) => hasCompletionOnDate(habit, todayKey)).length

  function resetForm() {
    setForm(initialFormState)
    setEditingHabitId(null)
  }

  function startEdit(habit: Habit) {
    setEditingHabitId(habit.id)
    setForm({
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
    })
    setFeedback(`Editing "${habit.name}". Update the fields and save your changes.`)
  }

  function handleArchiveToggle(habitId: string, isArchived: boolean) {
    const targetHabit = habits.find((habit) => habit.id === habitId)
    const nextData = setHabitArchived(habitId, isArchived)

    setHabits(nextData.habits)

    if (editingHabitId === habitId) {
      resetForm()
    }

    setFeedback(
      targetHabit
        ? isArchived
          ? `"${targetHabit.name}" was archived.`
          : `"${targetHabit.name}" was restored to active habits.`
        : isArchived
          ? 'Habit archived.'
          : 'Habit restored.',
    )
  }

  function confirmPermanentDelete() {
    if (!deletingHabit) return

    const nextData = deleteHabitPermanently(deletingHabit.id)
    setHabits(nextData.habits)

    if (editingHabitId === deletingHabit.id) {
      resetForm()
    }

    setFeedback(`"${deletingHabit.name}" was permanently deleted from localStorage.`)
    setDeletingHabit(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = form.name.trim()
    const trimmedDescription = form.description.trim()

    if (!trimmedName || !trimmedDescription) {
      setFeedback('Please complete the habit name and description.')
      return
    }

    const habitToSave: Habit = {
      id: editingHabitId ?? crypto.randomUUID(),
      name: trimmedName,
      description: trimmedDescription,
      frequency: form.frequency,
      createdAt:
        habits.find((habit) => habit.id === editingHabitId)?.createdAt ?? new Date().toISOString(),
      isArchived: habits.find((habit) => habit.id === editingHabitId)?.isArchived ?? false,
      completions: habits.find((habit) => habit.id === editingHabitId)?.completions ?? [],
    }

    const nextData = editingHabitId ? updateHabit(habitToSave) : saveHabit(habitToSave)
    setHabits(nextData.habits)
    resetForm()
    setFeedback(
      editingHabitId
        ? `Habit updated in localStorage under "${APP_DATA_STORAGE_KEY}".`
        : `Habit saved to localStorage under "${APP_DATA_STORAGE_KEY}".`,
    )
  }

  function handleCompletionToggle(habit: Habit) {
    const alreadyCompleted = hasCompletionOnDate(habit, todayKey)
    const nextData = setHabitCompletion(habit.id, todayKey, !alreadyCompleted)
    setHabits(nextData.habits)
    setFeedback(
      alreadyCompleted
        ? `Removed today's completion for "${habit.name}".`
        : `Marked "${habit.name}" as complete for today.`,
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="surface-card p-6">
        <div className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {editingHabitId ? 'Edit Habit' : 'Create Habit'}
              </h2>
              <p className="muted-copy mt-2 text-sm">
                Add habits, then check them off daily so your progress, streaks, and history stay
                available after refresh.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                downloadAppDataFile()
                setFeedback(`Backup exported from localStorage key "${APP_DATA_STORAGE_KEY}".`)
              }}
              className="ui-button"
            >
              Export data
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="habit-name" className="mb-1.5 block text-sm font-medium text-foreground">
              Habit name
            </label>
            <input
              id="habit-name"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Morning stretch"
              className="ui-input"
            />
          </div>

          <div>
            <label
              htmlFor="habit-description"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="habit-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Stretch for 10 minutes after waking up."
              rows={4}
              className="ui-input resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="habit-frequency"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Frequency
            </label>
            <select
              id="habit-frequency"
              value={form.frequency}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, frequency: event.target.value as Frequency }))
              }
              className="ui-input"
            >
              <option value="daily">Daily</option>
              <option value="weekend">Weekend</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" className="ui-button bg-blue-600 text-white hover:bg-blue-700">
              {editingHabitId ? 'Update habit' : 'Save habit'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setFeedback('')
              }}
              className="ui-button"
            >
              {editingHabitId ? 'Cancel edit' : 'Clear'}
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
            <h2 className="text-base font-semibold text-foreground">Active Habits</h2>
            <p className="muted-copy mt-2 text-sm">
              Manage your current routines and check off what you completed today.
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
              {activeHabits.length} active
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
              {completedTodayCount} completed today
            </span>
          </div>
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No active habits yet. Submit the form to create one or restore an archived habit.
          </div>
        ) : (
          <div className="space-y-3 overflow-auto h-100 border rounded-md p-2">
            {activeHabits
              .slice()
              .reverse()
              .map((habit) => (
                <article key={habit.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{habit.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            hasCompletionOnDate(habit, todayKey)
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'
                          }`}
                        >
                          {hasCompletionOnDate(habit, todayKey) ? 'Done today' : 'Open today'}
                        </span>
                      </div>
                      <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                      {habit.frequency}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Current streak
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {getCurrentStreak(habit, today)} day{getCurrentStreak(habit, today) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Last completed
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {getLastCompletedDate(habit)
                          ? shortDateFormatter.format(parseDateKey(getLastCompletedDate(habit)!))
                          : 'Not yet'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Last 7 days
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {recentDays.filter((day) => hasCompletionOnDate(habit, day.key)).length}/7 complete
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Recent history
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentDays.map((day) => {
                        const isCompleted = hasCompletionOnDate(habit, day.key)
                        const isScheduled = isHabitScheduledForDate(habit, day.date)
                        return (
                          <div
                            key={`${habit.id}-${day.key}`}
                            className={`min-w-14 rounded-md border px-2 py-1.5 text-center text-xs ${
                              !isScheduled
                                ? 'border-border/60 bg-transparent text-muted-foreground'
                                : isCompleted
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200'
                                  : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                            }`}
                            title={`${day.dateLabel}: ${
                              !isScheduled ? 'Not scheduled' : isCompleted ? 'Completed' : 'Not completed'
                            }`}
                          >
                            <div>{day.shortLabel}</div>
                            <div className="mt-1 text-[11px]">{isScheduled ? (isCompleted ? 'Done' : 'Open') : 'Off'}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <p className="muted-copy mt-4 text-xs">
                    Created: {new Date(habit.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleCompletionToggle(habit)}
                      className={
                        hasCompletionOnDate(habit, todayKey)
                          ? 'ui-button'
                          : 'ui-button bg-emerald-600 text-white hover:bg-emerald-700'
                      }
                    >
                      {hasCompletionOnDate(habit, todayKey) ? 'Undo today' : 'Mark today complete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(habit)}
                      className="ui-button"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(habit.id, true)}
                      className="ui-button"
                    >
                      Archive
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )}
      </div>

      <div className="surface-card p-6 lg:col-span-2">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Archived Habits</h2>
            <p className="muted-copy mt-2 text-sm">
              Archived habits stay in local storage and can be restored anytime.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {archivedHabits.length} archived
          </span>
        </div>

        {archivedHabits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No archived habits yet.
          </div>
        ) : (
          <div
            className={`space-y-3 rounded-md border border-border p-2 ${
              shouldScrollArchivedHabits ? 'max-h-[32rem] overflow-y-auto' : ''
            }`}
          >
            {archivedHabits
              .slice()
              .reverse()
              .map((habit) => (
                <article
                  key={habit.id}
                  className="rounded-lg border border-border bg-card p-4 opacity-80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{habit.name}</h3>
                      <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      archived
                    </span>
                  </div>
                  <p className="muted-copy mt-3 text-xs">
                    Created: {new Date(habit.createdAt).toLocaleString()}
                  </p>
                  <p className="muted-copy mt-2 text-xs">
                    Completed on {(habit.completions ?? []).length} day
                    {(habit.completions ?? []).length === 1 ? '' : 's'} total
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleArchiveToggle(habit.id, false)}
                      className="ui-button"
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingHabit(habit)}
                      className="ui-button-danger"
                    >
                      Delete permanently
                    </button>
                  </div>
                </article>
              ))}
          </div>
        )}
      </div>

      {deletingHabit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete Permanently</h3>
            <p className="muted-copy mt-2 text-sm">
              This will permanently remove "{deletingHabit.name}" from local storage and cannot be
              undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingHabit(null)}
                className="ui-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                className="ui-button-danger"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
