import type { LucideIcon } from 'lucide-react'
import { BarChart3, Dumbbell, HelpCircle, LayoutDashboard, Repeat, Scale, Settings } from 'lucide-react'

export type RouteMeta = {
  path: string
  title: string
  description?: string
  breadcrumbs: string[]
}

export type NavItem = {
  id: string
  icon: LucideIcon
  title: string
  detail: string
}

export const routeMeta: Record<string, RouteMeta> = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Overview and quick stats',
    breadcrumbs: ['dashboard'],
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    description: 'Preferences',
    breadcrumbs: ['settings'],
  },
  habits: {
    path: '/habits',
    title: 'Habits',
    description: 'Daily routines',
    breadcrumbs: ['habits'],
  },
  workouts: {
    path: '/workouts',
    title: 'Workouts',
    description: 'Training sessions',
    breadcrumbs: ['workouts'],
  },
  analytics: {
    path: '/analytics',
    title: 'Analytics',
    description: 'Insights',
    breadcrumbs: ['analytics'],
  },
  'body-metrics': {
    path: '/body-metrics',
    title: 'Body Metrics',
    description: 'Weight tracking',
    breadcrumbs: ['body-metrics'],
  },
  help: {
    path: '/help',
    title: 'Help',
    description: 'Guide & FAQ',
    breadcrumbs: ['help'],
  },
}

export const navItems: NavItem[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    detail: 'Overview and quick stats',
  },
  {
    id: 'habits',
    icon: Repeat,
    title: 'Habits',
    detail: 'Daily routines',
  },
  {
    id: 'workouts',
    icon: Dumbbell,
    title: 'Workouts',
    detail: 'Training sessions',
  },
  {
    id: 'body-metrics',
    icon: Scale,
    title: 'Body Metrics',
    detail: 'Weight tracking',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    detail: 'Insights',
  },
  {
    id: 'help',
    icon: HelpCircle,
    title: 'Help',
    detail: 'Guide & FAQ',
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    detail: 'Preferences',
  },
]