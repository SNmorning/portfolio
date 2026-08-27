"use client";

import styles from "./HeroSection.module.css";

import { useInvertedLens } from "@/hooks/useInvertedLens";

const patternRows = Array.from({ length: 10 }, (_, index) => index);

function Pattern({ inverted = false }: { inverted?: boolean }) {
  return (
    <div
      className={`${styles.pattern} ${inverted ? styles.invertedPattern : ""}`}
      aria-hidden="true"
    >
      {patternRows.map((row) => (
        <div
          className={`${styles.patternRow} ${row % 2 ? styles.offsetRow : ""}`}
          key={row}
        >
          N O V A F O R M N O V A F O R M N O V A F O R M
        </div>
      ))}
    </div>
  );
}

export function HeroSection() {
  const {
    isFlipped,
    frameRef,
    frontFaceRef,
    maskLayerRef,
    toggleAbout,
    handleKeyDown,
    handlePointerMove,
    handlePointerLeave,
  } = useInvertedLens();

  return (
    <div
      id="home"
      className={styles.heroFrame}
      ref={frameRef}
      onClick={toggleAbout}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      role="button"
      tabIndex={0}
      aria-label={isFlipped ? "返回 ALBANO 首页介绍" : "查看关于 ALBANO"}
      aria-pressed={isFlipped}
    >
      <div
        className={`${styles.flipCard} ${isFlipped ? styles.flipped : ""}`}
      >
        <div
          className={`${styles.face} ${styles.frontFace}`}
          ref={frontFaceRef}
        >
          <Pattern />
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              <span className={styles.titleBase}>HOLA, </span>
              <span className={styles.titleMiddle}>SOY</span>
              <span className={styles.titleSignature}>&nbsp;ALBANO</span>
            </h1>
            <p className={styles.heroSubtitle}>
              OPERACIONES DE PRODUCTOS DE IA / INGENIERÍA DE PROMPTS / GROWTH MARKETING CON IA
            </p>
          </div>
          <p className={styles.explorePrompt}>MOVE / CLICK</p>

          <div
            className={styles.invertedLayer}
            ref={maskLayerRef}
            aria-hidden="true"
          >
            <Pattern inverted />
            <div className={styles.heroContent}>
              <p className={`${styles.heroTitle} ${styles.invertedTitle}`}>
                <span className={styles.titleBase}>你好，</span>
                <span className={styles.titleMiddle}>我是</span>
                <span className={styles.titleSignature}>孙楠</span>
              </p>
              <p className={`${styles.heroSubtitle} ${styles.invertedSubtitle}`}>
                AI 产品运营 / 提示词工程 / AI 增长营销
              </p>
            </div>
            <p
              className={`${styles.explorePrompt} ${styles.invertedExplorePrompt}`}
            >
              MOVE / CLICK
            </p>
          </div>
        </div>

        <div className={`${styles.face} ${styles.aboutFace}`}>
          <div className={styles.aboutHeadingRow}>
            <h2 className={styles.aboutHeading}>关于我</h2>
            <span className={styles.backPrompt}>点击返回</span>
          </div>
          <strong className={styles.signature}>ALBANO</strong>
        </div>
      </div>
    </div>
  );
}
