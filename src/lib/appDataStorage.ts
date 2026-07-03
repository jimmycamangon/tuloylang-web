import type { AppData } from '../types/appData'
import type { WeeklyGoals } from '../types/goal'
import type { Habit } from '../types/habit'
import type { WorkoutEntry, WorkoutTemplate } from '../types/workout'
import { normalizeScheduledDays } from './habitMetrics'

export const APP_DATA_STORAGE_KEY = 'tuloylang_app_data'

const defaultGoals: WeeklyGoals = {
  habitCompletions: 7,
  workoutSessions: 3,
}

const defaultAppData: AppData = {
  version: 7,
  habits: [],
  workouts: [],
  workoutTemplates: [],
  goals: defaultGoals,
}

function normalizeGoals(value: unknown): WeeklyGoals {
  if (!value || typeof value !== 'object') return defaultGoals

  const goals = value as Partial<WeeklyGoals>

  return {
    habitCompletions:
      typeof goals.habitCompletions === 'number' &&
      Number.isFinite(goals.habitCompletions) &&
      goals.habitCompletions > 0
        ? Math.round(goals.habitCompletions)
        : defaultGoals.habitCompletions,
    workoutSessions:
      typeof goals.workoutSessions === 'number' &&
      Number.isFinite(goals.workoutSessions) &&
      goals.workoutSessions > 0
        ? Math.round(goals.workoutSessions)
        : defaultGoals.workoutSessions,
  }
}

function isHabit(value: unknown): value is Habit {
  if (!value || typeof value !== 'object') return false

  const habit = value as Partial<Habit> & { isArchieved?: unknown }

  return (
    typeof habit.id === 'string' &&
    typeof habit.name === 'string' &&
    typeof habit.description === 'string' &&
    (habit.frequency === 'daily' ||
      habit.frequency === 'weekdays' ||
      habit.frequency === 'weekend' ||
      habit.frequency === 'custom') &&
    typeof habit.createdAt === 'string' &&
    (habit.scheduledDays === undefined ||
      (Array.isArray(habit.scheduledDays) &&
        habit.scheduledDays.every(
          (entry) => Number.isInteger(entry) && entry >= 0 && entry <= 6,
        ))) &&
    (habit.completions === undefined ||
      (Array.isArray(habit.completions) &&
        habit.completions.every((entry) => typeof entry === 'string'))) &&
    (habit.isArchived === undefined ||
      typeof habit.isArchived === 'boolean' ||
      typeof habit.isArchieved === 'boolean') &&
    (habit.goalType === undefined ||
      habit.goalType === 'check' ||
      habit.goalType === 'quantity') &&
    (habit.target === undefined ||
      (typeof habit.target === 'number' && Number.isFinite(habit.target) && habit.target > 0)) &&
    (habit.unit === undefined || typeof habit.unit === 'string') &&
    (habit.progress === undefined ||
      (typeof habit.progress === 'object' && habit.progress !== null))
  )
}

function normalizeProgress(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {}

  const normalized: Record<string, number> = {}

  Object.entries(value as Record<string, unknown>).forEach(([dateKey, amount]) => {
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(dateKey) &&
      typeof amount === 'number' &&
      Number.isFinite(amount) &&
      amount > 0
    ) {
      normalized[dateKey] = amount
    }
  })

  return normalized
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

function isWorkoutTemplate(value: unknown): value is WorkoutTemplate {
  if (!value || typeof value !== 'object') return false

  const template = value as Partial<WorkoutTemplate>

  return (
    typeof template.id === 'string' &&
    typeof template.title === 'string' &&
    typeof template.category === 'string' &&
    typeof template.durationMinutes === 'number' &&
    Number.isFinite(template.durationMinutes) &&
    template.durationMinutes > 0 &&
    (template.intensity === 'low' ||
      template.intensity === 'moderate' ||
      template.intensity === 'high') &&
    typeof template.notes === 'string' &&
    typeof template.createdAt === 'string'
  )
}

