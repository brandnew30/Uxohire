import { useState } from "react";
import styles from "../styles/theme";

export default function SignupPage({ authForm, setAuthForm, authError, authLoading, onSignUp, onBack, onSwitchToLogin }) {
  const [accountType, setAccountType] = useState(null); // null = choosing, 'technician' or 'employer'

  if (!accountType) {
    return (
      <div style={styles.formWrap} data-form-wrap>
        <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
        <div style={styles.formCard} data-form-card>
          <h2 style={styles.formTitle} data-form-title>Create Account</h2>
          <p style={{ color: '#9a9490', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
            Choose your account type to get started.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              onClick={() => setAccountType('technician')}
              style={{
                background: '#0d0f10', border: '2px solid #2a2c2e', borderRadius: 10,
                padding: '24px 20px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2c2e'}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{"\uD83E\uDE96"}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e8e4dc', marginBottom: 6 }}>I'm a Technician</div>
              <div style={{ fontSize: 13, color: '#7a7570', lineHeight: 1.5 }}>
                Create your UXO technician profile, track certifications, and get matched with jobs.
              </div>
            </div>
            <div
              onClick={() => setAccountType('employer')}
              style={{
                background: '#0d0f10', border: '2px solid #2a2c2e', borderRadius: 10,
                padding: '24px 20px', cursor: 'pointer', transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#d97706'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2c2e'}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>{"\uD83C\uDFE2"}</div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#e8e4dc', marginBottom: 6 }}>I'm an Employer</div>
              <div style={{ fontSize: 13, color: '#7a7570', lineHeight: 1.5 }}>
                Post jobs, browse certified technicians, and manage your hiring pipeline.
              </div>
            </div>
          </div>
          <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center', marginTop: 16 }}>
            Already have an account?{' '}
            <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={onSwitchToLogin}>Log in</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      <div style={styles.formCard} data-form-card>
        <h2 style={styles.formTitle} data-form-title>Create Account</h2>
        <div style={{
          display: 'inline-block', background: accountType === 'technician' ? '#1a2a08' : '#1a1408',
          border: `1px solid ${accountType === 'technician' ? '#4ade80' : '#d97706'}`,
          color: accountType === 'technician' ? '#4ade80' : '#d97706',
          fontSize: 12, padding: '3px 10px', borderRadius: 12, marginBottom: 16,
          cursor: 'pointer',
        }} onClick={() => setAccountType(null)}>
          {accountType === 'technician' ? '\uD83E\uDE96 Technician' : '\uD83C\uDFE2 Employer'} Account {"\u2022"} Change
        </div>
        <div style={styles.formFields} data-form-fields>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="Minimum 6 characters" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
          {authError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {authError}</div>}
          <button style={styles.btnPrimary} data-btn-primary onClick={() => onSignUp(accountType)} disabled={authLoading}>
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
