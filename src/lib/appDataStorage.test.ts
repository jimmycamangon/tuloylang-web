import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Habit } from '../types/habit'
import type { WorkoutEntry } from '../types/workout'
import {
  APP_DATA_STORAGE_KEY,
  deleteHabitPermanently,
  exportAppData,
  importAppData,
  readAppData,
  saveAppData,
  saveHabit,
  saveWorkout,
  setHabitArchived,
  setHabitCompletion,
  setHabitProgress,
  updateHabit,
  updateWeeklyGoals,
} from './appDataStorage'

function createLocalStorageMock(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key)
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
  }
}

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    name: 'Drink water',
    description: 'Eight glasses',
    frequency: 'daily',
    scheduledDays: [],
    createdAt: '2026-06-01T12:00:00.000Z',
    isArchived: false,
    completions: [],
    ...overrides,
  }
}

function makeWorkout(overrides: Partial<WorkoutEntry> = {}): WorkoutEntry {
  return {
    id: 'workout-1',
    title: 'Morning run',
    category: 'Cardio',
    durationMinutes: 30,
    intensity: 'moderate',
    performedAt: '2026-06-01T07:00:00.000Z',
    notes: '',
    createdAt: '2026-06-01T08:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock())
})

describe('readAppData', () => {
  it('returns defaults when storage is empty', () => {
    const data = readAppData()
    expect(data.habits).toEqual([])
    expect(data.workouts).toEqual([])
    expect(data.workoutTemplates).toEqual([])
    expect(data.goals).toEqual({ habitCompletions: 7, workoutSessions: 3 })
  })

  it('returns defaults for corrupt JSON', () => {
    localStorage.setItem(APP_DATA_STORAGE_KEY, '{not json')
    expect(readAppData().habits).toEqual([])
  })

  it('filters out invalid habit entries', () => {
    localStorage.setItem(
      APP_DATA_STORAGE_KEY,
      JSON.stringify({
        version: 6,
        habits: [makeHabit(), { id: 'bad', name: 42 }, null, 'nope'],
        workouts: [],
        workoutTemplates: [],
        goals: { habitCompletions: 7, workoutSessions: 3 },
      }),
    )

    const data = readAppData()
    expect(data.habits).toHaveLength(1)
    expect(data.habits[0].id).toBe('habit-1')
  })

  it('migrates the legacy isArchieved typo and normalizes completions', () => {
    const legacyHabit = {
      ...makeHabit({ isArchived: undefined }),
      isArchieved: true,
      completions: ['2026-06-03', '2026-06-01', '2026-06-03'],
    }
    localStorage.setItem(
      APP_DATA_STORAGE_KEY,
      JSON.stringify({ version: 6, habits: [legacyHabit], workouts: [], workoutTemplates: [] }),
    )

    const habit = readAppData().habits[0]
    expect(habit.isArchived).toBe(true)
    expect(habit.completions).toEqual(['2026-06-01', '2026-06-03'])
  })

  it('normalizes invalid goals to defaults', () => {
    localStorage.setItem(
      APP_DATA_STORAGE_KEY,
      JSON.stringify({
        version: 6,
        habits: [],
        workouts: [],
        workoutTemplates: [],
        goals: { habitCompletions: -2, workoutSessions: 'many' },
      }),
    )

    expect(readAppData().goals).toEqual({ habitCompletions: 7, workoutSessions: 3 })
  })

  it('sorts workouts by performedAt descending and rounds durations', () => {
    localStorage.setItem(
      APP_DATA_STORAGE_KEY,
      JSON.stringify({
        version: 6,
        habits: [],
        workouts: [
          makeWorkout({ id: 'w-old', performedAt: '2026-06-01T07:00:00.000Z' }),
          makeWorkout({
            id: 'w-new',
            performedAt: '2026-06-05T07:00:00.000Z',
            durationMinutes: 29.6,
          }),
        ],
        workoutTemplates: [],
      }),
    )

    const workouts = readAppData().workouts
    expect(workouts.map((workout) => workout.id)).toEqual(['w-new', 'w-old'])
    expect(workouts[0].durationMinutes).toBe(30)
  })
})

describe('habit mutations', () => {
  it('saves, updates, archives, and deletes habits', () => {
    saveHabit(makeHabit())
    expect(readAppData().habits).toHaveLength(1)

    updateHabit(makeHabit({ name: 'Drink more water' }))
    expect(readAppData().habits[0].name).toBe('Drink more water')

    setHabitArchived('habit-1', true)
    expect(readAppData().habits[0].isArchived).toBe(true)

    deleteHabitPermanently('habit-1')
    expect(readAppData().habits).toHaveLength(0)
  })

  it('adds and removes completions idempotently', () => {
    saveHabit(makeHabit())

    setHabitCompletion('habit-1', '2026-06-02', true)
    setHabitCompletion('habit-1', '2026-06-01', true)
    setHabitCompletion('habit-1', '2026-06-01', true)
    expect(readAppData().habits[0].completions).toEqual(['2026-06-01', '2026-06-02'])

    setHabitCompletion('habit-1', '2026-06-01', false)
    expect(readAppData().habits[0].completions).toEqual(['2026-06-02'])
  })
})

