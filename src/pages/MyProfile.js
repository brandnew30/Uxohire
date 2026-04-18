import styles from "../styles/theme";
import { CERT_COLORS } from "../utils/constants";

export default function MyProfile({ user, myProfile, myProfileLoading, onToggleAvailability, goToCreateProfile, navigate, onBack }) {
  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back to Jobs</button>
      <div style={styles.formCard} data-form-card>
        <h2 style={styles.formTitle} data-form-title>My Profile</h2>
        {!user ? (
          <p style={{ color: '#7a7570' }}>You must be logged in to view your profile.</p>
        ) : myProfileLoading ? (
          <p style={{ color: '#7a7570' }}>Loading...</p>
        ) : !myProfile ? (
          <div style={styles.formFields} data-form-fields>
            <p style={{ color: '#9a9490', fontSize: 15 }}>You haven't created a tech profile yet.</p>
            <button style={styles.btnPrimary} data-btn-primary onClick={goToCreateProfile}>Create Tech Profile</button>
          </div>
        ) : (
          <div style={styles.formFields} data-form-fields>
            <div style={styles.detailHeader}>
              <div>
                <h3 style={{ ...styles.detailTitle, fontSize: 22 }}>{myProfile.name}</h3>
                <div style={styles.cardMeta}>
                  <span>{"\uD83D\uDCCD"} {myProfile.location}</span>
                  <span>{"\u23F1"} {myProfile.uxoHours} UXO hrs</span>
                  <span>{"\u2708\uFE0F"} {myProfile.travel}</span>
                </div>
              </div>
            </div>
            <div style={styles.divider} />

            <div style={styles.toggleRow} data-toggle-row>
              <div style={styles.toggleInfo}>
                <div style={styles.toggleTitle}>Open to Work</div>
                <div style={styles.toggleSub}>When active, companies can find and contact you.</div>
              </div>
              <div style={{ ...styles.toggleSwitch, background: myProfile.available ? '#d97706' : '#333' }} data-toggle-switch onClick={onToggleAvailability}>
                <div style={{ ...styles.toggleKnob, transform: myProfile.available ? 'translateX(24px)' : 'translateX(0)' }} />
              </div>
            </div>
            <div style={styles.availNote}>
              {myProfile.available ? '\u2705 Your profile is visible to hiring companies.' : '\uD83D\uDD12 Your profile is hidden from company searches.'}
            </div>

            <div style={styles.divider} />
            <h3 style={styles.sectionLabel} data-section-label>DOD Certifications</h3>
            <div style={styles.certTags} data-cert-tags>
              {myProfile.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || '#333' }} data-cert-tag>{c}</span>)}
            </div>
            <h3 style={styles.sectionLabel} data-section-label>Summary</h3>
            <p style={styles.detailDesc}>{myProfile.summary}</p>

            <button style={styles.btnPrimary} data-btn-primary onClick={() => navigate('/create-profile')}>
              Edit Profile {"\u2192"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
