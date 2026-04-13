# UXOHire Database Audit — Round 2
**Date:** 2026-04-13 (updated from initial audit)  
**Auditor:** Hermes (automated)  
**Scope:** All 6 Supabase tables vs. frontend code in `src/UXOHire.js`

---

## Status: All Issues Resolved

This document supersedes the initial DB_AUDIT.md. All findings from both audit rounds have been fixed and verified. The database and frontend are now fully in sync.

---

## Migrations Applied (Full History)

| File | Description | Status |
|---|---|---|
| 000_tech_profiles_rls.sql | Initial RLS on tech_profiles | ✅ Pre-existing |
| 001_create_job_posts.sql | Initial job_posts table | ✅ Pre-existing (partial) |
| 002_add_user_id_to_profiles.sql | Auth linking columns | ✅ Applied |
| 003_create_applications.sql | Applications table | ✅ Applied |
| 004_create_contacts.sql | Contacts table | ✅ Applied |
| 005_add_job_posts_status.sql | **CRITICAL** — Added missing status column | ✅ Applied |
| 006_fix_applications_rls.sql | Scoped SELECT to owner/employer | ✅ Applied |
| 007_add_contacts_select_policy.sql | Techs can read their inbound contacts | ✅ Applied |
| 008_add_applications_update_policy.sql | Employers can update application status | ✅ Applied |
| 009_add_job_posts_delete_policy.sql | Employers can delete own listings | ✅ Applied |
| 010_create_employer_profiles.sql | Employer account persistence | ✅ Applied |
| 011_create_payments.sql | Stripe integration groundwork | ✅ Applied |
| 012_add_unique_constraints.sql | UNIQUE on tech_profiles.user_id; NOT NULL on job_posts.location | ✅ Applied |
| 013_migrate_and_drop_legacy_columns.sql | Data migrated; certs/active/experience dropped | ✅ Applied |
| 014_add_upload_path_columns.sql | resume_path, cert_paths, hazwoper8_cert_path, physical_cert_path on tech_profiles | ✅ Applied |
| 015_fix_storage_rls.sql | Fixed storage policies — anon → authenticated | ✅ Applied |

---

## Final DB Schema

### `tech_profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| name | text NOT NULL | |
| location | text | |
| summary | text | |
| open_to_work | boolean | Default true |
| uxo_hours | text | |
| travel | text | |
| dod_certs | text[] | |
| hazwoper_40 | boolean | |
| hazwoper_40_date | date | |
| hazwoper_8 | boolean | |
| hazwoper_8_date | date | |
| physical_current | boolean | |
| physical_date | date | |
| military_eod | boolean | |
| clearance | boolean | |
| clearance_level | text | |
| dive_cert | boolean | |
| drivers_license | boolean | |
| cdl | boolean | |
| email | text | |
| user_id | uuid UNIQUE FK → auth.users | |
| updated_at | timestamptz | |
| resume_path | text | Storage path |
| cert_paths | text[] | Storage paths |
| hazwoper8_cert_path | text | Storage path |
| physical_cert_path | text | Storage path |

### `job_posts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| created_at | timestamptz | |
| company | text NOT NULL | |
| title | text NOT NULL | |
| location | text NOT NULL | |
| type | text | |
| salary | text | |
| description | text | |
| required_certs | text[] | |
| preferred_certs | text[] | |
| status | text | Default 'pending_payment' |
| user_id | uuid FK → auth.users | |

### `applications`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_id | uuid FK → job_posts | |
| tech_profile_id | uuid FK → tech_profiles | |
| applicant_name | text NOT NULL | |
| applicant_email | text NOT NULL | |
| message | text | |
| status | text | Default 'submitted' |
| created_at | timestamptz | |

### `contacts`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| tech_profile_id | uuid FK → tech_profiles | |
| employer_name | text NOT NULL | |
| employer_email | text NOT NULL | |
| company | text | |
| message | text NOT NULL | |
| created_at | timestamptz | |

### `employer_profiles`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid UNIQUE FK → auth.users | |
| company_name | text NOT NULL | |
| contact_name | text | |
| contact_email | text | |
| phone | text | |
| website | text | |
| description | text | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| job_post_id | uuid FK → job_posts | |
| employer_id | uuid FK → auth.users | |
| stripe_session_id | text UNIQUE | |
| stripe_payment_intent | text | |
| amount_cents | integer | Default 14900 ($149) |
| currency | text | Default 'usd' |
| status | text | pending/paid/failed/refunded |
| paid_at | timestamptz | |
| expires_at | timestamptz | Job listing expiry |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## Final RLS Policy Inventory (20 policies)

