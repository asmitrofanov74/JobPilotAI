'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { JOBS_QUERY } from '@/lib/graphql';
import { Plus, Briefcase, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

const STATUS_BADGE: Record<string, 'gray' | 'blue' | 'purple' | 'orange' | 'amber' | 'emerald' | 'red'> = {
  SAVED: 'gray',
  APPLIED: 'blue',
  PHONE_SCREEN: 'purple',
  TECHNICAL: 'orange',
  ONSITE: 'amber',
  OFFER: 'emerald',
  REJECTED: 'red',
  WITHDREW: 'gray',
  ACCEPTED: 'emerald',
};

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter, searchQuery],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, {
        pagination: { page: 1, limit: 50 },
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      return jobs;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-500 mt-1">Track and manage your opportunities</p>
        </div>
        <Link href="/dashboard/jobs/new">
          <Button><Plus className="w-4 h-4" />Add Job</Button>
        </Link>
      </div>

      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search companies or positions..."
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['ALL', 'SAVED', 'APPLIED', 'PHONE_SCREEN', 'TECHNICAL', 'ONSITE', 'OFFER', 'REJECTED', 'ACCEPTED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === 'ALL' ? undefined : s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              (s === 'ALL' && !statusFilter) || s === statusFilter
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : data?.edges?.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs yet" description="Start tracking your job applications" action={{ label: 'Add Your First Job', onClick: () => window.location.href = '/dashboard/jobs/new' }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.edges?.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 text-xs font-bold uppercase">
                          {job.companyName?.[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-900">{job.companyName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-700">{job.jobTitle}</span></td>
                    <td className="px-4 py-3.5">
                      <Badge variant={STATUS_BADGE[job.status] || 'gray'}>
                        {job.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-400">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/dashboard/jobs/${job.id}`} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
