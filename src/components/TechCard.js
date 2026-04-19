import styles from "../styles/theme";
import { CERT_COLORS } from "../utils/constants";

export default function TechCard({ tech, onClick, isFreeEmployer }) {
  // Free employers see only name, roles/certs, and state/region
  const displayLocation = isFreeEmployer && tech.location
    ? tech.location.split(',').pop()?.trim() || tech.location
    : tech.location;

  return (
    <div style={styles.jobCard} data-tech-card onClick={onClick}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.cardTitle} data-card-title>{tech.name}</div>
          <div style={styles.cardCompany} data-card-company>{displayLocation}</div>
        </div>
        <div style={{ ...styles.availBadge, background: "#1a4a2e", color: "#4ade80" }}>{"\u25CF"} Open to Work</div>
      </div>
      <div style={styles.cardMeta}>
        <span>{"\u23F1"} {tech.uxoHours} UXO hrs</span>
        <span>{"\u2708\uFE0F"} {tech.travel}</span>
      </div>
      {!isFreeEmployer && <p style={styles.techSummary}>{tech.summary}</p>}
      <div style={styles.certTags} data-cert-tags>
        {tech.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || "#333" }} data-cert-tag>{c}</span>)}
        {tech.hazwoper40 && <span style={{ ...styles.certTag, background: "#1a4a2e" }} data-cert-tag>HAZWOPER 40-HR</span>}
        {tech.diveCert && <span style={{ ...styles.certTag, background: "#0d5f7a" }} data-cert-tag>Dive Certified</span>}
        {tech.clearance && <span style={{ ...styles.certTag, background: "#8B0000" }} data-cert-tag>Clearance: {tech.clearanceLevel}</span>}
      </div>
      {tech.jobRolePreference === 'specific' && (tech.specificRoles || []).length > 0 && (
        <div style={{ marginTop: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: '#6a6660', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{"\uD83C\uDFAF"} Seeking Roles</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tech.specificRoles.map(role => (
              <span key={role} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#1a1408', border: '1px solid #d9770633', color: '#d97706' }}>{role}</span>
            ))}
          </div>
        </div>
      )}
      {tech.jobRolePreference === 'any' && (
        <div style={{ fontSize: 12, color: '#4ade80', marginTop: 8, marginBottom: 4 }}>
          {"\u2705"} Open to any qualifying role
        </div>
      )}
      <div style={styles.cardFooter}>
        <span style={styles.cardLink}>{isFreeEmployer ? 'View Limited Profile' : 'View Profile'} {"\u2192"}</span>
      </div>
    </div>
  );
}
