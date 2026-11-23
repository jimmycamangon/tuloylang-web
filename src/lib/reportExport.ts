import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'
import { getLocalDateKey, hasCompletionOnDate, isQuantityHabit } from './habitMetrics'
import { isHabitDueOn } from './analyticsInsights'
import { localDateStamp, saveFiles } from './fileSave'
import type { SaveResult } from './fileSave'

/**
 * Spreadsheet-friendly CSV exports (Excel, Google Sheets, Numbers). Unlike the JSON
 * backup these are for reading and charting, not for restoring.
 */

type Cell = string | number | null | undefined

function escapeCell(value: Cell) {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // Stop spreadsheets from treating user text as a formula.
  if (/^[=+\-@\t\r]/.test(text) && typeof value === 'string') text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: Cell[][]) {
  // BOM so Excel opens UTF-8 (ñ, emoji) correctly; CRLF per RFC 4180.
  return '﻿' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n') + '\r\n'
}

function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/** One row per habit per day it was due or done, from its first day until today. */
export function buildHabitCheckinsCsv(habits: Habit[], today = new Date()) {
  const todayKey = getLocalDateKey(today)
  const rows: Cell[][] = [['Date', 'Weekday', 'Habit', 'Status', 'Amount', 'Target', 'Unit', 'Archived']]
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

  const entries: { key: string; date: Date; habit: Habit }[] = []
  habits.forEach((habit) => {
    const keys = [habit.createdAt, ...(habit.completions ?? [])]
      .map((value) => (value.length === 10 ? value : getLocalDateKey(new Date(value))))
      .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
      .sort()
    if (keys.length === 0) return

    const [year, month, day] = keys[0].split('-').map(Number)
    const cursor = new Date(year, month - 1, day)
    const end = startOfDay(today)
    while (cursor <= end) {
      const key = getLocalDateKey(cursor)
      const due = isHabitDueOn(habit, cursor, todayKey) || (key === todayKey && hasCompletionOnDate(habit, key))
      if (due) entries.push({ key, date: new Date(cursor), habit })
      cursor.setDate(cursor.getDate() + 1)
    }
  })

  entries
    .sort((left, right) => left.key.localeCompare(right.key) || left.habit.name.localeCompare(right.habit.name))
    .forEach(({ key, date, habit }) => {
      const quantity = isQuantityHabit(habit)
      rows.push([
        key,
        weekday.format(date),
        habit.name,
        hasCompletionOnDate(habit, key) ? 'Done' : 'Missed',
        quantity ? (habit.progress?.[key] ?? 0) : null,
        quantity ? habit.target : null,
        quantity ? habit.unit : null,
        habit.isArchived ? 'Yes' : 'No',
      ])
    })

  return toCsv(rows)
}

export function buildWorkoutsCsv(workouts: WorkoutEntry[]) {
  const rows: Cell[][] = [
    ['Date', 'Time', 'Workout', 'Category', 'Minutes', 'Intensity', 'Exercises', 'Notes'],
  ]
  const pad = (value: number) => String(value).padStart(2, '0')

  ;[...workouts]
    .sort((left, right) => left.performedAt.localeCompare(right.performedAt))
    .forEach((workout) => {
      const date = new Date(workout.performedAt)
      const exercises = (workout.exercises ?? [])
        .map((exercise) => {
          const detail = exercise.reps
            ? `${exercise.sets}x${exercise.reps}`
            : exercise.holdSeconds
              ? `${exercise.sets}x${exercise.holdSeconds}s`
              : `${exercise.sets} sets`
          return `${exercise.name} ${detail}`
        })
        .join('; ')

      rows.push([
        getLocalDateKey(date),
        `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        workout.title,
        workout.category,
        workout.durationMinutes,
        workout.intensity,
        exercises,
        workout.notes,
      ])
    })

  return toCsv(rows)
}

export async function exportCsvFiles(habits: Habit[], workouts: WorkoutEntry[]): Promise<SaveResult> {
  const stamp = localDateStamp()
  const files = [
    new File([buildHabitCheckinsCsv(habits)], `tuloylang-habits-${stamp}.csv`, { type: 'text/csv' }),
    new File([buildWorkoutsCsv(workouts)], `tuloylang-workouts-${stamp}.csv`, { type: 'text/csv' }),
  ]
  return saveFiles(files, {
    title: 'TuloyLang data',
    text: 'My TuloyLang habit check-ins and workouts.',
  })
}
