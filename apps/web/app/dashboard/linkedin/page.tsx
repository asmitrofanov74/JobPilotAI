'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { ANALYZE_LINKEDIN_PROFILE_MUTATION } from '@/lib/graphql';
import { UserCheck, Sparkles, FileText, BarChart3, Search, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScoreDisplay } from '@/components/linkedin-optimizer/score-display';
import { ProgressBar } from '@/components/linkedin-optimizer/progress-bar';
import { BulletList } from '@/components/linkedin-optimizer/bullet-list';
import { PriorityActionList } from '@/components/linkedin-optimizer/priority-action-list';
import { PreviousResults } from '@/components/linkedin-optimizer/previous-results';
import { parseCommaSeparated } from '@/lib/linkedin-optimizer/utils';
import { useLinkedinOptimizations } from '@/lib/linkedin-optimizer/hooks';
import { PAGE_CONFIGS } from '@/lib/linkedin-optimizer/config';

const TOOLS = [
  { label: 'Headline Generator', href: '/dashboard/linkedin/headline', icon: Sparkles, desc: 'Create keyword-rich headlines that attract recruiters' },
  { label: 'About Section', href: '/dashboard/linkedin/about', icon: FileText, desc: 'Write compelling professional stories' },
  { label: 'Experience Optimizer', href: '/dashboard/linkedin/experience', icon: BarChart3, desc: 'Optimize work descriptions with impact metrics' },
  { label: 'Resume Comparison', href: '/dashboard/linkedin/resume-comparison', icon: Search, desc: 'Align your resume with your LinkedIn profile' },
  { label: 'Visibility Analyzer', href: '/dashboard/linkedin/visibility', icon: UserCheck, desc: 'Improve recruiter search discoverability' },
];

const config = PAGE_CONFIGS.profile_analysis;

export default function LinkedinProfilePage() {
  const [showForm, setShowForm] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [about, setAbout] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [skills, setSkills] = useState('');
  const [result, setResult] = useState<any>(null);

  const { data: optimizations, isLoading } = useLinkedinOptimizations('profile_analysis');

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const { analyzeLinkedinProfile } = await client.request(ANALYZE_LINKEDIN_PROFILE_MUTATION, {
        input: {
          profileUrl: profileUrl || undefined,
          headline: headline || undefined,
          about: about || undefined,
          currentRole: currentRole || undefined,
          currentCompany: currentCompany || undefined,
          industry: industry || undefined,
          location: location || undefined,
          experienceLevel: experienceLevel || undefined,
          skills: skills ? parseCommaSeparated(skills) : undefined,
        },
      });
      return analyzeLinkedinProfile;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card padding="md" className="border-blue-100 bg-blue-50/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Profile Analyzer</h3>
              <p className="text-xs text-gray-500 mt-1">Score your profile & get recommendations</p>
            </div>
            <Badge variant="blue" className="ml-auto">Active</Badge>
          </div>
        </Card>
        {TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card padding="md" hover className="group cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
                  <tool.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">{tool.label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{tool.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0 mt-1" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Profile Analysis</h2>
          <Button onClick={() => setShowForm(!showForm)} variant="secondary">
            <UserCheck className="w-4 h-4" />{showForm ? 'Hide Form' : 'New Analysis'}
          </Button>
        </div>
        {showForm && (
          <div className="space-y-4">
            <Input label="LinkedIn Profile URL" value={profileUrl} onChange={(e) => setProfileUrl(e.target.value)} placeholder="https://linkedin.com/in/username" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Current Role" value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} />
              <Input label="Current Company" value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
              <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <Input label="Headline" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Current LinkedIn headline" />
            <Textarea label="About Section" value={about} onChange={(e) => setAbout(e.target.value)} rows={3} placeholder="Paste your current About section" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Experience Level" value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)} placeholder="e.g. Senior, Lead, Entry" />
              <Input label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. React, TypeScript, AWS" />
            </div>
            <Button onClick={() => analyzeMutation.mutate()} loading={analyzeMutation.isPending}>
              <UserCheck className="w-4 h-4" />Analyze Profile
            </Button>
          </div>
        )}
      </Card>

      {output && (
        <Card padding="lg">
          <ScoreDisplay score={output.overallScore} label="Overall Score" />
          <ProgressBar value={output.overallScore} className="mb-6" />
          {output.sectionScores && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {Object.entries(output.sectionScores).map(([section, score]: [string, any]) => (
                <div key={section} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-700">{score}%</div>
                  <div className="text-xs text-gray-500 capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</div>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BulletList title="Strengths" items={output.strengths} dotColor="bg-emerald-500" titleClassName="text-emerald-700" />
            <BulletList title="Areas to Improve" items={output.weaknesses} dotColor="bg-red-500" titleClassName="text-red-700" />
          </div>
          {output.recommendations?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Recommendations</h3>
              <div className="space-y-3">
                {output.recommendations.map((r: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Badge variant={r.priority === 'high' ? 'red' : r.priority === 'medium' ? 'amber' : 'blue'}>{r.priority}</Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {output.keywordAnalysis && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Top Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {output.keywordAnalysis.topKeywords?.map((k: string, i: number) => <Badge key={i} variant="blue">{k}</Badge>)}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-700 mb-2">Missing Keywords</h3>
                <div className="flex flex-wrap gap-1.5">
                  {output.keywordAnalysis.missingKeywords?.map((k: string, i: number) => <Badge key={i} variant="red">{k}</Badge>)}
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-700">{output.keywordAnalysis.keywordDensity || 0}%</div>
                <div className="text-xs text-gray-500">Keyword Density</div>
              </div>
            </div>
          )}
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
        onSelect={(opt) => setResult(opt)}
      />
    </div>
  );
}
