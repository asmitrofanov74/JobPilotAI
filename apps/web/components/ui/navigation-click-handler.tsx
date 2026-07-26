'use client';

import { useEffect } from 'react';
import { useNavLoading } from './navigation-progress';

export function NavigationClickHandler() {
  const { startLoading } = useNavLoading();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
      if (anchor.target === '_blank') return;

      startLoading();
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [startLoading]);

  return null;
}
