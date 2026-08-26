import { HeroSection } from "@/components/HeroSection";
import { SiteHeader } from "@/components/SiteHeader";

import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <HeroSection />
      </main>
    </>
  );
}
