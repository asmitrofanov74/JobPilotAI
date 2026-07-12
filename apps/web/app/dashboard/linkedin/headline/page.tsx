'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { LINKEDIN_OPTIMIZATIONS_QUERY, GENERATE_LINKEDIN_HEADLINES_MUTATION } from '@/lib/graphql';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function HeadlinePage() {
  const [targetRole, setTargetRole] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [skills, setSkills] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currentHeadline, setCurrentHeadline] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState<any>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: optimizations, isLoading } = useQuery({
    queryKey: ['linkedinOptimizations', 'headline'],
    queryFn: async () => {
      const { linkedinOptimizations } = await client.request(LINKEDIN_OPTIMIZATIONS_QUERY, { type: 'headline' });
      return linkedinOptimizations;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateLinkedinHeadlines } = await client.request(GENERATE_LINKEDIN_HEADLINES_MUTATION, {
        input: {
          targetRole,
          currentRole,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          industry,
          experienceLevel: experienceLevel || undefined,
          currentHeadline: currentHeadline || undefined,
          tone,
        },
      });
      return generateLinkedinHeadlines;
    },
    onSuccess: (data) => setResult(data),
  });

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Headline Generator</h1>
        <p className="text-gray-500 mt-1">Create compelling, keyword-rich headlines that attract recruiters</p>
      </div>

      <Card padding="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Target Role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Software Engineer" required />
            <Input label="Current Role" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} placeholder="e.g. Software Engineer II" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" required />
            <Input label="Experience Level" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="e.g. Senior, Lead" />
          </div>
          <Input label="Current Headline (optional)" value={currentHeadline} onChange={(e) => setCurrentHeadline(e.target.value)} placeholder="Your current LinkedIn headline" />
          <Textarea label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} rows={2} placeholder="e.g. React, TypeScript, AWS, System Design" required />
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Tone:</label>
            {['professional', 'innovative', 'confident', 'friendly'].map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  tone === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <Button onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
            <Sparkles className="w-4 h-4" />Generate Headlines
          </Button>
        </div>
      </Card>

      {result?.output?.headlines?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Headlines</h2>
          {result.output.bestHeadline && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="green" className="mb-2">Recommended</Badge>
                  <p className="text-base font-medium text-gray-900">{result.output.bestHeadline}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.output.bestHeadline, -1)}>
                  {copiedIndex === -1 ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {result.output.headlines.map((h: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{h.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{h.rationale}</p>
                    {h.targetKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {h.targetKeywords.map((kw: string, j: number) => (
                          <Badge key={j} variant="blue" dot>{kw}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(h.text, i)}>
                    {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {result.output.seoTips?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">SEO Tips</h3>
              <ul className="space-y-1.5">
                {result.output.seoTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Generations</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : optimizations?.length === 0 ? (
          <EmptyState icon={Sparkles} title="No headlines yet" description="Generate your first set of headlines" />
        ) : (
          <div className="space-y-3">
            {optimizations?.map((opt: any) => (
              <Card key={opt.id} hover padding="md" className="cursor-pointer" onClick={() => setResult(opt)}>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{opt.outputData?.bestHeadline || 'View headlines'}</p>
                    <p className="text-xs text-gray-400">{new Date(opt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
