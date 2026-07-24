'use client';

import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

type CopyButtonProps = {
  text: string;
  index: number;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
};

export function CopyButton({ text, index, copiedIndex, onCopy }: CopyButtonProps) {
  return (
    <Button size="sm" variant="ghost" onClick={() => onCopy(text, index)}>
      {copiedIndex === index ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}
