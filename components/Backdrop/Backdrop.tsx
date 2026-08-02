'use client';

import { useEffect, useMemo, useState } from 'react';

import styles from './Backdrop.module.scss';

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
    <div className={[styles.stage, className].filter(Boolean).join(' ')} aria-hidden="true">
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

      <span className={styles.grain} />
    </div>
  );
}
