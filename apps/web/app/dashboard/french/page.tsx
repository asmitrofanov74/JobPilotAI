'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_PROFILE_QUERY,
  FRENCH_PROGRESS_QUERY,
  FRENCH_CONVERSATIONS_QUERY,
  FRENCH_SESSIONS_QUERY,
  FRENCH_TODAY_VOCABULARY_QUERY,
  FRENCH_VOCABULARY_TRACKER_STATS_QUERY,
  MARK_VOCABULARY_LEARNED_MUTATION,
  MARK_VOCABULARY_DIFFICULT_MUTATION,
} from '@/lib/graphql';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MessageSquare, BarChart3, BookOpen, Users, Mic, Coffee,
  ArrowRight, GraduationCap, Sparkles, ScrollText, Languages,
  BookmarkCheck, Globe, CheckCircle2, AlertTriangle, BookmarkPlus,
  Brain, Settings,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const SCENARIOS = [
  { value: 'job_interview', label: 'Job Interview', icon: Mic, desc: 'Practice French interview questions', color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'recruiter_call', label: 'Recruiter Call', icon: Users, desc: 'Simulate calls with French recruiters', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'team_meeting', label: 'Team Meeting', icon: BookOpen, desc: 'Participate in French team discussions', color: 'text-violet-600', bg: 'bg-violet-50' },
  { value: 'daily_standup', label: 'Daily Standup', icon: MessageSquare, desc: 'Share updates in a French standup', color: 'text-amber-600', bg: 'bg-amber-50' },
  { value: 'office_conversation', label: 'Office Chat', icon: Coffee, desc: 'Casual French office conversations', color: 'text-rose-600', bg: 'bg-rose-50' },
];

