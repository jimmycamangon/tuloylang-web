import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'
import {
  getCurrentStreak,
  getLocalDateKey,
  hasCompletionOnDate,
  isHabitScheduledForDate,
} from './habitMetrics'

/**
 * Rule-based "smart" analysis for the Analytics page. Everything runs on the device from
 * local data, so it works offline. Two rules keep the numbers honest:
 *  - Future days and days before a habit existed are never counted as missed.
 *  - Today only counts once it is done, since it can still be completed.
 */

export const PERIOD_OPTIONS = [7, 30, 90] as const
export type PeriodDays = (typeof PERIOD_OPTIONS)[number]

export interface DateRange {
  start: Date
  end: Date
  days: number
}

export interface PeriodStats {
  scheduled: number
  completed: number
  /** 0–100, or null when nothing was scheduled. */
  completionRate: number | null
  workouts: number
  workoutMinutes: number
  activeDays: number
  perfectDays: number
  days: number
}

export interface HabitPeriodStat {
  habit: Habit
  scheduled: number
  completed: number
  rate: number | null
  previousRate: number | null
  /** Percentage-point change vs the previous period, when both have data. */
  change: number | null
  streak: number
  weakestWeekday: { weekday: number; rate: number } | null
}

export type InsightTone = 'positive' | 'warning' | 'neutral'

export interface Insight {
  id: string
  tone: InsightTone
  title: string
  detail: string
}

export interface Suggestion {
  id: string
  text: string
}

const weekdayNameFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

export function weekdayName(weekday: number) {
  // 2024-01-07 is a Sunday.
  return weekdayNameFormatter.format(new Date(2024, 0, 7 + weekday))
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 100) : null
}

/** The last `days` days ending today, inclusive. */
export function getPeriodRange(today: Date, days: number): DateRange {
  const end = startOfDay(today)
  return { start: addDays(end, -(days - 1)), end, days }
}

/** The same-length period right before `range`. */
export function getPreviousRange(range: DateRange): DateRange {
  const end = addDays(range.start, -1)
  return { start: addDays(end, -(range.days - 1)), end, days: range.days }
}

export function listDays(range: DateRange) {
  return Array.from({ length: range.days }, (_, index) => addDays(range.start, index))
}

function habitStartKey(habit: Habit) {
  const created = new Date(habit.createdAt)
  return Number.isFinite(created.getTime()) ? getLocalDateKey(created) : habit.createdAt.slice(0, 10)
}

/**
 * Whether a habit counts toward the completion rate on a day: it was scheduled, existed
 * already (or was completed anyway), the day is not in the future, and today only counts
 * once it is done.
 */
export function isHabitDueOn(habit: Habit, date: Date, todayKey: string) {
  const dayKey = getLocalDateKey(date)
  if (dayKey > todayKey) return false
  if (!isHabitScheduledForDate(habit, date)) return false

  const completed = hasCompletionOnDate(habit, dayKey)
  if (completed) return true
  if (habit.isArchived) return false
  if (dayKey < habitStartKey(habit)) return false
  return dayKey < todayKey
}

export function workoutDateKey(workout: WorkoutEntry) {
  return getLocalDateKey(new Date(workout.performedAt))
}

function groupWorkoutsByDay(workouts: WorkoutEntry[]) {
  const byDay = new Map<string, WorkoutEntry[]>()
  workouts.forEach((workout) => {
    const key = workoutDateKey(workout)
    byDay.set(key, [...(byDay.get(key) ?? []), workout])
  })
  return byDay
}

export function computePeriodStats(
  habits: Habit[],
  workouts: WorkoutEntry[],
  range: DateRange,
  today: Date,
): PeriodStats {
  const todayKey = getLocalDateKey(today)
  const workoutsByDay = groupWorkoutsByDay(workouts)
  let scheduled = 0
  let completed = 0
  let workoutCount = 0
  let workoutMinutes = 0
  let activeDays = 0
  let perfectDays = 0

  listDays(range).forEach((date) => {
    const dayKey = getLocalDateKey(date)
    const due = habits.filter((habit) => isHabitDueOn(habit, date, todayKey))
    const done = due.filter((habit) => hasCompletionOnDate(habit, dayKey)).length
    const dayWorkouts = workoutsByDay.get(dayKey) ?? []

    scheduled += due.length
    completed += done
    workoutCount += dayWorkouts.length
    workoutMinutes += dayWorkouts.reduce((sum, workout) => sum + workout.durationMinutes, 0)
    if (done > 0 || dayWorkouts.length > 0) activeDays += 1
    if (due.length > 0 && done === due.length) perfectDays += 1
  })

  return {
    scheduled,
    completed,
    completionRate: percent(completed, scheduled),
    workouts: workoutCount,
    workoutMinutes,
    activeDays,
    perfectDays,
    days: range.days,
  }
}

