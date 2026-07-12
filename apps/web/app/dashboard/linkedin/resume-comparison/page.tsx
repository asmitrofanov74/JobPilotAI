'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { RESUMES_QUERY, LINKEDIN_OPTIMIZATIONS_QUERY, COMPARE_RESUME_LINKEDIN_MUTATION } from '@/lib/graphql';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

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

  const { data: comparisons, isLoading } = useQuery({
    queryKey: ['linkedinOptimizations', 'resume_comparison'],
    queryFn: async () => {
      const { linkedinOptimizations } = await client.request(LINKEDIN_OPTIMIZATIONS_QUERY, { type: 'resume_comparison' });
      return linkedinOptimizations;
    },
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      const { compareResumeWithLinkedin } = await client.request(COMPARE_RESUME_LINKEDIN_MUTATION, {
        input: {
          resumeId: selectedResumeId,
          linkedinSkills: linkedinSkills ? linkedinSkills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
          linkedinHeadline: linkedinHeadline || undefined,
          linkedinAbout: linkedinAbout || undefined,
          linkedinExperience: linkedinExperience ? linkedinExperience.split('\n').filter(Boolean) : undefined,
        },
      });
      return compareResumeWithLinkedin;
    },
    onSuccess: (data) => setResult(data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resume vs LinkedIn Comparison</h1>
        <p className="text-gray-500 mt-1">Align your resume with your LinkedIn profile for consistency</p>
      </div>

      <Card padding="lg">
        <div className="space-y-4">
          <Select
            label="Select Resume"
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            required
          >
            <option value="">Choose a resume...</option>
            {resumes?.map((r: any) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
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

      {result && (
        <Card padding="lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Comparison Results</h2>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-blue-600">{result.output.consistencyScore}%</div>
              <div className="text-sm text-gray-500">Consistency</div>
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-3 mb-6">
            <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${result.output.consistencyScore}%` }} />
          </div>

          {result.output.strengths?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.output.strengths.map((s: string, i: number) => (
                  <Badge key={i} variant="emerald" dot>{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {result.output.discrepancies?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Discrepancies
              </h3>
              <div className="space-y-3">
                {result.output.discrepancies.map((d: any, i: number) => (
                  <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={d.severity === 'high' ? 'red' : d.severity === 'medium' ? 'amber' : 'blue'}>
                        {d.field}
                      </Badge>
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

          {result.output.gaps?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-amber-700 mb-2">Gaps Found</h3>
              <div className="space-y-2">
                {result.output.gaps.map((g: any, i: number) => (
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

          {result.output.prioritizedActions?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Plan</h3>
              <div className="space-y-2">
                {result.output.prioritizedActions.map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Badge variant={a.impact === 'high' ? 'red' : a.impact === 'medium' ? 'amber' : 'blue'}>
                      {a.impact}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.action}</p>
                      <p className="text-xs text-gray-500">Effort: {a.effort}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Comparisons</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : comparisons?.length === 0 ? (
          <EmptyState icon={Search} title="No comparisons yet" description="Compare your first resume with LinkedIn" />
        ) : (
          <div className="space-y-3">
            {comparisons?.map((opt: any) => (
              <Card key={opt.id} hover padding="md" className="cursor-pointer" onClick={() => setResult(opt)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-cyan-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Consistency: {opt.outputData?.consistencyScore || 'N/A'}%</p>
                      <p className="text-xs text-gray-400">{new Date(opt.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="cyan">{opt.outputData?.consistencyScore || 0}%</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
