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

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
