'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CloudOff,
  Crown,
  Gift,
  Heart,
  Loader2,
  MessageSquareWarning,
  Plane,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBasket,
  type LucideIcon,
} from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import {
  CATEGORIES,
  complete,
  filledCount,
  perksOf,
  pickedIn,
  resumeAt,
  toggle,
  totalPicked,
  type Category,
  type Picks,
} from '@/lib/games/upgrade-trip';
import { connected, loadStored, pushAnswers } from '@/lib/results';

import styles from './Upgrade.module.scss';

const GAME = 'upgrade-trip';

/* Named in the data file, resolved here — nothing but this component pulls the
   icon set in. */
const ICONS: Record<string, LucideIcon> = {
  Crown,
  Gift,
  Heart,
  MessageSquareWarning,
  ShoppingBasket,
};

/**
 * Upgrade your trip.
 *
 * Five screens of four tiles, and on every one of them she can take all four.
 * That is the entire mechanic, and the screen is built to keep saying so: the
 * tiles never grey each other out, the count under the grid only ever goes up,
 * and the way on is a button she presses when she is finished rather than a
 * tile that ends the question.
 *
 * There is no way past a category with nothing taken in it. That is not a rule
 * about answering — she can change any of it, any time — it is the game
 * refusing to let her be polite. Five screens of free things and a skip button
 * on each one is five chances to take nothing, and she would use them.
 *
 * Supabase is the only memory, as everywhere else here.
 */
