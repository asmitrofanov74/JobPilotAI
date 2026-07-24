import { type ReactNode } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { type LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  color?: string;
  bg?: string;
  href?: string;
  valueSize?: 'lg' | '2xl';
  valueClassName?: string;
  className?: string;
  children?: ReactNode;
  showArrow?: boolean;
};

export function StatCard({
  label,
  value,
  icon: Icon,
  color = 'text-blue-600',
  bg = 'bg-blue-50',
  href,
  valueSize = '2xl',
  valueClassName = '',
  className = '',
  children,
  showArrow,
}: StatCardProps) {
  const valueClass = `text-${valueSize} font-bold text-gray-900 ${valueClassName}`;
  const content = (
    <Card padding="md" className={`border-gray-100 ${href ? 'hover:shadow-md transition-shadow' : ''} ${className}`}>
      <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} strokeWidth={1.5} />
      </div>
      <p className={valueClass}>{value}</p>
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
        {showArrow && <ArrowRight className="w-3 h-3 text-gray-400" strokeWidth={1.5} />}
      </div>
      {children}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}
