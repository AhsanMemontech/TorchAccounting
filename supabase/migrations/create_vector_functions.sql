-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function to create vector table
CREATE OR REPLACE FUNCTION create_vector_table(table_name text, dimension integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I (
      id text PRIMARY KEY,
      content text NOT NULL,
      page_number integer,
      chunk_index integer,
      section text,
      keywords text[],
      embedding vector(%s),
      created_at timestamp with time zone DEFAULT now()
    )', table_name, dimension);
    
  -- Create index for vector similarity search
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I_embedding_idx 
    ON %I 
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)', table_name, table_name);
    
  -- Enable RLS
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
  
  -- Create policy for authenticated users
  EXECUTE format('
    CREATE POLICY "Allow authenticated users to access vector data" ON %I
    FOR ALL USING (auth.role() = ''authenticated'')', table_name);
    
  -- Grant permissions
  EXECUTE format('GRANT ALL ON %I TO authenticated', table_name);
END;
$$;

-- Create function to match chunks using vector similarity
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  table_name text
)
RETURNS TABLE (
  id text,
  content text,
  page_number integer,
  chunk_index integer,
  section text,
  keywords text[],
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      id,
      content,
      page_number,
      chunk_index,
      section,
      keywords,
      1 - (embedding <=> $1) as similarity
    FROM %I
    WHERE 1 - (embedding <=> $1) > $2
    ORDER BY embedding <=> $1
    LIMIT $3', table_name)
  USING query_embedding, match_threshold, match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_vector_table(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION match_chunks(vector(1536), float, int, text) TO authenticated; 