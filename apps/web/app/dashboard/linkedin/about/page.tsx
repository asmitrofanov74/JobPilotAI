'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { LINKEDIN_OPTIMIZATIONS_QUERY, GENERATE_LINKEDIN_ABOUT_MUTATION } from '@/lib/graphql';
import { FileText, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';

export default function AboutPage() {
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [keyAchievements, setKeyAchievements] = useState('');
  const [skills, setSkills] = useState('');
  const [currentAbout, setCurrentAbout] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<number | null>(null);

  const { data: optimizations, isLoading } = useQuery({
    queryKey: ['linkedinOptimizations', 'about'],
    queryFn: async () => {
      const { linkedinOptimizations } = await client.request(LINKEDIN_OPTIMIZATIONS_QUERY, { type: 'about' });
      return linkedinOptimizations;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateLinkedinAbout } = await client.request(GENERATE_LINKEDIN_ABOUT_MUTATION, {
        input: {
          targetRole,
          industry,
          keyAchievements: keyAchievements.split(',').map((s) => s.trim()).filter(Boolean),
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          currentAbout: currentAbout || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          tone,
        },
      });
      return generateLinkedinAbout;
    },
    onSuccess: (data) => setResult(data),
  });

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(index);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">About Section Generator</h1>
        <p className="text-gray-500 mt-1">Write compelling professional stories that showcase your expertise</p>
      </div>

      <Card padding="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Target Role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Product Manager" required />
            <Input label="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Fintech" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Years of Experience" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} type="number" placeholder="e.g. 8" />
            <Input label="Current About (optional)" value={currentAbout} onChange={(e) => setCurrentAbout(e.target.value)} placeholder="Paste your current About section" />
          </div>
          <Textarea label="Key Achievements (comma separated)" value={keyAchievements} onChange={(e) => setKeyAchievements(e.target.value)} rows={2} placeholder="e.g. Led 10x revenue growth, Scaled team to 50 engineers" required />
          <Textarea label="Skills (comma separated)" value={skills} onChange={(e) => setSkills(e.target.value)} rows={2} placeholder="e.g. Product Strategy, Team Leadership, Data Analysis" required />
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Tone:</label>
            {['professional', 'storytelling', 'results-driven', 'conversational'].map((t) => (
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
          <Button onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
            <FileText className="w-4 h-4" />Generate About Section
          </Button>
        </div>
      </Card>

      {result?.output?.aboutSections?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated About Sections</h2>
          {result.output.bestSection && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="green">Recommended</Badge>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(result.output.bestSection, -1)}>
                  {copiedSection === -1 ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{result.output.bestSection}</p>
            </div>
          )}
          <div className="space-y-4">
            {result.output.aboutSections.map((section: any, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="blue">{section.style || section.targetAudience || `Style ${i + 1}`}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(section.content, i)}>
                    {copiedSection === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </div>
          {result.output.writingTips?.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Writing Tips</h3>
              <ul className="space-y-1.5">
                {result.output.writingTips.map((tip: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
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
          <EmptyState icon={FileText} title="No about sections yet" description="Generate your first About section" />
        ) : (
          <div className="space-y-3">
            {optimizations?.map((opt: any) => (
              <Card key={opt.id} hover padding="md" className="cursor-pointer" onClick={() => setResult(opt)}>
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate max-w-md">{opt.outputData?.bestSection?.slice(0, 80)}...</p>
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
