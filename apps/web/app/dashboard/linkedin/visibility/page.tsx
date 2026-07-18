'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { ANALYZE_LINKEDIN_VISIBILITY_MUTATION } from '@/lib/graphql';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScoreDisplay } from '@/components/linkedin-optimizer/score-display';
import { ProgressBar } from '@/components/ui/progress-bar';
import { BulletList } from '@/components/linkedin-optimizer/bullet-list';
import { PriorityActionList } from '@/components/linkedin-optimizer/priority-action-list';
import { PreviousResults } from '@/components/linkedin-optimizer/previous-results';
import { parseCommaSeparated } from '@/lib/linkedin-optimizer/utils';
import { useLinkedinOptimizations } from '@/lib/linkedin-optimizer/hooks';
import { PAGE_CONFIGS } from '@/lib/linkedin-optimizer/config';
import { type GqlLinkedinResult } from '@/lib/graphql/types';

const config = PAGE_CONFIGS.visibility_analysis;

export default function VisibilityPage() {
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState('');
  const [targetRoles, setTargetRoles] = useState('');
  const [targetLocations, setTargetLocations] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [result, setResult] = useState<GqlLinkedinResult | null>(null);

  const { data: analyses, isLoading } = useLinkedinOptimizations('visibility_analysis');

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { analyzeLinkedinVisibility } = await client.request(ANALYZE_LINKEDIN_VISIBILITY_MUTATION, {
        input: {
          headline, about,
          skills: parseCommaSeparated(skills),
          targetRoles: parseCommaSeparated(targetRoles),
          targetLocations: targetLocations ? parseCommaSeparated(targetLocations) : undefined,
          industry: industry || undefined,
          experienceLevel: experienceLevel || undefined,
        },
      });
      return analyzeLinkedinVisibility;
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
          <Input label="LinkedIn Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Your current headline" required />
          <Textarea label="About Section" value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="Paste your About section" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, AWS" required />
            <Input label="Target Roles (comma separated)" value={targetRoles} onChange={(e) => setTargetRoles(e.target.value)} placeholder="e.g. Senior Engineer, Tech Lead" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Target Locations (optional)" value={targetLocations} onChange={(e) => setTargetLocations(e.target.value)} placeholder="e.g. Toronto, Remote" />
            <Input label="Industry (optional)" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Technology" />
            <Input label="Experience Level (optional)" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="e.g. Senior" />
          </div>
          <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
            <Eye className="w-4 h-4" />Analyze Visibility
          </Button>
        </div>
      </Card>

      {output && (
        <Card padding="lg">
          <ScoreDisplay score={output.visibilityScore} label="Visibility Score" />
          <ProgressBar value={output.visibilityScore} className="mb-6" />
          {output.keywordCoverage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 mb-1">Present Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {output.keywordCoverage.present?.map((k: string, i: number) => <Badge key={i} variant="emerald">{k}</Badge>)}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Missing Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {output.keywordCoverage.missing?.map((k: string, i: number) => <Badge key={i} variant="red">{k}</Badge>)}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <p className="text-xs font-semibold text-blue-600 mb-1">Keyword Density</p>
                <p className="text-2xl font-bold text-blue-700">{output.keywordCoverage.density || 0}%</p>
              </div>
            </div>
          )}
          {output.recruiterAppeal && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recruiter Appeal</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl font-bold text-purple-600">{output.recruiterAppeal.score}%</div>
                <div className="flex-1 max-w-xs">
                  <ProgressBar value={output.recruiterAppeal.score} color="bg-purple-600" height="md" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BulletList title="Strengths" items={output.recruiterAppeal.strengths} dotColor="bg-emerald-500" titleClassName="text-emerald-600" />
                <BulletList title="Improvements" items={output.recruiterAppeal.improvements} dotColor="bg-amber-500" titleClassName="text-amber-600" />
              </div>
            </div>
          )}
          {output.competitorComparison?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Industry Comparison</h3>
              <div className="space-y-2">
                {output.competitorComparison.map((c: { aspect: string; yourProfile: string; industryStandard: string }, i: number) => (
                  <div key={i} className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium text-gray-900">{c.aspect}</div>
                    <div className="text-gray-600">{c.yourProfile}</div>
                    <div className="text-gray-500">{c.industryStandard}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <PriorityActionList items={output.actionPlan} showTimeframe />
        </Card>
      )}

      <PreviousResults
        data={analyses}
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
