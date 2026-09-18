import type { BodyMetric } from './bodyMetric'
import type { Habit } from './habit'
import type { WeeklyGoals } from './goal'
import type { WorkoutEntry, WorkoutTemplate } from './workout'

export interface AppData {
  version: number
  habits: Habit[]
  workouts: WorkoutEntry[]
  workoutTemplates: WorkoutTemplate[]
  bodyMetrics: BodyMetric[]
  goals: WeeklyGoals
}