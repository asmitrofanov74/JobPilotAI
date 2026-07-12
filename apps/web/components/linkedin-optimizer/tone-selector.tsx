'use client';

import { toneLabel } from '@/lib/linkedin-optimizer/utils';

type ToneSelectorProps = {
  options: string[];
  value: string;
  onChange: (tone: string) => void;
};

export function ToneSelector({ options, value, onChange }: ToneSelectorProps) {
  return (
    <div className="flex items-center gap-4">
      <label className="text-sm font-medium text-gray-700">Tone:</label>
      {options.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === t ? 'bg-blue-100 text-blue-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          {toneLabel(t)}
        </button>
      ))}
    </div>
  );
}
