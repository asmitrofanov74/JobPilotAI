'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useLogout } from '@/lib/hooks/use-auth';
import { useMe } from '@/lib/hooks/use-me';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  PenLine,
  MessageSquare,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Jobs', href: '/dashboard/jobs', icon: Briefcase },
  { label: 'Resumes', href: '/dashboard/resumes', icon: FileText },
  { label: 'Cover Letters', href: '/dashboard/cover-letters', icon: PenLine },
  { label: 'Interviews', href: '/dashboard/interviews', icon: MessageSquare },
  { label: 'Skill Gap', href: '/dashboard/skills', icon: TrendingUp },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useLogout();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useMe();

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-30 max-md:hidden">
        <div className="p-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900">
            JobPilot AI
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 truncate max-w-[120px]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500 text-xs truncate max-w-[120px]">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col max-md:w-full md:ml-64">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between md:hidden">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <span className="font-bold text-gray-900">JobPilot AI</span>
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
        </header>

        {sidebarOpen && (
          <div className="md:hidden bg-white border-b border-gray-200 px-4 pb-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
