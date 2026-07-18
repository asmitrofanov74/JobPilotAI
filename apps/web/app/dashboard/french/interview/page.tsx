'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_INTERVIEWS_QUERY,
  FRENCH_INTERVIEW_QUERY,
  GENERATE_FRENCH_INTERVIEW_QUESTIONS_MUTATION,
  EVALUATE_FRENCH_INTERVIEW_ANSWER_MUTATION,
} from '@/lib/graphql';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Brain, ArrowLeft, BarChart3, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GqlFrenchInterview, GqlInterviewQuestion, GqlInterviewAnswer, GqlInterviewEvaluation, GqlFrenchCorrection } from '@/lib/graphql/types';

const SCENARIOS = [
  { value: 'FRONTEND_DEVELOPER', label: 'Frontend Developer', icon: '🖥️', desc: 'React, CSS, performance web' },
  { value: 'FULL_STACK_DEVELOPER', label: 'Full Stack Developer', icon: '🔄', desc: 'API, bases de données, architecture' },
  { value: 'TEAM_LEAD', label: 'Team Lead', icon: '👥', desc: 'Leadership, gestion, mentorat' },
  { value: 'CUSTOM_JOB', label: 'Custom Job', icon: '💼', desc: 'Paste a job description for tailored questions' },
];

function getScenarioLabel(value: string) {
  return SCENARIOS.find((s) => s.value === value)?.label ?? value.replace(/_/g, ' ');
}

function FrenchInterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');

  const [scenario, setScenario] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [activeQId, setActiveQId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [jobDescription, setJobDescription] = useState('');

  const { data: interviews, isLoading, refetch } = useQuery({
    queryKey: ['frenchInterviews'],
    queryFn: async () => {
      const { frenchInterviews } = await client.request(FRENCH_INTERVIEWS_QUERY);
      return frenchInterviews;
    },
  });

  const { data: activeInterview, refetch: refetchActive } = useQuery({
    queryKey: ['frenchInterview', interviewId],
    queryFn: async () => {
      if (!interviewId) return null;
      const { frenchInterview } = await client.request(FRENCH_INTERVIEW_QUERY, { id: interviewId });
      return frenchInterview;
    },
    enabled: !!interviewId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const input: Record<string, unknown> = { scenario, questionCount };
      if (scenario === 'CUSTOM_JOB' && jobDescription.trim()) {
        input.jobDescription = jobDescription.trim();
      }
      const vars = { input };
      const { generateFrenchInterviewQuestions } = await client.request(
        GENERATE_FRENCH_INTERVIEW_QUESTIONS_MUTATION,
        vars,
      );
      return generateFrenchInterviewQuestions;
    },
    onSuccess: (data) => {
      router.push(`/dashboard/french/interview?id=${data.interview.id}`);
      refetch();
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (qId: string) => {
      const { evaluateFrenchInterviewAnswer } = await client.request(
        EVALUATE_FRENCH_INTERVIEW_ANSWER_MUTATION,
        { input: { interviewId: interviewId!, questionId: qId, answer: answerText } },
      );
      return evaluateFrenchInterviewAnswer;
    },
    onSuccess: () => {
      setAnswerText('');
      setShowResult(true);
      refetchActive();
    },
  });

  const handleGenerate = () => {
    if (!scenario) return;
    generateMutation.mutate();
  };

  const currentQuestions: GqlInterviewQuestion[] = activeInterview?.questions ?? [];
  const currentAnswers: GqlInterviewAnswer[] = activeInterview?.answers ?? [];
  const currentEvaluations: GqlInterviewEvaluation[] = activeInterview?.evaluations ?? [];
  const answeredQIds = currentAnswers.map((a: GqlInterviewAnswer) => a.questionId);

  const activeQuestion = currentQuestions.find((q: GqlInterviewQuestion) => q.id === (activeQId ?? currentQuestions[0]?.id));

  function getEvaluationForQuestion(qId: string) {
    return currentEvaluations.find((e: GqlInterviewEvaluation) => e.questionId === qId);
  }

  const allScores = currentEvaluations
    .filter((e: GqlInterviewEvaluation) => e.grammarScore != null)
    .map((e: GqlInterviewEvaluation) => Math.round(((e.grammarScore ?? 0) + (e.confidenceScore ?? 0) + (e.technicalScore ?? 0)) / 3));

  if (isLoading) return <LoadingState />;

  // Show interview in progress / result
  if (interviewId && activeInterview) {
    const ev = activeQuestion ? getEvaluationForQuestion(activeQuestion.id) : null;
    const isCompleted = activeInterview.status === 'completed';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/french/interview')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <PageHeader
            title={getScenarioLabel(activeInterview.scenario)}
            description={`${activeInterview.questionCount} questions • ${activeInterview.status === 'completed' ? 'Completed' : 'In Progress'}`}
          />
          {activeInterview.overallScore != null && (
            <Badge variant={activeInterview.overallScore >= 70 ? 'green' : activeInterview.overallScore >= 40 ? 'amber' : 'red'}>
              Score: {activeInterview.overallScore}/100
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-2">
          {currentQuestions.map((q: GqlInterviewQuestion, i: number) => (
            <button
              key={q.id}
              onClick={() => { setActiveQId(q.id); setShowResult(false); setAnswerText(''); }}
              className={`flex-1 h-2 rounded-full transition-all ${
                answeredQIds.includes(q.id)
                  ? 'bg-emerald-400'
                  : q.id === (activeQId ?? currentQuestions[0]?.id)
                  ? 'bg-blue-400'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <Card padding="lg" className="space-y-4">
          {activeQuestion && (
            <>
              <div className="flex items-center justify-between">
                <Badge variant="blue">{activeQuestion.category.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-gray-400">
                  Question {currentQuestions.indexOf(activeQuestion) + 1} of {currentQuestions.length}
                </span>
              </div>
              <p className="text-lg font-medium text-gray-900">{activeQuestion.question}</p>

              {!answeredQIds.includes(activeQuestion.id) ? (
                <div className="space-y-3">
                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Écris ta réponse en français..."
                    className="w-full min-h-[120px] p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => evaluateMutation.mutate(activeQuestion.id)}
                      disabled={!answerText.trim() || evaluateMutation.isPending}
                    >
                      {evaluateMutation.isPending ? 'Evaluating...' : 'Submit Answer'}
                    </Button>
                  </div>
                </div>
              ) : showResult && ev ? (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Grammar</p>
                      <p className="text-xl font-bold text-gray-900">{ev.grammarScore}</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Confidence</p>
                      <p className="text-xl font-bold text-gray-900">{ev.confidenceScore}</p>
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Technical</p>
                      <p className="text-xl font-bold text-gray-900">{ev.technicalScore}</p>
                    </div>
                  </div>

                  {ev.feedback && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-blue-800 mb-1">Feedback</p>
                      <p className="text-sm text-blue-700">{ev.feedback}</p>
                    </div>
                  )}

                  {ev.improvedAnswer && (
                    <div className="bg-emerald-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-emerald-800 mb-1">Improved Answer</p>
                      <p className="text-sm text-emerald-700">{ev.improvedAnswer}</p>
                    </div>
                  )}

                  {ev.corrections && ev.corrections.length > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-amber-800">Corrections</p>
                      {ev.corrections.map((c: GqlFrenchCorrection, i: number) => (
                        <div key={i} className="text-sm text-amber-700">
                          <span className="line-through">{c.original}</span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{c.corrected}</span>
                          <p className="text-xs text-amber-600 mt-0.5">{c.explanation}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowResult(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : answeredQIds.includes(activeQuestion.id) && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Answered. Click result to view evaluation.</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResult(true)}
                    className="ml-auto"
                  >
                    View Result <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Navigate between questions */}
              <div className="flex justify-between pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQuestions.indexOf(activeQuestion) === 0}
                  onClick={() => {
                    const idx = currentQuestions.indexOf(activeQuestion);
                    if (idx > 0) {
                      setActiveQId(currentQuestions[idx - 1].id);
                      setShowResult(false);
                      setAnswerText('');
                    }
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentQuestions.indexOf(activeQuestion) === currentQuestions.length - 1}
                  onClick={() => {
                    const idx = currentQuestions.indexOf(activeQuestion);
                    if (idx < currentQuestions.length - 1) {
                      setActiveQId(currentQuestions[idx + 1].id);
                      setShowResult(false);
                      setAnswerText('');
                    }
                  }}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </Card>

        {isCompleted && (
          <Card padding="lg">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" strokeWidth={1.5} />
              <h3 className="font-semibold text-gray-900">Overall Results</h3>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${allScores.length > 0 && allScores[allScores.length - 1] >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {allScores.length > 0 ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) : '—'}
                </div>
                <p className="text-xs text-gray-500 mt-1">Average</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{currentEvaluations.length}</div>
                <p className="text-xs text-gray-500 mt-1">Answered</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{currentQuestions.length}</div>
                <p className="text-xs text-gray-500 mt-1">Total</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-8">
      <PageHeader
        title="Interview Coach"
        description="Pratiquez vos entretiens techniques en français avec l'IA"
      />

      {/* Start new interview */}
      <Card padding="lg">
        <h3 className="font-semibold text-gray-900 mb-4">New Interview Practice</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select Scenario</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {SCENARIOS.map(({ value, label, icon, desc }) => (
                <button
                  key={value}
                  onClick={() => setScenario(value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    scenario === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <span className="text-2xl mb-1 block">{icon}</span>
                  <p className="font-medium text-gray-900 text-sm">{label}</p>
                  <p className="text-xs text-gray-400 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {scenario === 'CUSTOM_JOB' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Job Description</p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here... The AI will generate tailored interview questions in French."
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Number of Questions</p>
              <div className="flex gap-1">
                {[3, 5, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => setQuestionCount(n)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      questionCount === n
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!scenario || generateMutation.isPending || (scenario === 'CUSTOM_JOB' && !jobDescription.trim())}
            className="w-full"
          >
            {generateMutation.isPending ? (
              'Generating Questions...'
            ) : (
              <>
                <Brain className="w-4 h-4" /> Generate Interview Questions
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Past interviews */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Past Interviews</h3>
        {(!interviews || interviews.length === 0) ? (
          <EmptyState
            icon={Brain}
            title="No interviews yet"
            description="Generate your first interview practice session above"
          />
        ) : (
          <div className="space-y-2">
            {interviews.map((interview: GqlFrenchInterview) => {
              const scores = (interview.evaluations ?? [])
                .filter((e: GqlInterviewEvaluation) => e.grammarScore != null)
                .map((e: GqlInterviewEvaluation) => Math.round(((e.grammarScore ?? 0) + (e.confidenceScore ?? 0) + (e.technicalScore ?? 0)) / 3));
              const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;
              return (
                <Link
                  key={interview.id}
                  href={`/dashboard/french/interview?id=${interview.id}`}
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getScenarioLabel(interview.scenario)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={interview.status === 'completed' ? 'green' : 'blue'}>
                          {interview.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                        <span className="text-xs text-gray-400">{interview.questionCount} questions</span>
                        {avgScore != null && (
                          <Badge variant={avgScore >= 70 ? 'green' : avgScore >= 40 ? 'amber' : 'red'}>
                            Score: {avgScore}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" strokeWidth={1.5} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FrenchInterviewPage() {
  return (
    <Suspense>
      <FrenchInterviewContent />
    </Suspense>
  );
}
