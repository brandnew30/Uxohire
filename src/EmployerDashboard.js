import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";
import { normalizeTech } from "./utils/helpers";
import TechCard from "./components/TechCard";
import { CERT_COLORS } from "./utils/constants";

const JOB_STATUS_META = {
  published:       { bg: '#0a2a1a', color: '#4ade80',  label: 'Published' },
  pending_payment: { bg: '#2a1e08', color: '#fbbf24',  label: 'Pending Payment' },
  expired:         { bg: '#2a0a0a', color: '#f87171',  label: 'Expired' },
};

const APP_STATUS_OPTIONS = ['submitted', 'under_review', 'accepted', 'rejected'];
const APP_STATUS_LABELS  = {
  submitted:    'Submitted',
  under_review: 'Under Review',
  accepted:     'Accepted',
  rejected:     'Rejected',
};
const APP_STATUS_COLORS = {
  submitted:    '#9a9490',
  under_review: '#fbbf24',
  accepted:     '#4ade80',
  rejected:     '#f87171',
};

function StatusBadge({ status, meta }) {
  const m = meta[status] || { bg: '#1a1c1e', color: '#9a9490', label: status };
  return (
    <span style={{
      background: m.bg, color: m.color, fontSize: 11, padding: '3px 9px',
      borderRadius: 12, fontWeight: 'bold', whiteSpace: 'nowrap',
      border: `1px solid ${m.color}33`,
    }}>
      {"\u25CF"} {m.label}
    </span>
  );
}

