'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface SpeechVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
}

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  gender?: 'male' | 'female';
}

const STORAGE_KEY = 'jobpilot.speech.voice';

const MALE_NAMES = [
  'jean', 'pierre', 'paul', 'thomas', 'julien', 'antoine', 'alexis', 'leo',
  'lucas', 'hugo', 'gabriel', 'louis', 'victor', 'nathan', 'mathis', 'raphael',
  'henri', 'daniel', 'david', 'alex', 'jorge', 'mike', 'mark', 'fred', 'eric',
];

const FEMALE_NAMES = [
  'julie', 'denise', 'michelle', 'hortense', 'eloise', 'sylvie', 'amelie',
  'amelia', 'samantha', 'sonia', 'susan', 'hazel', 'zira', 'sarah', 'floria',
  'natasha', 'emily', 'aria', 'angela', 'julie', 'linda', 'joanna', 'karen',
  'monica', 'jenny',
];

function scoreVoice(voice: SpeechSynthesisVoice, targetLang: string, gender?: 'male' | 'female'): number {
  const name = voice.name.toLowerCase();
  const vlang = voice.lang.toLowerCase();
  const target = targetLang.toLowerCase();
  const targetBase = target.split('-')[0];

  if (vlang !== target && !vlang.startsWith(targetBase)) return -Infinity;

  let score = vlang === target ? 1000 : 800;

  const quality = [
    'natural', 'neural', 'premium', 'online', 'enhanced', 'high quality', 'en-us-', 'fr-fr-', 'fr-ca-',
  ];
  if (quality.some((q) => name.includes(q))) score += 300;
  if (!voice.localService) score += 60;

  const known = [
    'hazel', 'susan', 'sonia', 'floria', 'samantha', 'amelie', 'aude', 'thomas',
    'julie', 'daniel', 'paul', 'amelie', 'sarah', 'denise', 'michelle', 'jorge',
    'google', 'microsoft',
  ];
  if (known.some((k) => name.includes(k))) score += 120;

  const poor = ['david', 'mark', 'zira', 'mike', 'alex', 'fred', 'eric', 'sapi', 'basic'];
  if (poor.some((p) => name.includes(p))) score -= 150;

  if (gender) {
    const isMale = MALE_NAMES.some((m) => name.includes(m));
    const isFemale = FEMALE_NAMES.some((f) => name.includes(f));
    if (gender === 'male' && isMale) score += 250;
    else if (gender === 'female' && isFemale) score += 250;
    else if (isMale) score -= 120;
    else if (isFemale) score -= 120;
  }

  return score;
}

function pickBestVoice(voices: SpeechSynthesisVoice[], lang: string, gender?: 'male' | 'female'): SpeechSynthesisVoice | null {
  const scored = voices
    .map((v) => ({ voice: v, score: scoreVoice(v, lang, gender) }))
    .filter((x) => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);
  return scored.length > 0 ? scored[0].voice : null;
}

function splitIntoSentences(text: string, maxChunk = 200): string[] {
  const sentences = text.match(/[^.!?…。]+[.!?…。]?/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (current.length + sentence.length + 1 > maxChunk) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { lang = 'fr-FR', rate = 1, pitch = 1, volume = 1, gender } = options;
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [voices, setVoices] = useState<SpeechVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const queueRef = useRef<string[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const preferredVoiceNameRef = useRef<string | null>(null);
  const genderRef = useRef(gender);
  genderRef.current = gender;

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    queueRef.current = [];
    setSpeaking(false);
  }, []);

  const speakNext = useCallback((synth: SpeechSynthesis) => {
    const text = queueRef.current.shift();
    if (!text) {
      setSpeaking(false);
      utteranceRef.current = null;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    const preferred = preferredVoiceNameRef.current
      ? voicesRef.current.find((v) => v.name === preferredVoiceNameRef.current)
      : null;
    const voice = preferred ?? pickBestVoice(voicesRef.current, lang, genderRef.current);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => speakNext(synth);
    utterance.onerror = () => speakNext(synth);

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [lang, rate, pitch, volume]);

  const speak = useCallback(
    (text: string) => {
      const synth = window.speechSynthesis;
      if (!synth) return;

      stop();
      queueRef.current = splitIntoSentences(text);
      if (queueRef.current.length > 0) speakNext(synth);
    },
    [speakNext, stop],
  );

  const selectVoice = useCallback((name: string) => {
    preferredVoiceNameRef.current = name;
    setSelectedVoiceName(name);
    try {
      window.localStorage.setItem(STORAGE_KEY, name);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    const loadVoices = () => {
      const list = synth.getVoices();
      if (list.length > 0) {
        voicesRef.current = list;
        setVoices(
          list.map((v) => ({
            name: v.name,
            lang: v.lang,
            localService: v.localService,
            default: v.default,
          })),
        );
      }
    };

    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        preferredVoiceNameRef.current = stored;
        setSelectedVoiceName(stored);
      }
    } catch {
      // ignore storage errors
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  return {
    speak,
    stop,
    speaking,
    autoSpeak,
    setAutoSpeak,
    supported: typeof window !== 'undefined' && !!window.speechSynthesis,
    voices,
    selectedVoiceName,
    selectVoice,
  };
}
