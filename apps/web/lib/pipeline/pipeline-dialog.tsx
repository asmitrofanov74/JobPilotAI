'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { RUN_APPLICATION_PIPELINE_MUTATION } from '@/lib/graphql';
import { type GqlPipelineResult } from '@/lib/graphql/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import {
  Zap,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  BarChart3,
  CalendarCheck,
  Mic,
} from 'lucide-react';
import Link from 'next/link';

const TONES = ['professional', 'enthusiastic', 'confident', 'concise'];
const INTERVIEW_TYPES = [
  'PHONE',
  'TECHNICAL',
  'BEHAVIORAL',
  'SYSTEM_DESIGN',
  'CODING',
  'ONSITE',
  'PANEL',
  'TAKE_HOME',
];
const LANGUAGES = ['ENGLISH', 'FRENCH'];

const PIPELINE_STEPS = [
  'Importing vacancy',
  'Writing cover letter',
  'Analyzing skill gap',
  'Marking as APPLIED',
  'Scheduling interview',
  'Generating practice questions',
];

type ScrapedJobInput = {
  companyName: string;
  jobTitle: string;
  jobDescription?: string;
  jobUrl?: string;
  location?: string;
  salaryRange?: string;
  source?: string;
  sourceUrl?: string;
  sourceId?: string;
};

type RunPipelineButtonProps = {
  jobId?: string;
  scrapedJob?: ScrapedJobInput;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
};

export function RunPipelineButton({
  jobId,
  scrapedJob,
  label = 'Run Pipeline',
  variant = 'primary',
  size = 'md',
}: RunPipelineButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Zap className="w-4 h-4" />
        {label}
      </Button>
      {open && (
        <PipelineDialog
          jobId={jobId}
          scrapedJob={scrapedJob}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PipelineDialog({
  jobId,
  scrapedJob,
  onClose,
}: {
  jobId?: string;
  scrapedJob?: ScrapedJobInput;
  onClose: () => void;
}) {
  const [tone, setTone] = useState('professional');
  const [interviewType, setInterviewType] = useState('PHONE');
  const [language, setLanguage] = useState('ENGLISH');
  const [questionCount, setQuestionCount] = useState('5');
  const [scheduledAt, setScheduledAt] = useState('');

  const run = useMutation({
    mutationFn: async () => {
      const input: Record<string, unknown> = {
        tone,
        interviewType,
        practiceLanguage: language,
        questionCount: Math.max(3, Math.min(8, Number(questionCount) || 5)),
      };
      if (jobId) input.jobId = jobId;
      if (scrapedJob) input.scrapedJob = scrapedJob;
      if (scheduledAt.trim()) input.scheduledAt = scheduledAt.trim();
      const { runApplicationPipeline } = await client.request(
        RUN_APPLICATION_PIPELINE_MUTATION,
        { input },
      );
      return runApplicationPipeline as GqlPipelineResult;
    },
    onError: () => {
      /* error rendered inline */
    },
  });

  const result = run.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl">
        {result ? (
          <PipelineResultView result={result} onClose={onClose} />
        ) : (
          <div className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Run application pipeline
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {scrapedJob
                    ? `${scrapedJob.jobTitle} @ ${scrapedJob.companyName}`
                    : 'Selected job application'}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={run.isPending}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Imports the vacancy, writes your cover letter, checks skill gaps,
              marks it APPLIED, schedules the interview and generates a practice
              session.
            </div>

            {run.isPending ? (
              <div className="mt-6 space-y-3">
                {PIPELINE_STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <Loader2
                      className={`w-4 h-4 ${i === 0 ? 'animate-spin text-blue-600' : 'text-gray-300'}`}
                    />
                    <span
                      className={`text-sm ${i === 0 ? 'font-medium text-gray-800' : 'text-gray-400'}`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-gray-400 pt-2">
                  This can take a minute or two. Keep this window open.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <Select label="Cover letter tone" value={tone} onChange={(e) => setTone(e.target.value)}>
                  {TONES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
                <Select label="Interview type" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>
                  ))}
                </Select>
                <Select label="Practice language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
                <Input
                  label="Practice questions (3-8)"
                  type="number"
                  min={3}
                  max={8}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                />
                <Input
                  label="Scheduled (optional, YYYY-MM-DDTHH:MM:SS)"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  placeholder="2026-09-20T10:00:00.000Z"
                />

                {run.isError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    Pipeline failed. Please try again.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-1">
                  <Button variant="secondary" onClick={onClose} disabled={run.isPending}>
                    Cancel
                  </Button>
                  <Button onClick={() => run.mutate()} loading={run.isPending}>
                    Run
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineResultView({
  result,
  onClose,
}: {
  result: GqlPipelineResult;
  onClose: () => void;
}) {
  const matchScore = Math.round((result.skillGapReport?.matchScore ?? 0) * 100);

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Pipeline complete
            </h2>
            <p className="text-sm text-gray-500">
              {result.job.jobTitle} @ {result.job.companyName}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
        <span className="text-sm font-medium text-blue-700">
          {result.job.status.replaceAll('_', ' ')}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <Link href="/dashboard/cover-letters">
          <Card hover className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Cover letter ready
              </p>
              <p className="text-xs text-gray-500">
                {result.coverLetter.jobTitle} @ {result.coverLetter.companyName} · {result.coverLetter.tone}
              </p>
            </div>
          </Card>
        </Link>

        {result.skillGapReport && (
          <Link href="/dashboard/skills">
            <Card hover className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Skill gap analysis
                </p>
                <p className="text-xs text-gray-500">
                  Match score: {matchScore}% · {result.skillGapReport.jobTitle}
                </p>
              </div>
            </Card>
          </Link>
        )}

        <Link href="/dashboard/interviews">
          <Card hover className="flex items-center gap-3">
            <CalendarCheck className="w-5 h-5 text-gray-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Interview scheduled
              </p>
              <p className="text-xs text-gray-500">
                {result.interview.type.replaceAll('_', ' ')}
                {result.interview.round ? ` · Round ${result.interview.round}` : ''}
                {result.interview.scheduledAt
                  ? ` · ${new Date(result.interview.scheduledAt).toLocaleString()}`
                  : ''}
              </p>
            </div>
          </Card>
        </Link>

        {result.practice && (
          <Link
            href={
              result.practice.language === 'FRENCH'
                ? '/dashboard/french/interview'
                : '/dashboard/interview-coach'
            }
          >
            <Card hover className="flex items-center gap-3">
              <Mic className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Practice session ready
                </p>
                <p className="text-xs text-gray-500">
                  {result.practice.language === 'FRENCH' ? 'French' : 'English'} · {result.practice.questionCount} questions
                </p>
              </div>
            </Card>
          </Link>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={onClose}>Done</Button>
      </div>
    </div>
  );
}