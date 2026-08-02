import { ArrowUp } from 'lucide-react';

import styles from './Footer.module.scss';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p className={styles.mark}>
          Gdańsk <span aria-hidden="true">·</span> Sopot <span aria-hidden="true">·</span>{' '}
          Gdynia
        </p>

        <p className={styles.line}>
          Made slowly, and only for you.
        </p>

        <a className={styles.top} href="#top">
          <ArrowUp size={14} strokeWidth={1.5} aria-hidden="true" />
          Back to the beginning
        </a>
      </div>
    </footer>
  );
}
