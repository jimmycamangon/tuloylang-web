import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  APP_DATA_STORAGE_KEY,
  deleteHabitPermanently,
  readAppData,
  saveHabit,
  setHabitCompletion,
  setHabitProgress,
  setHabitArchived,
  updateHabit,
} from '../lib/appDataStorage'
import {
  getBestStreak,
  getCurrentStreak,
  getHabitScheduleLabel,
  getLastCompletedDate,
  getLocalDateKey,
  getProgressOnDate,
  getRecentDays,
  getTotalCompletions,
  hasCompletionOnDate,
  isHabitScheduledForDate,
  isQuantityHabit,
  parseDateKey,
} from '../lib/habitMetrics'
import type { Frequency, Habit, HabitGoalType, Weekday } from '../types/habit'

type HabitFilter = 'all' | 'due-today' | 'open' | 'completed'

type HabitFormState = {
  name: string
  description: string
  frequency: Frequency
  scheduledDays: Weekday[]
  goalType: HabitGoalType
  target: string
  unit: string
}

const initialFormState: HabitFormState = {
  name: '',
  description: '',
  frequency: 'daily',
  scheduledDays: [],
  goalType: 'check',
  target: '',
  unit: '',
}

const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const weekdayOptions: Array<{ value: Weekday; label: string }> = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

