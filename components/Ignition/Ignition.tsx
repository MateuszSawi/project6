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
            <span>Are you as</span>
          </span>
          <span className={styles.titleLine}>
            <span>
              <em lang="sq">e mahnitshme</em>
              <br/>
              as I suspect?
            </span>
          </span>
        </h1>

        <p className={styles.lead}>
          I want to check.
          Not through a screen, not in autumn.
          I want your voice in the room, not in my headphones.
        </p>

        <p className={styles.mask}>
          Keep pretending you don&rsquo;t give a fuck (you look cute in that mask).
          Keep saying it to the world. <em>I know the truth</em>.<br/>
          I've already decided you're worth the whole of the effort. Now I want to find out if I was right.
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
