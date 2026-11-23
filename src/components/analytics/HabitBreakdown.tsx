import type { HabitPeriodStat } from '../../lib/analyticsInsights'
import { weekdayName } from '../../lib/analyticsInsights'

function barTone(rate: number) {
  if (rate >= 80) return 'bg-emerald-500'
  if (rate >= 50) return 'bg-teal-400'
  return 'bg-amber-400'
}

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null
  if (Math.abs(change) < 5) {
    return <span className="text-xs text-muted-foreground">steady</span>
  }
  const up = change > 0
  return (
    <span
      className={`text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`}
    >
      {up ? '▲' : '▼'} {Math.abs(change)} pts
    </span>
  )
}

export default function HabitBreakdown({ stats, days }: { stats: HabitPeriodStat[]; days: number }) {
  return (
    <article className="surface-card min-w-0 p-4 sm:p-6">
      <h3 className="text-base font-semibold text-foreground">Habit Breakdown</h3>
      <p className="muted-copy mt-2 text-sm">
        Completion rate of each habit over the last {days} days, compared with the {days} days
        before.
      </p>

      {stats.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          No active habits yet. Add one on the Habits page.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {stats.map((item) => (
            <li key={item.habit.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-foreground">{item.habit.name}</p>
                <div className="flex items-center gap-3">
                  <ChangeBadge change={item.change} />
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {item.rate === null ? '—' : `${item.rate}%`}
                  </span>
                </div>
              </div>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted"
                role="img"
                aria-label={
                  item.rate === null ? 'Not scheduled in this period' : `${item.rate}% completed`
                }
              >
                {item.rate !== null && (
                  <div className={`h-full rounded-full ${barTone(item.rate)}`} style={{ width: `${item.rate}%` }} />
                )}
              </div>
              <p className="muted-copy mt-1.5 text-xs">
                {item.scheduled === 0
                  ? 'Not due yet in this period.'
                  : `${item.completed} of ${item.scheduled} days`}
                {item.streak > 0 ? ` · ${item.streak}-day streak` : ''}
                {item.weakestWeekday && item.rate !== null && item.weakestWeekday.rate < item.rate - 20
                  ? ` · weakest on ${weekdayName(item.weakestWeekday.weekday)}s (${item.weakestWeekday.rate}%)`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
