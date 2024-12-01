# Supabase Database Structure

## Tables

### users

Stores user profile information.

| Column         | Type        | Description                            |
|---------------|-------------|----------------------------------------|
| id            | UUID        | Primary key, references auth.users(id) |
| email         | TEXT        | User's email address                   |
| payment_status | TEXT        | User's payment status                  |
| created_at    | TIMESTAMPTZ | Account creation timestamp             |
| updated_at    | TIMESTAMPTZ | Last update timestamp                  |

### survey_responses

Stores user survey responses for the business planning tool.

| Column        | Type        | Description                               |
|--------------|-------------|-------------------------------------------|
| user_id      | UUID        | Primary key, references auth.users(id)    |
| problem      | TEXT        | What problem are you trying to solve?     |
| solution     | TEXT        | What do you want to build to solve this?  |
| key_risks    | TEXT        | What challenges could delay the project?  |
| deadline     | TEXT        | When do you want to ship your project?    |
| budget       | NUMERIC     | How much can you spend to get it launched?|
| pricing_model| TEXT        | How will you make money?                  |
| updated_at   | TIMESTAMPTZ | Last update timestamp                     |

### project_plans

Stores generated project plans.

| Column     | Type        | Description                            |
|-----------|-------------|----------------------------------------|
| id        | UUID        | Primary key                            |
| user_id   | UUID        | References auth.users(id)              |
| plan      | JSONB       | Generated project plan data            |
| created_at| TIMESTAMPTZ | Creation timestamp                     |

### user_assets

Stores generated assets and their status.

| Column            | Type        | Description                            |
|------------------|-------------|----------------------------------------|
| id               | UUID        | Primary key                            |
| user_id          | UUID        | References auth.users(id)              |
| diagram_url      | TEXT        | URL to the generated diagram           |
| gantt_chart_url  | TEXT        | URL to the generated Gantt chart       |
| budget_tracker_url| TEXT        | URL to the budget tracker              |
| risk_log_url     | TEXT        | URL to the risk log                    |
| created_at       | TIMESTAMPTZ | Creation timestamp                     |
| generation_status| TEXT        | Status of asset generation             |

## Relationships

- All tables are linked to `auth.users` through `user_id` or `id`
- Each user can have:
  - One profile record (users table)
  - One set of survey responses
  - Multiple project plans
  - Multiple sets of assets

## Security

All tables use Row Level Security (RLS) with the following policies:

### users
- Users can only view their own profile
- Users can only update their own profile

### survey_responses
- Users can only view their own responses
- Users can only insert their own responses
- Users can only update their own responses

### project_plans
- Users can only view their own project plans
- Users can only insert their own project plans

### user_assets
- Users can only view their own assets
- Users can only insert their own assets
- Users can only update their own assets

## Setup

1. Create a new Supabase project
2. Run the migration file in `migrations/20240101000000_create_survey_responses.sql`
3. Enable authentication and set up the necessary auth providers

## Local Development

To work with the database locally:

1. Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

2. Link your project

```bash
supabase link --project-ref your-project-ref
```

3. Pull the latest database types

```bash
supabase gen types typescript --linked > lib/database.types.ts
``` 