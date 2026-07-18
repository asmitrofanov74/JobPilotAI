'use client';

import { useState, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  ENGLISH_INTERVIEWS_QUERY,
  ENGLISH_INTERVIEW_QUERY,
  GENERATE_ENGLISH_INTERVIEW_QUESTIONS_MUTATION,
  EVALUATE_ENGLISH_INTERVIEW_ANSWER_MUTATION,
  GENERATE_ENGLISH_INTERVIEW_HINT_MUTATION,
} from '@/lib/graphql';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Brain, ArrowLeft, BarChart3, CheckCircle2, ChevronRight, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { GqlEnglishPracticeInterview, GqlEnglishPracticeQuestion, GqlEnglishPracticeAnswer, GqlEnglishPracticeEvaluation, GqlEnglishInterviewHint } from '@/lib/graphql/types';

const SCENARIOS = [
  { value: 'FRONTEND_DEVELOPER', label: 'Frontend Developer', icon: '🖥️', desc: 'React, CSS, web performance' },
  { value: 'FULL_STACK_DEVELOPER', label: 'Full Stack Developer', icon: '🔄', desc: 'APIs, databases, architecture' },
  { value: 'TEAM_LEAD', label: 'Team Lead', icon: '👥', desc: 'Leadership, management, mentoring' },
  { value: 'BEHAVIORAL', label: 'Behavioral', icon: '🧠', desc: 'STAR method, soft skills, scenarios' },
  { value: 'CUSTOM_JOB', label: 'Custom Job', icon: '💼', desc: 'Paste a job description for tailored questions' },
];

function getScenarioLabel(value: string) {
  return SCENARIOS.find((s) => s.value === value)?.label ?? value.replace(/_/g, ' ');
}

function EnglishInterviewPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('id');

  const [scenario, setScenario] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [activeQId, setActiveQId] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [hintData, setHintData] = useState<GqlEnglishInterviewHint | null>(null);
  const [showHint, setShowHint] = useState(false);

  const { data: interviews, isLoading, refetch } = useQuery({
    queryKey: ['englishInterviews'],
    queryFn: async () => {
      const { englishInterviews } = await client.request(ENGLISH_INTERVIEWS_QUERY);
      return englishInterviews;
    },
  });

  const { data: activeInterview, refetch: refetchActive } = useQuery({
    queryKey: ['englishInterview', interviewId],
    queryFn: async () => {
      if (!interviewId) return null;
      const { englishInterview } = await client.request(ENGLISH_INTERVIEW_QUERY, { id: interviewId });
      return englishInterview;
    },
    enabled: !!interviewId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const input: Record<string, unknown> = { scenario, questionCount };
      if (scenario === 'CUSTOM_JOB' && jobDescription.trim()) {
        input.jobDescription = jobDescription.trim();
      }
      const { generateEnglishInterviewQuestions } = await client.request(
        GENERATE_ENGLISH_INTERVIEW_QUESTIONS_MUTATION,
        { input },
      );
      return generateEnglishInterviewQuestions;
    },
    onSuccess: (data: { interview: { id: string } }) => {
      router.push(`/dashboard/interviews/practice?id=${data.interview.id}`);
      refetch();
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async (qId: string) => {
      const { evaluateEnglishInterviewAnswer } = await client.request(
        EVALUATE_ENGLISH_INTERVIEW_ANSWER_MUTATION,
        { input: { interviewId: interviewId!, questionId: qId, answer: answerText } },
      );
      return evaluateEnglishInterviewAnswer;
    },
    onSuccess: () => {
      setAnswerText('');
      setShowResult(true);
      refetchActive();
    },
  });

  const hintMutation = useMutation({
    mutationFn: async (qId: string) => {
      const { generateEnglishInterviewHint } = await client.request(
        GENERATE_ENGLISH_INTERVIEW_HINT_MUTATION,
        { input: { interviewId: interviewId!, questionId: qId } },
      );
      return generateEnglishInterviewHint;
    },
    onSuccess: (data: GqlEnglishInterviewHint) => {
      setHintData(data);
      setShowHint(true);
    },
  });

  const handleGenerate = () => {
    if (!scenario) return;
    generateMutation.mutate();
  };

  const currentQuestions: GqlEnglishPracticeQuestion[] = activeInterview?.questions ?? [];
  const currentAnswers: GqlEnglishPracticeAnswer[] = activeInterview?.answers ?? [];
  const currentEvaluations: GqlEnglishPracticeEvaluation[] = activeInterview?.evaluations ?? [];
  const answeredQIds = currentAnswers.map((a: GqlEnglishPracticeAnswer) => a.questionId);

  const activeQuestion = currentQuestions.find((q: GqlEnglishPracticeQuestion) => q.id === (activeQId ?? currentQuestions[0]?.id));

  function getEvaluationForQuestion(qId: string) {
    return currentEvaluations.find((e: GqlEnglishPracticeEvaluation) => e.questionId === qId);
  }

  const allScores = currentEvaluations
    .filter((e: GqlEnglishPracticeEvaluation) => e.grammarScore != null)
    .map((e: GqlEnglishPracticeEvaluation) => Math.round(((e.grammarScore ?? 0) + (e.confidenceScore ?? 0) + (e.technicalScore ?? 0)) / 3));

  if (isLoading) return <LoadingState />;

  if (interviewId && activeInterview) {
    const ev = activeQuestion ? getEvaluationForQuestion(activeQuestion.id) : null;
    const isCompleted = activeInterview.status === 'completed';

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/interviews/practice')}>
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

        <div className="flex gap-2">
          {currentQuestions.map((q: GqlEnglishPracticeQuestion) => (
            <button
              key={q.id}
              onClick={() => { setActiveQId(q.id); setShowResult(false); setAnswerText(''); setShowHint(false); setHintData(null); }}
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
                  {showHint && hintData ? (
                    <div className="bg-amber-50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800">Hint</p>
                      </div>
                      <p className="text-sm text-amber-700">{hintData.hint}</p>
                      {hintData.keyPoints && (
                        <div>
                          <p className="text-xs font-medium text-amber-800 mb-1">Key Points:</p>
                          <p className="text-sm text-amber-700 whitespace-pre-line">{hintData.keyPoints}</p>
                        </div>
                      )}
                      {hintData.exampleAnswer && (
                        <div>
                          <p className="text-xs font-medium text-amber-800 mb-1">Example Answer:</p>
                          <p className="text-sm text-amber-700 italic">{hintData.exampleAnswer}</p>
                        </div>
                      )}
                      <button
                        onClick={() => { setShowHint(false); setHintData(null); }}
                        className="text-xs text-amber-600 hover:text-amber-800 underline"
                      >
                        Hide hint
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => hintMutation.mutate(activeQuestion.id)}
                      disabled={hintMutation.isPending}
                      className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl px-4 py-2 transition-colors w-full justify-center"
                    >
                      <Lightbulb className="w-4 h-4" />
                      {hintMutation.isPending ? 'Getting hint...' : "Get Hint — I don't know what to answer"}
                    </button>
                  )}

                  <textarea
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    placeholder="Write your answer in English..."
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
                      {ev.corrections.map((c: { original: string; corrected: string; explanation: string }, i: number) => (
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
                    <Button variant="secondary" onClick={() => setShowResult(false)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              ) : answeredQIds.includes(activeQuestion.id) && (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 rounded-xl p-4">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">Answered. Click result to view evaluation.</span>
                  <Button variant="ghost" size="sm" onClick={() => setShowResult(true)} className="ml-auto">
                    View Result <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}

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
                      setShowHint(false);
                      setHintData(null);
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
                      setShowHint(false);
                      setHintData(null);
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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interview Practice"
        description="Practice your technical interview skills in English with AI"
      />

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
                placeholder="Paste the job description here... The AI will generate tailored interview questions in English."
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
            {interviews.map((interview: GqlEnglishPracticeInterview) => {
              const scores = (interview.evaluations ?? [])
                .filter((e: GqlEnglishPracticeEvaluation) => e.grammarScore != null)
                .map((e: GqlEnglishPracticeEvaluation) => Math.round(((e.grammarScore ?? 0) + (e.confidenceScore ?? 0) + (e.technicalScore ?? 0)) / 3));
              const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : null;
              return (
                <Link
                  key={interview.id}
                  href={`/dashboard/interviews/practice?id=${interview.id}`}
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

export default function EnglishInterviewPracticePage() {
  return (
    <Suspense>
      <EnglishInterviewPracticeContent />
    </Suspense>
  );
}
