'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { LINKEDIN_OPTIMIZATIONS_QUERY, ANALYZE_LINKEDIN_VISIBILITY_MUTATION } from '@/lib/graphql';
import { UserCheck, Eye } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function VisibilityPage() {
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [skills, setSkills] = useState('');
  const [targetRoles, setTargetRoles] = useState('');
  const [targetLocations, setTargetLocations] = useState('');
  const [industry, setIndustry] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ['linkedinOptimizations', 'visibility_analysis'],
    queryFn: async () => {
      const { linkedinOptimizations } = await client.request(LINKEDIN_OPTIMIZATIONS_QUERY, { type: 'visibility_analysis' });
      return linkedinOptimizations;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { analyzeLinkedinVisibility } = await client.request(ANALYZE_LINKEDIN_VISIBILITY_MUTATION, {
        input: {
          headline,
          about,
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          targetRoles: targetRoles.split(',').map((r) => r.trim()).filter(Boolean),
          targetLocations: targetLocations ? targetLocations.split(',').map((l) => l.trim()).filter(Boolean) : undefined,
          industry: industry || undefined,
          experienceLevel: experienceLevel || undefined,
        },
      });
      return analyzeLinkedinVisibility;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruiter Visibility Analyzer</h1>
        <p className="text-gray-500 mt-1">Improve your discoverability in recruiter searches</p>
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

      {result && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Visibility Analysis</h2>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-blue-600">{result.output.visibilityScore}%</div>
              <div className="text-sm text-gray-500">Visibility Score</div>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${result.output.visibilityScore}%` }} />
          </div>

          {result.output.keywordCoverage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 mb-1">Present Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {result.output.keywordCoverage.present?.map((k: string, i: number) => (
                    <Badge key={i} variant="emerald">{k}</Badge>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs font-semibold text-red-600 mb-1">Missing Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {result.output.keywordCoverage.missing?.map((k: string, i: number) => (
                    <Badge key={i} variant="red">{k}</Badge>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-center">
                <p className="text-xs font-semibold text-blue-600 mb-1">Keyword Density</p>
                <p className="text-2xl font-bold text-blue-700">{result.output.keywordCoverage.density || 0}%</p>
              </div>
            </div>
          )}

          {result.output.recruiterAppeal && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recruiter Appeal</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl font-bold text-purple-600">{result.output.recruiterAppeal.score}%</div>
                <div className="flex-1 max-w-xs">
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${result.output.recruiterAppeal.score}%` }} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 mb-1">Strengths</p>
                  <ul className="space-y-1">
                    {result.output.recruiterAppeal.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />{s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-600 mb-1">Improvements</p>
                  <ul className="space-y-1">
                    {result.output.recruiterAppeal.improvements?.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />{imp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {result.output.competitorComparison?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Industry Comparison</h3>
              <div className="space-y-2">
                {result.output.competitorComparison.map((c: any, i: number) => (
                  <div key={i} className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="font-medium text-gray-900">{c.aspect}</div>
                    <div className="text-gray-600">{c.yourProfile}</div>
                    <div className="text-gray-500">{c.industryStandard}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.output.actionPlan?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Plan</h3>
              <div className="space-y-2">
                {result.output.actionPlan.map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <Badge variant={a.priority === 'high' ? 'red' : a.priority === 'medium' ? 'amber' : 'blue'}>
                      {a.priority}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.expectedImpact}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Timeframe: {a.timeframe}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Analyses</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : analyses?.length === 0 ? (
          <EmptyState icon={UserCheck} title="No analyses yet" description="Run your first visibility analysis" />
        ) : (
          <div className="space-y-3">
            {analyses?.map((opt: any) => (
              <Card key={opt.id} hover padding="md" className="cursor-pointer" onClick={() => setResult(opt)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Eye className="w-4 h-4 text-violet-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Visibility: {opt.outputData?.visibilityScore || 'N/A'}%</p>
                      <p className="text-xs text-gray-400">{new Date(opt.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="violet">{opt.outputData?.visibilityScore || 0}%</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
