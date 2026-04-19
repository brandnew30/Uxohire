import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "../styles/theme";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase auto-exchanges the token from the email link on page load
    // via onAuthStateChange. Wait for the PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });
    // Also check if we already have a session (token already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(updateError.message);
    else {
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate("/login", { state: { resetSuccess: true } }), 2000);
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#0d0f10", color: "#e8e4dc", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...styles.formCard, maxWidth: 480, width: "100%" }} data-form-card>
        <h2 style={styles.formTitle} data-form-title>Set New Password</h2>
        {success ? (
          <div style={styles.formFields} data-form-fields>
            <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '14px 18px', color: '#4ade80', fontSize: 14 }}>
              {"\u2705"} Password updated successfully! Redirecting to login...
            </div>
          </div>
        ) : !sessionReady ? (
          <div style={styles.formFields} data-form-fields>
            <p style={{ color: '#9a9490', fontSize: 14, textAlign: 'center' }}>
              Verifying your reset link...
            </p>
          </div>
        ) : (
          <div style={styles.formFields} data-form-fields>
            <label style={styles.label}>New Password</label>
            <input style={styles.input} type="password" placeholder="Enter new password" value={password}
              onChange={e => setPassword(e.target.value)} />
            <label style={styles.label}>Confirm Password</label>
            <input style={styles.input} type="password" placeholder="Confirm new password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleReset(); }} />
            {error && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {error}</div>}
            <button style={styles.btnPrimary} data-btn-primary onClick={handleReset} disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
