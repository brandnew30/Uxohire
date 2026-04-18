import styles from "../styles/theme";
import { DOD_CERT_OPTIONS } from "../utils/constants";
import { isExpired, isExpiringSoon, isOlderThanOneYear, uploadFile } from "../utils/helpers";

function YesNoBlock({ label, value, onYes, onNo, children }) {
  return (
    <div style={styles.qualBlock}>
      <div style={styles.qualRow}>
        <span style={styles.qualBlockLabel}>{label}</span>
        <div style={styles.yesNoRow}>
          <button style={{ ...styles.yesNoBtn, ...(value ? styles.yesNoBtnActive : {}) }} onClick={onYes}>Yes</button>
          <button style={{ ...styles.yesNoBtn, ...(!value ? styles.yesNoBtnNo : {}) }} onClick={onNo}>No</button>
        </div>
      </div>
      {children}
    </div>
  );
}

function UploadField({ id, label, statusKey, uploadStatus, onUpload }) {
  return (
    <>
      <label style={{ ...styles.label, marginTop: 8 }}>{label}</label>
      <label htmlFor={id} style={styles.uploadBox} data-upload-box>
        <span style={styles.uploadIcon} data-upload-icon>{"\uD83D\uDCCE"}</span>
        <p style={styles.uploadText}>Click here to upload (PDF, JPG, PNG)</p>
        <input id={id} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: "none" }} onChange={onUpload} />
      </label>
      {uploadStatus[statusKey] === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>{"\u23F3"} Uploading...</div>}
      {uploadStatus[statusKey] === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>{"\u2705"} Uploaded successfully</div>}
      {uploadStatus[statusKey] === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>{"\u274C"} Upload failed. Please try again.</div>}
    </>
  );
}

