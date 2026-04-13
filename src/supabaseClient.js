import { createClient } from '@supabase/supabase-js';

// These values are safe to embed — the anon key is public-facing by design
// and all access is gated by Row Level Security policies.
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
  || 'https://jdtqzmzcdwnvfcajwsch.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHF6bXpjZHdudmZjYWp3c2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjM0NTMsImV4cCI6MjA4OTU5OTQ1M30.Eq7O7vvG5zqA9He1dJ7WTXNGjF1TGkhE8efOjYMfYds';

export const supabase = createClient(supabaseUrl, supabaseKey);
