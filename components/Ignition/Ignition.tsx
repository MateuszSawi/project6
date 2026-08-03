import { ArrowDown } from 'lucide-react';

import Backdrop from '@/components/Backdrop/Backdrop';
import { HERO_BACKDROP } from '@/lib/content';

import styles from './Ignition.module.scss';

/**
 * The opening. Type only — no candle, no ornament.
 *
 * The invitation itself is held back to the last beat: the page opens on a
 * suspicion, not on a request, and only names the country once she has been
 * told why.
 */
export default function Ignition() {
  return (
    <header className={styles.ignition} id="top">
      <Backdrop images={HERO_BACKDROP} className={styles.stage} focus="50% 52%" />
      <span className={styles.scrim} aria-hidden="true" />
      <span className={styles.margin} aria-hidden="true" />

      <div className={styles.inner}>
        <h1 className={styles.title}>
          <span className={styles.titleLine}>
            <span>You are far more</span>
          </span>
          <span className={styles.titleLine}>
            <span>
              <em lang="sq">e mahnitshme</em> than I suspected.
            </span>
          </span>
        </h1>

        <p className={styles.lead}>
          I want to spend time with you and get to know everything about you without a screen between us.
          And I don&rsquo;t want to wait until autumn.
        </p>

        <p className={styles.mask}>
          Keep pretending you don&rsquo;t give a fuck — you still look cute in that mask.
          Keep it on for the
          world, <em>but take it off for me</em>. I have already decided you are worth the
          whole of the effort.
        </p>

        <a className={styles.onward} href="#arrival">
          <span className={styles.onwardWord}>So</span>
          <span className={styles.onwardIcon} aria-hidden="true">
            <ArrowDown size={17} strokeWidth={1.6} />
          </span>
        </a>
      </div>
    </header>
  );
}
