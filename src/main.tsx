import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import DashboardLayout from './components/dashboard/DashboardLayout.tsx'
import LandPage from './pages/LandPage.tsx'
import StartPage from './pages/StartPage.tsx'
import HabitsPage from './pages/HabitsPage.tsx'
import DashboardPage from './pages/DashboardPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx'
import SampleTablePage from './pages/SampleTablePage.tsx'
import SettingsPage from './pages/SettingsPage.tsx'
import WorkoutsPage from './pages/WorkoutsPage.tsx'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandPage />} />
        <Route path="/start" element={<StartPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/workouts" element={<WorkoutsPage />} />
          <Route path="/analytics" element={<SampleTablePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
