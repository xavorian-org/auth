import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { authService, SignInParams, SignUpParams } from '../services/authService';
import type { AuthUser, AuthRole } from '../types/auth';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatUser = (rawUser: any): AuthUser => ({
    id: rawUser.id,
    email: rawUser.email || '',
    fullName: rawUser.user_metadata?.full_name || rawUser.user_metadata?.name || '',
    accountType: (rawUser.user_metadata?.account_type as AuthRole) || 'buyer',
    age: rawUser.user_metadata?.age,
    locationState: rawUser.user_metadata?.location_state,
    locationCity: rawUser.user_metadata?.location_city,
    phone: rawUser.user_metadata?.phone || rawUser.phone,
    avatarUrl: rawUser.user_metadata?.avatar_url,
    createdAt: rawUser.created_at,
  });

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(formatUser(session.user));
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Error fetching session');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(formatUser(session.user));
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession]);

  const signIn = async (params: SignInParams) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.signIn(params);
      if (res.user) {
        setUser(formatUser(res.user));
        await authService.logSessionAudit(res.user.id);
      }
      return res;
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (params: SignUpParams) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.signUp(params);
      if (res.user) {
        setUser(formatUser(res.user));
      }
      return res;
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
    } catch (err: any) {
      setError(err?.message || 'Sign out failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };
};
