'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_CULTURAL_TIP_QUERY,
  FRENCH_CULTURAL_TIP_HISTORY_QUERY,
} from '@/lib/graphql';
import {
  Globe, RefreshCw, History, Lightbulb, MapPin,
  MessageSquare, Briefcase, Users, BookOpen, type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import type { GqlFrenchCulturalTip } from '@/lib/graphql/types';

const CATEGORY_BADGE: Record<string, 'blue' | 'purple' | 'amber' | 'emerald' | 'violet'> = {
  workplace_etiquette: 'blue',
  communication: 'purple',
  business_culture: 'amber',
  social: 'emerald',
  regions: 'violet',
};

const CATEGORY_LABELS: Record<string, string> = {
  workplace_etiquette: 'Workplace Etiquette',
  communication: 'Communication',
  business_culture: 'Business Culture',
  social: 'Social',
  regions: 'Regions',
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  workplace_etiquette: Briefcase,
  communication: MessageSquare,
  business_culture: Lightbulb,
  social: Users,
  regions: Globe,
};

const TOPIC_SUGGESTIONS = [
  'Le vouvoiement et le tutoiement',
  'Les pauses café au travail',
  'La hiérarchie en entreprise',
  'Les réunions en France',
  'Les congés et vacances',
  'La culture du débat',
  'Les repas d\'affaires',
  'Le français québécois au travail',
];

export default function FrenchCulturalPage() {
  const [topic, setTopic] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const { data: tip, isLoading, refetch: refetchTip } = useQuery({
    queryKey: ['frenchCulturalTip', topic],
    queryFn: async () => {
      const { frenchCulturalTip } = await client.request(FRENCH_CULTURAL_TIP_QUERY, {
        topic: topic || undefined,
      });
      return frenchCulturalTip;
    },
    enabled: false,
  });

  const { data: history, isLoading: hLoading } = useQuery({
    queryKey: ['frenchCulturalTipHistory'],
    queryFn: async () => {
      const { frenchCulturalTipHistory } = await client.request(FRENCH_CULTURAL_TIP_HISTORY_QUERY);
      return frenchCulturalTipHistory;
    },
  });

  const [currentTip, setCurrentTip] = useState<GqlFrenchCulturalTip | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);

  async function generateTip(t?: string) {
    setLoadingTip(true);
    try {
      const { frenchCulturalTip } = await client.request(FRENCH_CULTURAL_TIP_QUERY, {
        topic: t || topic || undefined,
      });
      setCurrentTip(frenchCulturalTip);
    } finally {
      setLoadingTip(false);
    }
  }

  const tipCategories = (history
    ? [...new Set(history.map((t: GqlFrenchCulturalTip) => t.category))]
    : []) as string[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cultural Tips"
        description="Learn about French and Quebec workplace culture"
      >
        <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
          <History className="w-4 h-4" />{showHistory ? 'New Tip' : 'History'}
        </Button>
      </PageHeader>

      {!showHistory ? (
        <>
          <Card padding="md">
            <h3 className="font-semibold text-gray-900 mb-3">Get a Cultural Tip</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {TOPIC_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setTopic(s); generateTip(s); }}
                  className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg border border-gray-100 hover:border-blue-200 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Or type a custom topic..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="flex-1"
              />
              <Button onClick={() => generateTip()} disabled={loadingTip}>
                {loadingTip ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" />Generating...</>
                ) : (
                  <><Lightbulb className="w-4 h-4" />Get Tip</>
                )}
              </Button>
              {currentTip && (
                <Button variant="secondary" onClick={() => generateTip()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </Card>

          {currentTip ? (
            <Card padding="lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{currentTip.topic}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={CATEGORY_BADGE[currentTip.category ?? ''] ?? 'gray'}>
                        {CATEGORY_LABELS[currentTip.category ?? ''] ?? currentTip.category}
                      </Badge>
                      <Badge variant="violet" dot>
                        <MapPin className="w-3 h-3 mr-0.5" />
                        {currentTip.region}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">Français</p>
                  <p className="text-gray-900">{currentTip.tip}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-1">English</p>
                  <p className="text-gray-700">{currentTip.translation}</p>
                </div>
              </div>
            </Card>
          ) : loadingTip ? (
            <Card padding="lg" className="text-center">
              <div className="py-8">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Generating cultural tip...</p>
              </div>
            </Card>
          ) : (
            <EmptyState
              icon={Globe}
              title="No tip yet"
              description="Select a topic above or type your own to get a cultural tip"
            />
          )}
        </>
      ) : (
        <div className="space-y-4">
          {tipCategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tipCategories.map((cat) => (
                <Badge key={cat} variant={CATEGORY_BADGE[cat] ?? 'gray'}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </Badge>
              ))}
            </div>
          )}

          {hLoading ? (
            <LoadingState />
          ) : !history || history.length === 0 ? (
            <EmptyState
              icon={History}
              title="No tips yet"
              description="Generate your first cultural tip to see it here"
              action={{ label: 'Get a Tip', onClick: () => setShowHistory(false) }}
            />
          ) : (
            <div className="space-y-3">
              {history.map((item: GqlFrenchCulturalTip) => (
                <Card key={item.id} padding="md" className="border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={CATEGORY_BADGE[item.category ?? ''] ?? 'gray'}>
                        {CATEGORY_LABELS[item.category ?? ''] ?? item.category}
                      </Badge>
                      <Badge variant="violet" dot>{item.region}</Badge>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString('en-CA')}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.topic}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.tip}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