export default function ProfileStep2({
  profile, setProfile, errors, setErrors,
  uploadStatus, setUploadStatus, uploadPaths, setUploadPaths,
  user, setProfileStep,
}) {
  const show8HrQuestion = profile.hazwoper40 && isOlderThanOneYear(profile.hazwoper40Date);

  const toggleDodCert = (cert) =>
    setProfile(p => ({
      ...p, dodCerts: p.dodCerts.includes(cert) ? p.dodCerts.filter(c => c !== cert) : [...p.dodCerts, cert],
    }));

  const validateStep2 = () => {
    const newErrors = {};
    if (profile.hazwoper8 && isExpired(profile.hazwoper8Date)) newErrors.hazwoper8Date = "Your 8-HR HAZWOPER is not current. Please select No.";
    if (profile.physicalCurrent && isExpired(profile.physicalDate)) newErrors.physicalDate = "Your physical is not current. Please select No.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <div style={styles.formFields} data-form-fields>
      <label style={styles.label}>DOD Certification Level (select all that apply)</label>
      <div style={styles.certGrid}>
        {DOD_CERT_OPTIONS.map(cert => (
          <div key={cert} style={{ ...styles.certToggle, ...(profile.dodCerts.includes(cert) ? styles.certToggleActive : {}) }} onClick={() => toggleDodCert(cert)}>
            {profile.dodCerts.includes(cert) ? "\u2713 " : ""}{cert}
          </div>
        ))}
      </div>

      <YesNoBlock label="HAZWOPER 40-HR" value={profile.hazwoper40}
        onYes={() => setProfile(p => ({ ...p, hazwoper40: true }))}
        onNo={() => setProfile(p => ({ ...p, hazwoper40: false, hazwoper40Date: "", hazwoper8: false, hazwoper8Date: "" }))}>
        {profile.hazwoper40 && (
          <div style={styles.subField}>
            <label style={styles.label}>Issue Date</label>
            <input type="date" style={styles.input} value={profile.hazwoper40Date} onChange={e => setProfile(p => ({ ...p, hazwoper40Date: e.target.value }))} />
          </div>
        )}
      </YesNoBlock>

      {show8HrQuestion && (
        <YesNoBlock label="8-HR HAZWOPER Refresher" value={profile.hazwoper8}
          onYes={() => setProfile(p => ({ ...p, hazwoper8: true }))}
          onNo={() => setProfile(p => ({ ...p, hazwoper8: false, hazwoper8Date: "" }))}>
          {profile.hazwoper8 && (
            <div style={styles.subField}>
              <label style={styles.label}>Issue Date</label>
              <input type="date" style={styles.input} value={profile.hazwoper8Date} onChange={e => setProfile(p => ({ ...p, hazwoper8Date: e.target.value }))} />
              {errors.hazwoper8Date && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {errors.hazwoper8Date}</div>}
              {isExpiringSoon(profile.hazwoper8Date) && !isExpired(profile.hazwoper8Date) && <div style={styles.warnMsg}>{"\u26A0\uFE0F"} Your 8-HR HAZWOPER expires within 30 days.</div>}
              <UploadField id="hazwoper8Upload" label="Upload 8-HR Cert" statusKey="hazwoper8" uploadStatus={uploadStatus}
                onUpload={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setUploadStatus(s => ({ ...s, hazwoper8: 'uploading' }));
                    const { path, error } = await uploadFile(file, 'certs', user.id);
                    setUploadStatus(s => ({ ...s, hazwoper8: error ? 'error' : 'success' }));
                    if (path) setUploadPaths(p => ({ ...p, hazwoper8: path }));
                  }
                }} />
            </div>
          )}
        </YesNoBlock>
      )}

      <YesNoBlock label="Current Physical (within 1 year)" value={profile.physicalCurrent}
        onYes={() => setProfile(p => ({ ...p, physicalCurrent: true }))}
        onNo={() => setProfile(p => ({ ...p, physicalCurrent: false, physicalDate: "" }))}>
        {profile.physicalCurrent && (
          <div style={styles.subField}>
            <label style={styles.label}>Issue Date</label>
            <input type="date" style={styles.input} value={profile.physicalDate} onChange={e => setProfile(p => ({ ...p, physicalDate: e.target.value }))} />
            {errors.physicalDate && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {errors.physicalDate}</div>}
            {isExpiringSoon(profile.physicalDate) && !isExpired(profile.physicalDate) && <div style={styles.warnMsg}>{"\u26A0\uFE0F"} Your physical expires within 30 days.</div>}
            <UploadField id="physicalUpload" label="Upload Physical" statusKey="physical" uploadStatus={uploadStatus}
              onUpload={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  setUploadStatus(s => ({ ...s, physical: 'uploading' }));
                  const { path, error } = await uploadFile(file, 'physicals', user.id);
                  setUploadStatus(s => ({ ...s, physical: error ? 'error' : 'success' }));
                  if (path) setUploadPaths(p => ({ ...p, physical: path }));
                }
              }} />
          </div>
        )}
      </YesNoBlock>

      {[
        ["Military / EOD Background", "militaryEod"],
        ["Security Clearance", "clearance"],
        ["Dive Certified", "diveCert"],
        ["Driver's License", "driversLicense"],
        ["CDL", "cdl"],
      ].map(([label, key]) => (
        <YesNoBlock key={key} label={label} value={profile[key]}
          onYes={() => setProfile(p => ({ ...p, [key]: true }))}
          onNo={() => setProfile(p => ({ ...p, [key]: false, ...(key === 'clearance' ? { clearanceLevel: "" } : {}) }))}>
          {key === 'clearance' && profile.clearance && (
            <div style={styles.subField}>
              <label style={styles.label}>Clearance Level</label>
              <input style={styles.input} placeholder="e.g. Secret, TS, TS/SCI" value={profile.clearanceLevel} onChange={e => setProfile(p => ({ ...p, clearanceLevel: e.target.value }))} />
            </div>
          )}
        </YesNoBlock>
      ))}

      <label style={styles.label}>Upload Certification Documents</label>
      <label htmlFor="certUpload" style={styles.uploadBox} data-upload-box>
        <span style={styles.uploadIcon} data-upload-icon>{"\uD83D\uDCCE"}</span>
        <p style={styles.uploadText}>Click here to upload certs (PDF, JPG, PNG)</p>
        <p style={styles.uploadSub}>Max 10MB each</p>
        <input id="certUpload" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple style={{ display: "none" }} onChange={async (e) => {
          const files = Array.from(e.target.files);
          setUploadStatus(s => ({ ...s, certs: 'uploading' }));
          let anyError = false;
          const newPaths = [];
          for (const file of files) {
            const { path, error } = await uploadFile(file, 'certs', user.id);
            if (error) anyError = true;
            else if (path) newPaths.push(path);
          }
          setUploadStatus(s => ({ ...s, certs: anyError ? 'error' : 'success' }));
          if (newPaths.length > 0) setUploadPaths(p => ({ ...p, certs: [...p.certs, ...newPaths] }));
        }} />
      </label>
      {uploadStatus.certs === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>{"\u23F3"} Uploading...</div>}
      {uploadStatus.certs === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>{"\u2705"} Uploaded successfully</div>}
      {uploadStatus.certs === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>{"\u274C"} One or more uploads failed. Please try again.</div>}

      <label style={styles.label}>Upload Resume</label>
      <label htmlFor="resumeUpload" style={styles.uploadBox} data-upload-box>
        <span style={styles.uploadIcon} data-upload-icon>{"\uD83D\uDCC4"}</span>
        <p style={styles.uploadText}>Click here to upload resume (PDF, Word)</p>
        <p style={styles.uploadSub}>Max 10MB</p>
        <input id="resumeUpload" type="file" accept=".pdf,.doc,.docx" style={{ display: "none" }} onChange={async (e) => {
          const file = e.target.files[0];
          if (file) {
            setUploadStatus(s => ({ ...s, resume: 'uploading' }));
            const { path, error } = await uploadFile(file, 'resumes', user.id);
            setUploadStatus(s => ({ ...s, resume: error ? 'error' : 'success' }));
            if (path) setUploadPaths(p => ({ ...p, resume: path }));
          }
        }} />
      </label>
      {uploadStatus.resume === 'uploading' && <div style={{ color: '#d97706', fontSize: 13 }}>{"\u23F3"} Uploading...</div>}
      {uploadStatus.resume === 'success' && <div style={{ color: '#4ade80', fontSize: 13 }}>{"\u2705"} Uploaded successfully</div>}
      {uploadStatus.resume === 'error' && <div style={{ color: '#ef4444', fontSize: 13 }}>{"\u274C"} Upload failed. Please try again.</div>}

      <div style={styles.formRow} data-form-row>
        <button style={styles.btnSecondary} data-btn-secondary onClick={() => setProfileStep(1)}>{"\u2190"} Back</button>
        <button style={styles.btnPrimary} data-btn-primary onClick={() => { if (validateStep2()) setProfileStep(3); }}>Next {"\u2192"}</button>
      </div>
    </div>
  );
}
