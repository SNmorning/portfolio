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

      <nav className={styles.nav} aria-label="页面定位">
        <a className={`${styles.navLink} ${styles.active}`} href="#home">
          首页
        </a>
      </nav>
    </header>
  );
}
