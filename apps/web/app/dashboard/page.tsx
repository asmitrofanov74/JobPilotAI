'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { JOBS_QUERY, RESUMES_QUERY, COVER_LETTERS_QUERY, INTERVIEW_QUESTIONS_QUERY } from '@/lib/graphql';
import Link from 'next/link';
import { Briefcase, FileText, FileEdit, MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: jobs } = useQuery({
    queryKey: ['jobs', 'dashboard'],
    queryFn: async () => {
      const { jobs } = await client.request(JOBS_QUERY, { pagination: { page: 1, limit: 100 } });
      return jobs;
    },
  });
  const { data: resumes } = useQuery({
    queryKey: ['resumes', 'dashboard'],
    queryFn: async () => {
      const { resumes } = await client.request(RESUMES_QUERY);
      return resumes;
    },
  });
  const { data: coverLetters } = useQuery({
    queryKey: ['coverLetters', 'dashboard'],
    queryFn: async () => {
      const { coverLetters } = await client.request(COVER_LETTERS_QUERY);
      return coverLetters;
    },
  });
  const { data: questions } = useQuery({
    queryKey: ['interviewQuestions', 'dashboard'],
    queryFn: async () => {
      const { interviewQuestionsByUser } = await client.request(INTERVIEW_QUESTIONS_QUERY);
      return interviewQuestionsByUser;
    },
  });

  const stats = [
    { label: 'Job Applications', value: jobs?.paginatedItems?.length ?? jobs?.edges?.length ?? 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50', href: '/dashboard/jobs' },
    { label: 'Resumes', value: resumes?.length ?? 0, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/dashboard/resumes' },
    { label: 'Cover Letters', value: coverLetters?.length ?? 0, icon: FileEdit, color: 'text-violet-600', bg: 'bg-violet-50', href: '/dashboard/cover-letters' },
    { label: 'Interview Questions', value: questions?.length ?? 0, icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', href: '/dashboard/skills' },
  ];

  const actions = [
    { label: 'Browse Jobs', desc: 'Find your next opportunity', href: '/dashboard/jobs', icon: Briefcase },
    { label: 'Upload Resume', desc: 'Let AI analyze your profile', href: '/dashboard/resumes', icon: FileText },
    { label: 'Generate Cover Letter', desc: 'AI-powered in seconds', href: '/dashboard/cover-letters', icon: FileEdit },
    { label: 'Practice Interview', desc: 'Prepare with AI questions', href: '/dashboard/skills', icon: MessageSquare },
  ];

  const aiLinks = [
    { text: 'Need a cover letter?', desc: 'Generate one from any job posting', href: '/dashboard/cover-letters' },
    { text: 'Identify skill gaps', desc: 'Compare your profile to job requirements', href: '/dashboard/skills' },
    { text: 'Track your progress', desc: 'View application analytics', href: '/dashboard/analytics' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening with your job search.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(({ label, desc, href, icon: Icon }) => (
            <Link key={href} href={href} className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors">
                <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="flex items-start gap-3 text-sm">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4 text-gray-400" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-gray-700">No recent applications</p>
              <p className="text-gray-400 text-xs mt-0.5">Start by browsing jobs</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Beta</span>
          </div>
          <div className="space-y-3">
            {aiLinks.map(({ text, desc, href }) => (
              <Link key={text} href={href} className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">{text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
