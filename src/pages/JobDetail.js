import { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "../styles/theme";

export default function JobDetail({ job, myProfile, user, onBack }) {
  const [applyView, setApplyView] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', message: '' });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email) {
      setApplyError('Name and email are required.');
      return;
    }
    setApplySubmitting(true);
    setApplyError('');
    const { error } = await supabase.from('applications').insert({
      job_id: job.id,
      applicant_name: applyForm.name,
      applicant_email: applyForm.email,
      message: applyForm.message,
      ...(myProfile ? { tech_profile_id: myProfile.id } : {}),
    });
    setApplySubmitting(false);
    if (error) setApplyError('Something went wrong. Please try again.');
    else setApplySuccess(true);
  };

  return (
    <div style={styles.detailWrap} data-detail-wrap>
      <button style={styles.backBtn} data-back-btn onClick={() => { onBack(); }}>
        {"\u2190"} Back to Jobs
      </button>
      <div style={styles.detailCard} data-detail-card>
        <div style={styles.detailHeader}>
          <div>
            <div style={styles.cardCompany}>{job.company}</div>
            <h2 style={styles.detailTitle}>{job.title}</h2>
            <div style={styles.cardMeta}>
              <span>{"\uD83D\uDCCD"} {job.location}</span>
              <span>{"\uD83D\uDCB0"} {job.salary}</span>
              <span>{"\uD83D\uDDC2"} {job.type}</span>
            </div>
          </div>
        </div>
        <div style={styles.divider} />
        <h3 style={styles.sectionLabel} data-section-label>Required Certifications</h3>
        <div style={styles.certTags} data-cert-tags>
          {job.requiredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#8B0000" }} data-cert-tag>{c}</span>)}
        </div>
        {job.preferredCerts.length > 0 && (
          <>
            <h3 style={styles.sectionLabel} data-section-label>Preferred Certifications</h3>
            <div style={styles.certTags} data-cert-tags>
              {job.preferredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#1a3a5a" }} data-cert-tag>{c}</span>)}
            </div>
          </>
        )}
        <h3 style={styles.sectionLabel} data-section-label>Job Description</h3>
        <p style={styles.detailDesc}>{job.description}</p>

        {!applyView && !applySuccess && (
          <button style={styles.btnPrimary} data-btn-primary onClick={() => {
            setApplyForm({ name: myProfile?.name || '', email: myProfile?.email || user?.email || '', message: '' });
            setApplyError('');
            setApplyView(true);
          }}>Apply Now</button>
        )}

        {applySuccess && (
          <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '16px 20px', color: '#4ade80', fontSize: 14 }}>
            {"\u2705"} Application submitted! The employer will review your application and reach out to you directly.
          </div>
        )}

        {applyView && !applySuccess && (
          <div style={{ marginTop: 16, background: '#0d0f10', border: '1px solid #2a2c2e', borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ ...styles.sectionLabel, marginTop: 0 }}>Apply for {job.title}</h3>
            <div style={styles.formFields} data-form-fields>
              <label style={styles.label}>Your Name</label>
              <input style={styles.input} value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              <label style={styles.label}>Email Address</label>
              <input style={styles.input} type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
              <label style={styles.label}>Cover Note (optional)</label>
              <textarea style={styles.textarea} value={applyForm.message} onChange={e => setApplyForm(f => ({ ...f, message: e.target.value }))} placeholder="Brief note about your background and interest..." />
              {applyError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {applyError}</div>}
              <div style={styles.formRow} data-form-row>
                <button style={styles.btnSecondary} data-btn-secondary onClick={() => { setApplyView(false); setApplyError(''); }}>Cancel</button>
                <button style={styles.btnPrimary} data-btn-primary onClick={handleApply} disabled={applySubmitting}>
                  {applySubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
