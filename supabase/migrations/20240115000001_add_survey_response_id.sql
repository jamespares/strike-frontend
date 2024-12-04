-- Add survey_response_id column to user_assets table
ALTER TABLE user_assets
ADD COLUMN IF NOT EXISTS survey_response_id UUID REFERENCES survey_responses(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_assets_survey_response 
ON user_assets(user_id, survey_response_id);

-- Update RLS policies to include survey_response_id check
DROP POLICY IF EXISTS "Users can view own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON user_assets;
DROP POLICY IF EXISTS "Users can update own assets" ON user_assets;

CREATE POLICY "Users can view own assets"
    ON user_assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
    ON user_assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON user_assets FOR UPDATE
    USING (auth.uid() = user_id); 