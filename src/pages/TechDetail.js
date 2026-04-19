import { useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "../styles/theme";
import { CERT_COLORS } from "../utils/constants";

export default function TechDetail({ tech, user, onBack, accountType, isPaidEmployer }) {
  const [contactView, setContactView] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  const isEmployer = accountType === 'employer';
  const isFreeEmployer = isEmployer && !isPaidEmployer;
  const canContact = !isFreeEmployer; // techs and paid employers can contact

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactError('Name, email, and message are required.');
      return;
    }
    setContactSubmitting(true);
    setContactError('');
    const { error } = await supabase.from('contacts').insert({
      tech_profile_id: tech.id,
      employer_name: contactForm.name,
      employer_email: contactForm.email,
      company: contactForm.company,
      message: contactForm.message,
    });
    setContactSubmitting(false);
    if (error) setContactError('Something went wrong. Please try again.');
    else setContactSuccess(true);
  };

  // For free employers, mask location to state/region only
  const displayLocation = isFreeEmployer && tech.location
    ? tech.location.split(',').pop()?.trim() || tech.location
    : tech.location;

  return (
    <div style={styles.detailWrap} data-detail-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back to Techs</button>
      <div style={styles.detailCard} data-detail-card>
        <div style={styles.detailHeader}>
          <div>
            <h2 style={styles.detailTitle}>{tech.name}</h2>
            <div style={styles.cardMeta}>
              <span>{"\uD83D\uDCCD"} {displayLocation}</span>
              <span>{"\u23F1"} {tech.uxoHours} UXO hrs</span>
              <span>{"\u2708\uFE0F"} {tech.travel}</span>
            </div>
          </div>
          <div style={{ ...styles.availBadge, background: "#1a4a2e", color: "#4ade80" }}>{"\u25CF"} Open to Work</div>
        </div>
        <div style={styles.divider} />

        {/* Upgrade banner for free employers */}
        {isFreeEmployer && (
          <div style={{
            background: '#1a1408', border: '1px solid #d97706', borderRadius: 8,
            padding: '16px 20px', marginBottom: 20, textAlign: 'center',
          }}>
            <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>
              {"\uD83D\uDD12"} Upgrade to View Full Profile
            </div>
            <div style={{ color: '#9a9490', fontSize: 13, lineHeight: 1.5, marginBottom: 12 }}>
              Subscribe to view full contact information, detailed location, and send messages to technicians.
            </div>
            <button style={{
              background: '#d97706', border: 'none', color: '#0d0f10', padding: '10px 24px',
              fontSize: 14, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            }} onClick={() => window.alert('Subscription feature coming soon!')}>
              Upgrade Now
            </button>
          </div>
        )}

        <h3 style={styles.sectionLabel} data-section-label>Certifications</h3>
        <div style={styles.certTags} data-cert-tags>
          {tech.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || "#333" }} data-cert-tag>{c}</span>)}
        </div>
        <h3 style={styles.sectionLabel} data-section-label>Qualifications</h3>
        <div style={styles.qualGrid} data-qual-grid>
          {[
            ["HAZWOPER 40-HR", tech.hazwoper40],
            ["8-HR Refresher", tech.hazwoper8],
            ["Current Physical", tech.physicalCurrent],
            ["Military/EOD", tech.militaryEod],
            ["Security Clearance", tech.clearance, tech.clearance ? tech.clearanceLevel : null],
            ["Dive Certified", tech.diveCert],
            ["Driver's License", tech.driversLicense],
            ["CDL", tech.cdl],
          ].map(([label, val, extra]) => (
            <div key={label} style={styles.qualItem}>
              <span style={styles.qualLabel}>{label}</span>
              <span style={val ? styles.qualYes : styles.qualNo}>
                {val ? (extra ? `\u2713 ${extra}` : "\u2713 Yes") : "\u2717 No"}
              </span>
            </div>
          ))}
        </div>

        {!isFreeEmployer && (
          <>
            <h3 style={styles.sectionLabel} data-section-label>Summary</h3>
            <p style={styles.detailDesc}>{tech.summary}</p>
          </>
        )}

        {/* Contact section */}
        {isFreeEmployer && (
          <div style={{
            background: '#111316', border: '1px solid #2a2c2e', borderRadius: 8,
            padding: '20px 24px', marginTop: 20, textAlign: 'center',
          }}>
            <div style={{ color: '#9a9490', fontSize: 14 }}>
              {"\uD83D\uDD12"} Subscribe to contact this technician
            </div>
          </div>
        )}

        {canContact && !contactView && !contactSuccess && (
          <button style={styles.btnPrimary} data-btn-primary onClick={() => {
            setContactForm({ name: '', email: user?.email || '', company: '', message: '' });
            setContactError('');
            setContactView(true);
          }}>Contact This Tech</button>
        )}

        {contactSuccess && (
          <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '16px 20px', color: '#4ade80', fontSize: 14 }}>
            {"\u2705"} Message sent! The technician will be notified and will reach out to you directly.
          </div>
        )}

        {contactView && !contactSuccess && canContact && (
          <div style={{ marginTop: 16, background: '#0d0f10', border: '1px solid #2a2c2e', borderRadius: 8, padding: '20px 24px' }}>
            <h3 style={{ ...styles.sectionLabel, marginTop: 0 }}>Contact {tech.name}</h3>
            <div style={styles.formFields} data-form-fields>
              <label style={styles.label}>Your Name</label>
              <input style={styles.input} value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
              <label style={styles.label}>Your Email</label>
              <input style={styles.input} type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
              <label style={styles.label}>Company (optional)</label>
              <input style={styles.input} value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} placeholder="Your company name" />
              <label style={styles.label}>Message</label>
              <textarea style={styles.textarea} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe the role, project, and why you'd like to connect..." />
              {contactError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {contactError}</div>}
              <div style={styles.formRow} data-form-row>
                <button style={styles.btnSecondary} data-btn-secondary onClick={() => { setContactView(false); setContactError(''); }}>Cancel</button>
                <button style={styles.btnPrimary} data-btn-primary onClick={handleContact} disabled={contactSubmitting}>
                  {contactSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
