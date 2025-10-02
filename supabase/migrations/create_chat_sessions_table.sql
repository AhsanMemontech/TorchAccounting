-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own chat sessions
CREATE POLICY "Users can only access their own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON chat_sessions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated; 

/*Remove policy*/

-- Fix RLS for pdf_chunks table
-- Option 1: Disable RLS for pdf_chunks (simpler approach)
ALTER TABLE pdf_chunks DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a policy that allows service role access (more secure)
-- CREATE POLICY "Service role can manage pdf_chunks" ON pdf_chunks
--   FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON pdf_chunks TO service_role;
GRANT ALL ON pdf_chunks TO authenticated;