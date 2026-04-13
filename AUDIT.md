# UXOHire Codebase Audit
*Date: 2026-04-12 | Audited by: CEO*

---

## Implementation Log

### Wave 1 — Backend (completed: 2026-04-13)
- [x] Installed @supabase/supabase-js
- [x] Moved credentials to .env
- [x] Created .gitignore
- [x] Created supabaseClient.js
- [x] Added job_posts migration SQL (apply in Supabase dashboard)
- [x] Replaced SAMPLE_JOBS and SAMPLE_TECHS with live Supabase queries
- [x] Wired job post form to save to Supabase (status: pending_payment)
- [x] Updated file uploads to use supabase-js storage
- [x] Added jobPostSuccess confirmation screen
- [x] Removed old uxo-hire.jsx prototype

---

## Overview

UXOHire is a specialized job board for the UXO (Unexploded Ordnance) industry — connecting certified UXO technicians with defense/environmental remediation employers. The project is a React SPA (Create React App, React 18) with Supabase as the backend and Stripe for job posting payments.

**Business model:** Free for techs to list profiles. Employers pay $149/30 days to post a job.

---

## File Inventory

| File | Status | Notes |
|------|--------|-------|
| `package.json` | ✅ Complete | React 18, react-scripts 5.0.1 — standard CRA setup |
| `public/index.html` | ✅ Complete | Standard CRA template with correct meta/title |
| `src/index.js` | ✅ Complete | React 18 root render |
| `src/App.js` | ✅ Complete | Thin wrapper — renders `<UXOHire />` |
| `src/UXOHire.js` | 🔶 Partial | Main app, 717 lines — UI mostly built, backend stubs |
| `uxo-hire.jsx` | 🗄️ Archive | Earlier prototype with all-hardcoded data, superseded by `src/UXOHire.js` |

---

## What Is Fully Built

### UI / Frontend
- ✅ Job listings view with cert + location filtering
- ✅ Job detail page (title, company, certs, description)
- ✅ Tech listings view (available techs only)
- ✅ Tech detail page (full qualifications grid)
- ✅ 3-step tech profile creation form (basic info → certs/quals → availability)
- ✅ 3-step job posting form (company/role → requirements → review & payment)
- ✅ Cert expiration logic (HAZWOPER 8-HR, physical — warns at 30 days, hides at expired)
- ✅ File upload UI (cert docs, physical docs, resumes — via Supabase Storage)
- ✅ Success/confirmation screens
- ✅ Open-to-work availability toggle
- ✅ Dark theme, styled-components via inline styles, responsive grid layout
- ✅ Nav, hero section, footer

### Backend Integration (Partial)
- ✅ Supabase configured (URL + anon key hardcoded in `UXOHire.js`)
- ✅ `supabaseInsert()` helper — posts tech profiles to `tech_profiles` table
- ✅ `uploadFile()` helper — uploads docs to Supabase Storage (`uxo-uploads` bucket)
- ✅ Cert/physical/resume document uploads functional (though alert() used for feedback)
- ✅ Stripe payment link stub present on job post review page ($149/30 days)

---

## What Is Partially Built

| Feature | Status | What's Missing |
|---------|--------|----------------|
| **Stripe payment** | 🔶 Stub | `STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/YOUR_LINK_HERE'` — placeholder, no real link |
| **Job postings backend** | 🔶 Stub | No `supabaseInsert` call for job post form — jobs never saved to DB |
| **Tech profile data fetching** | 🔶 Hardcoded | `SAMPLE_TECHS` array — not fetched from Supabase |
| **Job data fetching** | 🔶 Hardcoded | `SAMPLE_JOBS` array — not fetched from Supabase |
| **Apply Now button** | 🔶 Dead UI | Button renders but has no handler/flow |
| **Contact This Tech button** | 🔶 Dead UI | Button renders but has no handler/flow |
| **Upload feedback** | 🔶 Alert-based | Uses browser `alert()` — no in-UI success/error state |

---

## What Is Missing Entirely

### Core MVP Blockers
1. **Authentication** — No login/signup. No way for techs to manage their profiles or employers to manage job posts. Supabase Auth is the obvious choice.
2. **Real Stripe integration** — Real payment link needed; webhook to publish job post after payment confirmed.
3. **Job post persistence** — Job post form data is never saved to Supabase.
4. **Live data fetching** — Jobs and tech profiles are hardcoded. Need `useEffect` + Supabase queries.
5. **Job application flow** — "Apply Now" has no functionality. Need application form, submission, confirmation.
6. **Tech → employer contact flow** — "Contact This Tech" needs a contact form or reveal email flow.

