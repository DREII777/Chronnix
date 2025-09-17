import { useCallback, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAuth = (): AuthState => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        setSession(null);
      } else {
        setError(null);
        setSession(data.session ?? null);
      }
    } catch (refreshError) {
      console.error('Session refresh failed', refreshError);
      setError("Impossible de vérifier la session. Veuillez réessayer.");
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void refresh();

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) {
        return;
      }
      setSession(newSession);
      setError(null);
      setLoading(false);
    });

    return () => {
      active = false;
      data?.subscription?.unsubscribe();
    };
  }, [refresh]);

  return { session, user: session?.user ?? null, loading, error, refresh };
};
