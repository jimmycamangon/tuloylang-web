import { createPortal } from 'react-dom'
import type { Analysis, DateRange } from '../../lib/analyticsInsights'
import { workoutDateKey } from '../../lib/analyticsInsights'
import { getLocalDateKey } from '../../lib/habitMetrics'
import type { WorkoutEntry } from '../../types/workout'

const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

/**
 * A plain black-on-white summary that only appears when printing (or "Save as PDF").
 * It is rendered next to #root, and the print stylesheet hides the app itself.
 */
export default function PrintableReport({
  analysis,
  range,
  workouts,
  profileName,
}: {
  analysis: Analysis
  range: DateRange
  workouts: WorkoutEntry[]
  profileName?: string
}) {
  const { stats, previousStats, habitStats, insights, suggestions } = analysis
  const startKey = getLocalDateKey(range.start)
  const endKey = getLocalDateKey(range.end)
  const periodWorkouts = workouts
    .filter((workout) => {
      const key = workoutDateKey(workout)
      return key >= startKey && key <= endKey
    })
    .sort((left, right) => left.performedAt.localeCompare(right.performedAt))

  const rows: [string, string, string][] = [
    [
      'Habit completion',
      stats.completionRate === null ? '—' : `${stats.completionRate}% (${stats.completed}/${stats.scheduled})`,
      previousStats.completionRate === null ? '—' : `${previousStats.completionRate}%`,
    ],
    ['Active days', `${stats.activeDays} of ${stats.days}`, `${previousStats.activeDays} of ${previousStats.days}`],
    ['Perfect days', String(stats.perfectDays), String(previousStats.perfectDays)],
    ['Workouts', `${stats.workouts} (${stats.workoutMinutes} min)`, `${previousStats.workouts} (${previousStats.workoutMinutes} min)`],
  ]

  return createPortal(
    <div className="print-report text-black" aria-hidden="true">
      <header className="border-b border-gray-400 pb-3">
        <h1 className="text-2xl font-bold">TuloyLang Progress Report</h1>
        <p className="mt-1 text-sm">
          {profileName ? `${profileName} · ` : ''}
          {dateFormatter.format(range.start)} – {dateFormatter.format(range.end)} ({range.days} days)
        </p>
        <p className="text-xs text-gray-600">Generated {dateFormatter.format(new Date())}</p>
      </header>

      <section className="mt-5">
        <h2 className="text-lg font-semibold">Summary</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-400 text-left">
              <th className="py-1 pr-4">Measure</th>
              <th className="py-1 pr-4">This period</th>
              <th className="py-1">Previous {range.days} days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, current, previous]) => (
              <tr key={label} className="border-b border-gray-200">
                <td className="py-1 pr-4">{label}</td>
                <td className="py-1 pr-4 font-medium">{current}</td>
                <td className="py-1">{previous}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {suggestions.length > 0 && (
        <section className="mt-5">
          <h2 className="text-lg font-semibold">Focus for this week</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            {suggestions.map((suggestion) => (
              <li key={suggestion.id}>{suggestion.text}</li>
            ))}
          </ol>
        </section>
      )}

      {insights.length > 0 && (
        <section className="mt-5">
          <h2 className="text-lg font-semibold">Insights</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {insights.map((insight) => (
              <li key={insight.id}>
                <span className="font-medium">{insight.title}</span> {insight.detail}
              </li>
            ))}
          </ul>
        </section>
      )}

      {habitStats.length > 0 && (
        <section className="mt-5 break-inside-avoid">
          <h2 className="text-lg font-semibold">Habits</h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="py-1 pr-4">Habit</th>
                <th className="py-1 pr-4">Done</th>
                <th className="py-1 pr-4">Rate</th>
                <th className="py-1 pr-4">Change</th>
                <th className="py-1">Streak</th>
              </tr>
            </thead>
            <tbody>
              {habitStats.map((item) => (
                <tr key={item.habit.id} className="border-b border-gray-200">
                  <td className="py-1 pr-4">{item.habit.name}</td>
                  <td className="py-1 pr-4">
                    {item.completed}/{item.scheduled}
                  </td>
                  <td className="py-1 pr-4">{item.rate === null ? '—' : `${item.rate}%`}</td>
                  <td className="py-1 pr-4">
                    {item.change === null ? '—' : `${item.change > 0 ? '+' : ''}${item.change} pts`}
                  </td>
                  <td className="py-1">{item.streak} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="mt-5">
        <h2 className="text-lg font-semibold">Workouts</h2>
        {periodWorkouts.length === 0 ? (
          <p className="mt-2 text-sm">No workouts logged in this period.</p>
        ) : (
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-400 text-left">
                <th className="py-1 pr-4">Date</th>
                <th className="py-1 pr-4">Workout</th>
                <th className="py-1 pr-4">Category</th>
                <th className="py-1">Minutes</th>
              </tr>
            </thead>
            <tbody>
              {periodWorkouts.map((workout) => (
                <tr key={workout.id} className="border-b border-gray-200">
                  <td className="py-1 pr-4">{shortDateFormatter.format(new Date(workout.performedAt))}</td>
                  <td className="py-1 pr-4">{workout.title}</td>
                  <td className="py-1 pr-4">{workout.category}</td>
                  <td className="py-1">{workout.durationMinutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>,
    document.body,
  )
}
