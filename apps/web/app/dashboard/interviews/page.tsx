'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { INTERVIEWS_QUERY, JOBS_QUERY, CREATE_INTERVIEW_MUTATION, DELETE_INTERVIEW_MUTATION, UPDATE_INTERVIEW_MUTATION } from '@/lib/graphql';
import { MessageSquare, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

const TYPE_BADGE: Record<string, 'purple' | 'orange' | 'amber' | 'blue' | 'red' | 'emerald'> = {
  PHONE: 'purple',
  TECHNICAL: 'orange',
  ONSITE: 'amber',
  BEHAVIORAL: 'blue',
  PANEL: 'red',
  FINAL: 'emerald',
};

export default function InterviewsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    jobApplicationId: '', type: 'PHONE', round: 1, scheduledAt: '', location: '', notes: '',
  });

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: async () => {
      const { interviews } = await client.request(INTERVIEWS_QUERY);
      return interviews;
    },
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, { pagination: { page: 1, limit: 100 } });
      return jobs;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { createInterview } = await client.request(CREATE_INTERVIEW_MUTATION, {
        input: { ...formData, scheduledAt: new Date(formData.scheduledAt).toISOString() },
      });
      return createInterview;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setShowForm(false);
      setFormData({ jobApplicationId: '', type: 'PHONE', round: 1, scheduledAt: '', location: '', notes: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_INTERVIEW_MUTATION, { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(UPDATE_INTERVIEW_MUTATION, { id, input: { isCompleted: true } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['interviews'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interviews</h1>
          <p className="text-gray-500 mt-1">Track your interview schedule</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4" />Schedule Interview</Button>
      </div>

      {showForm && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Interview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select label="Job Application" value={formData.jobApplicationId} onChange={(e) => setFormData({ ...formData, jobApplicationId: e.target.value })} required>
              <option value="">Select a job</option>
              {jobsData?.edges?.map((job: any) => (
                <option key={job.id} value={job.id}>{job.companyName} - {job.jobTitle}</option>
              ))}
            </Select>
            <Select label="Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
              {['PHONE', 'TECHNICAL', 'ONSITE', 'BEHAVIORAL', 'PANEL', 'FINAL'].map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </Select>
            <Input label="Round" type="number" min={1} value={formData.round} onChange={(e) => setFormData({ ...formData, round: parseInt(e.target.value) || 1 })} />
            <Input label="Scheduled At" type="datetime-local" value={formData.scheduledAt} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} required />
            <Input label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
            <Input label="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!formData.jobApplicationId || !formData.scheduledAt}>
              <Plus className="w-4 h-4" />Schedule
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : interviews?.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No interviews scheduled" description="Schedule your first interview" action={{ label: 'Schedule Interview', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Round</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {interviews?.map((interview: any) => (
                  <tr key={interview.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <Badge variant={TYPE_BADGE[interview.type] || 'gray'}>{interview.type}</Badge>
                    </td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-700">Round {interview.round}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-400">{interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleDateString() : '-'}</span></td>
                    <td className="px-4 py-3.5"><span className="text-sm text-gray-700">{interview.location || '-'}</span></td>
                    <td className="px-4 py-3.5">
                      {interview.isCompleted ? (
                        <Badge variant="emerald" dot><CheckCircle2 className="w-3 h-3" /> Completed</Badge>
                      ) : (
                        <Badge variant="amber" dot>Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!interview.isCompleted && (
                          <button onClick={() => completeMutation.mutate(interview.id)} className="p-1.5 text-gray-300 hover:text-emerald-500 transition-colors" title="Mark completed">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => deleteMutation.mutate(interview.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
