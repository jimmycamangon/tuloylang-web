import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { deleteBodyMetric, readAppData, saveBodyMetric, updateBodyMetric } from '../lib/appDataStorage'
import type { BodyMetric } from '../types/bodyMetric'

type MetricFormState = {
  date: string
  weightKg: string
}

function getTodayDateKey() {
  const now = new Date()
  const offsetMs = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10)
}

const initialFormState: MetricFormState = {
  date: getTodayDateKey(),
  weightKg: '',
}

function formatMetricDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function BodyMetricsPage() {
  const [form, setForm] = useState<MetricFormState>(initialFormState)
  const [metrics, setMetrics] = useState<BodyMetric[]>([])
  const [feedback, setFeedback] = useState('')
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null)
  const [deletingMetric, setDeletingMetric] = useState<BodyMetric | null>(null)

  useEffect(() => {
    const appData = readAppData()
    setMetrics(appData.bodyMetrics)
  }, [])

  const latestWeight = metrics[0]?.weightKg
  const oldestWeight = metrics[metrics.length - 1]?.weightKg
  const totalChange =
    latestWeight !== undefined && oldestWeight !== undefined
      ? latestWeight - oldestWeight
      : undefined

  const sevenDayAverage = useMemo(() => {
    if (metrics.length === 0) return undefined

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 7)
    const cutoffKey = cutoff.toISOString().slice(0, 10)

    const recentWeights = metrics
      .filter((metric) => metric.date >= cutoffKey)
      .map((metric) => metric.weightKg)

    if (recentWeights.length === 0) return undefined

    const sum = recentWeights.reduce((total, weight) => total + weight, 0)
    return sum / recentWeights.length
  }, [metrics])

  const chartData = useMemo(
    () =>
      [...metrics]
        .sort((left, right) => left.date.localeCompare(right.date))
        .map((metric) => ({
          label: formatMetricDate(metric.date),
          weightKg: metric.weightKg,
        })),
    [metrics],
  )

  function resetForm() {
    setForm({ ...initialFormState, date: getTodayDateKey() })
    setEditingMetricId(null)
  }

  function startEdit(metric: BodyMetric) {
    setEditingMetricId(metric.id)
    setForm({
      date: metric.date,
      weightKg: String(metric.weightKg),
    })
    setFeedback(`Editing entry from ${formatMetricDate(metric.date)}. Update and save when ready.`)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const weightKg = Number(form.weightKg)

    if (!form.date) {
      setFeedback('Please choose a date for this entry.')
      return
    }

    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setFeedback('Please enter a valid weight in kg.')
      return
    }

    const existingMetric = metrics.find((metric) => metric.id === editingMetricId)
    const metricToSave: BodyMetric = {
      id: editingMetricId ?? crypto.randomUUID(),
      date: form.date,
      weightKg,
      createdAt: existingMetric?.createdAt ?? new Date().toISOString(),
    }

    const nextData = editingMetricId ? updateBodyMetric(metricToSave) : saveBodyMetric(metricToSave)
    setMetrics(nextData.bodyMetrics)
    resetForm()
    setFeedback(editingMetricId ? 'Weight entry updated.' : 'Weight entry logged.')
  }

  function confirmDelete() {
    if (!deletingMetric) return

    const nextData = deleteBodyMetric(deletingMetric.id)
    setMetrics(nextData.bodyMetrics)

    if (editingMetricId === deletingMetric.id) {
      resetForm()
    }

    setFeedback(`Entry from ${formatMetricDate(deletingMetric.date)} was deleted.`)
    setDeletingMetric(null)
  }

  return (
    <div className="space-y-6">
      <article className="surface-card min-w-0 p-4 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">Weight Trend</h2>
        <p className="muted-copy mt-2 text-sm">
          Your logged weight over time. Look at the overall direction, not any single day.
        </p>

        {chartData.length >= 2 ? (
          <div className="mt-6 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  domain={['dataMin - 1', 'dataMax + 1']}
                  unit="kg"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--foreground)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  name="Weight (kg)"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            Log at least two weight entries to see your trend chart here.
          </div>
        )}
      </article>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="surface-card p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-foreground">
            {editingMetricId ? 'Edit Weight Entry' : 'Log Weight'}
          </h2>
          <p className="muted-copy mt-2 text-sm">
            Weigh in on the same day each week, same conditions, for the most useful trend.
          </p>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Latest</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {latestWeight !== undefined ? `${latestWeight} kg` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              7-day avg
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {sevenDayAverage !== undefined ? `${sevenDayAverage.toFixed(1)} kg` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Total change
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {totalChange !== undefined
                ? `${totalChange > 0 ? '+' : ''}${totalChange.toFixed(2)} kg`
                : '—'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="metric-date" className="mb-1.5 block text-sm font-medium text-foreground">
              Date
            </label>
            <input
              id="metric-date"
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              className="ui-input"
            />
          </div>

          <div>
            <label
              htmlFor="metric-weight"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Weight (kg)
            </label>
            <input
              id="metric-weight"
              type="number"
              step="0.01"
              min="1"
              value={form.weightKg}
              onChange={(event) => setForm((prev) => ({ ...prev, weightKg: event.target.value }))}
              placeholder="58.75"
              className="ui-input"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="ui-button bg-blue-600 text-white hover:bg-blue-700">
              {editingMetricId ? 'Update entry' : 'Log weight'}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm()
                setFeedback('')
              }}
              className="ui-button"
            >
              {editingMetricId ? 'Cancel edit' : 'Clear'}
            </button>
          </div>
        </form>

        {feedback && (
          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
            {feedback}
          </p>
        )}
      </div>

      <div className="surface-card p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">Weight History</h2>
            <p className="muted-copy mt-2 text-sm">
              Newest entries first. Look at the weekly trend, not any single day.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {metrics.length} logged
          </span>
        </div>

        {metrics.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No weight entries yet. Log your first one to start tracking your trend.
          </div>
        ) : (
          <div className="max-h-[42rem] space-y-3 overflow-auto rounded-md border border-border p-2">
            {metrics.map((metric) => (
              <article key={metric.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {formatMetricDate(metric.date)}
                    </h3>
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-200">
                    {metric.weightKg} kg
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(metric)} className="ui-button">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMetric(metric)}
                    className="ui-button-danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      </section>

      {deletingMetric && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Delete Entry</h3>
            <p className="muted-copy mt-2 text-sm">
              This will permanently remove the entry from {formatMetricDate(deletingMetric.date)}.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingMetric(null)} className="ui-button">
                Cancel
              </button>
              <button type="button" onClick={confirmDelete} className="ui-button-danger">
                Delete entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}