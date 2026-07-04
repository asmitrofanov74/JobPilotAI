'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { FUNNEL_ANALYTICS_QUERY, MONTHLY_STATS_QUERY, JOBS_QUERY } from '@/lib/graphql';
import { Briefcase, MessageSquare, Award, TrendingUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const funnelLabels: Record<string, string> = {
  saved: 'Saved', applied: 'Applied', phoneScreen: 'Phone Screen',
  technical: 'Technical', onsite: 'Onsite', offer: 'Offer',
  rejected: 'Rejected', accepted: 'Accepted',
};

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
  const interviews = jobs.filter((j: any) => j.interviews?.length > 0).length;
  const offers = jobs.filter((j: any) => j.status === 'OFFER' || j.status === 'ACCEPTED').length;
  const acceptanceRate = totalApplications > 0 ? Math.round((offers / totalApplications) * 100) : 0;

  const funnelChart = funnelData
    ? Object.entries(funnelData).map(([key, value]) => ({ name: funnelLabels[key] || key, value }))
    : [];

  const STATS = [
    { label: 'Total Applications', value: totalApplications, icon: Briefcase, bg: 'bg-blue-50', color: 'text-blue-600' },
    { label: 'Interviews', value: interviews, icon: MessageSquare, bg: 'bg-purple-50', color: 'text-purple-600' },
    { label: 'Offers', value: offers, icon: Award, bg: 'bg-emerald-50', color: 'text-emerald-600' },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: TrendingUp, bg: 'bg-cyan-50', color: 'text-cyan-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your job search performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label}>
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h2>
          {funnelLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
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
            <div className="flex justify-center py-16"><Spinner /></div>
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
