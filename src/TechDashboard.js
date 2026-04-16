import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

// ─── Career progression thresholds ───────────────────────────────────────────
const LEVELS = [
  { label: "UXO Tech I",     min: 0,    max: 499  },
  { label: "UXO Tech II",    min: 500,  max: 1999 },
  { label: "Senior Tech",    min: 2000, max: 4999 },
  { label: "QC Specialist",  min: 5000, max: null },
];

function getLevel(hours) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (hours >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
}

// ─── Cert status helpers ──────────────────────────────────────────────────────
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function certStatus(expiryDateStr) {
  const days = daysUntil(expiryDateStr);
  if (days === null) return { status: "none", days: null };
  if (days < 0)   return { status: "expired",  days };
  if (days <= 30) return { status: "critical",  days };
  if (days <= 60) return { status: "warning",   days };
  return { status: "active", days };
}

const STATUS_COLOR = {
  lifetime: "#4ade80",
  active:   "#4ade80",
  warning:  "#fbbf24",
  critical: "#f87171",
  expired:  "#f87171",
  missing:  "#555",
  none:     "#555",
};

const STATUS_BG = {
  lifetime: "#0a2a1a",
  active:   "#0a2a1a",
  warning:  "#2a1e08",
  critical: "#2a0a0a",
  expired:  "#2a0a0a",
  missing:  "#1a1c1e",
  none:     "#1a1c1e",
};

function StatusBadge({ status, days }) {
  const color = STATUS_COLOR[status] || "#555";
  const bg    = STATUS_BG[status]    || "#1a1c1e";
  let label;
  if (status === "lifetime") label = "Lifetime";
  else if (status === "active")   label = days != null ? `${days}d` : "Active";
  else if (status === "warning")  label = `${days}d`;
  else if (status === "critical") label = `${days}d`;
  else if (status === "expired")  label = "Expired";
  else label = "Not Set";
  return (
    <span style={{ background: bg, color, fontSize: 11, padding: "3px 9px",
                   borderRadius: 12, fontWeight: "bold", whiteSpace: "nowrap",
                   border: `1px solid ${color}33` }}>
      ● {label}
    </span>
  );
}

// ─── Job match scoring ────────────────────────────────────────────────────────
// Map cert labels used in job_posts to profile boolean/array fields
function techCertSet(profile) {
  const certs = new Set();
  (profile.dod_certs || []).forEach(c => certs.add(c));
  if (profile.hazwoper_40)     certs.add("HAZWOPER 40-HR");
  if (profile.hazwoper_8)      certs.add("8-HR HAZWOPER Refresher");
  if (profile.physical_current) certs.add("Current Physical");
  if (profile.clearance)       certs.add("Security Clearance");
  if (profile.dive_cert)       certs.add("Dive Certified");
  if (profile.drivers_license) certs.add("Driver's License");
  if (profile.cdl)             certs.add("CDL");
  if (profile.military_eod)    certs.add("Military/EOD Background");
  if (profile.first_aid_cpr)   certs.add("First Aid/CPR");
  return certs;
}

function scoreJob(job, profile) {
  const techCerts  = techCertSet(profile);
  const required   = job.required_certs  || [];
  const preferred  = job.preferred_certs || [];

  const metRequired  = required.filter(c => techCerts.has(c));
  const metPreferred = preferred.filter(c => techCerts.has(c));
  const missedReq    = required.filter(c => !techCerts.has(c));

  const qualified = missedReq.length === 0;

  // Score: required certs met + partial preferred credit
  const reqScore  = required.length  > 0 ? (metRequired.length  / required.length)  * 70 : 70;
  const prefScore = preferred.length > 0 ? (metPreferred.length / preferred.length) * 30 : 30;
  const matchPct  = Math.round(reqScore + prefScore);

  return { qualified, matchPct, metRequired, metPreferred, missedReq };
}

