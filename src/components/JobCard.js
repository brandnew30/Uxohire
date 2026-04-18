import styles from "../styles/theme";

export default function JobCard({ job, onClick }) {
  return (
    <div style={styles.jobCard} data-job-card onClick={onClick}>
      <div style={styles.cardTop}>
        <div>
          <div style={styles.cardCompany} data-card-company>{job.company}</div>
          <div style={styles.cardTitle} data-card-title>{job.title}</div>
        </div>
        <div style={styles.cardBadge}>{job.type}</div>
      </div>
      <div style={styles.cardMeta}>
        <span>{"\uD83D\uDCCD"} {job.location}</span>
        <span>{"\uD83D\uDCB0"} {job.salary}</span>
      </div>
      <div style={styles.certSection}>
        <div style={styles.certLabel} data-section-label>Required:</div>
        <div style={styles.certTags} data-cert-tags>
          {job.requiredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#8B0000" }} data-cert-tag>{c}</span>)}
        </div>
        {job.preferredCerts.length > 0 && (
          <>
            <div style={styles.certLabel} data-section-label>Preferred:</div>
            <div style={styles.certTags} data-cert-tags>
              {job.preferredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#1a3a5a" }} data-cert-tag>{c}</span>)}
            </div>
          </>
        )}
      </div>
      <div style={styles.cardFooter}>
        <span style={styles.cardPosted}>Posted {job.posted}</span>
        <span style={styles.cardLink}>View Details {"\u2192"}</span>
      </div>
    </div>
  );
}
