'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { FUNNEL_ANALYTICS_QUERY, MONTHLY_STATS_QUERY, JOBS_QUERY } from '@/lib/graphql';
import { Briefcase, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { FUNNEL_LABELS } from '@/lib/constants';

export default function AnalyticsPage() {
  const { data: funnelData, isLoading: funnelLoading } = useQuery({
    queryKey: ['funnelAnalytics'],
    queryFn: async () => {
      const { funnelAnalytics } = await client.request(FUNNEL_ANALYTICS_QUERY);
      return funnelAnalytics;
    },
  });

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthlyStats'],
    queryFn: async () => {
      const to = new Date();
      const from = new Date(to.getFullYear() - 1, to.getMonth(), 1);
      const { monthlyStats } = await client.request(MONTHLY_STATS_QUERY, { from: from.toISOString(), to: to.toISOString() });
      return monthlyStats;
    },
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, { pagination: { page: 1, limit: 100 } });
      return jobs;
    },
  });

  const jobs = jobsData?.edges || [];
  const totalApplications = jobs.length;
  const interviews = jobs.filter((j: { interviews?: unknown[] }) => (j.interviews?.length ?? 0) > 0).length;
  const offers = jobs.filter((j: { status: string }) => j.status === 'OFFER' || j.status === 'ACCEPTED').length;
  const acceptanceRate = totalApplications > 0 ? Math.round((offers / totalApplications) * 100) : 0;

  const funnelChart = funnelData
    ? Object.entries(funnelData).map(([key, value]) => ({ name: FUNNEL_LABELS[key] || key, value }))
    : [];

  const STATS = [
    { label: 'Total Applications', value: totalApplications, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Interviews', value: interviews, icon: MessageSquare, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Offers', value: offers, icon: Award, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: TrendingUp, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Track your job search performance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon, bg, color }) => (
          <StatCard key={label} label={label} value={value} icon={icon} bg={bg} color={color} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h2>
          {funnelLoading ? (
            <LoadingState padding="md" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          {monthlyLoading ? (
            <LoadingState padding="md" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} name="Applications" />
                <Line type="monotone" dataKey="interviews" stroke="#8b5cf6" strokeWidth={2} name="Interviews" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
