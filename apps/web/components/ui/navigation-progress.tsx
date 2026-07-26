'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(60);

    const t1 = setTimeout(() => setProgress(80), 100);
    const t2 = setTimeout(() => setProgress(95), 300);
    const t3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5">
      <div
        className="h-full bg-blue-600 transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
        }}
      />
    </div>
  );
}
