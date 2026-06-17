import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uuuidxafgdldgrkhvbdp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dWlkeGFmZ2RsZGdya2h2YmRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDU1MzAsImV4cCI6MjA5NzI4MTUzMH0.Jyd0SYF7EbvNE-zW36XPc3X2cvk_ynsomUZAGwtZzsc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    }
});
