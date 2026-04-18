import styles from "../styles/theme";

export default function JobPostSuccess({ onReset }) {
  return (
    <div style={styles.formWrap} data-form-wrap>
      <div style={styles.successCard} data-success-card>
        <div style={styles.successIcon}>{"\uD83C\uDFAF"}</div>
        <h2 style={styles.successTitle} data-success-title>Payment Received!</h2>
        <p style={styles.successMsg}>
          Your payment is being processed. Your job listing will be published and visible
          to techs within a few minutes once our system confirms the payment.
        </p>
        <p style={{ color: '#9a9490', fontSize: 13, margin: '0 0 20px' }}>
          You'll be able to manage your listing from the employer dashboard once it's live.
        </p>
        <button style={styles.btnPrimary} data-btn-primary onClick={onReset}>
          Browse Active Listings
        </button>
      </div>
    </div>
  );
}
