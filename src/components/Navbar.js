import { useState } from "react";
import styles from "../styles/theme";

export default function Navbar({ view, setView, user, myProfile, navigate, onSignOut, accountType }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navTo = (v) => { setView(v); setMobileMenuOpen(false); };
  const navPath = (path) => { navigate(path); setMobileMenuOpen(false); };

  const displayName = myProfile?.name || user?.email || '';
  const isEmployer = accountType === 'employer';
  const dashboardPath = isEmployer ? '/employer-dashboard' : '/dashboard';
  const dashboardLabel = isEmployer ? 'Employer Hub' : 'Dashboard';

  return (
    <nav style={styles.nav}>
      <div style={styles.navInner} data-nav-inner>
        <div style={styles.logo} onClick={() => navTo("jobs")}>
          <span style={styles.logoIcon}>{"\u2B21"}</span>
          <span style={styles.logoText}>UXO<span style={styles.logoAccent}>hire</span></span>
        </div>

        {/* Desktop Navigation */}
        <div style={styles.navLinks} data-nav-links>
          <button style={view === "jobs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("jobs")}>Browse Jobs</button>
          <button style={view === "techs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("techs")}>Find Techs</button>
          {isEmployer && (
            <button style={styles.navCTA} onClick={() => setView("postJob")}>Post a Job {"\u2192"}</button>
          )}
          {!user ? (
            <>
              <button style={styles.navLink} onClick={() => navigate('/login')}>Log In</button>
              <button style={{ ...styles.navCTA, background: '#d97706' }} onClick={() => navigate('/signup')}>Sign Up</button>
            </>
          ) : (
            <>
              <span style={{
                color: '#d97706', fontSize: 13, fontWeight: 'bold', padding: '0 10px',
                maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                borderLeft: '1px solid #333', marginLeft: 4
              }}>
                {displayName}
              </span>
              <button style={{
                ...styles.navCTA, background: '#d97706', color: '#0d0f10',
                fontWeight: 'bold', border: 'none'
              }} onClick={() => navigate(dashboardPath)}>
                {dashboardLabel}
              </button>
              <button style={{
                ...styles.navLink, color: '#f87171'
              }} onClick={onSignOut}>Log Out</button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div style={{ display: 'none', alignItems: 'center', gap: 8 }} data-hamburger-wrap>
          {user && (
            <span style={{
              color: '#d97706', fontSize: 12, fontWeight: 'bold',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              background: '#1a1408', border: '1px solid #d9770633', borderRadius: 12,
              padding: '3px 10px'
            }}>
              {myProfile?.name || 'Signed In'}
            </span>
          )}
          <button
            data-hamburger-menu
            style={{ background: 'none', border: 'none', color: '#d97706', fontSize: 24, cursor: 'pointer', padding: '0 8px', fontFamily: 'inherit' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? "\u2715" : "\u2630"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div style={{
          ...styles.navLinks,
          borderTop: '1px solid #222',
          paddingTop: 8,
          paddingBottom: 12,
        }} data-mobile-nav>
          {user && (
            <div style={{
              padding: '12px 24px', margin: '0 0 4px',
              background: '#1a1408', borderRadius: 8,
              borderLeft: '3px solid #d97706'
            }}>
              <div style={{ fontSize: 11, color: '#7a7570', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                Signed in as {isEmployer ? '(Employer)' : '(Technician)'}
              </div>
              <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: 14 }}>
                {displayName}
              </div>
              {myProfile?.name && (
                <div style={{ color: '#7a7570', fontSize: 11, marginTop: 1 }}>{user.email}</div>
              )}
            </div>
          )}
          <button style={view === "jobs" ? styles.navLinkActive : styles.navLink} onClick={() => navTo("jobs")}>Browse Jobs</button>
          <button style={view === "techs" ? styles.navLinkActive : styles.navLink} onClick={() => navTo("techs")}>Find Techs</button>
          {isEmployer && (
            <button style={styles.navCTA} onClick={() => navTo("postJob")}>Post a Job</button>
          )}
          {!user ? (
            <>
              <button style={styles.navLink} onClick={() => navPath('/login')}>Log In</button>
              <button style={{ ...styles.navCTA, background: '#d97706' }} onClick={() => navPath('/signup')}>Sign Up</button>
            </>
          ) : (
            <>
              <button style={{
                ...styles.navCTA, background: '#d97706', color: '#0d0f10',
                fontWeight: 'bold', border: 'none', width: '100%', textAlign: 'center'
              }} onClick={() => navPath(dashboardPath)}>
                {dashboardLabel}
              </button>
              <button style={{
                ...styles.navLink, color: '#f87171', width: '100%', textAlign: 'center',
                marginTop: 4, borderTop: '1px solid #222', paddingTop: 12
              }} onClick={() => { onSignOut(); setMobileMenuOpen(false); }}>
                Log Out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
