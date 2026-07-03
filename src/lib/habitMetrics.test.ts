import { describe, expect, it } from 'vitest'
import type { Habit } from '../types/habit'
import {
  getBestStreak,
  getCurrentStreak,
  getHabitScheduledDays,
  getLastCompletedDate,
  getLocalDateKey,
  getProgressOnDate,
  getRecentDays,
  getTotalCompletions,
  hasCompletionOnDate,
  isHabitScheduledForDate,
  isQuantityHabit,
  normalizeScheduledDays,
  parseDateKey,
} from './habitMetrics'

// June 1, 2026 is a Monday, which makes weekday math easy to reason about.
function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Test habit',
    description: 'Test description',
    frequency: 'daily',
    scheduledDays: [],
    createdAt: '2026-06-01T12:00:00.000Z',
    isArchived: false,
    completions: [],
    ...overrides,
  }
}

describe('normalizeScheduledDays', () => {
  it('dedupes, filters invalid entries, and sorts', () => {
    expect(normalizeScheduledDays([5, 1, 1, 9, -1, 3.5])).toEqual([1, 5])
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeScheduledDays(undefined)).toEqual([])
  })
})

describe('getHabitScheduledDays', () => {
  it('maps frequencies to weekday sets', () => {
    expect(getHabitScheduledDays(makeHabit({ frequency: 'daily' }))).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(getHabitScheduledDays(makeHabit({ frequency: 'weekdays' }))).toEqual([1, 2, 3, 4, 5])
    expect(getHabitScheduledDays(makeHabit({ frequency: 'weekend' }))).toEqual([0, 6])
    expect(
      getHabitScheduledDays(makeHabit({ frequency: 'custom', scheduledDays: [3, 1] })),
    ).toEqual([1, 3])
  })
})

describe('date keys', () => {
  it('formats and parses local date keys as a roundtrip', () => {
    const date = new Date(2026, 5, 3)
    const key = getLocalDateKey(date)
    expect(key).toBe('2026-06-03')
    expect(parseDateKey(key).getTime()).toBe(date.getTime())
  })
})

describe('isHabitScheduledForDate', () => {
  it('respects weekday schedules', () => {
    const habit = makeHabit({ frequency: 'weekdays' })
    expect(isHabitScheduledForDate(habit, new Date(2026, 5, 8))).toBe(true) // Monday
    expect(isHabitScheduledForDate(habit, new Date(2026, 5, 14))).toBe(false) // Sunday
  })
})

describe('getCurrentStreak', () => {
  it('counts consecutive completed scheduled days ending today', () => {
    const habit = makeHabit({ completions: ['2026-06-08', '2026-06-09', '2026-06-10'] })
    expect(getCurrentStreak(habit, new Date(2026, 5, 10))).toBe(3)
  })

  it('is zero when today is scheduled but not completed', () => {
    const habit = makeHabit({ completions: ['2026-06-08', '2026-06-09'] })
    expect(getCurrentStreak(habit, new Date(2026, 5, 10))).toBe(0)
  })

  it('skips unscheduled days for weekday habits', () => {
    // Today is Sunday June 14; Thursday and Friday completed, weekend not scheduled.
    const habit = makeHabit({
      frequency: 'weekdays',
      completions: ['2026-06-11', '2026-06-12'],
    })
    expect(getCurrentStreak(habit, new Date(2026, 5, 14))).toBe(2)
  })
})

describe('getBestStreak', () => {
  it('returns the longest historical run, not just the current one', () => {
    const habit = makeHabit({
      completions: [
        '2026-06-01',
        '2026-06-02',
        '2026-06-03',
        // June 4 missed.
        '2026-06-05',
        '2026-06-06',
        '2026-06-07',
        '2026-06-08',
        '2026-06-09',
      ],
    })
    expect(getBestStreak(habit, new Date(2026, 5, 10))).toBe(5)
  })

  it('does not break the run when today is still open', () => {
    const habit = makeHabit({ completions: ['2026-06-07', '2026-06-08', '2026-06-09'] })
    expect(getBestStreak(habit, new Date(2026, 5, 10))).toBe(3)
  })

  it('is zero for a habit with no completions', () => {
    expect(getBestStreak(makeHabit(), new Date(2026, 5, 10))).toBe(0)
  })
})

describe('completion helpers', () => {
  it('reports totals and last completed date', () => {
    const habit = makeHabit({ completions: ['2026-06-01', '2026-06-03'] })
    expect(getTotalCompletions(habit)).toBe(2)
    expect(getLastCompletedDate(habit)).toBe('2026-06-03')
    expect(hasCompletionOnDate(habit, '2026-06-01')).toBe(true)
    expect(hasCompletionOnDate(habit, '2026-06-02')).toBe(false)
  })

  it('handles habits without completions', () => {
    const habit = makeHabit({ completions: undefined })
    expect(getTotalCompletions(habit)).toBe(0)
    expect(getLastCompletedDate(habit)).toBeNull()
  })
})

describe('quantity habit helpers', () => {
  it('identifies quantity habits only when a positive target exists', () => {
    expect(isQuantityHabit(makeHabit({ goalType: 'quantity', target: 8 }))).toBe(true)
    expect(isQuantityHabit(makeHabit({ goalType: 'quantity' }))).toBe(false)
    expect(isQuantityHabit(makeHabit({ goalType: 'check', target: 8 }))).toBe(false)
    expect(isQuantityHabit(makeHabit())).toBe(false)
  })

  it('reads progress for a date with a zero fallback', () => {
    const habit = makeHabit({
      goalType: 'quantity',
      target: 8,
      progress: { '2026-06-01': 5 },
    })
    expect(getProgressOnDate(habit, '2026-06-01')).toBe(5)
    expect(getProgressOnDate(habit, '2026-06-02')).toBe(0)
    expect(getProgressOnDate(makeHabit(), '2026-06-01')).toBe(0)
  })
})

describe('getRecentDays', () => {
  it('returns the last 7 days ending today', () => {
    const days = getRecentDays(new Date(2026, 5, 10))
    expect(days).toHaveLength(7)
    expect(days[0].key).toBe('2026-06-04')
    expect(days[6].key).toBe('2026-06-10')
  })
})
