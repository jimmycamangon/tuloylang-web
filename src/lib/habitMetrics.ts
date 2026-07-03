import type { Habit, Weekday } from '../types/habit'

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const longWeekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

const weekdayOrder: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

export function normalizeScheduledDays(days?: number[]): Weekday[] {
  if (!Array.isArray(days)) return []

  return [...new Set(days)]
    .filter((day): day is Weekday => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((left, right) => left - right)
}

export function getHabitScheduledDays(habit: Habit): Weekday[] {
  if (habit.frequency === 'daily') return weekdayOrder
  if (habit.frequency === 'weekdays') return [1, 2, 3, 4, 5]
  if (habit.frequency === 'weekend') return [0, 6]
  return normalizeScheduledDays(habit.scheduledDays)
}

export function getHabitScheduleLabel(habit: Habit) {
  if (habit.frequency === 'daily') return 'Daily'
  if (habit.frequency === 'weekdays') return 'Weekdays'
  if (habit.frequency === 'weekend') return 'Weekend'

  const days = getHabitScheduledDays(habit)
  if (days.length === 0) return 'Custom'
  return days.map((day) => longWeekdayFormatter.format(new Date(2024, 0, day + 7))).join(', ')
}

export function getLocalDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function isHabitScheduledForDate(habit: Habit, date: Date) {
  const day = date.getDay()
  return getHabitScheduledDays(habit).includes(day as Weekday)
}

export function hasCompletionOnDate(habit: Habit, dateKey: string) {
  return (habit.completions ?? []).includes(dateKey)
}

export function isQuantityHabit(habit: Habit) {
  return habit.goalType === 'quantity' && typeof habit.target === 'number' && habit.target > 0
}

export function getProgressOnDate(habit: Habit, dateKey: string) {
  return habit.progress?.[dateKey] ?? 0
}

export function getCurrentStreak(habit: Habit, today: Date) {
  let streak = 0
  const cursor = new Date(today)

  while (true) {
    if (isHabitScheduledForDate(habit, cursor)) {
      const cursorKey = getLocalDateKey(cursor)
      if (!hasCompletionOnDate(habit, cursorKey)) break
      streak += 1
    }

    cursor.setDate(cursor.getDate() - 1)

    if (cursor < parseDateKey(habit.createdAt.slice(0, 10))) {
      break
    }
  }

  return streak
}

export function getBestStreak(habit: Habit, today: Date) {
  const start = parseDateKey(habit.createdAt.slice(0, 10))
  const end = new Date(today)
  end.setHours(0, 0, 0, 0)

  let best = 0
  let run = 0
  const cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    if (isHabitScheduledForDate(habit, cursor)) {
      if (hasCompletionOnDate(habit, getLocalDateKey(cursor))) {
        run += 1
        if (run > best) best = run
      } else if (cursor < end) {
        // A missed scheduled day in the past breaks the run. Today being
        // still open does not, since it can still be completed.
        run = 0
      }
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return best
}

export function getTotalCompletions(habit: Habit) {
  return (habit.completions ?? []).length
}

export function getLastCompletedDate(habit: Habit) {
  const completions = habit.completions ?? []
  return completions.length > 0 ? completions[completions.length - 1] : null
}

export function getRecentDays(today: Date, length = 7) {
  return Array.from({ length }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (length - 1 - index))

    return {
      date,
      key: getLocalDateKey(date),
      shortLabel: weekdayFormatter.format(date),
      dateLabel: shortDateFormatter.format(date),
    }
  })
}
