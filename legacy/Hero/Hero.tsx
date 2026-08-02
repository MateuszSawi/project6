import { ArrowDown, KeyRound, Sparkles } from 'lucide-react';

import styles from './Hero.module.scss';

export default function Hero() {
  return (
    <header className={styles.hero} id="top">
      {/* Vertical rail — a magazine spine. Decorative on small screens. */}
      <p className={styles.rail} aria-hidden="true">
        Gdańsk · Sopot · Gdynia
      </p>

      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span className={styles.rule} aria-hidden="true" />
          An invitation · Two days on the Polish coast
        </p>

        <h1 className={styles.title}>
          <span className={styles.line}>
            <span className={styles.lineInner}>A Weekend of Art,</span>
          </span>
          <span className={styles.line}>
            <span className={styles.lineInner}>
              <em>Sea</em> &amp; Discovery
            </span>
          </span>
        </h1>

        <p className={styles.subtitle}>Gdańsk &amp; Tricity — through your eyes.</p>

        <p className={styles.lede}>
          Gothic organs at first light, a cliff falling into the Baltic, amber glowing in
          the windows of the loveliest street in Poland. Two days assembled slowly, the
          way one assembles a poem — and nothing in them asks anything of you.
        </p>

        <aside className={styles.notice} aria-label="Practical arrangements">
          <ul className={styles.noticeList}>
            <li className={styles.noticeItem}>
              <KeyRound className={styles.noticeIcon} size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Your own private room.</strong> A door that closes, and a key that
                is only yours.
              </span>
            </li>
            <li className={styles.noticeItem}>
              <Sparkles className={styles.noticeIcon} size={17} strokeWidth={1.5} aria-hidden="true" />
              <span>
                <strong>Everything is already arranged.</strong> Travel, routes, timings,
                tickets — all of it handled. You bring only yourself.
              </span>
            </li>
          </ul>
        </aside>

        <a className={styles.scroll} href="#itinerary">
          <span className={styles.scrollLabel}>The itinerary</span>
          <span className={styles.scrollIcon} aria-hidden="true">
            <ArrowDown size={15} strokeWidth={1.5} />
          </span>
        </a>
      </div>

      <p className={styles.corner} aria-hidden="true">
        <span>No. 01</span>
        <span>Late summer</span>
      </p>
    </header>
  );
}
