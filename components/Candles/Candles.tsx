'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import Candle from '@/components/Candle/Candle';

import styles from './Candles.module.scss';

const COUNT = 15;

/** Pixels of scroll spent on each candle while the shelf is held. */
const PIN_PER_CANDLE = 52;

/**
 * The candle shelf, scrubbed by the scroll wheel.
 *
 * The section is made taller than the viewport and its contents stick to the
 * middle of the screen, so the shelf appears to hold still while the page
 * moves underneath it. That scroll distance is spent lighting the candles one
 * by one; once the last one catches, the section releases and the page carries
 * on. Nothing is ever actually locked — scrolling always does something, which
 * is the difference between a held moment and a trapped visitor.
 *
 * With reduced motion the whole mechanism is skipped and the row simply
 * arrives lit.
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
    let last = -1;

    function render() {
      if (!active) return;

      const top = section!.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, -top / distance));
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

      const height = active ? `${window.innerHeight + distance}px` : '';
      if (section!.style.height !== height) section!.style.height = height;

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
        </div>
      </div>
    </section>
  );
}