function normalizeAppData(value: unknown): AppData {
  const parsed = value as Partial<AppData>

  return {
    version: typeof parsed.version === 'number' ? Math.max(parsed.version, 7) : 7,
    habits: Array.isArray(parsed.habits)
      ? parsed.habits.filter(isHabit).map((habit) => {
          const normalizedHabit = habit as Habit & { isArchieved?: boolean }
          const goalType = normalizedHabit.goalType === 'quantity' ? 'quantity' : 'check'
          const progress = normalizeProgress(normalizedHabit.progress)
          const target =
            typeof normalizedHabit.target === 'number' && normalizedHabit.target > 0
              ? normalizedHabit.target
              : undefined
          const storedCompletions = Array.isArray(normalizedHabit.completions)
            ? [...new Set(normalizedHabit.completions)].sort()
            : []

          // For quantity habits, completions are derived from progress vs target
          // so there is a single source of truth for streaks and heatmaps.
          const completions =
            goalType === 'quantity' && target !== undefined
              ? Object.entries(progress)
                  .filter(([, amount]) => amount >= target)
                  .map(([dateKey]) => dateKey)
                  .sort()
              : storedCompletions

          return {
            ...normalizedHabit,
            scheduledDays: normalizeScheduledDays(normalizedHabit.scheduledDays),
            completions,
            isArchived: normalizedHabit.isArchived ?? normalizedHabit.isArchieved ?? false,
            goalType,
            target: goalType === 'quantity' ? target : undefined,
            unit:
              goalType === 'quantity' && typeof normalizedHabit.unit === 'string'
                ? normalizedHabit.unit
                : undefined,
            progress: goalType === 'quantity' ? progress : undefined,
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
    workoutTemplates: Array.isArray(parsed.workoutTemplates)
      ? parsed.workoutTemplates
          .filter(isWorkoutTemplate)
          .map((template) => ({
            ...template,
            durationMinutes: Math.round(template.durationMinutes),
          }))
          .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      : [],
    goals: normalizeGoals(parsed.goals),
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

function mergeAppData(currentData: AppData, importedData: AppData): AppData {
  const mergedHabits = [...currentData.habits]
  importedData.habits.forEach((habit) => {
    const index = mergedHabits.findIndex((item) => item.id === habit.id)
    if (index >= 0) mergedHabits[index] = habit
    else mergedHabits.push(habit)
  })

  const mergedWorkouts = [...currentData.workouts]
  importedData.workouts.forEach((workout) => {
    const index = mergedWorkouts.findIndex((item) => item.id === workout.id)
    if (index >= 0) mergedWorkouts[index] = workout
    else mergedWorkouts.push(workout)
  })

  const mergedTemplates = [...currentData.workoutTemplates]
  importedData.workoutTemplates.forEach((template) => {
    const index = mergedTemplates.findIndex((item) => item.id === template.id)
    if (index >= 0) mergedTemplates[index] = template
    else mergedTemplates.push(template)
  })

  return {
    ...currentData,
    habits: mergedHabits.sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    workouts: mergedWorkouts.sort((left, right) => right.performedAt.localeCompare(left.performedAt)),
    workoutTemplates: mergedTemplates.sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    ),
    goals: importedData.goals,
    version: Math.max(currentData.version, importedData.version),
  }
}

export function updateWeeklyGoals(goals: WeeklyGoals) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    goals: normalizeGoals(goals),
  }

  saveAppData(nextData)
  return nextData
}

export function importAppData(jsonText: string, mode: 'replace' | 'merge' = 'replace') {
  const parsed = JSON.parse(jsonText) as unknown
  const importedData = normalizeAppData(parsed)
  const nextData = mode === 'merge' ? mergeAppData(readAppData(), importedData) : importedData

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

export function setHabitProgress(habitId: string, dateKey: string, amount: number) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    habits: currentData.habits.map((habit) => {
      if (habit.id !== habitId) return habit

      const safeAmount = Number.isFinite(amount) && amount > 0 ? amount : 0
      const nextProgress = { ...(habit.progress ?? {}) }

      if (safeAmount > 0) nextProgress[dateKey] = safeAmount
      else delete nextProgress[dateKey]

      const nextCompletions = new Set(habit.completions ?? [])
      const target = habit.target ?? 0
      if (target > 0 && safeAmount >= target) nextCompletions.add(dateKey)
      else nextCompletions.delete(dateKey)

      return {
        ...habit,
        progress: nextProgress,
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

export function saveWorkoutTemplate(template: WorkoutTemplate) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    workoutTemplates: [...currentData.workoutTemplates, template].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    ),
  }

  saveAppData(nextData)
  return nextData
}

export function deleteWorkoutTemplate(templateId: string) {
  const currentData = readAppData()
  const nextData: AppData = {
    ...currentData,
    workoutTemplates: currentData.workoutTemplates.filter((template) => template.id !== templateId),
  }

  saveAppData(nextData)
  return nextData
}
