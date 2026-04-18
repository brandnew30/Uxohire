import styles from "../styles/theme";
import { ALL_CERT_OPTIONS } from "../utils/constants";

export default function PostJob({
  jobPost, setJobPost, postStep, setPostStep,
  submitError, paymentLoading, onSubmit, onBack,
}) {
  const toggleJobCert = (cert, type) => {
    setJobPost(p => {
      const field = type === 'required' ? 'requiredCerts' : 'preferredCerts';
      const other = type === 'required' ? 'preferredCerts' : 'requiredCerts';
      return {
        ...p,
        [field]: p[field].includes(cert) ? p[field].filter(c => c !== cert) : [...p[field], cert],
        [other]: p[other].filter(c => c !== cert),
      };
    });
  };

  return (
    <div style={styles.formWrap} data-form-wrap>
      <button style={styles.backBtn} data-back-btn onClick={onBack}>{"\u2190"} Back</button>
      <div style={styles.formCard} data-form-card>
        <div style={styles.formSteps}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ ...styles.step, ...(postStep >= s ? styles.stepActive : {}) }}>{s}</div>
          ))}
        </div>
        <h2 style={styles.formTitle} data-form-title>
          {postStep === 1 && "Company & Role Details"}
          {postStep === 2 && "Requirements"}
          {postStep === 3 && "Review & Payment"}
        </h2>

        {postStep === 1 && (
          <div style={styles.formFields} data-form-fields>
            <label style={styles.label}>Company Name</label>
            <input style={styles.input} placeholder="Your company name" value={jobPost.company} onChange={e => setJobPost(p => ({ ...p, company: e.target.value }))} />
            <label style={styles.label}>Job Title</label>
            <input style={styles.input} placeholder="e.g. UXO Tech II \u2013 Range Clearance" value={jobPost.title} onChange={e => setJobPost(p => ({ ...p, title: e.target.value }))} />
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
            <input style={styles.input} placeholder="e.g. $45\u2013$55/hr" value={jobPost.salary} onChange={e => setJobPost(p => ({ ...p, salary: e.target.value }))} />
            <label style={styles.label}>Job Description</label>
            <textarea style={{ ...styles.textarea, minHeight: "120px" }} placeholder="Describe the role, site conditions, project duration..." value={jobPost.description} onChange={e => setJobPost(p => ({ ...p, description: e.target.value }))} />
            <button style={styles.btnPrimary} data-btn-primary onClick={() => setPostStep(2)}>Next {"\u2192"}</button>
          </div>
        )}

        {postStep === 2 && (
          <div style={styles.formFields} data-form-fields>
            <p style={styles.certInstructions}>For each qualification, select Required or Preferred \u2014 or leave unselected if not relevant.</p>
            {ALL_CERT_OPTIONS.map(cert => (
              <div key={cert} style={styles.certRequireRow} data-cert-require-row>
                <span style={styles.certRequireLabel}>{cert}</span>
                <div style={styles.yesNoRow}>
                  <button style={{ ...styles.reqBtn, ...(jobPost.requiredCerts.includes(cert) ? styles.reqBtnRequired : {}) }} onClick={() => toggleJobCert(cert, 'required')}>Required</button>
                  <button style={{ ...styles.reqBtn, ...(jobPost.preferredCerts.includes(cert) ? styles.reqBtnPreferred : {}) }} onClick={() => toggleJobCert(cert, 'preferred')}>Preferred</button>
                </div>
              </div>
            ))}
            <div style={styles.formRow} data-form-row>
              <button style={styles.btnSecondary} data-btn-secondary onClick={() => setPostStep(1)}>{"\u2190"} Back</button>
              <button style={styles.btnPrimary} data-btn-primary onClick={() => setPostStep(3)}>Next {"\u2192"}</button>
            </div>
          </div>
        )}

        {postStep === 3 && (
          <div style={styles.formFields} data-form-fields>
            <div style={styles.reviewCard}>
              {[
                ["Company", jobPost.company],
                ["Title", jobPost.title],
                ["Location", jobPost.location],
                ["Type", jobPost.type],
                ["Pay", jobPost.salary],
                ["Required Certs", jobPost.requiredCerts.join(", ") || "None"],
                ["Preferred Certs", jobPost.preferredCerts.join(", ") || "None"],
              ].map(([label, val]) => (
                <div key={label} style={styles.reviewRow} data-review-row>
                  <span style={styles.reviewLabel}>{label}</span>
                  <span>{val || "\u2014"}</span>
                </div>
              ))}
            </div>
            <div style={styles.pricingBox} data-pricing-box>
              <div style={styles.pricingTitle}>Job Posting Fee</div>
              <div style={styles.pricingAmount} data-pricing-amount>$149 <span style={styles.pricingPer}>/ 30 days</span></div>
              <ul style={styles.pricingFeatures}>
                <li>{"\u2713"} Listed to all qualified, active techs</li>
                <li>{"\u2713"} Filtered by your required certifications</li>
                <li>{"\u2713"} Direct contact with candidates</li>
                <li>{"\u2713"} Re-post or extend anytime</li>
              </ul>
            </div>
            <div style={styles.formRow} data-form-row>
              <button style={styles.btnSecondary} data-btn-secondary onClick={() => setPostStep(2)}>{"\u2190"} Back</button>
              <button style={styles.btnPrimary} data-btn-primary onClick={onSubmit} disabled={paymentLoading}>
                {paymentLoading ? 'Redirecting to payment...' : 'Submit & Pay $149 \u2192'}
              </button>
            </div>
            {submitError && <div style={styles.errorMsg}>{"\u26A0\uFE0F"} {submitError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
