'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { SKILL_GAP_REPORTS_QUERY, ANALYZE_SKILL_GAP_MUTATION } from '@/lib/graphql';
import { TrendingUp, Zap, Target } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function SkillsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userSkills, setUserSkills] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['skillGapReports'],
    queryFn: async () => {
      const { skillGapReports } = await client.request(SKILL_GAP_REPORTS_QUERY);
      return skillGapReports;
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { analyzeSkillGap } = await client.request(ANALYZE_SKILL_GAP_MUTATION, {
        input: {
          jobTitle, companyName, jobDescription,
          userSkills: userSkills.split(',').map((s) => s.trim()).filter(Boolean),
        },
      });
      return analyzeSkillGap;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['skillGapReports'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h1>
        <p className="text-gray-500 mt-1">Compare your skills against job requirements</p>
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Analyze a New Job</h2>
          <Button onClick={() => setShowForm(!showForm)} variant="secondary">
            <Zap className="w-4 h-4" />{showForm ? 'Hide Form' : 'New Analysis'}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <Textarea label="Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} required />
            <Textarea label="Your Skills (comma separated)" value={userSkills} onChange={(e) => setUserSkills(e.target.value)} rows={2} placeholder="e.g. JavaScript, React, Node.js, Python" required />
            <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
              <Target className="w-4 h-4" />Analyze Skills
            </Button>
          </div>
        )}
      </Card>

      {result && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl font-bold text-blue-600">{result.matchScore}%</div>
              <div className="text-sm text-gray-500">Match Score</div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${result.matchScore}%` }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.requiredSkills?.map((skill: string, i: number) => (
                  <span key={i} className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    result.missingSkills?.includes(skill)
                      ? 'bg-red-50 text-red-700 border border-red-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {skill}
                    {result.missingSkills?.includes(skill) && ' (missing)'}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Skills</h3>
              <div className="flex flex-wrap gap-2">
                {userSkills.split(',').map((skill, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {result.recommendations?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
              <ul className="space-y-2">
                {result.recommendations?.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Reports</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : reports?.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No reports yet" description="Run your first skill gap analysis" />
        ) : (
          <div className="space-y-3">
            {reports?.map((report: any) => (
              <Card key={report.id} hover padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.jobTitle}</h3>
                    <p className="text-sm text-gray-500">{report.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-blue-600">{report.matchScore}%</div>
                    <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${report.matchScore}%` }} />
                </div>
                {report.missingSkills?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {report.missingSkills.map((s: string, i: number) => (
                      <Badge key={i} variant="red">{s}</Badge>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
