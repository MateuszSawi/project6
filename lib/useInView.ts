'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

interface Options {
  /** Fraction of the element that must be visible. */
  threshold?: number;
  /** Shrinks the viewport so things reveal a little before the edge. */
  rootMargin?: string;
  /** Keep firing on the way back out. Off by default — reveals are one-way. */
  repeat?: boolean;
}

/**
 * Reports whether an element has scrolled into view.
 *
 * Returns true immediately when IntersectionObserver is missing or the user
 * has asked for reduced motion, so content is never gated behind an animation
 * that will not run.
 */
export function useInView<T extends HTMLElement>({
  threshold = 0.18,
  rootMargin = '0px 0px -10% 0px',
  repeat = false,
}: Options = {}): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (!repeat) observer.disconnect();
        } else if (repeat) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, repeat]);

  return [ref, inView];
}