export default function Upgrade() {
  const [picks, setPicks] = useState<Picks>({});
  /** Whether she has pressed start. Before that the page is a button. */
  const [running, setRunning] = useState(false);
  /** Which slide: a category, or the package at CATEGORIES.length. */
  const [at, setAt] = useState(0);
  const [sync, setSync] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [opening, setOpening] = useState<'reading' | 'open' | 'unreachable'>(
    connected ? 'reading' : 'open',
  );

  /* Taps come faster than round trips: only the newest push may set the mark. */
  const pushes = useRef(0);
  /* Every write sends the whole set, so it has to be read from somewhere that
     is never one render behind. */
  const latest = useRef<Picks>({});
  /** The game itself, so a new category can be brought back into view. */
  const board = useRef<HTMLDivElement | null>(null);
  /** False until she has moved between categories once. See the effect below. */
  const travelled = useRef(false);

  const read = useCallback(() => {
    if (!connected) return () => {};

    let alive = true;
    setOpening('reading');

    loadStored(GAME)
      .then(({ hers }) => {
        if (!alive) return;
        latest.current = hers;
        setPicks(hers);
        setOpening('open');

        /* Nothing left to take, so there is nothing to press start on: she has
           come back to read the package, and the package is what she gets. */
        if (complete(hers)) {
          setAt(CATEGORIES.length);
          setRunning(true);
        }
      })
      .catch(() => {
        if (alive) setOpening('unreachable');
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(read, [read]);

  /* The game sits in the page rather than over it, so a category can end up
     half off the bottom of the screen after a scroll. `nearest` does nothing at
     all when the game is already fully in view, which is most of the time — no
     lurching after every tap. Never on the way in, though: landing straight on
     the package would throw the page's own title off the screen. */
  useEffect(() => {
    if (!running) return;

    if (!travelled.current) {
      travelled.current = true;
      return;
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    board.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' });
  }, [running, at]);

  /** Categories with something in them. Every one of them has to end up here. */
  const filled = filledCount(picks);
  const taken = totalPicked(picks);

  const category = at < CATEGORIES.length ? CATEGORIES[at] : null;
  const canBack = at > 0;

  function start() {
    latest.current = picks;
    setAt(resumeAt(picks));
    setRunning(true);
  }

  /**
   * Sends the whole set rather than the row that changed — a failed push then
   * needs no queue and no retry of its own, because the next tap carries
   * everything again.
   */
  function push(all: Picks) {
    if (!connected) return;

    const ticket = ++pushes.current;
    setSync('saving');

    pushAnswers(GAME, all)
      .then(() => {
        if (pushes.current === ticket) setSync('saved');
      })
      .catch(() => {
        if (pushes.current === ticket) setSync('failed');
      });
  }

  function take(perk: string) {
    if (!category) return;

    const next = { ...latest.current, [category.id]: toggle(latest.current, category.id, perk) };
    latest.current = next;
    setPicks(next);
    push(next);
  }

  /* Forward. Only ever reachable with something taken — the control that calls
     this is not offered until then. */
  function onward() {
    setAt((current) => Math.min(current + 1, CATEGORIES.length));
  }

  function back() {
    setAt((current) => Math.max(current - 1, 0));
  }

  /**
   * Back to the first category with everything she took still taken. Nothing is
   * wiped and nothing is written — the run starts over on top of her answers,
   * so a second pass is a walk through what she already has, with every tile
   * still there to add to or hand back.
   */
  function again() {
    setAt(0);
  }

  /* ---------- Before it starts ---------------------------- */

  if (!running) {
    return (
      <div className={styles.opening}>
        {opening === 'reading' ? (
          <p className={styles.state} aria-live="polite">
            <Loader2 className={styles.spin} size={16} strokeWidth={1.8} aria-hidden="true" />
            Finding where you left off…
          </p>
        ) : opening === 'unreachable' ? (
          <>
            <p className={styles.state} aria-live="polite">
              <CloudOff size={16} strokeWidth={1.8} aria-hidden="true" />
              I cannot reach your upgrades right now. Nothing is lost.
            </p>

            <button className={styles.begin} type="button" onClick={read}>
              <RefreshCw size={16} strokeWidth={2} />
              <span className={styles.beginLabel}>Try again</span>
            </button>
          </>
        ) : (
          <button className={styles.begin} type="button" onClick={start}>
            <Play size={16} strokeWidth={2} />
            <span className={styles.beginLabel}>{filled === 0 ? 'Start' : 'Continue'}</span>

            <span className={styles.sparks} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          </button>
        )}
      </div>
    );
  }

  /* ---------- The deck ------------------------------------ */

  return (
    <div className={styles.deck} ref={board}>
      <header className={styles.bar}>
        <button
          className={styles.step}
          type="button"
          onClick={back}
          disabled={!canBack}
          aria-label="Previous"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <span className={styles.track} aria-hidden="true">
          <span
            className={styles.fill}
            style={{ '--p': filled / CATEGORIES.length } as CSSProperties}
          />
        </span>

        <span className={styles.count}>
          {taken}
          <span className={styles.countLabel}> taken</span>
        </span>

        {sync !== 'idle' && (
          <span className={styles.sync} data-state={sync} aria-hidden="true">
            {sync === 'saving' ? (
              <Loader2 className={styles.spin} size={13} strokeWidth={2.2} />
            ) : sync === 'saved' ? (
              <Check size={13} strokeWidth={2.4} />
            ) : (
              <CloudOff size={13} strokeWidth={2.2} />
            )}
          </span>
        )}
      </header>

      {/* Keyed by slide, so every entrance animation replays and nothing of the
          last category is left behind on this one. */}
      <div className={styles.stage} key={category ? category.id : 'package'}>
        {category ? (
          <Shelf category={category} picks={picks} onTake={take} onwardTo={onward} at={at} />
        ) : (
          <Package
            picks={picks}
            failed={sync === 'failed'}
            onRetry={() => push(picks)}
            onAgain={again}
          />
        )}
      </div>
    </div>
  );
}

/* ---------- One category ---------------------------------
   Four tiles, and the only thing that ever changes about the
   way on is the word on it. Nothing is disabled, nothing is
   greyed out and nothing counts against anything else — the
   line under the title says there is no limit and the grid is
   not allowed to contradict it.
   -------------------------------------------------------- */

function Shelf({
  category,
  picks,
  onTake,
  onwardTo,
  at,
}: {
  category: Category;
  picks: Picks;
  onTake: (perk: string) => void;
  onwardTo: () => void;
  at: number;
}) {
  const Icon = ICONS[category.icon];
  const taken = pickedIn(picks, category.id);
  const last = at === CATEGORIES.length - 1;

  return (
    <section className={styles.shelf}>
      <header className={styles.shelfHead}>
        <p className={styles.where}>
          {Icon && <Icon size={13} strokeWidth={1.8} aria-hidden="true" />}
          {String(at + 1).padStart(2, '0')}
          <span aria-hidden="true"> / </span>
          {String(CATEGORIES.length).padStart(2, '0')}
        </p>

        <h2 className={styles.title}>{category.title}</h2>

        {/* Kept to one line on a phone on purpose — every line above the grid
            is a line the fourth tile does not get. */}
        <p className={styles.limit}>
          <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
          No limit. Take as many as you want.
        </p>
      </header>

      <ul className={styles.grid}>
        {category.perks.map((perk) => {
          const chosen = taken.includes(perk.id);

          return (
            <li key={perk.id}>
              <button
                className={styles.tile}
                type="button"
                aria-pressed={chosen}
                data-chosen={chosen || undefined}
                onClick={() => onTake(perk.id)}
              >
                <Frame className={styles.art} src={perk.src} alt="" />
                <span className={styles.scrim} aria-hidden="true" />

                <span className={styles.mark} aria-hidden="true">
                  {chosen ? <Check size={14} strokeWidth={2.8} /> : <Plus size={13} strokeWidth={2} />}
                </span>

                <span className={styles.label}>{perk.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* No way past an empty shelf: the only exit from a category simply is
          not there until she has taken something from it.

          Rendered either way and only turned visible, so the row it sits in is
          reserved from the start — the tiles above it must not jump down the
          screen the moment she taps one. */}
      <footer className={styles.after} data-shown={taken.length ? '' : undefined}>
        <button
          className={styles.onward}
          type="button"
          tabIndex={taken.length ? undefined : -1}
          onClick={onwardTo}
        >
          <span>{last ? 'See your package' : 'Next'}</span>
          <ChevronRight size={15} strokeWidth={2} />
        </button>
      </footer>
    </section>
  );
}

/* ---------- The package ---------------------------------- */

function Package({
  picks,
  failed,
  onRetry,
  onAgain,
}: {
  picks: Picks;
  failed: boolean;
  onRetry: () => void;
  /** Back to the first category, keeping everything she took. See again above. */
  onAgain: () => void;
}) {
  const taken = totalPicked(picks);

  return (
    <section className={styles.package}>
      <header className={styles.packageHead}>
        <h2 className={styles.packageTitle}>You upgraded your trip. Here is your package:</h2>
        <p className={styles.packageLine}>
          {taken === 0
            ? 'You took nothing. That is not happening — I am giving you all of it anyway.'
            : `${taken} ${taken === 1 ? 'upgrade' : 'upgrades'}, all of them yours. No limits, no expiry.`}
        </p>
      </header>

      <div className={styles.sheet}>
        {CATEGORIES.map((category) => {
          const perks = perksOf(picks, category);
          const Icon = ICONS[category.icon];

          return (
            <div className={styles.group} key={category.id}>
              <h3 className={styles.groupTitle}>
                {Icon && <Icon size={13} strokeWidth={1.8} aria-hidden="true" />}
                {category.title}
              </h3>

              {perks.length ? (
                <ul className={styles.lines}>
                  {perks.map((perk) => (
                    <li className={styles.line} key={perk.id}>
                      <Check size={13} strokeWidth={2.6} aria-hidden="true" />
                      {perk.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>Nothing taken. I will decide this one myself.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Nothing here undoes anything. The package is not a result she might
          want to improve on — it is a list of things she is being given, and
          the only thing left is the date they happen on. This is the door the
          booking game was waiting behind. The way back round is under it, and
          it only ever adds. */}
      <div className={styles.tools}>
        {!connected && (
          <p className={styles.note}>
            Nothing is being kept — this copy of the page has no database behind it.
          </p>
        )}

        {failed && (
          <button className={styles.retry} type="button" onClick={onRetry}>
            <RefreshCw size={13} strokeWidth={2} />
            <span>Some of it did not send. Try again</span>
          </button>
        )}

        {/* <p className={styles.onwardLine}>All of it is yours. Now give it a date.</p> */}

        <Link className={styles.book} href="/games/book-trip/">
          <Plane size={16} strokeWidth={2} />
          <span className={styles.bookLabel}>CLICK ME</span>

          <span className={styles.sparks} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        </Link>

        {/* Quiet on purpose, and it sits under the loud one. Going round again
            is allowed; it is just not the thing this page is asking for. */}
        <button className={styles.again} type="button" onClick={onAgain}>
          <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
          <span>Start again</span>
        </button>
      </div>
    </section>
  );
}
