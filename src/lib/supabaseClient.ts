import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrebyzemaywhgikpiszw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyZWJ5emVtYXl3aGdpa3Bpc3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI0OTksImV4cCI6MjA3NDkwODQ5OX0.Gf1HTH9Sx92Q8aYjY7HBPBbTIehXCyFq29fyxe_YAwM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 