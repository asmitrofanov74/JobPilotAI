'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { FUNNEL_ANALYTICS_QUERY, MONTHLY_STATS_QUERY, JOBS_QUERY } from '@/lib/graphql';
import { Briefcase, MessageSquare, Award, TrendingUp, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const funnelLabels: Record<string, string> = {
  saved: 'Saved',
  applied: 'Applied',
  phoneScreen: 'Phone Screen',
  technical: 'Technical',
  onsite: 'Onsite',
  offer: 'Offer',
  rejected: 'Rejected',
  accepted: 'Accepted',
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
      const { monthlyStats } = await client.request(MONTHLY_STATS_QUERY, {
        from: from.toISOString(),
        to: to.toISOString(),
      });
      return monthlyStats;
    },
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, {
        pagination: { page: 1, limit: 100 },
      });
      return jobs;
    },
  });

  const jobs = jobsData?.edges || [];
  const totalApplications = jobs.length;
  const interviews = jobs.filter((j: any) => j.interviews?.length > 0).length;
  const offers = jobs.filter((j: any) => j.status === 'OFFER' || j.status === 'ACCEPTED').length;
  const accepted = jobs.filter((j: any) => j.status === 'ACCEPTED').length;
  const acceptanceRate = totalApplications > 0 ? Math.round((offers / totalApplications) * 100) : 0;

  const funnelChart = funnelData
    ? Object.entries(funnelData).map(([key, value]) => ({
        name: funnelLabels[key] || key,
        value,
      }))
    : [];

  const statsCards = [
    { label: 'Total Applications', value: totalApplications, icon: Briefcase, color: 'text-blue-600 bg-blue-50' },
    { label: 'Interviews', value: interviews, icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
    { label: 'Offers', value: offers, icon: Award, color: 'text-green-600 bg-green-50' },
    { label: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: TrendingUp, color: 'text-cyan-600 bg-cyan-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Track your job search performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-4">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Funnel</h2>
          {funnelLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
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
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
          {monthlyLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
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
        </div>
      </div>
    </div>
  );
}
