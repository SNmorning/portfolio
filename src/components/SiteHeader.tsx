import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <a
        className={styles.logoLink}
        href="#home"
        aria-label="ALBANO，返回首页"
      >
        ALBANO
      </a>

      <div className={styles.nav} aria-label="页面定位">
        <span className={`${styles.navLink} ${styles.active}`}>首页</span>
        <span className={styles.navLink}>项目</span>
      </div>

      <span className={styles.contactButton}>联系我</span>
    </header>
  );
}
