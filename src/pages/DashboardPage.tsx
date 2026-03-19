import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Bell, FolderKanban, LayoutDashboard, ScrollText, Search, LogOut, Sun, Moon } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import SampleTablePage from './SampleTablePage'
// import Footer from './Footer'

type NavItem = {
  id: string
  icon: LucideIcon
  title: string
  detail: string
  children?: ChildItem[]
}

type ChildItem = {
  id: string
  title: string
  children?: { id: string; title: string }[]
}

type RouteMeta = {
  path: string
  title: string
  description?: string
  breadcrumbs: string[]
}

const routeMeta: Record<string, RouteMeta> = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'Overview and quick stats',
    breadcrumbs: ['dashboard'],
  },
  profile: {
    path: '/dashboard/profile',
    title: 'Profile',
    description: 'Personal details and settings',
    breadcrumbs: ['profile'],
  },
  settings: {
    path: '/dashboard/settings',
    title: 'Settings',
    description: 'Preferences and account configuration',
    breadcrumbs: ['settings'],
  },
  projects: {
    path: '/dashboard/projects',
    title: 'Projects',
    description: 'Active tasks and timelines',
    breadcrumbs: ['projects'],
  },
  'projects-active': {
    path: '/dashboard/projects/active',
    title: 'Active Projects',
    breadcrumbs: ['projects', 'projects-active'],
  },
  'projects-active-web': {
    path: '/dashboard/projects/active/web-platform',
    title: 'Web Platform',
    breadcrumbs: ['projects', 'projects-active', 'projects-active-web'],
  },
  'projects-active-mobile': {
    path: '/dashboard/projects/active/mobile-app',
    title: 'Mobile App',
    breadcrumbs: ['projects', 'projects-active', 'projects-active-mobile'],
  },
  'projects-backlog': {
    path: '/dashboard/projects/backlog',
    title: 'Project Backlog',
    breadcrumbs: ['projects', 'projects-backlog'],
  },
  'projects-backlog-q2': {
    path: '/dashboard/projects/backlog/q2-candidates',
    title: 'Q2 Candidates',
    breadcrumbs: ['projects', 'projects-backlog', 'projects-backlog-q2'],
  },
  'projects-backlog-ideas': {
    path: '/dashboard/projects/backlog/idea-pipeline',
    title: 'Idea Pipeline',
    breadcrumbs: ['projects', 'projects-backlog', 'projects-backlog-ideas'],
  },
  'projects-calendar': {
    path: '/dashboard/projects/calendar',
    title: 'Project Calendar',
    breadcrumbs: ['projects', 'projects-calendar'],
  },
  reports: {
    path: '/dashboard/reports',
    title: 'Reports',
    description: 'Performance and exports',
    breadcrumbs: ['reports'],
  },
  'reports-daily': {
    path: '/dashboard/reports/daily-summary',
    title: 'Daily Summary',
    breadcrumbs: ['reports', 'reports-daily'],
  },
  'reports-weekly': {
    path: '/dashboard/reports/weekly-metrics',
    title: 'Weekly Metrics',
    breadcrumbs: ['reports', 'reports-weekly'],
  },
  'reports-table': {
    path: '/dashboard/reports/sample-table',
    title: 'Sample Table',
    description: 'Search, filter, and pagination demo',
    breadcrumbs: ['reports', 'reports-table'],
  },
  'reports-export': {
    path: '/dashboard/reports/export-data',
    title: 'Export Data',
    breadcrumbs: ['reports', 'reports-export'],
  },
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: LayoutDashboard, title: 'Dashboard', detail: 'Overview and quick stats' },
  {
    id: 'projects',
    icon: FolderKanban,
    title: 'Projects',
    detail: 'Active tasks and timelines',
    children: [
      {
        id: 'projects-active',
        title: 'Active Projects',
        children: [
          { id: 'projects-active-web', title: 'Web Platform' },
          { id: 'projects-active-mobile', title: 'Mobile App' },
        ],
      },
      {
        id: 'projects-backlog',
        title: 'Project Backlog',
        children: [
          { id: 'projects-backlog-q2', title: 'Q2 Candidates' },
          { id: 'projects-backlog-ideas', title: 'Idea Pipeline' },
        ],
      },
      { id: 'projects-calendar', title: 'Project Calendar' },
    ],
  },
  {
    id: 'reports',
    icon: ScrollText,
    title: 'Reports',
    detail: 'Performance and exports',
    children: [
      { id: 'reports-daily', title: 'Daily Summary' },
      { id: 'reports-weekly', title: 'Weekly Metrics' },
      { id: 'reports-table', title: 'Sample Table' },
      { id: 'reports-export', title: 'Export Data' },
    ],
  },
]

