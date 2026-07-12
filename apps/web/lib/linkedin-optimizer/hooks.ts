import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/graphql/client';
import { LINKEDIN_OPTIMIZATIONS_QUERY } from '@/lib/graphql';

export function useCopyToClipboard() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return { copiedIndex, copyToClipboard };
}

export function useLinkedinOptimizations(type: string) {
  return useQuery({
    queryKey: ['linkedinOptimizations', type],
    queryFn: async () => {
      const { linkedinOptimizations } = await client.request(LINKEDIN_OPTIMIZATIONS_QUERY, { type });
      return linkedinOptimizations;
    },
  });
}
