const summaryCards = [
  { label: 'Active Habits', value: '08', detail: '+2 from last week' },
  { label: 'Workout Sessions', value: '14', detail: '4 this week' },
  { label: 'Completion Rate', value: '87%', detail: 'Steady momentum' },
  { label: 'Focus Score', value: '9.1', detail: 'Best streak this month' },
]

const weeklyActivity = [
  { day: 'Mon', height: 'h-16' },
  { day: 'Tue', height: 'h-24' },
  { day: 'Wed', height: 'h-20' },
  { day: 'Thu', height: 'h-28' },
  { day: 'Fri', height: 'h-24' },
  { day: 'Sat', height: 'h-32' },
  { day: 'Sun', height: 'h-14' },
]

const recentHighlights = [
  'Morning stretch reached a 12-day streak.',
  'Hydration goal completed 6 days in a row.',
  'Saturday workout volume improved by 18%.',
]

export default function DashboardPage() {
  return (
    <section className="space-y-6">
      <div className="surface-card p-6">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Data Showcase
        </p>
        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Your progress at a glance</h2>
            <p className="muted-copy mt-2 max-w-2xl text-sm">
              This page is now focused on high-level insight so the dashboard feels like a true
              overview instead of carrying navigation and shell responsibilities.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/70 px-4 py-3 text-sm text-foreground">
            Weekly consistency is stronger than last month.
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="surface-card p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)]">
        <article className="surface-card p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-foreground">Weekly Activity</h3>
              <p className="muted-copy mt-2 text-sm">
                Quick visual of your logged activity across the week.
              </p>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground">
              87% complete
            </span>
          </div>

          <div className="mt-8 flex h-48 items-end justify-between gap-3">
            {weeklyActivity.map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-3">
                <div className="flex h-36 w-full items-end justify-center rounded-full bg-muted/60 p-2">
                  <div className={`w-full max-w-10 rounded-full bg-blue-500 ${item.height}`} />
                </div>
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-6">
          <h3 className="text-base font-semibold text-foreground">Recent Highlights</h3>
          <p className="muted-copy mt-2 text-sm">
            A few wins worth keeping visible on the dashboard.
          </p>

          <div className="mt-6 space-y-3">
            {recentHighlights.map((highlight) => (
              <div key={highlight} className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="text-sm text-foreground">{highlight}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  )
}
