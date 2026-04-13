-- Migration 017: Create notifications table
-- Tracks in-app and future email alerts for expiring certifications.
-- Polling: frontend checks on dashboard load for unsent/upcoming alerts.
-- Email delivery: follow-on work via Supabase Edge Function.

CREATE TABLE IF NOT EXISTS notifications (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tech_profile_id  uuid REFERENCES tech_profiles(id) ON DELETE CASCADE NOT NULL,
  cert_type        text NOT NULL,
  -- cert_type values:
  --   'hazwoper_8'     — HAZWOPER 8-hour annual refresher
  --   'dod_cert'       — DOD UXO certification renewal
  --   'first_aid_cpr'  — First Aid / CPR (2-year)
  --   'state_license'  — State-specific license
  --   'physical'       — Annual physical exam
  alert_days       integer NOT NULL,
  -- How many days before expiry this alert fires (60 or 30)
  expiry_date      date NOT NULL,
  -- The cert's expiry date at time of notification creation
  scheduled_for    date NOT NULL,
  -- Date the notification should be surfaced (expiry_date - alert_days)
  sent_at          timestamptz,
  -- NULL = not yet sent/shown. Set to now() when surfaced.
  dismissed_at     timestamptz,
  -- NULL = not dismissed. Set when user dismisses the in-app banner.
  email            text,
  -- Recipient email (populated from tech_profiles.email at creation time)
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Techs can read their own notifications
CREATE POLICY "Techs can read own notifications" ON notifications
  FOR SELECT USING (
    tech_profile_id IN (
      SELECT id FROM tech_profiles WHERE user_id = auth.uid()
    )
  );

-- Techs can dismiss (update) their own notifications
CREATE POLICY "Techs can dismiss own notifications" ON notifications
  FOR UPDATE USING (
    tech_profile_id IN (
      SELECT id FROM tech_profiles WHERE user_id = auth.uid()
    )
  );

-- Service role (edge functions) can insert and update all
-- No INSERT policy for authenticated users — notifications created server-side
-- or via the upsert logic in the dashboard polling function

-- Index for efficient polling queries
CREATE INDEX IF NOT EXISTS notifications_profile_idx
  ON notifications (tech_profile_id, scheduled_for, dismissed_at);
