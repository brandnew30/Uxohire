# UXOHire — Database Migrations

## Apply Migrations

The Supabase CLI is not available in the build environment. These migrations must be run manually in the **Supabase Dashboard SQL Editor**:

1. Go to: https://supabase.com/dashboard/project/jdtqzmzcdwnvfcajwsch/sql
2. Run `supabase/migrations/000_tech_profiles_rls.sql` first
3. Run `supabase/migrations/001_create_job_posts.sql` second

### `000_tech_profiles_rls.sql`
Enables Row Level Security on the existing `tech_profiles` table and adds read/insert policies.

### `001_create_job_posts.sql`
Creates the `job_posts` table with RLS enabled. This is required for the job posting form to save data.
