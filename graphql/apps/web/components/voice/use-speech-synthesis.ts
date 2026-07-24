'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechSynthesisOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}) {
  const { lang = 'fr-FR', rate = 1, pitch = 1, volume = 1 } = options;
  const [speaking, setSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;

      stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;

      const synth = window.speechSynthesis;

      const voices = synth.getVoices();
      const preferred = voices.find((v) => v.lang === lang);
      const fallback = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
      if (preferred) {
        utterance.voice = preferred;
      } else if (fallback) {
        utterance.voice = fallback;
      }

      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      synth.speak(utterance);
    },
    [lang, rate, pitch, volume, stop],
  );

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  return {
    speak,
    stop,
    speaking,
    autoSpeak,
    setAutoSpeak,
    supported: typeof window !== 'undefined' && !!window.speechSynthesis,
  };
}
