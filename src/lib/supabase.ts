import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://poeyhgmbbpovbmonoeqi.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZXloZ21iYnBvdmJtb25vZXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MzY1NTUsImV4cCI6MjA4OTExMjU1NX0.5bsemjqGGvEqq_PCACmrag7UTsMgmVBmKJwDcvMwopE';

const getEnv = (key: string): string => {
  // 1. Try import.meta.env (Standard Vite bundling)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  
  // 2. Try process.env (Vercel injection / Node environments)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  return '';
};

// Prioritize platform environment variables over hardcoded fallbacks
const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('SUPABASE_URL') || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('SUPABASE_ANON_KEY') || DEFAULT_SUPABASE_ANON_KEY;

// Logging & Verification
const isUsingFallback = (supabaseUrl === DEFAULT_SUPABASE_URL && !getEnv('VITE_SUPABASE_URL') && !getEnv('SUPABASE_URL'));

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('❌ Supabase Initialization Failed: Missing URL or API Key.');
} else {
  console.log(`✅ Supabase client initialized. Mode: ${isUsingFallback ? 'FALLBACK' : 'PRODUCTION'}`);
  if (isUsingFallback) {
    console.warn('⚠️  Warning: Using hardcoded fallback credentials. Ensure Vercel environment variables are configured for better security.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
