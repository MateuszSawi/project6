'use client';

import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

import styles from './Reveal.module.scss';

interface RevealProps {
  children: ReactNode;
  /** Semantic element to render. Defaults to a neutral <div>. */
  as?: ElementType;
  /** Stagger in ms, for sibling reveals. */
  delay?: number;
  /** Direction the content travels in from. */
  from?: 'below' | 'left' | 'none';
  className?: string;
}

/**
 * Reveals its children once, when they scroll into view.
 *
 * Children are composed on the server and passed through untouched, so this
 * stays a thin client boundary — the content itself is never client code.
 * Falls back to visible immediately when IntersectionObserver is absent or
 * the user has asked for reduced motion.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  from = 'below',
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const motionOk = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    if (!motionOk || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect(); // reveal is one-way
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={[styles.reveal, styles[from], shown && styles.shown, className]
        .filter(Boolean)
        .join(' ')}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
