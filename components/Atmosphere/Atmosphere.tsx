import styles from './Atmosphere.module.scss';

/**
 * Texture only — film grain, a warm burgundy wash at the edges, and a vignette
 * light enough to shape the page without hiding it.
 *
 * No pointer tracking and no darkness: the page is read on a phone, where
 * there is no cursor to carry a light and no room dark enough to justify one.
 * Everything here is static CSS, so this stays a server component.
 */
export default function Atmosphere() {
  return (
    <div className={styles.atmosphere} aria-hidden="true">
      <div className={styles.wash} />
      <div className={styles.grain} />
      <div className={styles.vignette} />
    </div>
  );
}
