import type { Habit } from './habit'
import type { WorkoutEntry } from './workout'

export interface AppData {
  version: number
  habits: Habit[]
  workouts: WorkoutEntry[]
}
