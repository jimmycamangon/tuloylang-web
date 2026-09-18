import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { readAppData, saveWorkout, setHabitCompletion, setHabitProgress } from '../lib/appDataStorage'
import {
  getCurrentStreak,
  getHabitScheduleLabel,
  getLastCompletedDate,
  getLocalDateKey,
  getRecentDays,
  hasCompletionOnDate,
  isHabitScheduledForDate,
  parseDateKey,
} from '../lib/habitMetrics'
import type { WeeklyGoals } from '../types/goal'
import type { Habit } from '../types/habit'
import type { WorkoutEntry, WorkoutTemplate } from '../types/workout'

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, { month: 'short' })
const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const workoutDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

type HeatmapCell = {
  key: string
  date: Date
  isCurrentMonth: boolean
  monthLabel: string
  scheduled: number
  completed: number
  percentage: number
  intensityClassName: string
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  result.setDate(result.getDate() - result.getDay())
  return result
}

function getHeatmapIntensityClass(percentage: number, scheduled: number) {
  if (scheduled === 0) {
    return 'border-border/70 bg-transparent'
  }

  if (percentage >= 100) {
    return 'border-emerald-500/60 bg-emerald-500 dark:border-emerald-400/70 dark:bg-emerald-400'
  }

  if (percentage >= 75) {
    return 'border-emerald-300/70 bg-emerald-400/80 dark:border-emerald-500/60 dark:bg-emerald-500/80'
  }

  if (percentage >= 40) {
    return 'border-teal-200/80 bg-teal-300/75 dark:border-teal-500/60 dark:bg-teal-500/70'
  }

  return 'border-amber-200/80 bg-amber-200/80 dark:border-amber-700/60 dark:bg-amber-700/60'
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [workouts, setWorkouts] = useState<WorkoutEntry[]>([])
  const [workoutTemplates, setWorkoutTemplates] = useState<WorkoutTemplate[]>([])
  const [goals, setGoals] = useState<WeeklyGoals>({ habitCompletions: 7, workoutSessions: 3 })
  const [todayLogFeedback, setTodayLogFeedback] = useState('')
  const today = useMemo(() => new Date(), [])
  const todayKey = getLocalDateKey(today)
  const recentDays = useMemo(() => getRecentDays(today), [today])

  useEffect(() => {
    const loadData = () => {
      const appData = readAppData()
      setHabits(appData.habits)
      setWorkouts(appData.workouts)
      setWorkoutTemplates(appData.workoutTemplates)
      setGoals(appData.goals)
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
  const archivedHabits = habits.filter((habit) => habit.isArchived)
  // Used for historical views (heatmap, weekly activity) so archiving a habit
  // never erases its past completions from the record.
  const allHabits = habits
  const completedTodayCount = activeHabits.filter((habit) => hasCompletionOnDate(habit, todayKey)).length
  const scheduledTodayCount = activeHabits.filter((habit) => isHabitScheduledForDate(habit, today)).length
  const completionRate =
    scheduledTodayCount > 0 ? Math.round((completedTodayCount / scheduledTodayCount) * 100) : 0
  const bestStreak = activeHabits.reduce(
    (currentBest, habit) => Math.max(currentBest, getCurrentStreak(habit, today)),
    0,
  )
  const startOfCurrentWeek = useMemo(() => startOfWeek(today), [today])
  const workoutsThisWeek = workouts.filter(
    (workout) => new Date(workout.performedAt) >= startOfCurrentWeek,
  )
  const totalWorkoutMinutes = workouts.reduce(
    (sum, workout) => sum + workout.durationMinutes,
    0,
  )
  const recentWorkouts = workouts.slice(0, 4)
  const todayTemplate = workoutTemplates.find((template) => template.assignedDay === today.getDay())
  const hasLoggedTodayTemplate =
    todayTemplate !== undefined &&
    workouts.some(
      (workout) =>
        workout.title === todayTemplate.title && getLocalDateKey(new Date(workout.performedAt)) === todayKey,
    )

  function handleLogTodayTemplate() {
    if (!todayTemplate || hasLoggedTodayTemplate) return

    const now = new Date()
    const offsetMs = now.getTimezoneOffset() * 60_000
    const performedAt = new Date(now.getTime() - offsetMs).toISOString()

    const workoutToSave: WorkoutEntry = {
      id: crypto.randomUUID(),
      title: todayTemplate.title,
      category: todayTemplate.category,
      durationMinutes: todayTemplate.durationMinutes,
      intensity: todayTemplate.intensity,
      performedAt,
      notes: todayTemplate.notes,
      createdAt: now.toISOString(),
      exercises: todayTemplate.exercises,
    }

    const nextData = saveWorkout(workoutToSave)
    setWorkouts(nextData.workouts)
    setTodayLogFeedback(`"${todayTemplate.title}" logged instantly!`)
  }

  function handleToggleHabitToday(habit: Habit) {
    const alreadyCompleted = hasCompletionOnDate(habit, todayKey)

    if (habit.goalType === 'quantity') {
      const target = habit.target ?? 0
      const nextData = setHabitProgress(habit.id, todayKey, alreadyCompleted ? 0 : Math.max(target, 1))
      setHabits(nextData.habits)
    } else {
      const nextData = setHabitCompletion(habit.id, todayKey, !alreadyCompleted)
      setHabits(nextData.habits)
    }
  }
  const weeklyHabitCompletions = allHabits.reduce(
    (sum, habit) =>
      sum +
      (habit.completions ?? []).filter((entry) => {
        const completedAt = parseDateKey(entry)
        return completedAt >= startOfCurrentWeek && completedAt <= today
      }).length,
    0,
  )
  const weeklyGoalCards = [
    {
      label: 'Habit Goal',
      current: weeklyHabitCompletions,
      target: goals.habitCompletions,
      detail: 'Weekly completion target',
    },
    {
      label: 'Workout Goal',
      current: workoutsThisWeek.length,
      target: goals.workoutSessions,
      detail: 'Weekly session target',
    },
  ]
  const dueTodayHabits = activeHabits
    .filter((habit) => isHabitScheduledForDate(habit, today))
    .slice()
    .sort((left, right) => {
      const leftDone = hasCompletionOnDate(left, todayKey) ? 1 : 0
      const rightDone = hasCompletionOnDate(right, todayKey) ? 1 : 0
      if (leftDone !== rightDone) return leftDone - rightDone

      return left.name.localeCompare(right.name)
    })

  const dueTodayBySchedule = useMemo(() => {
    const groups = new Map<string, Habit[]>()

    dueTodayHabits.forEach((habit) => {
      const label = getHabitScheduleLabel(habit)
      const current = groups.get(label) ?? []
      groups.set(label, [...current, habit])
    })

    return [...groups.entries()].map(([label, habits]) => ({
      label,
      habits,
      completedCount: habits.filter((habit) => hasCompletionOnDate(habit, todayKey)).length,
    }))
  }, [dueTodayHabits, todayKey])

  const weeklyActivity = recentDays.map((day) => {
    const scheduled = allHabits.filter((habit) => isHabitScheduledForDate(habit, day.date)).length
    const completed = allHabits.filter((habit) => hasCompletionOnDate(habit, day.key)).length
    return {
      ...day,
      scheduled,
      completed,
      percentage: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
      heightStyle: {
        height: `${Math.max(18, Math.round((completed / Math.max(scheduled, 1)) * 100))}%`,
      },
    }
  })

  const recentHighlights = useMemo(() => {
    const highlights: string[] = []

    if (activeHabits.length > 0) {
      const topStreakHabit = activeHabits
        .map((habit) => ({ habit, streak: getCurrentStreak(habit, today) }))
        .sort((left, right) => right.streak - left.streak)[0]

      if (topStreakHabit && topStreakHabit.streak > 0) {
        highlights.push(
          `${topStreakHabit.habit.name} is on a ${topStreakHabit.streak}-day streak.`,
        )
      }
    }

    if (completedTodayCount > 0) {
      highlights.push(
        `${completedTodayCount} of ${scheduledTodayCount || completedTodayCount} scheduled habits are complete today.`,
      )
    }

    if (archivedHabits.length > 0) {
      highlights.push(`${archivedHabits.length} habits are archived and ready to restore anytime.`)
    }

    if (workoutsThisWeek.length > 0) {
      const latestWorkout = workoutsThisWeek[0]
      highlights.push(
        `${workoutsThisWeek.length} workout session${
          workoutsThisWeek.length === 1 ? '' : 's'
        } logged this week, most recently ${latestWorkout.title}.`,
      )
    }

    const latestCompletedHabit = activeHabits
      .filter((habit) => getLastCompletedDate(habit))
      .sort((left, right) => {
        const leftDate = getLastCompletedDate(left) ?? ''
        const rightDate = getLastCompletedDate(right) ?? ''
        return rightDate.localeCompare(leftDate)
      })[0]

    if (latestCompletedHabit) {
      const latestCompletedDate = getLastCompletedDate(latestCompletedHabit)
      if (latestCompletedDate) {
        highlights.push(
          `${latestCompletedHabit.name} was most recently checked off on ${parseDateKey(
            latestCompletedDate,
          ).toLocaleDateString()}.`,
        )
      }
    }

    if (highlights.length === 0) {
      highlights.push('No habit or workout activity yet. Start logging from the Habits or Workouts pages.')
    }

    return highlights.slice(0, 3)
  }, [activeHabits, archivedHabits, completedTodayCount, scheduledTodayCount, today, workoutsThisWeek])

  const summaryCards = [
    {
      label: 'Active Habits',
      value: String(activeHabits.length),
      detail:
        activeHabits.length > 0
          ? `${archivedHabits.length} archived in storage`
          : 'Create a habit to begin tracking',
    },
    {
      label: 'Completed Today',
      value: String(completedTodayCount),
      detail:
        scheduledTodayCount > 0
          ? `${scheduledTodayCount - completedTodayCount} still open today`
          : 'Nothing scheduled for today',
    },
    {
      label: 'Today Completion',
      value: `${completionRate}%`,
      detail:
        scheduledTodayCount > 0 ? "Based on today's scheduled habits" : 'Will update once habits are scheduled',
    },
    {
      label: 'Best Streak',
      value: `${bestStreak}`,
      detail: bestStreak === 1 ? '1 day current streak' : 'Longest active streak right now',
    },
    {
      label: 'Workouts This Week',
      value: String(workoutsThisWeek.length),
      detail:
        workouts.length > 0
          ? `${totalWorkoutMinutes} total minutes logged`
          : 'Log a workout to connect training to the dashboard',
    },
  ]

  const habitsForPreview = activeHabits
    .slice()
    .sort((left, right) => {
      const leftDone = hasCompletionOnDate(left, todayKey) ? 1 : 0
      const rightDone = hasCompletionOnDate(right, todayKey) ? 1 : 0
      if (leftDone !== rightDone) return leftDone - rightDone

      return getCurrentStreak(right, today) - getCurrentStreak(left, today)
    })
    .slice(0, 4)

  const heatmapWeeks = useMemo(() => {
    const weeksToShow = 12
    const gridStart = startOfWeek(new Date(today))
    gridStart.setDate(gridStart.getDate() - (weeksToShow - 1) * 7)

    const cells: HeatmapCell[][] = Array.from({ length: weeksToShow }, (_, weekIndex) =>
      Array.from({ length: 7 }, (_, dayIndex) => {
        const date = new Date(gridStart)
        date.setDate(gridStart.getDate() + weekIndex * 7 + dayIndex)

        const scheduled = allHabits.filter((habit) => isHabitScheduledForDate(habit, date)).length
        const completed = allHabits.filter((habit) =>
          hasCompletionOnDate(habit, getLocalDateKey(date)),
        ).length
        const percentage = scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0

        return {
          key: getLocalDateKey(date),
          date,
          isCurrentMonth: date.getMonth() === today.getMonth(),
          monthLabel: dayIndex === 0 ? monthLabelFormatter.format(date) : '',
          scheduled,
          completed,
          percentage,
          intensityClassName: getHeatmapIntensityClass(percentage, scheduled),
        }
      }),
    )

    return cells
  }, [allHabits, today])

  const heatmapSummary = useMemo(() => {
    const flatCells = heatmapWeeks.flat()
    const activeDays = flatCells.filter((cell) => cell.scheduled > 0)
    const completedDays = flatCells.filter((cell) => cell.completed > 0)
    const perfectDays = flatCells.filter((cell) => cell.scheduled > 0 && cell.percentage === 100)

    return {
      activeDays: activeDays.length,
      completedDays: completedDays.length,
      perfectDays: perfectDays.length,
    }
  }, [heatmapWeeks])

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <section className="space-y-6">

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summaryCards.map((card) => (
          <article key={card.label} className="surface-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {weeklyGoalCards.map((goalCard) => {
          const percentage = Math.min(Math.round((goalCard.current / goalCard.target) * 100), 100)
          const remaining = Math.max(goalCard.target - goalCard.current, 0)
          const complete = goalCard.current >= goalCard.target

          return (
            <article key={goalCard.label} className="surface-card p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{goalCard.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-foreground">
                    {goalCard.current}/{goalCard.target}
                  </p>
                  <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">
                    {complete ? 'Weekly goal reached.' : `${remaining} more to hit this week.`}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                  {percentage}%
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    complete ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.max(percentage, goalCard.current > 0 ? 8 : 0)}%` }}
                />
              </div>

              <p className="muted-copy mt-3 text-sm">{goalCard.detail}</p>
            </article>
          )
        })}
      </div>

      <article className="surface-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Today's Workout</h3>
            <p className="muted-copy mt-2 text-sm">
              {todayTemplate
                ? 'Your template for today, ready to log in one tap.'
                : "No template is assigned to today's day yet."}
            </p>
          </div>
          <Link to="/workouts" className="ui-button w-fit">
            Open Workouts Page
          </Link>
        </div>

        {todayTemplate ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-foreground">{todayTemplate.title}</h4>
                <p className="muted-copy mt-1 text-sm">{todayTemplate.category}</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                {todayTemplate.durationMinutes} min
              </span>
            </div>

            {todayTemplate.exercises && todayTemplate.exercises.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {todayTemplate.exercises.map((exercise, index) => (
                  <li
                    key={`${exercise.name}-${index}`}
                    className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {exercise.name} — {exercise.sets}x
                    {exercise.holdSeconds ? `${exercise.holdSeconds}s` : exercise.reps ?? 'sets'}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleLogTodayTemplate}
                disabled={hasLoggedTodayTemplate}
                className="ui-button bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {hasLoggedTodayTemplate ? 'Already logged today' : 'Log now'}
              </button>
              {todayLogFeedback ? (
                <p className="text-sm text-emerald-600 dark:text-emerald-300">{todayLogFeedback}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Assign a day to one of your templates on the Workouts page so it shows up here automatically.
          </div>
        )}
      </article>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <article className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Weekly Habit Activity</h3>
              <p className="muted-copy mt-2 text-sm">
                Completion progress across the last 7 days based on scheduled habits.
              </p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground">
              {completionRate}% today
            </span>
          </div>

          <div className="mt-8 flex h-48 items-end justify-between gap-3">
            {weeklyActivity.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-36 w-full items-end justify-center rounded-full bg-muted/60 p-2">
                  <div
                    className="w-full max-w-10 rounded-full bg-blue-500 transition-all"
                    style={item.heightStyle}
                    title={`${item.dateLabel}: ${item.completed}/${item.scheduled} completed`}
                  />
                </div>
                <div className="text-center">
                  <span className="block text-xs text-muted-foreground">{item.shortLabel}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {item.completed}/{item.scheduled || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <h3 className="text-base font-semibold text-foreground">Recent Highlights</h3>
          <p className="muted-copy mt-2 text-sm">
            Here are a few quick highlights from your recent habit activity.
          </p>

          <div className="mt-6 max-h-[22rem] space-y-3 overflow-y-auto pr-2">
            {recentHighlights.map((highlight) => (
              <div key={highlight} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm text-foreground">{highlight}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Due Today</h3>
            <p className="muted-copy mt-2 text-sm">
              A schedule-aware view of the habits that are actually expected today.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{dueTodayHabits.length} due today</span>
            <span className="rounded-full bg-muted px-3 py-1">
              {completedTodayCount} completed
            </span>
          </div>
        </div>

        {dueTodayHabits.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No habits are scheduled for today. Add a habit or adjust your schedule from the Habits page.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-2">
              {dueTodayBySchedule.map((group) => (
                <div key={group.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{group.label}</p>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                      {group.completedCount}/{group.habits.length}
                    </span>
                  </div>
                  <p className="muted-copy mt-2 text-sm">
                    {group.habits.length === 1
                      ? '1 habit follows this schedule today.'
                      : `${group.habits.length} habits follow this schedule today.`}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid max-h-[28rem] gap-3 overflow-y-auto pr-2">
              {dueTodayHabits.map((habit) => {
                const completedToday = hasCompletionOnDate(habit, todayKey)
                const currentStreak = getCurrentStreak(habit, today)

                return (
                  <article key={habit.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{habit.name}</h4>
                        <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          completedToday
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'
                        }`}
                      >
                        {completedToday ? 'Done' : 'Open'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                        {getHabitScheduleLabel(habit)}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                        {currentStreak} day{currentStreak === 1 ? '' : 's'} streak
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleHabitToday(habit)}
                        className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
                          completedToday
                            ? 'border border-border text-muted-foreground hover:bg-muted'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {completedToday ? 'Undo' : 'Mark done'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </article>

      <article className="surface-card p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Habit Heatmap</h3>
            <p className="muted-copy mt-2 max-w-2xl text-sm">
              This 12-week view helps you spot how consistently you have been showing up. Darker
              cells mean you completed more of the habits scheduled for that day.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              {heatmapSummary.activeDays} scheduled days
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {heatmapSummary.completedDays} days with completions
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              {heatmapSummary.perfectDays} perfect days
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="mb-3 grid grid-cols-[auto_1fr] gap-3">
              <div />
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, minmax(0, 1fr))` }}
              >
                {heatmapWeeks.map((week, index) => (
                  <span key={`${week[0]?.key}-month`} className="text-[11px] text-muted-foreground">
                    {index === 0 ||
                    week[0]?.date.getMonth() !== heatmapWeeks[index - 1]?.[0]?.date.getMonth()
                      ? week[0]?.monthLabel
                      : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[auto_1fr] gap-3">
              <div className="grid gap-2 pt-0.5">
                {weekdayLabels.map((label) => (
                  <span key={label} className="h-5 text-[11px] text-muted-foreground">
                    {label}
                  </span>
                ))}
              </div>

              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${heatmapWeeks.length}, minmax(0, 1fr))` }}
              >
                {heatmapWeeks.map((week) => (
                  <div key={week[0]?.key} className="grid gap-2">
                    {week.map((cell) => (
                      <div
                        key={cell.key}
                        className={`h-5 rounded-md border transition-transform hover:scale-105 ${cell.intensityClassName} ${
                          cell.isCurrentMonth ? '' : 'opacity-70'
                        }`}
                        title={`${longDateFormatter.format(cell.date)}: ${cell.completed}/${cell.scheduled} completed`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-border/70 bg-transparent" />
            <span className="h-4 w-4 rounded border border-amber-200/80 bg-amber-200/80 dark:border-amber-700/60 dark:bg-amber-700/60" />
            <span className="h-4 w-4 rounded border border-teal-200/80 bg-teal-300/75 dark:border-teal-500/60 dark:bg-teal-500/70" />
            <span className="h-4 w-4 rounded border border-emerald-300/70 bg-emerald-400/80 dark:border-emerald-500/60 dark:bg-emerald-500/80" />
            <span className="h-4 w-4 rounded border border-emerald-500/60 bg-emerald-500 dark:border-emerald-400/70 dark:bg-emerald-400" />
          </div>
          <span>More</span>
        </div>
      </article>

      <article className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Active Habit Snapshot</h3>
            <p className="muted-copy mt-2 text-sm">
              The habits that currently need attention, ordered to keep today's open items visible.
            </p>
          </div>
          <Link to="/habits" className="ui-button w-fit">
            Open Habits Page
          </Link>
        </div>

        {habitsForPreview.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No active habits yet. Create one in the Habits page and the dashboard will populate automatically.
          </div>
        ) : (
          <div className="mt-6 grid max-h-[34rem] gap-4 overflow-y-auto pr-2 md:grid-cols-2">
            {habitsForPreview.map((habit) => {
              const lastCompletedDate = getLastCompletedDate(habit)
              const currentStreak = getCurrentStreak(habit, today)
              const completedToday = hasCompletionOnDate(habit, todayKey)

              return (
                <article key={habit.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{habit.name}</h4>
                      <p className="muted-copy mt-1 text-sm">{habit.description}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        completedToday
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'
                      }`}
                    >
                      {completedToday ? 'Done today' : 'Open today'}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Frequency
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {getHabitScheduleLabel(habit)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Current streak
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {currentStreak} day{currentStreak === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                        Last completed
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {lastCompletedDate
                          ? parseDateKey(lastCompletedDate).toLocaleDateString()
                          : 'Not yet'}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </article>

      <article className="surface-card p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Recent Workout Sessions</h3>
            <p className="muted-copy mt-2 text-sm">
              Sessions logged on the Workouts page appear here automatically so your dashboard stays
              connected to your training history.
            </p>
          </div>
          <Link to="/workouts" className="ui-button w-fit">
            Open Workouts Page
          </Link>
        </div>

        {recentWorkouts.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No workout sessions logged yet. Add your first workout to start populating this section.
          </div>
        ) : (
          <div className="mt-6 grid max-h-[34rem] gap-4 overflow-y-auto pr-2 md:grid-cols-2">
            {recentWorkouts.map((workout) => (
              <article key={workout.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{workout.title}</h4>
                    <p className="muted-copy mt-1 text-sm">{workout.category}</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    {workout.durationMinutes} min
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Intensity
                    </p>
                    <p className="mt-1 text-sm font-semibold capitalize text-foreground">
                      {workout.intensity}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Performed at
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {workoutDateFormatter.format(new Date(workout.performedAt))}
                    </p>
                  </div>
                </div>

                <p className="muted-copy mt-4 text-sm">
                  {workout.notes || 'No notes added for this session.'}
                </p>
              </article>
            ))}
          </div>
        )}
      </article>
    </section>
  )
}
