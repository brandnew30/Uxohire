import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./supabaseClient";

// Stripe integration pending — job posts saved as pending_payment

const normalizeJob = (j) => ({
  id: j.id,
  company: j.company,
  title: j.title,
  location: j.location,
  type: j.type,
  salary: j.salary || '',
  description: j.description || '',
  requiredCerts: j.required_certs || [],
  preferredCerts: j.preferred_certs || [],
  posted: new Date(j.created_at).toLocaleDateString(),
  status: j.status,
});

const normalizeTech = (t) => ({
  id: t.id,
  name: t.name,
  email: t.email || '',
  location: t.location,
  uxoHours: t.uxo_hours || '0',
  travel: t.travel,
  dodCerts: t.dod_certs || [],
  hazwoper40: t.hazwoper_40,
  hazwoper8: t.hazwoper_8,
  physicalCurrent: t.physical_current,
  militaryEod: t.military_eod,
  clearance: t.clearance,
  clearanceLevel: t.clearance_level || '',
  diveCert: t.dive_cert,
  driversLicense: t.drivers_license,
  cdl: t.cdl,
  available: t.open_to_work,
  summary: t.summary || '',
  resumePath: t.resume_path || null,
  certPaths: t.cert_paths || [],
  hazwoper8CertPath: t.hazwoper8_cert_path || null,
  physicalCertPath: t.physical_cert_path || null,
});

const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 365;
};

const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 335 && diffDays <= 365;
};

const isOlderThanOneYear = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 365;
};

const DOD_CERT_OPTIONS = ["DOD UXO Tech I", "DOD UXO Tech II", "DOD UXO Tech III", "QC Specialist", "UXO Safety Officer"];
const TRAVEL_OPTIONS = ["Local only", "Regional", "Nationwide", "International"];
const CERT_COLORS = { "DOD UXO Tech I": "#1a4a6b", "DOD UXO Tech II": "#1a6b4a", "DOD UXO Tech III": "#4a1a6b", "QC Specialist": "#6b4a1a", "UXO Safety Officer": "#6b1a3a" };

const ALL_CERT_OPTIONS = [
  "DOD UXO Tech I", "DOD UXO Tech II", "DOD UXO Tech III",
  "QC Specialist", "UXO Safety Officer", "HAZWOPER 40-HR",
  "8-HR HAZWOPER Refresher", "Current Physical", "Security Clearance",
  "Dive Certified", "Driver's License", "CDL", "Military/EOD Background",
];

