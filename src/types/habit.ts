
export type Frequency = 'daily' | 'weekend'

export interface Habit {
  id: string
  name: string
  description: string
  frequency: Frequency
  createdAt: string
  isArchived?: boolean
}
