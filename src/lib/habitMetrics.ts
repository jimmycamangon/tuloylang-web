import type { Habit } from '../types/habit'

const weekdayFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

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
  if (habit.frequency === 'daily') return true

  const day = date.getDay()
  return day === 0 || day === 6
}

export function hasCompletionOnDate(habit: Habit, dateKey: string) {
  return (habit.completions ?? []).includes(dateKey)
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
