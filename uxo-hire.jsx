import { useState } from "react";

const SAMPLE_JOBS = [
  {
    id: 1,
    company: "Ordnance Solutions Group",
    title: "Senior UXO Tech II",
    location: "Huntsville, AL",
    type: "Contract",
    certs: ["DOD UXO Tech II", "OSHA 40-HR"],
    salary: "$45–$55/hr",
    posted: "2 days ago",
    description: "Seeking experienced UXO Tech II for munitions response project on former military range. Must have active clearance and 5+ years field experience.",
  },
  {
    id: 2,
    company: "Clearance Corp Inc.",
    title: "UXO Tech I – Field Survey",
    location: "San Diego, CA",
    type: "Full-Time",
    certs: ["DOD UXO Tech I"],
    salary: "$38–$44/hr",
    posted: "5 days ago",
    description: "Entry-level UXO Tech I needed for underwater UXO survey operations. Dive certification a plus. Travel required.",
  },
  {
    id: 3,
    company: "Apex Munitions Response",
    title: "UXO Quality Control Specialist",
    location: "Remote / Travel",
    type: "Contract",
    certs: ["DOD UXO Tech III", "QC Certification"],
    salary: "$65–$80/hr",
    posted: "1 week ago",
    description: "QC Specialist needed to oversee field teams across multiple sites. Must hold Tech III and have prior QC experience.",
  },
];

const SAMPLE_TECHS = [
  {
    id: 1,
    name: "Marcus R.",
    location: "Fayetteville, NC",
    experience: "8 years",
    certs: ["DOD UXO Tech III", "OSHA 40-HR", "SECRET Clearance"],
    available: true,
    summary: "Former EOD technician with 8 years of civilian UXO experience. Specializes in range clearance and DP operations.",
  },
  {
    id: 2,
    name: "Denise K.",
    location: "Tampa, FL",
    experience: "5 years",
    certs: ["DOD UXO Tech II", "OSHA 40-HR", "Dive Certified"],
    available: true,
    summary: "UXO Tech II with underwater survey background. Available for coastal and inland water projects.",
  },
  {
    id: 3,
    name: "James T.",
    location: "Anchorage, AK",
    experience: "12 years",
    certs: ["DOD UXO Tech III", "QC Certification", "TS/SCI Clearance"],
    available: false,
    summary: "Senior technician currently on project. Available Q3 2026. Expertise in Alaska and Pacific Northwest operations.",
  },
];

const CERT_OPTIONS = [
  "DOD UXO Tech I",
  "DOD UXO Tech II",
  "DOD UXO Tech III",
  "OSHA 40-HR",
  "QC Certification",
  "SECRET Clearance",
  "TS/SCI Clearance",
  "Dive Certified",
  "CDL License",
];

const TAG_COLORS = {
  "DOD UXO Tech I": "#1a6b4a",
  "DOD UXO Tech II": "#1a4a6b",
  "DOD UXO Tech III": "#4a1a6b",
  "OSHA 40-HR": "#6b4a1a",
  "QC Certification": "#6b1a3a",
  "SECRET Clearance": "#8B0000",
  "TS/SCI Clearance": "#8B0000",
  "Dive Certified": "#0d5f7a",
  "CDL License": "#3a5a1a",
};

