import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildHabitCheckinsCsv, buildWorkoutsCsv, toCsv } from './reportExport'
import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'

const originalTz = process.env.TZ
beforeAll(() => {
  process.env.TZ = 'Asia/Manila'
})
afterAll(() => {
  process.env.TZ = originalTz
})

function lines(csv: string) {
  return csv.replace(/^﻿/, '').trimEnd().split('\r\n')
}

describe('toCsv', () => {
  it('quotes commas, quotes and newlines, and defuses formulas', () => {
    const csv = toCsv([['a,b', 'say "hi"', 'line\nbreak', '=SUM(A1)', -5]])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(lines(csv)[0]).toBe('"a,b","say ""hi""","line\nbreak",\'=SUM(A1),-5')
  })
})

describe('buildHabitCheckinsCsv', () => {
  it('lists done and missed days from the first day until today', () => {
    const habit: Habit = {
      id: 'h1',
      name: 'Water',
      description: '',
      frequency: 'daily',
      createdAt: new Date(2026, 5, 27, 9).toISOString(),
      completions: ['2026-06-27', '2026-06-29'],
      goalType: 'quantity',
      target: 8,
      unit: 'glasses',
      progress: { '2026-06-27': 8, '2026-06-28': 3, '2026-06-29': 9 },
    }
    const rows = lines(buildHabitCheckinsCsv([habit], new Date(2026, 5, 30, 12)))

    expect(rows[0]).toBe('Date,Weekday,Habit,Status,Amount,Target,Unit,Archived')
    // Today (30th) is still open, so it is not listed as missed.
    expect(rows.slice(1)).toEqual([
      '2026-06-27,Sat,Water,Done,8,8,glasses,No',
      '2026-06-28,Sun,Water,Missed,3,8,glasses,No',
      '2026-06-29,Mon,Water,Done,9,8,glasses,No',
    ])
  })
})

describe('buildWorkoutsCsv', () => {
  it('writes local date and time with exercises', () => {
    const workout: WorkoutEntry = {
      id: 'w1',
      title: 'Upper body',
      category: 'Strength',
      durationMinutes: 40,
      intensity: 'high',
      performedAt: '2026-06-29T10:30:00.000Z',
      notes: 'Felt strong',
      createdAt: '2026-06-29T10:30:00.000Z',
      exercises: [
        { name: 'Push-ups', sets: 3, reps: 12 },
        { name: 'Plank', sets: 2, holdSeconds: 45 },
      ],
    }
    const rows = lines(buildWorkoutsCsv([workout]))
    expect(rows[1]).toBe(
      '2026-06-29,18:30,Upper body,Strength,40,high,Push-ups 3x12; Plank 2x45s,Felt strong',
    )
  })
})
