'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard, Briefcase, FileText, FileEdit, Calendar,
  BarChart3, Settings, Sparkles, Menu, X, LogOut, ChevronRight, Search,
  UserCheck
} from 'lucide-react';


const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { label: 'Resumes', href: '/dashboard/resumes', icon: FileText },
  { label: 'Cover Letters', href: '/dashboard/cover-letters', icon: FileEdit },
  { label: 'Interviews', href: '/dashboard/interviews', icon: Calendar },
  { label: 'Skills', href: '/dashboard/skills', icon: Sparkles },
  { label: 'LinkedIn', href: '/dashboard/linkedin', icon: UserCheck },
  { label: 'Job Scraper', href: '/dashboard/scraper', icon: Search },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const initials = user?.firstName?.[0] && user?.lastName?.[0]
    ? `${user.firstName[0]}${user.lastName[0]}`
    : '?';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transform transition-transform duration-200 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-lg">JobPilot</span>
            </Link>
            <button onClick={() => setOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map(({ label, href, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} strokeWidth={1.8} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-800 lg:hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <button onClick={() => setOpen(true)} className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Link href="/dashboard" className="hover:text-gray-600 dark:hover:text-gray-300">Dashboard</Link>
              {(() => {
                const current = NAV.find((n) => pathname.startsWith(n.href) && n.href !== '/dashboard');
                return current ? (
                  <>
                    <ChevronRight className="w-3.5 h-3.5" />
                    <span className="text-gray-900 dark:text-gray-100 font-medium">{current.label}</span>
                  </>
                ) : null;
              })()}
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{user?.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {initials}
              </div>
              <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="lg:hidden w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-medium">
              {initials}
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
