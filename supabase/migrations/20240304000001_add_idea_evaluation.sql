-- Add idea_evaluation to allowed asset types
ALTER TABLE user_assets 
DROP CONSTRAINT user_assets_asset_type_check,
ADD CONSTRAINT user_assets_asset_type_check 
CHECK (asset_type IN ('business_plan', 'pitch_deck', 'budget_tracker', 'task_manager', 'roadmap', 'idea_evaluation')); 