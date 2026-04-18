import styles from "../styles/theme";
import { CERT_COLORS } from "../utils/constants";

export default function TechCard({ tech, onClick }) {
  return (
    <div style={styles.jobCard} data-tech-card onClick={onClick}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.cardTitle} data-card-title>{tech.name}</div>
          <div style={styles.cardCompany} data-card-company>{tech.location}</div>
        </div>
        <div style={{ ...styles.availBadge, background: "#1a4a2e", color: "#4ade80" }}>{"\u25CF"} Open to Work</div>
      </div>
      <div style={styles.cardMeta}>
        <span>{"\u23F1"} {tech.uxoHours} UXO hrs</span>
        <span>{"\u2708\uFE0F"} {tech.travel}</span>
      </div>
      <p style={styles.techSummary}>{tech.summary}</p>
      <div style={styles.certTags} data-cert-tags>
        {tech.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || "#333" }} data-cert-tag>{c}</span>)}
        {tech.hazwoper40 && <span style={{ ...styles.certTag, background: "#1a4a2e" }} data-cert-tag>HAZWOPER 40-HR</span>}
        {tech.diveCert && <span style={{ ...styles.certTag, background: "#0d5f7a" }} data-cert-tag>Dive Certified</span>}
        {tech.clearance && <span style={{ ...styles.certTag, background: "#8B0000" }} data-cert-tag>Clearance: {tech.clearanceLevel}</span>}
      </div>
      <div style={styles.cardFooter}>
        <span style={styles.cardLink}>View Profile {"\u2192"}</span>
      </div>
    </div>
  );
}
