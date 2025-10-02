-- Migration to support multiple chats per user
-- This modifies the existing chat_sessions table to support multiple chats

-- First, drop the unique constraint on user_id
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_key;

-- Add new columns for chat metadata
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a default title
UPDATE chat_sessions 
SET title = 'Chat Session', 
    created_at = updated_at,
    last_message_at = updated_at
WHERE title IS NULL;

-- Make title NOT NULL after setting defaults
ALTER TABLE chat_sessions ALTER COLUMN title SET NOT NULL;
ALTER TABLE chat_sessions ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE chat_sessions ALTER COLUMN last_message_at SET NOT NULL;

-- Create index for better performance on user queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_created ON chat_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_last_message ON chat_sessions(user_id, last_message_at DESC);

-- Update the RLS policy to still work with multiple chats
DROP POLICY IF EXISTS "Users can only access their own chat sessions" ON chat_sessions;
CREATE POLICY "Users can only access their own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);