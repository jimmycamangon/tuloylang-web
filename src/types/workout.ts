export type WorkoutIntensity = 'low' | 'moderate' | 'high'

export interface WorkoutEntry {
  id: string
  title: string
  category: string
  durationMinutes: number
  intensity: WorkoutIntensity
  performedAt: string
  notes: string
  createdAt: string
}
