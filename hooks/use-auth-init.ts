'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/slices/authSlice';
import type { AuthUser } from '@/lib/api/auth.api';

/**
 * Rehydrates auth state from localStorage on first client render.
 * Returns `isInitializing: true` until the check is complete so that
 * ProtectedRoute / PublicRoute can avoid premature redirects.
 */
export function useAuthInit() {
  const dispatch = useDispatch();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userRaw = localStorage.getItem('authUser');

    if (token && userRaw) {
      try {
        const user: AuthUser = JSON.parse(userRaw);
        dispatch(setCredentials({ user, token }));
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }

    setIsInitializing(false);
  }, [dispatch]);

  return { isInitializing };
}
