'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { RESUMES_QUERY, COMPARE_RESUME_LINKEDIN_MUTATION } from '@/lib/graphql';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScoreDisplay } from '@/components/linkedin-optimizer/score-display';
import { ProgressBar } from '@/components/linkedin-optimizer/progress-bar';
import { PriorityActionList } from '@/components/linkedin-optimizer/priority-action-list';
import { PreviousResults } from '@/components/linkedin-optimizer/previous-results';
import { parseCommaSeparated } from '@/lib/linkedin-optimizer/utils';
import { useLinkedinOptimizations } from '@/lib/linkedin-optimizer/hooks';
import { PAGE_CONFIGS } from '@/lib/linkedin-optimizer/config';

const config = PAGE_CONFIGS.resume_comparison;

export default function ResumeComparisonPage() {
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [linkedinSkills, setLinkedinSkills] = useState('');
  const [linkedinHeadline, setLinkedinHeadline] = useState('');
  const [linkedinAbout, setLinkedinAbout] = useState('');
  const [linkedinExperience, setLinkedinExperience] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => {
      const { resumes } = await client.request(RESUMES_QUERY);
      return resumes;
    },
  });

  const { data: comparisons, isLoading } = useLinkedinOptimizations('resume_comparison');

  const compareMutation = useMutation({
    mutationFn: async () => {
      const { compareResumeWithLinkedin } = await client.request(COMPARE_RESUME_LINKEDIN_MUTATION, {
        input: {
          resumeId: selectedResumeId,
          linkedinSkills: linkedinSkills ? parseCommaSeparated(linkedinSkills) : undefined,
          linkedinHeadline: linkedinHeadline || undefined,
          linkedinAbout: linkedinAbout || undefined,
          linkedinExperience: linkedinExperience ? linkedinExperience.split('\n').filter(Boolean) : undefined,
        },
      });
      return compareResumeWithLinkedin;
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
          <Select label="Select Resume" value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} required>
            <option value="">Choose a resume...</option>
            {resumes?.map((r: any) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </Select>
          <Input label="LinkedIn Headline" value={linkedinHeadline} onChange={(e) => setLinkedinHeadline(e.target.value)} placeholder="Your LinkedIn headline" />
          <Textarea label="LinkedIn About" value={linkedinAbout} onChange={(e) => setLinkedinAbout(e.target.value)} rows={3} placeholder="Paste your LinkedIn About section" />
          <Input label="LinkedIn Skills (comma separated)" value={linkedinSkills} onChange={(e) => setLinkedinSkills(e.target.value)} placeholder="e.g. JavaScript, React, AWS" />
          <Textarea label="LinkedIn Experience (one per line)" value={linkedinExperience} onChange={(e) => setLinkedinExperience(e.target.value)} rows={3} placeholder="Paste each experience entry summary on a new line" />
          <Button onClick={() => compareMutation.mutate()} loading={compareMutation.isPending}>
            <Search className="w-4 h-4" />Compare
          </Button>
        </div>
      </Card>

      {output && (
        <Card padding="lg">
          <ScoreDisplay score={output.consistencyScore} label="Consistency" />
          <ProgressBar value={output.consistencyScore} className="mb-6" />
          {output.strengths?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {output.strengths.map((s: string, i: number) => <Badge key={i} variant="emerald" dot>{s}</Badge>)}
              </div>
            </div>
          )}
          {output.discrepancies?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Discrepancies
              </h3>
              <div className="space-y-3">
                {output.discrepancies.map((d: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={d.severity === 'high' ? 'red' : d.severity === 'medium' ? 'amber' : 'blue'}>{d.field}</Badge>
                      <span className="text-xs text-gray-500 capitalize">{d.severity} priority</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">Resume</p>
                        <p className="text-gray-900">{d.resumeValue}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-0.5">LinkedIn</p>
                        <p className="text-gray-900">{d.linkedinValue}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{d.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {output.gaps?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">Gaps Found</h3>
              <div className="space-y-2">
                {output.gaps.map((g: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600 p-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">{g.area}</p>
                      <p className="text-gray-500">{g.description}</p>
                      <p className="text-xs text-blue-600 mt-0.5">{g.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <PriorityActionList items={output.prioritizedActions} showEffort />
        </Card>
      )}

      <PreviousResults
        data={comparisons}
        isLoading={isLoading}
        icon={config.historyIcon}
        iconColor={config.historyIconColor}
        label={config.historyLabel}
        emptyTitle={config.emptyTitle}
        emptyDescription={config.emptyDescription}
        displayField={config.historyDisplayField}
        onSelect={(opt) => setResult(opt)}
      />
    </div>
  );
}
