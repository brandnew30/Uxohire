import styles from "../styles/theme";
import { TRAVEL_OPTIONS } from "../utils/constants";
import ProfileStep2 from "./ProfileStep2";

export default function CreateProfile({
  profile, setProfile, profileStep, setProfileStep,
  openToWork, setOpenToWork, notifications, errors, setErrors,
  uploadStatus, setUploadStatus, uploadPaths, setUploadPaths,
  submitError, user, myProfile, onSubmit, onBack,
}) {
  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      {notifications.length > 0 && (
        <div style={styles.notifWrap}>
          {notifications.map((n, i) => <div key={i} style={styles.notifBanner}>{n}</div>)}
        </div>
      )}
      <div style={styles.formCard} data-form-card>
        <div style={styles.formSteps}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ ...styles.step, ...(profileStep >= s ? styles.stepActive : {}) }}>{s}</div>
          ))}
        </div>
        <h2 style={styles.formTitle} data-form-title>
          {profileStep === 1 && "Basic Information"}
          {profileStep === 2 && "Qualifications & Certifications"}
          {profileStep === 3 && "Availability Settings"}
        </h2>

        {profileStep === 1 && (
          <div style={styles.formFields} data-form-fields>
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
            <button style={styles.btnPrimary} data-btn-primary onClick={() => setProfileStep(2)}>Next {"\u2192"}</button>
          </div>
        )}

        {profileStep === 2 && (
          <ProfileStep2
            profile={profile} setProfile={setProfile}
            errors={errors} setErrors={setErrors}
            uploadStatus={uploadStatus} setUploadStatus={setUploadStatus}
            uploadPaths={uploadPaths} setUploadPaths={setUploadPaths}
            user={user} setProfileStep={setProfileStep}
          />
        )}

        {profileStep === 3 && (
          <div style={styles.formFields} data-form-fields>
            <label style={styles.label}>Job Availability</label>
            <div style={styles.toggleRow} data-toggle-row>
              <div style={styles.toggleInfo}>
                <div style={styles.toggleTitle}>Open to Work</div>
                <div style={styles.toggleSub}>When active, companies can find and contact you for opportunities.</div>
              </div>
              <div style={{ ...styles.toggleSwitch, background: openToWork ? "#d97706" : "#333" }} data-toggle-switch onClick={() => setOpenToWork(o => !o)}>
                <div style={{ ...styles.toggleKnob, transform: openToWork ? "translateX(24px)" : "translateX(0)" }} />
              </div>
            </div>
            <div style={styles.availNote}>
              {openToWork ? "\u2705 Your profile will be visible to hiring companies." : "\uD83D\uDD12 Your profile is hidden from company searches."}
            </div>

            <label style={{ ...styles.label, marginTop: 12 }}>Job Role Preference</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#e8e4dc' }}>
                <input type="radio" name="jobRolePref" value="any"
                  checked={profile.jobRolePreference === 'any'}
                  onChange={() => setProfile(p => ({ ...p, jobRolePreference: 'any', specificRoles: '' }))}
                  style={{ accentColor: '#d97706' }} />
                Open to any job I qualify for
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#e8e4dc' }}>
                <input type="radio" name="jobRolePref" value="specific"
                  checked={profile.jobRolePreference === 'specific'}
                  onChange={() => setProfile(p => ({ ...p, jobRolePreference: 'specific' }))}
                  style={{ accentColor: '#d97706' }} />
                Specific roles only
              </label>
              {profile.jobRolePreference === 'specific' && (
                <input style={styles.input} placeholder="e.g. UXO Tech III, QC Specialist, Site Lead"
                  value={profile.specificRoles}
                  onChange={e => setProfile(p => ({ ...p, specificRoles: e.target.value }))} />
              )}
            </div>

            <div style={styles.formRow} data-form-row>
              <button style={styles.btnSecondary} data-btn-secondary onClick={() => setProfileStep(2)}>{"\u2190"} Back</button>
              <button style={styles.btnPrimary} data-btn-primary onClick={onSubmit}>{myProfile ? 'Update Profile \u2713' : 'Submit Profile \u2713'}</button>
            </div>
            {submitError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {submitError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
