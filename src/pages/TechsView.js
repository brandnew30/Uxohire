import styles from "../styles/theme";
import TechCard from "../components/TechCard";

export default function TechsView({ techs, setActiveTech, goToCreateProfile, user, myProfile, navigate }) {
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
          ) : (
            <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); goToCreateProfile(); }}>
              Create your profile {"\u2192"}
            </a>
          )}
        </p>
      </div>
      <div style={styles.cardGrid} data-card-grid>
        {techs.map(tech => (
          <TechCard key={tech.id} tech={tech} onClick={() => setActiveTech(tech)} />
        ))}
      </div>
    </div>
  );
}
