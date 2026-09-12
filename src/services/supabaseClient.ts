import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Xavorian Supabase project credentials with environment variable overrides
const DEFAULT_SUPABASE_URL = 'https://bxiptffmsxamsgkzqutj.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4aXB0ZmZtc3hhbXNna3pxdXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5OTcwMzYsImV4cCI6MjA5NzU3MzAzNn0.xA1xG3C-DK7kM8SxpJeCJoMJMC6sQKfV8NjipHrlcWM';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' &&
    import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

export let supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Configure or override the internal Supabase client instance
 * useful when embedding the module inside another application
 */
export const setSupabaseClient = (customClient: SupabaseClient) => {
  supabase = customClient;
};

export const getSupabaseClient = (): SupabaseClient => supabase;
