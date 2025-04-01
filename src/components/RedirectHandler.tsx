'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSpaces } from '@/contexts/SpaceContext';

export function RedirectHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const { createNewSession, currentSession } = useSpaces();

  useEffect(() => {
    // Only redirect if we're at the root path
    if (pathname === '/') {
      // If there's no current session, create a new one
      if (!currentSession) {
        createNewSession();
      }
    }
  }, [pathname, currentSession, createNewSession]);

  return null;
} 