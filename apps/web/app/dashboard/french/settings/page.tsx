'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { FRENCH_PROFILE_QUERY, UPDATE_FRENCH_PROFILE_MUTATION } from '@/lib/graphql';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { Save, Languages, ArrowRightLeft, CheckCircle2, BookOpen } from 'lucide-react';

const VARIANTS = [
  {
    value: 'FRANCE',
    label: 'France French',
    desc: 'Standard French as spoken in France (français de France)',
    emoji: '🇫🇷',
    features: [
      'Standard French vocabulary and expressions',
      'France workplace culture',
      'Metropolitan French pronunciation',
    ],
  },
  {
    value: 'QUEBEC',
    label: 'Quebec French',
    desc: 'French as spoken in Quebec, Canada (français québécois)',
    emoji: '🇨🇦',
    features: [
      'Quebec French vocabulary and expressions',
      'Quebec workplace culture',
      'Quebec French pronunciation and idioms',
    ],
  },
];

export default function FrenchSettingsPage() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['frenchProfile'],
    queryFn: async () => {
      const { frenchProfile } = await client.request(FRENCH_PROFILE_QUERY);
      return frenchProfile;
    },
  });

  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const effectiveVariant = selectedVariant ?? profile?.frenchVariant ?? 'FRANCE';

  const updateMutation = useMutation({
    mutationFn: async (variant: string) => {
      const { updateFrenchProfile } = await client.request(UPDATE_FRENCH_PROFILE_MUTATION, {
        input: { frenchVariant: variant },
      });
      return updateFrenchProfile;
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="French Settings"
        description="Configure your French learning preferences"
      />

      <Card padding="lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Languages className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">French Variant</h3>
            <p className="text-sm text-gray-500">
              Choose between France French and Quebec French. This affects conversations, vocabulary, and cultural tips.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {VARIANTS.map((v) => {
            const isActive = effectiveVariant === v.value;
            const isCurrent = profile?.frenchVariant === v.value;
            return (
              <button
                key={v.value}
                onClick={() => {
                  setSelectedVariant(v.value);
                  setSaved(false);
                }}
                className={`p-5 rounded-xl border-2 text-left transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 bg-white hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{v.emoji}</span>
                  {isCurrent && <Badge variant="blue">Current</Badge>}
                </div>
                <p className="font-semibold text-gray-900 mb-1">{v.label}</p>
                <p className="text-sm text-gray-500 mb-3">{v.desc}</p>
                <ul className="space-y-1">
                  {v.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-medium text-amber-800">How variants affect your experience</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Conversations adapt to your chosen variant. Vocabulary shows Quebec equivalents. Cultural tips prioritize your region.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6">
          {saved && (
            <div className="flex items-center gap-2 text-emerald-600 mr-4">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Settings saved!</span>
            </div>
          )}
          <Button
            onClick={() => updateMutation.mutate(effectiveVariant)}
            disabled={updateMutation.isPending || effectiveVariant === profile?.frenchVariant}
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </Card>

      {/* Variant comparison */}
      <Card padding="lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-purple-600" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Key Differences</h3>
            <p className="text-sm text-gray-500">Common differences between France and Quebec French</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { france: 'Bonjour / Bonsoir', quebec: 'Allô / Bonjour', note: 'Greeting - Allô is used like "hi" in Quebec' },
            { france: 'Je suis', quebec: 'Chu / J\'suis', note: 'Contracted pronunciation is standard in Quebec speech' },
            { france: 'Maintenant', quebec: 'Asteur (à cette heure)', note: 'Common Quebec adverb for "now"' },
            { france: 'Ça m\'énerve', quebec: 'Ça m\'achale', note: '"That annoys me" - different verb entirely' },
            { france: 'Les chaussures', quebec: 'Les souliers', note: 'Different word for "shoes"' },
            { france: 'Le week-end', quebec: 'La fin de semaine', note: 'Weekend is masculine in France, feminine in Quebec' },
            { france: 'Une voiture', quebec: 'Un char', note: '"Car" - different masculine/feminine noun' },
            { france: 'D\'accord', quebec: 'Correct', note: '"Okay" - correct is the default Quebec response' },
            { france: 'C\'est ennuyeux', quebec: 'C\'est plate', note: '"That\'s boring" - distinct Quebec expression' },
          ].map((diff, i) => (
            <div key={i} className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">France</p>
                <p className="text-sm font-medium text-gray-900">{diff.france}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Quebec</p>
                <p className="text-sm font-medium text-purple-700">{diff.quebec}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Note</p>
                <p className="text-xs text-gray-600">{diff.note}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
