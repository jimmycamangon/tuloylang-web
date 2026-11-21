import { useEffect, useState } from 'react'

/** Chromium-only event fired when the app meets install criteria. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let offlineReady = false
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * The installed app should open on the dashboard, not the marketing landing page.
 * The manifest's start_url handles new installs; this also covers installs made while
 * start_url was "/" (and iOS, which keeps the URL from when it was added).
 * Runs once per launch, before the router reads the URL, so in-app "Back to Home"
 * navigation still reaches the landing page.
 */
export function redirectInstalledLaunchToDashboard() {
  if (window.location.pathname === '/' && isStandalone()) {
    window.history.replaceState(null, '', '/dashboard')
  }
}

/**
 * Registers the service worker and starts listening for the install prompt.
 * Call once at startup: `beforeinstallprompt` can fire before any page mounts.
 */
export function initPwa() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    notify()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        offlineReady = true
        notify()
      })
      .catch(() => {
        // Offline support is progressive enhancement; ignore registration failures.
      })
  })
}

export type InstallState = {
  /** True when the browser can show its native install dialog. */
  canInstall: boolean
  /** True when already running as an installed app. */
  installed: boolean
  /** True once the service worker has cached the app for offline use. */
  offlineReady: boolean
  /** True on iOS Safari, which has no install prompt (Share → Add to Home Screen). */
  isIos: boolean
  promptInstall: () => Promise<boolean>
}

export function useInstallPrompt(): InstallState {
  const [, setTick] = useState(0)

  useEffect(() => {
    const listener = () => setTick((tick) => tick + 1)
    listeners.add(listener)
    const media = window.matchMedia('(display-mode: standalone)')
    media.addEventListener('change', listener)
    return () => {
      listeners.delete(listener)
      media.removeEventListener('change', listener)
    }
  }, [])

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return {
    canInstall: deferredPrompt !== null,
    installed: isStandalone(),
    offlineReady,
    isIos,
    promptInstall: async () => {
      if (!deferredPrompt) return false
      const promptEvent = deferredPrompt
      await promptEvent.prompt()
      const { outcome } = await promptEvent.userChoice
      deferredPrompt = null
      notify()
      return outcome === 'accepted'
    },
  }
}
