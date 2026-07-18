'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { GENERATE_LINKEDIN_HEADLINES_MUTATION } from '@/lib/graphql';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ToneSelector } from '@/components/linkedin-optimizer/tone-selector';
import { CopyButton } from '@/components/linkedin-optimizer/copy-button';
import { BulletList } from '@/components/linkedin-optimizer/bullet-list';
import { PreviousResults } from '@/components/linkedin-optimizer/previous-results';
import { parseCommaSeparated } from '@/lib/linkedin-optimizer/utils';
import { useCopyToClipboard, useLinkedinOptimizations } from '@/lib/linkedin-optimizer/hooks';
import { PAGE_CONFIGS, TONE_OPTIONS } from '@/lib/linkedin-optimizer/config';
import { type GqlLinkedinResult } from '@/lib/graphql/types';

const config = PAGE_CONFIGS.headline;

export default function HeadlinePage() {
  const [targetRole, setTargetRole] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [skills, setSkills] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [currentHeadline, setCurrentHeadline] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState<GqlLinkedinResult | null>(null);
  const { copiedIndex, copyToClipboard } = useCopyToClipboard();

  const { data: optimizations, isLoading } = useLinkedinOptimizations('headline');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateLinkedinHeadlines } = await client.request(GENERATE_LINKEDIN_HEADLINES_MUTATION, {
        input: { targetRole, currentRole, skills: parseCommaSeparated(skills), industry, experienceLevel: experienceLevel || undefined, currentHeadline: currentHeadline || undefined, tone },
      });
      return generateLinkedinHeadlines;
    },
    onSuccess: (data) => setResult(data),
  });

  const output = result?.output;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{config.title}</h1>
        <p className="text-gray-500 mt-1">{config.description}</p>
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
          <ToneSelector options={TONE_OPTIONS.headline} value={tone} onChange={setTone} />
          <Button onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
            Generate Headlines
          </Button>
        </div>
      </Card>

      {output && output.headlines?.length > 0 && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Generated Headlines</h2>
          </div>
          {output.bestHeadline && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="green" className="mb-2">Recommended</Badge>
                  <p className="text-base font-medium text-gray-900">{output.bestHeadline}</p>
                </div>
                <CopyButton text={output.bestHeadline} index={-1} copiedIndex={copiedIndex} onCopy={copyToClipboard} />
              </div>
            </div>
          )}
          <div className="space-y-3">
            {output.headlines.map((h: { text: string; rationale?: string; targetKeywords?: string[] }, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{h.text}</p>
                    <p className="text-xs text-gray-500 mt-1">{h.rationale}</p>
                    {(h.targetKeywords?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {h.targetKeywords?.map((kw: string, j: number) => <Badge key={j} variant="blue" dot>{kw}</Badge>)}
                      </div>
                    )}
                  </div>
                  <CopyButton text={h.text} index={i} copiedIndex={copiedIndex} onCopy={copyToClipboard} />
                </div>
              </div>
            ))}
          </div>
          <BulletList title="SEO Tips" items={output.seoTips} dotColor="bg-blue-500" titleClassName="text-gray-700" />
        </Card>
      )}

      <PreviousResults
        data={optimizations}
        isLoading={isLoading}
        icon={config.historyIcon}
        iconColor={config.historyIconColor}
        label={config.historyLabel}
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
        displayField={config.historyDisplayField}
        onSelect={(opt) => setResult({ optimization: opt, output: (opt.outputData as Record<string, any>) || {} })}
      />
    </div>
  );
}
