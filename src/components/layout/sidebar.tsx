'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users, Heart, CheckSquare, Calendar, UserCheck,
  MessageSquare, BarChart2, Home, BookOpen, Settings, Music2
} from 'lucide-react'

const nav = [
  { href: '/',               label: 'Dashboard',      icon: Home },
  { href: '/people',         label: 'People',         icon: Users },
  { href: '/giving',         label: 'Giving',         icon: Heart },
  { href: '/attendance',     label: 'Attendance',     icon: CheckSquare },
  { href: '/worship',        label: 'Worship',        icon: Music2 },
  { href: '/groups',         label: 'Groups',         icon: BookOpen },
  { href: '/volunteers',     label: 'Volunteers',     icon: UserCheck },
  { href: '/events',         label: 'Events',         icon: Calendar },
  { href: '/communications', label: 'Communications', icon: MessageSquare },
  { href: '/reports',        label: 'Reports',        icon: BarChart2 },
  { href: '/settings',       label: 'Settings',       icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 border-b border-slate-200">
        <p className="font-bold text-slate-900 text-sm leading-tight">Desert Bible Church</p>
        <p className="text-xs text-slate-400 mt-0.5">CHMS</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
