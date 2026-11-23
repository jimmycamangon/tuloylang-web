import type { PeriodStats } from '../../lib/analyticsInsights'

function Delta({ value, unit = '' }: { value: number | null; unit?: string }) {
  if (value === null) return <span className="text-muted-foreground">No earlier data</span>
  if (value === 0) return <span className="text-muted-foreground">Same as before</span>
  const up = value > 0
  return (
    <span className={up ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}>
      {up ? '▲' : '▼'} {Math.abs(value)}
      {unit} vs before
    </span>
  )
}

export default function PeriodStatCards({
  stats,
  previous,
}: {
  stats: PeriodStats
  previous: PeriodStats
}) {
  const rateDelta =
    stats.completionRate !== null && previous.completionRate !== null
      ? stats.completionRate - previous.completionRate
      : null
  const hadEarlierActivity = previous.activeDays > 0 || previous.scheduled > 0

  const cards = [
    {
      label: 'Habit Completion',
      value: stats.completionRate === null ? '—' : `${stats.completionRate}%`,
      sub: `${stats.completed} of ${stats.scheduled} scheduled check-ins`,
      delta: <Delta value={rateDelta} unit=" pts" />,
    },
    {
      label: 'Active Days',
      value: `${stats.activeDays}/${stats.days}`,
      sub: 'Days with a habit done or a workout',
      delta: <Delta value={hadEarlierActivity ? stats.activeDays - previous.activeDays : null} />,
    },
    {
      label: 'Workouts',
      value: String(stats.workouts),
      sub: `${stats.workoutMinutes} minutes of training`,
      delta: <Delta value={hadEarlierActivity ? stats.workouts - previous.workouts : null} />,
    },
    {
      label: 'Perfect Days',
      value: String(stats.perfectDays),
      sub: 'Every scheduled habit done',
      delta: <Delta value={hadEarlierActivity ? stats.perfectDays - previous.perfectDays : null} />,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="surface-card p-5">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">{card.value}</p>
          <p className="muted-copy mt-1 text-sm">{card.sub}</p>
          <p className="mt-2 text-sm">{card.delta}</p>
        </article>
      ))}
    </div>
  )
}
