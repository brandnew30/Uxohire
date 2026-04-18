import styles from "../styles/theme";
import { ALL_CERT_OPTIONS } from "../utils/constants";
import JobCard from "../components/JobCard";

export default function JobsView({
  filteredJobs, filterCert, setFilterCert, filterLocation, setFilterLocation,
  dataLoading, setActiveJob, goToCreateProfile, setView, user, myProfile, navigate,
}) {
  return (
    <div>
      <div style={styles.hero} data-hero>
        <div style={styles.heroBadge}>The UXO Industry's Job Board</div>
        <h1 style={styles.heroTitle} data-hero-title>
          Find Your Next<br />
          <span style={styles.heroAccent}>UXO Assignment</span>
        </h1>
        <p style={styles.heroSub} data-hero-subtitle>
          Connecting certified UXO technicians with the companies that need them most.
        </p>
        <div style={styles.heroActions} data-hero-actions>
          {user && myProfile ? (
            <button style={styles.btnPrimary} data-btn-primary onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          ) : user && !myProfile ? (
            <button style={styles.btnPrimary} data-btn-primary onClick={goToCreateProfile}>Complete Your Profile</button>
          ) : (
            <button style={styles.btnPrimary} data-btn-primary onClick={goToCreateProfile}>Create Tech Profile</button>
          )}
          <button style={styles.btnSecondary} data-btn-secondary onClick={() => setView("postJob")}>Post a Job</button>
        </div>
      </div>
      <div style={styles.filterBar} data-filter-bar>
        <select style={styles.filterSelect} data-filter-select value={filterCert} onChange={e => setFilterCert(e.target.value)}>
          <option value="">All Certifications</option>
          {ALL_CERT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input style={styles.filterInput} data-filter-input placeholder="Filter by location..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
        <span style={styles.filterCount} data-filter-count>{filteredJobs.length} positions</span>
      </div>
      <div style={styles.cardGrid} data-card-grid>
        {dataLoading && (
          <div style={{ color: '#7a7570', fontSize: 14, padding: '20px 0' }}>Loading listings...</div>
        )}
        {filteredJobs.map(job => (
          <JobCard key={job.id} job={job} onClick={() => setActiveJob(job)} />
        ))}
      </div>
    </div>
  );
}
