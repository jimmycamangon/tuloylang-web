import type { AppData } from '../types/appData'
import type { Habit } from '../types/habit'

export const APP_DATA_STORAGE_KEY = 'tuloylang_app_data'

const defaultAppData: AppData = {
  version: 1,
  habits: [],
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
    (habit.isArchived === undefined ||
      typeof habit.isArchived === 'boolean' ||
      typeof habit.isArchieved === 'boolean')
  )
}

function normalizeAppData(value: unknown): AppData {
  const parsed = value as Partial<AppData>

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    habits: Array.isArray(parsed.habits)
      ? parsed.habits.filter(isHabit).map((habit) => {
          const normalizedHabit = habit as Habit & { isArchieved?: boolean }

          return {
            ...normalizedHabit,
            isArchived: normalizedHabit.isArchived ?? normalizedHabit.isArchieved ?? false,
          }
        })
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
      habit.id === updatedHabit.id ? updatedHabit : habit,
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
