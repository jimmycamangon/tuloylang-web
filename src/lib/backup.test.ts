import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppData } from '../types/appData'
import type { Habit } from '../types/habit'
import {
  BACKUP_META_CHANGED_EVENT,
  BACKUP_META_STORAGE_KEY,
  describeLastBackup,
  getBackupReminder,
  readBackupMeta,
  recordBackup,
  snoozeBackupReminder,
} from './backup'

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

const NOW = new Date('2026-11-23T12:00:00.000Z')
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

function makeHabit(createdAt: string): Habit {
  return {
    id: `habit-${createdAt}`,
    name: 'Drink water',
    description: '',
    frequency: 'daily',
    createdAt,
  }
}

function makeAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    version: 1,
    habits: [],
    workouts: [],
    workoutTemplates: [],
    bodyMetrics: [],
    goals: { habitCompletions: 7, workoutSessions: 3 },
    ...overrides,
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createLocalStorageMock())
  vi.stubGlobal('window', new EventTarget())
})

describe('getBackupReminder', () => {
  it('stays quiet when there is no saved data', () => {
    expect(getBackupReminder(makeAppData(), {}, NOW)).toBeNull()
  })

  it('gives new users a grace period before the first reminder', () => {
    const appData = makeAppData({ habits: [makeHabit(daysAgo(2))] })
    expect(getBackupReminder(appData, {}, NOW)).toBeNull()
  })

  it('reminds users who have never backed up once data is a few days old', () => {
    const appData = makeAppData({ habits: [makeHabit(daysAgo(10)), makeHabit(daysAgo(1))] })
    expect(getBackupReminder(appData, {}, NOW)).toEqual({ kind: 'never', dataAgeDays: 10 })
  })

  it('stays quiet after a recent backup', () => {
    const appData = makeAppData({ habits: [makeHabit(daysAgo(60))] })
    expect(getBackupReminder(appData, { lastBackupAt: daysAgo(13) }, NOW)).toBeNull()
  })

  it('reminds again when the last backup is two weeks old', () => {
    const appData = makeAppData({ habits: [makeHabit(daysAgo(60))] })
    expect(getBackupReminder(appData, { lastBackupAt: daysAgo(14) }, NOW)).toEqual({
      kind: 'overdue',
      daysSinceBackup: 14,
    })
  })

  it('respects a snooze until it expires', () => {
    const appData = makeAppData({ habits: [makeHabit(daysAgo(60))] })
    const snoozed = { snoozedUntil: new Date(NOW.getTime() + 1000).toISOString() }
    const expired = { snoozedUntil: daysAgo(1) }
    expect(getBackupReminder(appData, snoozed, NOW)).toBeNull()
    expect(getBackupReminder(appData, expired, NOW)?.kind).toBe('never')
  })

  it('counts workouts, templates and body metrics as data too', () => {
    const appData = makeAppData({
      bodyMetrics: [{ id: 'm1', date: '2026-11-01', weightKg: 70, createdAt: daysAgo(5) }],
    })
    expect(getBackupReminder(appData, {}, NOW)).toEqual({ kind: 'never', dataAgeDays: 5 })
  })
})

describe('backup metadata', () => {
  it('records a backup, clears any snooze, and notifies listeners', () => {
    const listener = vi.fn()
    window.addEventListener(BACKUP_META_CHANGED_EVENT, listener)

    snoozeBackupReminder(NOW)
    expect(readBackupMeta().snoozedUntil).toBeDefined()

    recordBackup(NOW)
    expect(readBackupMeta()).toEqual({ lastBackupAt: NOW.toISOString(), snoozedUntil: undefined })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('snoozes for seven days', () => {
    snoozeBackupReminder(NOW)
    expect(readBackupMeta().snoozedUntil).toBe('2026-11-30T12:00:00.000Z')
  })

  it('ignores corrupted metadata instead of crashing', () => {
    localStorage.setItem(BACKUP_META_STORAGE_KEY, '{not json')
    expect(readBackupMeta()).toEqual({})
    localStorage.setItem(BACKUP_META_STORAGE_KEY, JSON.stringify({ lastBackupAt: 42 }))
    expect(readBackupMeta()).toEqual({ lastBackupAt: undefined, snoozedUntil: undefined })
  })
})

describe('describeLastBackup', () => {
  it('describes the last backup in plain words', () => {
    expect(describeLastBackup({}, NOW)).toBeNull()
    expect(describeLastBackup({ lastBackupAt: daysAgo(0) }, NOW)).toBe('today')
    expect(describeLastBackup({ lastBackupAt: daysAgo(1) }, NOW)).toBe('yesterday')
    expect(describeLastBackup({ lastBackupAt: daysAgo(20) }, NOW)).toBe('20 days ago')
  })
})
