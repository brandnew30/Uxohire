import styles from "../styles/theme";
import TechCard from "../components/TechCard";

export default function TechsView({ techs, setActiveTech, goToCreateProfile, user, myProfile, navigate, accountType, isPaidEmployer }) {
  // If the viewer is a tech (has a profile), hide techs who opted out of tech visibility
  const isTech = accountType === 'technician' || !!myProfile;
  const visibleTechs = isTech ? techs.filter(t => t.visibleToTechs !== false) : techs;
  const isFreeEmployer = accountType === 'employer' && !isPaidEmployer;

  return (
    <div>
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle} data-page-title>Available UXO Technicians</h2>
        <p style={styles.pageSub} data-page-subtitle>
          Certified techs actively open to new assignments.{' '}
          {user && myProfile ? (
            <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); navigate('/dashboard'); }}>
              Go to Dashboard {"\u2192"}
            </a>
          ) : user && accountType === 'employer' ? (
            <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); navigate('/employer-dashboard'); }}>
              Go to Employer Hub {"\u2192"}
            </a>
          ) : (
            <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); goToCreateProfile(); }}>
              Create your profile {"\u2192"}
            </a>
          )}
        </p>
      </div>

      {isFreeEmployer && (
        <div style={{
          background: '#1a1408', border: '1px solid #d97706', borderRadius: 8,
          padding: '14px 20px', marginBottom: 20, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: 14 }}>
              {"\uD83D\uDD12"} Upgrade to view full profiles and contact information
            </div>
            <div style={{ color: '#9a9490', fontSize: 12, marginTop: 2 }}>
              Free accounts can see name, role, certifications, and general region only.
            </div>
          </div>
          <button style={{
            background: '#d97706', border: 'none', color: '#0d0f10', padding: '8px 18px',
            fontSize: 13, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
            flexShrink: 0,
          }} onClick={() => window.alert('Subscription feature coming soon!')}>
            Upgrade Now
          </button>
        </div>
      )}

      <div style={styles.cardGrid} data-card-grid>
        {visibleTechs.map(tech => (
          <TechCard key={tech.id} tech={tech} onClick={() => setActiveTech(tech)}
            isFreeEmployer={isFreeEmployer} />
        ))}
      </div>
    </div>
  );
}
