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
// Direct access ensures Vite's 'define' replacement works correctly
const supabaseUrl = 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  // @ts-ignore
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL) || 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey = 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  // @ts-ignore
  (typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY) || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

// Logging & Verification
const isUsingFallback = (supabaseUrl === DEFAULT_SUPABASE_URL);
const isProd = import.meta.env.PROD;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error('❌ Supabase Initialization Failed: Missing URL or API Key.');
} else {
  const getSource = (val: string, viteEnv: any, nextEnv: any, suEnv: any, fallback: string) => {
    if (val === nextEnv) return 'NEXT_PUBLIC_ENV';
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL === val) return 'VITE_DEFINE';
    if (val === viteEnv) return 'VITE_ENV';
    if (val === suEnv) return 'SUPABASE_ENV';
    if (val === fallback) return 'FALLBACK';
    return 'UNKNOWN';
  };

  const urlSource = getSource(supabaseUrl, import.meta.env.VITE_SUPABASE_URL, import.meta.env.NEXT_PUBLIC_SUPABASE_URL, import.meta.env.SUPABASE_URL, DEFAULT_SUPABASE_URL);
  const keySource = getSource(supabaseAnonKey, import.meta.env.VITE_SUPABASE_ANON_KEY, import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, import.meta.env.SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);
                    
  console.log(`✅ Supabase initialized. Source: [URL: ${urlSource}, KEY: ${keySource}] (${isUsingFallback ? 'FALLBACK' : 'PRODUCTION'})`);
  if (isUsingFallback && isProd) {
    console.warn('⚠️ Warning: Using hardcoded fallback credentials in production. Ensure Vercel environment variables (NEXT_PUBLIC_SUPABASE_URL, etc.) are configured.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
