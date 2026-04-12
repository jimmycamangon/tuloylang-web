export type Frequency = 'daily' | 'weekdays' | 'weekend' | 'custom'

export type Weekday =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6

export interface Habit {
  id: string
  name: string
  description: string
  frequency: Frequency
  scheduledDays?: Weekday[]
  createdAt: string
  isArchived?: boolean
  completions?: string[]
}
