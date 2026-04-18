import styles from "../styles/theme";

export default function SignupPage({ authForm, setAuthForm, authError, authLoading, onSignUp, onBack, onSwitchToLogin }) {
  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      <div style={styles.formCard} data-form-card>
        <h2 style={styles.formTitle} data-form-title>Create Account</h2>
        <div style={styles.formFields} data-form-fields>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="Minimum 6 characters" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
          {authError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {authError}</div>}
          <button style={styles.btnPrimary} data-btn-primary onClick={onSignUp} disabled={authLoading}>
            {authLoading ? 'Creating account...' : 'Create Account'}
          </button>
          <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
            Already have an account?{' '}
            <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={onSwitchToLogin}>Log in</span>
          </p>
        </div>
      </div>
    </div>
  );
}
