export type WorkoutIntensity = 'low' | 'moderate' | 'high'

export interface ExerciseEntry {
  name: string
  sets: number
  reps?: number
  holdSeconds?: number
}

export type TemplateDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface WorkoutTemplate {
  id: string
  title: string
  category: string
  durationMinutes: number
  intensity: WorkoutIntensity
  notes: string
  createdAt: string
  exercises?: ExerciseEntry[]
  /** Day of week this template is meant for (0 = Sunday ... 6 = Saturday). Optional — unassigned templates show for any day. */
  assignedDay?: TemplateDay
}

export interface WorkoutEntry {
  id: string
  title: string
  category: string
  durationMinutes: number
  intensity: WorkoutIntensity
  performedAt: string
  notes: string
  createdAt: string
  exercises?: ExerciseEntry[]
}