### Post-MVP / Growth Features
7. **Tech profile edit/management** — Techs can't update their own profile after submission.
8. **Employer dashboard** — View applicants, manage active postings, contact techs.
9. **Tech dashboard** — View job matches, manage availability, update profile.
10. **Email notifications** — Profile submission confirmation, job alerts, application receipts.
11. **URL-based routing** — All navigation is in-memory state; no shareable URLs, no back-button support. Need React Router.
12. **Mobile responsiveness** — Layout uses CSS grid that adapts, but no explicit breakpoints for small screens.
13. **Admin/moderation panel** — Verify certifications, approve listings, remove bad actors.
14. **SEO** — Dynamic meta tags per job listing for search indexing.
15. **Cert verification** — Currently self-reported. Future: upload + verify against DOD records.

---

## Database Schema (Inferred)

From the `supabaseInsert` call, one table is confirmed in use:

**`tech_profiles`** (in use)
- name, email, location, uxo_hours, travel, summary
- dod_certs (array), hazwoper_40 (bool), hazwoper_40_date, hazwoper_8 (bool), hazwoper_8_date
- physical_current (bool), physical_date, military_eod (bool)
- clearance (bool), clearance_level, dive_cert (bool), drivers_license (bool), cdl (bool)
- open_to_work (bool)

**Missing tables (needed for MVP):**
- `job_posts` — company, title, location, type, salary, description, required_certs, preferred_certs, status, employer_id
- `users` / auth — handled by Supabase Auth
- `applications` — tech_id, job_id, status, submitted_at
- `contacts` — from employer to tech or vice versa

---

## Prioritized MVP Roadmap

### Phase 1 — Data Layer (no auth required, unblock live content)
**Goal:** Replace hardcoded data with real Supabase reads. Users can see live listings.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1 | Create `job_posts` table in Supabase | Critical | S |
| 2 | Fetch jobs from Supabase in `UXOHire.js` (replace `SAMPLE_JOBS`) | Critical | S |
| 3 | Fetch available techs from Supabase (replace `SAMPLE_TECHS`) | Critical | S |
| 4 | Save job post form to Supabase on step 3 submit (before Stripe redirect) | Critical | M |
| 5 | Replace `alert()` uploads with in-UI feedback (loading/success/error state) | High | S |

### Phase 2 — Revenue (Stripe real integration)
**Goal:** Employers can pay and job posts go live.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 6 | Create real Stripe payment link (or Stripe Checkout session) | Critical | S |
| 7 | Stripe webhook → mark job post as `published` in Supabase | Critical | M |
| 8 | Job listing only shows `published` posts | High | S |

### Phase 3 — Authentication
**Goal:** Users have accounts; can own their data.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 9 | Supabase Auth — email/password signup + login | High | M |
| 10 | Link tech profiles and job posts to auth users | High | M |
| 11 | Tech profile edit page (for logged-in techs) | High | M |
| 12 | Employer job management page (view/edit/delete own posts) | High | M |

### Phase 4 — Core Interaction Flows
**Goal:** Techs can apply, employers can contact techs.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 13 | Job application form + `applications` table | High | M |
| 14 | "Contact This Tech" form (email reveal or in-app message) | High | M |
| 15 | Email confirmation on profile submit and job application | Medium | M |

### Phase 5 — Polish & Growth
| # | Task | Priority | Effort |
|---|------|----------|--------|
| 16 | React Router for URL-based navigation and shareable job URLs | Medium | M |
| 17 | Mobile CSS breakpoints | Medium | S |
| 18 | Admin dashboard (manual cert verification, post moderation) | Medium | L |
| 19 | Job alert emails (notify techs of new matching jobs) | Low | L |
| 20 | SEO meta tags per listing | Low | S |

---

## Critical Issues / Tech Debt

1. **Supabase anon key is hardcoded** in `src/UXOHire.js` — should move to `.env` (`REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY`) before any public deployment.
2. **`uxo-hire.jsx` in project root** is an old prototype and should be archived/removed to avoid confusion.
3. **No Supabase client library** — using raw `fetch()` calls instead of `@supabase/supabase-js`. Installing the client would simplify auth, realtime, and query logic significantly.
4. **No error boundaries** — uncaught async errors will silently fail.
5. **No `.gitignore` for .env** — ensure environment secrets aren't committed once moved.

---

## Summary Verdict

UXOHire has a strong, well-designed frontend shell — the UI is polished, the domain model is clear, and the cert logic is thoughtful. The core gap is the backend plumbing: live data, payment completion, and auth. With focused effort on Phases 1–2, the product can be generating real revenue. Auth and interaction flows in Phase 3–4 are what turns it from a showcase into a real marketplace.

**Estimated MVP effort:** 3–4 weeks of focused full-stack development (Phases 1–3).
