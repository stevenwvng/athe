import React from "react";
import WordFlower from "./WordFlower";
import styles from "./FashionHero.module.css";

const FashionHero: React.FC = () => (
  <section className={styles.hero} aria-label="everydayathe fashion">
    <div className={styles.backdrop} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blobSand}`} />
      <span className={`${styles.blob} ${styles.blobMoss}`} />
      <span className={`${styles.blob} ${styles.blobSage}`} />
      <span className={`${styles.blob} ${styles.blobSlate}`} />
      <span className={`${styles.blob} ${styles.blobCream}`} />
      <span className={`${styles.blob} ${styles.blobNight}`} />
    </div>
    <WordFlower />
    <h1 className={styles.wordmark}>
      <span className={styles.primary}>
        everydayathe<span className={styles.mark}>®</span>
      </span>
      <span className={styles.secondary}>lemon</span>
    </h1>
    <svg className={styles.grain} aria-hidden="true">
      <filter id="fashion-grain" x="0" y="0" width="100%" height="100%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.85"
          numOctaves="3"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#fashion-grain)" />
    </svg>
  </section>
);

export default FashionHero;
