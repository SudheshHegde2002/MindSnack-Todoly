import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zonogipkextgivwswhhj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpvbm9naXBrZXh0Z2l2d3N3aGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTk5MzUsImV4cCI6MjA3NzIzNTkzNX0.Ugvj9s2f9p14kak4aNRvxm0rs8QrlAu63f9y_nHzJOQ';

// Create Supabase client with global headers option
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {},
  },
});

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at?: string;
};

