'use client';

import { Volume2, VolumeX, Loader2 } from 'lucide-react';

interface VoiceReplayButtonProps {
  text: string;
  onSpeak: (text: string) => void;
  onStop: () => void;
  speaking: boolean;
}

export function VoiceReplayButton({ text, onSpeak, onStop, speaking }: VoiceReplayButtonProps) {
  if (!speaking) {
    return (
      <button
        onClick={() => onSpeak(text)}
        className="p-1 rounded-md text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
        title="Listen"
      >
        <Volume2 className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <button
      onClick={onStop}
      className="p-1 rounded-md text-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
      title="Stop"
    >
      <VolumeX className="w-3.5 h-3.5" />
    </button>
  );
}

interface AutoSpeakToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  supported: boolean;
}

export function AutoSpeakToggle({ enabled, onChange, supported }: AutoSpeakToggleProps) {
  if (!supported) return null;

  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all ${
        enabled
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
      title={enabled ? 'Auto-speak ON' : 'Auto-speak OFF'}
    >
      {enabled ? (
        <Volume2 className="w-3 h-3" />
      ) : (
        <VolumeX className="w-3 h-3" />
      )}
      Voice {enabled ? 'ON' : 'OFF'}
    </button>
  );
}
