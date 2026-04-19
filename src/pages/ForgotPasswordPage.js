import { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "../styles/theme";

export default function ForgotPasswordPage({ onBack, onSwitchToLogin }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) setError(resetError.message);
    else setSent(true);
  };

  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      <div style={styles.formCard} data-form-card>
        <h2 style={styles.formTitle} data-form-title>Reset Password</h2>
        {sent ? (
          <div style={styles.formFields} data-form-fields>
            <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '14px 18px', color: '#4ade80', fontSize: 14 }}>
              {"\u2705"} Password reset email sent! Check your inbox and follow the link to reset your password.
            </div>
            <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
              Back to{' '}
              <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={onSwitchToLogin}>Log In</span>
            </p>
          </div>
        ) : (
          <div style={styles.formFields} data-form-fields>
            <p style={{ color: '#9a9490', fontSize: 14, margin: '0 0 8px', lineHeight: 1.5 }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }} />
            {error && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {error}</div>}
            <button style={styles.btnPrimary} data-btn-primary onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
              Remember your password?{' '}
              <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={onSwitchToLogin}>Log In</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
