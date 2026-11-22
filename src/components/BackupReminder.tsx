import { useEffect, useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { readAppData } from '../lib/appDataStorage'
import {
  BACKUP_META_CHANGED_EVENT,
  getBackupReminder,
  readBackupMeta,
  saveBackup,
  snoozeBackupReminder,
} from '../lib/backup'

function computeReminder() {
  return getBackupReminder(readAppData(), readBackupMeta())
}

/** Dashboard banner asking for a backup when none was saved recently. */
export default function BackupReminder() {
  const [reminder, setReminder] = useState(computeReminder)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const refresh = () => setReminder(computeReminder())
    window.addEventListener(BACKUP_META_CHANGED_EVENT, refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener(BACKUP_META_CHANGED_EVENT, refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  if (!reminder) return null

  const message =
    reminder.kind === 'never'
      ? "You haven't saved a backup yet. Your progress lives only on this device, so clearing browser data or losing your phone would erase it."
      : `Your last backup was ${reminder.daysSinceBackup} days ago. Save a fresh copy so recent progress is safe too.`

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Back up your progress</p>
          <p className="mt-1 text-sm leading-6 opacity-90">{message}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 sm:ml-4">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await saveBackup()
            } finally {
              setBusy(false)
            }
          }}
          className="ui-button"
        >
          {busy ? 'Saving…' : 'Back up now'}
        </button>
        <button
          type="button"
          onClick={() => snoozeBackupReminder()}
          className="ui-button-subtle"
        >
          Later
        </button>
      </div>
    </div>
  )
}
