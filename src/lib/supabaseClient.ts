import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
if (!supabaseUrl || supabaseUrl === 'https://your-project-ref.supabase.co') {
  console.warn(
    '⚠️ FoodBridge: Supabase env vars not configured.\n' +
    'Create frontend/.env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
    'The app will render but auth/database features will not work.'
  );
}

// Use placeholder values so the client doesn't throw — it just won't connect
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: window.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
