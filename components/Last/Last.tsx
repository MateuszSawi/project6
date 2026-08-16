'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

import styles from './Last.module.scss';

/**
 * The last game, which is not one.
 *
 * A button that promises a game and pays out three lines instead. Nothing is
 * stored and nothing is asked — the whole point is that she presses it
 * expecting another round and is sent to pack instead, so there is no state
 * here beyond whether she has pressed it yet.
 */
export default function Last() {
  const [played, setPlayed] = useState(false);

  if (!played) {
    return (
      <div className={styles.opening}>
        <button className={styles.begin} type="button" onClick={() => setPlayed(true)}>
          <Play size={16} strokeWidth={2} />
          <span className={styles.beginLabel}>Click here</span>

          <span className={styles.sparks} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    );
  }

  /* Read out as one announcement rather than three, so a screen reader does
     not deliver the punchline before the setup. */
  return (
    <p className={styles.words} aria-live="polite">
      <span className={styles.line}>Good girl.</span>
      <span className={styles.line}>Stop playing your games.</span>
      <span className={styles.line}>Go start packing.</span>
    </p>
  );
}
