'use client';

type ScoreDisplayProps = {
  score: number;
  label: string;
};

export function ScoreDisplay({ score, label }: ScoreDisplayProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-lg font-semibold text-gray-900">Results</h2>
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-blue-600">{score}%</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}
