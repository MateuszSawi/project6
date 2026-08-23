'use client';

import { useEffect, useState } from 'react';

import { completion, formatKm, loadBest } from '@/lib/games/runner';

import styles from './Progress.module.scss';

/**
 * How far the road has been got down, beside the line that asks for it.
 *
 * The record, not the run in progress. A run starts at zero every time, so a
 * live percentage on the opening screen only ever says 0% — which is true of
 * the moment and false about her, and it was the first thing on the page.
 *
 * Its own read of the record rather than the game's: this sits in the page's
 * lede, above the game and outside it, and threading one number up through
 * GameLayout to get there would cost more than the second GET does. Nothing
 * on either side of the screen depends on the two arriving together.
 *
 * Renders nothing at all until there is something to say — no record, no
 * database, or a read that failed. The lede then reads exactly as it did
 * before this existed, which is the only acceptable failure for a sentence
 * that is decorating someone else's.
 */
export default function Progress() {
  const [best, setBest] = useState(0);

  useEffect(() => {
    let alive = true;

    loadBest()
      .then((km) => {
        if (alive) setBest(km);
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  if (best <= 0) return null;

  return (
    <span className={styles.done}>
      Your best: {formatKm(best)} km — {completion(best)}% finished.
    </span>
  );
}
