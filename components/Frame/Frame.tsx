'use client';

import { useState, type CSSProperties } from 'react';

import styles from './Frame.module.scss';

interface FrameProps {
  /** Path under /public. Leave the file out and the frame stays a placeholder. */
  src?: string;
  alt: string;
  /** Shown on the placeholder so an empty frame still reads as deliberate. */
  label?: string;
  /**
   * How hard to push the grade.
   *  soft   — the file already has colour and contrast of its own
   *  strong — flat, hazy or overcast, and needs the extra bite
   */
  grade?: 'soft' | 'strong';
  /** object-position, for photographs with the subject off-centre. */
  focus?: string;
  eager?: boolean;
  className?: string;
}

/**
 * A picture that behaves whether or not the file exists yet.
 *
 * The grade is a camera grade, not a colour cast: a light unsharp pass for
 * edge, then saturation and contrast for depth. Colour is left alone on
 * purpose — the point is a photograph that looks shot, not filtered.
 */
export default function Frame({
  src,
  alt,
  label,
  grade = 'soft',
  focus,
  eager,
  className,
}: FrameProps) {
  const [failed, setFailed] = useState(false);
  const empty = !src || failed;

  return (
    <div
      className={[styles.frame, className].filter(Boolean).join(' ')}
      data-empty={empty || undefined}
      data-grade={grade}
    >
      {empty ? (
        <div className={styles.placeholder} role="img" aria-label={alt}>
          <span className={styles.placeholderMark} aria-hidden="true" />
          {label && <span className={styles.placeholderLabel}>{label}</span>}
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- files are dropped
              in by hand and may be absent; next/image cannot fail softly here. */}
          <img
            className={styles.image}
            src={src}
            alt={alt}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            style={focus ? ({ '--focus': focus } as CSSProperties) : undefined}
            onError={() => setFailed(true)}
          />
        </>
      )}

      <span className={styles.veil} aria-hidden="true" />
      <span className={styles.grain} aria-hidden="true" />
    </div>
  );
}
