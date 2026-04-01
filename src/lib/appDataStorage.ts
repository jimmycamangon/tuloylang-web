import type { AppData } from '../types/appData'
import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'

export const APP_DATA_STORAGE_KEY = 'tuloylang_app_data'

const defaultAppData: AppData = {
  version: 3,
  habits: [],
  workouts: [],
}

function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== 'object') return false

  const habit = value as Partial<Habit> & { isArchieved?: unknown }

  return (
    typeof habit.id === 'string' &&
    typeof habit.name === 'string' &&
    typeof habit.description === 'string' &&
    (habit.frequency === 'daily' || habit.frequency === 'weekend') &&
    typeof habit.createdAt === 'string' &&
    (habit.completions === undefined ||
      (Array.isArray(habit.completions) &&
        habit.completions.every((entry) => typeof entry === 'string'))) &&
    (habit.isArchived === undefined ||
      typeof habit.isArchived === 'boolean' ||
      typeof habit.isArchieved === 'boolean')
  )
}

function isWorkoutEntry(value: unknown): value is WorkoutEntry {
  if (!value || typeof value !== 'object') return false

  const workout = value as Partial<WorkoutEntry>

  return (
    typeof workout.id === 'string' &&
    typeof workout.title === 'string' &&
    typeof workout.category === 'string' &&
    typeof workout.durationMinutes === 'number' &&
    Number.isFinite(workout.durationMinutes) &&
    workout.durationMinutes > 0 &&
    (workout.intensity === 'low' ||
      workout.intensity === 'moderate' ||
      workout.intensity === 'high') &&
    typeof workout.performedAt === 'string' &&
    typeof workout.notes === 'string' &&
    typeof workout.createdAt === 'string'
  )
}

function normalizeAppData(value: unknown): AppData {
  const parsed = value as Partial<AppData>

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 3,
    habits: Array.isArray(parsed.habits)
      ? parsed.habits.filter(isHabit).map((habit) => {
          const normalizedHabit = habit as Habit & { isArchieved?: boolean }

          return {
            ...normalizedHabit,
            completions: Array.isArray(normalizedHabit.completions)
              ? [...new Set(normalizedHabit.completions)].sort()
              : [],
            isArchived: normalizedHabit.isArchived ?? normalizedHabit.isArchieved ?? false,
          }
        })
      : [],
    workouts: Array.isArray(parsed.workouts)
      ? parsed.workouts
          .filter(isWorkoutEntry)
          .map((workout) => ({
            ...workout,
            durationMinutes: Math.round(workout.durationMinutes),
          }))
          .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
      : [],
  }
}

export function readAppData(): AppData {
  const saved = localStorage.getItem(APP_DATA_STORAGE_KEY)
  if (!saved) return defaultAppData

  try {
    return normalizeAppData(JSON.parse(saved))
  } catch {
    return defaultAppData
  }
}

export function saveAppData(appData: AppData) {
  localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(appData))
}

export function importAppData(jsonText: string) {
  const parsed = JSON.parse(jsonText) as unknown
  const nextData = normalizeAppData(parsed)

  saveAppData(nextData)
  return nextData
}

export function exportAppData() {
  return JSON.stringify(readAppData(), null, 2)
}

export function downloadAppDataFile() {
  const fileContents = exportAppData()
  const blob = new Blob([fileContents], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const dateStamp = new Date().toISOString().slice(0, 10)

  link.href = url
  link.download = `tuloylang-backup-${dateStamp}.json`
  link.click()

  URL.revokeObjectURL(url)
}

export function saveHabit(habit: Habit) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: [...currentData.habits, habit],
  }

  saveAppData(nextData)
  return nextData
}

export function updateHabit(updatedHabit: Habit) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: currentData.habits.map((habit) =>
      habit.id === updatedHabit.id
        ? { ...updatedHabit, completions: updatedHabit.completions ?? [] }
        : habit,
    ),
  }

  saveAppData(nextData)
  return nextData
}

export function setHabitArchived(habitId: string, isArchived: boolean) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: currentData.habits.map((habit) =>
      habit.id === habitId ? { ...habit, isArchived } : habit,
    ),
  }

  saveAppData(nextData)
  return nextData
}

export function deleteHabitPermanently(habitId: string) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: currentData.habits.filter((habit) => habit.id !== habitId),
  }

  saveAppData(nextData)
  return nextData
}

export function setHabitCompletion(habitId: string, dateKey: string, completed: boolean) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: currentData.habits.map((habit) => {
      if (habit.id !== habitId) return habit

      const nextCompletions = new Set(habit.completions ?? [])
      if (completed) nextCompletions.add(dateKey)
      else nextCompletions.delete(dateKey)

      return {
        ...habit,
        completions: [...nextCompletions].sort(),
      }
    }),
  }

  saveAppData(nextData)
  return nextData
}

export function saveWorkout(workout: WorkoutEntry) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    workouts: [...currentData.workouts, workout].sort((left, right) =>
      right.performedAt.localeCompare(left.performedAt),
    ),
  }

  saveAppData(nextData)
  return nextData
}

export function updateWorkout(updatedWorkout: WorkoutEntry) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    workouts: currentData.workouts
      .map((workout) => (workout.id === updatedWorkout.id ? updatedWorkout : workout))
      .sort((left, right) => right.performedAt.localeCompare(left.performedAt)),
  }

  saveAppData(nextData)
  return nextData
}

export function deleteWorkout(workoutId: string) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    workouts: currentData.workouts.filter((workout) => workout.id !== workoutId),
  }

  saveAppData(nextData)
  return nextData
}
