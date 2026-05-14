import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  APP_DATA_STORAGE_KEY,
  downloadAppDataFile,
  readAppData,
  updateWeeklyGoals,
} from '../lib/appDataStorage'
import {
  applyThemePreference,
  getDefaultUserProfile,
  getProfileInitials,
  readNavExpandedPreference,
  readThemePreference,
  readUserProfile,
  saveNavExpandedPreference,
  saveThemePreference,
  saveUserProfile,
  USER_PROFILE_STORAGE_KEY,
} from '../lib/userPreferences'
import type { WeeklyGoals } from '../types/goal'
import type { UserProfile } from '../types/userProfile'

type ProfileFormState = UserProfile

const initialProfileForm = (): ProfileFormState => readUserProfile()

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Unable to read file'))
    }
    reader.onerror = () => reject(new Error('Unable to read file'))
    reader.readAsDataURL(file)
  })
}

export default function SettingsPage() {
  const [profileForm, setProfileForm] = useState<ProfileFormState>(initialProfileForm)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => readThemePreference())
  const [navExpanded, setNavExpanded] = useState(() => readNavExpandedPreference())
  const [feedback, setFeedback] = useState('')
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [dataVersion, setDataVersion] = useState(0)
  const [goalsForm, setGoalsForm] = useState<WeeklyGoals>(() => readAppData().goals)

  useEffect(() => {
    applyThemePreference(theme)
    saveThemePreference(theme)
  }, [theme])

  useEffect(() => {
    saveNavExpandedPreference(navExpanded)
  }, [navExpanded])

  useEffect(() => {
    function syncPreferences() {
      const latestAppData = readAppData()
      setProfileForm(readUserProfile())
      setTheme(readThemePreference())
      setNavExpanded(readNavExpandedPreference())
      setGoalsForm(latestAppData.goals)
      setDataVersion((prev) => prev + 1)
    }

    window.addEventListener('storage', syncPreferences)
    window.addEventListener('focus', syncPreferences)
    return () => {
      window.removeEventListener('storage', syncPreferences)
      window.removeEventListener('focus', syncPreferences)
    }
  }, [])

  const appData = useMemo(() => readAppData(), [dataVersion])
  const profileInitials = getProfileInitials(profileForm)

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextProfile: UserProfile = {
      fullName: profileForm.fullName.trim(),
      title: profileForm.title.trim(),
      focusArea: profileForm.focusArea.trim(),
      bio: profileForm.bio.trim(),
      avatarDataUrl: profileForm.avatarDataUrl ?? '',
    }

    if (!nextProfile.fullName || !nextProfile.title) {
      setFeedback('Please provide at least your full name and title in the profile section.')
      return
    }

    saveUserProfile(nextProfile)
    setProfileForm(nextProfile)
    setFeedback(`Profile saved to localStorage under "${USER_PROFILE_STORAGE_KEY}".`)
  }

  function handleResetProfile() {
    const defaultProfile = getDefaultUserProfile()
    saveUserProfile(defaultProfile)
    setProfileForm(defaultProfile)
    setFeedback('Profile settings were reset to their default values.')
    setShowResetConfirm(false)
  }

  function handleGoalsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (goalsForm.habitCompletions < 1 || goalsForm.workoutSessions < 1) {
      setFeedback('Weekly goals must be at least 1.')
      return
    }

    const nextData = updateWeeklyGoals(goalsForm)
    setGoalsForm(nextData.goals)
    setDataVersion((prev) => prev + 1)
    setFeedback(`Weekly goals saved to localStorage under "${APP_DATA_STORAGE_KEY}".`)
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setFeedback('Please choose an image file for the profile photo.')
      event.target.value = ''
      return
    }

    try {
      const avatarDataUrl = await readFileAsDataUrl(file)
      setProfileForm((prev) => ({ ...prev, avatarDataUrl }))
      setFeedback('Profile image loaded. Save profile to keep it.')
    } catch {
      setFeedback('Unable to read that image file. Please try another one.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <article className="surface-card self-start p-6">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-col items-start gap-4">
                {profileForm.avatarDataUrl ? (
                  <img
                    src={profileForm.avatarDataUrl}
                    alt={`${profileForm.fullName} avatar`}
                    className="h-20 w-20 rounded-3xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent text-2xl font-semibold text-foreground">
                    {profileInitials}
                  </div>
                )}
                <div>
                  <h3 className="text-base font-semibold text-foreground">Profile Section</h3>
                  <p className="muted-copy mt-2 text-sm leading-6">
                    This card personalizes the dashboard shell and workspace identity.
                  </p>
                </div>
                <div className="w-full space-y-2">
                  <label className="ui-button flex w-full cursor-pointer justify-center">
                    Upload image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setProfileForm((prev) => ({ ...prev, avatarDataUrl: '' }))}
                    className="ui-button w-full"
                  >
                    Remove image
                  </button>
                </div>
                <p className="muted-copy text-sm leading-6">
                  If no image is uploaded, the app falls back to your profile initials.
                </p>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="settings-full-name" className="mb-1.5 block text-sm font-medium text-foreground">
                    Full name
                  </label>
                  <input
                    id="settings-full-name"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                    className="ui-input"
                  />
                </div>
                <div>
                  <label htmlFor="settings-title" className="mb-1.5 block text-sm font-medium text-foreground">
                    Title
                  </label>
                  <input
                    id="settings-title"
                    value={profileForm.title}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="ui-input"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="settings-focus" className="mb-1.5 block text-sm font-medium text-foreground">
                  Focus area
                </label>
                <input
                  id="settings-focus"
                  value={profileForm.focusArea}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, focusArea: event.target.value }))
                  }
                  placeholder="What this workspace is helping you improve"
                  className="ui-input"
                />
              </div>

              <div>
                <label htmlFor="settings-bio" className="mb-1.5 block text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  id="settings-bio"
                  value={profileForm.bio}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                  }
                  rows={3}
                  className="ui-input resize-none"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button type="submit" className="ui-button bg-blue-600 text-white hover:bg-blue-700">
                  Save profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="ui-button"
                >
                  Reset profile
                </button>
              </div>
            </form>
          </div>
        </article>

        <div className="space-y-6">
          <article className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground">Appearance</h3>
            <p className="muted-copy mt-2 text-sm">
              Make the app feel more comfortable to use with the look and layout that suits you best.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Theme mode</p>
                    <p className="muted-copy mt-1 text-sm">
                      Switch the app between light and dark mode.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                    className="ui-button"
                  >
                    {theme === 'dark' ? 'Use light mode' : 'Use dark mode'}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Sidebar width</p>
                    <p className="muted-copy mt-1 text-sm">
                      Control whether the desktop sidebar opens in expanded view by default.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNavExpanded((prev) => !prev)}
                    className="ui-button"
                  >
                    {navExpanded ? 'Use compact nav' : 'Use expanded nav'}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <article className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground">Connected Data</h3>
            <p className="muted-copy mt-2 text-sm">
              See the habit and workout data currently shaping your dashboard, analytics, and daily
              tracking pages.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <p className="text-sm font-medium text-foreground">Why export and restore exist</p>
              <p className="muted-copy mt-2 text-sm leading-6">
                TuloyLang stores app data locally in your browser instead of a cloud database.
                Export lets you save a backup file, and Restore History lets you import that file
                later if you return on this device or need to recover your progress.
              </p>
              <p className="muted-copy mt-2 text-sm leading-6">
                For extra peace of mind, export a backup once in a while so you still have a copy
                if browser data is cleared or you move to another device.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Habits stored
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{appData.habits.length}</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  Workouts stored
                </p>
                <p className="mt-1 text-xl font-semibold text-foreground">{appData.workouts.length}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => {
                  downloadAppDataFile()
                  setFeedback(`Backup exported from localStorage key "${APP_DATA_STORAGE_KEY}".`)
                }}
                className="ui-button"
              >
                Export app data
              </button>
              <p className="muted-copy text-sm">
                Export creates a JSON backup of the same shared app data used throughout the
                project, so you have a file you can later restore from the Start page.
              </p>
            </div>
          </article>

          <article className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground">Weekly Goals</h3>
            <p className="muted-copy mt-2 text-sm">
              Set simple weekly targets so the dashboard can measure whether your week is on track.
            </p>

            <form onSubmit={handleGoalsSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="weekly-habit-goal"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Habit completions
                  </label>
                  <input
                    id="weekly-habit-goal"
                    type="number"
                    min="1"
                    value={goalsForm.habitCompletions}
                    onChange={(event) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        habitCompletions: Number(event.target.value) || 0,
                      }))
                    }
                    className="ui-input"
                  />
                </div>
                <div>
                  <label
                    htmlFor="weekly-workout-goal"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Workout sessions
                  </label>
                  <input
                    id="weekly-workout-goal"
                    type="number"
                    min="1"
                    value={goalsForm.workoutSessions}
                    onChange={(event) =>
                      setGoalsForm((prev) => ({
                        ...prev,
                        workoutSessions: Number(event.target.value) || 0,
                      }))
                    }
                    className="ui-input"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                This week is currently aiming for {appData.goals.habitCompletions} habit completion
                {appData.goals.habitCompletions === 1 ? '' : 's'} and {appData.goals.workoutSessions}{' '}
                workout session{appData.goals.workoutSessions === 1 ? '' : 's'}.
              </div>

              <button type="submit" className="ui-button bg-blue-600 text-white hover:bg-blue-700">
                Save weekly goals
              </button>
            </form>
          </article>

          <article className="surface-card p-6">
            <h3 className="text-base font-semibold text-foreground">Quick Links</h3>
            <p className="muted-copy mt-2 text-sm">
              Head straight to the pages most closely connected to the settings you manage here.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/dashboard" className="ui-button">
                Open Dashboard
              </Link>
              <Link to="/analytics" className="ui-button">
                Open Analytics
              </Link>
              <Link to="/workouts" className="ui-button">
                Open Workouts
              </Link>
              <Link to="/habits" className="ui-button">
                Open Habits
              </Link>
            </div>
          </article>
        </div>
      </div>

      {feedback && (
        <p className="rounded-md border border-border bg-muted px-4 py-3 text-sm text-foreground">
          {feedback}
        </p>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-md p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Reset Profile</h3>
            <p className="muted-copy mt-2 text-sm">
              This will restore the profile section in Settings to its default values.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="ui-button"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetProfile}
                className="ui-button-danger"
              >
                Reset profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
