'use client';

import { useState } from 'react';
import { MousePointerClick } from 'lucide-react';

import styles from './Invitation.module.scss';

/**
 * The close. One word to press, and no dates to pick — the whole point is that
 * she names the time, not the page.
 *
 * The button is loud on purpose. Everything else here is restrained, which is
 * exactly why a quiet word set in a serif would read as decoration and never
 * get clicked.
 */
export default function Invitation() {
  const [said, setSaid] = useState(false);

  return (
    <section className={styles.section} id="yes" aria-labelledby="yes-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>So</p>

        <h2 className={styles.title} id="yes-title">
          There is one word left.
        </h2>

        <div className={styles.stage} data-said={said || undefined}>
          <button type="button" className={styles.yes} onClick={() => setSaid(true)}>
            <span className={styles.pulse} aria-hidden="true" />
            <span className={styles.pulseTwo} aria-hidden="true" />

            <span className={styles.hint} aria-hidden="true">
              <MousePointerClick size={15} strokeWidth={2} />
              Click me
            </span>

            <span className={styles.word}>Yes</span>

            <span className={styles.arrows} aria-hidden="true">
              <span>&#9662;</span>
              <span>&#9662;</span>
              <span>&#9662;</span>
            </span>
          </button>

          <div className={styles.after} role="status" aria-live="polite">
            <p className={styles.afterLine}>
              Take time off work. Stay as long as you want, leave when you want — leave
              the rest to me. <em>I am waiting for you.</em>
            </p>

            <p className={styles.afterCall}>
              I will call you in the evening. I want to hear your voice and see you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
