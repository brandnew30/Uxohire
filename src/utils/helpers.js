import { supabase } from "../supabaseClient";

export const normalizeJob = (j) => ({
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

export const normalizeTech = (t) => ({
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
  visibleToTechs: t.visible_to_techs ?? true,
  summary: t.summary || '',
  jobRolePreference: t.job_role_preference || 'any',
  specificRoles: t.specific_roles || [],
  resumePath: t.resume_path || null,
  certPaths: t.cert_paths || [],
  hazwoper8CertPath: t.hazwoper8_cert_path || null,
  physicalCertPath: t.physical_cert_path || null,
});

export const isExpired = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 365;
};

export const isExpiringSoon = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 335 && diffDays <= 365;
};

export const isOlderThanOneYear = (dateStr) => {
  if (!dateStr) return false;
  const diffDays = (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);
  return diffDays > 365;
};

export const uploadFile = async (file, folder, userId) => {
  const fileName = `${userId}/${folder}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('uxo-uploads').upload(fileName, file, { upsert: true });
  return error ? { path: null, error } : { path: fileName, error: null };
};
