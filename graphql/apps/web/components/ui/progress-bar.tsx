'use client';

type ProgressBarProps = {
  value: number;
  className?: string;
  color?: string;
  height?: 'sm' | 'md' | 'lg';
};

const heights = {
  sm: 'h-2',
  md: 'h-2.5',
  lg: 'h-3',
};

export function ProgressBar({ value, className = '', color = 'bg-blue-600', height = 'lg' }: ProgressBarProps) {
  return (
    <div className={`w-full bg-gray-100 rounded-full ${heights[height]} ${className}`}>
      <div className={`${color} ${heights[height]} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