export default function UXOHire({ user: userProp }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive view from URL path
  const pathToView = {
    '/': 'jobs',
    '/techs': 'techs',
    '/post-job': 'postJob',
    '/create-profile': 'techProfile',
    '/login': 'login',
    '/signup': 'signup',
    '/my-profile': 'myProfile',
    '/job-post-success': 'jobPostSuccess',
    // /dashboard is handled by App.js routing, not UXOHire
  };
  const view = pathToView[location.pathname] || 'jobs';
  const setView = (v, opts = {}) => {
    const viewToPath = {
      jobs: '/',
      techs: '/techs',
      postJob: '/post-job',
      techProfile: '/create-profile',
      login: '/login',
      signup: '/signup',
      myProfile: '/my-profile',
      jobPostSuccess: '/job-post-success',
    };
    navigate(viewToPath[v] || '/', opts);
  };

  const [activeJob, setActiveJob] = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [openToWork, setOpenToWork] = useState(true);
  const [profileStep, setProfileStep] = useState(1);
  const [postStep, setPostStep] = useState(1);
  const [filterCert, setFilterCert] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [profileSubmitted, setProfileSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [techs, setTechs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Auth state — driven by prop from App (single source of truth)
  const [user, setUser] = useState(userProp ?? null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // My Profile state
  const [myProfile, setMyProfile] = useState(null);
  const [myProfileLoading, setMyProfileLoading] = useState(false);

  // Apply Now state
  const [applyView, setApplyView] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', message: '' });
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Contact This Tech state
  const [contactView, setContactView] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', message: '' });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState('');

  // Upload status state
  const [uploadStatus, setUploadStatus] = useState({});
  // Upload paths — collected during form, saved to DB on submit
  const [uploadPaths, setUploadPaths] = useState({ resume: null, certs: [], hazwoper8: null, physical: null });

  // Submit error state (profile / job post)
  const [submitError, setSubmitError] = useState('');

  const [profile, setProfile] = useState({
    name: "", email: "", location: "", uxoHours: "", travel: "Nationwide", summary: "",
    dodCerts: [], hazwoper40: false, hazwoper40Date: "", hazwoper8: false, hazwoper8Date: "",
    physicalCurrent: false, physicalDate: "", militaryEod: false, clearance: false,
    clearanceLevel: "", diveCert: false, driversLicense: false, cdl: false,
  });

  const [jobPost, setJobPost] = useState({
    company: "", title: "", location: "", type: "Contract", salary: "", description: "",
    requiredCerts: [], preferredCerts: [],
  });

  // Sync user from parent App when prop changes (login/logout)
  useEffect(() => { setUser(userProp ?? null); }, [userProp]);

  // Protected navigation to profile creation — redirects to signup if not logged in
  const goToCreateProfile = () => {
    if (!user) {
      navigate('/signup', { state: { returnTo: '/create-profile' } });
    } else {
      setView('techProfile');
    }
  };

  useEffect(() => {
    const notes = [];
    if (profile.hazwoper8 && isExpiringSoon(profile.hazwoper8Date)) notes.push("⚠️ Your 8-HR HAZWOPER refresher expires within 30 days. Please update it soon.");
    if (profile.physicalCurrent && isExpiringSoon(profile.physicalDate)) notes.push("⚠️ Your physical expires within 30 days. Please schedule a renewal.");
    if (profile.hazwoper8 && isExpired(profile.hazwoper8Date)) notes.push("🚫 Your 8-HR HAZWOPER refresher has expired. Your profile is hidden from companies requiring current certs.");
    if (profile.physicalCurrent && isExpired(profile.physicalDate)) notes.push("🚫 Your physical has expired. Your profile is hidden from companies requiring a current physical.");
    setNotifications(notes);
  }, [profile.hazwoper8Date, profile.physicalDate, profile.hazwoper8, profile.physicalCurrent]);

  useEffect(() => {
    async function fetchData() {
      setDataLoading(true);
      const { data: jobData } = await supabase
        .from('job_posts')
        .select('*')
        .in('status', ['published', 'pending_payment'])
        .order('created_at', { ascending: false });

      const { data: techData } = await supabase
        .from('tech_profiles')
        .select('*')
        .eq('open_to_work', true);

      setJobs((jobData || []).map(normalizeJob));
      setTechs((techData || []).map(normalizeTech));
      setDataLoading(false);
    }
    fetchData();
  }, []);

  // Guard: /create-profile requires auth — redirect to signup if unauthenticated
  useEffect(() => {
    if (view === 'techProfile' && !user) {
      navigate('/signup', { state: { returnTo: '/create-profile' }, replace: true });
    }
  }, [view, user]); // eslint-disable-line

  useEffect(() => {
    if (user) fetchMyProfile();
    else setMyProfile(null);
  }, [user]); // eslint-disable-line

  const show8HrQuestion = profile.hazwoper40 && isOlderThanOneYear(profile.hazwoper40Date);

  const validateStep2 = () => {
    const newErrors = {};
    if (profile.hazwoper8 && isExpired(profile.hazwoper8Date)) newErrors.hazwoper8Date = "Your 8-HR HAZWOPER is not current. Please select No.";
    if (profile.physicalCurrent && isExpired(profile.physicalDate)) newErrors.physicalDate = "Your physical is not current. Please select No.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toggleDodCert = (cert) => setProfile(p => ({ ...p, dodCerts: p.dodCerts.includes(cert) ? p.dodCerts.filter(c => c !== cert) : [...p.dodCerts, cert] }));

  const toggleJobCert = (cert, type) => {
    setJobPost(p => {
      const field = type === 'required' ? 'requiredCerts' : 'preferredCerts';
      const other = type === 'required' ? 'preferredCerts' : 'requiredCerts';
      return { ...p, [field]: p[field].includes(cert) ? p[field].filter(c => c !== cert) : [...p[field], cert], [other]: p[other].filter(c => c !== cert) };
    });
  };

  const filteredJobs = jobs.filter(j => {
    const certMatch = filterCert ? j.requiredCerts.includes(filterCert) || j.preferredCerts.includes(filterCert) : true;
    const locMatch = filterLocation ? j.location.toLowerCase().includes(filterLocation.toLowerCase()) : true;
    return certMatch && locMatch;
  });

  const handleSubmitProfile = async () => {
    if (!user) {
      navigate('/signup', { state: { returnTo: '/create-profile' } });
      return;
    }
    setSubmitError('');
    const profileData = {
      name: profile.name, email: profile.email || user.email, location: profile.location,
      uxo_hours: profile.uxoHours, travel: profile.travel, summary: profile.summary,
      dod_certs: profile.dodCerts, hazwoper_40: profile.hazwoper40,
      hazwoper_40_date: profile.hazwoper40Date || null, hazwoper_8: profile.hazwoper8,
      hazwoper_8_date: profile.hazwoper8Date || null, physical_current: profile.physicalCurrent,
      physical_date: profile.physicalDate || null, military_eod: profile.militaryEod,
      clearance: profile.clearance, clearance_level: profile.clearanceLevel,
      dive_cert: profile.diveCert, drivers_license: profile.driversLicense,
      cdl: profile.cdl, open_to_work: openToWork,
      // Always bind to authenticated user — required, not optional
      user_id: user.id,
      // Persist upload paths collected during form steps
      resume_path: uploadPaths.resume || null,
      cert_paths: uploadPaths.certs || [],
      hazwoper8_cert_path: uploadPaths.hazwoper8 || null,
      physical_cert_path: uploadPaths.physical || null,
    };
    const { error } = await supabase.from('tech_profiles').insert(profileData);
    if (error) {
      setSubmitError("Something went wrong saving your profile. Please try again.");
    } else {
      // Refresh techs list then send user straight to their dashboard
      const { data: techData } = await supabase.from('tech_profiles').select('*').eq('open_to_work', true);
      setTechs((techData || []).map(normalizeTech));
      navigate('/dashboard', { replace: true });
    }
  };

  // Upload helper using supabase-js storage
  const uploadFile = async (file, folder) => {
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('uxo-uploads').upload(fileName, file, { upsert: true });
    return error ? { path: null, error } : { path: fileName, error: null };
  };

  const handleSubmitJobPost = async () => {
    const { error } = await supabase.from('job_posts').insert({
      company: jobPost.company,
      title: jobPost.title,
      location: jobPost.location,
      type: jobPost.type,
      salary: jobPost.salary,
      description: jobPost.description,
      required_certs: jobPost.requiredCerts,
      preferred_certs: jobPost.preferredCerts,
      status: 'pending_payment',
      ...(user ? { user_id: user.id } : {}),
    });
    if (error) {
      setSubmitError("Something went wrong. Please try again.");
    } else {
      setView("jobPostSuccess");
      // Refresh jobs
      const { data: jobData } = await supabase.from('job_posts').select('*').in('status', ['published', 'pending_payment']).order('created_at', { ascending: false });
      setJobs((jobData || []).map(normalizeJob));
    }
  };

  // Auth handlers
  const handleSignUp = async () => {
    setAuthLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({
      email: authForm.email,
      password: authForm.password,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (data.session) {
      // Email confirmation disabled — user is immediately logged in
      setAuthForm({ email: '', password: '' });
      const returnTo = location.state?.returnTo;
      navigate(returnTo || '/create-profile', { replace: true });
    } else {
      // Email confirmation required
      setAuthError('');
      setAuthSuccessMsg('Account created! Check your email to confirm, then log in.');
      navigate('/login', {
        replace: true,
        state: { returnTo: location.state?.returnTo || '/create-profile' },
      });
    }
  };

  const handleLogin = async () => {
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: authForm.email,
      password: authForm.password,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthForm({ email: '', password: '' });
      // returnTo from state (e.g. post-signup confirmation, /dashboard redirect, /create-profile)
      const returnTo = location.state?.returnTo;
      navigate(returnTo || '/dashboard', { replace: true });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyProfile(null);
    setView('jobs');
  };

  // My Profile handlers
  const fetchMyProfile = async () => {
    if (!user) return;
    setMyProfileLoading(true);
    const { data } = await supabase
      .from('tech_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setMyProfile(data ? normalizeTech(data) : null);
    setMyProfileLoading(false);
  };

  const handleToggleAvailability = async () => {
    if (!myProfile || !user) return;
    const newStatus = !myProfile.available;
    const { error } = await supabase
      .from('tech_profiles')
      .update({ open_to_work: newStatus })
      .eq('user_id', user.id);
    if (!error) {
      setMyProfile(p => ({ ...p, available: newStatus }));
      const { data: techData } = await supabase.from('tech_profiles').select('*').eq('open_to_work', true);
      setTechs((techData || []).map(normalizeTech));
    }
  };

  const handleApply = async () => {
    if (!applyForm.name || !applyForm.email) {
      setApplyError('Name and email are required.');
      return;
    }
    setApplySubmitting(true);
    setApplyError('');
    const { error } = await supabase.from('applications').insert({
      job_id: activeJob.id,
      applicant_name: applyForm.name,
      applicant_email: applyForm.email,
      message: applyForm.message,
      ...(myProfile ? { tech_profile_id: myProfile.id } : {}),
    });
    setApplySubmitting(false);
    if (error) {
      setApplyError('Something went wrong. Please try again.');
    } else {
      setApplySuccess(true);
    }
  };

  const handleContact = async () => {
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setContactError('Name, email, and message are required.');
      return;
    }
    setContactSubmitting(true);
    setContactError('');
    const { error } = await supabase.from('contacts').insert({
      tech_profile_id: activeTech.id,
      employer_name: contactForm.name,
      employer_email: contactForm.email,
      company: contactForm.company,
      message: contactForm.message,
    });
    setContactSubmitting(false);
    if (error) {
      setContactError('Something went wrong. Please try again.');
    } else {
      setContactSuccess(true);
    }
  };

  return (
    <div style={styles.root}>
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <div style={styles.logo} onClick={() => { setView("jobs"); setProfileSubmitted(false); }}>
            <span style={styles.logoIcon}>⬡</span>
            <span style={styles.logoText}>UXO<span style={styles.logoAccent}>hire</span></span>
          </div>
          <div style={styles.navLinks}>
            <button style={view === "jobs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("jobs")}>Browse Jobs</button>
            <button style={view === "techs" ? styles.navLinkActive : styles.navLink} onClick={() => setView("techs")}>Find Techs</button>
            <button style={styles.navCTA} onClick={() => setView("postJob")}>Post a Job →</button>
            {!user ? (
              <>
                <button style={styles.navLink} onClick={() => navigate('/login')}>Log In</button>
                <button style={{ ...styles.navCTA, background: '#d97706' }} onClick={() => navigate('/signup')}>Sign Up</button>
              </>
            ) : (
              <>
                <span style={{ color: '#7a7570', fontSize: 13, padding: '0 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                <button
                  style={{ ...styles.navCTA, background: '#1a1408', border: '1px solid #d97706', color: '#d97706' }}
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </button>
                <button style={styles.navLink} onClick={handleSignOut}>Log Out</button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main style={styles.main}>

        {authSuccessMsg && (
          <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '14px 18px', color: '#4ade80', fontSize: 14, margin: '16px 0 0' }}>
            ✅ {authSuccessMsg}
          </div>
        )}

        {/* JOBS VIEW */}
        {view === "jobs" && !activeJob && (
          <div>
            <div style={styles.hero}>
              <div style={styles.heroBadge}>The UXO Industry's Job Board</div>
              <h1 style={styles.heroTitle}>Find Your Next<br /><span style={styles.heroAccent}>UXO Assignment</span></h1>
              <p style={styles.heroSub}>Connecting certified UXO technicians with the companies that need them most.</p>
              <div style={styles.heroActions}>
                <button style={styles.btnPrimary} onClick={goToCreateProfile}>Create Tech Profile</button>
                <button style={styles.btnSecondary} onClick={() => setView("postJob")}>Post a Job</button>
              </div>
            </div>
            <div style={styles.filterBar}>
              <select style={styles.filterSelect} value={filterCert} onChange={e => setFilterCert(e.target.value)}>
                <option value="">All Certifications</option>
                {ALL_CERT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={styles.filterInput} placeholder="Filter by location..." value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
              <span style={styles.filterCount}>{filteredJobs.length} positions</span>
            </div>
            <div style={styles.cardGrid}>
              {dataLoading && (
                <div style={{ color: '#7a7570', fontSize: 14, padding: '20px 0' }}>Loading listings...</div>
              )}
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
                  <div style={styles.certSection}>
                    <div style={styles.certLabel}>Required:</div>
                    <div style={styles.certTags}>
                      {job.requiredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#8B0000" }}>{c}</span>)}
                    </div>
                    {job.preferredCerts.length > 0 && (
                      <>
                        <div style={styles.certLabel}>Preferred:</div>
                        <div style={styles.certTags}>
                          {job.preferredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#1a3a5a" }}>{c}</span>)}
                        </div>
                      </>
                    )}
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

        {/* JOB DETAIL */}
        {view === "jobs" && activeJob && (
          <div style={styles.detailWrap}>
            <button style={styles.backBtn} onClick={() => { setActiveJob(null); setApplyView(false); setApplySuccess(false); }}>← Back to Jobs</button>
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
              </div>
              <div style={styles.divider} />
              <h3 style={styles.sectionLabel}>Required Certifications</h3>
              <div style={styles.certTags}>
                {activeJob.requiredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#8B0000" }}>{c}</span>)}
              </div>
              {activeJob.preferredCerts.length > 0 && (
                <>
                  <h3 style={styles.sectionLabel}>Preferred Certifications</h3>
                  <div style={styles.certTags}>
                    {activeJob.preferredCerts.map(c => <span key={c} style={{ ...styles.certTag, background: "#1a3a5a" }}>{c}</span>)}
                  </div>
                </>
              )}
              <h3 style={styles.sectionLabel}>Job Description</h3>
              <p style={styles.detailDesc}>{activeJob.description}</p>

              {!applyView && !applySuccess && (
                <button style={styles.btnPrimary} onClick={() => {
                  setApplyForm({ name: myProfile?.name || '', email: myProfile?.email || user?.email || '', message: '' });
                  setApplyError('');
                  setApplySuccess(false);
                  setApplyView(true);
                }}>Apply Now</button>
              )}

              {applySuccess && (
                <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '16px 20px', color: '#4ade80', fontSize: 14 }}>
                  ✅ Application submitted! The employer will review your application and reach out to you directly.
                </div>
              )}

              {applyView && !applySuccess && (
                <div style={{ marginTop: 16, background: '#0d0f10', border: '1px solid #2a2c2e', borderRadius: 8, padding: '20px 24px' }}>
                  <h3 style={{ ...styles.sectionLabel, marginTop: 0 }}>Apply for {activeJob.title}</h3>
                  <div style={styles.formFields}>
                    <label style={styles.label}>Your Name</label>
                    <input style={styles.input} value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                    <label style={styles.label}>Email Address</label>
                    <input style={styles.input} type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" />
                    <label style={styles.label}>Cover Note (optional)</label>
                    <textarea style={styles.textarea} value={applyForm.message} onChange={e => setApplyForm(f => ({ ...f, message: e.target.value }))} placeholder="Brief note about your background and interest..." />
                    {applyError && <div style={styles.errorMsg}>⚠️ {applyError}</div>}
                    <div style={styles.formRow}>
                      <button style={styles.btnSecondary} onClick={() => { setApplyView(false); setApplyError(''); }}>Cancel</button>
                      <button style={styles.btnPrimary} onClick={handleApply} disabled={applySubmitting}>
                        {applySubmitting ? 'Submitting...' : 'Submit Application'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TECHS VIEW */}
        {view === "techs" && !activeTech && (
          <div>
            <div style={styles.pageHeader}>
              <h2 style={styles.pageTitle}>Available UXO Technicians</h2>
              <p style={styles.pageSub}>Certified techs actively open to new assignments. <a href="#" style={styles.inlineLink} onClick={e => { e.preventDefault(); goToCreateProfile(); }}>Create your profile →</a></p>
            </div>
            <div style={styles.cardGrid}>
              {techs.map(tech => (
                <div key={tech.id} style={styles.jobCard} onClick={() => setActiveTech(tech)}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.cardTitle}>{tech.name}</div>
                      <div style={styles.cardCompany}>{tech.location}</div>
                    </div>
                    <div style={{ ...styles.availBadge, background: "#1a4a2e", color: "#4ade80" }}>● Open to Work</div>
                  </div>
                  <div style={styles.cardMeta}>
                    <span>⏱ {tech.uxoHours} UXO hrs</span>
                    <span>✈️ {tech.travel}</span>
                  </div>
                  <p style={styles.techSummary}>{tech.summary}</p>
                  <div style={styles.certTags}>
                    {tech.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || "#333" }}>{c}</span>)}
                    {tech.hazwoper40 && <span style={{ ...styles.certTag, background: "#1a4a2e" }}>HAZWOPER 40-HR</span>}
                    {tech.diveCert && <span style={{ ...styles.certTag, background: "#0d5f7a" }}>Dive Certified</span>}
                    {tech.clearance && <span style={{ ...styles.certTag, background: "#8B0000" }}>Clearance: {tech.clearanceLevel}</span>}
                  </div>
                  <div style={styles.cardFooter}>
                    <span style={styles.cardLink}>View Profile →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TECH DETAIL */}
        {view === "techs" && activeTech && (
          <div style={styles.detailWrap}>
            <button style={styles.backBtn} onClick={() => { setActiveTech(null); setContactView(false); setContactSuccess(false); }}>← Back to Techs</button>
            <div style={styles.detailCard}>
              <div style={styles.detailHeader}>
                <div>
                  <h2 style={styles.detailTitle}>{activeTech.name}</h2>
                  <div style={styles.cardMeta}>
                    <span>📍 {activeTech.location}</span>
                    <span>⏱ {activeTech.uxoHours} UXO hrs</span>
                    <span>✈️ {activeTech.travel}</span>
                  </div>
                </div>
                <div style={{ ...styles.availBadge, background: "#1a4a2e", color: "#4ade80" }}>● Open to Work</div>
              </div>
              <div style={styles.divider} />
              <h3 style={styles.sectionLabel}>DOD Certifications</h3>
              <div style={styles.certTags}>
                {activeTech.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || "#333" }}>{c}</span>)}
              </div>
              <h3 style={styles.sectionLabel}>Qualifications</h3>
              <div style={styles.qualGrid}>
                <div style={styles.qualItem}><span style={styles.qualLabel}>HAZWOPER 40-HR</span><span style={activeTech.hazwoper40 ? styles.qualYes : styles.qualNo}>{activeTech.hazwoper40 ? "✓ Yes" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>8-HR Refresher</span><span style={activeTech.hazwoper8 ? styles.qualYes : styles.qualNo}>{activeTech.hazwoper8 ? "✓ Current" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>Current Physical</span><span style={activeTech.physicalCurrent ? styles.qualYes : styles.qualNo}>{activeTech.physicalCurrent ? "✓ Current" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>Military/EOD</span><span style={activeTech.militaryEod ? styles.qualYes : styles.qualNo}>{activeTech.militaryEod ? "✓ Yes" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>Security Clearance</span><span style={activeTech.clearance ? styles.qualYes : styles.qualNo}>{activeTech.clearance ? `✓ ${activeTech.clearanceLevel}` : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>Dive Certified</span><span style={activeTech.diveCert ? styles.qualYes : styles.qualNo}>{activeTech.diveCert ? "✓ Yes" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>Driver's License</span><span style={activeTech.driversLicense ? styles.qualYes : styles.qualNo}>{activeTech.driversLicense ? "✓ Yes" : "✗ No"}</span></div>
                <div style={styles.qualItem}><span style={styles.qualLabel}>CDL</span><span style={activeTech.cdl ? styles.qualYes : styles.qualNo}>{activeTech.cdl ? "✓ Yes" : "✗ No"}</span></div>
              </div>
              <h3 style={styles.sectionLabel}>Summary</h3>
              <p style={styles.detailDesc}>{activeTech.summary}</p>

              {!contactView && !contactSuccess && (
                <button style={styles.btnPrimary} onClick={() => {
                  setContactForm({ name: '', email: user?.email || '', company: '', message: '' });
                  setContactError('');
                  setContactSuccess(false);
                  setContactView(true);
                }}>Contact This Tech</button>
              )}

              {contactSuccess && (
                <div style={{ background: '#1a4a2e', border: '1px solid #4ade80', borderRadius: 8, padding: '16px 20px', color: '#4ade80', fontSize: 14 }}>
                  ✅ Message sent! The technician will be notified and will reach out to you directly.
                </div>
              )}

              {contactView && !contactSuccess && (
                <div style={{ marginTop: 16, background: '#0d0f10', border: '1px solid #2a2c2e', borderRadius: 8, padding: '20px 24px' }}>
                  <h3 style={{ ...styles.sectionLabel, marginTop: 0 }}>Contact {activeTech.name}</h3>
                  <div style={styles.formFields}>
                    <label style={styles.label}>Your Name</label>
                    <input style={styles.input} value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} placeholder="Your full name" />
                    <label style={styles.label}>Your Email</label>
                    <input style={styles.input} type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
                    <label style={styles.label}>Company (optional)</label>
                    <input style={styles.input} value={contactForm.company} onChange={e => setContactForm(f => ({ ...f, company: e.target.value }))} placeholder="Your company name" />
                    <label style={styles.label}>Message</label>
                    <textarea style={styles.textarea} value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe the role, project, and why you'd like to connect..." />
                    {contactError && <div style={styles.errorMsg}>⚠️ {contactError}</div>}
                    <div style={styles.formRow}>
                      <button style={styles.btnSecondary} onClick={() => { setContactView(false); setContactError(''); }}>Cancel</button>
                      <button style={styles.btnPrimary} onClick={handleContact} disabled={contactSubmitting}>
                        {contactSubmitting ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TECH PROFILE CREATION */}
        {view === "techProfile" && (
          <div style={styles.formWrap}>
            {profileSubmitted ? (
              <div style={styles.successCard}>
                <div style={styles.successIcon}>✅</div>
                <h2 style={styles.successTitle}>Profile Submitted!</h2>
                <p style={styles.successMsg}>Your profile is now live. Companies searching for qualified UXO techs will be able to find you when you're open to work. Check your email for a confirmation.</p>
                <button style={styles.btnPrimary} onClick={() => { setProfileSubmitted(false); setView("jobs"); setProfileStep(1); }}>Back to Jobs</button>
              </div>
            ) : (
              <div>
                <button style={styles.backBtn} onClick={() => setView("jobs")}>← Back</button>
                {notifications.length > 0 && (
                  <div style={styles.notifWrap}>
                    {notifications.map((n, i) => <div key={i} style={styles.notifBanner}>{n}</div>)}
                  </div>
                )}
                <div style={styles.formCard}>
                  <div style={styles.formSteps}>
                    {[1, 2, 3].map(s => (
                      <div key={s} style={{ ...styles.step, ...(profileStep >= s ? styles.stepActive : {}) }}>{s}</div>
                    ))}
                  </div>
                  <h2 style={styles.formTitle}>
                    {profileStep === 1 && "Basic Information"}
                    {profileStep === 2 && "Qualifications & Certifications"}
                    {profileStep === 3 && "Availability Settings"}
                  </h2>

                  {profileStep === 1 && (
                    <div style={styles.formFields}>
                      <label style={styles.label}>Full Name</label>
                      <input style={styles.input} placeholder="John Smith" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                      <label style={styles.label}>Email Address</label>
                      <input style={styles.input} placeholder="you@email.com" type="email" value={profile.email || user?.email || ''} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                      <label style={styles.label}>Location (City, State)</label>
                      <input style={styles.input} placeholder="Dallas, TX" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
                      <label style={styles.label}>UXO Hours</label>
                      <input style={styles.input} placeholder="e.g. 3,500" value={profile.uxoHours} onChange={e => setProfile(p => ({ ...p, uxoHours: e.target.value }))} />
                      <label style={styles.label}>Geographic Availability</label>
                      <select style={styles.input} value={profile.travel} onChange={e => setProfile(p => ({ ...p, travel: e.target.value }))}>
                        {TRAVEL_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <label style={styles.label}>Professional Summary</label>
                      <textarea style={styles.textarea} placeholder="Brief overview of your UXO background and specialties..." value={profile.summary} onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))} />
                      <button style={styles.btnPrimary} onClick={() => setProfileStep(2)}>Next →</button>
                    </div>
                  )}

                  {profileStep === 2 && (
                    <div style={styles.formFields}>
                      <label style={styles.label}>DOD Certification Level (select all that apply)</label>
                      <div style={styles.certGrid}>
                        {DOD_CERT_OPTIONS.map(cert => (
                          <div key={cert} style={{ ...styles.certToggle, ...(profile.dodCerts.includes(cert) ? styles.certToggleActive : {}) }} onClick={() => toggleDodCert(cert)}>
                            {profile.dodCerts.includes(cert) ? "✓ " : ""}{cert}
                          </div>
                        ))}
                      </div>

                      {/* HAZWOPER 40-HR */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>HAZWOPER 40-HR</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.hazwoper40 ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, hazwoper40: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.hazwoper40 ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, hazwoper40: false, hazwoper40Date: "", hazwoper8: false, hazwoper8Date: "" }))}>No</button>
                          </div>
                        </div>
                        {profile.hazwoper40 && (
                          <div style={styles.subField}>
                            <label style={styles.label}>Issue Date</label>
                            <input type="date" style={styles.input} value={profile.hazwoper40Date} onChange={e => setProfile(p => ({ ...p, hazwoper40Date: e.target.value }))} />
                          </div>
                        )}
                      </div>

                      {/* 8-HR HAZWOPER */}
                      {show8HrQuestion && (
                        <div style={styles.qualBlock}>
                          <div style={styles.qualRow}>
                            <span style={styles.qualBlockLabel}>8-HR HAZWOPER Refresher</span>
                            <div style={styles.yesNoRow}>
                              <button style={{ ...styles.yesNoBtn, ...(profile.hazwoper8 ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, hazwoper8: true }))}>Yes</button>
                              <button style={{ ...styles.yesNoBtn, ...(!profile.hazwoper8 ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, hazwoper8: false, hazwoper8Date: "" }))}>No</button>
                            </div>
                          </div>
                          {profile.hazwoper8 && (
                            <div style={styles.subField}>
                              <label style={styles.label}>Issue Date</label>
                              <input type="date" style={styles.input} value={profile.hazwoper8Date} onChange={e => setProfile(p => ({ ...p, hazwoper8Date: e.target.value }))} />
                              {errors.hazwoper8Date && <div style={styles.errorMsg}>⚠️ {errors.hazwoper8Date}</div>}
                              {isExpiringSoon(profile.hazwoper8Date) && !isExpired(profile.hazwoper8Date) && <div style={styles.warnMsg}>⚠️ Your 8-HR HAZWOPER expires within 30 days.</div>}
                              <label style={{ ...styles.label, marginTop: 8 }}>Upload 8-HR Cert</label>
                              <label htmlFor="hazwoper8Upload" style={styles.uploadBox}>
                                <span style={styles.uploadIcon}>📎</span>
                                <p style={styles.uploadText}>Click here to upload 8-HR cert (PDF, JPG, PNG)</p>
                                <input id="hazwoper8Upload" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={async (e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setUploadStatus(s => ({ ...s, hazwoper8: 'uploading' }));
                                    const { path, error } = await uploadFile(file, 'certs');
                                    setUploadStatus(s => ({ ...s, hazwoper8: error ? 'error' : 'success' }));
                                    if (path) setUploadPaths(p => ({ ...p, hazwoper8: path }));
                                  }
                                }} />
                              </label>
                              {uploadStatus.hazwoper8 === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>⏳ Uploading...</div>}
                              {uploadStatus.hazwoper8 === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>✅ Uploaded successfully</div>}
                              {uploadStatus.hazwoper8 === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>❌ Upload failed. Please try again.</div>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CURRENT PHYSICAL */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>Current Physical (within 1 year)</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.physicalCurrent ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, physicalCurrent: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.physicalCurrent ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, physicalCurrent: false, physicalDate: "" }))}>No</button>
                          </div>
                        </div>
                        {profile.physicalCurrent && (
                          <div style={styles.subField}>
                            <label style={styles.label}>Issue Date</label>
                            <input type="date" style={styles.input} value={profile.physicalDate} onChange={e => setProfile(p => ({ ...p, physicalDate: e.target.value }))} />
                            {errors.physicalDate && <div style={styles.errorMsg}>⚠️ {errors.physicalDate}</div>}
                            {isExpiringSoon(profile.physicalDate) && !isExpired(profile.physicalDate) && <div style={styles.warnMsg}>⚠️ Your physical expires within 30 days.</div>}
                            <label style={{ ...styles.label, marginTop: 8 }}>Upload Physical</label>
                            <label htmlFor="physicalUpload" style={styles.uploadBox}>
                              <span style={styles.uploadIcon}>📎</span>
                              <p style={styles.uploadText}>Click here to upload physical (PDF, JPG, PNG)</p>
                              <input id="physicalUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  setUploadStatus(s => ({ ...s, physical: 'uploading' }));
                                  const { path, error } = await uploadFile(file, 'physicals');
                                  setUploadStatus(s => ({ ...s, physical: error ? 'error' : 'success' }));
                                  if (path) setUploadPaths(p => ({ ...p, physical: path }));
                                }
                              }} />
                            </label>
                            {uploadStatus.physical === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>⏳ Uploading...</div>}
                            {uploadStatus.physical === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>✅ Uploaded successfully</div>}
                            {uploadStatus.physical === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>❌ Upload failed. Please try again.</div>}
                          </div>
                        )}
                      </div>

                      {/* MILITARY/EOD */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>Military / EOD Background</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.militaryEod ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, militaryEod: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.militaryEod ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, militaryEod: false }))}>No</button>
                          </div>
                        </div>
                      </div>

                      {/* SECURITY CLEARANCE */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>Security Clearance</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.clearance ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, clearance: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.clearance ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, clearance: false, clearanceLevel: "" }))}>No</button>
                          </div>
                        </div>
                        {profile.clearance && (
                          <div style={styles.subField}>
                            <label style={styles.label}>Clearance Level</label>
                            <input style={styles.input} placeholder="e.g. Secret, TS, TS/SCI" value={profile.clearanceLevel} onChange={e => setProfile(p => ({ ...p, clearanceLevel: e.target.value }))} />
                          </div>
                        )}
                      </div>

                      {/* DIVE CERT */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>Dive Certified</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.diveCert ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, diveCert: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.diveCert ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, diveCert: false }))}>No</button>
                          </div>
                        </div>
                      </div>

                      {/* DRIVERS LICENSE */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>Driver's License</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.driversLicense ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, driversLicense: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.driversLicense ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, driversLicense: false }))}>No</button>
                          </div>
                        </div>
                      </div>

                      {/* CDL */}
                      <div style={styles.qualBlock}>
                        <div style={styles.qualRow}>
                          <span style={styles.qualBlockLabel}>CDL</span>
                          <div style={styles.yesNoRow}>
                            <button style={{ ...styles.yesNoBtn, ...(profile.cdl ? styles.yesNoBtnActive : {}) }} onClick={() => setProfile(p => ({ ...p, cdl: true }))}>Yes</button>
                            <button style={{ ...styles.yesNoBtn, ...(!profile.cdl ? styles.yesNoBtnNo : {}) }} onClick={() => setProfile(p => ({ ...p, cdl: false }))}>No</button>
                          </div>
                        </div>
                      </div>

                      {/* CERT UPLOADS */}
                      <label style={styles.label}>Upload Certification Documents</label>
                      <label htmlFor="certUpload" style={styles.uploadBox}>
                        <span style={styles.uploadIcon}>📎</span>
                        <p style={styles.uploadText}>Click here to upload certs (PDF, JPG, PNG)</p>
                        <p style={styles.uploadSub}>Max 10MB each</p>
                        <input id="certUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ display: "none" }} onChange={async (e) => {
                          const files = Array.from(e.target.files);
                          setUploadStatus(s => ({ ...s, certs: 'uploading' }));
                          let anyError = false;
                          const newPaths = [];
                          for (const file of files) {
                            const { path, error } = await uploadFile(file, 'certs');
                            if (error) { anyError = true; } else if (path) { newPaths.push(path); }
                          }
                          setUploadStatus(s => ({ ...s, certs: anyError ? 'error' : 'success' }));
                          if (newPaths.length > 0) setUploadPaths(p => ({ ...p, certs: [...p.certs, ...newPaths] }));
                        }} />
                      </label>
                      {uploadStatus.certs === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>⏳ Uploading...</div>}
                      {uploadStatus.certs === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>✅ Uploaded successfully</div>}
                      {uploadStatus.certs === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>❌ One or more uploads failed. Please try again.</div>}

                      <label style={styles.label}>Upload Resume</label>
                      <label htmlFor="resumeUpload" style={styles.uploadBox}>
                        <span style={styles.uploadIcon}>📄</span>
                        <p style={styles.uploadText}>Click here to upload resume (PDF, Word)</p>
                        <p style={styles.uploadSub}>Max 10MB</p>
                        <input id="resumeUpload" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setUploadStatus(s => ({ ...s, resume: 'uploading' }));
                            const { path, error } = await uploadFile(file, 'resumes');
                            setUploadStatus(s => ({ ...s, resume: error ? 'error' : 'success' }));
                            if (path) setUploadPaths(p => ({ ...p, resume: path }));
                          }
                        }} />
                      </label>
                      {uploadStatus.resume === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>⏳ Uploading...</div>}
                      {uploadStatus.resume === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>✅ Uploaded successfully</div>}
                      {uploadStatus.resume === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>❌ Upload failed. Please try again.</div>}

                      <div style={styles.formRow}>
                        <button style={styles.btnSecondary} onClick={() => setProfileStep(1)}>← Back</button>
                        <button style={styles.btnPrimary} onClick={() => { if (validateStep2()) setProfileStep(3); }}>Next →</button>
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
                        {openToWork ? "✅ Your profile will be visible to hiring companies." : "🔒 Your profile is hidden from company searches."}
                      </div>
                      <div style={styles.formRow}>
                        <button style={styles.btnSecondary} onClick={() => setProfileStep(2)}>← Back</button>
                        <button style={styles.btnPrimary} onClick={handleSubmitProfile}>Submit Profile ✓</button>
                      </div>
                      {submitError && <div style={styles.errorMsg}>⚠️ {submitError}</div>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* POST A JOB */}
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
                {postStep === 2 && "Requirements"}
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
                  <input style={styles.input} placeholder="e.g. $45–$55/hr" value={jobPost.salary} onChange={e => setJobPost(p => ({ ...p, salary: e.target.value }))} />
                  <label style={styles.label}>Job Description</label>
                  <textarea style={{ ...styles.textarea, minHeight: "120px" }} placeholder="Describe the role, site conditions, project duration..." value={jobPost.description} onChange={e => setJobPost(p => ({ ...p, description: e.target.value }))} />
                  <button style={styles.btnPrimary} onClick={() => setPostStep(2)}>Next →</button>
                </div>
              )}

              {postStep === 2 && (
                <div style={styles.formFields}>
                  <p style={styles.certInstructions}>For each qualification, select Required or Preferred — or leave unselected if not relevant.</p>
                  {ALL_CERT_OPTIONS.map(cert => (
                    <div key={cert} style={styles.certRequireRow}>
                      <span style={styles.certRequireLabel}>{cert}</span>
                      <div style={styles.yesNoRow}>
                        <button style={{ ...styles.reqBtn, ...(jobPost.requiredCerts.includes(cert) ? styles.reqBtnRequired : {}) }} onClick={() => toggleJobCert(cert, 'required')}>Required</button>
                        <button style={{ ...styles.reqBtn, ...(jobPost.preferredCerts.includes(cert) ? styles.reqBtnPreferred : {}) }} onClick={() => toggleJobCert(cert, 'preferred')}>Preferred</button>
                      </div>
                    </div>
                  ))}
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
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Required Certs</span><span>{jobPost.requiredCerts.join(", ") || "None"}</span></div>
                    <div style={styles.reviewRow}><span style={styles.reviewLabel}>Preferred Certs</span><span>{jobPost.preferredCerts.join(", ") || "None"}</span></div>
                  </div>
                  <div style={styles.pricingBox}>
                    <div style={styles.pricingTitle}>Job Posting Fee</div>
                    <div style={styles.pricingAmount}>$149 <span style={styles.pricingPer}>/ 30 days</span></div>
                    <ul style={styles.pricingFeatures}>
                      <li>✓ Listed to all qualified, active techs</li>
                      <li>✓ Filtered by your required certifications</li>
                      <li>✓ Direct contact with candidates</li>
                      <li>✓ Re-post or extend anytime</li>
                    </ul>
                  </div>
                  <div style={styles.formRow}>
                    <button style={styles.btnSecondary} onClick={() => setPostStep(2)}>← Back</button>
                    <button style={styles.btnPrimary} onClick={handleSubmitJobPost}>Submit Job Post →</button>
                  </div>
                  {submitError && <div style={styles.errorMsg}>⚠️ {submitError}</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* JOB POST SUCCESS */}
        {view === "jobPostSuccess" && (
          <div style={styles.formWrap}>
            <div style={styles.successCard}>
              <div style={styles.successIcon}>🎯</div>
              <h2 style={styles.successTitle}>Job Post Received!</h2>
              <p style={styles.successMsg}>
                Your job posting has been saved. To publish it and make it visible to techs,
                complete payment of $149/30 days. You'll receive payment instructions via email shortly.
              </p>
              <button style={styles.btnPrimary} onClick={() => { setView("jobs"); setPostStep(1); setJobPost({ company: "", title: "", location: "", type: "Contract", salary: "", description: "", requiredCerts: [], preferredCerts: [] }); }}>
                Back to Jobs
              </button>
            </div>
          </div>
        )}

        {/* LOGIN VIEW */}
        {view === 'login' && (
          <div style={styles.formWrap}>
            <button style={styles.backBtn} onClick={() => { setView('jobs'); setAuthError(''); }}>← Back</button>
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>Log In</h2>
              <div style={styles.formFields}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" placeholder="Your password" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
                {authError && <div style={styles.errorMsg}>⚠️ {authError}</div>}
                <button style={styles.btnPrimary} onClick={handleLogin} disabled={authLoading}>
                  {authLoading ? 'Logging in...' : 'Log In'}
                </button>
                <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
                  Don't have an account?{' '}
                  <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={() => { setView('signup'); setAuthError(''); }}>Sign up</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SIGNUP VIEW */}
        {view === 'signup' && (
          <div style={styles.formWrap}>
            <button style={styles.backBtn} onClick={() => { setView('jobs'); setAuthError(''); }}>← Back</button>
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>Create Account</h2>
              <div style={styles.formFields}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" placeholder="you@email.com" value={authForm.email} onChange={e => setAuthForm(f => ({ ...f, email: e.target.value }))} />
                <label style={styles.label}>Password</label>
                <input style={styles.input} type="password" placeholder="Minimum 6 characters" value={authForm.password} onChange={e => setAuthForm(f => ({ ...f, password: e.target.value }))} />
                {authError && <div style={styles.errorMsg}>⚠️ {authError}</div>}
                <button style={styles.btnPrimary} onClick={handleSignUp} disabled={authLoading}>
                  {authLoading ? 'Creating account...' : 'Create Account'}
                </button>
                <p style={{ color: '#7a7570', fontSize: 13, textAlign: 'center' }}>
                  Already have an account?{' '}
                  <span style={{ color: '#d97706', cursor: 'pointer' }} onClick={() => { setView('login'); setAuthError(''); }}>Log in</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MY PROFILE VIEW */}
        {view === 'myProfile' && (
          <div style={styles.formWrap}>
            <button style={styles.backBtn} onClick={() => setView('jobs')}>← Back to Jobs</button>
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>My Profile</h2>
              {!user ? (
                <p style={{ color: '#7a7570' }}>You must be logged in to view your profile.</p>
              ) : myProfileLoading ? (
                <p style={{ color: '#7a7570' }}>Loading...</p>
              ) : !myProfile ? (
                <div style={styles.formFields}>
                  <p style={{ color: '#9a9490', fontSize: 15 }}>You haven't created a tech profile yet.</p>
                  <button style={styles.btnPrimary} onClick={goToCreateProfile}>Create Tech Profile</button>
                </div>
              ) : (
                <div style={styles.formFields}>
                  <div style={styles.detailHeader}>
                    <div>
                      <h3 style={{ ...styles.detailTitle, fontSize: 22 }}>{myProfile.name}</h3>
                      <div style={styles.cardMeta}>
                        <span>📍 {myProfile.location}</span>
                        <span>⏱ {myProfile.uxoHours} UXO hrs</span>
                        <span>✈️ {myProfile.travel}</span>
                      </div>
                    </div>
                  </div>
                  <div style={styles.divider} />

                  <div style={styles.toggleRow}>
                    <div style={styles.toggleInfo}>
                      <div style={styles.toggleTitle}>Open to Work</div>
                      <div style={styles.toggleSub}>When active, companies can find and contact you.</div>
                    </div>
                    <div style={{ ...styles.toggleSwitch, background: myProfile.available ? '#d97706' : '#333' }} onClick={handleToggleAvailability}>
                      <div style={{ ...styles.toggleKnob, transform: myProfile.available ? 'translateX(24px)' : 'translateX(0)' }} />
                    </div>
                  </div>
                  <div style={styles.availNote}>
                    {myProfile.available ? '✅ Your profile is visible to hiring companies.' : '🔒 Your profile is hidden from company searches.'}
                  </div>

                  <div style={styles.divider} />
                  <h3 style={styles.sectionLabel}>DOD Certifications</h3>
                  <div style={styles.certTags}>
                    {myProfile.dodCerts.map(c => <span key={c} style={{ ...styles.certTag, background: CERT_COLORS[c] || '#333' }}>{c}</span>)}
                  </div>
                  <h3 style={styles.sectionLabel}>Summary</h3>
                  <p style={styles.detailDesc}>{myProfile.summary}</p>
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
  root: { fontFamily: "'Georgia', 'Times New Roman', serif", background: "#0d0f10", color: "#e8e4dc", minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: { background: "#111316", borderBottom: "1px solid #222", position: "sticky", top: 0, zIndex: 100 },
  navInner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" },
  logoIcon: { fontSize: 22, color: "#d97706" },
  logoText: { fontSize: 22, fontWeight: "bold", letterSpacing: "-0.5px", color: "#e8e4dc" },
  logoAccent: { color: "#d97706" },
  navLinks: { display: "flex", alignItems: "center", gap: 8 },
  navLink: { background: "none", border: "none", color: "#9a9490", cursor: "pointer", padding: "8px 14px", fontSize: 15, borderRadius: 6, fontFamily: "inherit" },
  navLinkActive: { background: "none", border: "none", color: "#e8e4dc", cursor: "pointer", padding: "8px 14px", fontSize: 15, borderRadius: 6, fontFamily: "inherit", fontWeight: "bold" },
  navCTA: { background: "#d97706", border: "none", color: "#0d0f10", cursor: "pointer", padding: "8px 18px", fontSize: 14, borderRadius: 6, fontWeight: "bold", fontFamily: "inherit", marginLeft: 8 },
  main: { flex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 60px", width: "100%", boxSizing: "border-box" },
  notifWrap: { margin: "0 0 16px" },
  notifBanner: { background: "#2a1a08", border: "1px solid #d97706", borderRadius: 8, padding: "12px 16px", fontSize: 14, color: "#d97706", marginBottom: 8 },
  hero: { padding: "72px 0 48px", borderBottom: "1px solid #1e2022", marginBottom: 36 },
  heroBadge: { display: "inline-block", background: "#1a1408", border: "1px solid #3a2a08", color: "#d97706", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 20, marginBottom: 20 },
  heroTitle: { fontSize: 52, fontWeight: "bold", lineHeight: 1.1, margin: "0 0 16px", letterSpacing: "-1px" },
  heroAccent: { color: "#d97706" },
  heroSub: { fontSize: 18, color: "#9a9490", maxWidth: 480, lineHeight: 1.6, margin: "0 0 28px" },
  heroActions: { display: "flex", gap: 12 },
  btnPrimary: { background: "#d97706", border: "none", color: "#0d0f10", padding: "12px 24px", fontSize: 15, fontWeight: "bold", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" },
  btnSecondary: { background: "transparent", border: "1px solid #333", color: "#e8e4dc", padding: "12px 24px", fontSize: 15, borderRadius: 6, cursor: "pointer", fontFamily: "inherit" },
  filterBar: { display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" },
  filterSelect: { background: "#161819", border: "1px solid #2a2c2e", color: "#e8e4dc", padding: "9px 14px", borderRadius: 6, fontSize: 14, fontFamily: "inherit", minWidth: 200 },
  filterInput: { background: "#161819", border: "1px solid #2a2c2e", color: "#e8e4dc", padding: "9px 14px", borderRadius: 6, fontSize: 14, fontFamily: "inherit", minWidth: 200, outline: "none" },
  filterCount: { color: "#6a6660", fontSize: 13, marginLeft: "auto" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 },
  jobCard: { background: "#111316", border: "1px solid #1e2022", borderRadius: 10, padding: "20px 22px", cursor: "pointer" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardCompany: { fontSize: 12, color: "#7a7570", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#e8e4dc", lineHeight: 1.3 },
  cardBadge: { background: "#1a2a1a", color: "#4ade80", fontSize: 11, padding: "3px 9px", borderRadius: 12, whiteSpace: "nowrap", marginLeft: 10 },
  availBadge: { fontSize: 11, padding: "3px 10px", borderRadius: 12, whiteSpace: "nowrap", marginLeft: 10 },
  cardMeta: { display: "flex", gap: 16, fontSize: 13, color: "#7a7570", marginBottom: 14, flexWrap: "wrap" },
  certSection: { marginBottom: 14 },
  certLabel: { fontSize: 11, color: "#6a6660", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4, marginTop: 6 },
  certTags: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 },
  certTag: { fontSize: 11, padding: "3px 9px", borderRadius: 4, color: "#e8e4dc", letterSpacing: "0.04em" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  cardPosted: { fontSize: 12, color: "#555" },
  cardLink: { fontSize: 13, color: "#d97706", fontWeight: "bold" },
  techSummary: { fontSize: 13, color: "#8a8580", lineHeight: 1.5, margin: "8px 0 14px" },
  detailWrap: { paddingTop: 32 },
  backBtn: { background: "none", border: "none", color: "#d97706", cursor: "pointer", fontSize: 14, padding: "0 0 20px", fontFamily: "inherit", display: "block" },
  detailCard: { background: "#111316", border: "1px solid #1e2022", borderRadius: 12, padding: "32px 36px", maxWidth: 720 },
  detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  detailTitle: { fontSize: 28, fontWeight: "bold", margin: "4px 0 10px", letterSpacing: "-0.5px" },
  divider: { height: 1, background: "#1e2022", margin: "20px 0" },
  sectionLabel: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "#6a6660", margin: "16px 0 10px" },
  detailDesc: { fontSize: 15, color: "#b0aca6", lineHeight: 1.7, margin: "0 0 24px" },
  qualGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 },
  qualItem: { background: "#0d0f10", border: "1px solid #1e2022", borderRadius: 6, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  qualLabel: { fontSize: 13, color: "#8a8580" },
  qualYes: { fontSize: 13, color: "#4ade80" },
  qualNo: { fontSize: 13, color: "#555" },
  pageHeader: { padding: "48px 0 32px", borderBottom: "1px solid #1e2022", marginBottom: 36 },
  pageTitle: { fontSize: 36, fontWeight: "bold", margin: "0 0 8px", letterSpacing: "-0.5px" },
  pageSub: { fontSize: 15, color: "#7a7570", margin: 0 },
  inlineLink: { color: "#d97706", textDecoration: "none" },
  formWrap: { paddingTop: 32, maxWidth: 640 },
  successCard: { background: "#111316", border: "1px solid #1e2022", borderRadius: 12, padding: "48px 40px", textAlign: "center", maxWidth: 480, marginTop: 32 },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 28, fontWeight: "bold", margin: "0 0 16px", letterSpacing: "-0.5px" },
  successMsg: { fontSize: 15, color: "#9a9490", lineHeight: 1.7, margin: "0 0 28px" },
  formCard: { background: "#111316", border: "1px solid #1e2022", borderRadius: 12, padding: "36px 40px" },
  formSteps: { display: "flex", gap: 8, marginBottom: 28 },
  step: { width: 30, height: 30, borderRadius: "50%", background: "#1e2022", color: "#555", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold" },
  stepActive: { background: "#d97706", color: "#0d0f10" },
  formTitle: { fontSize: 24, fontWeight: "bold", margin: "0 0 24px", letterSpacing: "-0.3px" },
  formFields: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 13, color: "#8a8580", marginBottom: 2, letterSpacing: "0.04em" },
  input: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 6, color: "#e8e4dc", padding: "10px 14px", fontSize: 15, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box" },
  textarea: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 6, color: "#e8e4dc", padding: "10px 14px", fontSize: 15, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box", minHeight: 100, resize: "vertical" },
  certGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  certToggle: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 6, color: "#8a8580", padding: "7px 13px", fontSize: 13, cursor: "pointer", userSelect: "none" },
  certToggleActive: { background: "#1a2a08", border: "1px solid #4ade80", color: "#4ade80" },
  qualBlock: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 8, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 },
  qualRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  qualBlockLabel: { fontSize: 14, color: "#e8e4dc" },
  yesNoRow: { display: "flex", gap: 6 },
  yesNoBtn: { background: "#1a1c1e", border: "1px solid #2a2c2e", color: "#6a6660", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  yesNoBtnActive: { background: "#1a4a2e", border: "1px solid #4ade80", color: "#4ade80" },
  yesNoBtnNo: { background: "#2a1a1a", border: "1px solid #555", color: "#aaa" },
  subField: { paddingTop: 8, display: "flex", flexDirection: "column", gap: 8 },
  errorMsg: { background: "#2a0a0a", border: "1px solid #8B0000", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#ff6b6b" },
  warnMsg: { background: "#2a1a08", border: "1px solid #d97706", borderRadius: 6, padding: "8px 12px", fontSize: 13, color: "#d97706" },
  uploadBox: { border: "2px dashed #2a2c2e", borderRadius: 8, padding: "20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" },
  uploadIcon: { fontSize: 24 },
  uploadText: { fontSize: 13, color: "#8a8580", margin: 0 },
  uploadSub: { fontSize: 12, color: "#555", margin: "0 0 8px" },
  formRow: { display: "flex", gap: 12, justifyContent: "flex-end" },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 8, padding: "16px 18px" },
  toggleInfo: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
  toggleSub: { fontSize: 13, color: "#6a6660", lineHeight: 1.4 },
  toggleSwitch: { width: 50, height: 26, borderRadius: 13, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, marginLeft: 16 },
  toggleKnob: { position: "absolute", top: 3, left: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "transform 0.2s" },
  availNote: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 6, padding: "12px 16px", fontSize: 14, color: "#8a8580" },
  certInstructions: { fontSize: 13, color: "#8a8580", margin: "0 0 8px", lineHeight: 1.5 },
  certRequireRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0f10", border: "1px solid #1e2022", borderRadius: 6, padding: "10px 14px" },
  certRequireLabel: { fontSize: 14, color: "#e8e4dc" },
  reqBtn: { background: "#1a1c1e", border: "1px solid #2a2c2e", color: "#6a6660", padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  reqBtnRequired: { background: "#2a0a0a", border: "1px solid #8B0000", color: "#ff6b6b" },
  reqBtnPreferred: { background: "#0a1a2a", border: "1px solid #1a3a5a", color: "#7ab3d4" },
  reviewCard: { background: "#0d0f10", border: "1px solid #2a2c2e", borderRadius: 8, padding: "18px 20px", marginBottom: 20 },
  reviewRow: { display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #1a1c1e", fontSize: 14 },
  reviewLabel: { color: "#6a6660" },
  pricingBox: { background: "#12100a", border: "1px solid #3a2a08", borderRadius: 10, padding: "22px 24px", marginBottom: 20 },
  pricingTitle: { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#d97706", marginBottom: 6 },
  pricingAmount: { fontSize: 36, fontWeight: "bold", marginBottom: 14, letterSpacing: "-1px" },
  pricingPer: { fontSize: 16, fontWeight: "normal", color: "#6a6660" },
  pricingFeatures: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6, fontSize: 14, color: "#9a9490" },
  footer: { borderTop: "1px solid #1a1c1e", padding: "24px" },
  footerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 },
  footerSub: { fontSize: 13, color: "#555" },
};
