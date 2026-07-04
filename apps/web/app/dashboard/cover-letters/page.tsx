'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { COVER_LETTERS_QUERY, GENERATE_COVER_LETTER_MUTATION, DELETE_COVER_LETTER_MUTATION } from '@/lib/graphql';
import { PenLine, Sparkles, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';

const tones = ['professional', 'creative', 'enthusiastic'] as const;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cover Letters</h1>
          <p className="text-gray-500 mt-1">Generate and manage cover letters</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Generate New
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate Cover Letter</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {tones.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {generatedContent && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Generated Cover Letter</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{generatedContent}</p>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : coverLetters?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <PenLine className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No cover letters yet</h3>
          <p className="text-gray-500 mb-4">Generate your first cover letter</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Sparkles className="w-4 h-4" />
            Generate Cover Letter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coverLetters?.map((cl: any) => (
            <div key={cl.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                    <PenLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{cl.jobTitle}</h3>
                    <p className="text-sm text-gray-500">{cl.companyName}</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(cl.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{cl.content}</p>
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="capitalize">{cl.tone}</span>
                <span>{new Date(cl.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
