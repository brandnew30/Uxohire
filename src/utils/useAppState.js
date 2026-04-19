import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { normalizeJob, normalizeTech } from "./helpers";

const pathToView = {
  '/': 'jobs', '/techs': 'techs', '/post-job': 'postJob',
  '/create-profile': 'techProfile', '/login': 'login', '/signup': 'signup',
  '/my-profile': 'myProfile', '/job-post-success': 'jobPostSuccess',
  '/forgot-password': 'forgotPassword',
};
const viewToPath = {
  jobs: '/', techs: '/techs', postJob: '/post-job', techProfile: '/create-profile',
  login: '/login', signup: '/signup', myProfile: '/my-profile', jobPostSuccess: '/job-post-success',
  forgotPassword: '/forgot-password',
};

export default function useAppState(userProp) {
  const navigate = useNavigate();
  const location = useLocation();
  const view = pathToView[location.pathname] || 'jobs';
  const setView = (v, opts = {}) => navigate(viewToPath[v] || '/', opts);

  const [activeJob, setActiveJob] = useState(null);
  const [activeTech, setActiveTech] = useState(null);
  const [openToWork, setOpenToWork] = useState(true);
  const [profileStep, setProfileStep] = useState(1);
  const [postStep, setPostStep] = useState(1);
  const [filterCert, setFilterCert] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [errors, setErrors] = useState({});
  const [jobs, setJobs] = useState([]);
  const [techs, setTechs] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [user, setUser] = useState(userProp ?? null);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const resetSuccess = location.state?.resetSuccess || false;

  const [myProfile, setMyProfile] = useState(null);
  const [myProfileLoading, setMyProfileLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadPaths, setUploadPaths] = useState({ resume: null, certs: [], hazwoper8: null, physical: null });
  const [submitError, setSubmitError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [profile, setProfile] = useState({
    name: "", email: "", location: "", uxoHours: "", travel: "Nationwide", summary: "",
    dodCerts: [], hazwoper40: false, hazwoper40Date: "", hazwoper8: false, hazwoper8Date: "",
    physicalCurrent: false, physicalDate: "", militaryEod: false, clearance: false,
    clearanceLevel: "", diveCert: false, driversLicense: false, cdl: false,
    firstAidCpr: false, firstAidCprDate: "",
    stateLicense: "", stateLicenseExpiry: "",
    jobRolePreference: "any", specificRoles: [],
  });
  const [jobPost, setJobPost] = useState({
    company: "", title: "", location: "", type: "Contract", salary: "", description: "",
    requiredCerts: [], preferredCerts: [],
  });

  useEffect(() => { setUser(userProp ?? null); }, [userProp]);

  const goToCreateProfile = () => {
    if (!user) navigate('/signup', { state: { returnTo: '/create-profile' } });
    else setView('techProfile');
  };

  useEffect(() => {
    const isExp = (d) => d && (new Date() - new Date(d)) / 864e5 > 365;
    const isSoon = (d) => { if (!d) return false; const diff = (new Date() - new Date(d)) / 864e5; return diff > 335 && diff <= 365; };
    const notes = [];
    if (profile.hazwoper8 && isSoon(profile.hazwoper8Date)) notes.push("\u26A0\uFE0F Your 8-HR HAZWOPER refresher expires within 30 days.");
    if (profile.physicalCurrent && isSoon(profile.physicalDate)) notes.push("\u26A0\uFE0F Your physical expires within 30 days.");
    if (profile.hazwoper8 && isExp(profile.hazwoper8Date)) notes.push("\uD83D\uDEAB Your 8-HR HAZWOPER refresher has expired.");
    if (profile.physicalCurrent && isExp(profile.physicalDate)) notes.push("\uD83D\uDEAB Your physical has expired.");
    setNotifications(notes);
  }, [profile.hazwoper8Date, profile.physicalDate, profile.hazwoper8, profile.physicalCurrent]);

  useEffect(() => {
    (async () => {
      setDataLoading(true);
      const [{ data: jobData }, { data: techData }] = await Promise.all([
        supabase.from('job_posts').select('*').eq('status', 'published').order('created_at', { ascending: false }),
        supabase.from('tech_profiles').select('*').eq('open_to_work', true),
      ]);
      setJobs((jobData || []).map(normalizeJob));
      setTechs((techData || []).map(normalizeTech));
      setDataLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (view === 'techProfile' && !user) navigate('/signup', { state: { returnTo: '/create-profile' }, replace: true });
  }, [view, user]); // eslint-disable-line

  useEffect(() => {
    if (view === 'postJob' && user) {
      supabase.from('employer_profiles').select('company_name').eq('user_id', user.id).single()
        .then(({ data }) => { if (data?.company_name) setJobPost(p => ({ ...p, company: p.company || data.company_name })); });
    }
  }, [view, user]); // eslint-disable-line

  const fetchMyProfile = async () => {
    if (!user) return;
    setMyProfileLoading(true);
    const { data } = await supabase.from('tech_profiles').select('*').eq('user_id', user.id).single();
    setMyProfile(data ? normalizeTech(data) : null);
    setMyProfileLoading(false);
  };

  useEffect(() => { if (user) fetchMyProfile(); else setMyProfile(null); }, [user]); // eslint-disable-line

  useEffect(() => {
    if (view === 'techProfile' && user) {
      supabase.from('tech_profiles').select('*').eq('user_id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfile({
              name: data.name || '', email: data.email || '', location: data.location || '',
              uxoHours: data.uxo_hours || '', travel: data.travel || 'Nationwide', summary: data.summary || '',
              dodCerts: data.dod_certs || [], hazwoper40: data.hazwoper_40 || false,
              hazwoper40Date: data.hazwoper_40_date || '', hazwoper8: data.hazwoper_8 || false,
              hazwoper8Date: data.hazwoper_8_date || '', physicalCurrent: data.physical_current || false,
              physicalDate: data.physical_date || '', militaryEod: data.military_eod || false,
              clearance: data.clearance || false, clearanceLevel: data.clearance_level || '',
              diveCert: data.dive_cert || false, driversLicense: data.drivers_license || false, cdl: data.cdl || false,
              firstAidCpr: data.first_aid_cpr || false, firstAidCprDate: data.first_aid_cpr_date || '',
              stateLicense: data.state_license || '', stateLicenseExpiry: data.state_license_expiry || '',
              jobRolePreference: data.job_role_preference || 'any', specificRoles: data.specific_roles || [],
            });
            setOpenToWork(data.open_to_work ?? true);
            setUploadPaths({ resume: data.resume_path || null, certs: data.cert_paths || [], hazwoper8: data.hazwoper8_cert_path || null, physical: data.physical_cert_path || null });
          }
        });
    }
  }, [view, user]); // eslint-disable-line

  const filteredJobs = jobs.filter(j => {
    const certMatch = filterCert ? j.requiredCerts.includes(filterCert) || j.preferredCerts.includes(filterCert) : true;
    const locMatch = filterLocation ? j.location.toLowerCase().includes(filterLocation.toLowerCase()) : true;
    return certMatch && locMatch;
  });

  const handleSubmitProfile = async () => {
    if (!user) { navigate('/signup', { state: { returnTo: '/create-profile' } }); return; }
    setSubmitError('');
    const { error } = await supabase.from('tech_profiles').upsert({
      name: profile.name, email: profile.email || user.email, location: profile.location,
      uxo_hours: profile.uxoHours, travel: profile.travel, summary: profile.summary,
      dod_certs: profile.dodCerts, hazwoper_40: profile.hazwoper40,
      hazwoper_40_date: profile.hazwoper40Date || null, hazwoper_8: profile.hazwoper8,
      hazwoper_8_date: profile.hazwoper8Date || null, physical_current: profile.physicalCurrent,
      physical_date: profile.physicalDate || null, military_eod: profile.militaryEod,
      clearance: profile.clearance, clearance_level: profile.clearanceLevel,
      dive_cert: profile.diveCert, drivers_license: profile.driversLicense,
      cdl: profile.cdl, first_aid_cpr: profile.firstAidCpr,
      first_aid_cpr_date: profile.firstAidCprDate || null,
      state_license: profile.stateLicense || null,
      state_license_expiry: profile.stateLicenseExpiry || null,
      job_role_preference: profile.jobRolePreference,
      specific_roles: profile.jobRolePreference === 'specific' ? profile.specificRoles : [],
      open_to_work: openToWork, user_id: user.id,
      resume_path: uploadPaths.resume || null, cert_paths: uploadPaths.certs || [],
      hazwoper8_cert_path: uploadPaths.hazwoper8 || null, physical_cert_path: uploadPaths.physical || null,
    }, { onConflict: 'user_id' });
    if (error) setSubmitError("Something went wrong saving your profile. Please try again.");
    else {
      const { data: techData } = await supabase.from('tech_profiles').select('*').eq('open_to_work', true);
      setTechs((techData || []).map(normalizeTech));
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmitJobPost = async () => {
    if (!user) { navigate('/login', { state: { returnTo: '/post-job' } }); return; }
    setSubmitError(''); setPaymentLoading(true);
    const { data: insertedJob, error: insertError } = await supabase.from('job_posts').insert({
      company: jobPost.company, title: jobPost.title, location: jobPost.location,
      type: jobPost.type, salary: jobPost.salary, description: jobPost.description,
      required_certs: jobPost.requiredCerts, preferred_certs: jobPost.preferredCerts,
      status: 'pending_payment', user_id: user.id,
    }).select('id').single();
    if (insertError || !insertedJob) { setSubmitError('Something went wrong. Please try again.'); setPaymentLoading(false); return; }
    const { data: checkoutData, error: fnError } = await supabase.functions.invoke('create-checkout-session', { body: { job_post_id: insertedJob.id } });
    if (fnError || !checkoutData?.url) { setSubmitError('Payment setup failed. Please contact support.'); setPaymentLoading(false); return; }
    window.location.href = checkoutData.url;
  };

  const handleSignUp = async () => {
    setAuthLoading(true); setAuthError('');
    const { data, error } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); }
    else if (data.session) { setAuthForm({ email: '', password: '' }); navigate(location.state?.returnTo || '/create-profile', { replace: true }); }
    else { setAuthSuccessMsg('Account created! Check your email to confirm, then log in.'); navigate('/login', { replace: true, state: { returnTo: location.state?.returnTo || '/create-profile' } }); }
  };

  const handleLogin = async () => {
    setAuthLoading(true); setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
    setAuthLoading(false);
    if (error) setAuthError(error.message);
    else { setAuthForm({ email: '', password: '' }); navigate(location.state?.returnTo || '/dashboard', { replace: true }); }
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); setUser(null); setMyProfile(null); setView('jobs'); };

  const handleToggleAvailability = async () => {
    if (!myProfile || !user) return;
    const newStatus = !myProfile.available;
    const { error } = await supabase.from('tech_profiles').update({ open_to_work: newStatus }).eq('user_id', user.id);
    if (!error) {
      setMyProfile(p => ({ ...p, available: newStatus }));
      const { data: techData } = await supabase.from('tech_profiles').select('*').eq('open_to_work', true);
      setTechs((techData || []).map(normalizeTech));
    }
  };

  return {
    view, setView, navigate,
    activeJob, setActiveJob, activeTech, setActiveTech,
    openToWork, setOpenToWork, profileStep, setProfileStep,
    postStep, setPostStep, filterCert, setFilterCert,
    filterLocation, setFilterLocation, notifications,
    errors, setErrors, filteredJobs, techs, dataLoading,
    user, authForm, setAuthForm, authError, authLoading, authSuccessMsg, resetSuccess,
    myProfile, myProfileLoading, uploadStatus, setUploadStatus,
    uploadPaths, setUploadPaths, submitError, paymentLoading,
    profile, setProfile, jobPost, setJobPost,
    goToCreateProfile, handleSubmitProfile, handleSubmitJobPost,
    handleSignUp, handleLogin, handleSignOut, handleToggleAvailability,
  };
}
