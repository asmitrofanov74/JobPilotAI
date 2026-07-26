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

export function NavigationOverlay() {
  const { isLoading } = useNavLoading();

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white/70 dark:bg-gray-950/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200 ${
        isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      {isLoading && (
        <div className="w-10 h-10 border-[3px] border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      )}
    </div>
  );
}
