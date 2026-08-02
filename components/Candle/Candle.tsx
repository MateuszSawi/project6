import type { CSSProperties } from 'react';

import styles from './Candle.module.scss';

interface CandleProps {
  lit: boolean;
  /** Multiplier on the whole candle. 1 = ~5rem tall. */
  scale?: number;
  /** Desynchronises the flicker so a row never breathes in unison. */
  delay?: number;
  className?: string;
}

/**
 * One candle, drawn entirely in CSS — no images, so it scales, tints and
 * flickers for free. The flame is two stacked shapes: a warm outer body and
 * a pale core, each on its own wobble.
 */
export default function Candle({ lit, scale = 1, delay = 0, className }: CandleProps) {
  return (
    <span
      className={[styles.candle, className].filter(Boolean).join(' ')}
      data-lit={lit || undefined}
      style={{ '--scale': scale, '--delay': `${delay}ms` } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.halo} />
      <span className={styles.flame}>
        <span className={styles.core} />
      </span>
      <span className={styles.wick} />
      <span className={styles.body}>
        <span className={styles.wax} />
      </span>
    </span>
  );
}
