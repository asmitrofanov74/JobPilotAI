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
  const [result, setResult] = useState<any>(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const { optimizeLinkedinExperience } = await client.request(OPTIMIZE_LINKEDIN_EXPERIENCE_MUTATION, {
        input: {
          entries: entries.map((e) => ({
            company: e.company,
            role: e.role,
            description: e.description,
            duration: e.duration || undefined,
            achievements: e.achievements ? e.achievements.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          })),
          industry: industry || undefined,
          tone,
        },
      });
      return optimizeLinkedinExperience;
    },
    onSuccess: (data) => setResult(data),
  });

  const addEntry = () => {
    setEntries([...entries, { company: '', role: '', description: '', duration: '', achievements: '' }]);
  };

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Experience Optimizer</h1>
        <p className="text-gray-500 mt-1">Rewrite work experience with strong action verbs and quantified achievements</p>
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
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tone:</label>
              {['professional', 'impact-driven', 'concise'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    tone === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {t.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={() => optimizeMutation.mutate()} loading={optimizeMutation.isPending}>
            <BarChart3 className="w-4 h-4" />Optimize Experience
          </Button>
        </div>
      </Card>

      {result?.output?.optimizedEntries?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Optimized Entries</h2>
          <div className="space-y-6">
            {result.output.optimizedEntries.map((entry: any, i: number) => (
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
                {entry.keyChanges?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {entry.keyChanges.map((change: string, j: number) => (
                      <Badge key={j} variant="amber" dot>{change}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {result.output.overallTips?.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall Tips</h3>
              <ul className="space-y-1.5">
                {result.output.overallTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