describe('quantity habits', () => {
  function makeQuantityHabit(overrides: Partial<Habit> = {}): Habit {
    return makeHabit({
      goalType: 'quantity',
      target: 8,
      unit: 'glasses',
      progress: {},
      ...overrides,
    })
  }

  it('accepts quantity fields through validation', () => {
    saveHabit(makeQuantityHabit())
    const habit = readAppData().habits[0]
    expect(habit.goalType).toBe('quantity')
    expect(habit.target).toBe(8)
    expect(habit.unit).toBe('glasses')
  })

  it('defaults legacy habits without goalType to check', () => {
    saveHabit(makeHabit())
    expect(readAppData().habits[0].goalType).toBe('check')
  })

  it('drops invalid progress entries on read', () => {
    saveHabit(
      makeQuantityHabit({
        progress: {
          '2026-06-01': 5,
          'not-a-date': 3,
          '2026-06-02': -1,
        } as Record<string, number>,
      }),
    )

    expect(readAppData().habits[0].progress).toEqual({ '2026-06-01': 5 })
  })

  it('derives completions from progress meeting the target', () => {
    saveHabit(
      makeQuantityHabit({
        progress: { '2026-06-01': 8, '2026-06-02': 3, '2026-06-03': 10 },
        completions: [],
      }),
    )

    expect(readAppData().habits[0].completions).toEqual(['2026-06-01', '2026-06-03'])
  })

  it('setHabitProgress adds a completion when the target is met and removes it when it drops below', () => {
    saveHabit(makeQuantityHabit())

    setHabitProgress('habit-1', '2026-06-01', 8)
    expect(readAppData().habits[0].completions).toEqual(['2026-06-01'])
    expect(readAppData().habits[0].progress).toEqual({ '2026-06-01': 8 })

    setHabitProgress('habit-1', '2026-06-01', 4)
    expect(readAppData().habits[0].completions).toEqual([])
    expect(readAppData().habits[0].progress).toEqual({ '2026-06-01': 4 })
  })

  it('setHabitProgress with zero clears the day entirely', () => {
    saveHabit(makeQuantityHabit())

    setHabitProgress('habit-1', '2026-06-01', 5)
    setHabitProgress('habit-1', '2026-06-01', 0)

    const habit = readAppData().habits[0]
    expect(habit.progress).toEqual({})
    expect(habit.completions).toEqual([])
  })

  it('re-derives completions when the target changes', () => {
    saveHabit(makeQuantityHabit({ progress: { '2026-06-01': 5 } }))
    expect(readAppData().habits[0].completions).toEqual([])

    updateHabit(makeQuantityHabit({ target: 5, progress: { '2026-06-01': 5 } }))
    expect(readAppData().habits[0].completions).toEqual(['2026-06-01'])
  })
})

describe('goals and workouts', () => {
  it('rounds valid weekly goals and rejects invalid ones', () => {
    expect(updateWeeklyGoals({ habitCompletions: 5.4, workoutSessions: 2 }).goals).toEqual({
      habitCompletions: 5,
      workoutSessions: 2,
    })
    expect(updateWeeklyGoals({ habitCompletions: 0, workoutSessions: Number.NaN }).goals).toEqual({
      habitCompletions: 7,
      workoutSessions: 3,
    })
  })

  it('keeps workouts sorted after saving', () => {
    saveWorkout(makeWorkout({ id: 'w-old', performedAt: '2026-06-01T07:00:00.000Z' }))
    saveWorkout(makeWorkout({ id: 'w-new', performedAt: '2026-06-05T07:00:00.000Z' }))
    expect(readAppData().workouts.map((workout) => workout.id)).toEqual(['w-new', 'w-old'])
  })
})

describe('import and export', () => {
  it('roundtrips through export and import', () => {
    saveHabit(makeHabit())
    const exported = exportAppData()

    localStorage.clear()
    importAppData(exported)
    expect(readAppData().habits).toHaveLength(1)
  })

  it('replace mode discards existing data', () => {
    saveHabit(makeHabit({ id: 'existing' }))

    importAppData(
      JSON.stringify({
        version: 6,
        habits: [makeHabit({ id: 'imported' })],
        workouts: [],
        workoutTemplates: [],
        goals: { habitCompletions: 10, workoutSessions: 4 },
      }),
    )

    const data = readAppData()
    expect(data.habits.map((habit) => habit.id)).toEqual(['imported'])
    expect(data.goals).toEqual({ habitCompletions: 10, workoutSessions: 4 })
  })

  it('merge mode overwrites matching ids and appends new ones', () => {
    saveHabit(makeHabit({ id: 'shared', name: 'Old name' }))
    saveHabit(makeHabit({ id: 'mine-only' }))

    importAppData(
      JSON.stringify({
        version: 6,
        habits: [
          makeHabit({ id: 'shared', name: 'New name' }),
          makeHabit({ id: 'theirs-only' }),
        ],
        workouts: [],
        workoutTemplates: [],
        goals: { habitCompletions: 9, workoutSessions: 5 },
      }),
      'merge',
    )

    const data = readAppData()
    expect(data.habits).toHaveLength(3)
    expect(data.habits.find((habit) => habit.id === 'shared')?.name).toBe('New name')
    expect(data.goals).toEqual({ habitCompletions: 9, workoutSessions: 5 })
  })

  it('rejects malformed import JSON by throwing', () => {
    expect(() => importAppData('{broken')).toThrow()
  })
})

describe('saveAppData', () => {
  it('persists under the expected storage key', () => {
    saveAppData(readAppData())
    expect(localStorage.getItem(APP_DATA_STORAGE_KEY)).not.toBeNull()
  })
})
