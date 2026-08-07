'use client';

import { useEffect, useRef, useState } from 'react';
import { MousePointerClick, Sparkles } from 'lucide-react';

import styles from './Notice.module.scss';

/**
 * The one thing on this site kept in the browser rather than the database.
 *
 * Bump this string and the notice comes back for everybody — that is how the
 * next game gets announced. The date is only there to keep the keys unique
 * and readable; nothing parses it.
 */
const KEY = 'iza:notice:2026-08-08';

/** Deliberately does not say where. She is supposed to go looking. */
const TEXT = 'Something new appeared on this page.';
const SUB = 'Go and find it.';

/** The only way out, and it makes her say something on the way. */
const BUTTON =
  'Yes sir, I am going to look. I still don’t give a fuck about your effort — try harder.';

/**
 * The loading screen drops `data-loading` the moment it *starts* to leave, not
 * when it has gone — that overlap is deliberate, so the title rises through
 * the fading greeting. Mirrors EXIT in Loader.tsx.
 */
const LOADER_EXIT = 300;

/** And then a beat, so the notice does not race the title for her attention. */
const SETTLE = 1700;

/**
 * A door across the whole page, once per device.
 *
 * She will open this page again and again over the next month, and each time
 * something has been added she has to know — so this is not a corner toast she
 * can scroll past. It covers everything, holds the scroll, and has exactly one
 * way out: a button that answers for her.
 *
 * localStorage is exactly right here and nowhere else on the site: the worst a
 * lost flag can do is show a friendly sentence twice.
 */
export default function Notice() {
  const [phase, setPhase] = useState<'waiting' | 'shown' | 'gone'>('waiting');
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY)) return;
    } catch {
      /* Storage denied. Better to show it every time than never. */
    }

    /* Waiting on the greeting itself rather than on a fixed delay: a slow
       photograph holds the screen for up to 1.8s, and a notice that ignored
       that would land on top of her name. */
    let show = 0;
    const root = document.documentElement;

    function arm() {
      show = window.setTimeout(() => setPhase('shown'), LOADER_EXIT + SETTLE);
    }

    if (!root.hasAttribute('data-loading')) {
      arm();
      return () => window.clearTimeout(show);
    }

    const watch = new MutationObserver(() => {
      if (root.hasAttribute('data-loading')) return;
      watch.disconnect();
      arm();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-loading'] });

    return () => {
      watch.disconnect();
      window.clearTimeout(show);
    };
  }, []);

  /* The page behind is already laid out and would otherwise scroll under the
     screen. Released the moment she answers. */
  useEffect(() => {
    if (phase !== 'shown') return;

    document.body.style.overflow = 'hidden';
    button.current?.focus();

    return () => {
      document.body.style.removeProperty('overflow');
    };
  }, [phase]);

  function dismiss() {
    setPhase('gone');
    try {
      window.localStorage.setItem(KEY, '1');
    } catch {
      /* As above. */
    }
  }

  if (phase !== 'shown') return null;

  return (
    <div
      className={styles.screen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="notice-title"
    >
      <span className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <span className={styles.mark} aria-hidden="true">
          <Sparkles size={20} strokeWidth={1.5} />
        </span>

        <p className={styles.title} id="notice-title">
          {TEXT}
        </p>

        <p className={styles.sub}>{SUB}</p>

        {/* The only control on the screen. No backdrop click, no escape key —
            she is not getting past this by accident. */}
        <button className={styles.answer} type="button" onClick={dismiss} ref={button}>
          <span className={styles.answerLabel}>{BUTTON}</span>

          {/* The same nudge the invitation uses, so she already knows what it
              means by the time she gets here. */}
          <span className={styles.hint} aria-hidden="true">
            <MousePointerClick size={14} strokeWidth={2} />
            Click me
          </span>

          <span className={styles.sparks} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>
    </div>
  );
}