export default function FrenchCoachPage() {
  const router = useRouter();

  const { data: profile } = useQuery({
    queryKey: ['frenchProfile'],
    queryFn: async () => {
      const { frenchProfile } = await client.request(FRENCH_PROFILE_QUERY);
      return frenchProfile;
    },
  });

  const { data: progress, isLoading: pLoading } = useQuery({
    queryKey: ['frenchProgress'],
    queryFn: async () => {
      const { frenchProgress } = await client.request(FRENCH_PROGRESS_QUERY);
      return frenchProgress;
    },
  });

  const { data: conversations, isLoading: cLoading } = useQuery({
    queryKey: ['frenchConversations'],
    queryFn: async () => {
      const { frenchConversations } = await client.request(FRENCH_CONVERSATIONS_QUERY);
      return frenchConversations;
    },
  });

  const { data: sessionsData, isLoading: sLoading } = useQuery({
    queryKey: ['frenchSessions'],
    queryFn: async () => {
      const { frenchSessions } = await client.request(FRENCH_SESSIONS_QUERY);
      return frenchSessions;
    },
  });

  const { data: todayVocab, isLoading: tvLoading, refetch: refetchToday } = useQuery({
    queryKey: ['frenchTodayVocabulary'],
    queryFn: async () => {
      const { frenchTodayVocabulary } = await client.request(FRENCH_TODAY_VOCABULARY_QUERY);
      return frenchTodayVocabulary;
    },
  });

  const { data: trackerStats } = useQuery({
    queryKey: ['frenchVocabularyTrackerStats'],
    queryFn: async () => {
      const { frenchVocabularyTrackerStats } = await client.request(FRENCH_VOCABULARY_TRACKER_STATS_QUERY);
      return frenchVocabularyTrackerStats;
    },
  });

  const markLearned = useMutation({
    mutationFn: async (id: string) => {
      await client.request(MARK_VOCABULARY_LEARNED_MUTATION, { id });
    },
    onSuccess: () => refetchToday(),
  });

  const markDifficult = useMutation({
    mutationFn: async ({ id, difficult }: { id: string; difficult: boolean }) => {
      await client.request(MARK_VOCABULARY_DIFFICULT_MUTATION, { id, difficult });
    },
    onSuccess: () => refetchToday(),
  });

  const isLoading = pLoading || cLoading || sLoading || tvLoading;

  const stats = [
    { label: 'Conversations', value: conversations?.length ?? 0, icon: Languages, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Sessions', value: progress?.totalSessions ?? 0, icon: ScrollText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Completed', value: progress?.completedSessions ?? 0, icon: GraduationCap, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Avg Score', value: progress?.averageScore != null ? progress.averageScore : '—', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const recentConversations = conversations?.slice(0, 5) ?? [];

  function getScenarioLabel(value: string) {
    return SCENARIOS.find((s) => s.value === value)?.label ?? value;
  }

  function getScenarioIcon(value: string) {
    const scenario = SCENARIOS.find((s) => s.value === value);
    return scenario ? <scenario.icon className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        {profile?.frenchVariant && (
          <Badge variant={profile.frenchVariant === 'quebec' ? 'violet' : 'blue'} className="shrink-0">
            <Globe className="w-3 h-3 mr-1" />
            {profile.frenchVariant === 'quebec' ? 'Quebec French' : 'France French'}
          </Badge>
        )}
        <PageHeader
          title="French Coach"
          description="Pratiquez votre français avec l'IA — practice French with AI-powered conversations"
        >
          <Button onClick={() => router.push('/dashboard/french/settings')} variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
          <Button onClick={() => router.push('/dashboard/french/conversations')}>
            <MessageSquare className="w-4 h-4" />New Conversation
          </Button>
        </PageHeader>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} padding="md" className="border-gray-100">
            <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </Card>
        ))}
      </div>

      {/* Vocabulary Tracker Dashboard Widgets */}
      {trackerStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card padding="md" className="border-gray-100">
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center mb-3">
              <BookmarkCheck className="w-5 h-5 text-rose-600" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{trackerStats.total}</p>
            <p className="text-sm text-gray-500 mt-0.5">Words Tracked</p>
          </Card>
          <Card padding="md" className="border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{trackerStats.learned}</p>
            <p className="text-sm text-gray-500 mt-0.5">Learned</p>
          </Card>
          <Card padding="md" className="border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{trackerStats.difficult}</p>
            <p className="text-sm text-gray-500 mt-0.5">Difficult</p>
          </Card>
          <Link href="/dashboard/french/vocabulary" className="block">
            <Card padding="md" className="border-gray-100 hover:shadow-md transition-shadow h-full">
              <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center mb-3">
                <BookmarkPlus className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {todayVocab?.words?.length ?? 0}
              </p>
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-gray-500 mt-0.5">Today's Words</p>
                <ArrowRight className="w-3 h-3 text-gray-400" strokeWidth={1.5} />
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* Today's Vocabulary Widget */}
      {todayVocab && todayVocab.words.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-violet-600" strokeWidth={1.5} />
              <h3 className="font-semibold text-gray-900">Today's Vocabulary</h3>
              <Badge variant="violet">
                {todayVocab.learnedCount}/{todayVocab.totalCount} learned
              </Badge>
            </div>
            <Link
              href="/dashboard/french/vocabulary"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {todayVocab.words.map((word: any) => (
              <div
                key={word.id}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between mb-1.5">
                  <p className="font-semibold text-gray-900">{word.word}</p>
                  <div className="flex gap-1">
                    {word.difficult && (
                      <Badge variant="amber" dot>Hard</Badge>
                    )}
                    {word.learned && (
                      <Badge variant="green" dot>Learned</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-3">{word.translation}</p>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => markLearned.mutate(word.id)}
                    disabled={word.learned || markLearned.isPending}
                    className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      word.learned
                        ? 'bg-emerald-100 text-emerald-700 cursor-default'
                        : 'bg-white text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 border border-gray-200'
                    }`}
                  >
                    Learned
                  </button>
                  <button
                    onClick={() => markDifficult.mutate({ id: word.id, difficult: !word.difficult })}
                    disabled={markDifficult.isPending}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      word.difficult
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-600 border border-gray-200'
                    }`}
                  >
                    {word.difficult ? 'Hard' : 'Easy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Practice Scenarios</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {SCENARIOS.map(({ value, label, icon: Icon, desc, color, bg }) => (
            <Link
              key={value}
              href={`/dashboard/french/conversations?scenario=${value}`}
              className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
            >
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/french/vocabulary"
          className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookmarkCheck className="w-6 h-6 text-rose-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Vocabulary Builder</p>
              <p className="text-sm text-gray-400 mt-0.5">Learn and review French words with spaced repetition</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" strokeWidth={1.5} />
          </div>
        </Link>
        <Link
          href="/dashboard/french/cultural"
          className="block bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Globe className="w-6 h-6 text-cyan-600" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Cultural Tips</p>
              <p className="text-sm text-gray-400 mt-0.5">Discover French and Quebec workplace culture</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" strokeWidth={1.5} />
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Conversations</h3>
            <Link href="/dashboard/french/conversations" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {recentConversations.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => router.push('/dashboard/french/conversations')}
              >
                Start your first conversation
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentConversations.map((conv: any) => (
                <Link
                  key={conv.id}
                  href={`/dashboard/french/conversations?id=${conv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      {getScenarioIcon(conv.scenario)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{getScenarioLabel(conv.scenario)}</p>
                      <p className="text-xs text-gray-400">{conv.messages?.length ?? 0} messages</p>
                    </div>
                  </div>
                  <Badge variant="blue" className="shrink-0">{conv.scenario.replace(/_/g, ' ')}</Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sessions by Type</h3>
            <Link href="/dashboard/french/progress" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          {sessionsData?.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <ScrollText className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No sessions yet</p>
            </div>
          ) : progress?.sessionsByType && Object.keys(progress.sessionsByType).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(progress.sessionsByType).map(([type, count]: [string, any]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 capitalize">{type.replace(/_/g, ' ')}</span>
                  <Badge variant="blue">{count} session{count !== 1 ? 's' : ''}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <ScrollText className="w-8 h-8 text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm text-gray-500">No sessions yet</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
