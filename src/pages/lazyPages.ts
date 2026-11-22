import { lazy } from 'react'

/**
 * Every page is its own chunk, so opening the app only downloads and parses the page you
 * land on (plus the shared shell) instead of the whole app. Heavy, page-specific
 * libraries such as recharts only load with the pages that use them.
 */
const pageLoaders = {
  land: () => import('./LandPage.tsx'),
  start: () => import('./StartPage.tsx'),
  dashboard: () => import('./DashboardPage.tsx'),
  habits: () => import('./HabitsPage.tsx'),
  workouts: () => import('./WorkoutsPage.tsx'),
  bodyMetrics: () => import('./BodyMetricsPage.tsx'),
  analytics: () => import('./AnalyticsPage.tsx'),
  help: () => import('./HelpPage.tsx'),
  settings: () => import('./SettingsPage.tsx'),
}

export const LandPage = lazy(pageLoaders.land)
export const StartPage = lazy(pageLoaders.start)
export const DashboardPage = lazy(pageLoaders.dashboard)
export const HabitsPage = lazy(pageLoaders.habits)
export const WorkoutsPage = lazy(pageLoaders.workouts)
export const BodyMetricsPage = lazy(pageLoaders.bodyMetrics)
export const AnalyticsPage = lazy(pageLoaders.analytics)
export const HelpPage = lazy(pageLoaders.help)
export const SettingsPage = lazy(pageLoaders.settings)

/**
 * Once the first page is on screen and the browser is idle, fetch the remaining pages in
 * the background, so switching pages afterwards is instant (and works offline even if the
 * service worker has not finished caching yet).
 */
export function preloadPagesWhenIdle() {
  const preload = () => {
    for (const load of Object.values(pageLoaders)) {
      void load().catch(() => {
        // A failed prefetch is harmless; the page will load on demand instead.
      })
    }
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(preload, { timeout: 4000 })
  } else {
    setTimeout(preload, 2000)
  }
}