// ─── Notification upsert (client-side polling logic) ─────────────────────────
async function upsertNotifications(profile) {
  if (!profile?.id || !profile?.email) return [];

  const expiringCerts = [
    { cert_type: "hazwoper_8",    expiry: profile.hazwoper_8_expiry  },
    { cert_type: "dod_cert",      expiry: profile.dod_cert_expiry    },
    { cert_type: "first_aid_cpr", expiry: profile.first_aid_cpr_expiry },
    { cert_type: "state_license", expiry: profile.state_license_expiry },
    { cert_type: "physical",      expiry: profile.physical_date       },
  ].filter(c => c.expiry);

  const toUpsert = [];
  for (const { cert_type, expiry } of expiringCerts) {
    for (const alert_days of [60, 30]) {
      const expiryDate    = new Date(expiry);
      const scheduledFor  = new Date(expiryDate);
      scheduledFor.setDate(scheduledFor.getDate() - alert_days);

      toUpsert.push({
        tech_profile_id: profile.id,
        cert_type,
        alert_days,
        expiry_date:    expiry,
        scheduled_for:  scheduledFor.toISOString().split("T")[0],
        email:          profile.email,
      });
    }
  }

  if (toUpsert.length === 0) return [];

  // Use upsert with conflict target — idempotent on cert_type + alert_days + expiry_date
  const { data } = await supabase
    .from("notifications")
    .upsert(toUpsert, {
      onConflict: "tech_profile_id,cert_type,alert_days,expiry_date",
      ignoreDuplicates: true,
    })
    .select();

  // Fetch active (scheduled, undismissed) notifications due today or earlier
  const today = new Date().toISOString().split("T")[0];
  const { data: active } = await supabase
    .from("notifications")
    .select("*")
    .eq("tech_profile_id", profile.id)
    .lte("scheduled_for", today)
    .is("dismissed_at", null);

  return active || [];
}

