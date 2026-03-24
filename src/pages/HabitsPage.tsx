import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  APP_DATA_STORAGE_KEY,
  deleteHabitPermanently,
  downloadAppDataFile,
  readAppData,
  saveHabit,
  setHabitArchived,
  updateHabit,
} from '../lib/appDataStorage'
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

export default function HabitsPage() {
  const [form, setForm] = useState<HabitFormState>(initialFormState)
  const [habits, setHabits] = useState<Habit[]>([])
  const [feedback, setFeedback] = useState('')
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)

  useEffect(() => {
    setHabits(readAppData().habits)
  }, [])

  const activeHabits = habits.filter((habit) => !habit.isArchived)
  const archivedHabits = habits.filter((habit) => habit.isArchived)
  const shouldScrollArchivedHabits = archivedHabits.length > 2

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
                Add a habit and store it locally in your browser so it stays available after refresh.
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
              These records are loaded from your browser storage.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {activeHabits.length} active
          </span>
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
                      <h3 className="text-sm font-semibold text-foreground">{habit.name}</h3>
                      <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                      {habit.frequency}
                    </span>
                  </div>
                  <p className="muted-copy mt-3 text-xs">
                    Created: {new Date(habit.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-4 flex gap-2">
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
