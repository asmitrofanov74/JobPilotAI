'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import {
  FRENCH_CONVERSATIONS_QUERY,
  FRENCH_CONVERSATION_QUERY,
  FRENCH_PROFILE_QUERY,
  SEND_FRENCH_MESSAGE_MUTATION,
  DELETE_FRENCH_CONVERSATION_MUTATION,
} from '@/lib/graphql';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare, Send, ChevronLeft, Users, Mic, BookOpen, Coffee,
  GraduationCap, Sparkles, ArrowLeft, Languages, Settings, Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Textarea } from '@/components/ui/textarea';
import { VoiceInput } from '@/components/voice/voice-input';
import { useSpeechSynthesis } from '@/components/voice/use-speech-synthesis';
import { VoiceReplayButton, AutoSpeakToggle } from '@/components/voice/voice-playback';
import { FRENCH_SCENARIO_RECORD } from '@/lib/constants/french-scenarios';
import type { GqlFrenchConversation, GqlFrenchMessage, GqlFrenchCorrection } from '@/lib/graphql/types';

function FrenchConversationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialScenario = searchParams.get('scenario');
  const initialId = searchParams.get('id');

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [showNew, setShowNew] = useState(!!initialScenario);
  const [newScenario, setNewScenario] = useState(initialScenario || 'JOB_INTERVIEW');
  const [inputMessage, setInputMessage] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const lastSpokenIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversations, isLoading: listLoading, refetch: refetchConversations } = useQuery({
    queryKey: ['frenchConversations'],
    queryFn: async () => {
      const { frenchConversations } = await client.request(FRENCH_CONVERSATIONS_QUERY);
      return frenchConversations;
    },
  });

  const { data: profileData } = useQuery({
    queryKey: ['frenchProfile'],
    queryFn: async () => {
      const { frenchProfile } = await client.request(FRENCH_PROFILE_QUERY);
      return frenchProfile;
    },
  });

  const frenchLang = profileData?.frenchVariant === 'QUEBEC' ? 'fr-CA' : 'fr-FR';
  const { speak, stop, speaking, autoSpeak, setAutoSpeak, supported: ttsSupported } = useSpeechSynthesis({ lang: frenchLang });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await client.request(DELETE_FRENCH_CONVERSATION_MUTATION, { id });
    },
    onSuccess: () => {
      setSelectedId(null);
      refetchConversations();
    },
  });

  const { data: conversationData, isLoading: convLoading, refetch: refetchConversation } = useQuery({
    queryKey: ['frenchConversation', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { frenchConversation } = await client.request(FRENCH_CONVERSATION_QUERY, { id: selectedId });
      return frenchConversation;
    },
    enabled: !!selectedId,
  });

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const input: Record<string, unknown> = { message };
      if (selectedId) {
        input.conversationId = selectedId;
      } else {
        const scenarioMeta = FRENCH_SCENARIO_RECORD[newScenario];
        input.scenario = scenarioMeta?.value || newScenario;
        if (newScenario === 'CUSTOM_JOB' && jobDescription.trim()) {
          input.jobDescription = jobDescription.trim();
        }
      }
      const vars = { input };
      const { sendFrenchMessage } = await client.request(SEND_FRENCH_MESSAGE_MUTATION, vars);
      return sendFrenchMessage;
    },
    onSuccess: (data) => {
      setSelectedId(data.conversationId);
      setShowNew(false);
      setInputMessage('');
      setJobDescription('');
      setTimeout(() => refetchConversation(), 100);
    },
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversationData?.messages, scrollToBottom]);

  useEffect(() => {
    if (showNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showNew]);

  useEffect(() => {
    if (!autoSpeak || !conversationData?.messages?.length) return;
    const msgs = conversationData.messages;
    const lastMsg = msgs[msgs.length - 1];
    if (lastMsg?.role === 'assistant' && lastMsg.id !== lastSpokenIdRef.current) {
      lastSpokenIdRef.current = lastMsg.id;
      speak(lastMsg.content);
    }
  }, [conversationData?.messages, autoSpeak, speak]);

  const handleSend = () => {
    const msg = inputMessage.trim();
    if (!msg || sendMutation.isPending) return;
    sendMutation.mutate(msg);
  };

  const handleSendWithText = (text: string) => {
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNew = (scenario: string) => {
    setNewScenario(scenario);
    setSelectedId(null);
    setShowNew(true);
    setInputMessage('');
    setJobDescription('');
    lastSpokenIdRef.current = null;
    stop();
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const selectConversation = (id: string) => {
    setSelectedId(id);
    setShowNew(false);
    lastSpokenIdRef.current = null;
    stop();
  };

  const messages = conversationData?.messages ?? [];
  const selectedConv = conversations?.find((c: GqlFrenchConversation) => c.id === selectedId);
  const activeScenario = selectedConv?.scenario || newScenario;
  const scenarioMeta = FRENCH_SCENARIO_RECORD[activeScenario] || FRENCH_SCENARIO_RECORD.JOB_INTERVIEW;
  const ScenarioIcon = scenarioMeta.icon;

  const conversationList = conversations ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conversations"
        description="Practice French with AI in real-life scenarios"
      >
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/french/settings')}>
          <Settings className="w-4 h-4" />
        </Button>
      </PageHeader>

      <div className="flex gap-6 h-[calc(100vh-14rem)]">
        <div className="w-72 shrink-0 hidden lg:flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5 mb-1">
            {Object.entries(FRENCH_SCENARIO_RECORD).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => startNew(key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  showNew && newScenario === key
                    ? `${meta.bg} ${meta.color}`
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <meta.icon className="w-3 h-3" />
                {meta.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 rounded-lg border border-gray-100 bg-white p-2">
            {listLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : conversationList.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" strokeWidth={1.5} />
                <p className="text-xs text-gray-500">No conversations</p>
              </div>
            ) : (
              conversationList.map((conv: GqlFrenchConversation) => {
                const meta = FRENCH_SCENARIO_RECORD[conv.scenario] || FRENCH_SCENARIO_RECORD.JOB_INTERVIEW;
                const Icon = meta.icon;
                return (
                  <div key={conv.id} className={`flex items-center group rounded-lg transition-colors ${
                    selectedId === conv.id
                      ? 'bg-blue-50 border border-blue-100'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}>
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className="flex-1 text-left p-2.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 ${meta.bg} rounded-lg flex items-center justify-center shrink-0`}>
                          <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{meta.label}</p>
                          <p className="text-xs text-gray-400">{conv.messages?.length ?? 0} messages</p>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(conv.id); }}
                      className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-100 overflow-hidden">
          {!showNew && !selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <Languages className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Start a Conversation</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Choose a scenario above or select an existing conversation to practice your French.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.entries(FRENCH_SCENARIO_RECORD).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <Button key={key} variant="secondary" size="sm" onClick={() => startNew(key)}>
                        <Icon className="w-3.5 h-3.5" />{meta.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 shrink-0">
                <Link href="/dashboard/french" className="lg:hidden text-gray-400 hover:text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className={`w-8 h-8 ${scenarioMeta.bg} rounded-lg flex items-center justify-center`}>
                  <ScenarioIcon className={`w-4 h-4 ${scenarioMeta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{scenarioMeta.label}</p>
                  <p className="text-xs text-gray-400">
                    {showNew ? 'New conversation' : `${messages.length} messages`}
                  </p>
                </div>
                {!showNew && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      startNew(activeScenario);
                      refetchConversation();
                    }}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />New
                  </Button>
                )}
              </div>

              {selectedConv?.jobDescription && (
                <div className="px-5 py-2.5 bg-indigo-50 border-b border-indigo-100 shrink-0">
                  <p className="text-[10px] font-semibold text-indigo-700 mb-0.5">Job Description</p>
                  <p className="text-xs text-indigo-800 line-clamp-2">{selectedConv.jobDescription}</p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {showNew && messages.length === 0 && !sendMutation.isPending && (
                  <div className="text-center py-8">
                    <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                    <p className="text-sm text-gray-600 font-medium">Commencez la conversation</p>
                    <p className="text-xs text-gray-400 mt-1">Type your first message in French below</p>
                  </div>
                )}

                {convLoading && selectedId && (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                )}

                {messages.map((msg: GqlFrenchMessage) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] space-y-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-gray-50 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {!isUser && (
                          <div className="px-1">
                            <VoiceReplayButton
                              text={msg.content}
                              onSpeak={speak}
                              onStop={stop}
                              speaking={speaking}
                            />
                          </div>
                        )}

                        {isUser && msg.evaluation && (
                          <div className="flex flex-wrap gap-1.5 px-1">
                            <Badge variant="green" className="text-[10px] px-1.5 py-0.5">
                              G{msg.evaluation.grammarScore}
                            </Badge>
                            <Badge variant="blue" className="text-[10px] px-1.5 py-0.5">
                              V{msg.evaluation.vocabularyScore}
                            </Badge>
                            <Badge variant="purple" className="text-[10px] px-1.5 py-0.5">
                              F{msg.evaluation.fluencyScore}
                            </Badge>
                          </div>
                        )}

                        {isUser && msg.evaluation && (msg.evaluation.corrections?.length ?? 0) > 0 && (
                          <div className="px-1 space-y-1">
                            <button
                              onClick={() => {
                                const el = document.getElementById(`eval-${msg.id}`);
                                if (el) el.classList.toggle('hidden');
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                            >
                              View corrections
                            </button>
                            <div id={`eval-${msg.id}`} className="hidden space-y-2">
                              <div className="bg-green-50 border border-green-100 rounded-lg p-2.5">
                                <p className="text-[10px] font-semibold text-green-700 mb-1">✓ Improved</p>
                                <p className="text-xs text-green-800">{msg.evaluation.improvedVersion}</p>
                              </div>
                              {msg.evaluation.corrections?.map((c: GqlFrenchCorrection, i: number) => (
                                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-amber-700 mb-0.5">Correction</p>
                                  <p className="text-xs">
                                    <span className="line-through text-amber-600">{c.original}</span>
                                    <span className="text-amber-800 font-medium ml-1">→ {c.corrected}</span>
                                  </p>
                                  <p className="text-[10px] text-amber-600 mt-0.5">{c.explanation}</p>
                                </div>
                              ))}
                              {msg.evaluation.quebecAlternative && (
                                <div className="bg-purple-50 border border-purple-100 rounded-lg p-2.5">
                                  <p className="text-[10px] font-semibold text-purple-700 mb-0.5">Québécois</p>
                                  <p className="text-xs text-purple-800">{msg.evaluation.quebecAlternative}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {sendMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-100 p-4 shrink-0">
                {voiceMode ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <Mic className="w-3.5 h-3.5 text-blue-500" />
                      <span>Voice mode — speak in French</span>
                      <button
                        onClick={() => setVoiceMode(false)}
                        className="ml-auto text-gray-400 hover:text-gray-600 underline text-[10px]"
                      >
                        Switch to text
                      </button>
                    </div>
                    <VoiceInput
                      onTranscript={(text) => {
                        handleSendWithText(text);
                      }}
                      disabled={sendMutation.isPending}
                    />
                  </div>
                ) : (
                  <>
                    {showNew && newScenario === 'CUSTOM_JOB' && (
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Job Description
                        </label>
                        <Textarea
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the job description here... (e.g., Warehouse Associate at Amazon, Delivery Driver at FedEx, etc.)"
                          rows={4}
                          className="w-full resize-none text-sm"
                        />
                        <p className="text-[10px] text-gray-400 mt-1">
                          The AI will generate a French conversation and interview tailored to this role
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Textarea
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={showNew ? 'Type your first message in French...' : 'Type your message in French...'}
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                      />
                      <Button
                        onClick={handleSend}
                        loading={sendMutation.isPending}
                        disabled={!inputMessage.trim()}
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] text-gray-400">Press Enter to send, Shift+Enter for new line</p>
                      <div className="flex items-center gap-2">
                        <AutoSpeakToggle
                          enabled={autoSpeak}
                          onChange={setAutoSpeak}
                          supported={ttsSupported}
                        />
                        <button
                          onClick={() => setVoiceMode(true)}
                          className="text-[10px] text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <Mic className="w-3 h-3" />
                          Voice
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FrenchConversationsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <FrenchConversationsContent />
    </Suspense>
  );
}