// ─── Main dashboard component ─────────────────────────────────────────────────
export default function TechDashboard({ user }) {
  const navigate = useNavigate();
  const [profile, setProfile]       = useState(null);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState("jobs");
  const [notifications, setNotifications] = useState([]);
  const [dismissing, setDismissing] = useState(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    loadDashboard();
  }, [user]); // eslint-disable-line

  const loadDashboard = useCallback(async () => {
    setLoading(true);

    const [{ data: prof }, { data: jobData }] = await Promise.all([
      supabase
        .from("tech_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("job_posts")
        .select("*")
        .in("status", ["published", "pending_payment"])
        .order("created_at", { ascending: false }),
    ]);

    setProfile(prof || null);
    setJobs(jobData || []);

    if (prof) {
      const notifs = await upsertNotifications(prof);
      setNotifications(notifs);
    }
    setLoading(false);
  }, [user]);

  const dismissNotification = async (id) => {
    setDismissing(id);
    await supabase
      .from("notifications")
      .update({ dismissed_at: new Date().toISOString() })
      .eq("id", id);
    setNotifications(n => n.filter(x => x.id !== id));
    setDismissing(null);
  };

  if (loading) return (
    <div style={s.root}>
      <div style={{ color: "#7a7570", padding: 40, textAlign: "center" }}>
        Loading dashboard…
      </div>
    </div>
  );

  if (!profile) return (
    <div style={s.root}>
      <div style={s.emptyCard}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🪖</div>
        <h2 style={s.emptyTitle}>No Tech Profile Found</h2>
        <p style={s.emptyMsg}>Create your technician profile to access your dashboard.</p>
        <button style={s.btnPrimary} onClick={() => navigate("/create-profile")}>
          Create Profile →
        </button>
      </div>
    </div>
  );

  const hours = profile.total_field_hours || 0;
  const currentLevel  = getLevel(hours);
  const nextLevel     = LEVELS[currentLevel.index + 1] || null;
  const progressPct   = nextLevel
    ? Math.min(100, Math.round(((hours - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100))
    : 100;

  const scoredJobs = jobs
    .map(job => ({ ...job, ...scoreJob(job, profile) }))
    .filter(j => j.qualified)
    .sort((a, b) => b.matchPct - a.matchPct);

  const CERT_LABELS = {
    hazwoper_8:    "HAZWOPER 8-HR Refresher",
    dod_cert:      "DOD UXO Certification",
    first_aid_cpr: "First Aid / CPR",
    state_license: "State License",
    physical:      "Annual Physical",
  };

  const navItems = [
    { id: "jobs",   label: "Job Matches",  icon: "🎯" },
    { id: "certs",  label: "Cert Tracker", icon: "📋" },
    { id: "career", label: "Career",       icon: "📈" },
  ];

  return (
    <div style={s.root}>
      {/* ── Header ── */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <div style={s.headerLabel}>Tech Dashboard</div>
            <div style={s.headerName}>{profile.name}</div>
          </div>
          <div style={s.headerRight}>
            {notifications.length > 0 && (
              <div style={s.notifBell}>
                🔔 <span style={s.notifCount}>{notifications.length}</span>
              </div>
            )}
            <button style={s.backBtn} onClick={() => navigate("/")}>← Home</button>
          </div>
        </div>
      </div>

      {/* ── Notification banners ── */}
      {notifications.length > 0 && (
        <div style={s.notifWrap}>
          {notifications.map(n => {
            const days = daysUntil(n.expiry_date);
            const urgent = days !== null && days <= 30;
            return (
              <div key={n.id} style={{ ...s.notifBanner, ...(urgent ? s.notifBannerUrgent : {}) }}>
                <span>
                  {urgent ? "🚨" : "⚠️"} Your <strong>{CERT_LABELS[n.cert_type] || n.cert_type}</strong> expires
                  {days !== null ? ` in ${days} days` : ""} ({n.expiry_date}).
                </span>
                <button
                  style={s.notifDismiss}
                  onClick={() => dismissNotification(n.id)}
                  disabled={dismissing === n.id}
                >
                  {dismissing === n.id ? "…" : "✕"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Nav tabs ── */}
      <div style={s.tabBar} className="td-tab-bar">
        {navItems.map(item => (
          <button
            key={item.id}
            className={"td-tab" + (activeSection === item.id ? " td-tab-active" : "")}
            style={{ ...s.tab, ...(activeSection === item.id ? s.tabActive : {}) }}
            onClick={() => setActiveSection(item.id)}
          >
            <span style={s.tabIcon}>{item.icon}</span>
            <span className="td-tab-label" style={s.tabLabel}>{item.label}</span>
          </button>
        ))}
      </div>

      <div style={s.body} className="td-body">

        {/* ═══════════════════════════════════════════════════
            SECTION 1 — JOB MATCH DASHBOARD
        ═══════════════════════════════════════════════════ */}
        {activeSection === "jobs" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Jobs You Qualify For</h2>
              <span style={s.sectionSub}>{scoredJobs.length} matched listings</span>
            </div>

            {scoredJobs.length === 0 && (
              <div style={s.emptyState}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <p>No current listings match your certifications.</p>
                <p style={{ color: "#555", fontSize: 13 }}>
                  Add more certs to your profile or check back when new jobs post.
                </p>
              </div>
            )}

            <div style={s.jobGrid}>
              {scoredJobs.map(job => (
                <div key={job.id} style={s.jobCard}>
                  <div style={s.jobCardTop}>
                    <div>
                      <div style={s.jobCompany}>{job.company}</div>
                      <div style={s.jobTitle}>{job.title}</div>
                      <div style={s.jobMeta}>
                        <span>📍 {job.location}</span>
                        {job.salary && <span>💰 {job.salary}</span>}
                        <span>🗂 {job.type}</span>
                      </div>
                    </div>
                    <MatchBadge pct={job.matchPct} />
                  </div>

                  {/* Required certs met */}
                  {job.required_certs?.length > 0 && (
                    <div style={s.matchSection}>
                      <div style={s.matchLabel}>Required</div>
                      <div style={s.certRow}>
                        {job.required_certs.map(c => (
                          <span key={c} style={{
                            ...s.certChip,
                            ...(job.metRequired.includes(c) ? s.certChipMet : s.certChipMissed)
                          }}>
                            {job.metRequired.includes(c) ? "✓" : "✗"} {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred certs */}
                  {job.preferred_certs?.length > 0 && (
                    <div style={s.matchSection}>
                      <div style={s.matchLabel}>Preferred</div>
                      <div style={s.certRow}>
                        {job.preferred_certs.map(c => (
                          <span key={c} style={{
                            ...s.certChip,
                            ...(job.metPreferred.includes(c) ? s.certChipPref : s.certChipNeutral)
                          }}>
                            {job.metPreferred.includes(c) ? "✓" : "○"} {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button style={s.applyBtn} onClick={() => navigate("/")}>
                    View & Apply →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 2 — CERTIFICATION TRACKER
        ═══════════════════════════════════════════════════ */}
        {activeSection === "certs" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Certification Tracker</h2>
              <span style={s.sectionSub}>Your credentials at a glance</span>
            </div>

            <div style={s.certGrid}>

              {/* HAZWOPER 40-HR — Lifetime, no expiry */}
              <CertCard
                label="HAZWOPER 40-HR"
                held={profile.hazwoper_40}
                issueDate={profile.hazwoper_40_date}
                lifetime={true}
              />

              {/* HAZWOPER 8-HR Refresher — expires 12 months from issue */}
              <CertCard
                label="HAZWOPER 8-HR Refresher"
                held={profile.hazwoper_8}
                issueDate={profile.hazwoper_8_date}
                expiryDate={profile.hazwoper_8_expiry}
                renewalNote="Renews annually"
              />

              {/* DOD UXO Certs — optional expiry */}
              {(profile.dod_certs || []).map(cert => (
                <CertCard
                  key={cert}
                  label={cert}
                  held={true}
                  expiryDate={cert === (profile.dod_certs || [])[0] ? profile.dod_cert_expiry : null}
                  renewalNote="DOD renewal per cert"
                />
              ))}
              {(profile.dod_certs || []).length === 0 && (
                <CertCard label="DOD UXO Certification" held={false} />
              )}

              {/* First Aid / CPR — expires 2 years */}
              <CertCard
                label="First Aid / CPR"
                held={profile.first_aid_cpr}
                issueDate={profile.first_aid_cpr_date}
                expiryDate={profile.first_aid_cpr_expiry}
                renewalNote="Renews every 2 years"
              />

              {/* Current Physical */}
              <CertCard
                label="Annual Physical"
                held={profile.physical_current}
                issueDate={profile.physical_date}
                expiryDate={profile.physical_date
                  ? new Date(new Date(profile.physical_date).setFullYear(
                      new Date(profile.physical_date).getFullYear() + 1
                    )).toISOString().split("T")[0]
                  : null}
                renewalNote="Renews annually"
              />

              {/* Security Clearance — no expiry tracked */}
              <CertCard
                label={profile.clearance_level ? `Clearance — ${profile.clearance_level}` : "Security Clearance"}
                held={profile.clearance}
                lifetime={profile.clearance}
                renewalNote="Managed via SF-86"
              />

              {/* Military/EOD */}
              <CertCard
                label="Military / EOD Background"
                held={profile.military_eod}
                lifetime={profile.military_eod}
              />

              {/* Dive Cert — no expiry tracked here */}
              <CertCard label="Dive Certification" held={profile.dive_cert} lifetime={profile.dive_cert} />

              {/* Driver's License */}
              <CertCard label="Driver's License" held={profile.drivers_license} lifetime={profile.drivers_license} />

              {/* CDL */}
              <CertCard label="CDL" held={profile.cdl} lifetime={profile.cdl} />

              {/* State License */}
              {profile.state_license ? (
                <CertCard
                  label={`State License — ${profile.state_license}`}
                  held={true}
                  expiryDate={profile.state_license_expiry}
                  renewalNote="Varies by state"
                />
              ) : (
                <CertCard label="State License" held={false} />
              )}

            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SECTION 3 — CAREER PROGRESSION
        ═══════════════════════════════════════════════════ */}
        {activeSection === "career" && (
          <div>
            <div style={s.sectionHeader}>
              <h2 style={s.sectionTitle}>Career Progression</h2>
              <span style={s.sectionSub}>Based on verified field hours</span>
            </div>

            {/* Current level hero */}
            <div style={s.levelHero}>
              <div style={s.levelBadgeWrap}>
                <div style={s.levelBadge}>{currentLevel.label}</div>
                <div style={s.levelHours}>{hours.toLocaleString()} verified hours</div>
              </div>
              {nextLevel && (
                <div style={s.levelNext}>
                  <span style={{ color: "#7a7570", fontSize: 13 }}>Next level: </span>
                  <span style={{ color: "#d97706", fontWeight: "bold" }}>{nextLevel.label}</span>
                  <span style={{ color: "#555", fontSize: 13 }}>
                    {" "}({(nextLevel.min - hours).toLocaleString()} hrs to go)
                  </span>
                </div>
              )}
              {!nextLevel && (
                <div style={s.levelNext}>
                  <span style={{ color: "#4ade80", fontSize: 13 }}>🏆 Maximum level reached</span>
                </div>
              )}
            </div>

            {/* Progress bar */}
            {nextLevel && (
              <div style={s.progressWrap}>
                <div style={s.progressMeta}>
                  <span style={{ color: "#7a7570", fontSize: 13 }}>{currentLevel.label} ({currentLevel.min.toLocaleString()} hrs)</span>
                  <span style={{ color: "#d97706", fontSize: 13, fontWeight: "bold" }}>{progressPct}%</span>
                  <span style={{ color: "#7a7570", fontSize: 13 }}>{nextLevel.label} ({nextLevel.min.toLocaleString()} hrs)</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
                </div>
                <div style={{ color: "#555", fontSize: 12, marginTop: 6 }}>
                  {hours.toLocaleString()} / {nextLevel.min.toLocaleString()} hours logged
                </div>
              </div>
            )}

            {/* All levels table */}
            <div style={s.levelsTable}>
              <div style={s.levelsTitle}>Level Requirements</div>
              {LEVELS.map((lvl, i) => {
                const isCurrent = lvl.label === currentLevel.label;
                const isAchieved = hours >= lvl.min;
                return (
                  <div key={lvl.label} style={{ ...s.levelRow, ...(isCurrent ? s.levelRowActive : {}) }}>
                    <div style={s.levelRowLeft}>
                      <span style={{ ...s.levelRowDot, background: isAchieved ? "#4ade80" : "#333" }}>
                        {isAchieved ? "✓" : i + 1}
                      </span>
                      <span style={{ color: isCurrent ? "#d97706" : isAchieved ? "#e8e4dc" : "#555",
                                     fontWeight: isCurrent ? "bold" : "normal" }}>
                        {lvl.label}
                      </span>
                      {isCurrent && <span style={s.currentTag}>Current</span>}
                    </div>
                    <span style={{ color: "#7a7570", fontSize: 13 }}>
                      {lvl.max != null
                        ? `${lvl.min.toLocaleString()} – ${lvl.max.toLocaleString()} hrs`
                        : `${lvl.min.toLocaleString()}+ hrs`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cert summary for this level */}
            <div style={s.certSummaryCard}>
              <div style={s.certSummaryTitle}>Your Active DOD Certifications</div>
              {(profile.dod_certs || []).length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {(profile.dod_certs || []).map(c => (
                    <span key={c} style={s.dodChip}>{c}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>
                  No DOD certifications on file. Add them via your profile.
                </p>
              )}
            </div>

          </div>
        )}

      </div>{/* /body */}
    </div>
  );
}

// ─── CertCard sub-component ──────────────────────────────────────────────────
function CertCard({ label, held, issueDate, expiryDate, lifetime, renewalNote }) {
  let st;
  if (!held)         st = { status: "missing", days: null };
  else if (lifetime) st = { status: "lifetime", days: null };
  else               st = certStatus(expiryDate);

  const color = STATUS_COLOR[st.status];
  const bg    = STATUS_BG[st.status];

  return (
    <div style={{ ...s.certCard, borderColor: `${color}33`, background: bg }}>
      <div style={s.certCardTop}>
        <span style={{ ...s.certCardLabel, color: held ? "#e8e4dc" : "#555" }}>{label}</span>
        <StatusBadge status={st.status} days={st.days} />
      </div>
      {held && (
        <div style={s.certCardMeta}>
          {issueDate && <span>Issued: {new Date(issueDate).toLocaleDateString()}</span>}
          {expiryDate && !lifetime && (
            <span style={{ color: color }}>
              Expires: {new Date(expiryDate).toLocaleDateString()}
            </span>
          )}
          {lifetime && !expiryDate && <span style={{ color: "#4ade80" }}>No expiration</span>}
          {renewalNote && <span style={{ color: "#555" }}>{renewalNote}</span>}
        </div>
      )}
      {!held && (
        <div style={{ color: "#555", fontSize: 12, marginTop: 4 }}>Not on file</div>
      )}
    </div>
  );
}

// ─── MatchBadge sub-component ─────────────────────────────────────────────────
function MatchBadge({ pct }) {
  const color = pct >= 90 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 12 }}>
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={24} fill="none" stroke="#1e2022" strokeWidth={5} />
        <circle
          cx={28} cy={28} r={24} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={`${(pct / 100) * 150.8} 150.8`}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
        />
        <text x={28} y={33} textAnchor="middle" fill={color}
              fontSize={13} fontWeight="bold" fontFamily="Georgia, serif">
          {pct}%
        </text>
      </svg>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root:          { fontFamily: "'Georgia','Times New Roman',serif", background: "#0d0f10",
                   color: "#e8e4dc", minHeight: "100vh" },
  header:        { background: "#111316", borderBottom: "1px solid #222",
                   padding: "0 0 0 0", position: "sticky", top: 0, zIndex: 100 },
  headerInner:   { maxWidth: 900, margin: "0 auto", padding: "16px 20px",
                   display: "flex", alignItems: "center", justifyContent: "space-between",
                   flexWrap: "wrap", gap: 8 },
  headerLabel:   { fontSize: 11, color: "#6a6660", textTransform: "uppercase",
                   letterSpacing: "0.1em", marginBottom: 2 },
  headerName:    { fontSize: 20, fontWeight: "bold", letterSpacing: "-0.3px",
                   overflowWrap: "break-word", wordBreak: "break-word" },
  headerRight:   { display: "flex", alignItems: "center", gap: 12 },
  backBtn:       { background: "none", border: "1px solid #333", color: "#9a9490",
                   cursor: "pointer", padding: "6px 14px", fontSize: 13,
                   borderRadius: 6, fontFamily: "inherit" },
  notifBell:     { position: "relative", fontSize: 18 },
  notifCount:    { position: "absolute", top: -4, right: -6, background: "#f87171",
                   color: "#000", fontSize: 10, fontWeight: "bold",
                   borderRadius: "50%", padding: "1px 4px" },
  notifWrap:     { maxWidth: 900, margin: "12px auto 0", padding: "0 20px" },
  notifBanner:   { background: "#2a1e08", border: "1px solid #fbbf24", borderRadius: 8,
                   padding: "12px 16px", fontSize: 13, color: "#fbbf24",
                   marginBottom: 8, display: "flex", justifyContent: "space-between",
                   alignItems: "center", gap: 12, overflowWrap: "break-word",
                   wordBreak: "break-word" },
  notifBannerUrgent: { background: "#2a0a0a", border: "1px solid #f87171", color: "#f87171" },
  notifDismiss:  { background: "none", border: "none", color: "inherit",
                   cursor: "pointer", fontSize: 16, padding: "0 4px", lineHeight: 1 },
  tabBar:        { maxWidth: 900, margin: "0 auto", padding: "12px 20px 0",
                   display: "flex", gap: 4, borderBottom: "1px solid #1e2022",
                   overflowX: "auto", WebkitOverflowScrolling: "touch" },
  tab:           { background: "none", border: "none", color: "#9a9590", cursor: "pointer",
                   padding: "8px 16px 12px", fontSize: 15, fontFamily: "inherit",
                   borderBottom: "2px solid transparent", display: "flex",
                   alignItems: "center", gap: 6, transition: "color 0.15s",
                   minHeight: 44, flexShrink: 0, whiteSpace: "nowrap" },
  tabActive:     { color: "#e8e4dc", borderBottom: "2px solid #d97706", fontWeight: "bold" },
  tabIcon:       { fontSize: 16 },
  tabLabel:      { lineHeight: 1.2 },
  body:          { maxWidth: 900, margin: "0 auto", padding: "28px 20px 60px" },

  sectionHeader: { display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20,
                   flexWrap: "wrap" },
  sectionTitle:  { fontSize: 22, fontWeight: "bold", margin: 0, letterSpacing: "-0.3px",
                   overflowWrap: "break-word", wordBreak: "break-word" },
  sectionSub:    { color: "#6a6660", fontSize: 13 },

  // Job match
  jobGrid:       { display: "flex", flexDirection: "column", gap: 16 },
  jobCard:       { background: "#111316", border: "1px solid #1e2022", borderRadius: 10,
                   padding: "20px 22px" },
  jobCardTop:    { display: "flex", justifyContent: "space-between",
                   alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 },
  jobCompany:    { fontSize: 11, color: "#7a7570", textTransform: "uppercase",
                   letterSpacing: "0.06em", marginBottom: 3,
                   overflowWrap: "break-word", wordBreak: "break-word" },
  jobTitle:      { fontSize: 18, fontWeight: "bold", lineHeight: 1.4, marginBottom: 6,
                   overflowWrap: "break-word", wordBreak: "break-word" },
  jobMeta:       { display: "flex", gap: 14, fontSize: 12, color: "#7a7570", flexWrap: "wrap",
                   lineHeight: 1.5 },
  matchSection:  { marginTop: 10 },
  matchLabel:    { fontSize: 11, color: "#6a6660", textTransform: "uppercase",
                   letterSpacing: "0.06em", marginBottom: 5 },
  certRow:       { display: "flex", flexWrap: "wrap", gap: 6 },
  certChip:      { fontSize: 11, padding: "3px 8px", borderRadius: 4 },
  certChipMet:   { background: "#0a2a1a", color: "#4ade80", border: "1px solid #4ade8033" },
  certChipMissed:{ background: "#2a0a0a", color: "#f87171", border: "1px solid #f8717133" },
  certChipPref:  { background: "#0a1a2a", color: "#60a5fa", border: "1px solid #60a5fa33" },
  certChipNeutral:{ background: "#1a1c1e", color: "#555", border: "1px solid #2a2c2e" },
  applyBtn:      { marginTop: 14, background: "none", border: "1px solid #d97706",
                   color: "#d97706", padding: "7px 16px", fontSize: 13,
                   borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                   fontWeight: "bold" },

  // Cert tracker
  certGrid:      { display: "grid",
                   gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
                   gap: 12 },
  certCard:      { background: "#111316", border: "1px solid #1e2022", borderRadius: 8,
                   padding: "14px 16px" },
  certCardTop:   { display: "flex", justifyContent: "space-between",
                   alignItems: "flex-start", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  certCardLabel: { fontSize: 13, fontWeight: "bold", lineHeight: 1.4,
                   flex: 1, minWidth: 0, overflowWrap: "break-word", wordBreak: "break-word" },
  certCardMeta:  { display: "flex", flexDirection: "column", gap: 3, fontSize: 12,
                   color: "#7a7570", lineHeight: 1.5 },

  // Career
  levelHero:     { background: "#111316", border: "1px solid #d97706", borderRadius: 12,
                   padding: "24px 28px", marginBottom: 20, overflowWrap: "break-word" },
  levelBadgeWrap:{ marginBottom: 8 },
  levelBadge:    { display: "inline-block", background: "#1a1408",
                   border: "1px solid #d97706", color: "#d97706",
                   fontSize: 16, fontWeight: "bold", padding: "4px 16px",
                   borderRadius: 20, marginBottom: 8, overflowWrap: "break-word",
                   maxWidth: "100%" },
  levelHours:    { fontSize: 24, fontWeight: "bold", letterSpacing: "-0.5px",
                   overflowWrap: "break-word" },
  levelNext:     { fontSize: 14, lineHeight: 1.6, overflowWrap: "break-word",
                   flexWrap: "wrap" },
  progressWrap:  { background: "#111316", border: "1px solid #1e2022",
                   borderRadius: 10, padding: "20px 22px", marginBottom: 20 },
  progressMeta:  { display: "flex", justifyContent: "space-between",
                   marginBottom: 10, flexWrap: "wrap", gap: 8, rowGap: 6 },
  progressTrack: { background: "#1e2022", borderRadius: 8, height: 14, overflow: "hidden" },
  progressFill:  { height: "100%", background: "linear-gradient(90deg, #d97706, #f59e0b)",
                   borderRadius: 8, transition: "width 0.6s ease" },
  levelsTable:   { background: "#111316", border: "1px solid #1e2022",
                   borderRadius: 10, overflow: "hidden", marginBottom: 16 },
  levelsTitle:   { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em",
                   color: "#6a6660", padding: "14px 18px",
                   borderBottom: "1px solid #1e2022" },
  levelRow:      { display: "flex", alignItems: "center", justifyContent: "space-between",
                   padding: "13px 18px", borderBottom: "1px solid #1a1c1e",
                   flexWrap: "wrap", gap: 6 },
  levelRowActive:{ background: "#1a1408" },
  levelRowLeft:  { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  levelRowDot:   { width: 24, height: 24, borderRadius: "50%",
                   display: "flex", alignItems: "center", justifyContent: "center",
                   fontSize: 11, fontWeight: "bold", color: "#0d0f10", flexShrink: 0 },
  currentTag:    { background: "#d97706", color: "#0d0f10", fontSize: 10,
                   fontWeight: "bold", padding: "2px 7px", borderRadius: 10,
                   letterSpacing: "0.04em" },
  certSummaryCard:{ background: "#111316", border: "1px solid #1e2022",
                    borderRadius: 10, padding: "18px 20px" },
  certSummaryTitle:{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em",
                     color: "#6a6660" },
  dodChip:       { background: "#1a1408", border: "1px solid #d97706",
                   color: "#d97706", fontSize: 12, padding: "4px 10px", borderRadius: 6 },

  // Empty states
  emptyCard:     { maxWidth: 480, margin: "80px auto", background: "#111316",
                   border: "1px solid #1e2022", borderRadius: 12,
                   padding: "48px 40px", textAlign: "center" },
  emptyTitle:    { fontSize: 24, fontWeight: "bold", margin: "0 0 12px" },
  emptyMsg:      { color: "#7a7570", lineHeight: 1.6, margin: "0 0 24px" },
  emptyState:    { background: "#111316", border: "1px solid #1e2022",
                   borderRadius: 10, padding: "40px", textAlign: "center",
                   color: "#7a7570" },
  btnPrimary:    { background: "#d97706", border: "none", color: "#0d0f10",
                   padding: "11px 22px", fontSize: 14, fontWeight: "bold",
                   borderRadius: 6, cursor: "pointer", fontFamily: "inherit" },
};
