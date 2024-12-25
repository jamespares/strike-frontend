-- Create survey_responses table
CREATE TABLE IF NOT EXISTS public.survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    product TEXT,
    motivation TEXT,
    progress TEXT,
    challenges TEXT,
    deadline TEXT,
    budget TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_latest BOOLEAN DEFAULT true
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS survey_responses_user_id_idx ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS survey_responses_is_latest_idx ON public.survey_responses(is_latest);

-- Add RLS policies
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can read their own responses
CREATE POLICY "Users can view own responses"
    ON public.survey_responses FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own responses"
    ON public.survey_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
    ON public.survey_responses FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "Users can delete own responses"
    ON public.survey_responses FOR DELETE
    USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_survey_responses_updated_at
    BEFORE UPDATE ON public.survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 