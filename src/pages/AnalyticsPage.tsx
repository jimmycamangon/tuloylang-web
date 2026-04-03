import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { readAppData } from '../lib/appDataStorage'
import {
  getCurrentStreak,
  getLocalDateKey,
  hasCompletionOnDate,
  isHabitScheduledForDate,
} from '../lib/habitMetrics'
import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' })
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})
const workoutTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

type HeatmapCell = {
  key: string
  date: Date
  labelMonth: string
  scheduledHabits: Habit[]
  completedHabits: Habit[]
  openHabits: Habit[]
  workouts: WorkoutEntry[]
  completionRate: number
  score: number
  intensityClassName: string
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}

function getHeatmapTone(score: number) {
  if (score === 0) {
    return 'border-border/70 bg-transparent'
  }

  if (score >= 5) {
    return 'border-emerald-600/70 bg-emerald-500 dark:border-emerald-400/70 dark:bg-emerald-400'
  }

  if (score >= 3) {
    return 'border-emerald-300/70 bg-emerald-400/80 dark:border-emerald-500/60 dark:bg-emerald-500/80'
  }

  if (score >= 2) {
    return 'border-teal-200/80 bg-teal-300/75 dark:border-teal-500/60 dark:bg-teal-500/70'
  }

  return 'border-amber-200/80 bg-amber-200/80 dark:border-amber-700/60 dark:bg-amber-700/60'
}

function getInitialSelectedDate(todayKey: string, cells: HeatmapCell[]) {
  const latestActiveCell = [...cells]
    .reverse()
    .find((cell) => cell.completedHabits.length > 0 || cell.workouts.length > 0)

  return latestActiveCell?.key ?? todayKey
}

