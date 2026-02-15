// src/utils/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with YOUR keys from Supabase dashboard
const SUPABASE_URL = 'https://cvzjhcwivvxbkrfsvigc.supabase.co'; // ← Paste your URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2empoY3dpdnZ4YmtyZnN2aWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MTE1OTMsImV4cCI6MjA4MzI4NzU5M30.TrPbReKGCBy3l1djd2mGCzwI1q0qJ-IcEj-pZ0u8mV4'; // ← Paste your key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
