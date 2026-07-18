'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { COVER_LETTERS_QUERY, GENERATE_COVER_LETTER_MUTATION, DELETE_COVER_LETTER_MUTATION } from '@/lib/graphql';
import { PenLine, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { TONES } from '@/lib/constants';
import { capitalize, formatDate } from '@/lib/utils/format';
import { type GqlCoverLetter } from '@/lib/graphql/types';

export default function CoverLettersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState<string>('professional');
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const { data: coverLetters, isLoading } = useQuery({
    queryKey: ['coverLetters'],
    queryFn: async () => {
      const { coverLetters } = await client.request(COVER_LETTERS_QUERY);
      return coverLetters;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { generateCoverLetter } = await client.request(GENERATE_COVER_LETTER_MUTATION, {
        input: { jobTitle, companyName, jobDescription, tone },
      });
      return generateCoverLetter;
    },
    onSuccess: (data) => {
      setGeneratedContent(data.content);
      queryClient.invalidateQueries({ queryKey: ['coverLetters'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_COVER_LETTER_MUTATION, { id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coverLetters'] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    generateMutation.mutate();
  }

  function resetForm() {
    setShowForm(false);
    setJobTitle('');
    setCompanyName('');
    setJobDescription('');
    setTone('professional');
    setGeneratedContent(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Cover Letters" description="Generate and manage cover letters">
        <Button onClick={() => setShowForm(!showForm)}><Sparkles className="w-4 h-4" />Generate New</Button>
      </PageHeader>

      {showForm && (
        <Card padding="lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Cover Letter</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} required />
              <Input label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <Textarea label="Job Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={4} required />
            <Select label="Tone" value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => (
                <option key={t} value={t}>{capitalize(t)}</option>
              ))}
            </Select>
            <div className="flex gap-3">
              <Button type="submit" loading={generateMutation.isPending}><Sparkles className="w-4 h-4" />Generate</Button>
              <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
            </div>
          </form>

          {generatedContent && (
            <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Generated Cover Letter</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{generatedContent}</p>
            </div>
          )}
        </Card>
      )}

      {isLoading ? (
        <LoadingState padding="md" />
      ) : coverLetters?.length === 0 ? (
        <EmptyState icon={PenLine} title="No cover letters yet" description="Generate your first cover letter" action={{ label: 'Generate Cover Letter', onClick: () => setShowForm(true) }} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {coverLetters?.map((cl: GqlCoverLetter) => (
            <Card key={cl.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                    <PenLine className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{cl.jobTitle}</h3>
                    <p className="text-sm text-gray-500">{cl.companyName}</p>
                  </div>
                </div>
                <button onClick={() => deleteMutation.mutate(cl.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{cl.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="capitalize">{cl.tone}</span>
                <span>{formatDate(cl.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
