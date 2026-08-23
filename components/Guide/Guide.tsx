'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent as Swipe,
} from 'react';
import {
  AlarmClock,
  BedDouble,
  CakeSlice,
  CalendarHeart,
  Car,
  Check,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  CloudOff,
  CloudRain,
  Coffee,
  Croissant,
  Dices,
  Gem,
  HeartHandshake,
  Hourglass,
  Loader2,
  Map,
  Martini,
  Moon,
  Music,
  Plane,
  Play,
  Popcorn,
  RefreshCw,
  RotateCcw,
  Soup,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

import {
  QUESTIONS,
  SECTIONS,
  SLIDES,
  labelOf,
  type Answers,
  type Option,
  type Question,
} from '@/lib/games/guide';
import { connected, loadStored, pushAnswers, resetAnswers } from '@/lib/results';

import styles from './Guide.module.scss';

const GAME = 'guide';

/** How long her choice sits lit before the next question replaces it. */
const BEAT = 480;

/* Named in the data file, resolved here — nothing but this component pulls
   the icon set in. */
const ICONS: Record<string, LucideIcon> = {
  AlarmClock,
  BedDouble,
  CakeSlice,
  CalendarHeart,
  Car,
  ChefHat,
  Clapperboard,
  CloudRain,
  Coffee,
  Croissant,
  Dices,
  Gem,
  HeartHandshake,
  Hourglass,
  Map,
  Martini,
  Moon,
  Music,
  Plane,
  Popcorn,
  Soup,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  UtensilsCrossed,
};

/** A, B, C… beside each option. Six is the most any question has. */
const MARKS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Where it opens: her first unanswered question, or the plan if there is none. */
function resume(answers: Answers): number {
  const at = SLIDES.findIndex((slide) => slide.kind === 'question' && !answers[slide.question.id]);
  return at === -1 ? SLIDES.length - 1 : at;
}

/**
 * A guide to keeping Iza happy.
 *
 * One question at a time, in place on the page: below the title there is a
 * start button and nothing else, and once it is pressed the button is replaced
 * by the question. She never sees the next one before answering this one, which
 * is the whole difference between this and a form.
 *
 * Deliberately not fullscreen, not an overlay and not a card. There is no
 * border around any of this — the question is the page, at the size the page
 * writes in — and the whole thing is built to sit inside one phone screen
 * without her having to scroll to reach the last option.
 *
 * Supabase is the only memory, as everywhere else here: she can close the tab
 * at the sixth question, open it a week later on another phone, and it opens on
 * the sixth question. Nothing is kept locally.
 */
export default function Guide() {
  const [answers, setAnswers] = useState<Answers>({});
  /** Whether she has pressed start. Before that the page is a button. */
  const [running, setRunning] = useState(false);
  /** Which slide. Index into SLIDES. */
  const [at, setAt] = useState(0);
  /**
   * The question she has just this moment answered. It dims the options she did
   * not take for the short beat before the next question arrives, and it is
   * cleared on every move — so coming back to an answered question shows the
   * choice sitting there rather than replaying the answer.
   */
  const [picked, setPicked] = useState<string | null>(null);
  const [sync, setSync] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  /** Restart is armed by the first tap and only fires on the second. */
  const [arming, setArming] = useState(false);
  /** The first read. The deck cannot open before it lands — see Likely.tsx. */
  const [opening, setOpening] = useState<'reading' | 'open' | 'unreachable'>(
    connected ? 'reading' : 'open',
  );

  const beat = useRef(0);
  const armed = useRef(0);
  /* Taps come faster than round trips: only the newest push may set the mark. */
  const pushes = useRef(0);
  /* The deck advances on a timer, so the handler that lands a second later
     must not write from the state it closed over. */
  const latest = useRef<Answers>({});
  /** Where a swipe started. */
  const swipe = useRef<{ x: number; y: number } | null>(null);
  /** The game itself, so a new question can be brought back into view. */
  const board = useRef<HTMLDivElement | null>(null);
  /** False until she has moved between questions once. See the effect below. */
  const travelled = useRef(false);

  const read = useCallback(() => {
    if (!connected) return () => {};

    let alive = true;
    setOpening('reading');

    loadStored(GAME)
      .then(({ hers }) => {
        if (!alive) return;
        latest.current = hers as Answers;
        setAnswers(hers as Answers);
        setOpening('open');

        /* Nothing left to decide, so there is nothing to press start on: she
           has come back to read the plan, and the plan is what she gets. The
           button only exists for a game with questions still in it. */
        if (QUESTIONS.every((question) => hers[question.id])) {
          setAt(SLIDES.length - 1);
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

  useEffect(
    () => () => {
      window.clearTimeout(beat.current);
      window.clearTimeout(armed.current);
    },
    [],
  );

  /* The game sits in the page rather than over it, so a question can end up
     half off the bottom of the screen after a scroll. `nearest` is the whole
     point: it does nothing at all when the game is already fully in view,
     which is most of the time — no lurching after every answer.

     Never on the way in, though. Landing on the finished plan opens straight
     onto a slide taller than the screen, and `nearest` answers that by pinning
     its top edge to the top of the viewport — which would throw the page's own
     title off the screen before she has read a word of it. */
  useEffect(() => {
    if (!running) return;

    if (!travelled.current) {
      travelled.current = true;
      return;
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    board.current?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest' });
  }, [running, at]);

  const slide = SLIDES[at];
  const answered = QUESTIONS.filter((question) => answers[question.id]).length;

  /* Forward is blocked on an unanswered question: the whole point of asking
     one at a time is that she cannot look ahead. */
  const settled = slide.kind !== 'question' || Boolean(answers[slide.question.id]);
  const canBack = at > 0;
  const canForward = at < SLIDES.length - 1 && settled;

  const move = useCallback((delta: number) => {
    window.clearTimeout(beat.current);
    setPicked(null);
    setAt((current) => Math.min(Math.max(current + delta, 0), SLIDES.length - 1));
  }, []);

  /* Arrow keys for the laptop. The deck is built for a thumb, but it is going
     to be opened on a desktop at least once. Neither key scrolls the page, so
     taking them while the deck is up costs nothing. */
  useEffect(() => {
    if (!running) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft' && canBack) move(-1);
      if (event.key === 'ArrowRight' && canForward) move(1);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, canBack, canForward, move]);

  function start() {
    latest.current = answers;
    setPicked(null);
    setAt(resume(answers));
    setRunning(true);
  }

  /**
   * Sends the whole set rather than the one answer that changed — a failed
   * push then needs no queue and no retry of its own, because the next tap
   * carries everything again.
   */
  function push(all: Answers) {
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

  function choose(question: Question, option: Option) {
    const next = { ...latest.current, [question.id]: option.id };
    latest.current = next;
    setAnswers(next);
    push(next);

    setPicked(question.id);

    /* Long enough to see the tick land on what she picked, short enough that
       it never feels like waiting. She can cut it short by tapping anywhere. */
    window.clearTimeout(beat.current);
    beat.current = window.setTimeout(() => {
      setPicked(null);
      setAt((current) => Math.min(current + 1, SLIDES.length - 1));
    }, BEAT);
  }

  /* Tapping the slide itself once an answer is in skips the rest of the beat.
     The options stop it bubbling, so this only ever fires on dead space. */
  function nudge() {
    if (picked) move(1);
  }

  function onTouchStart(event: Swipe) {
    const touch = event.changedTouches[0];
    swipe.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: Swipe) {
    const from = swipe.current;
    swipe.current = null;
    if (!from) return;

    const touch = event.changedTouches[0];
    const dx = touch.clientX - from.x;
    const dy = touch.clientY - from.y;
    if (Math.abs(dx) < 64 || Math.abs(dy) > 48) return;

    if (dx > 0 && canBack) move(-1);
    if (dx < 0 && canForward) move(1);
  }

  function askRestart() {
    if (!arming) {
      setArming(true);
      window.clearTimeout(armed.current);
      armed.current = window.setTimeout(() => setArming(false), 4000);
      return;
    }

    window.clearTimeout(armed.current);
    setArming(false);

    latest.current = {};
    setAnswers({});
    setSync('idle');
    setPicked(null);
    setAt(0);
    resetAnswers(GAME).catch(() => {});
  }

  /* ---------- Before it starts ----------------------------
     One button under the title, and nothing else. The two
     states around it are not decoration: until the read lands
     there is no way to know which question she is on, and a
     read that failed has to say so rather than start her over
     from the first one.
     -------------------------------------------------------- */

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
              I cannot reach your answers right now. Nothing is lost.
            </p>

            <button className={styles.begin} type="button" onClick={read}>
              <RefreshCw size={16} strokeWidth={2} />
              <span className={styles.beginLabel}>Try again</span>
            </button>
          </>
        ) : (
          <button className={styles.begin} type="button" onClick={start}>
            <Play size={16} strokeWidth={2} />
            {/* A finished game never reaches this button — it opens straight
                on the plan — so there are only ever two things it can say. */}
            <span className={styles.beginLabel}>{answered === 0 ? 'Start' : 'Continue'}</span>

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

  const SectionIcon = slide.kind === 'end' ? null : ICONS[slide.section.icon];
  const QuestionIcon = slide.kind === 'question' ? ICONS[slide.question.icon] : null;

  return (
    <div className={styles.deck} ref={board}>
      <header className={styles.bar}>
        <button
          className={styles.step}
          type="button"
          onClick={() => move(-1)}
          disabled={!canBack}
          aria-label="Previous"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>

        <span className={styles.track} aria-hidden="true">
          <span
            className={styles.fill}
            style={{ '--p': answered / QUESTIONS.length } as CSSProperties}
          />
        </span>

        <span className={styles.count}>
          {String(answered).padStart(2, '0')}
          <span aria-hidden="true"> / </span>
          {QUESTIONS.length}
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

      {/* Keyed by slide, so every entrance animation replays and nothing of
          the last slide is left behind on this one. */}
      <div
        className={styles.stage}
        key={slide.key}
        onClick={nudge}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {slide.kind === 'question' && (
          <section className={styles.ask}>
            <header className={styles.askHead}>
              <p className={styles.where}>
                {SectionIcon && <SectionIcon size={13} strokeWidth={1.8} aria-hidden="true" />}
                {slide.section.title}
              </p>

              <h2 className={styles.question}>
                <span className={styles.questionMark} aria-hidden="true">
                  {QuestionIcon && <QuestionIcon size={17} strokeWidth={1.5} />}
                </span>
                {slide.question.text}
              </h2>
            </header>

            <ul className={styles.options} data-count={slide.question.options.length}>
              {slide.question.options.map((option, i) => {
                const chosen = answers[slide.question.id] === option.id;
                const dimmed = Boolean(picked) && !chosen;
                /* A letter is for telling options apart. On the question that
                   has only one there is nothing to tell apart, so the mark
                   stays an empty ring until she taps it. */
                const alone = slide.question.options.length === 1;

                return (
                  <li key={option.id}>
                    <button
                      className={styles.option}
                      type="button"
                      aria-pressed={chosen}
                      data-chosen={chosen || undefined}
                      data-dimmed={dimmed || undefined}
                      onClick={(event) => {
                        event.stopPropagation();
                        /* Tapping the one already chosen just moves on rather
                           than saving the same answer over again. */
                        if (chosen) {
                          move(1);
                          return;
                        }
                        choose(slide.question, option);
                      }}
                    >
                      <span className={styles.mark} aria-hidden="true">
                        {chosen ? <Check size={14} strokeWidth={2.6} /> : alone ? null : MARKS[i]}
                      </span>
                      <span className={styles.label}>{option.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Rendered on every question, answered or not, and only turned
                visible — the row is reserved either way, so nothing under the
                options moves when she taps one. It is the way on for a
                question she has come back to; a fresh answer moves by itself. */}
            <footer className={styles.after} data-shown={settled && !picked ? '' : undefined}>
              <button
                className={styles.onward}
                type="button"
                tabIndex={settled && !picked ? undefined : -1}
                onClick={(event) => {
                  event.stopPropagation();
                  move(1);
                }}
              >
                <span>Next</span>
                <ChevronRight size={15} strokeWidth={2} />
              </button>
            </footer>
          </section>
        )}

        {slide.kind === 'end' && (
          <section className={styles.plan}>
            <header className={styles.planHead}>
              <h2 className={styles.planTitle}>This is the plan</h2>
              <p className={styles.planLine}>
                {answered === QUESTIONS.length
                  ? 'You decided all of it. I only have to make it happen.'
                  : `${answered} of ${QUESTIONS.length} decided. The rest I will guess, and you will complain.`}
              </p>
            </header>

            <div className={styles.sheet}>
              {SECTIONS.map((section) => (
                <div className={styles.group} key={section.id}>
                  <h3 className={styles.groupTitle}>{section.title}</h3>

                  <dl className={styles.rows}>
                    {section.questions.map((question) => (
                      <div className={styles.row} key={question.id}>
                        <dt className={styles.rowAsk}>{question.text}</dt>
                        <dd
                          className={styles.rowSaid}
                          data-empty={!answers[question.id] || undefined}
                        >
                          {labelOf(question, answers[question.id]) ?? 'Not decided'}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>

            <div className={styles.planTools}>
              {!connected && (
                <p className={styles.planNote}>
                  Nothing is being kept — this copy of the page has no database behind it.
                </p>
              )}

              {sync === 'failed' && (
                <button className={styles.retry} type="button" onClick={() => push(answers)}>
                  <RefreshCw size={13} strokeWidth={2} />
                  <span>Some of it did not send. Try again</span>
                </button>
              )}

              <button
                className={styles.again}
                type="button"
                data-arming={arming || undefined}
                onClick={askRestart}
              >
                <RotateCcw size={12} strokeWidth={2} />
                <span>{arming ? 'Tap again to erase it all' : 'Start again'}</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
