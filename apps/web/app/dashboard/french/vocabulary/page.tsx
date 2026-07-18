'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_VOCABULARY_QUERY,
  FRENCH_VOCABULARY_STATS_QUERY,
  FRENCH_CONVERSATIONS_QUERY,
  ADD_FRENCH_VOCABULARY_WORD_MUTATION,
  REVIEW_FRENCH_VOCABULARY_WORD_MUTATION,
  DELETE_FRENCH_VOCABULARY_WORD_MUTATION,
  EXTRACT_FRENCH_VOCABULARY_MUTATION,
} from '@/lib/graphql';
import {
  BookOpen, Plus, Search, ChevronLeft, ChevronRight,
  RotateCcw, Star, Trash2, Brain, Sparkles, RefreshCw,
  CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import type { GqlFrenchVocabWord, GqlFrenchConversation } from '@/lib/graphql/types';

const DIFFICULTY_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

export default function FrenchVocabularyPage() {
  const [filter, setFilter] = useState<'all' | 'due' | 'mastered'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [newContext, setNewContext] = useState('');
  const [newNote, setNewNote] = useState('');
  const [reviewMode, setReviewMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [extractConvId, setExtractConvId] = useState('');
  const [showExtract, setShowExtract] = useState(false);

  const vocabFilter: Record<string, unknown> = {};
  if (filter === 'mastered') vocabFilter.mastered = true;
  else if (filter === 'due') vocabFilter.mastered = false;
  if (difficultyFilter) vocabFilter.difficulty = difficultyFilter;

  const { data: words, isLoading, refetch: refetchWords } = useQuery({
    queryKey: ['frenchVocabulary', filter, difficultyFilter],
    queryFn: async () => {
      const { frenchVocabulary } = await client.request(FRENCH_VOCABULARY_QUERY, { filter: vocabFilter });
      return frenchVocabulary;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['frenchVocabularyStats'],
    queryFn: async () => {
      const { frenchVocabularyStats } = await client.request(FRENCH_VOCABULARY_STATS_QUERY);
      return frenchVocabularyStats;
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ['frenchConversations'],
    queryFn: async () => {
      const { frenchConversations } = await client.request(FRENCH_CONVERSATIONS_QUERY);
      return frenchConversations;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { addFrenchVocabularyWord } = await client.request(ADD_FRENCH_VOCABULARY_WORD_MUTATION, {
        input: { word: newWord, translation: newTranslation, context: newContext || undefined, note: newNote || undefined },
      });
      return addFrenchVocabularyWord;
    },
    onSuccess: () => {
      setNewWord(''); setNewTranslation(''); setNewContext(''); setNewNote(''); setShowAddForm(false);
      refetchWords();
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ wordId, score }: { wordId: string; score: number }) => {
      const { reviewFrenchVocabularyWord } = await client.request(REVIEW_FRENCH_VOCABULARY_WORD_MUTATION, {
        input: { wordId, score },
      });
      return reviewFrenchVocabularyWord;
    },
    onSuccess: () => {
      refetchWords();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (wordId: string) => {
      await client.request(DELETE_FRENCH_VOCABULARY_WORD_MUTATION, { wordId });
    },
    onSuccess: () => {
      refetchWords();
    },
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      const { extractFrenchVocabulary } = await client.request(EXTRACT_FRENCH_VOCABULARY_MUTATION, {
        conversationId: extractConvId,
      });
      return extractFrenchVocabulary;
    },
    onSuccess: (data) => {
      setShowExtract(false);
      setExtractConvId('');
      refetchWords();
    },
  });

  const filteredWords = (words ?? []).filter((w: GqlFrenchVocabWord) =>
    !searchQuery || w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.translation.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const dueWords = (words ?? []).filter((w: GqlFrenchVocabWord) => !w.mastered).sort(
    (a: GqlFrenchVocabWord, b: GqlFrenchVocabWord) => new Date(a.nextReviewAt ?? '').getTime() - new Date(b.nextReviewAt ?? '').getTime(),
  );

  const currentWord = reviewMode && dueWords.length > 0 ? dueWords[currentIndex] : null;

  function handleReview(score: number) {
    if (!currentWord) return;
    reviewMutation.mutate({ wordId: currentWord.id, score });
    setShowAnswer(false);
    if (currentIndex < dueWords.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setReviewMode(false);
      setCurrentIndex(0);
    }
  }

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Vocabulary Builder"
        description="Learn and review French vocabulary words from your conversations"
      >
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowExtract(!showExtract)}>
            <Sparkles className="w-4 h-4" />Extract
          </Button>
          <Button variant="secondary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4" />Add Word
          </Button>
          {dueWords.length > 0 && (
            <Button onClick={() => { setReviewMode(true); setCurrentIndex(0); setShowAnswer(false); }}>
              <Brain className="w-4 h-4" />Review ({dueWords.length})
            </Button>
          )}
        </div>
      </PageHeader>

      {showExtract && (
        <Card padding="md">
          <h3 className="font-semibold text-gray-900 mb-3">Extract Vocabulary from Conversation</h3>
          <div className="flex gap-3">
            <Select
              value={extractConvId}
              onChange={(e) => setExtractConvId(e.target.value)}
              className="flex-1"
            >
              <option value="">Select a conversation...</option>
              {(conversations ?? []).map((c: GqlFrenchConversation) => (
                <option key={c.id} value={c.id}>
                  {c.scenario.replace(/_/g, ' ')} ({c.messages?.length ?? 0} messages)
                </option>
              ))}
            </Select>
            <Button onClick={() => extractMutation.mutate()} disabled={!extractConvId || extractMutation.isPending}>
              {extractMutation.isPending ? 'Extracting...' : 'Extract'}
            </Button>
          </div>
          {extractMutation.data && (
            <p className="text-sm text-green-600 mt-2">
              Extracted {extractMutation.data.length} new words!
            </p>
          )}
        </Card>
      )}

      {showAddForm && (
        <Card padding="md">
          <h3 className="font-semibold text-gray-900 mb-3">Add Vocabulary Word</h3>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <Input placeholder="French word" value={newWord} onChange={(e) => setNewWord(e.target.value)} />
            <Input placeholder="English translation" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} />
            <Input placeholder="Context sentence (optional)" value={newContext} onChange={(e) => setNewContext(e.target.value)} className="sm:col-span-2" />
            <Textarea placeholder="Personal note (optional)" value={newNote} onChange={(e) => setNewNote(e.target.value)} className="sm:col-span-2" rows={2} />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => addMutation.mutate()} disabled={!newWord || !newTranslation || addMutation.isPending}>
              Save Word
            </Button>
            <Button variant="secondary" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Words" value={stats.total} icon={BookOpen} color="text-blue-600" bg="bg-blue-50" />
          <StatCard label="Mastered" value={stats.mastered} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard label="Due for Review" value={stats.dueForReview} icon={AlertCircle} color="text-amber-600" bg="bg-amber-50" />
          <StatCard
            label="By Difficulty"
            value={`E${stats.difficultyBreakdown?.easy ?? 0} · M${stats.difficultyBreakdown?.medium ?? 0} · H${stats.difficultyBreakdown?.hard ?? 0}`}
            icon={Brain}
            color="text-purple-600"
            bg="bg-purple-50"
            valueSize="lg"
            valueClassName="truncate"
          />
        </div>
      )}

      {reviewMode && currentWord ? (
        <Card padding="lg" className="text-center">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Review {currentIndex + 1} of {dueWords.length}</span>
            <Button variant="secondary" size="sm" onClick={() => setReviewMode(false)}>
              <XCircle className="w-4 h-4" />Exit
            </Button>
          </div>
          <div className="py-8">
            <p className="text-3xl font-bold text-gray-900 mb-2">{currentWord.word}</p>
            {currentWord.context && (
              <p className="text-sm text-gray-500 italic">"{currentWord.context}"</p>
            )}
            {!showAnswer ? (
              <Button className="mt-6" onClick={() => setShowAnswer(true)}>
                <RotateCcw className="w-4 h-4" />Show Answer
              </Button>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-xl text-blue-600 font-medium">{currentWord.translation}</p>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-sm text-gray-500">How well did you know this?</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      variant={score <= 2 ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleReview(score)}
                      disabled={reviewMutation.isPending}
                      className="w-16"
                    >
                      {score === 1 ? 'Forgot' : score === 5 ? 'Easy' : score}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : reviewMode && dueWords.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="py-8">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-lg font-semibold text-gray-900">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No words due for review</p>
            <Button className="mt-4" onClick={() => setReviewMode(false)}>
              Back to Vocabulary
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {(['all', 'due', 'mastered'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {f === 'all' ? 'All' : f === 'due' ? 'Due' : 'Mastered'}
                </button>
              ))}
            </div>
            <Select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)} className="w-32">
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </Select>
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredWords.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No vocabulary words"
              description="Add words manually or extract them from your conversations"
              action={{ label: 'Add Word', onClick: () => setShowAddForm(true) }}
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWords.map((word: GqlFrenchVocabWord) => (
                <Card key={word.id} padding="md" className="border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900 text-lg">{word.word}</p>
                      <p className="text-sm text-gray-500">{word.translation}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {word.mastered && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                      <Badge variant={DIFFICULTY_BADGE[word.difficulty ?? ''] ?? 'gray'}>{word.difficulty}</Badge>
                    </div>
                  </div>
                  {word.context && (
                    <p className="text-xs text-gray-400 italic mb-2">"{word.context}"</p>
                  )}
                  {word.note && (
                    <p className="text-xs text-gray-500 mb-2">{word.note}</p>
                  )}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      Reviewed {word.timesReviewed}x · {Math.round(((word.timesCorrect ?? 0) / Math.max(word.timesReviewed ?? 1, 1)) * 100)}% correct
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(word.id)}
                        className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
