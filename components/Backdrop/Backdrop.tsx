'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import styles from './Backdrop.module.scss';

/** How long the cross-fade takes. Handed to the stylesheet as `--fade`. */
const FADE = 1800;

interface BackdropProps {
  images: string[];
  /** How long each photograph holds before the next takes over, in ms. */
  hold?: number;
  /** object-position for every shot in the set. */
  focus?: string;
  className?: string;
}

/**
 * A cross-fading photographic backdrop, shared by the hero and the arrival
 * section so the cycling, the failure handling and the grade all live in one
 * place.
 *
 * Files that fail to load drop out of the rotation rather than leaving a blank
 * beat, and with reduced motion the set holds on its first frame.
 *
 * A photograph here owns nothing but its own opacity. The movement belongs to
 * the reel they all sit in, which is what keeps a change of frame from being
 * visible as a change of size — see the stylesheet.
 *
 * The scrim is deliberately *not* here: each section needs a different one
 * depending on where its type sits, so the parent supplies its own.
 */
export default function Backdrop({ images, hold = 6500, focus, className }: BackdropProps) {
  const [step, setStep] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [still, setStill] = useState(false);

  const usable = useMemo(
    () => images.map((_, i) => i).filter((i) => !failed.has(i)),
    [images, failed],
  );

  useEffect(() => {
    setStill(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  useEffect(() => {
    if (still || usable.length < 2) return;

    const timer = window.setInterval(() => setStep((s) => s + 1), hold);
    return () => window.clearInterval(timer);
  }, [still, usable.length, hold]);

  const active = usable.length ? usable[step % usable.length] : -1;

  return (
    <div
      className={[styles.stage, className].filter(Boolean).join(' ')}
      aria-hidden="true"
      style={{ '--fade': `${FADE}ms` } as CSSProperties}
    >
      {/* Everything that moves is in here. The grain stays outside it, so the
          texture sits on the screen rather than riding along with the zoom. */}
      <div className={styles.reel}>
        {images.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element -- files are dropped in
             by hand and may be absent; next/image cannot fail softly here. */
          <img
            className={styles.shot}
            key={src}
            src={src}
            alt=""
            data-active={i === active || undefined}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            style={focus ? { objectPosition: focus } : undefined}
            onError={() =>
              setFailed((previous) => {
                if (previous.has(i)) return previous;
                const next = new Set(previous);
                next.add(i);
                return next;
              })
            }
          />
        ))}
      </div>

      <span className={styles.grain} />
    </div>
  );
}
