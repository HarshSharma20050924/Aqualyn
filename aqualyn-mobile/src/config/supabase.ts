import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://uuuidxafgdldgrkhvbdp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dWlkeGFmZ2RsZGdya2h2YmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDU1MzAsImV4cCI6MjA5NzI4MTUzMH0.Jyd0SYF7EbvNE-zW36XPc3X2cvk_ynsomUZAGwtZzsc';

// Lazy singleton — avoids "window is not defined" during Expo Router SSR
let _supabase: any = null;

export function getSupabase() {
  if (_supabase) return _supabase;
  // Only create on client (not during Node.js SSR)
  const { createClient } = require('@supabase/supabase-js');
  _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  });
  return _supabase;
}

// For convenience — call getSupabase() anywhere you need it
export { SUPABASE_URL, SUPABASE_ANON_KEY };
