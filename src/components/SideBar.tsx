import { useState, useMemo, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type { LucideIcon } from 'lucide-react'
import { FolderKanban, LayoutDashboard, ScrollText } from 'lucide-react'


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
const routeMeta: Record<string, RouteMeta> = {
    dashboard: {
        path: '/dashboard',
        title: 'Dashboard',
        description: 'Overview and quick stats',
        breadcrumbs: ['dashboard'],
    },
    profile: {
        path: '/profile',
        title: 'Profile',
        description: 'Personal details and settings',
        breadcrumbs: ['profile'],
    },
    settings: {
        path: '/settings',
        title: 'Settings',
        description: 'Preferences and account configuration',
        breadcrumbs: ['settings'],
    },
    projects: {
        path: '/projects',
        title: 'Projects',
        description: 'Active tasks and timelines',
        breadcrumbs: ['projects'],
    },
    'projects-active': {
        path: '/projects/active',
        title: 'Active Projects',
        breadcrumbs: ['projects', 'projects-active'],
    },
    'projects-active-web': {
        path: '/projects/active/web-platform',
        title: 'Web Platform',
        breadcrumbs: ['projects', 'projects-active', 'projects-active-web'],
    },
    'projects-active-mobile': {
        path: '/projects/active/mobile-app',
        title: 'Mobile App',
        breadcrumbs: ['projects', 'projects-active', 'projects-active-mobile'],
    },
    'projects-backlog': {
        path: '/projects/backlog',
        title: 'Project Backlog',
        breadcrumbs: ['projects', 'projects-backlog'],
    },
    'projects-backlog-q2': {
        path: '/projects/backlog/q2-candidates',
        title: 'Q2 Candidates',
        breadcrumbs: ['projects', 'projects-backlog', 'projects-backlog-q2'],
    },
    'projects-backlog-ideas': {
        path: '/projects/backlog/idea-pipeline',
        title: 'Idea Pipeline',
        breadcrumbs: ['projects', 'projects-backlog', 'projects-backlog-ideas'],
    },
    'projects-calendar': {
        path: '/projects/calendar',
        title: 'Project Calendar',
        breadcrumbs: ['projects', 'projects-calendar'],
    },
    reports: {
        path: '/reports',
        title: 'Reports',
        description: 'Performance and exports',
        breadcrumbs: ['reports'],
    },
    'reports-daily': {
        path: '/reports/daily-summary',
        title: 'Daily Summary',
        breadcrumbs: ['reports', 'reports-daily'],
    },
    'reports-weekly': {
        path: '/reports/weekly-metrics',
        title: 'Weekly Metrics',
        breadcrumbs: ['reports', 'reports-weekly'],
    },
    'reports-table': {
        path: '/reports/sample-table',
        title: 'Sample Table',
        description: 'Search, filter, and pagination demo',
        breadcrumbs: ['reports', 'reports-table'],
    },
    'reports-export': {
        path: '/reports/export-data',
        title: 'Export Data',
        breadcrumbs: ['reports', 'reports-export'],
    },
}

export default function SidebarContent({ mobile = false }: { mobile?: boolean }) {
    const [expanded, setExpanded] = useState(false)
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
        projects: true,
        reports: true,
    })

    const pathToId = useMemo(() => {
        const map: Record<string, string> = {}
        Object.entries(routeMeta).forEach(([id, meta]) => {
            map[meta.path] = id
        })
        return map
    }, [])

    const activeId = pathToId[location.pathname] ?? 'dashboard'
    const hoverCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null)
    const navigate = useNavigate()

    const [openChildMenus, setOpenChildMenus] = useState<Record<string, boolean>>({
        'projects-active': true,
        'projects-backlog': true,
    })
    // Functions

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
    function toggleSubmenu(menuId: string) {
        setOpenMenus((prev) => ({ ...prev, [menuId]: !prev[menuId] }))
    }
    function handleMenuItemClick(id: string) {
        const path = routeMeta[id]?.path
        if (path) navigate(path)
    }

    function toggleChildSubmenu(childId: string) {
        setOpenChildMenus((prev) => ({ ...prev, [childId]: !prev[childId] }))
    }

    return (
        <>
            {/* #region Sidebar Header / Brand */}
            <div className="flex items-center gap-2 border-b border-border p-3">
                <button
                    type="button"
                    onClick={() => {
                        if (mobile) return
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
            <nav className="flex-1 space-y-2 overflow-y-auto p-3">
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
                                        className={`muted-copy text-xs transition-transform duration-300 ${isSubmenuOpen ? 'rotate-90' : 'rotate-0'
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
                                    className={`ml-12 grid transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${isSubmenuOpen
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
                                                        className={`submenu-item-base ${isChildActive ? 'submenu-item-active' : 'submenu-item-idle'} ${isSubmenuOpen
                                                            ? 'translate-x-0 opacity-100'
                                                            : '-translate-x-1 opacity-0'
                                                            }`}
                                                    >
                                                        <span className="absolute -left-3 h-px w-2 bg-border" />
                                                        <span className="flex-1">{child.title}</span>
                                                        {hasGrandchildren && (
                                                            <span
                                                                className={`transition-transform duration-300 ${isChildSubmenuOpen ? 'rotate-90' : 'rotate-0'
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
                                                            className={`ml-4 grid transition-[grid-template-rows,opacity] duration-300 ${isChildSubmenuOpen
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
                                                                            className={`relative block w-full rounded-md px-3 py-1.5 text-left text-xs transition-colors ${isGrandchildActive ? 'submenu-grandchild-active' : 'submenu-grandchild-idle'
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
                                    className="popover-shell absolute left-full top-0 z-50 w-72 translate-x-2"
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
