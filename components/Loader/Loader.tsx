'use client';

import { useEffect, useState, type CSSProperties } from 'react';

import { HERO_BACKDROP } from '@/lib/content';

import styles from './Loader.module.scss';

/* The name is set apart from the greeting, in the burgundy this page keeps for
   the few things addressed to her directly. Split per word rather than per
   line so a narrow screen can wrap between the two without ever breaking a
   word into loose letters. */
const WORDS = ['Tung', 'Iza'];

/* The stagger index is worked out once, at module load, so a render never has
   to count letters or mutate anything while it walks the list. */
let cursor = 0;
const LETTERS = WORDS.map((word, w) => ({
  key: word,
  accent: w === WORDS.length - 1,
  chars: Array.from(word).map((char) => ({ char, at: cursor++ })),
}));

/** Milliseconds between one letter and the next. Mirrored in the stylesheet. */
const STAGGER = 20;
/** One letter's own rise. Mirrored in the stylesheet. */
const RISE = 340;

/* Long enough for the last letter to have landed, so the greeting is never cut
   off mid-word — and a ceiling on top of it, so a photograph that never
   arrives cannot leave her staring at a held screen. */
const MIN_HOLD = cursor * STAGGER + RISE + 40;
const MAX_HOLD = 1100;
/** Reduced motion gets the greeting, not the performance of it. */
const MIN_HOLD_STILL = 240;

/** The fade out. Mirrored in the stylesheet. */
const EXIT = 260;

/**
 * The first thing on the screen: her name, and a held beat while the opening
 * photograph decodes behind it.
 *
 * Everything that moves here moves on the compositor — opacity and transform
 * only, no blur, no backdrop-filter, no layout touched after the first paint.
 * The cost is ~15 spans that animate once and are then thrown away.
 *
 * It leaves on whichever comes last: the greeting finishing, or the hero's
 * first photograph settling. Nothing waits forever — MAX_HOLD is a hard
 * ceiling, and a file that 404s counts as settled.
 */
export default function Loader() {
  const [phase, setPhase] = useState<'holding' | 'leaving' | 'gone'>('holding');

  useEffect(() => {
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const floor = still ? MIN_HOLD_STILL : MIN_HOLD;
    const began = Date.now();

    let settled = false;
    let leaveTimer = 0;
    let goneTimer = 0;

    /* Called by whichever of the photograph and the ceiling gets there first,
       and ignored after that. */
    function settle() {
      if (settled) return;
      settled = true;

      leaveTimer = window.setTimeout(
        () => {
          setPhase('leaving');
          goneTimer = window.setTimeout(() => setPhase('gone'), EXIT);
        },
        Math.max(0, floor - (Date.now() - began)),
      );
    }

    /* Decoding it here rather than watching the <img> in the hero: this runs
       off the same HTTP cache entry, so the picture the loader waits for is
       the very one the page then shows. */
    const photograph = new Image();
    photograph.onload = settle;
    photograph.onerror = settle;
    photograph.src = HERO_BACKDROP[0];

    const ceiling = window.setTimeout(settle, MAX_HOLD);

    return () => {
      photograph.onload = null;
      photograph.onerror = null;
      window.clearTimeout(ceiling);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(goneTimer);
    };
  }, []);

  /* The page behind is already laid out and would otherwise scroll under the
     screen. Locked from hydration until the screen is gone for good.

     The screen sits at the top of the document rather than pinned to the
     viewport — see the stylesheet — so a reload part-way down the page has to
     be sent back to the top, or it would open behind the greeting. */
  useEffect(() => {
    if (phase === 'gone') {
      document.body.style.removeProperty('overflow');
      return;
    }

    /* Explicitly instant: the root sets `scroll-behavior: smooth`, and a
       loading screen that visibly slides the page upward defeats its purpose. */
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div className={styles.loader} data-leaving={phase === 'leaving' || undefined}>
      <span className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <p className={styles.greeting} lang="sq">
          {LETTERS.map(({ key, accent, chars }) => (
            <span className={styles.word} key={key} data-accent={accent || undefined}>
              {chars.map(({ char, at }) => (
                <span
                  className={styles.letter}
                  key={at}
                  style={{ '--i': at } as CSSProperties}
                  aria-hidden="true"
                >
                  {char}
                </span>
              ))}

              {/* The letters are split for the animation only; this keeps the
                  word itself readable to a screen reader and to search. */}
              <span className={styles.whole}>{key}</span>
            </span>
          ))}
        </p>

        <span className={styles.rule} aria-hidden="true" />
      </div>
    </div>
  );
}