export default function HabitsPage() {
  const [form, setForm] = useState<HabitFormState>(initialFormState)
  const [habits, setHabits] = useState<Habit[]>([])
  const [feedback, setFeedback] = useState('')
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{ habit: Habit; timeoutId: number } | null>(
    null,
  )
  const [activeFilter, setActiveFilter] = useState<HabitFilter>('all')
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
  const dueTodayCount = activeHabits.filter((habit) => isHabitScheduledForDate(habit, today)).length
  const openTodayCount = activeHabits.filter(
    (habit) => isHabitScheduledForDate(habit, today) && !hasCompletionOnDate(habit, todayKey),
  ).length
  const filteredActiveHabits = activeHabits.filter((habit) => {
    const dueToday = isHabitScheduledForDate(habit, today)
    const completedToday = hasCompletionOnDate(habit, todayKey)

    if (activeFilter === 'due-today') return dueToday
    if (activeFilter === 'open') return dueToday && !completedToday
    if (activeFilter === 'completed') return completedToday
    return true
  })
  const filterOptions: Array<{ id: HabitFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: activeHabits.length },
    { id: 'due-today', label: 'Due Today', count: dueTodayCount },
    { id: 'open', label: 'Open', count: openTodayCount },
    { id: 'completed', label: 'Completed Today', count: completedTodayCount },
  ]

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
      scheduledDays: habit.scheduledDays ?? [],
      goalType: habit.goalType === 'quantity' ? 'quantity' : 'check',
      target: habit.target !== undefined ? String(habit.target) : '',
      unit: habit.unit ?? '',
    })
    setFeedback(`Editing "${habit.name}". Update the fields and save your changes.`)
  }

  function toggleScheduledDay(day: Weekday) {
    setForm((prev) => {
      const nextDays = prev.scheduledDays.includes(day)
        ? prev.scheduledDays.filter((item) => item !== day)
        : [...prev.scheduledDays, day].sort((left, right) => left - right)

      return {
        ...prev,
        scheduledDays: nextDays,
      }
    })
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

    if (pendingDelete) {
      window.clearTimeout(pendingDelete.timeoutId)
    }

    const timeoutId = window.setTimeout(() => setPendingDelete(null), 6000)
    setPendingDelete({ habit: deletingHabit, timeoutId })
    setFeedback(`"${deletingHabit.name}" was permanently deleted from localStorage.`)
    setDeletingHabit(null)
  }

  function undoPendingDelete() {
    if (!pendingDelete) return

    window.clearTimeout(pendingDelete.timeoutId)
    const nextData = saveHabit(pendingDelete.habit)
    setHabits(nextData.habits)
    setPendingDelete(null)
    setFeedback(`"${pendingDelete.habit.name}" was restored.`)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = form.name.trim()
    const trimmedDescription = form.description.trim()

    if (!trimmedName || !trimmedDescription) {
      setFeedback('Please complete the habit name and description.')
      return
    }

    if (form.frequency === 'custom' && form.scheduledDays.length === 0) {
      setFeedback('Choose at least one day for a custom schedule.')
      return
    }

    const parsedTarget = Number(form.target)
    if (form.goalType === 'quantity' && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
      setFeedback('Enter a daily target greater than zero for a measurable habit.')
      return
    }

    const existingHabit = habits.find((habit) => habit.id === editingHabitId)
    const habitToSave: Habit = {
      id: editingHabitId ?? crypto.randomUUID(),
      name: trimmedName,
      description: trimmedDescription,
      frequency: form.frequency,
      scheduledDays: form.frequency === 'custom' ? form.scheduledDays : [],
      createdAt: existingHabit?.createdAt ?? new Date().toISOString(),
      isArchived: existingHabit?.isArchived ?? false,
      completions: existingHabit?.completions ?? [],
      goalType: form.goalType,
      target: form.goalType === 'quantity' ? parsedTarget : undefined,
      unit: form.goalType === 'quantity' ? form.unit.trim() || undefined : undefined,
      progress: form.goalType === 'quantity' ? (existingHabit?.progress ?? {}) : undefined,
    }

    if (editingHabitId) updateHabit(habitToSave)
    else saveHabit(habitToSave)
    // Re-read so quantity habits get completions re-derived against the (possibly new) target.
    setHabits(readAppData().habits)
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

  function handleProgressChange(habit: Habit, amount: number) {
    const target = habit.target ?? 0
    const safeAmount = Math.max(0, amount)
    const nextData = setHabitProgress(habit.id, todayKey, safeAmount)
    setHabits(nextData.habits)

    if (target > 0 && safeAmount >= target) {
      setFeedback(`"${habit.name}" hit today's target of ${target}${habit.unit ? ` ${habit.unit}` : ''}. Nice!`)
    } else {
      setFeedback(
        `Logged ${safeAmount}${habit.unit ? ` ${habit.unit}` : ''} for "${habit.name}" today.`,
      )
    }
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
                Add the routines you want to keep up with, then check them off each day so your
                streaks and progress stay easy to follow.
              </p>
            </div>
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
              <option value="weekdays">Weekdays</option>
              <option value="weekend">Weekend</option>
              <option value="custom">Custom weekdays</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="habit-goal-type"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Goal type
            </label>
            <select
              id="habit-goal-type"
              value={form.goalType}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, goalType: event.target.value as HabitGoalType }))
              }
              className="ui-input"
            >
              <option value="check">Simple check (done / not done)</option>
              <option value="quantity">Measurable (amount per day)</option>
            </select>
          </div>

          {form.goalType === 'quantity' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="habit-target"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Daily target
                </label>
                <input
                  id="habit-target"
                  type="number"
                  min="0"
                  step="any"
                  value={form.target}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, target: event.target.value }))
                  }
                  placeholder="8"
                  className="ui-input"
                />
              </div>
              <div>
                <label
                  htmlFor="habit-unit"
                  className="mb-1.5 block text-sm font-medium text-foreground"
                >
                  Unit (optional)
                </label>
                <input
                  id="habit-unit"
                  value={form.unit}
                  onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                  placeholder="glasses, minutes, pages..."
                  className="ui-input"
                />
              </div>
            </div>
          )}

          {form.frequency === 'custom' && (
            <div>
              <p className="mb-1.5 block text-sm font-medium text-foreground">Scheduled days</p>
              <div className="flex flex-wrap gap-2">
                {weekdayOptions.map((day) => {
                  const selected = form.scheduledDays.includes(day.value)

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleScheduledDay(day.value)}
                      className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-border bg-card text-foreground hover:bg-accent'
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              <p className="muted-copy mt-2 text-sm">
                Pick the specific days when this habit should appear as scheduled.
              </p>
            </div>
          )}

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
              Keep track of the habits you are actively working on and mark what you finished
              today.
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

        <div className="mb-5 flex flex-wrap gap-2">
          {filterOptions.map((filter) => {
            const selected = activeFilter === filter.id

            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                  selected
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-border bg-card text-foreground hover:bg-accent'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            )
          })}
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No active habits yet. Submit the form to create one or restore an archived habit.
          </div>
        ) : filteredActiveHabits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No habits match the current filter. Try another view to see the rest of your active habits.
          </div>
        ) : (
          <div className="space-y-3 overflow-auto h-100 border rounded-md p-2">
            {filteredActiveHabits
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
                      {getHabitScheduleLabel(habit)}
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
                        Best streak
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {getBestStreak(habit, today)} day{getBestStreak(habit, today) === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Total done
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {getTotalCompletions(habit)} day{getTotalCompletions(habit) === 1 ? '' : 's'}
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

                  {isQuantityHabit(habit) && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                          Today's progress
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {getProgressOnDate(habit, todayKey)} / {habit.target}
                          {habit.unit ? ` ${habit.unit}` : ''}
                        </p>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (getProgressOnDate(habit, todayKey) / (habit.target ?? 1)) * 100,
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="muted-copy mt-4 text-xs">
                    Created: {new Date(habit.createdAt).toLocaleString()}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {isQuantityHabit(habit) ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleProgressChange(habit, getProgressOnDate(habit, todayKey) - 1)
                          }
                          disabled={getProgressOnDate(habit, todayKey) <= 0}
                          className="ui-button disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Decrease today's progress for ${habit.name}`}
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleProgressChange(habit, getProgressOnDate(habit, todayKey) + 1)
                          }
                          className={
                            hasCompletionOnDate(habit, todayKey)
                              ? 'ui-button'
                              : 'ui-button bg-emerald-600 text-white hover:bg-emerald-700'
                          }
                          aria-label={`Increase today's progress for ${habit.name}`}
                        >
                          +1{habit.unit ? ` ${habit.unit.split(/\s+/)[0]}` : ''}
                        </button>
                      </div>
                    ) : (
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
                    )}
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

      {pendingDelete && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
          <div className="surface-card flex items-center gap-3 px-4 py-3 shadow-xl">
            <p className="text-sm text-foreground">
              Deleted "{pendingDelete.habit.name}".
            </p>
            <button type="button" onClick={undoPendingDelete} className="ui-button">
              Undo
            </button>
          </div>
        </div>
      )}

      {deletingHabit && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete Permanently</h3>
            <p className="muted-copy mt-2 text-sm">
              This will permanently remove "{deletingHabit.name}" from local storage. You will have
              a few seconds to undo after confirming.
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
