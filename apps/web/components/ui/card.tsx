import { type ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
};

const paddings = {
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className = '', hover = false, padding = 'md' }: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 ${paddings[padding]} ${
        hover ? 'hover:shadow-md hover:border-gray-200 transition-all' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