export function computeHabitStats(
  habits: Habit[],
  range: DateRange,
  today: Date,
): HabitPeriodStat[] {
  const todayKey = getLocalDateKey(today)
  const previous = getPreviousRange(range)
  const days = listDays(range)
  const previousDays = listDays(previous)

  return habits
    .filter((habit) => !habit.isArchived)
    .map((habit) => {
      const tally = (dates: Date[]) => {
        const due = dates.filter((date) => isHabitDueOn(habit, date, todayKey))
        const done = due.filter((date) => hasCompletionOnDate(habit, getLocalDateKey(date)))
        return { due, done: done.length }
      }

      const current = tally(days)
      const before = tally(previousDays)
      const rate = percent(current.done, current.due.length)
      const previousRate = percent(before.done, before.due.length)

      const byWeekday = new Map<number, { due: number; done: number }>()
      current.due.forEach((date) => {
        const entry = byWeekday.get(date.getDay()) ?? { due: 0, done: 0 }
        entry.due += 1
        if (hasCompletionOnDate(habit, getLocalDateKey(date))) entry.done += 1
        byWeekday.set(date.getDay(), entry)
      })
      const weakestWeekday =
        [...byWeekday.entries()]
          .filter(([, value]) => value.due >= 3)
          .map(([weekday, value]) => ({ weekday, rate: percent(value.done, value.due) ?? 0 }))
          .sort((left, right) => left.rate - right.rate)[0] ?? null

      return {
        habit,
        scheduled: current.due.length,
        completed: current.done,
        rate,
        previousRate,
        change: rate !== null && previousRate !== null ? rate - previousRate : null,
        // A streak stays alive while today is still open, so count up to yesterday then.
        streak: hasCompletionOnDate(habit, todayKey)
          ? getCurrentStreak(habit, today)
          : getCurrentStreak(habit, addDays(startOfDay(today), -1)),
        weakestWeekday,
      }
    })
    .sort((left, right) => (right.rate ?? -1) - (left.rate ?? -1))
}

