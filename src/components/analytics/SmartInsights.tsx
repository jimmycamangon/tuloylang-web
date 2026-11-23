import type { Analysis, InsightTone } from '../../lib/analyticsInsights'

const toneStyles: Record<InsightTone, { dot: string; label: string }> = {
  positive: { dot: 'bg-emerald-500', label: 'text-emerald-700 dark:text-emerald-300' },
  warning: { dot: 'bg-amber-500', label: 'text-amber-700 dark:text-amber-300' },
  neutral: { dot: 'bg-sky-500', label: 'text-sky-700 dark:text-sky-300' },
}

const toneLabels: Record<InsightTone, string> = {
  positive: 'Going well',
  warning: 'Needs attention',
  neutral: 'Pattern',
}

export default function SmartInsights({ analysis }: { analysis: Analysis }) {
  const { insights, suggestions } = analysis

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <article className="surface-card min-w-0 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-foreground">Focus For This Week</h3>
        <p className="muted-copy mt-2 text-sm">
          Suggestions picked from your own patterns, most useful first.
        </p>

        {suggestions.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Log habits and workouts for a few days and personal suggestions will show up here.
          </div>
        ) : (
          <ol className="mt-6 space-y-3">
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                className="flex gap-3 rounded-xl border border-border bg-card p-4"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-foreground">{suggestion.text}</p>
              </li>
            ))}
          </ol>
        )}
      </article>

      <article className="surface-card min-w-0 p-4 sm:p-6">
        <h3 className="text-base font-semibold text-foreground">Smart Insights</h3>
        <p className="muted-copy mt-2 text-sm">
          What changed and what keeps repeating in the selected period.
        </p>

        {insights.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Not enough data in this period yet. Try a longer period or keep logging.
          </div>
        ) : (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.id} className="rounded-xl border border-border bg-card p-4">
                <p
                  className={`flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] ${toneStyles[insight.tone].label}`}
                >
                  <span className={`h-2 w-2 rounded-full ${toneStyles[insight.tone].dot}`} aria-hidden="true" />
                  {toneLabels[insight.tone]}
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">{insight.title}</p>
                <p className="muted-copy mt-1 text-sm">{insight.detail}</p>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}
