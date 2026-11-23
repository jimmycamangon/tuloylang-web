/**
 * Workout times are stored as real UTC ISO strings (`Date#toISOString()`).
 *
 * Older versions of the quick-log buttons stored the *local* wall-clock time with a `Z`
 * suffix instead (local time shifted by the timezone offset), so a 7 PM quick log in
 * Manila was read back as 3 AM the next day. Those entries are recognisable because the
 * quick log set `createdAt` from the same instant: `performedAt` is exactly `createdAt`
 * plus the timezone offset, to the millisecond. Entries saved from the form never match,
 * because the form only has minute precision.
 */

const MINUTE_MS = 60_000

/** Converts a legacy shifted `performedAt` to real UTC; leaves correct values untouched. */
export function normalizePerformedAt(performedAt: string, createdAt: string): string {
  const performedTime = Date.parse(performedAt)
  const createdTime = Date.parse(createdAt)
  if (!Number.isFinite(performedTime) || !Number.isFinite(createdTime)) return performedAt

  const shiftMs = -new Date(createdTime).getTimezoneOffset() * MINUTE_MS
  if (shiftMs === 0 || performedTime - createdTime !== shiftMs) return performedAt

  return new Date(performedTime - shiftMs).toISOString()
}

/** Formats a date for an `<input type="datetime-local">` in the user's own timezone. */
export function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
