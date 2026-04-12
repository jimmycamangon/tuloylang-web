import type { UserProfile } from '../types/userProfile'
import type { ReminderSettings } from '../types/reminder'

export const USER_PROFILE_STORAGE_KEY = 'tuloylang_user_profile'
export const THEME_STORAGE_KEY = 'theme'
export const NAV_EXPANDED_STORAGE_KEY = 'nav_expanded'
export const REMINDER_SETTINGS_STORAGE_KEY = 'tuloylang_reminder_settings'
export const REMINDER_LAST_SENT_STORAGE_KEY = 'tuloylang_reminder_last_sent'

const defaultUserProfile: UserProfile = {
  fullName: 'New User',
  title: 'Getting Started',
  focusArea: 'Building better consistency one day at a time.',
  bio: 'Set up your profile, then start tracking habits, workouts, and long-term progress.',
  avatarDataUrl: '',
}

const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  time: '19:00',
}

export function getDefaultUserProfile(): UserProfile {
  return { ...defaultUserProfile }
}

export function getDefaultReminderSettings(): ReminderSettings {
  return { ...defaultReminderSettings }
}

export function readUserProfile() {
  const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY)
  if (!saved) return getDefaultUserProfile()

  try {
    const parsed = JSON.parse(saved) as Partial<UserProfile>
    return {
      fullName: typeof parsed.fullName === 'string' && parsed.fullName.trim()
        ? parsed.fullName
        : defaultUserProfile.fullName,
      title: typeof parsed.title === 'string' && parsed.title.trim()
        ? parsed.title
        : defaultUserProfile.title,
      focusArea: typeof parsed.focusArea === 'string'
        ? parsed.focusArea
        : defaultUserProfile.focusArea,
      bio: typeof parsed.bio === 'string' ? parsed.bio : defaultUserProfile.bio,
      avatarDataUrl:
        typeof parsed.avatarDataUrl === 'string'
          ? parsed.avatarDataUrl
          : defaultUserProfile.avatarDataUrl,
    }
  } catch {
    return getDefaultUserProfile()
  }
}

export function saveUserProfile(profile: UserProfile) {
  localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(profile))
  return profile
}

export function readReminderSettings() {
  const saved = localStorage.getItem(REMINDER_SETTINGS_STORAGE_KEY)
  if (!saved) return getDefaultReminderSettings()

  try {
    const parsed = JSON.parse(saved) as Partial<ReminderSettings>
    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : defaultReminderSettings.enabled,
      time:
        typeof parsed.time === 'string' && /^\d{2}:\d{2}$/.test(parsed.time)
          ? parsed.time
          : defaultReminderSettings.time,
    }
  } catch {
    return getDefaultReminderSettings()
  }
}

export function saveReminderSettings(settings: ReminderSettings) {
  localStorage.setItem(REMINDER_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  return settings
}

export function readLastReminderSentDate() {
  return localStorage.getItem(REMINDER_LAST_SENT_STORAGE_KEY) ?? ''
}

export function saveLastReminderSentDate(dateKey: string) {
  localStorage.setItem(REMINDER_LAST_SENT_STORAGE_KEY, dateKey)
}

export function getProfileInitials(profile: UserProfile) {
  const parts = profile.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (parts.length === 0) return 'TL'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

export function readThemePreference() {
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
}

export function saveThemePreference(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function readNavExpandedPreference() {
  const saved = localStorage.getItem(NAV_EXPANDED_STORAGE_KEY)
  return saved === null ? false : saved === 'true'
}

export function saveNavExpandedPreference(expanded: boolean) {
  localStorage.setItem(NAV_EXPANDED_STORAGE_KEY, String(expanded))
}
