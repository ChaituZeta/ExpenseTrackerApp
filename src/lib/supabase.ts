import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Try import.meta.env first (Vite standard)
  if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
  
  // Try process.env (fallback for some environments or if defined in vite.config.ts)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://placeholder.supabase.co') {
  console.error('CRITICAL: Supabase environment variables are missing or invalid!', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing',
    tip: 'Ensure your Vercel environment variables are prefixed with VITE_ (e.g., VITE_SUPABASE_URL instead of SUPABASE_URL).'
  });
} else {
  console.log('Supabase client initialized with URL:', supabaseUrl);
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
