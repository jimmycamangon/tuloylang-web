const rows = [
  { id: 'TL-001', name: 'Morning Run', category: 'Workout', streak: 14, status: 'On Track' },
  { id: 'TL-002', name: 'Read 10 Pages', category: 'Habit', streak: 9, status: 'On Track' },
  { id: 'TL-003', name: 'Drink Water', category: 'Health', streak: 21, status: 'Completed' },
  { id: 'TL-004', name: 'Code Practice', category: 'Learning', streak: 6, status: 'Needs Attention' },
  { id: 'TL-005', name: 'Sleep by 11 PM', category: 'Recovery', streak: 11, status: 'On Track' },
]

export default function SampleTablePage() {
  return (
    <section className="space-y-6">
      <div className="surface-card p-6">
        <h2 className="text-base font-semibold text-foreground">Sample Table</h2>
        <p className="muted-copy mt-2 text-sm">
          This page is now connected to the sidebar route and shows a simple tracking table.
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-foreground">ID</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Name</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Category</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Streak</th>
                <th className="px-4 py-3 text-left font-medium text-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-4 py-3 text-foreground">{row.id}</td>
                  <td className="px-4 py-3 text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{row.category}</td>
                  <td className="px-4 py-3 text-foreground">{row.streak} days</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-foreground">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
