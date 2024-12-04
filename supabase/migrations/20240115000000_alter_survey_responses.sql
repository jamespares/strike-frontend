-- Backup existing data
CREATE TABLE survey_responses_backup AS SELECT * FROM survey_responses;

-- Drop existing constraints and indexes
ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_pkey;
ALTER TABLE survey_responses DROP CONSTRAINT IF EXISTS survey_responses_user_id_fkey;

-- Add new columns and modify existing structure
ALTER TABLE survey_responses
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT true;

-- Set id as primary key
ALTER TABLE survey_responses ADD PRIMARY KEY (id);

-- Re-add foreign key constraint
ALTER TABLE survey_responses
    ADD CONSTRAINT survey_responses_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_latest 
    ON survey_responses(user_id, is_latest);

-- Update RLS policies
DROP POLICY IF EXISTS "Users can view own responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON survey_responses;
DROP POLICY IF EXISTS "Users can update own responses" ON survey_responses;

CREATE POLICY "Users can view own responses"
    ON survey_responses
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own responses"
    ON survey_responses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own responses"
    ON survey_responses
    FOR UPDATE
    USING (auth.uid() = user_id); 