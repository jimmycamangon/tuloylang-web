import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  analyze,
  computeHabitStats,
  computePeriodStats,
  computeWorkoutHabitLink,
  getPeriodRange,
  getPreviousRange,
  isHabitDueOn,
} from './analyticsInsights'
import { getLocalDateKey } from './habitMetrics'
import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'

const originalTz = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Asia/Manila'
})
afterAll(() => {
  process.env.TZ = originalTz
})

// Tuesday 30 June 2026, mid-afternoon.
const today = new Date(2026, 5, 30, 15, 0)

function daysAgo(count: number) {
  const date = new Date(today)
  date.setDate(date.getDate() - count)
  return getLocalDateKey(date)
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Read',
    description: '',
    frequency: 'daily',
    createdAt: '2026-01-01T04:00:00.000Z',
    completions: [],
    ...overrides,
  }
}

function makeWorkout(dayOffset: number, hour = 18, id = `w-${dayOffset}`): WorkoutEntry {
  const date = new Date(today)
  date.setDate(date.getDate() - dayOffset)
  date.setHours(hour, 0, 0, 0)
  return {
    id,
    title: 'Run',
    category: 'Cardio',
    durationMinutes: 30,
    intensity: 'moderate',
    performedAt: date.toISOString(),
    notes: '',
    createdAt: date.toISOString(),
  }
}

describe('period ranges', () => {
  it('covers the last N days ending today, and the same span before it', () => {
    const range = getPeriodRange(today, 7)
    expect(getLocalDateKey(range.start)).toBe('2026-06-24')
    expect(getLocalDateKey(range.end)).toBe('2026-06-30')

    const previous = getPreviousRange(range)
    expect(getLocalDateKey(previous.start)).toBe('2026-06-17')
    expect(getLocalDateKey(previous.end)).toBe('2026-06-23')
  })
})

describe('isHabitDueOn', () => {
  const todayKey = getLocalDateKey(today)

  it('never counts future days or an unfinished today as missed', () => {
    const habit = makeHabit()
    expect(isHabitDueOn(habit, new Date(2026, 6, 1), todayKey)).toBe(false)
    expect(isHabitDueOn(habit, today, todayKey)).toBe(false)
    expect(isHabitDueOn(makeHabit({ completions: [todayKey] }), today, todayKey)).toBe(true)
  })

  it('ignores days before the habit was created unless it was completed then', () => {
    const habit = makeHabit({ createdAt: new Date(2026, 5, 28, 9).toISOString() })
    expect(isHabitDueOn(habit, new Date(2026, 5, 27), todayKey)).toBe(false)
    expect(isHabitDueOn(habit, new Date(2026, 5, 28), todayKey)).toBe(true)
    expect(
      isHabitDueOn({ ...habit, completions: ['2026-06-27'] }, new Date(2026, 5, 27), todayKey),
    ).toBe(true)
  })

  it('respects the schedule', () => {
    const weekend = makeHabit({ frequency: 'weekend' })
    expect(isHabitDueOn(weekend, new Date(2026, 5, 29), todayKey)).toBe(false) // Monday
    expect(isHabitDueOn(weekend, new Date(2026, 5, 28), todayKey)).toBe(true) // Sunday
  })
})

describe('computePeriodStats', () => {
  it('counts completion, workouts, active and perfect days', () => {
    const habit = makeHabit({ completions: [daysAgo(1), daysAgo(2), daysAgo(4)] })
    const stats = computePeriodStats([habit], [makeWorkout(3), makeWorkout(0)], getPeriodRange(today, 7), today)

    // Six past days are due; today is still open and excluded.
    expect(stats.scheduled).toBe(6)
    expect(stats.completed).toBe(3)
    expect(stats.completionRate).toBe(50)
    expect(stats.workouts).toBe(2)
    expect(stats.workoutMinutes).toBe(60)
    expect(stats.activeDays).toBe(5)
    expect(stats.perfectDays).toBe(3)
  })

  it('returns a null rate when nothing was scheduled', () => {
    expect(computePeriodStats([], [], getPeriodRange(today, 7), today).completionRate).toBeNull()
  })
})

describe('computeHabitStats', () => {
  it('compares each habit with the previous period', () => {
    const previousWeek = [8, 9, 10, 11, 12, 13].map(daysAgo)
    const habit = makeHabit({ completions: [...previousWeek, daysAgo(1)] })
    const [stat] = computeHabitStats([habit], getPeriodRange(today, 7), today)

    expect(stat.rate).toBe(17) // 1 of 6
    expect(stat.previousRate).toBe(86) // 6 of 7
    expect(stat.change).toBe(-69)
  })

  it('skips archived habits', () => {
    expect(computeHabitStats([makeHabit({ isArchived: true })], getPeriodRange(today, 7), today)).toEqual([])
  })
})

describe('computeWorkoutHabitLink', () => {
  it('compares habit completion on workout days with other days', () => {
    // Workouts on days 1-3 with the habit done; days 4-6 no workout and not done.
    const habit = makeHabit({ completions: [daysAgo(1), daysAgo(2), daysAgo(3)] })
    const workouts = [1, 2, 3].map((offset) => makeWorkout(offset))
    expect(computeWorkoutHabitLink([habit], workouts, getPeriodRange(today, 7), today)).toEqual({
      withWorkout: 100,
      withoutWorkout: 0,
    })
  })

  it('needs at least three days in each group', () => {
    const habit = makeHabit()
    expect(computeWorkoutHabitLink([habit], [makeWorkout(1)], getPeriodRange(today, 7), today)).toBeNull()
  })
})

describe('analyze', () => {
  it('flags a slipping habit and suggests focusing on it', () => {
    const previousMonth = Array.from({ length: 30 }, (_, index) => daysAgo(30 + index))
    const habit = makeHabit({ id: 'meditate', name: 'Meditate', completions: [...previousMonth, daysAgo(2)] })
    const result = analyze({ habits: [habit], workouts: [], range: getPeriodRange(today, 30), today })

    expect(result.insights.some((insight) => insight.id === 'declining-meditate')).toBe(true)
    expect(result.suggestions.some((suggestion) => suggestion.id === 'focus-meditate')).toBe(true)
  })

  it('reminds about an open streak and a long workout gap', () => {
    const habit = makeHabit({ completions: [daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)] })
    const result = analyze({
      habits: [habit],
      workouts: [makeWorkout(9)],
      range: getPeriodRange(today, 7),
      today,
    })

    expect(result.suggestions[0].id).toBe('streak')
    expect(result.suggestions[0].text).toContain('4-day Read streak')
    expect(result.suggestions.some((suggestion) => suggestion.id === 'workout-gap')).toBe(true)
  })

  it('spots the usual workout time', () => {
    const workouts = [1, 2, 3, 4].map((offset) => makeWorkout(offset, 6))
    const result = analyze({ habits: [], workouts, range: getPeriodRange(today, 7), today })
    expect(result.insights.find((insight) => insight.id === 'workout-time')?.title).toBe(
      'You usually train in the morning.',
    )
  })

  it('stays quiet without data', () => {
    const result = analyze({ habits: [], workouts: [], range: getPeriodRange(today, 7), today })
    expect(result.insights).toEqual([])
    expect(result.suggestions).toEqual([])
  })
})
