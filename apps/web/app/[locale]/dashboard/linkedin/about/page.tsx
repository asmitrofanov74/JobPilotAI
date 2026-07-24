'use client';

import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { GENERATE_LINKEDIN_ABOUT_MUTATION } from '@/lib/graphql';
import { useState } from 'react';
import { FileText } from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { TONE_OPTIONS } from '@/lib/linkedin-optimizer/config';
import { type GqlLinkedinResult } from '@/lib/graphql/types';

export default function AboutPage() {
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [keyAchievements, setKeyAchievements] = useState('');
  const [skills, setSkills] = useState('');
  const [currentAbout, setCurrentAbout] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [tone, setTone] = useState('professional');
  const [result, setResult] = useState<GqlLinkedinResult | null>(null);
  const { copiedIndex, copyToClipboard } = useCopyToClipboard();
  const t = useTranslations();

  const { data: optimizations, isLoading } = useLinkedinOptimizations('about');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateLinkedinAbout } = await client.request(GENERATE_LINKEDIN_ABOUT_MUTATION, {
        input: {
          targetRole, industry,
          keyAchievements: parseCommaSeparated(keyAchievements),
          skills: parseCommaSeparated(skills),
          currentAbout: currentAbout || undefined,
          experienceYears: experienceYears ? parseInt(experienceYears) : undefined,
          tone,
        },
      });
      return generateLinkedinAbout;
    },
    onSuccess: (data) => setResult(data),
  });

  const output = result?.output;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('About Section')}</h1>
        <p className="text-gray-500 mt-1">{t('Optimize your LinkedIn profile with AI-powered analysis')}</p>
      </div>

      <Card padding="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('Current Role')} value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder={t('eg Senior Product Manager')} required />
            <Input label={t('Industry')} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder={t('eg Fintech')} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label={t('Years of Experience')} value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)} type="number" placeholder={t('eg 8')} />
            <Input label={t('Current About (optional)')} value={currentAbout} onChange={(e) => setCurrentAbout(e.target.value)} placeholder={t('Paste your current About section')} />
          </div>
          <Textarea label={t('Key Achievements (comma separated)')} value={keyAchievements} onChange={(e) => setKeyAchievements(e.target.value)} rows={2} placeholder={t('eg Led 10x revenue growth, Scaled team to 50 engineers')} required />
          <Textarea label={t('Skills (comma separated)')} value={skills} onChange={(e) => setSkills(e.target.value)} rows={2} placeholder={t('eg Product Strategy, Team Leadership, Data Analysis')} required />
          <ToneSelector options={TONE_OPTIONS.about} value={tone} onChange={setTone} />
          <Button onClick={() => generateMutation.mutate()} loading={generateMutation.isPending}>
            {t('Generate About Section')}
          </Button>
        </div>
      </Card>

      {output && output.aboutSections?.length > 0 && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('Generated About Sections')}</h2>
          {output.bestSection && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg mb-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="green">{t('Recommended')}</Badge>
                <CopyButton text={output.bestSection} index={-1} copiedIndex={copiedIndex} onCopy={copyToClipboard} />
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{output.bestSection}</p>
            </div>
          )}
          <div className="space-y-4">
            {output.aboutSections.map((section: { style?: string; targetAudience?: string; content: string }, i: number) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="blue">{section.style || section.targetAudience || `Style ${i + 1}`}</Badge>
                  <CopyButton text={section.content} index={i} copiedIndex={copiedIndex} onCopy={copyToClipboard} />
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
          </div>
          <BulletList title={t('Writing Tips')} items={output.writingTips} dotColor="bg-purple-500" titleClassName="text-gray-700" />
        </Card>
      )}

      <PreviousResults
        data={optimizations}
        isLoading={isLoading}
        icon={FileText}
        iconColor="text-indigo-500"
        label={t('Previous Generations')}
        emptyTitle={t('No about sections yet')}
        emptyDescription={t('Generate your first About section')}
        displayField="bestSection"
        onSelect={(opt) => setResult({ optimization: opt, output: (opt.outputData as Record<string, any>) || {} })}
      />
    </div>
  );
}
