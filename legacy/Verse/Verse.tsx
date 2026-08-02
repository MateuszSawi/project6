'use client';

import type { CSSProperties } from 'react';

import { useInView } from '@/lib/useInView';
import { AUTHOR, AUTHOR_FALLBACK, AUTHOR_NOTE, VERSE } from './verse';

import styles from './Verse.module.scss';

/**
 * The quote. Lines surface one at a time, at reading pace rather than
 * animation pace — the last one is supposed to arrive late.
 */
export default function Verse() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.25 });

  return (
    <section
      className={styles.verse}
      id="verse"
      ref={ref}
      data-shown={inView || undefined}
      aria-label="A short poem"
    >
      <figure className={styles.inner}>
        <span className={styles.mark} aria-hidden="true">
          &ldquo;
        </span>

        <blockquote className={styles.poem}>
          {VERSE.map((line, i) => (
            <span
              className={styles.line}
              data-tone={line.tone}
              key={line.text}
              style={{ '--i': i } as CSSProperties}
            >
              {line.text}
            </span>
          ))}
        </blockquote>

        <figcaption
          className={styles.sign}
          style={{ '--i': VERSE.length } as CSSProperties}
        >
          <span className={styles.rule} aria-hidden="true" />
          <span className={styles.author}>{AUTHOR || AUTHOR_FALLBACK}</span>
          <span className={styles.note}>{AUTHOR_NOTE}</span>
        </figcaption>
      </figure>
    </section>
  );
}