/** Habit completion on days with a workout vs days without, when there is enough data. */
export function computeWorkoutHabitLink(
  habits: Habit[],
  workouts: WorkoutEntry[],
  range: DateRange,
  today: Date,
) {
  const todayKey = getLocalDateKey(today)
  const workoutDays = new Set(workouts.map(workoutDateKey))
  const groups = { with: { days: 0, due: 0, done: 0 }, without: { days: 0, due: 0, done: 0 } }

  listDays(range).forEach((date) => {
    const dayKey = getLocalDateKey(date)
    if (dayKey >= todayKey) return
    const due = habits.filter((habit) => isHabitDueOn(habit, date, todayKey))
    if (due.length === 0) return

    const group = workoutDays.has(dayKey) ? groups.with : groups.without
    group.days += 1
    group.due += due.length
    group.done += due.filter((habit) => hasCompletionOnDate(habit, dayKey)).length
  })

  if (groups.with.days < 3 || groups.without.days < 3) return null
  return {
    withWorkout: percent(groups.with.done, groups.with.due) ?? 0,
    withoutWorkout: percent(groups.without.done, groups.without.due) ?? 0,
  }
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export function timeOfDay(date: Date): TimeOfDay {
  const hour = date.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

export function computeUsualWorkoutTime(workouts: WorkoutEntry[]) {
  if (workouts.length < 3) return null
  const counts = new Map<TimeOfDay, number>()
  workouts.forEach((workout) => {
    const slot = timeOfDay(new Date(workout.performedAt))
    counts.set(slot, (counts.get(slot) ?? 0) + 1)
  })
  const [slot, count] = [...counts.entries()].sort((left, right) => right[1] - left[1])[0]
  return { slot, share: Math.round((count / workouts.length) * 100) }
}

/** The weekday with the lowest overall habit completion, when it clearly lags. */
export function computeWeakestWeekday(habits: Habit[], range: DateRange, today: Date) {
  const todayKey = getLocalDateKey(today)
  const byWeekday = new Map<number, { due: number; done: number }>()

  listDays(range).forEach((date) => {
    const dayKey = getLocalDateKey(date)
    const due = habits.filter((habit) => isHabitDueOn(habit, date, todayKey))
    if (due.length === 0) return
    const entry = byWeekday.get(date.getDay()) ?? { due: 0, done: 0 }
    entry.due += due.length
    entry.done += due.filter((habit) => hasCompletionOnDate(habit, dayKey)).length
    byWeekday.set(date.getDay(), entry)
  })

  const rates = [...byWeekday.entries()]
    .filter(([, value]) => value.due >= 4)
    .map(([weekday, value]) => ({ weekday, rate: percent(value.done, value.due) ?? 0 }))
  if (rates.length < 3) return null

  const average = rates.reduce((sum, item) => sum + item.rate, 0) / rates.length
  const weakest = [...rates].sort((left, right) => left.rate - right.rate)[0]
  return average - weakest.rate >= 15 ? weakest : null
}

const timeOfDayLabels: Record<TimeOfDay, string> = {
  morning: 'in the morning',
  afternoon: 'in the afternoon',
  evening: 'in the evening',
  night: 'at night',
}

function formatChange(change: number) {
  return `${change > 0 ? '+' : ''}${change} pts`
}

export interface AnalysisInput {
  habits: Habit[]
  workouts: WorkoutEntry[]
  range: DateRange
  today: Date
}

export interface Analysis {
  stats: PeriodStats
  previousStats: PeriodStats
  habitStats: HabitPeriodStat[]
  insights: Insight[]
  suggestions: Suggestion[]
}

export function analyze({ habits, workouts, range, today }: AnalysisInput): Analysis {
  const previous = getPreviousRange(range)
  const stats = computePeriodStats(habits, workouts, range, today)
  const previousStats = computePeriodStats(habits, workouts, previous, today)
  const habitStats = computeHabitStats(habits, range, today)
  const todayKey = getLocalDateKey(today)
  const periodWorkouts = workouts.filter((workout) => {
    const key = workoutDateKey(workout)
    return key >= getLocalDateKey(range.start) && key <= todayKey
  })

  const insights: Insight[] = []
  const suggestions: Suggestion[] = []

  // Overall trend vs the previous period.
  if (stats.completionRate !== null && previousStats.completionRate !== null) {
    const change = stats.completionRate - previousStats.completionRate
    insights.push({
      id: 'trend',
      tone: change >= 5 ? 'positive' : change <= -5 ? 'warning' : 'neutral',
      title:
        change >= 5
          ? `Consistency is up ${change} points.`
          : change <= -5
            ? `Consistency dropped ${Math.abs(change)} points.`
            : 'Consistency is holding steady.',
      detail: `${stats.completionRate}% of scheduled habits done, vs ${previousStats.completionRate}% in the ${range.days} days before.`,
    })
  }

  // Best habit.
  const best = habitStats.find((item) => item.rate !== null && item.scheduled >= 3)
  if (best && best.rate !== null && best.rate >= 70) {
    insights.push({
      id: 'best-habit',
      tone: 'positive',
      title: `${best.habit.name} is your most reliable habit.`,
      detail: `Done ${best.completed} of ${best.scheduled} scheduled days (${best.rate}%).`,
    })
  }

  // Declining habits.
  const declining = habitStats
    .filter((item) => item.change !== null && item.change <= -20 && item.scheduled >= 3)
    .sort((left, right) => (left.change ?? 0) - (right.change ?? 0))
  declining.slice(0, 2).forEach((item) => {
    insights.push({
      id: `declining-${item.habit.id}`,
      tone: 'warning',
      title: `${item.habit.name} is slipping.`,
      detail: `Down from ${item.previousRate}% to ${item.rate}% (${formatChange(item.change ?? 0)}).`,
    })
  })

  // Workouts help habits?
  const link = computeWorkoutHabitLink(habits, workouts, range, today)
  if (link && Math.abs(link.withWorkout - link.withoutWorkout) >= 10) {
    const helps = link.withWorkout > link.withoutWorkout
    insights.push({
      id: 'workout-link',
      tone: helps ? 'positive' : 'neutral',
      title: helps
        ? 'Workout days are your best habit days.'
        : 'Habits slip on workout days.',
      detail: `${link.withWorkout}% of habits done on days you trained, vs ${link.withoutWorkout}% on other days.`,
    })
  }

  // Weakest weekday.
  const weakestDay = computeWeakestWeekday(habits, range, today)
  if (weakestDay) {
    insights.push({
      id: 'weak-weekday',
      tone: 'warning',
      title: `${weekdayName(weakestDay.weekday)}s are your toughest day.`,
      detail: `Only ${weakestDay.rate}% of scheduled habits get done on ${weekdayName(weakestDay.weekday)}s.`,
    })
  }

  // Usual workout time.
  const usualTime = computeUsualWorkoutTime(periodWorkouts)
  if (usualTime && usualTime.share >= 50) {
    insights.push({
      id: 'workout-time',
      tone: 'neutral',
      title: `You usually train ${timeOfDayLabels[usualTime.slot]}.`,
      detail: `${usualTime.share}% of your ${periodWorkouts.length} workouts in this period.`,
    })
  }

  // Workout volume vs previous period.
  if (stats.workouts > 0 || previousStats.workouts > 0) {
    const change = stats.workouts - previousStats.workouts
    insights.push({
      id: 'workout-volume',
      tone: change > 0 ? 'positive' : change < 0 ? 'warning' : 'neutral',
      title:
        change > 0
          ? `${change} more workout${change === 1 ? '' : 's'} than the period before.`
          : change < 0
            ? `${Math.abs(change)} fewer workout${change === -1 ? '' : 's'} than the period before.`
            : 'Same number of workouts as the period before.',
      detail: `${stats.workouts} sessions, ${stats.workoutMinutes} minutes in total.`,
    })
  }

  // --- Suggestions, most useful first. ---

  // Protect a streak that is still open today.
  const streakAtRisk = habitStats
    .filter(
      (item) =>
        item.streak >= 3 &&
        isHabitScheduledForDate(item.habit, today) &&
        !hasCompletionOnDate(item.habit, todayKey),
    )
    .sort((left, right) => right.streak - left.streak)[0]
  if (streakAtRisk) {
    suggestions.push({
      id: 'streak',
      text: `Keep your ${streakAtRisk.streak}-day ${streakAtRisk.habit.name} streak alive — it is still open today.`,
    })
  }

  declining.slice(0, 1).forEach((item) => {
    suggestions.push({
      id: `focus-${item.habit.id}`,
      text: `Focus on ${item.habit.name} this week. A smaller version still counts — just don't skip it twice in a row.`,
    })
  })

  const struggling = habitStats.find(
    (item) =>
      item.rate !== null &&
      item.rate < 50 &&
      item.scheduled >= 4 &&
      !declining.some((d) => d.habit.id === item.habit.id),
  )
  if (struggling) {
    suggestions.push({
      id: `easier-${struggling.habit.id}`,
      text: `${struggling.habit.name} is done ${struggling.rate}% of the time. Make it easier or schedule it on fewer days.`,
    })
  }

  if (weakestDay) {
    suggestions.push({
      id: 'weekday-plan',
      text: `Plan ahead for ${weekdayName(weakestDay.weekday)}: pick a fixed time for your habits that day.`,
    })
  }

  const lastWorkout = workouts
    .map((workout) => new Date(workout.performedAt).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((left, right) => right - left)[0]
  if (lastWorkout !== undefined) {
    const daysSince = Math.floor((startOfDay(today).getTime() - startOfDay(new Date(lastWorkout)).getTime()) / 86_400_000)
    if (daysSince >= 5) {
      suggestions.push({
        id: 'workout-gap',
        text: `It has been ${daysSince} days since your last workout. A short 15-minute session gets you back on track.`,
      })
    }
  }

  if (suggestions.length === 0 && stats.scheduled > 0) {
    suggestions.push({
      id: 'keep-going',
      text:
        (stats.completionRate ?? 0) >= 80
          ? 'You are doing great. Consider adding one small new habit or raising a target.'
          : 'Keep logging every day — a few more days of data will sharpen these suggestions.',
    })
  }

  return {
    stats,
    previousStats,
    habitStats,
    insights: insights.slice(0, 6),
    suggestions: suggestions.slice(0, 3),
  }
}
