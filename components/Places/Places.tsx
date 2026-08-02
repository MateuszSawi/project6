'use client';

import type { CSSProperties } from 'react';
import { Lock } from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import { PLACES } from '@/lib/content';
import { useInView } from '@/lib/useInView';

import styles from './Places.module.scss';

/**
 * Every place, all on screen, nothing hidden behind a swipe.
 *
 * The secret is just another tile — same cell, same crop rotation, same
 * caption. Only what sits inside the frame is different, which is the joke.
 */
export default function Places() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.05 });

  return (
    <section
      className={styles.section}
      id="places"
      ref={ref}
      data-shown={inView || undefined}
      aria-labelledby="places-title"
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 className={styles.title} id="places-title">
            This is where I will <em>take you</em>.
          </h2>
        </header>

        <ol className={styles.grid}>
          {PLACES.map((place, i) => (
            <li className={styles.cell} key={place.id} style={{ '--i': i } as CSSProperties}>
              {place.secret ? (
                /* The plate is the background: title and subtitle sit on it. */
                <div className={`${styles.plate} ${styles.sealed}`}>
                  <span className={styles.sealedGlyph} aria-hidden="true">
                    ?
                  </span>

                  <span className={styles.sealedMark} aria-hidden="true">
                    <Lock size={16} strokeWidth={1.4} />
                  </span>

                  <div className={styles.sealedText}>
                    <span className={styles.index}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={styles.sealedTitle}>{place.title}</h3>
                    <p className={styles.sealedLine}>{place.line}</p>
                  </div>
                </div>
              ) : (
                <figure className={styles.figure}>
                  <Frame
                    className={styles.plate}
                    src={place.src}
                    alt={`${place.title} — ${place.place}`}
                    label={place.place}
                    grade={place.grade}
                    focus={place.focus}
                    eager={i < 2}
                  />

                  <figcaption className={styles.caption}>
                    <span className={styles.index}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={styles.name}>{place.title}</h3>
                    <p className={styles.place}>{place.place}</p>
                  </figcaption>
                </figure>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
