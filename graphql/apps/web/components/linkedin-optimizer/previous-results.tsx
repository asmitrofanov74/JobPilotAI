'use client';

import { type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/linkedin-optimizer/utils';
import { type GqlLinkedinOptimization } from '@/lib/graphql/types';

type PreviousResultsProps = {
  data: GqlLinkedinOptimization[] | undefined;
  isLoading: boolean;
  icon: LucideIcon;
  iconColor: string;
  label: string;
  emptyTitle: string;
  emptyDescription: string;
  displayField?: string;
  onSelect: (item: GqlLinkedinOptimization) => void;
};

export function PreviousResults({
  data, isLoading, icon: Icon, iconColor, label,
  emptyTitle, emptyDescription, displayField, onSelect,
}: PreviousResultsProps) {
  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner /></div>;
  }

  if (!data?.length) {
    return <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />;
  }

  const displayValue = (item: { outputData?: Record<string, unknown> }) => {
    if (!displayField) return '';
    const val = item.outputData?.[displayField];
    if (typeof val === 'number') return `${val}%`;
    if (typeof val === 'string') return val.length > 60 ? `${val.slice(0, 60)}...` : val;
    if (Array.isArray(val) && val.length > 0) {
      const first = val[0];
      return `${first.company || first.role || ''} ${first.role ? `- ${first.role}` : ''}`.trim() || `${val.length} entries`;
    }
    return String(val || '');
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{label}</h2>
      <div className="space-y-3">
        {data.map((opt) => (
          <Card key={opt.id} hover padding="md" className="cursor-pointer" onClick={() => onSelect(opt)}>
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${iconColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{displayValue(opt) || 'View details'}</p>
                <p className="text-xs text-gray-400">{formatDate(opt.createdAt)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
