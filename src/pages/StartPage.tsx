import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import NavigationPage from '@/components/NavigationPage'
import Footer from '@/components/Footer'
import { importAppData } from '../lib/appDataStorage'
import { ArrowRight, DatabaseBackup, FileUp, History, Sparkles } from 'lucide-react'

export default function StartPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    try {
      const fileText = await file.text()
      const importedData = importAppData(fileText)
      setFeedback(
        `Imported ${importedData.habits.length} habits and ${importedData.workouts.length} workouts successfully.`,
      )
      navigate('/dashboard')
    } catch {
      setFeedback('Import failed. Please choose a valid TuloyLang backup JSON file.')
    } finally {
      event.target.value = ''
      setIsImporting(false)
    }
  }

  return (
    <>
      <NavigationPage showLinks={false} />
      <section className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center px-6 py-16">
          <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
                <Sparkles className="h-4 w-4 text-foreground" />
                Resume your momentum or start fresh
              </div>

              <h1 className="mt-6 text-4xl font-black leading-tight text-foreground md:text-5xl">
                Welcome to TuloyLang
              </h1>
              <p className="muted-copy mt-5 max-w-2xl text-base leading-8">
                Jump into your dashboard right away, or restore a backup to bring back your habits,
                workouts, and progress history.
              </p>
              <p className="muted-copy mt-3 max-w-2xl text-sm leading-7">
                TuloyLang keeps app data in this browser on this device. Restore History is here so
                returning users can recover a previously exported backup when they come back.
              </p>
              <p className="mt-3 inline-flex max-w-2xl rounded-2xl border border-border bg-card px-4 py-3 text-sm leading-7 text-foreground shadow-sm">
                Free to use for everyone. No account, subscription, or cloud database is required
                for the core app experience.
              </p>
              <p className="muted-copy mt-3 max-w-2xl text-sm leading-7">
                Privacy note: your data stays in this browser on this device. Export backups
                regularly if you want an extra copy for safekeeping.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-11 rounded-2xl px-5 text-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                  onClick={() => navigate('/dashboard')}
                >
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  className="h-11 rounded-2xl border border-border bg-card px-5 text-sm text-foreground transition-all duration-200 hover:scale-[1.02] hover:bg-accent hover:text-accent-foreground hover:shadow-md"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  {isImporting ? 'Importing backup...' : 'Restore History'}
                </Button>
              </div>

              <div className="mt-8 rounded-3xl border border-border bg-card/80 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-foreground">
                    <DatabaseBackup className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Restore your history</h2>
                    <p className="muted-copy mt-2 text-sm leading-7">
                      Import a TuloyLang backup JSON file to recover the same shared data used
                      across Dashboard, Habits, Workouts, and Analytics. This is helpful because
                      your progress is stored locally unless you export a backup file.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Habits
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Restore routines, completions, and streak history
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Workouts
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Bring back sessions, notes, and training volume
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Analytics
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      Rebuild heatmaps and activity insights automatically
                    </p>
                  </div>
                </div>

                <p className="muted-copy mt-5 text-sm">
                  Accepted file: exported `.json` backup from the Settings page.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-xl dark:from-card dark:via-card dark:to-muted/70">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  What happens next
                </p>

                <div className="mt-6 space-y-4">
                  <div className="rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/40">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200">
                        <History className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">
                          Returning user
                        </p>
                        <p className="mt-1 text-sm leading-6 text-emerald-700 dark:text-emerald-200">
                          Use restore history if you exported a backup and want your progress back
                          immediately.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-sky-50 p-4 dark:bg-sky-950/40">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 text-sky-700 dark:bg-sky-900/50 dark:text-sky-200">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-sky-800 dark:text-sky-100">
                          New user
                        </p>
                        <p className="mt-1 text-sm leading-6 text-sky-700 dark:text-sky-200">
                          Choose continue to start with a clean dashboard and build your routines
                          from today.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
                    <p className="text-sm font-semibold text-foreground">Why keep import here?</p>
                    <p className="muted-copy mt-2 text-sm leading-6">
                      It gives users a clear recovery path before they enter the app, which makes
                      restoring history feel safe and intentional when they are moving back into a
                      browser-based, locally stored app.
                    </p>
                  </div>
                </div>
              </div>

              {feedback && (
                <p className="mt-5 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
                  {feedback}
                </p>
              )}
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportChange}
          className="hidden"
        />
      </section>
      <Footer />
    </>
  )
}
