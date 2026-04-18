import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Navbar from "./components/Navbar";

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
      ● {m.label}
    </span>
  );
}

export default function EmployerDashboard({ user }) {
  const navigate = useNavigate();
  const [tab, setTab]                   = useState('posts');
  const [posts, setPosts]               = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [applications, setApplications] = useState({});  // postId -> app[]
  const [appsLoading, setAppsLoading]   = useState({});  // postId -> bool
  const [contacts, setContacts]         = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState(null); // postId

  // ── Fetch employer's job posts ──────────────────────────────────────────────
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

  // ── Fetch applications for one post ────────────────────────────────────────
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

  // ── Fetch contacts the employer sent to techs ───────────────────────────────
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

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { if (tab === 'contacts') fetchContacts(); }, [tab, fetchContacts]);

  // ── Toggle applicants panel for a post ─────────────────────────────────────
  const togglePost = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!applications[postId]) fetchApplications(postId);
    }
  };

  // ── Update application status ───────────────────────────────────────────────
  const handleAppStatus = async (appId, postId, newStatus) => {
    await supabase.from('applications').update({ status: newStatus }).eq('id', appId);
    setApplications(p => ({
      ...p,
      [postId]: (p[postId] || []).map(a => a.id === appId ? { ...a, status: newStatus } : a),
    }));
  };

  // ── Delete a job post ───────────────────────────────────────────────────────
  const handleDeletePost = async (postId) => {
    await supabase.from('job_posts').delete().eq('id', postId);
    setPosts(p => p.filter(j => j.id !== postId));
    setDeleteConfirm(null);
    if (expandedPost === postId) setExpandedPost(null);
  };

  // ────────────────────────────────────────────────────────────────────────────

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div style={s.root}>
      <Navbar view="employerDashboard" setView={(v) => navigate(v === 'jobs' ? '/' : `/${v}`)}
        user={user} navigate={navigate} onSignOut={handleSignOut} />

      <main style={s.main} data-main-container>
        <div style={s.pageHeader}>
          <h1 style={s.pageTitle} data-page-title>Employer Hub</h1>
          <p style={s.pageSub} data-page-subtitle>Manage your job posts, applicants, and tech outreach.</p>
        </div>

        {/* ── Tab bar ── */}
        <div style={s.tabs} className="ed-tab-bar">
          {['posts', 'contacts'].map(t => (
            <button
              key={t}
              className={"ed-tab" + (tab === t ? " ed-tab-active" : "")}
              style={tab === t ? s.tabActive : s.tab}
              onClick={() => setTab(t)}
            >
              <span className="ed-tab-icon">{t === 'posts' ? '\uD83D\uDCCB' : '\uD83D\uDCE8'}</span>
              <span className="ed-tab-label">{t === 'posts' ? 'Posts & Applicants' : 'Contact Inbox'}</span>
            </button>
          ))}
        </div>

        {/* ══ MY POSTS TAB ══ */}
        {tab === 'posts' && (
          <div>
            {postsLoading && <p style={s.empty}>Loading your posts…</p>}

            {!postsLoading && posts.length === 0 && (
              <div style={s.emptyCard}>
                <p style={s.emptyTitle}>No job posts yet.</p>
                <p style={{ color: '#9a9490', marginBottom: 16 }}>
                  Post your first role and start receiving applicants.
                </p>
                <button style={s.btnPrimary} onClick={() => navigate('/post-job')}>
                  Post a Job →
                </button>
              </div>
            )}

            {!postsLoading && posts.map(post => {
              const meta  = JOB_STATUS_META[post.status] || JOB_STATUS_META.expired;
              const apps  = applications[post.id] || [];
              const expanded = expandedPost === post.id;
              const loading  = appsLoading[post.id];

              return (
                <div key={post.id} style={s.postCard}>
                  {/* ── Post row ── */}
                  <div style={s.postRow} className="ed-post-row">
                    <div style={s.postInfo}>
                      <div style={s.postTitle}>{post.title}</div>
                      <div style={s.postMeta}>
                        {post.company} · {post.location} · {post.type}
                        <span style={{ marginLeft: 10 }}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div style={s.postActions} className="ed-post-actions">
                      <StatusBadge status={post.status} meta={JOB_STATUS_META} />

                      <button style={s.btnSmall} onClick={() => togglePost(post.id)}>
                        {expanded ? 'Hide Applicants ▲' : `Applicants${apps.length ? ` (${apps.length})` : ''} ▼`}
                      </button>

                      {deleteConfirm === post.id ? (
                        <>
                          <span style={{ color: '#f87171', fontSize: 13 }}>Delete?</span>
                          <button style={{ ...s.btnSmall, color: '#f87171', borderColor: '#f87171' }}
                            onClick={() => handleDeletePost(post.id)}>Yes</button>
                          <button style={s.btnSmall} onClick={() => setDeleteConfirm(null)}>No</button>
                        </>
                      ) : (
                        <button
                          style={{ ...s.btnSmall, color: '#f87171', borderColor: '#f87171' }}
                          onClick={() => setDeleteConfirm(post.id)}
                        >Delete</button>
                      )}
                    </div>
                  </div>

                  {/* ── Applicants panel ── */}
                  {expanded && (
                    <div style={s.appsPanel}>
                      {loading && <p style={s.empty}>Loading applicants…</p>}

                      {!loading && apps.length === 0 && (
                        <p style={s.empty}>No applications yet for this post.</p>
                      )}

                      {!loading && apps.map(app => (
                        <div key={app.id} style={s.appRow}>
                          <div style={s.appInfo}>
                            <div style={s.appName}>{app.applicant_name}</div>
                            <div style={s.appEmail}>{app.applicant_email}</div>
                            {app.message && (
                              <p style={s.appMessage}>"{app.message}"</p>
                            )}
                            <div style={{ fontSize: 11, color: '#7a7570', marginTop: 4 }}>
                              Applied {new Date(app.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={s.appStatusWrap}>
                            <span style={{
                              fontSize: 11, fontWeight: 'bold',
                              color: APP_STATUS_COLORS[app.status] || '#9a9490',
                            }}>
                              {APP_STATUS_LABELS[app.status] || app.status}
                            </span>
                            <select
                              style={s.statusSelect}
                              value={app.status}
                              onChange={e => handleAppStatus(app.id, post.id, e.target.value)}
                            >
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

        {/* ══ CONTACT INBOX TAB ══ */}
        {tab === 'contacts' && (
          <div>
            {contactsLoading && <p style={s.empty}>Loading your contact history…</p>}

            {!contactsLoading && contacts.length === 0 && (
              <div style={s.emptyCard}>
                <p style={s.emptyTitle}>No contacts sent yet.</p>
                <p style={{ color: '#9a9490' }}>
                  When you contact a technician via "Contact This Tech", those messages appear here.
                </p>
              </div>
            )}

            {!contactsLoading && contacts.map(c => (
              <div key={c.id} style={s.contactCard}>
                <div style={s.contactHeader}>
                  <div>
                    <div style={s.contactTechName}>
                      {c.tech_profiles?.name || 'Unknown Technician'}
                    </div>
                    <div style={s.contactMeta}>
                      {c.tech_profiles?.location && (
                        <span>{c.tech_profiles.location} · </span>
                      )}
                      {c.company && <span>{c.company} · </span>}
                      {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p style={s.contactMessage}>"{c.message}"</p>
              </div>
            ))}
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

  tabs: { display: 'flex', gap: 4, borderBottom: '1px solid #222', marginBottom: 28 },
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
};
