'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { OPTIMIZE_LINKEDIN_EXPERIENCE_MUTATION } from '@/lib/graphql';
import { BarChart3, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ToneSelector } from '@/components/linkedin-optimizer/tone-selector';
import { BulletList } from '@/components/linkedin-optimizer/bullet-list';
import { parseCommaSeparated } from '@/lib/linkedin-optimizer/utils';
import { PAGE_CONFIGS, TONE_OPTIONS } from '@/lib/linkedin-optimizer/config';
import { type GqlLinkedinResult } from '@/lib/graphql/types';

const config = PAGE_CONFIGS.experience_optimizer;

interface ExperienceEntry {
  company: string;
  role: string;
  description: string;
  duration: string;
  achievements: string;
}

export default function ExperiencePage() {
  const [entries, setEntries] = useState<ExperienceEntry[]>([
    { company: '', role: '', description: '', duration: '', achievements: '' },
  ]);
  const [industry, setIndustry] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState<GqlLinkedinResult | null>(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const { optimizeLinkedinExperience } = await client.request(OPTIMIZE_LINKEDIN_EXPERIENCE_MUTATION, {
        input: {
          entries: entries.map((e) => ({
            company: e.company, role: e.role, description: e.description,
            duration: e.duration || undefined,
            achievements: e.achievements ? parseCommaSeparated(e.achievements) : undefined,
          })),
          industry: industry || undefined, tone,
        },
      });
      return optimizeLinkedinExperience;
    },
    onSuccess: (data) => setResult(data),
  });

  const addEntry = () => setEntries([...entries, { company: '', role: '', description: '', duration: '', achievements: '' }]);
  const removeEntry = (index: number) => setEntries(entries.filter((_, i) => i !== index));
  const updateEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const output = result?.output;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1">{config.description}</p>
      </div>

      <Card padding="lg">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Experience Entries</h2>
            <Button onClick={addEntry} variant="secondary" size="sm">
              <Plus className="w-4 h-4" />Add Entry
            </Button>
          </div>
          {entries.map((entry, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Entry {i + 1}</span>
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Company" value={entry.company} onChange={(e) => updateEntry(i, 'company', e.target.value)} placeholder="e.g. Google" required />
                <Input label="Role" value={entry.role} onChange={(e) => updateEntry(i, 'role', e.target.value)} placeholder="e.g. Senior Software Engineer" required />
              </div>
              <Input label="Duration (optional)" value={entry.duration} onChange={(e) => updateEntry(i, 'duration', e.target.value)} placeholder="e.g. Jan 2020 - Present" />
              <Textarea label="Description" value={entry.description} onChange={(e) => updateEntry(i, 'description', e.target.value)} rows={3} placeholder="Describe your responsibilities and impact" required />
              <Input label="Key Achievements (comma separated, optional)" value={entry.achievements} onChange={(e) => updateEntry(i, 'achievements', e.target.value)} placeholder="e.g. Reduced latency by 40%, Led team of 10" />
            </div>
          ))}
          <div className="flex items-center gap-4">
            <Input label="Industry (optional)" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" className="max-w-xs" />
            <ToneSelector options={TONE_OPTIONS.experience} value={tone} onChange={setTone} />
          </div>
          <Button onClick={() => optimizeMutation.mutate()} loading={optimizeMutation.isPending}>
            <BarChart3 className="w-4 h-4" />Optimize Experience
          </Button>
        </div>
      </Card>

      {output && output.optimizedEntries?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimized Entries</h2>
          <div className="space-y-6">
            {output.optimizedEntries.map((entry: { company?: string; role?: string; originalDescription?: string; improvements?: string[]; optimizedDescription?: string; keyChanges?: string[] }, i: number) => (
              <div key={i} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="blue">{entry.role}</Badge>
                  <span className="text-sm text-gray-500">at {entry.company}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Original</p>
                    <p className="text-sm text-gray-700">{entry.originalDescription}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-600 mb-1">Optimized</p>
                    <p className="text-sm text-gray-900">{entry.optimizedDescription}</p>
                  </div>
                </div>
                {(entry.keyChanges?.length ?? 0) > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.keyChanges?.map((change: string, j: number) => (
                      <Badge key={j} variant="amber" dot>{change}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <BulletList title="Overall Tips" items={output.overallTips} dotColor="bg-amber-500" />
        </Card>
      )}
    </div>
  );
}
