import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import DashboardLayout from './components/dashboard/DashboardLayout.tsx'
import PageLoader from './components/PageLoader.tsx'
import {
  AnalyticsPage,
  BodyMetricsPage,
  DashboardPage,
  HabitsPage,
  HelpPage,
  LandPage,
  preloadPagesWhenIdle,
  SettingsPage,
  StartPage,
  WorkoutsPage,
} from './pages/lazyPages.ts'
import { applyThemePreference } from './lib/userPreferences.ts'
import { initPwa, redirectInstalledLaunchToDashboard } from './lib/pwa.ts'

// Latin subset only: it covers English and Filipino (including ñ). Other scripts fall back
// to the system font instead of shipping and precaching ~20 unused font files.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'

applyThemePreference()
redirectInstalledLaunchToDashboard()
initPwa()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Dashboard pages suspend inside DashboardLayout, so the sidebar stays put while a
          page loads; this outer boundary only covers the landing and start pages. */}
      <Suspense fallback={<PageLoader fullScreen />}>
        <Routes>
          <Route path="/" element={<LandPage />} />
          <Route path="/start" element={<StartPage />} />
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/body-metrics" element={<BodyMetricsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)

preloadPagesWhenIdle()
