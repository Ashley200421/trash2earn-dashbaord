import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string

// Auth client — uses anon key so sessions are properly stored in localStorage
export const authClient = createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY as string)

// Admin data client — uses service role key to bypass RLS for all admin queries
export const supabase = createClient(url, import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string, {
  auth: { persistSession: false, autoRefreshToken: false },
})
