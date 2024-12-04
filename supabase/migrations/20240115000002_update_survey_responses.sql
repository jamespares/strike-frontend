-- First, backup the existing data
CREATE TABLE IF NOT EXISTS survey_responses_backup_20240115 AS
SELECT * FROM survey_responses;

-- Drop old columns and add new ones
ALTER TABLE survey_responses
DROP COLUMN IF EXISTS key_goals,
DROP COLUMN IF EXISTS problem,
DROP COLUMN IF EXISTS key_risks,
DROP COLUMN IF EXISTS pricing_model;

-- Add new columns
ALTER TABLE survey_responses
ADD COLUMN IF NOT EXISTS product TEXT,
ADD COLUMN IF NOT EXISTS motivation TEXT,
ADD COLUMN IF NOT EXISTS progress TEXT,
ADD COLUMN IF NOT EXISTS challenges TEXT;

-- Add comment to document the change
COMMENT ON TABLE survey_responses IS 'Survey responses for project planning. Updated 2024-01-15 to restructure questions: what (product), why (motivation), progress, challenges, deadline, and budget.';