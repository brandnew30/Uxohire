-- Allow employers to read contacts they have sent to tech profiles.
-- contacts.employer_email stores the email address of the employer who sent the message.
-- We match it against the authenticated user's email from auth.users.

CREATE POLICY "Employers can read contacts they sent" ON contacts
  FOR SELECT USING (
    employer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
