-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    payment_status TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    problem TEXT,
    solution TEXT,
    key_risks TEXT,
    deadline TEXT,
    budget NUMERIC,
    pricing_model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_latest BOOLEAN DEFAULT true,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Index for faster lookups
CREATE INDEX idx_survey_responses_user_latest ON survey_responses(user_id, is_latest);

-- Create project_plans table
CREATE TABLE IF NOT EXISTS project_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    plan JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_assets table
CREATE TABLE IF NOT EXISTS user_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    diagram_url TEXT,
    gantt_chart_url TEXT,
    budget_tracker_url TEXT,
    risk_log_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    generation_status TEXT,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE
);

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assets ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for survey_responses table
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

-- Create policies for project_plans table
CREATE POLICY "Users can view own project plans"
    ON project_plans
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project plans"
    ON project_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for user_assets table
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