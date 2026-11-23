import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { normalizePerformedAt, toDateTimeLocalValue } from './workoutTime'

const originalTz = process.env.TZ

beforeAll(() => {
  process.env.TZ = 'Asia/Manila' // UTC+8, no daylight saving
})

afterAll(() => {
  process.env.TZ = originalTz
})

describe('normalizePerformedAt', () => {
  it('repairs a legacy quick log that stored local time with a Z suffix', () => {
    // Quick-logged at 7:00 PM Manila = 11:00 UTC, but saved as "19:00Z".
    const createdAt = '2026-06-01T11:00:00.123Z'
    const legacy = '2026-06-01T19:00:00.123Z'
    expect(normalizePerformedAt(legacy, createdAt)).toBe(createdAt)
  })

  it('leaves form entries alone', () => {
    const createdAt = '2026-06-01T11:00:00.123Z'
    expect(normalizePerformedAt('2026-06-01T10:30:00.000Z', createdAt)).toBe(
      '2026-06-01T10:30:00.000Z',
    )
  })

  it('is idempotent once repaired', () => {
    const createdAt = '2026-06-01T11:00:00.123Z'
    const once = normalizePerformedAt('2026-06-01T19:00:00.123Z', createdAt)
    expect(normalizePerformedAt(once, createdAt)).toBe(once)
  })

  it('ignores unparseable dates', () => {
    expect(normalizePerformedAt('nope', '2026-06-01T11:00:00.000Z')).toBe('nope')
  })
})

describe('toDateTimeLocalValue', () => {
  it('formats in local time for datetime-local inputs', () => {
    expect(toDateTimeLocalValue(new Date('2026-06-01T11:05:00.000Z'))).toBe('2026-06-01T19:05')
  })
})
