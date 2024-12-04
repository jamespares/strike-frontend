-- Drop existing user_assets table
DROP TABLE IF EXISTS user_assets;

-- Recreate user_assets table with updated schema
CREATE TABLE user_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    asset_type TEXT NOT NULL CHECK (asset_type IN ('business_plan', 'pitch_deck', 'budget_tracker', 'task_manager', 'roadmap')),
    title TEXT NOT NULL,
    content JSONB,  -- Stores URLs, IDs, and other asset-specific data
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

-- Recreate policies
CREATE POLICY "Users can view own assets"
    ON user_assets
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
    ON user_assets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
    ON user_assets
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX user_assets_user_id_idx ON user_assets(user_id);
CREATE INDEX user_assets_type_idx ON user_assets(asset_type);

-- Add trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_assets_last_updated
    BEFORE UPDATE ON user_assets
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column(); 