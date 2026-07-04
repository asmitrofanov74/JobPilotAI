'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useMe } from '@/lib/hooks/use-me';
import {
  Briefcase,
  FileText,
  PenLine,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

const stats = [
  { label: 'Active Applications', value: '12', icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
  { label: 'Resumes', value: '3', icon: FileText, color: 'text-green-600 bg-green-50' },
  { label: 'Cover Letters', value: '8', icon: PenLine, color: 'text-purple-600 bg-purple-50' },
  { label: 'Upcoming Interviews', value: '2', icon: MessageSquare, color: 'text-orange-600 bg-orange-50' },
  { label: 'Skill Gap Score', value: '74%', icon: TrendingUp, color: 'text-cyan-600 bg-cyan-50' },
];

export default function DashboardPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !me) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}
        </h1>
        <p className="text-gray-500 mt-1">Here&apos;s your job search overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: 'Applied to Senior Developer at Shopify', time: '2 hours ago' },
              { action: 'Generated cover letter for Staff Engineer at Coinbase', time: '1 day ago' },
              { action: 'Interview scheduled with Google (Technical Screen)', time: '2 days ago' },
              { action: 'Resume optimized for AWS position', time: '3 days ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">{item.action}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Add Job', href: '/dashboard/jobs', icon: Briefcase },
              { label: 'Upload Resume', href: '/dashboard/resumes', icon: FileText },
              { label: 'Generate Cover Letter', href: '/dashboard/cover-letters', icon: PenLine },
              { label: 'View Analytics', href: '/dashboard/analytics', icon: TrendingUp },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-gray-700 hover:text-blue-700"
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