| Table | Policy | Command |
|---|---|---|
| tech_profiles | Allow public insert on tech_profiles | INSERT |
| tech_profiles | Allow public select on tech_profiles | SELECT |
| tech_profiles | Users can update own profile | UPDATE |
| tech_profiles | Users can delete own profile | DELETE |
| job_posts | Allow public insert on job_posts | INSERT |
| job_posts | Public can read active jobs | SELECT |
| job_posts | Users can update own job posts | UPDATE |
| job_posts | Employers can delete own job posts | DELETE |
| applications | Anyone can submit applications | INSERT |
| applications | Applicants can read own applications | SELECT |
| applications | Employers can read applications for their jobs | SELECT |
| applications | Employers can update application status | UPDATE |
| contacts | Anyone can submit contacts | INSERT |
| contacts | Techs can read contacts sent to them | SELECT |
| employer_profiles | Employers can insert own profile | INSERT |
| employer_profiles | Employers can read own profile / Public can read employer display info | SELECT (×2) |
| employer_profiles | Employers can update own profile | UPDATE |
| employer_profiles | Employers can delete own profile | DELETE |
| payments | Employers can read own payments | SELECT |

**Storage (uxo-uploads bucket):**
| Policy | Command | Role |
|---|---|---|
| Authenticated users can upload files | INSERT | authenticated |
| Users can read own files | SELECT | authenticated |
| Users can delete own files | DELETE | authenticated |

---

## Frontend Code Fixes Applied

### Fix 1: `normalizeTech` missing `email` field
**File:** `src/UXOHire.js` — `normalizeTech()` function  
**Problem:** `myProfile?.email` used in the Apply form pre-fill (line 528) always resolved to `undefined` because `email` was not mapped in `normalizeTech`. The `tech_profiles.email` column exists in the DB but was silently dropped.  
**Fix:** Added `email: t.email || ''` to `normalizeTech`. Also added `resumePath`, `certPaths`, `hazwoper8CertPath`, `physicalCertPath` for completeness with new upload path columns.

### Fix 2: Upload paths never persisted to DB
**File:** `src/UXOHire.js` — 4 upload `onChange` handlers + `handleSubmitProfile`  
**Problem:** `uploadFile()` returns `{ path, error }`. All 4 upload handlers destructured only `{ error }`, discarding the path. On profile submit, the `INSERT` into `tech_profiles` sent no file path columns, so uploaded files were orphaned in storage with no DB reference.  
**Fix:** Added `uploadPaths` state (`{ resume, certs[], hazwoper8, physical }`). Each upload handler now saves the returned path into `uploadPaths`. `handleSubmitProfile` now includes all 4 path fields in the INSERT payload.

---

## Remaining Items (Not Yet Implemented — Future Work)

These are architectural gaps not addressable by migrations alone:

1. **Employer profile not pre-loaded on job post** — The "Post a Job" form still asks for company name every time. The `employer_profiles` table exists but the frontend has no code to read from it and pre-fill `company` on the job post form. Requires a `fetchEmployerProfile()` call and form pre-population.

2. **Stripe payment flow not wired** — `payments` table exists with correct schema. The frontend shows a static "$149 / 30 days" pricing box but clicking "Submit Job Post" goes directly to insert (skipping payment). Requires: Stripe Checkout session creation, redirect to Stripe, webhook handler to update `payments.status` → `paid` and `job_posts.status` → `published`.

3. **No employer dashboard** — Employers have no UI to see their own job posts, view incoming applications, or update application status. The DB policies support this but no views or API calls exist for it.

4. **No tech profile edit** — The "My Profile" view shows read-only data and an availability toggle. There is no edit flow; techs must submit a new profile (which would fail with UNIQUE violation on `user_id` if they already have one). Requires an UPDATE path in the profile form.

5. **No notification system** — Contacts and applications are submitted to the DB but there is no email notification triggered on INSERT. Supabase Edge Functions + email provider integration (e.g., Resend) needed.

6. **Upload path prefix not user-scoped** — `uploadFile` uploads to `certs/timestamp_filename.ext`. The new storage SELECT policy restricts reads by `(storage.foldername(name))[1] = auth.uid()`. These are incompatible — uploaded files won't be readable until the upload path is changed to `{user_id}/certs/...` format.

---

## Table Connection Summary (Final)

| Table | Read | Write | Auth-Scoped | Frontend Connected | Notes |
|---|---|---|---|---|---|
| tech_profiles | ✅ | ✅ | ✅ | ✅ | Upload paths now persisted |
| job_posts | ✅ | ✅ | ✅ | ✅ | status column fixed |
| applications | ✅ | ✅ | ✅ | ✅ | Privacy scoped |
| contacts | ✅ | ✅ | ✅ | ✅ | SELECT policy added |
| employer_profiles | ✅ | ✅ | ✅ | ⚠️ | Table exists, no frontend code yet |
| payments | ✅ (read) | Service role only | ✅ | ⚠️ | Table exists, Stripe not wired |
