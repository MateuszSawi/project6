'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MoveRight } from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import { FRAMES } from '@/lib/content';

import styles from './Exposition.module.scss';

/**
 * The exposition — eight frames that pass sideways as the page scrolls down.
 *
 * On wide screens the section pins itself and converts vertical scroll into
 * horizontal travel. Everywhere else it degrades to a native swipeable strip
 * with scroll snapping, which is the better interaction on a phone anyway.
 *
 * Scroll position is written to CSS custom properties rather than React state,
 * so the whole thing runs without a single re-render.
 */
export default function Exposition() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLOListElement>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!section || !sticky || !track) return;

    const wide = window.matchMedia('(min-width: 64em)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');

    let raf = 0;
    let active = false;
    let distance = 0;

    function render() {
      if (!active || distance <= 0) return;

      const top = section!.getBoundingClientRect().top;
      const progress = Math.min(1, Math.max(0, -top / distance));

      track!.style.transform = `translate3d(${(-progress * distance).toFixed(1)}px, 0, 0)`;
      sticky!.style.setProperty('--progress', progress.toFixed(4));
    }

    function measure() {
      active = wide.matches && !still.matches;
      distance = active ? Math.max(0, track!.scrollWidth - window.innerWidth) : 0;

      const height = active ? `${window.innerHeight + distance}px` : '';
      if (section!.style.height !== height) section!.style.height = height;

      if (!active) {
        track!.style.transform = '';
        sticky!.style.setProperty('--progress', '0');
      }

      setPinned(active);
      render();
    }

    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    }

    measure();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    wide.addEventListener('change', measure);

    // Images arriving late change the track width — re-measure when they do.
    const observer = new ResizeObserver(measure);
    observer.observe(track);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', measure);
      wide.removeEventListener('change', measure);
      observer.disconnect();
      section.style.height = '';
    };
  }, []);

  return (
    <section
      className={styles.section}
      id="exposition"
      ref={sectionRef}
      data-pinned={pinned || undefined}
      aria-labelledby="exposition-title"
    >
      <div className={styles.sticky} ref={stickyRef}>
        <header className={styles.head}>
          <h2 className={styles.title} id="exposition-title">
            Look at it.
          </h2>
          <p className={styles.hint}>
            <span>{pinned ? 'Keep scrolling' : 'Swipe'}</span>
            <MoveRight size={14} strokeWidth={1.4} aria-hidden="true" />
          </p>
        </header>

        <div className={styles.viewport}>
          <ol className={styles.track} ref={trackRef}>
            {FRAMES.map((frame, i) => (
              <li
                className={styles.slot}
                key={frame.id}
                style={{ '--i': i } as CSSProperties}
              >
                <figure className={styles.figure}>
                  <Frame
                    className={styles.picture}
                    src={frame.src}
                    alt={`${frame.title} — ${frame.place}`}
                    label={frame.place}
                    eager={i < 2}
                  />

                  <figcaption className={styles.caption}>
                    <span className={styles.index}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={styles.name}>{frame.title}</h3>
                    <p className={styles.place}>{frame.place}</p>
                    <p className={styles.line}>{frame.line}</p>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.rail} aria-hidden="true">
          <span className={styles.railFill} />
        </div>
      </div>
    </section>
  );
}
