import styles from "../styles/theme";

export default function LoginPage({ authForm, setAuthForm, authError, authLoading, onLogin, onBack, onSwitchToSignup, onForgotPassword, resetSuccess }) {
  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      <div style={styles.formCard} data-form-card>
        <h2 style={styles.formTitle} data-form-title>Log In</h2>
        <div style={styles.formFields} data-form-fields>
          {resetSuccess && (
            <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '14px 18px', color: '#4ade80', fontSize: 14 }}>
              {"\u2705"} Password reset successfully! Please log in with your new password.
            </div>
          )}
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="Your password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
          {authError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {authError}</div>}
          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <span style={{ color: '#d97706', cursor: 'pointer', fontSize: 13 }} onClick={onForgotPassword}>Forgot Password?</span>
          </div>
          <button style={styles.btnPrimary} data-btn-primary onClick={onLogin} disabled={authLoading}>
            {authLoading ? 'Logging in...' : 'Log In'}
          </button>
          <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
            Don't have an account?{' '}
            <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={onSwitchToSignup}>Sign up</span>
          </p>
        </div>
      </div>
    </div>
  );
}
