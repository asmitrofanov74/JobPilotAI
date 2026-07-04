'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { JOBS_QUERY } from '@/lib/graphql';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  SAVED: 'bg-gray-100 text-gray-700',
  APPLIED: 'bg-blue-100 text-blue-700',
  PHONE_SCREEN: 'bg-purple-100 text-purple-700',
  TECHNICAL: 'bg-orange-100 text-orange-700',
  ONSITE: 'bg-amber-100 text-amber-700',
  OFFER: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  WITHDREW: 'bg-gray-100 text-gray-500',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
};

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, {
        pagination: { page: 1, limit: 50 },
        status: statusFilter || undefined,
      });
      return jobs;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-500 mt-1">Track and manage your job applications</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['ALL', 'SAVED', 'APPLIED', 'PHONE_SCREEN', 'TECHNICAL', 'ONSITE', 'OFFER', 'REJECTED', 'ACCEPTED'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status === 'ALL' ? undefined : status)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              (status === 'ALL' && !statusFilter) || status === statusFilter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'ALL' ? 'All' : status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : data?.edges?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs yet</h3>
          <p className="text-gray-500 mb-4">Start tracking your job applications</p>
          <Link
            href="/dashboard/jobs/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Your First Job
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.edges?.map((job: any) => (
                <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">{job.companyName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">{job.jobTitle}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
                      {job.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  );
}
