import { exportAppData, readAppData } from './appDataStorage'
import { localDateStamp, saveFiles } from './fileSave'
import type { SaveResult } from './fileSave'
import type { AppData } from '../types/appData'

/**
 * Data safety helpers. All progress lives only in this browser's localStorage, so this
 * module tracks when the user last saved a backup, nudges them when it is overdue, shares
 * the backup through the phone's share sheet, and asks the browser not to evict the data.
 */

export const BACKUP_META_STORAGE_KEY = 'tuloylang_backup_meta'

/** Remind again when the last backup is older than this. */
export const BACKUP_REMINDER_DAYS = 14
/** Don't nag brand-new users: wait until their oldest record is this old. */
export const FIRST_BACKUP_GRACE_DAYS = 3
/** "Later" hides the reminder for this long. */
export const BACKUP_SNOOZE_DAYS = 7

const DAY_MS = 24 * 60 * 60 * 1000

export interface BackupMeta {
  lastBackupAt?: string
  snoozedUntil?: string
}

export function readBackupMeta(): BackupMeta {
  try {
    const parsed = JSON.parse(localStorage.getItem(BACKUP_META_STORAGE_KEY) ?? '{}') as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    const meta = parsed as Record<string, unknown>
    return {
      lastBackupAt: typeof meta.lastBackupAt === 'string' ? meta.lastBackupAt : undefined,
      snoozedUntil: typeof meta.snoozedUntil === 'string' ? meta.snoozedUntil : undefined,
    }
  } catch {
    return {}
  }
}

function writeBackupMeta(meta: BackupMeta) {
  try {
    localStorage.setItem(BACKUP_META_STORAGE_KEY, JSON.stringify(meta))
  } catch {
    // Storage full or blocked: the reminder simply keeps showing, which is the safe side.
  }
  window.dispatchEvent(new Event(BACKUP_META_CHANGED_EVENT))
}

/** Fired on this window whenever backup metadata changes, so open views can refresh. */
export const BACKUP_META_CHANGED_EVENT = 'tuloylang:backup-meta-changed'

export function recordBackup(now = new Date()) {
  writeBackupMeta({ ...readBackupMeta(), lastBackupAt: now.toISOString(), snoozedUntil: undefined })
}

export function snoozeBackupReminder(now = new Date(), days = BACKUP_SNOOZE_DAYS) {
  writeBackupMeta({
    ...readBackupMeta(),
    snoozedUntil: new Date(now.getTime() + days * DAY_MS).toISOString(),
  })
}

function parseTime(value: string | undefined) {
  if (!value) return null
  const time = Date.parse(value)
  return Number.isNaN(time) ? null : time
}

/** Timestamp of the user's oldest record, or null when there is nothing worth backing up. */
export function getOldestRecordTime(appData: AppData): number | null {
  const times = [
    ...appData.habits.map((habit) => habit.createdAt),
    ...appData.workouts.map((workout) => workout.createdAt),
    ...appData.workoutTemplates.map((template) => template.createdAt),
    ...appData.bodyMetrics.map((metric) => metric.createdAt),
  ]
    .map(parseTime)
    .filter((time): time is number => time !== null)

  return times.length > 0 ? Math.min(...times) : null
}

export function daysBetween(fromTime: number, toTime: number) {
  return Math.max(0, Math.floor((toTime - fromTime) / DAY_MS))
}

export type BackupReminder =
  | { kind: 'never'; dataAgeDays: number }
  | { kind: 'overdue'; daysSinceBackup: number }

/**
 * Decides whether to show the backup reminder. Pure, so it is unit-tested directly.
 * - No data yet, or the reminder is snoozed: nothing.
 * - Never backed up: remind once the oldest record is FIRST_BACKUP_GRACE_DAYS old.
 * - Backed up before: remind when that was BACKUP_REMINDER_DAYS or more ago.
 */
export function getBackupReminder(
  appData: AppData,
  meta: BackupMeta,
  now = new Date(),
): BackupReminder | null {
  const nowTime = now.getTime()
  const oldest = getOldestRecordTime(appData)
  if (oldest === null) return null

  const snoozedUntil = parseTime(meta.snoozedUntil)
  if (snoozedUntil !== null && snoozedUntil > nowTime) return null

  const lastBackup = parseTime(meta.lastBackupAt)
  if (lastBackup === null) {
    const dataAgeDays = daysBetween(oldest, nowTime)
    return dataAgeDays >= FIRST_BACKUP_GRACE_DAYS ? { kind: 'never', dataAgeDays } : null
  }

  const daysSinceBackup = daysBetween(lastBackup, nowTime)
  return daysSinceBackup >= BACKUP_REMINDER_DAYS ? { kind: 'overdue', daysSinceBackup } : null
}

/** "today", "yesterday", "5 days ago", or null when never backed up. */
export function describeLastBackup(meta: BackupMeta, now = new Date()) {
  const lastBackup = parseTime(meta.lastBackupAt)
  if (lastBackup === null) return null
  const days = daysBetween(lastBackup, now.getTime())
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export type BackupResult = SaveResult

/**
 * Saves a backup of all app data. On phones this opens the share sheet so the file can go
 * straight to Files, Google Drive or a chat; elsewhere it downloads the JSON file.
 * Records the backup time unless the user cancelled the share sheet.
 */
export async function saveBackup(): Promise<BackupResult> {
  const file = new File([exportAppData()], `tuloylang-backup-${localDateStamp()}.json`, {
    type: 'application/json',
  })
  const result = await saveFiles([file], {
    title: 'TuloyLang backup',
    text: 'My TuloyLang habit and workout backup.',
  })
  if (result !== 'cancelled') recordBackup()
  return result
}

export type StorageProtection = 'protected' | 'not-protected' | 'unsupported'

export async function getStorageProtection(): Promise<StorageProtection> {
  if (!navigator.storage?.persisted) return 'unsupported'
  try {
    return (await navigator.storage.persisted()) ? 'protected' : 'not-protected'
  } catch {
    return 'unsupported'
  }
}

/**
 * Asks the browser to keep this site's storage instead of evicting it under storage
 * pressure or after a period of inactivity. Chromium decides silently; Firefox may ask.
 */
export async function requestStorageProtection(): Promise<StorageProtection> {
  if (!navigator.storage?.persist) return 'unsupported'
  try {
    return (await navigator.storage.persist()) ? 'protected' : 'not-protected'
  } catch {
    return 'unsupported'
  }
}

/** True when the user has any habits, workouts, templates or body metrics saved. */
export function hasSavedData(appData: AppData = readAppData()) {
  return getOldestRecordTime(appData) !== null
}
