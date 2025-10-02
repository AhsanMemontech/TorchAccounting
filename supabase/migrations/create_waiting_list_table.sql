-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    state TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list(email);

-- Create index on state for analytics
CREATE INDEX IF NOT EXISTS idx_waiting_list_state ON waiting_list(state);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list(created_at);

-- Enable Row Level Security
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public inserts (for the waiting list form)
CREATE POLICY "Allow public inserts" ON waiting_list
    FOR INSERT 
    WITH CHECK (true);

-- Create policy to allow authenticated users to read (for admin)
CREATE POLICY "Allow authenticated reads" ON waiting_list
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waiting_list_updated_at 
    BEFORE UPDATE ON waiting_list 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();