export default function UXOHire() {
  const [view, setView] = useState("jobs"); // jobs | techs | postJob | techProfile | landing
  const [activeJob, setActiveJob] = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [openToWork, setOpenToWork] = useState(true);
  const [profileStep, setProfileStep] = useState(1);
  const [postStep, setPostStep] = useState(1);
  const [filterCert, setFilterCert] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

  // Profile form state
  const [profile, setProfile] = useState({
    name: "",
    location: "",
    experience: "",
    summary: "",
    certs: [],
  });

  // Job post form state
  const [jobPost, setJobPost] = useState({
    company: "",
    title: "",
    location: "",
    type: "Contract",
    salary: "",
    description: "",
    certs: [],
  });

  const filteredJobs = SAMPLE_JOBS.filter((j) => {
    const certMatch = filterCert ? j.certs.includes(filterCert) : true;
    const locMatch = filterLocation
      ? j.location.toLowerCase().includes(filterLocation.toLowerCase())
      : true;
    return certMatch && locMatch;
  });

  const availableTechs = SAMPLE_TECHS.filter((t) => t.available);

  const toggleCert = (cert, target, setter) => {
    setter((prev) => ({
      ...prev,
      [target]: prev[target].includes(cert)
        ? prev[target].filter((c) => c !== cert)
        : [...prev[target], cert],
    }));
  };

  return (
    <div style={styles.root}>
      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => setView("jobs")}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>UXO<span style={styles.logoAccent}>hire</span></span>
          </div>
          <div style={styles.navLinks}>
            <button style={view === "jobs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("jobs")}>Browse Jobs</button>
            <button style={view === "techs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("techs")}>Find Techs</button>
            <button style={styles.navCTA} onClick={() => setView("postJob")}>Post a Job →</button>
          </div>
        </div>
      </nav>

      <main style={styles.main}>

        {/* ── JOBS VIEW ── */}
        {view === "jobs" && !activeJob && (
          <div>
            <div style={styles.hero}>
              <div style={styles.heroBadge}>The UXO Industry's Job Board</div>
              <h1 style={styles.heroTitle}>Find Your Next<br /><span style={styles.heroAccent}>UXO Assignment</span></h1>
              <p style={styles.heroSub}>Connecting certified UXO technicians with the companies that need them most.</p>
              <div style={styles.heroActions}>
                <button style={styles.btnPrimary} onClick={() => setView("techProfile")}>Create Tech Profile</button>
                <button style={styles.btnSecondary} onClick={() => setView("postJob")}>Post a Job</button>
              </div>
            </div>

            {/* Filters */}
            <div style={styles.filterBar}>
              <select style={styles.filterSelect} value={filterCert} onChange={e => setFilterCert(e.target.value)}>
                <option value="">All Certifications</option>
                {CERT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                style={styles.filterInput}
                placeholder="Filter by location..."
                value={filterLocation}
                onChange={e => setFilterLocation(e.target.value)}
              />
              <span style={styles.filterCount}>{filteredJobs.length} positions</span>
            </div>

            {/* Job Cards */}
            <div style={styles.cardGrid}>
              {filteredJobs.map(job => (
                <div key={job.id} style={styles.jobCard} onClick={() => setActiveJob(job)}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.cardCompany}>{job.company}</div>
                      <div style={styles.cardTitle}>{job.title}</div>
                    </div>
                    <div style={styles.cardBadge}>{job.type}</div>
                  </div>
                  <div style={styles.cardMeta}>
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary}</span>
                  </div>
                  <div style={styles.certTags}>
                    {job.certs.map(c => (
                      <span key={c} style={{ ...styles.certTag, background: TAG_COLORS[c] || "#333" }}>{c}</span>
                    ))}
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardPosted}>Posted {job.posted}</span>
                    <span style={styles.cardLink}>View Details →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── JOB DETAIL ── */}
        {view === "jobs" && activeJob && (
          <div style={styles.detailWrap}>
            <button style={styles.backBtn} onClick={() => setActiveJob(null)}>← Back to Jobs</button>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <div>
                  <div style={styles.cardCompany}>{activeJob.company}</div>
                  <h2 style={styles.detailTitle}>{activeJob.title}</h2>
                  <div style={styles.cardMeta}>
                    <span>📍 {activeJob.location}</span>
                    <span>💰 {activeJob.salary}</span>
                    <span>🗂 {activeJob.type}</span>
                  </div>
                </div>
                <div style={styles.cardBadge}>{activeJob.type}</div>
              </div>
              <div style={styles.divider} />
              <h3 style={styles.sectionLabel}>Required Certifications</h3>
              <div style={styles.certTags}>
                {activeJob.certs.map(c => (
                  <span key={c} style={{ ...styles.certTag, background: TAG_COLORS[c] || "#333" }}>{c}</span>
                ))}
              </div>
              <h3 style={styles.sectionLabel}>Job Description</h3>
              <p style={styles.detailDesc}>{activeJob.description}</p>
              <button style={styles.btnPrimary}>Apply Now</button>
            </div>
          </div>
        )}

        {/* ── TECHS VIEW ── */}
        {view === "techs" && !activeTech && (
          <div>
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>Available UXO Technicians</h2>
              <p style={styles.pageSub}>Certified techs actively open to new assignments. <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); setView("techProfile"); }}>Create your profile →</a></p>
            </div>
            <div style={styles.cardGrid}>
              {availableTechs.map(tech => (
                <div key={tech.id} style={styles.jobCard} onClick={() => setActiveTech(tech)}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.cardTitle}>{tech.name}</div>
                      <div style={styles.cardCompany}>{tech.location} · {tech.experience} exp.</div>
                    </div>
                    <div style={{ ...styles.availBadge, background: tech.available ? "#1a4a2e" : "#3a2a1a", color: tech.available ? "#4ade80" : "#f59e0b" }}>
                      {tech.available ? "● Open to Work" : "● On Project"}
                    </div>
                  </div>
                  <p style={styles.techSummary}>{tech.summary}</p>
                  <div style={styles.certTags}>
                    {tech.certs.map(c => (
                      <span key={c} style={{ ...styles.certTag, background: TAG_COLORS[c] || "#333" }}>{c}</span>
                    ))}
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardLink}>View Profile →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TECH DETAIL ── */}
        {view === "techs" && activeTech && (
          <div style={styles.detailWrap}>
            <button style={styles.backBtn} onClick={() => setActiveTech(null)}>← Back to Techs</button>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={styles.detailTitle}>{activeTech.name}</h2>
                  <div style={styles.cardMeta}>
                    <span>📍 {activeTech.location}</span>
                    <span>⏱ {activeTech.experience} experience</span>
                  </div>
                </div>
                <div style={{ ...styles.availBadge, background: activeTech.available ? "#1a4a2e" : "#3a2a1a", color: activeTech.available ? "#4ade80" : "#f59e0b" }}>
                  {activeTech.available ? "● Open to Work" : "● On Project"}
                </div>
              </div>
              <div style={styles.divider} />
              <h3 style={styles.sectionLabel}>Certifications</h3>
              <div style={styles.certTags}>
                {activeTech.certs.map(c => (
                  <span key={c} style={{ ...styles.certTag, background: TAG_COLORS[c] || "#333" }}>{c}</span>
                ))}
              </div>
              <h3 style={styles.sectionLabel}>Summary</h3>
              <p style={styles.detailDesc}>{activeTech.summary}</p>
              {activeTech.available && <button style={styles.btnPrimary}>Contact This Tech</button>}
            </div>
          </div>
        )}

        {/* ── TECH PROFILE CREATION ── */}
        {view === "techProfile" && (
          <div style={styles.formWrap}>
            <button style={styles.backBtn} onClick={() => setView("jobs")}>← Back</button>
            <div style={styles.formCard}>
              <div style={styles.formSteps}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ ...styles.step, ...(profileStep >= s ? styles.stepActive : {}) }}>{s}</div>
                ))}
              </div>
              <h2 style={styles.formTitle}>
                {profileStep === 1 && "Your Basic Info"}
                {profileStep === 2 && "Certifications & Experience"}
                {profileStep === 3 && "Availability Settings"}
              </h2>

              {profileStep === 1 && (
                <div style={styles.formFields}>
                  <label style={styles.label}>Full Name</label>
                  <input style={styles.input} placeholder="John Smith" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} placeholder="City, State" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
                  <label style={styles.label}>Years of Experience</label>
                  <input style={styles.input} placeholder="e.g. 6 years" value={profile.experience} onChange={e => setProfile(p => ({ ...p, experience: e.target.value }))} />
                  <label style={styles.label}>Professional Summary</label>
                  <textarea style={styles.textarea} placeholder="Brief overview of your background..." value={profile.summary} onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} />
                  <button style={styles.btnPrimary} onClick={() => setProfileStep(2)}>Next →</button>
                </div>
              )}

              {profileStep === 2 && (
                <div style={styles.formFields}>
                  <label style={styles.label}>Select Your Certifications</label>
                  <div style={styles.certGrid}>
                    {CERT_OPTIONS.map(cert => (
                      <div
                        key={cert}
                        style={{ ...styles.certToggle, ...(profile.certs.includes(cert) ? styles.certToggleActive : {}) }}
                        onClick={() => toggleCert(cert, "certs", setProfile)}
                      >
                        {profile.certs.includes(cert) ? "✓ " : ""}{cert}
                      </div>
                    ))}
                  </div>
                  <label style={styles.label}>Upload Certificate Files</label>
                  <div style={styles.uploadBox}>
                    <span style={styles.uploadIcon}>📎</span>
                    <p style={styles.uploadText}>Drag & drop cert files here, or click to browse</p>
                    <p style={styles.uploadSub}>PDF, JPG, PNG accepted · Max 10MB each</p>
                    <button style={styles.btnSecondary}>Browse Files</button>
                  </div>
                  <div style={styles.formRow}>
                    <button style={styles.btnSecondary} onClick={() => setProfileStep(1)}>← Back</button>
                    <button style={styles.btnPrimary} onClick={() => setProfileStep(3)}>Next →</button>
                  </div>
                </div>
              )}

              {profileStep === 3 && (
                <div style={styles.formFields}>
                  <label style={styles.label}>Job Availability</label>
                  <div style={styles.toggleRow}>
                    <div style={styles.toggleInfo}>
                      <div style={styles.toggleTitle}>Open to Work</div>
                      <div style={styles.toggleSub}>When active, companies can find and contact you for opportunities.</div>
                    </div>
                    <div style={{ ...styles.toggleSwitch, background: openToWork ? "#d97706" : "#333" }} onClick={() => setOpenToWork(o => !o)}>
                      <div style={{ ...styles.toggleKnob, transform: openToWork ? "translateX(24px)" : "translateX(0)" }} />
                    </div>
                  </div>
                  <div style={styles.availNote}>
                    {openToWork
                      ? "✅ Your profile will be visible to hiring companies."
                      : "🔒 Your profile is hidden from company searches."}
                  </div>
                  <div style={styles.formRow}>
                    <button style={styles.btnSecondary} onClick={() => setProfileStep(2)}>← Back</button>
                    <button style={styles.btnPrimary} onClick={() => { alert("Profile created! (Demo mode)"); setView("techs"); setProfileStep(1); }}>Submit Profile ✓</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── POST A JOB ── */}
        {view === "postJob" && (
          <div style={styles.formWrap}>
            <button style={styles.backBtn} onClick={() => setView("jobs")}>← Back</button>
            <div style={styles.formCard}>
              <div style={styles.formSteps}>
                {[1, 2, 3].map(s => (
                  <div key={s} style={{ ...styles.step, ...(postStep >= s ? styles.stepActive : {}) }}>{s}</div>
                ))}
              </div>
              <h2 style={styles.formTitle}>
                {postStep === 1 && "Company & Role Details"}
                {postStep === 2 && "Requirements & Description"}
                {postStep === 3 && "Review & Payment"}
              </h2>

              {postStep === 1 && (
                <div style={styles.formFields}>
                  <label style={styles.label}>Company Name</label>
                  <input style={styles.input} placeholder="Your company name" value={jobPost.company} onChange={e => setJobPost(p => ({ ...p, company: e.target.value }))} />
                  <label style={styles.label}>Job Title</label>
                  <input style={styles.input} placeholder="e.g. UXO Tech II – Range Clearance" value={jobPost.title} onChange={e => setJobPost(p => ({ ...p, title: e.target.value }))} />
                  <label style={styles.label}>Location</label>
                  <input style={styles.input} placeholder="City, State or Remote/Travel" value={jobPost.location} onChange={e => setJobPost(p => ({ ...p, location: e.target.value }))} />
                  <label style={styles.label}>Employment Type</label>
                  <select style={styles.input} value={jobPost.type} onChange={e => setJobPost(p => ({ ...p, type: e.target.value }))}>
                    <option>Contract</option>
                    <option>Full-Time</option>
                    <option>Part-Time</option>
                    <option>Temporary</option>
                  </select>
                  <label style={styles.label}>Salary / Pay Rate</label>
                  <input style={styles.input} placeholder="e.g. $45–$55/hr or $85,000/yr" value={jobPost.salary} onChange={e => setJobPost(p => ({ ...p, salary: e.target.value }))} />
                  <button style={styles.btnPrimary} onClick={() => setPostStep(2)}>Next →</button>
                </div>
              )}

              {postStep === 2 && (
                <div style={styles.formFields}>
                  <label style={styles.label}>Required Certifications</label>
                  <div style={styles.certGrid}>
                    {CERT_OPTIONS.map(cert => (
                      <div
                        key={cert}
                        style={{ ...styles.certToggle, ...(jobPost.certs.includes(cert) ? styles.certToggleActive : {}) }}
                        onClick={() => toggleCert(cert, "certs", setJobPost)}
                      >
                        {jobPost.certs.includes(cert) ? "✓ " : ""}{cert}
                      </div>
                    ))}
                  </div>
                  <label style={styles.label}>Job Description</label>
                  <textarea style={{ ...styles.textarea, minHeight: "140px" }} placeholder="Describe the role, site conditions, project duration, and any other requirements..." value={jobPost.description} onChange={e => setJobPost(p => ({ ...p, description: e.target.value }))} />
                  <div style={styles.formRow}>
                    <button style={styles.btnSecondary} onClick={() => setPostStep(1)}>← Back</button>
                    <button style={styles.btnPrimary} onClick={() => setPostStep(3)}>Next →</button>
                  </div>
                </div>
              )}

              {postStep === 3 && (
                <div style={styles.formFields}>
                  <div style={styles.reviewCard}>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Company</span><span>{jobPost.company || "—"}</span></div>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Title</span><span>{jobPost.title || "—"}</span></div>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Location</span><span>{jobPost.location || "—"}</span></div>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Type</span><span>{jobPost.type}</span></div>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Pay</span><span>{jobPost.salary || "—"}</span></div>
                  </div>
                  <div style={styles.pricingBox}>
                    <div style={styles.pricingTitle}>Job Posting Fee</div>
                    <div style={styles.pricingAmount}>$149 <span style={styles.pricingPer}>/ 30 days</span></div>
                    <ul style={styles.pricingFeatures}>
                      <li>✓ Listed to all qualified, active techs</li>
                      <li>✓ Matched to techs by certification</li>
                      <li>✓ Direct contact with candidates</li>
                      <li>✓ Re-post or extend anytime</li>
                    </ul>
                  </div>
                  <div style={styles.formRow}>
                    <button style={styles.btnSecondary} onClick={() => setPostStep(2)}>← Back</button>
                    <button style={styles.btnPrimary} onClick={() => { alert("Payment flow coming soon! (Demo mode)"); setView("jobs"); setPostStep(1); }}>Pay & Post Job →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <span style={styles.logoText}>UXO<span style={styles.logoAccent}>hire</span></span>
          <span style={styles.footerSub}>The specialized job board for the UXO industry.</span>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  root: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: "#0d0f10",
    color: "#e8e4dc",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    background: "#111316",
    borderBottom: "1px solid #222",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  navInner: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px",
    height: 64,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
    userSelect: "none",
  },
  logoIcon: {
    fontSize: 22,
    color: "#d97706",
  },
  logoText: {
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: "-0.5px",
    color: "#e8e4dc",
  },
  logoAccent: {
    color: "#d97706",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  navLink: {
    background: "none",
    border: "none",
    color: "#9a9490",
    cursor: "pointer",
    padding: "8px 14px",
    fontSize: 15,
    borderRadius: 6,
    fontFamily: "inherit",
    transition: "color 0.2s",
  },
  navLinkActive: {
    background: "none",
    border: "none",
    color: "#e8e4dc",
    cursor: "pointer",
    padding: "8px 14px",
    fontSize: 15,
    borderRadius: 6,
    fontFamily: "inherit",
    fontWeight: "bold",
  },
  navCTA: {
    background: "#d97706",
    border: "none",
    color: "#0d0f10",
    cursor: "pointer",
    padding: "8px 18px",
    fontSize: 14,
    borderRadius: 6,
    fontWeight: "bold",
    fontFamily: "inherit",
    marginLeft: 8,
    letterSpacing: "0.3px",
  },
  main: {
    flex: 1,
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 24px 60px",
    width: "100%",
    boxSizing: "border-box",
  },
  hero: {
    padding: "72px 0 48px",
    borderBottom: "1px solid #1e2022",
    marginBottom: 36,
  },
  heroBadge: {
    display: "inline-block",
    background: "#1a1408",
    border: "1px solid #3a2a08",
    color: "#d97706",
    fontSize: 12,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "4px 12px",
    borderRadius: 20,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: "bold",
    lineHeight: 1.1,
    margin: "0 0 16px",
    letterSpacing: "-1px",
  },
  heroAccent: {
    color: "#d97706",
  },
  heroSub: {
    fontSize: 18,
    color: "#9a9490",
    maxWidth: 480,
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  heroActions: {
    display: "flex",
    gap: 12,
  },
  btnPrimary: {
    background: "#d97706",
    border: "none",
    color: "#0d0f10",
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: "bold",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
  btnSecondary: {
    background: "transparent",
    border: "1px solid #333",
    color: "#e8e4dc",
    padding: "12px 24px",
    fontSize: 15,
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  filterBar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  filterSelect: {
    background: "#161819",
    border: "1px solid #2a2c2e",
    color: "#e8e4dc",
    padding: "9px 14px",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
    minWidth: 200,
  },
  filterInput: {
    background: "#161819",
    border: "1px solid #2a2c2e",
    color: "#e8e4dc",
    padding: "9px 14px",
    borderRadius: 6,
    fontSize: 14,
    fontFamily: "inherit",
    minWidth: 200,
    outline: "none",
  },
  filterCount: {
    color: "#6a6660",
    fontSize: 13,
    marginLeft: "auto",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: 20,
  },
  jobCard: {
    background: "#111316",
    border: "1px solid #1e2022",
    borderRadius: 10,
    padding: "20px 22px",
    cursor: "pointer",
    transition: "border-color 0.2s, transform 0.1s",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardCompany: {
    fontSize: 12,
    color: "#7a7570",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e8e4dc",
    lineHeight: 1.3,
  },
  cardBadge: {
    background: "#1a2a1a",
    color: "#4ade80",
    fontSize: 11,
    padding: "3px 9px",
    borderRadius: 12,
    whiteSpace: "nowrap",
    marginLeft: 10,
    letterSpacing: "0.05em",
  },
  availBadge: {
    fontSize: 11,
    padding: "3px 10px",
    borderRadius: 12,
    whiteSpace: "nowrap",
    marginLeft: 10,
    letterSpacing: "0.05em",
  },
  cardMeta: {
    display: "flex",
    gap: 16,
    fontSize: 13,
    color: "#7a7570",
    marginBottom: 14,
    flexWrap: "wrap",
  },
  certTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  certTag: {
    fontSize: 11,
    padding: "3px 9px",
    borderRadius: 4,
    color: "#e8e4dc",
    letterSpacing: "0.04em",
    opacity: 0.9,
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cardPosted: {
    fontSize: 12,
    color: "#555",
  },
  cardLink: {
    fontSize: 13,
    color: "#d97706",
    fontWeight: "bold",
  },
  techSummary: {
    fontSize: 13,
    color: "#8a8580",
    lineHeight: 1.5,
    margin: "8px 0 14px",
  },
  // Detail views
  detailWrap: {
    paddingTop: 32,
  },
  backBtn: {
    background: "none",
    border: "none",
    color: "#d97706",
    cursor: "pointer",
    fontSize: 14,
    padding: "0 0 20px",
    fontFamily: "inherit",
    display: "block",
  },
  detailCard: {
    background: "#111316",
    border: "1px solid #1e2022",
    borderRadius: 12,
    padding: "32px 36px",
    maxWidth: 720,
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  detailTitle: {
    fontSize: 28,
    fontWeight: "bold",
    margin: "4px 0 10px",
    letterSpacing: "-0.5px",
  },
  divider: {
    height: 1,
    background: "#1e2022",
    margin: "20px 0",
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#6a6660",
    margin: "0 0 12px",
  },
  detailDesc: {
    fontSize: 15,
    color: "#b0aca6",
    lineHeight: 1.7,
    margin: "0 0 24px",
  },
  // Page headers
  pageHeader: {
    padding: "48px 0 32px",
    borderBottom: "1px solid #1e2022",
    marginBottom: 36,
  },
  pageTitle: {
    fontSize: 36,
    fontWeight: "bold",
    margin: "0 0 8px",
    letterSpacing: "-0.5px",
  },
  pageSub: {
    fontSize: 15,
    color: "#7a7570",
    margin: 0,
  },
  inlineLink: {
    color: "#d97706",
    textDecoration: "none",
  },
  // Forms
  formWrap: {
    paddingTop: 32,
    maxWidth: 600,
  },
  formCard: {
    background: "#111316",
    border: "1px solid #1e2022",
    borderRadius: 12,
    padding: "36px 40px",
  },
  formSteps: {
    display: "flex",
    gap: 8,
    marginBottom: 28,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#1e2022",
    color: "#555",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: "bold",
  },
  stepActive: {
    background: "#d97706",
    color: "#0d0f10",
  },
  formTitle: {
    fontSize: 24,
    fontWeight: "bold",
    margin: "0 0 24px",
    letterSpacing: "-0.3px",
  },
  formFields: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  label: {
    fontSize: 13,
    color: "#8a8580",
    marginBottom: 2,
    letterSpacing: "0.04em",
  },
  input: {
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 6,
    color: "#e8e4dc",
    padding: "10px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  textarea: {
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 6,
    color: "#e8e4dc",
    padding: "10px 14px",
    fontSize: 15,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    minHeight: 100,
    resize: "vertical",
  },
  certGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  certToggle: {
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 6,
    color: "#8a8580",
    padding: "7px 13px",
    fontSize: 13,
    cursor: "pointer",
    userSelect: "none",
    transition: "all 0.15s",
  },
  certToggleActive: {
    background: "#1a2a08",
    border: "1px solid #4ade80",
    color: "#4ade80",
  },
  uploadBox: {
    border: "2px dashed #2a2c2e",
    borderRadius: 8,
    padding: "28px 20px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
  },
  uploadIcon: {
    fontSize: 28,
  },
  uploadText: {
    fontSize: 14,
    color: "#8a8580",
    margin: 0,
  },
  uploadSub: {
    fontSize: 12,
    color: "#555",
    margin: "0 0 10px",
  },
  formRow: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
  },
  toggleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 8,
    padding: "16px 18px",
  },
  toggleInfo: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  toggleSub: {
    fontSize: 13,
    color: "#6a6660",
    lineHeight: 1.4,
  },
  toggleSwitch: {
    width: 50,
    height: 26,
    borderRadius: 13,
    cursor: "pointer",
    position: "relative",
    transition: "background 0.2s",
    flexShrink: 0,
    marginLeft: 16,
  },
  toggleKnob: {
    position: "absolute",
    top: 3,
    left: 3,
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#fff",
    transition: "transform 0.2s",
  },
  availNote: {
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 6,
    padding: "12px 16px",
    fontSize: 14,
    color: "#8a8580",
  },
  // Review & pricing
  reviewCard: {
    background: "#0d0f10",
    border: "1px solid #2a2c2e",
    borderRadius: 8,
    padding: "18px 20px",
    marginBottom: 20,
  },
  reviewRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: "1px solid #1a1c1e",
    fontSize: 14,
  },
  reviewLabel: {
    color: "#6a6660",
  },
  pricingBox: {
    background: "#12100a",
    border: "1px solid #3a2a08",
    borderRadius: 10,
    padding: "22px 24px",
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#d97706",
    marginBottom: 6,
  },
  pricingAmount: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 14,
    letterSpacing: "-1px",
  },
  pricingPer: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#6a6660",
  },
  pricingFeatures: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 14,
    color: "#9a9490",
  },
  footer: {
    borderTop: "1px solid #1a1c1e",
    padding: "24px",
  },
  footerInner: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  footerSub: {
    fontSize: 13,
    color: "#555",
  },
};
