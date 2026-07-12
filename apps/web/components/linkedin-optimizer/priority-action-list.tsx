'use client';

import { Badge } from '@/components/ui/badge';
import { priorityVariant } from '@/lib/linkedin-optimizer/utils';

type PriorityAction = {
  priority: string;
  action: string;
  impact?: string;
  effort?: string;
  timeframe?: string;
};

type PriorityActionListProps = {
  items: PriorityAction[];
  showEffort?: boolean;
  showTimeframe?: boolean;
};

export function PriorityActionList({ items, showEffort, showTimeframe }: PriorityActionListProps) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Action Plan</h3>
      <div className="space-y-2">
        {items.map((a, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
            <Badge variant={priorityVariant(a.priority)}>{a.priority}</Badge>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{a.action}</p>
              {a.impact && <p className="text-xs text-gray-500 mt-0.5">{a.impact}</p>}
              {showEffort && a.effort && <p className="text-xs text-gray-400 mt-0.5">Effort: {a.effort}</p>}
              {showTimeframe && a.timeframe && <p className="text-xs text-gray-400 mt-0.5">Timeframe: {a.timeframe}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