const NOTIFICATIONS = [
  { id: 1, title: 'Build completed', detail: 'Your latest deployment build succeeded.' },
  { id: 2, title: 'Review request', detail: 'PR #42 is waiting for your review.' },
  { id: 3, title: 'Reminder', detail: 'Weekly report is due in 2 hours.' },
]

  function PageContent({ meta }: { meta: RouteMeta }) {
  return (
    <div className="surface-card w-full p-6">
      <h2 className="text-base font-semibold text-foreground">{meta.title}</h2>
      <p className="muted-copy mt-2 text-sm">
        {meta.description ?? `You are viewing ${meta.title}.`}
      </p>
    </div>
  )
}

function getRouteContent(activeId: string, currentRoute: RouteMeta) {
  if (activeId === 'reports-table') {
    return <SampleTablePage />
  }

  return <PageContent meta={currentRoute} />
}


export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotificationMenu, setShowNotificationMenu] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    projects: true,
    reports: true,
  })
  const [openChildMenus, setOpenChildMenus] = useState<Record<string, boolean>>({
    'projects-active': true,
    'projects-backlog': true,
  })
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null)
  const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)
  const notificationMenuRef = useRef<HTMLDivElement | null>(null)
  const commandItemRefs = useRef<Array<HTMLButtonElement | null>>([])

  const sidebarWidth = expanded ? 'w-72' : 'w-20'

  const pathToId = useMemo(() => {
    const map: Record<string, string> = {}
    Object.entries(routeMeta).forEach(([id, meta]) => {
      map[meta.path] = id
    })
    return map
  }, [])

  const activeId = pathToId[location.pathname] ?? 'dashboard'
  const currentRoute = routeMeta[activeId] ?? routeMeta.dashboard
  const breadcrumbTrail = currentRoute.breadcrumbs
    .map((id) => routeMeta[id])
    .filter((meta): meta is RouteMeta => Boolean(meta))
  const commandItems = useMemo(() => Object.values(routeMeta), [])
  const filteredCommandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase()
    if (!q) return commandItems
    return commandItems.filter((item) => {
      const inTitle = item.title.toLowerCase().includes(q)
      const inPath = item.path.toLowerCase().includes(q)
      const inCrumbs = item.breadcrumbs.join(' ').toLowerCase().includes(q)
      return inTitle || inPath || inCrumbs
    })
  }, [commandItems, commandQuery])

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') setIsDark(true)

    const savedExpanded = localStorage.getItem('nav_expanded')
    if (savedExpanded !== null) setExpanded(savedExpanded === 'true')

    const savedMenus = localStorage.getItem('nav_open_menus')
    if (savedMenus) {
      try {
        setOpenMenus(JSON.parse(savedMenus) as Record<string, boolean>)
      } catch {
        // ignore invalid saved state
      }
    }

    const savedChildMenus = localStorage.getItem('nav_open_child_menus')
    if (savedChildMenus) {
      try {
        setOpenChildMenus(JSON.parse(savedChildMenus) as Record<string, boolean>)
      } catch {
        // ignore invalid saved state
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    localStorage.setItem('nav_expanded', String(expanded))
  }, [expanded])

  useEffect(() => {
    localStorage.setItem('nav_open_menus', JSON.stringify(openMenus))
  }, [openMenus])

  useEffect(() => {
    localStorage.setItem('nav_open_child_menus', JSON.stringify(openChildMenus))
  }, [openChildMenus])

  useEffect(() => {
    return () => {
      if (hoverCloseTimeoutRef.current) clearTimeout(hoverCloseTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    function onKeydown(event: KeyboardEvent) {
      const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'
      if (isCmdK) {
        event.preventDefault()
        setShowCommandPalette(true)
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false)
      }
    }

    window.addEventListener('keydown', onKeydown)
    return () => window.removeEventListener('keydown', onKeydown)
  }, [])

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node

      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setShowProfileMenu(false)
      }

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(target)) {
        setShowNotificationMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [commandQuery, showCommandPalette])

  useEffect(() => {
    if (!showCommandPalette) return
    const item = commandItemRefs.current[highlightedIndex]
    if (item) item.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, showCommandPalette, filteredCommandItems])

  function handleMenuItemClick(id: string) {
    const path = routeMeta[id]?.path
    if (path && location.pathname !== path) {
      navigate(path)
    }
    setShowNotificationMenu(false)
    setShowProfileMenu(false)
    setMobileOpen(false)
  }

  function confirmLogout() {
    setShowLogoutConfirm(false)
    setShowNotificationMenu(false)
    setShowProfileMenu(false)
    setMobileOpen(false)
    navigate('/', { replace: true })
  }

  function openCommandPalette() {
    setShowCommandPalette(true)
    setCommandQuery('')
    setHighlightedIndex(0)
  }

  function closeCommandPalette() {
    setShowCommandPalette(false)
    setCommandQuery('')
    setHighlightedIndex(0)
  }

  function navigateFromCommand(path: string) {
    if (location.pathname !== path) {
      navigate(path)
    }
    setMobileOpen(false)
    closeCommandPalette()
  }

  function MenuIcon() {
    return (
      <span className="flex flex-col gap-1">
        <span className="h-0.5 w-4 rounded bg-foreground" />
        <span className="h-0.5 w-4 rounded bg-foreground" />
        <span className="h-0.5 w-4 rounded bg-foreground" />
      </span>
    )
  }

  function toggleSubmenu(menuId: string) {
    setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }))
  }

  function toggleChildSubmenu(childId: string) {
    setOpenChildMenus((prev) => ({ ...prev, [childId]: !prev[childId] }))
  }

  function openHoverMenu(menuId: string) {
    if (hoverCloseTimeoutRef.current) clearTimeout(hoverCloseTimeoutRef.current)
    setHoveredMenuId(menuId)
  }

  function closeHoverMenuWithDelay() {
    if (hoverCloseTimeoutRef.current) clearTimeout(hoverCloseTimeoutRef.current)
    hoverCloseTimeoutRef.current = setTimeout(() => {
      setHoveredMenuId(null)
    }, 180)
  }

  function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    return (
      <>
        {/* #region Sidebar Header / Brand */}
        <div className="flex items-center gap-2 border-b border-border p-3">
          <button
            type="button"
            onClick={() => {
              if (mobile) setMobileOpen(false)
              else setExpanded((prev) => !prev)
            }}
            className="flex w-full min-w-0 cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-accent"
            aria-label="Toggle logo details"
          >
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-md">
              <img src="/j-c-logo-v2.png" alt="Jim Portal logo" />
            </div>
            {(expanded || mobile) && (
              <span className="min-w-0">
                <span className="block truncate text-sm font-black uppercase text-foreground">
                  Jim Project Portals
                </span>
              </span>
            )}
          </button>
        </div>
        {/* #endregion Sidebar Header / Brand */}

        {/* #region Sidebar Menu List */}
        <nav className="flex-1 space-y-2 overflow-visible p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeId === item.id
            const canShowDetails = expanded || mobile
            const hasChildren = Boolean(item.children?.length)
            const isSubmenuOpen = canShowDetails && openMenus[item.id]
            return (
              <div
                key={item.id}
                className="relative space-y-1"
                onMouseEnter={() => {
                  if (!mobile && !expanded && hasChildren) openHoverMenu(item.id)
                }}
                onMouseLeave={() => {
                  if (!mobile) closeHoverMenuWithDelay()
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (hasChildren && canShowDetails) {
                      toggleSubmenu(item.id)
                      if (!mobile) handleMenuItemClick(item.id)
                      return
                    }
                    handleMenuItemClick(item.id)
                  }}
                  className={`nav-item-base ${isActive ? 'nav-item-active' : 'nav-item-idle'}`}
                >
                  <span className="nav-icon-chip">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </span>

                  {canShowDetails && (
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.title}</span>
                      <span className="muted-copy block truncate text-xs">
                        {routeMeta[item.id]?.description ?? item.detail}
                      </span>
                    </span>
                  )}

                  {canShowDetails && hasChildren && (
                    <span
                      className={`muted-copy text-xs transition-transform duration-300 ${
                        isSubmenuOpen ? 'rotate-90' : 'rotate-0'
                      }`}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 4L13 10L7 16"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  )}
                </button>

                {canShowDetails && hasChildren && (
                  <div
                    className={`ml-12 grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
                      isSubmenuOpen
                        ? 'grid-rows-[1fr] translate-y-0 opacity-100'
                        : 'grid-rows-[0fr] -translate-y-1 opacity-0'
                    }`}
                  >
                    <div className="relative space-y-1 overflow-hidden pl-3">
                      <div className="absolute bottom-1 left-0 top-1 w-px bg-border" />
                      {item.children!.map((child, index) => {
                        const isChildActive = activeId === child.id
                        const hasGrandchildren = Boolean(child.children?.length)
                        const isChildSubmenuOpen = openChildMenus[child.id]
                        return (
                          <div key={child.id} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (hasGrandchildren) {
                                  toggleChildSubmenu(child.id)
                                  if (!mobile) handleMenuItemClick(child.id)
                                  return
                                }
                                handleMenuItemClick(child.id)
                              }}
                              style={{ transitionDelay: isSubmenuOpen ? `${index * 40}ms` : '0ms' }}
                              className={`submenu-item-base ${isChildActive ? 'submenu-item-active' : 'submenu-item-idle'} ${
                                isSubmenuOpen
                                  ? 'translate-x-0 opacity-100'
                                  : '-translate-x-1 opacity-0'
                              }`}
                            >
                              <span className="absolute -left-3 h-px w-2 bg-border" />
                              <span className="flex-1">{child.title}</span>
                              {hasGrandchildren && (
                                <span
                                  className={`transition-transform duration-300 ${
                                    isChildSubmenuOpen ? 'rotate-90' : 'rotate-0'
                                  }`}
                                >
                                  <svg
                                    viewBox="0 0 20 20"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M7 4L13 10L7 16"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              )}
                            </button>

                            {hasGrandchildren && (
                              <div
                                className={`ml-4 grid transition-[grid-template-rows,opacity] duration-300 ${
                                  isChildSubmenuOpen
                                    ? 'grid-rows-[1fr] opacity-100'
                                    : 'grid-rows-[0fr] opacity-0'
                                }`}
                              >
                                <div className="relative space-y-1 overflow-hidden pl-3">
                                  <div className="absolute bottom-1 left-0 top-1 w-px bg-border" />
                                  {child.children!.map((grandchild) => {
                                    const isGrandchildActive = activeId === grandchild.id
                                    return (
                                      <button
                                        key={grandchild.id}
                                        type="button"
                                        onClick={() => handleMenuItemClick(grandchild.id)}
                                        className={`relative block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${
                                          isGrandchildActive ? 'submenu-grandchild-active' : 'submenu-grandchild-idle'
                                        }`}
                                      >
                                        <span className="absolute -left-3 h-px w-2 bg-border" />
                                        {grandchild.title}
                                      </button>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!mobile && !expanded && hasChildren && hoveredMenuId === item.id && (
                  <div
                    className="popover-shell absolute left-full top-0 z-[70] ml-2 w-72"
                    onMouseEnter={() => openHoverMenu(item.id)}
                    onMouseLeave={closeHoverMenuWithDelay}
                  >
                    <p className="popover-title">
                      {item.title}
                    </p>
                    <div className="max-h-96 space-y-1 overflow-auto pr-1">
                      {item.children!.map((child) => {
                        const hasGrandchildren = Boolean(child.children?.length)
                        return (
                          <div key={`hover-${child.id}`} className="space-y-1">
                            <button
                              type="button"
                              onClick={() => handleMenuItemClick(child.id)}
                              className="popover-item"
                            >
                              {child.title}
                            </button>

                            {hasGrandchildren && (
                              <div className="popover-subtree">
                                {child.children!.map((grandchild) => (
                                  <button
                                    key={`hover-${grandchild.id}`}
                                    type="button"
                                    onClick={() => handleMenuItemClick(grandchild.id)}
                                    className="popover-subitem"
                                  >
                                    {grandchild.title}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        {/* #endregion Sidebar Menu List */}

        {/* #region Sidebar Footer / User Summary + Logout */}
        <div className="mt-auto border-t border-border p-3">
          <div className="flex items-center gap-2 rounded-md bg-muted p-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-xs font-semibold text-foreground">
              JC
            </div>
            {(expanded || mobile) && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">Jimmy Camangon</p>
                <p className="muted-copy truncate text-xs">.NET Developer</p>
              </div>
            )}
          </div>
        </div>
        {/* #endregion Sidebar Footer / User Summary + Logout */}
      </>
    )
  }

  return (
    /* #region Main App Shell */
    <div className="app-shell">
      <div className="flex w-full">
        {/* #region Left Nav (Desktop) */}
        <aside
          className={`sidebar-shell relative z-30 hidden min-h-screen flex-col overflow-visible transition-all duration-300 md:flex ${sidebarWidth}`}
        >
          <SidebarContent />
        </aside>
        {/* #endregion Left Nav (Desktop) */}

        {/* #region Left Nav Drawer (Mobile) */}
        <div
          className={`fixed inset-0 z-50 transition-opacity duration-300 md:hidden ${
            mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/35"
          />
          <aside
            className={`sidebar-shell relative flex h-full w-72 flex-col overflow-hidden shadow-xl transition-transform duration-300 ease-out ${
              mobileOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <SidebarContent mobile />
          </aside>
        </div>
        {/* #endregion Left Nav Drawer (Mobile) */}

        {/* #region Right Pane: Top Nav + Content */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {/* #region Top Navigation Bar */}
          <header className="top-nav-shell flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (window.matchMedia('(max-width: 767px)').matches) setMobileOpen(true)
                  else setExpanded((prev) => !prev)
                }}
                className="ui-icon-button cursor-pointer"
                aria-label="Toggle menu"
              >
                <MenuIcon />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold leading-tight text-foreground">
                  {currentRoute.title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCommandPalette}
                className="ui-icon-button md:hidden"
                aria-label="Open search"
              >
                <Search className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={openCommandPalette}
                className="ui-button-subtle hidden md:inline-flex"
              >
                Search
                <span className="muted-copy ml-2 rounded border border-border px-1.5 text-[11px]">
                  Ctrl+K
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="ui-button"
              >
                {isDark ? <Sun className='mx-auto h-4 w-4' /> : <Moon className='mx-auto h-4 w-4' />}
              </button>
              <div ref={notificationMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationMenu((prev) => !prev)
                    setShowProfileMenu(false)
                  }}
                  className="ui-icon-button relative"
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                {showNotificationMenu && (
                  <div className="surface-card absolute right-0 top-12 z-50 w-72 p-2 shadow-xl">
                    <p className="px-2 py-1 text-sm font-semibold text-foreground">Notifications</p>
                    <div className="mt-1 space-y-1">
                      {NOTIFICATIONS.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setShowNotificationMenu(false)}
                          className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
                        >
                          <p className="text-sm font-medium text-foreground">{item.title}</p>
                          <p className="muted-copy text-xs">{item.detail}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div ref={profileMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu((prev) => !prev)
                    setShowNotificationMenu(false)
                  }}
                  className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-card transition-colors hover:bg-accent"
                  aria-label="Open profile menu"
                >
                  <img src="/j-c-logo-v2.png" alt="Profile menu" className="h-full w-full object-cover" />
                </button>

                {showProfileMenu && (
                  <div className="surface-card absolute right-0 top-12 z-50 w-52 p-2 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleMenuItemClick('profile')}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMenuItemClick('settings')}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-accent"
                    >
                      Settings
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false)
                        setShowLogoutConfirm(true)
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          {/* #endregion Top Navigation Bar */}

          {/* #region Page Content Area */}
          <main className="w-full flex-1 p-6">
            {/* #region Breadcrumbs */}
            <div className="muted-copy mb-4 flex flex-wrap items-center gap-1 text-sm">
              {breadcrumbTrail.map((crumb, index) => {
                const isLast = index === breadcrumbTrail.length - 1
                return (
                  <span key={`${crumb.path}-${index}`} className="inline-flex items-center gap-1">
                    {index > 0 && <span className="text-muted-foreground/70">/</span>}
                    {isLast ? (
                      <span className="font-medium text-foreground">{crumb.title}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(crumb.path)}
                        className="cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-accent hover:text-foreground"
                      >
                        {crumb.title}
                      </button>
                    )}
                  </span>
                )
              })}
            </div>
            {/* #endregion Breadcrumbs */}
            {/* #region Routed Pages */}
            {getRouteContent(activeId, currentRoute)}
            {/* #endregion Routed Pages */}
          </main>
          {/* #endregion Page Content Area */}
          {/* <Footer /> */}
        </div>
        {/* #endregion Right Pane: Top Nav + Content */}
      </div>

      {/* #region Command Palette Modal */}
      {showCommandPalette && (
        <div className="fixed inset-0 z-[65] flex items-start justify-center bg-slate-900/40 p-4 pt-20">
          <div className="surface-card w-full max-w-xl shadow-xl">
            <div className="border-b border-border p-3">
              <input
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setHighlightedIndex((prev) =>
                      Math.min(prev + 1, Math.max(filteredCommandItems.length - 1, 0)),
                    )
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setHighlightedIndex((prev) => Math.max(prev - 1, 0))
                  }
                  if (e.key === 'Enter' && filteredCommandItems[highlightedIndex]) {
                    e.preventDefault()
                    navigateFromCommand(filteredCommandItems[highlightedIndex].path)
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    closeCommandPalette()
                  }
                }}
                placeholder="Search pages... (Ctrl+K)"
                className="ui-input"
              />
            </div>

            <div className="max-h-80 overflow-auto p-2">
              {filteredCommandItems.length === 0 ? (
                <p className="muted-copy px-2 py-4 text-sm">No matches found.</p>
              ) : (
                filteredCommandItems.map((item, index) => {
                  const isHighlighted = index === highlightedIndex
                  return (
                    <button
                      key={`command-${item.path}`}
                      ref={(el) => {
                        commandItemRefs.current[index] = el
                      }}
                      type="button"
                      onClick={() => navigateFromCommand(item.path)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={`mb-1 w-full rounded-md px-3 py-2 text-left transition-colors ${
                        isHighlighted
                          ? 'command-item-active'
                          : 'text-foreground hover:bg-accent'
                      }`}
                    >
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="muted-copy text-xs">{item.path}</p>
                    </button>
                  )
                })
              )}
            </div>

            <div className="muted-copy border-t border-border px-3 py-2 text-xs">
              Use <span className="font-medium">Up/Down</span> to navigate, <span className="font-medium">Enter</span> to open, <span className="font-medium">Esc</span> to close.
            </div>
          </div>
        </div>
      )}
      {/* #endregion Command Palette Modal */}

      {/* #region Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="surface-card w-full max-w-sm p-5 shadow-xl">
            <h3 className="text-base font-semibold text-foreground">Confirm Logout</h3>
            <p className="muted-copy mt-2 text-sm">
              Are you sure you want to log out?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="ui-button py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="ui-button-danger"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {/* #endregion Logout Confirmation Modal */}
    </div>
    /* #endregion Main App Shell */
  )
}
