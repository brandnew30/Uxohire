import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "../styles/theme";

export default function EmployerOnboarding({ user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: user?.email || '',
    phone: '', website: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim()) {
      setError('Company name, contact name, and email are required.');
      return;
    }
    setLoading(true); setError('');
    const { error: dbError } = await supabase.from('employer_profiles').upsert({
      user_id: user.id,
      company_name: form.companyName,
      contact_name: form.contactName,
      email: form.email,
      phone: form.phone || null,
      website: form.website || null,
    }, { onConflict: 'user_id' });
    setLoading(false);
    if (dbError) setError('Something went wrong. Please try again.');
    else navigate('/employer-dashboard', { replace: true });
  };

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: "#0d0f10", color: "#e8e4dc", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 560, margin: '40px auto' }}>
        <div style={styles.formCard} data-form-card>
          <div style={{ fontSize: 32, marginBottom: 12 }}>{"\uD83C\uDFE2"}</div>
          <h2 style={styles.formTitle} data-form-title>Set Up Your Company</h2>
          <p style={{ color: '#9a9490', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
            Complete your employer profile to start posting jobs and browsing technicians.
          </p>
          <div style={styles.formFields} data-form-fields>
            <label style={styles.label}>Company Name *</label>
            <input style={styles.input} placeholder="Acme UXO Services" value={form.companyName}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
            <label style={styles.label}>Contact Name *</label>
            <input style={styles.input} placeholder="Jane Smith" value={form.contactName}
              onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} />
            <label style={styles.label}>Email *</label>
            <input style={styles.input} type="email" placeholder="hiring@company.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <label style={styles.label}>Phone</label>
            <input style={styles.input} type="tel" placeholder="(555) 123-4567" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <label style={styles.label}>Company Website</label>
            <input style={styles.input} placeholder="https://www.company.com" value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            {error && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {error}</div>}
            <button style={styles.btnPrimary} data-btn-primary onClick={handleSubmit} disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup \u2192'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
