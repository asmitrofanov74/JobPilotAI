'use client';

import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_PROGRESS_QUERY,
  FRENCH_SESSIONS_QUERY,
  FRENCH_CONVERSATIONS_QUERY,
} from '@/lib/graphql';
import Link from 'next/link';
import {
  BarChart3, ScrollText, GraduationCap, Languages, MessageSquare,
  Users, Mic, BookOpen, Coffee, ArrowRight, TrendingUp, BookmarkCheck,
  AlertTriangle, Zap,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { FRENCH_SCENARIO_RECORD } from '@/lib/constants/french-scenarios';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ScoreBar } from '@/components/ui/score-bar';

const SESSION_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cv_review: { label: 'CV Review', icon: ScrollText, color: 'text-blue-600' },
  cover_letter: { label: 'Cover Letter', icon: Languages, color: 'text-emerald-600' },
  interview: { label: 'Interview', icon: Mic, color: 'text-violet-600' },
  linkedin: { label: 'LinkedIn', icon: MessageSquare, color: 'text-amber-600' },
  vocabulary: { label: 'Vocabulary', icon: BookOpen, color: 'text-rose-600' },
  cultural: { label: 'Cultural', icon: Users, color: 'text-cyan-600' },
};

export default function FrenchProgressPage() {
  const { data: progress, isLoading: pLoading } = useQuery({
    queryKey: ['frenchProgress'],
    queryFn: async () => {
      const { frenchProgress } = await client.request(FRENCH_PROGRESS_QUERY);
      return frenchProgress;
    },
  });

  const { data: sessionsData, isLoading: sLoading } = useQuery({
    queryKey: ['frenchSessions'],
    queryFn: async () => {
      const { frenchSessions } = await client.request(FRENCH_SESSIONS_QUERY);
      return frenchSessions;
    },
  });

  const { data: conversations, isLoading: cLoading } = useQuery({
    queryKey: ['frenchConversations'],
    queryFn: async () => {
      const { frenchConversations } = await client.request(FRENCH_CONVERSATIONS_QUERY);
      return frenchConversations;
    },
  });

  const isLoading = pLoading || sLoading || cLoading;

  if (isLoading) return <LoadingState />;

  const stats = [
    { label: 'Avg Score', value: progress?.averageScore != null ? `${progress.averageScore}` : '—', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vocabulary Words', value: progress?.vocabularyCount ?? 0, icon: BookmarkCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Day Streak', value: progress?.streakDays ?? 0, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Mastered Words', value: progress?.masteredWords ?? 0, icon: GraduationCap, color: 'text-violet-600', bg: 'bg-violet-50' },
  ];

  const sessions = sessionsData ?? [];
  const sessionsByType = progress?.sessionsByType ?? {};
  const scoreHistory = progress?.scoreHistory ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics & Progress"
        description="Track your French learning progress with detailed analytics"
      />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon, color, bg }) => (
            <StatCard key={label} label={label} value={value} icon={icon} color={color} bg={bg} />
          ))}
        </div>

      {progress?.weaknesses && progress.weaknesses.length > 0 && (
        <Card padding="md" className="border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            <p className="text-sm text-amber-800">
              Focus areas: <strong>{progress.weaknesses.join(', ')}</strong> — these need the most improvement.
            </p>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <Card padding="lg">
          <h3 className="font-semibold text-gray-900 mb-4">Scores Overview</h3>
          <div className="space-y-3">
            <ScoreBar label="Grammar" score={progress?.grammarAvg} color="bg-blue-500" />
            <ScoreBar label="Vocabulary" score={progress?.vocabularyAvg} color="bg-emerald-500" />
            <ScoreBar label="Fluency" score={progress?.fluencyAvg} color="bg-violet-500" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Based on {scoreHistory.length} day{scoreHistory.length !== 1 ? 's' : ''} of conversation evaluations
            </p>
          </div>
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold text-gray-900 mb-4">Sessions by Type</h3>
          {Object.keys(sessionsByType).length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ScrollText className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No sessions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(sessionsByType).map(([type, count]: [string, any]) => {
                const meta = SESSION_TYPE_LABELS[type] || { label: type, icon: ScrollText, color: 'text-gray-600' };
                const Icon = meta.icon;
                const total = count;
                const completed = sessions.filter((s: any) => s.type === type && s.status === 'completed').length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{meta.label}</span>
                        <span className="text-xs text-gray-500">{completed}/{total}</span>
                      </div>
                      <ProgressBar value={pct} color="bg-blue-500" height="sm" className="mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <h3 className="font-semibold text-gray-900 mb-4">Score History</h3>
          {scoreHistory.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <TrendingUp className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">Start conversations to see score trends</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scoreHistory.filter((_: any, i: number) => i >= scoreHistory.length - 7).map((point: any) => (
                <div key={point.date} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-20 shrink-0">
                    {new Date(point.date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    <div className="h-2 rounded-sm bg-blue-500" style={{ width: `${point.grammarScore}%` }} />
                    <div className="h-2 rounded-sm bg-emerald-500" style={{ width: `${point.vocabularyScore}%` }} />
                    <div className="h-2 rounded-sm bg-violet-500" style={{ width: `${point.fluencyScore}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round((point.grammarScore + point.vocabularyScore + point.fluencyScore) / 3)}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2 text-xs text-gray-400">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-blue-500" /> Grammar</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500" /> Vocab</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-violet-500" /> Fluency</div>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <h3 className="font-semibold text-gray-900 mb-4">Scenarios Practiced</h3>
          {conversations?.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <Link href="/dashboard/french/conversations" className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2">
                Start a conversation
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(FRENCH_SCENARIO_RECORD).map(([key, meta]) => {
                const Icon = meta.icon;
                const convCount = conversations?.filter((c: any) => c.scenario === key).length ?? 0;
                const msgCount = conversations
                  ?.filter((c: any) => c.scenario === key)
                  .reduce((sum: number, c: any) => sum + (c.messages?.length ?? 0), 0) ?? 0;
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color.replace('text', 'bg').replace('600', '100')}`}>
                      <Icon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                      <p className="text-xs text-gray-400">{convCount} conversations, {msgCount} messages</p>
                    </div>
                    <Link href={`/dashboard/french/conversations?scenario=${key}`} className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0">
                      Practice
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Session History</h3>
            <span className="text-xs text-gray-400">{sessions.length} total</span>
          </div>
          {sessions.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="No sessions yet"
              description="Complete a session to see your history here"
              action={{ label: 'Go to Overview', onClick: () => window.location.href = '/dashboard/french' }}
            />
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {sessions.map((session: any) => {
                const meta = SESSION_TYPE_LABELS[session.type] || { label: session.type, icon: ScrollText, color: 'text-gray-600' };
                const Icon = meta.icon;
                return (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{meta.label}</p>
                        <p className="text-xs text-gray-400">{new Date(session.createdAt).toLocaleDateString('en-CA')}</p>
                      </div>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'green' : 'amber'}>
                      {session.status === 'completed' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
