export type Frequency = 'daily' | 'weekdays' | 'weekend' | 'custom'

export type Weekday =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6

export type HabitGoalType = 'check' | 'quantity'

export interface Habit {
  id: string
  name: string
  description: string
  frequency: Frequency
  scheduledDays?: Weekday[]
  createdAt: string
  isArchived?: boolean
  completions?: string[]
  /** 'check' (default) marks days done/undone; 'quantity' tracks an amount toward a target. */
  goalType?: HabitGoalType
  /** Daily target amount for quantity habits, e.g. 8. */
  target?: number
  /** Unit label for quantity habits, e.g. 'glasses'. */
  unit?: string
  /** Logged amounts per date key for quantity habits, e.g. { '2026-07-03': 5 }. */
  progress?: Record<string, number>
}
