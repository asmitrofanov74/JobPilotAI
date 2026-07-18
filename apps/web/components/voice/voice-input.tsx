'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Play, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { EVALUATE_FRENCH_PRONUNCIATION_MUTATION } from '@/lib/graphql';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface PronunciationFeedback {
  overallScore: number;
  clarityScore: number;
  accuracyScore: number;
  fluencyScore: number;
  feedback: string;
  improvements: Array<{ text: string; suggestion: string }>;
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

export function VoiceInput({ onTranscript, disabled, language = 'fr-FR' }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const speechSupported = typeof window !== 'undefined' &&
    (!!(window as unknown as Record<string, unknown>).SpeechRecognition || !!(window as unknown as Record<string, unknown>).webkitSpeechRecognition);

  const pronunciationMutation = useMutation({
    mutationFn: async (text: string) => {
      const { evaluateFrenchPronunciation } = await client.request(
        EVALUATE_FRENCH_PRONUNCIATION_MUTATION,
        { input: { spokenText: text } },
      );
      return evaluateFrenchPronunciation as PronunciationFeedback;
    },
    onSuccess: (data) => {
      setFeedback(data);
      setShowFeedback(true);
    },
  });

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    setTranscript('');
    setInterimTranscript('');
    setFeedback(null);
    setShowFeedback(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const SpeechRecognition = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new (SpeechRecognition as new () => SpeechRecognitionInstance)();
        recognitionRef.current = recognition;
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let final = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setTranscript((prev) => prev + final);
          setInterimTranscript(interim);
        };

        recognition.onerror = () => {
          stopRecording();
        };

        recognition.start();
      }

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();

      setRecording(true);
    } catch {
      stopRecording();
    }
  }, [language, stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  const handleSendTranscript = () => {
    const text = transcript.trim();
    if (!text) return;
    onTranscript(text);
    setTranscript('');
    setInterimTranscript('');
    setFeedback(null);
    setShowFeedback(false);
  };

  const handleSendAndEvaluate = () => {
    const text = transcript.trim();
    if (!text) return;
    pronunciationMutation.mutate(text);
    onTranscript(text);
    setTranscript('');
    setInterimTranscript('');
  };

  const handleCancel = () => {
    setTranscript('');
    setInterimTranscript('');
    setFeedback(null);
    setShowFeedback(false);
  };

  const displayText = transcript + (interimTranscript ? ` ${interimTranscript}` : '');

  return (
    <div className="space-y-2">
      {!recording && !transcript && (
        <Button
          variant="secondary"
          size="sm"
          onClick={startRecording}
          disabled={disabled || !speechSupported}
          className="gap-2"
          title={!speechSupported ? 'Speech recognition not supported in this browser' : 'Start voice input'}
        >
          <Mic className="w-4 h-4" />
          Voice
        </Button>
      )}

      {recording && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <span className="text-xs text-red-600 font-medium truncate">
              {displayText || 'Listening...'}
            </span>
          </div>
          <button
            onClick={stopRecording}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Stop recording"
          >
            <Square className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {!recording && transcript && (
        <div className="space-y-2">
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-800">{displayText}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendTranscript}
              disabled={!transcript.trim()}
            >
              <Send className="w-3.5 h-3.5" /> Send
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSendAndEvaluate}
              disabled={!transcript.trim() || pronunciationMutation.isPending}
              loading={pronunciationMutation.isPending}
            >
              <Play className="w-3.5 h-3.5" /> Send & Score
            </Button>
            <Button variant="ghost" size="sm" onClick={startRecording}>
              <Mic className="w-3.5 h-3.5" /> Retry
            </Button>
          </div>

          {showFeedback && feedback && (
            <div className="bg-white border border-blue-100 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-700">Pronunciation Score</p>
                <button onClick={() => setShowFeedback(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="blue" className="text-[10px]">
                  Overall {feedback.overallScore}
                </Badge>
                <Badge variant="green" className="text-[10px]">
                  Clarity {feedback.clarityScore}
                </Badge>
                <Badge variant="violet" className="text-[10px]">
                  Accuracy {feedback.accuracyScore}
                </Badge>
                <Badge variant="amber" className="text-[10px]">
                  Fluency {feedback.fluencyScore}
                </Badge>
              </div>
              <p className="text-xs text-gray-600">{feedback.feedback}</p>
              {feedback.improvements.length > 0 && (
                <div className="space-y-1">
                  {feedback.improvements.map((imp, i) => (
                    <div key={i} className="text-[11px] text-gray-500">
                      <span className="font-medium text-gray-700">{imp.text}:</span>{' '}
                      {imp.suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