export default function AnalyticsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const today = useMemo(() => new Date(), [])
  const todayKey = getLocalDateKey(today)

  useEffect(() => {
    const loadData = () => {
      const appData = readAppData()
      setHabits(appData.habits)
      setWorkouts(appData.workouts)
    }

    loadData()
    window.addEventListener('storage', loadData)
    window.addEventListener('focus', loadData)

    return () => {
      window.removeEventListener('storage', loadData)
      window.removeEventListener('focus', loadData)
    }
  }, [])

  const activeHabits = habits.filter((habit) => !habit.isArchived)

  const heatmapWeeks = useMemo(() => {
    const weeksToShow = 24
    const gridStart = startOfWeek(new Date(today))
    gridStart.setDate(gridStart.getDate() - (weeksToShow - 1) * 7)

    return Array.from({ length: weeksToShow }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex)

        const dayKey = getLocalDateKey(date)
        const scheduledHabits = activeHabits.filter((habit) => isHabitScheduledForDate(habit, date))
        const completedHabits = scheduledHabits.filter((habit) => hasCompletionOnDate(habit, dayKey))
        const openHabits = scheduledHabits.filter((habit) => !hasCompletionOnDate(habit, dayKey))
        const dayWorkouts = workouts.filter((workout) => workout.performedAt.slice(0, 10) === dayKey)
        const completionRate =
          scheduledHabits.length > 0
            ? Math.round((completedHabits.length / scheduledHabits.length) * 100)
            : 0
        const score = completedHabits.length + dayWorkouts.length

        return {
          key: dayKey,
          date,
          labelMonth: dayIndex === 0 ? monthLabelFormatter.format(date) : '',
          scheduledHabits,
          completedHabits,
          openHabits,
          workouts: dayWorkouts,
          completionRate,
          score,
          intensityClassName: getHeatmapTone(score),
        }
      }),
    )
  }, [activeHabits, today, workouts])

  const flatCells = useMemo(() => heatmapWeeks.flat(), [heatmapWeeks])
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey)

  useEffect(() => {
    setSelectedDateKey((current) => {
      const hasCurrent = flatCells.some((cell) => cell.key === current)
      if (hasCurrent) return current
      return getInitialSelectedDate(todayKey, flatCells)
    })
  }, [flatCells, todayKey])

  const selectedCell = flatCells.find((cell) => cell.key === selectedDateKey) ?? flatCells[flatCells.length - 1]

  const summary = useMemo(() => {
    const daysWithActivity = flatCells.filter(
      (cell) => cell.completedHabits.length > 0 || cell.workouts.length > 0,
    ).length
    const perfectHabitDays = flatCells.filter(
      (cell) => cell.scheduledHabits.length > 0 && cell.completedHabits.length === cell.scheduledHabits.length,
    ).length
    const totalWorkoutMinutes = workouts.reduce((sum, workout) => sum + workout.durationMinutes, 0)
    const strongestHabit = activeHabits
      .map((habit) => ({ habit, streak: getCurrentStreak(habit, today) }))
      .sort((left, right) => right.streak - left.streak)[0]

    return {
      daysWithActivity,
      perfectHabitDays,
      totalWorkoutMinutes,
      strongestHabit,
    }
  }, [activeHabits, flatCells, today, workouts])

  const workoutCategoryBreakdown = useMemo(() => {
    const categoryMap = new Map<string, { sessions: number; minutes: number }>()

    workouts.forEach((workout) => {
      const key = workout.category.trim() || 'Uncategorized'
      const current = categoryMap.get(key) ?? { sessions: 0, minutes: 0 }
      categoryMap.set(key, {
        sessions: current.sessions + 1,
        minutes: current.minutes + workout.durationMinutes,
      })
    })

    return [...categoryMap.entries()]
      .map(([category, value]) => ({ category, ...value }))
      .sort((left, right) => right.sessions - left.sessions || right.minutes - left.minutes)
      .slice(0, 5)
  }, [workouts])

  const consistencyTimeline = useMemo(() => {
    return flatCells
      .filter((cell) => cell.completedHabits.length > 0 || cell.workouts.length > 0)
      .slice(-8)
      .reverse()
  }, [flatCells])

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <section className="space-y-6">

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Active Days</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{summary.daysWithActivity}</p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
            Days with at least one completed habit or workout
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Perfect Habit Days</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{summary.perfectHabitDays}</p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
            Every scheduled habit was completed
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Workout Minutes</p>
          <p className="mt-3 text-3xl font-semibold text-foreground">{summary.totalWorkoutMinutes}</p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
            Total training minutes logged so far
          </p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Strongest Habit</p>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {summary.strongestHabit?.habit.name ?? 'No data yet'}
          </p>
          <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
            {summary.strongestHabit ? `${summary.strongestHabit.streak} day streak` : 'Log habits to surface streaks'}
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.9fr)]">
        <article className="surface-card min-w-0 overflow-hidden p-4 sm:p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Interactive Activity Heatmap</h3>
              <p className="muted-copy mt-2 text-sm">
                Explore the last 24 weeks of your activity at a glance. Stronger color means more
                completed habits and workouts logged on that day.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="h-3.5 w-3.5 rounded border border-border/70 bg-transparent sm:h-4 sm:w-4" />
                <span className="h-3.5 w-3.5 rounded border border-amber-200/80 bg-amber-200/80 dark:border-amber-700/60 dark:bg-amber-700/60 sm:h-4 sm:w-4" />
                <span className="h-3.5 w-3.5 rounded border border-teal-200/80 bg-teal-300/75 dark:border-teal-500/60 dark:bg-teal-500/70 sm:h-4 sm:w-4" />
                <span className="h-3.5 w-3.5 rounded border border-emerald-300/70 bg-emerald-400/80 dark:border-emerald-500/60 dark:bg-emerald-500/80 sm:h-4 sm:w-4" />
                <span className="h-3.5 w-3.5 rounded border border-emerald-600/70 bg-emerald-500 dark:border-emerald-400/70 dark:bg-emerald-400 sm:h-4 sm:w-4" />
              </div>
              <span>More</span>
            </div>
          </div>

          <div className="-mx-4 mt-6 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
            <div className="min-w-[620px] sm:min-w-[760px] lg:min-w-[980px]">
              <div className="mb-2 grid grid-cols-[1.5rem_1fr] gap-2 sm:mb-3 sm:grid-cols-[auto_1fr] sm:gap-3">
                <div />
                <div
                  className="grid gap-1.5 sm:gap-2"
                  style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, minmax(0, 1fr))` }}
                >
                  {heatmapWeeks.map((week, index) => (
                    <span
                      key={`${week[0]?.key}-month`}
                      className="text-[10px] text-muted-foreground sm:text-[11px]"
                    >
                      {index === 0 ||
                      week[0]?.date.getMonth() !== heatmapWeeks[index - 1]?.[0]?.date.getMonth()
                        ? week[0]?.labelMonth
                        : ''}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1.5rem_1fr] gap-2 sm:grid-cols-[auto_1fr] sm:gap-3">
                <div className="grid gap-1.5 pt-0.5 sm:gap-2">
                  {weekdayLabels.map((label) => (
                    <span
                      key={label}
                      className="flex h-4 items-center text-[10px] text-muted-foreground sm:h-5 sm:text-[11px]"
                    >
                      <span className="sm:hidden">{label.slice(0, 1)}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                  ))}
                </div>

                <div
                  className="grid gap-1.5 sm:gap-2"
                  style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, minmax(0, 1fr))` }}
                >
                  {heatmapWeeks.map((week) => (
                    <div key={week[0]?.key} className="grid gap-1.5 sm:gap-2">
                      {week.map((cell) => {
                        const isSelected = cell.key === selectedDateKey

                        return (
                          <button
                            key={cell.key}
                            type="button"
                            onClick={() => setSelectedDateKey(cell.key)}
                            className={`h-4 rounded-[5px] border transition-all hover:scale-105 sm:h-5 sm:rounded-md ${cell.intensityClassName} ${
                              isSelected ? 'ring-2 ring-blue-500 ring-offset-1 sm:ring-offset-2 ring-offset-background' : ''
                            }`}
                            title={`${fullDateFormatter.format(cell.date)}: ${cell.completedHabits.length}/${cell.scheduledHabits.length} habits, ${cell.workouts.length} workouts`}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="surface-card min-w-0 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Selected Day Details</h3>
          <p className="muted-copy mt-2 text-sm">
            Drill into one day at a time to see what was completed, what stayed open, and which
            workouts were logged.
          </p>

          {selectedCell ? (
            <div className="mt-6 space-y-4 overflow-auto h-64">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {fullDateFormatter.format(selectedCell.date)}
                </p>
                <p className="muted-copy mt-2 text-sm leading-6">
                  {selectedCell.completedHabits.length}/{selectedCell.scheduledHabits.length} scheduled habits completed
                  {selectedCell.scheduledHabits.length > 0 ? ` (${selectedCell.completionRate}%)` : ''}{' '}
                  and {selectedCell.workouts.length} workout
                  {selectedCell.workouts.length === 1 ? '' : 's'} logged.
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Completed habits
                </p>
                {selectedCell.completedHabits.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                    No scheduled habits were completed on this day.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCell.completedHabits.map((habit) => (
                      <div key={habit.id} className="rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-semibold text-foreground">{habit.name}</p>
                        <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Open scheduled habits
                </p>
                {selectedCell.openHabits.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                    No open scheduled habits remained for this day.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCell.openHabits.map((habit) => (
                      <div key={habit.id} className="rounded-lg border border-border bg-card p-3">
                        <p className="text-sm font-semibold text-foreground">{habit.name}</p>
                        <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Workouts logged
                </p>
                {selectedCell.workouts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                    No workouts were logged on this day.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedCell.workouts.map((workout) => (
                      <div key={workout.id} className="rounded-lg border border-border bg-card p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{workout.title}</p>
                            <p className="muted-copy mt-1 text-sm">{workout.category}</p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                            {workout.durationMinutes} min
                          </span>
                        </div>
                        <p className="muted-copy mt-2 text-sm">
                          {workoutTimeFormatter.format(new Date(workout.performedAt))}
                        </p>
                        <p className="muted-copy mt-2 text-sm">
                          {workout.notes || 'No notes added for this workout.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No analytics data yet. Start logging habits or workouts to populate this view.
            </div>
          )}
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="surface-card min-w-0 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recent Consistency Timeline</h3>
              <p className="muted-copy mt-2 text-sm">
                A quick list of the latest days where some activity was recorded.
              </p>
            </div>
            <Link to="/dashboard" className="ui-button">
              Back to Dashboard
            </Link>
          </div>

          {consistencyTimeline.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No activity has been logged yet.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {consistencyTimeline.map((cell) => (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDateKey(cell.key)}
                  className="flex w-full flex-col items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {fullDateFormatter.format(cell.date)}
                    </p>
                    <p className="muted-copy mt-1 text-sm">
                      {cell.completedHabits.length} habits completed and {cell.workouts.length} workouts logged
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                    {cell.score} activity
                  </span>
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="surface-card min-w-0 p-4 sm:p-6">
          <h3 className="text-base font-semibold text-foreground">Workout Category Breakdown</h3>
          <p className="muted-copy mt-2 text-sm">
            A simple look at where your logged training volume is accumulating.
          </p>

          {workoutCategoryBreakdown.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No workout categories yet. Log sessions on the Workouts page to build this section.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {workoutCategoryBreakdown.map((item) => (
                <div key={item.category} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.category}</p>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {item.sessions} session{item.sessions === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="muted-copy mt-2 text-sm">{item.minutes} total minutes logged</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </div>
    </section>
  )
}
