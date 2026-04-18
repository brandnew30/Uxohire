import { useState } from "react";
import styles from "../styles/theme";

export default function Navbar({ view, setView, user, navigate, onSignOut }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navTo = (v) => { setView(v); setMobileMenuOpen(false); };
  const navPath = (path) => { navigate(path); setMobileMenuOpen(false); };

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
          <button style={styles.navCTA} onClick={() => setView("postJob")}>Post a Job {"\u2192"}</button>
          {!user ? (
            <>
              <button style={styles.navLink} onClick={() => navigate('/login')}>Log In</button>
              <button style={{ ...styles.navCTA, background: '#d97706' }} onClick={() => navigate('/signup')}>Sign Up</button>
            </>
          ) : (
            <>
              <span style={{ color: '#7a7570', fontSize: 13, padding: '0 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
              <button style={{ ...styles.navCTA, background: '#1a1408', border: '1px solid #d97706', color: '#d97706' }} onClick={() => navigate('/dashboard')}>Dashboard</button>
              <button style={{ ...styles.navCTA, background: '#1a1408', border: '1px solid #78716c', color: '#a8a29e', marginLeft: 4 }} onClick={() => navigate('/employer-dashboard')}>Employer Hub</button>
              <button style={styles.navLink} onClick={onSignOut}>Log Out</button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          data-hamburger-menu
          style={{ display: 'none', background: 'none', border: 'none', color: '#d97706', fontSize: 24, cursor: 'pointer', padding: '0 8px', fontFamily: 'inherit' }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          {"\u2630"}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div style={styles.navLinks} data-mobile-nav>
          <button style={view === "jobs" ? styles.navLinkActive : styles.navLink} onClick={() => navTo("jobs")}>Browse Jobs</button>
          <button style={view === "techs" ? styles.navLinkActive : styles.navLink} onClick={() => navTo("techs")}>Find Techs</button>
          <button style={styles.navCTA} onClick={() => navTo("postJob")}>Post a Job</button>
          {!user ? (
            <>
              <button style={styles.navLink} onClick={() => navPath('/login')}>Log In</button>
              <button style={{ ...styles.navCTA, background: '#d97706' }} onClick={() => navPath('/signup')}>Sign Up</button>
            </>
          ) : (
            <>
              <span style={{ color: '#7a7570', fontSize: 13, padding: '16px 24px', display: 'block' }}>Signed in as: {user.email}</span>
              <button style={{ ...styles.navCTA, background: '#1a1408', border: '1px solid #d97706', color: '#d97706' }} onClick={() => navPath('/dashboard')}>Dashboard</button>
              <button style={{ ...styles.navCTA, background: '#1a1408', border: '1px solid #78716c', color: '#a8a29e' }} onClick={() => navPath('/employer-dashboard')}>Employer Hub</button>
              <button style={styles.navLink} onClick={() => { onSignOut(); setMobileMenuOpen(false); }}>Log Out</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
