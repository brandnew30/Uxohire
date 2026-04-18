import styles from "../styles/theme";

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.footerInner} data-footer-inner>
        <span style={styles.logoText}>UXO<span style={styles.logoAccent}>hire</span></span>
        <span style={styles.footerSub}>The specialized job board for the UXO industry.</span>
      </div>
    </footer>
  );
}
