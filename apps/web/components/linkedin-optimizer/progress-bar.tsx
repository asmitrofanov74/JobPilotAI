'use client';

type ProgressBarProps = {
  value: number;
  className?: string;
};

export function ProgressBar({ value, className = '' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-100 rounded-full h-3 ${className}`}>
      <div className="bg-blue-600 h-3 rounded-full transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}
