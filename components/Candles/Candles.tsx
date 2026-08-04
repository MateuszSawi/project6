'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Candle from '@/components/Candle/Candle';

import styles from './Candles.module.scss';

const COUNT = 15;

/** Pixels of scroll spent on each candle while the shelf is held. */
const PIN_PER_CANDLE = 28;

/** The parked shelf: a band of the viewport, bounded in rem. */
const SHELF_VH = 0.32;
const SHELF_MIN_REM = 11;
const SHELF_MAX_REM = 17;

/**
 * The candle shelf, scrubbed by the scroll wheel.
 *
 * The shelf parks in the middle of the screen and the page keeps moving under
 * it; that scroll distance is spent lighting the candles one by one. Once the
 * last one catches, the section releases. Nothing is ever actually locked —
 * scrolling always does something, which is the difference between a held
 * moment and a trapped visitor.
 *
 * The band is only a third of the viewport rather than all of it, so the
 * section stays short: its height is the parked band plus the scroll spent on
 * it, and no more.
 *
 * With reduced motion the whole mechanism is skipped and the row arrives lit.
 */
export default function Candles() {
  const sectionRef = useRef<HTMLElement>(null);
  const [burning, setBurning] = useState(0);
  const [pinned, setPinned] = useState(false);

  /* Fixed, uneven heights — a row of identical candles looks like a graph. */
  const shelf = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => ({
        scale: 0.62 + ((i * 37) % 11) / 22,
        delay: ((i * 53) % 9) * 120,
      })),
    [],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let active = false;
    let distance = 0;
    /* Where the shelf parks, in px from the top of the viewport. */
    let offset = 0;
    let last = -1;

    function render() {
      if (!active) return;

      const top = section!.getBoundingClientRect().top;
      // Stuck from section.top === offset down to offset - distance.
      const progress = Math.min(1, Math.max(0, (offset - top) / distance));
      const next = Math.round(progress * COUNT);

      // Only re-render when a candle actually changes state.
      if (next !== last) {
        last = next;
        setBurning(next);
      }
    }

    function measure() {
      active = !still.matches;
      distance = active ? COUNT * PIN_PER_CANDLE : 0;

      /* The band is sized here rather than read back from CSS: its own clamp()
         cannot be resolved to px before the pinned class lands, and the section
         height depends on it. JS owns the number, CSS consumes it, and the
         stylesheet keeps an identical clamp() as the no-JS fallback. */
      const rem =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const band = Math.min(
        Math.max(window.innerHeight * SHELF_VH, SHELF_MIN_REM * rem),
        SHELF_MAX_REM * rem,
      );

      offset = Math.max(0, (window.innerHeight - band) / 2);

      if (active) {
        section!.style.setProperty('--shelf', `${band}px`);
        section!.style.height = `${offset + band + distance}px`;
      } else {
        section!.style.removeProperty('--shelf');
        section!.style.height = '';
      }

      setPinned(active);

      if (!active) {
        last = COUNT;
        setBurning(COUNT);
        return;
      }

      render();
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    }

    measure();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    still.addEventListener('change', measure);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      still.removeEventListener('change', measure);
      section.style.height = '';
      section.style.removeProperty('--shelf');
    };
  }, []);

  return (
    <section
      className={styles.section}
      id="candles"
      ref={sectionRef}
      data-pinned={pinned || undefined}
      data-all={burning >= COUNT || undefined}
      aria-hidden="true"
    >
      <div className={styles.sticky}>
        <div className={styles.inner}>
          <ul className={styles.row}>
            {shelf.map((candle, i) => (
              <li className={styles.slot} key={i}>
                <Candle lit={i < burning} scale={candle.scale} delay={candle.delay} />
              </li>
            ))}
          </ul>

          <span className={styles.ledge} />

          <p className={styles.onward}>Keep scrolling</p>
        </div>
      </div>
    </section>
  );
}
