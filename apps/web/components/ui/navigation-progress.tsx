'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface NavLoadingCtx {
  isLoading: boolean;
  startLoading: () => void;
}

const Ctx = createContext<NavLoadingCtx>({ isLoading: false, startLoading: () => {} });

export function useNavLoading() {
  return useContext(Ctx);
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (pathname !== prevPath) {
      setPrevPath(pathname);
      setIsLoading(false);
    }
  }, [pathname, prevPath]);

  return (
    <Ctx.Provider value={{ isLoading, startLoading }}>
      {children}
    </Ctx.Provider>
  );
}

export function NavigationProgress() {
  const { isLoading } = useNavLoading();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setVisible(true);
      setWidth(0);
      const t0 = setTimeout(() => setWidth(30), 10);
      const t1 = setTimeout(() => setWidth(60), 300);
      const t2 = setTimeout(() => setWidth(85), 800);
      const t3 = setTimeout(() => setWidth(95), 1500);
      return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    } else if (visible) {
      setWidth(100);
      const t = setTimeout(() => { setVisible(false); setWidth(0); }, 300);
      return () => clearTimeout(t);
    }
  }, [isLoading, visible]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px] bg-transparent">
      <div
        className="h-full bg-blue-600 rounded-r-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(37,99,235,0.6)]"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function NavigationOverlay() {
  const { isLoading } = useNavLoading();

  return (
    <div
      className={`fixed inset-0 z-[9998] bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 ${
        isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {isLoading && (
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      )}
    </div>
  );
}
