'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { JOBS_QUERY, DELETE_JOB_MUTATION, DELETE_ALL_JOBS_MUTATION } from '@/lib/graphql';
import { Plus, Briefcase, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Saved', value: 'SAVED' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Phone Screen', value: 'PHONE_SCREEN' },
  { label: 'Technical', value: 'TECHNICAL' },
  { label: 'Onsite', value: 'ONSITE' },
  { label: 'Offer', value: 'OFFER' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Accepted', value: 'ACCEPTED' },
];

const PAGE_SIZES = [5, 10, 20];

const COLUMNS = [
  { key: 'companyName', label: 'Company', sortable: true },
  { key: 'jobTitle', label: 'Position', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
];

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', statusFilter, searchQuery, page, limit, sortBy, sortOrder],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, {
        pagination: { page, limit, sortBy, sortOrder },
        status: statusFilter || undefined,
        search: searchQuery || undefined,
      });
      return jobs;
    },
    placeholderData: (prev) => prev,
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_JOB_MUTATION, { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const deleteSelected = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => client.request(DELETE_JOB_MUTATION, { id })));
    },
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const deleteAll = useMutation({
    mutationFn: async () => {
      const { deleteAllJobs } = await client.request(DELETE_ALL_JOBS_MUTATION);
      return deleteAllJobs;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    setPage(1);
  }

  const jobIds = data?.edges?.map((j: any) => j.id) ?? [];
  const allSelected = jobIds.length > 0 && jobIds.every((id: string) => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(jobIds));
    }
  }

  function SortIcon({ column }: { column: string }) {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-500 mt-1">Track and manage your opportunities</p>
        </div>
        <div className="flex items-center gap-2">
          {meta && meta.total > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Delete all ${meta.total} job applications? This cannot be undone.`)) {
                  deleteAll.mutate();
                }
              }}
              disabled={deleteAll.isPending}
              className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Delete All
            </button>
          )}
          <Link href="/dashboard/jobs/new">
            <Button><Plus className="w-4 h-4" />Add Job</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selectedIds.size > 0 && (
          <button
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.size} selected job${selectedIds.size !== 1 ? 's' : ''}?`)) {
                deleteSelected.mutate([...selectedIds]);
              }
            }}
            disabled={deleteSelected.isPending}
            className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            Delete {selectedIds.size} selected
          </button>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search companies or positions..."
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={limit}
          onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
          className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s} per page</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : data?.edges?.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs yet" description="Start tracking your job applications" action={{ label: 'Add Your First Job', onClick: () => window.location.href = '/dashboard/jobs/new' }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 20rem)' }}>
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="bg-gray-50">
                  <th className="w-10 px-2 py-3.5 text-left">
                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && toggleSort(col.key)}
                      className={`text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        {col.sortable && <SortIcon column={col.key} />}
                      </div>
                    </th>
                  ))}
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.edges?.map((job: any) => (
                  <tr key={job.id} className={`hover:bg-gray-50/50 transition-colors ${selectedIds.has(job.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="w-10 px-2 py-3.5 text-center">
                      <input type="checkbox" checked={selectedIds.has(job.id)} onChange={() => toggleSelect(job.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 text-xs font-bold uppercase shrink-0">
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
                      <div className="flex items-center justify-end gap-2">
                        {job.jobUrl ? (
                          <a href={job.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">View</a>
                        ) : (
                          <Link href={`/dashboard/jobs/${job.id}`} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">View</Link>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${job.jobTitle}" at ${job.companyName}?`)) {
                              deleteJob.mutate(job.id);
                            }
                          }}
                          disabled={deleteJob.isPending}
                          className="inline-flex items-center p-1.5 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Page {meta.page} of {totalPages} ({meta.total} jobs)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
