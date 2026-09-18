import type { ExerciseEntry, WorkoutEntry } from '../types/workout'

export type ExerciseTrend = 'improving' | 'plateaued' | 'ready-to-level-up' | 'new'

export interface ExerciseProgress {
  name: string
  latestDate: string
  latestSets: number
  latestReps?: number
  latestHoldSeconds?: number
  trend: ExerciseTrend
}

// Known level-up thresholds discussed for common bodyweight moves.
// Matched by keyword so "Push-ups", "push up", "Diamond Push-ups" all match.
const levelUpThresholds: { keywords: string[]; reps?: number; holdSeconds?: number }[] = [
  { keywords: ['push-up', 'pushup', 'push up'], reps: 15 },
  { keywords: ['plank'], holdSeconds: 60 },
  { keywords: ['squat'], reps: 20 },
  { keywords: ['dip'], reps: 15 },
  { keywords: ['pull-up', 'pullup', 'pull up'], reps: 10 },
]

function findThreshold(name: string) {
  const lower = name.toLowerCase()
  return levelUpThresholds.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword)))
}

// Reps is the primary progress signal; fall back to hold time, then sets.
function getMetricValue(exercise: ExerciseEntry): number {
  if (exercise.reps !== undefined) return exercise.reps
  if (exercise.holdSeconds !== undefined) return exercise.holdSeconds
  return exercise.sets
}

export function computeExerciseProgress(workouts: WorkoutEntry[]): ExerciseProgress[] {
  const history = new Map<string, { date: string; exercise: ExerciseEntry }[]>()

  const sortedWorkouts = [...workouts].sort((left, right) =>
    left.performedAt.localeCompare(right.performedAt),
  )

  sortedWorkouts.forEach((workout) => {
    ;(workout.exercises ?? []).forEach((exercise) => {
      const key = exercise.name.trim().toLowerCase()
      if (!key) return

      const entries = history.get(key) ?? []
      entries.push({ date: workout.performedAt, exercise })
      history.set(key, entries)
    })
  })

  const progress: ExerciseProgress[] = []

  history.forEach((entries) => {
    const latest = entries[entries.length - 1]
    const previous = entries.length > 1 ? entries[entries.length - 2] : undefined

    let trend: ExerciseTrend = 'new'

    if (previous) {
      const latestValue = getMetricValue(latest.exercise)
      const previousValue = getMetricValue(previous.exercise)
      const plateaued = latestValue <= previousValue

      const threshold = findThreshold(latest.exercise.name)
      const meetsThreshold =
        threshold !== undefined &&
        ((threshold.reps !== undefined && (latest.exercise.reps ?? 0) >= threshold.reps) ||
          (threshold.holdSeconds !== undefined &&
            (latest.exercise.holdSeconds ?? 0) >= threshold.holdSeconds))

      if (plateaued && meetsThreshold) trend = 'ready-to-level-up'
      else if (plateaued) trend = 'plateaued'
      else trend = 'improving'
    }

    progress.push({
      name: latest.exercise.name,
      latestDate: latest.date,
      latestSets: latest.exercise.sets,
      latestReps: latest.exercise.reps,
      latestHoldSeconds: latest.exercise.holdSeconds,
      trend,
    })
  })

  return progress.sort((left, right) => right.latestDate.localeCompare(left.latestDate))
}