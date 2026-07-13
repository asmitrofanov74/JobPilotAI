'use client';

import { ProgressBar } from '@/components/ui/progress-bar';

type ScoreBarProps = {
  label: string;
  score: number | null;
  maxScore?: number;
  color?: string;
  className?: string;
};

export function ScoreBar({ label, score, maxScore = 100, color = 'bg-blue-500', className = '' }: ScoreBarProps) {
  const pct = score ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-sm text-gray-600 w-24 shrink-0">{label}</span>
      <div className="flex-1">
        <ProgressBar value={pct} color={color} height="md" />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-10 text-right">{score ?? '—'}</span>
    </div>
  );
}