export default function EmployerDashboard({ user }) {
  const navigate = useNavigate();
  const [tab, setTab]                   = useState('posts');
  const [posts, setPosts]               = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [applications, setApplications] = useState({});
  const [appsLoading, setAppsLoading]   = useState({});
  const [contacts, setContacts]         = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [techs, setTechs]              = useState([]);
  const [techsLoading, setTechsLoading] = useState(false);
  const [isPaid, setIsPaid]            = useState(false);
  const [accountLoading, setAccountLoading] = useState(true);
  const [activeTech, setActiveTech]    = useState(null);

  // Fetch account status
  useEffect(() => {
    setAccountLoading(true);
    supabase.from('user_accounts').select('is_paid_employer').eq('user_id', user.id).single()
      .then(({ data }) => {
        setIsPaid(data?.is_paid_employer || false);
        setAccountLoading(false);
      });
  }, [user.id]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    const { data } = await supabase
      .from('job_posts')
      .select('id, title, company, location, type, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setPostsLoading(false);
  }, [user.id]);

  const fetchApplications = async (postId) => {
    setAppsLoading(p => ({ ...p, [postId]: true }));
    const { data } = await supabase
      .from('applications')
      .select('id, applicant_name, applicant_email, message, status, created_at')
      .eq('job_id', postId)
      .order('created_at', { ascending: false });
    setApplications(p => ({ ...p, [postId]: data || [] }));
    setAppsLoading(p => ({ ...p, [postId]: false }));
  };

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    const { data } = await supabase
      .from('contacts')
      .select('id, message, created_at, company, tech_profiles(name, location)')
      .eq('employer_email', user.email)
      .order('created_at', { ascending: false });
    setContacts(data || []);
    setContactsLoading(false);
  }, [user.email]);

  const fetchTechs = useCallback(async () => {
    setTechsLoading(true);
    const { data } = await supabase
      .from('tech_profiles').select('*').eq('open_to_work', true);
    setTechs((data || []).map(normalizeTech));
    setTechsLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { if (tab === 'contacts') fetchContacts(); }, [tab, fetchContacts]);
  useEffect(() => { if (tab === 'techs') fetchTechs(); }, [tab, fetchTechs]);

  const togglePost = (postId) => {
    if (expandedPost === postId) { setExpandedPost(null); }
    else { setExpandedPost(postId); if (!applications[postId]) fetchApplications(postId); }
  };

  const handleAppStatus = async (appId, postId, newStatus) => {
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
    setApplications(p => ({
      ...p, [postId]: (p[postId] || []).map(a => a.id === appId ? { ...a, status: newStatus } : a),
    }));
  };

  const handleDeletePost = async (postId) => {
    await supabase.from('job_posts').delete().eq('id', postId);
    setPosts(p => p.filter(j => j.id !== postId));
    setDeleteConfirm(null);
    if (expandedPost === postId) setExpandedPost(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const tabItems = [
    { id: 'posts', label: 'Posts & Applicants', icon: '\uD83D\uDCCB' },
    { id: 'techs', label: 'Browse Techs', icon: '\uD83D\uDC65' },
    { id: 'contacts', label: 'Contact Inbox', icon: '\uD83D\uDCE8' },
    { id: 'account', label: 'Account', icon: '\u2699\uFE0F' },
  ];

  return (
    <div style={s.root}>
      <Navbar view="employerDashboard" setView={(v) => navigate(v === 'jobs' ? '/' : `/${v}`)}
        user={user} navigate={navigate} onSignOut={handleSignOut} accountType="employer" />

      <main style={s.main} data-main-container>
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle} data-page-title>Employer Hub</h1>
          <p style={s.pageSub} data-page-subtitle>Manage your job posts, applicants, and tech outreach.</p>
        </div>

        {/* Tab bar */}
        <div style={s.tabs} className="ed-tab-bar">
          {tabItems.map(t => (
            <button key={t.id}
              className={"ed-tab" + (tab === t.id ? " ed-tab-active" : "")}
              style={tab === t.id ? s.tabActive : s.tab}
              onClick={() => { setTab(t.id); setActiveTech(null); }}
            >
              <span className="ed-tab-icon">{t.icon}</span>
              <span className="ed-tab-label">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ══ MY POSTS TAB ══ */}
        {tab === 'posts' && (
          <div>
            {postsLoading && <p style={s.empty}>Loading your posts...</p>}
            {!postsLoading && posts.length === 0 && (
              <div style={s.emptyCard}>
                <p style={s.emptyTitle}>No job posts yet.</p>
                <p style={{ color: '#9a9490', marginBottom: 16 }}>
                  Post your first role and start receiving applicants.
                </p>
                <button style={s.btnPrimary} onClick={() => navigate('/post-job')}>
                  Post a Job {"\u2192"}
                </button>
              </div>
            )}
            {!postsLoading && posts.map(post => {
              const apps = applications[post.id] || [];
              const expanded = expandedPost === post.id;
              const loading = appsLoading[post.id];
              return (
                <div key={post.id} style={s.postCard}>
                  <div style={s.postRow} className="ed-post-row">
                    <div style={s.postInfo}>
                      <div style={s.postTitle}>{post.title}</div>
                      <div style={s.postMeta}>
                        {post.company} {"\u00B7"} {post.location} {"\u00B7"} {post.type}
                        <span style={{ marginLeft: 10 }}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={s.postActions} className="ed-post-actions">
                      <StatusBadge status={post.status} meta={JOB_STATUS_META} />
                      <button style={s.btnSmall} onClick={() => togglePost(post.id)}>
                        {expanded ? 'Hide Applicants \u25B2' : `Applicants${apps.length ? ` (${apps.length})` : ''} \u25BC`}
                      </button>
                      {deleteConfirm === post.id ? (
                        <>
                          <span style={{ color: '#f87171', fontSize: 13 }}>Delete?</span>
                          <button style={{ ...s.btnSmall, color: '#f87171', borderColor: '#f87171' }}
                            onClick={() => handleDeletePost(post.id)}>Yes</button>
                          <button style={s.btnSmall} onClick={() => setDeleteConfirm(null)}>No</button>
                        </>
                      ) : (
                        <button style={{ ...s.btnSmall, color: '#f87171', borderColor: '#f87171' }}
                          onClick={() => setDeleteConfirm(post.id)}>Delete</button>
                      )}
                    </div>
                  </div>
                  {expanded && (
                    <div style={s.appsPanel}>
                      {loading && <p style={s.empty}>Loading applicants...</p>}
                      {!loading && apps.length === 0 && (
                        <p style={s.empty}>No applications yet for this post.</p>
                      )}
                      {!loading && apps.map(app => (
                        <div key={app.id} style={s.appRow}>
                          <div style={s.appInfo}>
                            <div style={s.appName}>{app.applicant_name}</div>
                            <div style={s.appEmail}>{app.applicant_email}</div>
                            {app.message && <p style={s.appMessage}>"{app.message}"</p>}
                            <div style={{ fontSize: 11, color: '#7a7570', marginTop: 4 }}>
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={s.appStatusWrap}>
                            <span style={{ fontSize: 11, fontWeight: 'bold', color: APP_STATUS_COLORS[app.status] || '#9a9490' }}>
                              {APP_STATUS_LABELS[app.status] || app.status}
                            </span>
                            <select style={s.statusSelect} value={app.status}
                              onChange={e => handleAppStatus(app.id, post.id, e.target.value)}>
                              {APP_STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{APP_STATUS_LABELS[opt]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ══ BROWSE TECHS TAB ══ */}
        {tab === 'techs' && !activeTech && (
          <div>
            {!isPaid && (
              <div style={{
                background: '#1a1408', border: '1px solid #d97706', borderRadius: 8,
                padding: '14px 20px', marginBottom: 20, display: 'flex',
                justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: 14 }}>
                    {"\uD83D\uDD12"} Free Account — Limited Access
                  </div>
                  <div style={{ color: '#9a9490', fontSize: 12, marginTop: 2 }}>
                    Upgrade to view full profiles, contact information, and message technicians directly.
                  </div>
                </div>
                <button style={{
                  background: '#d97706', border: 'none', color: '#0d0f10', padding: '8px 18px',
                  fontSize: 13, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  flexShrink: 0,
                }} onClick={() => window.alert('Subscription feature coming soon!')}>
                  Upgrade Now
                </button>
              </div>
            )}
            {techsLoading && <p style={s.empty}>Loading technicians...</p>}
            {!techsLoading && techs.length === 0 && (
              <div style={s.emptyCard}>
                <p style={s.emptyTitle}>No technicians available.</p>
                <p style={{ color: '#9a9490' }}>Check back later for available UXO technicians.</p>
              </div>
            )}
            {!techsLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {techs.map(tech => (
                  <TechCard key={tech.id} tech={tech} onClick={() => setActiveTech(tech)}
                    isFreeEmployer={!isPaid} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tech detail view within employer dashboard */}
        {tab === 'techs' && activeTech && (
          <div>
            <button style={s.backBtn} onClick={() => setActiveTech(null)}>{"\u2190"} Back to Techs</button>
            <div style={s.techDetailCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 'bold', margin: '0 0 6px' }}>{activeTech.name}</h2>
                  <div style={{ fontSize: 13, color: '#7a7570' }}>
                    {!isPaid && activeTech.location ? activeTech.location.split(',').pop()?.trim() : activeTech.location}
                    {" \u00B7 "}{activeTech.uxoHours} UXO hrs {" \u00B7 "}{activeTech.travel}
                  </div>
                </div>
                <div style={{ background: '#1a4a2e', color: '#4ade80', fontSize: 11, padding: '3px 10px', borderRadius: 12 }}>{"\u25CF"} Open to Work</div>
              </div>

              {!isPaid && (
                <div style={{
                  background: '#1a1408', border: '1px solid #d97706', borderRadius: 8,
                  padding: '16px 20px', marginBottom: 20, textAlign: 'center',
                }}>
                  <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: 15, marginBottom: 6 }}>
                    {"\uD83D\uDD12"} Subscribe to contact this technician
                  </div>
                  <div style={{ color: '#9a9490', fontSize: 13, marginBottom: 12 }}>
                    Upgrade to view full contact information and send messages.
                  </div>
                  <button style={{
                    background: '#d97706', border: 'none', color: '#0d0f10', padding: '10px 24px',
                    fontSize: 14, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  }} onClick={() => window.alert('Subscription feature coming soon!')}>
                    Upgrade Now
                  </button>
                </div>
              )}

              <div style={{ fontSize: 11, color: '#6a6660', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Certifications</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {activeTech.dodCerts.map(c => (
                  <span key={c} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, color: '#e8e4dc', background: CERT_COLORS[c] || '#333' }}>{c}</span>
                ))}
                {activeTech.hazwoper40 && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 4, background: '#1a4a2e', color: '#e8e4dc' }}>HAZWOPER 40-HR</span>}
              </div>

              {isPaid && activeTech.summary && (
                <>
                  <div style={{ fontSize: 11, color: '#6a6660', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Summary</div>
                  <p style={{ fontSize: 14, color: '#b0aca6', lineHeight: 1.7, margin: '0 0 16px' }}>{activeTech.summary}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* ══ CONTACT INBOX TAB ══ */}
        {tab === 'contacts' && (
          <div>
            {contactsLoading && <p style={s.empty}>Loading your contact history...</p>}
            {!contactsLoading && contacts.length === 0 && (
              <div style={s.emptyCard}>
                <p style={s.emptyTitle}>No contacts sent yet.</p>
                <p style={{ color: '#9a9490' }}>
                  When you contact a technician, those messages appear here.
                </p>
              </div>
            )}
            {!contactsLoading && contacts.map(c => (
              <div key={c.id} style={s.contactCard}>
                <div style={s.contactHeader}>
                  <div>
                    <div style={s.contactTechName}>{c.tech_profiles?.name || 'Unknown Technician'}</div>
                    <div style={s.contactMeta}>
                      {c.tech_profiles?.location && <span>{c.tech_profiles.location} {"\u00B7"} </span>}
                      {c.company && <span>{c.company} {"\u00B7"} </span>}
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p style={s.contactMessage}>"{c.message}"</p>
              </div>
            ))}
          </div>
        )}

        {/* ══ ACCOUNT TAB ══ */}
        {tab === 'account' && (
          <div>
            <div style={s.accountCard}>
              <div style={{ fontSize: 11, color: '#6a6660', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Account Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <span style={{
                  background: isPaid ? '#0a2a1a' : '#2a1e08',
                  color: isPaid ? '#4ade80' : '#fbbf24',
                  fontSize: 13, fontWeight: 'bold', padding: '5px 14px', borderRadius: 12,
                  border: `1px solid ${isPaid ? '#4ade8033' : '#fbbf2433'}`,
                }}>
                  {isPaid ? '\u2713 Paid Employer' : 'Free Account'}
                </span>
                <span style={{ color: '#7a7570', fontSize: 13 }}>{user.email}</span>
              </div>

              {!isPaid && (
                <div style={{
                  background: '#0d0f10', border: '1px solid #2a2c2e', borderRadius: 8, padding: '20px',
                }}>
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Upgrade to Employer Pro</div>
                  <div style={{ color: '#9a9490', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                    Unlock full access to technician profiles, contact information, and direct messaging.
                  </div>
                  <ul style={{ color: '#9a9490', fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: '0 0 16px' }}>
                    <li>View full technician profiles and summaries</li>
                    <li>Access contact information and specific locations</li>
                    <li>Send direct messages to technicians</li>
                    <li>Priority job post visibility</li>
                  </ul>
                  <button style={{
                    background: '#d97706', border: 'none', color: '#0d0f10', padding: '12px 28px',
                    fontSize: 15, fontWeight: 'bold', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  }} onClick={() => window.alert('Subscription feature coming soon!')}>
                    Upgrade Now
                  </button>
                </div>
              )}

              {isPaid && (
                <div style={{
                  background: '#0a2a1a', border: '1px solid #4ade8033', borderRadius: 8, padding: '20px',
                }}>
                  <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>
                    {"\u2713"} Employer Pro — Active
                  </div>
                  <div style={{ color: '#9a9490', fontSize: 13, lineHeight: 1.6 }}>
                    You have full access to all technician profiles, contact information, and messaging.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = {
  root: { fontFamily: "'Georgia', 'Times New Roman', serif", background: '#0d0f10', color: '#e8e4dc', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  main: { flex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 24px 60px', width: '100%', boxSizing: 'border-box' },

  pageHeader: { padding: '40px 0 24px' },
  pageTitle:  { fontSize: 28, fontWeight: 'bold', color: '#e8e4dc', margin: 0 },
  pageSub:    { color: '#9a9490', fontSize: 15, marginTop: 8 },

  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid #222', marginBottom: 28, overflowX: 'auto', WebkitOverflowScrolling: 'touch' },
  tab: {
    background: 'none', border: 'none', borderBottom: '2px solid transparent',
    color: '#7a7570', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
    fontWeight: 'bold', padding: '10px 18px', marginBottom: -1,
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  },
  tabActive: {
    background: 'none', border: 'none', borderBottom: '2px solid #d97706',
    color: '#d97706', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
    fontWeight: 'bold', padding: '10px 18px', marginBottom: -1,
    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  },

  empty:     { color: '#7a7570', fontSize: 14, padding: '24px 0' },
  emptyCard: { background: '#111316', border: '1px solid #222', borderRadius: 10, padding: '32px 28px', textAlign: 'center', marginTop: 16 },
  emptyTitle: { color: '#e8e4dc', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },

  postCard: { background: '#111316', border: '1px solid #222', borderRadius: 10, marginBottom: 12, overflow: 'hidden' },
  postRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', gap: 16, flexWrap: 'wrap' },
  postInfo: { flex: 1, minWidth: 200 },
  postTitle: { fontSize: 16, fontWeight: 'bold', color: '#e8e4dc', marginBottom: 4 },
  postMeta:  { fontSize: 13, color: '#7a7570' },
  postActions: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },

  btnSmall: {
    background: 'none', border: '1px solid #333', color: '#9a9490',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12,
    padding: '5px 12px', borderRadius: 6,
  },
  btnPrimary: {
    background: '#d97706', border: 'none', color: '#0d0f10',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: 14,
    padding: '10px 20px', borderRadius: 6, fontWeight: 'bold',
  },
  backBtn: {
    background: 'none', border: 'none', color: '#d97706',
    cursor: 'pointer', fontSize: 14, padding: '0 0 16px', fontFamily: 'inherit',
  },

  appsPanel: { borderTop: '1px solid #1e1e1e', padding: '4px 20px 16px' },
  appRow: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '14px 0', borderBottom: '1px solid #1a1c1e', gap: 16, flexWrap: 'wrap',
  },
  appInfo:    { flex: 1, minWidth: 180 },
  appName:    { fontWeight: 'bold', color: '#e8e4dc', fontSize: 14, marginBottom: 2 },
  appEmail:   { color: '#7a7570', fontSize: 13, marginBottom: 6 },
  appMessage: { color: '#9a9490', fontSize: 13, fontStyle: 'italic', margin: '6px 0 0', lineHeight: 1.5 },
  appStatusWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, minWidth: 130 },
  statusSelect: {
    background: '#1a1c1e', border: '1px solid #333', color: '#e8e4dc',
    fontFamily: 'inherit', fontSize: 12, padding: '4px 8px', borderRadius: 5,
    cursor: 'pointer',
  },

  contactCard: { background: '#111316', border: '1px solid #222', borderRadius: 10, padding: '18px 20px', marginBottom: 10 },
  contactHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  contactTechName: { fontWeight: 'bold', color: '#e8e4dc', fontSize: 15, marginBottom: 4 },
  contactMeta: { color: '#7a7570', fontSize: 13 },
  contactMessage: { color: '#9a9490', fontSize: 14, fontStyle: 'italic', lineHeight: 1.6, margin: 0 },

  accountCard: { background: '#111316', border: '1px solid #222', borderRadius: 10, padding: '28px 24px' },
  techDetailCard: { background: '#111316', border: '1px solid #222', borderRadius: 12, padding: '28px 32px', maxWidth: 720 },
};
