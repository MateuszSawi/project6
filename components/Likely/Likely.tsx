'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  Anchor,
  CalendarHeart,
  Check,
  Cherry,
  CloudOff,
  Drama,
  Dumbbell,
  Eye,
  Fingerprint,
  Flame,
  Footprints,
  Ghost,
  Gift,
  Globe,
  HandHeart,
  Heart,
  HeartHandshake,
  HeartPulse,
  Hourglass,
  Loader2,
  Medal,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShowerHead,
  Siren,
  Swords,
  TriangleAlert,
  Wine,
  X,
  type LucideIcon,
} from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import Report from '@/components/Report/Report';
import {
  PLAYERS,
  QUESTIONS,
  type Answer,
  type Answers,
  type Question,
} from '@/lib/games/who-is-more-likely';
import { connected, loadStored, pushAnswers, resetAnswers } from '@/lib/results';

import styles from './Likely.module.scss';

const GAME = 'who-is-more-likely';

/** How long the rigged question is allowed to argue back before it wins. */
const TEASE = 950;

/* One per question. Named in the data file, resolved here so nothing but this
   component pulls the icon set in. */
const ICONS: Record<string, LucideIcon> = {
  Anchor,
  CalendarHeart,
  Cherry,
  Drama,
  Dumbbell,
  Eye,
  Fingerprint,
  Flame,
  Footprints,
  Ghost,
  Gift,
  Globe,
  HandHeart,
  Heart,
  HeartHandshake,
  HeartPulse,
  Hourglass,
  Medal,
  ShowerHead,
  Siren,
  Swords,
  TriangleAlert,
  Wine,
};

/** Faces are ~40px here. Small files are fine; the crop is what matters. */
function Face({ id }: { id: Answer }) {
  const player = PLAYERS.find((candidate) => candidate.id === id);
  if (!player) return null;

  return (
    <span className={styles.person}>
      <Frame
        className={styles.avatar}
        src={player.src}
        alt=""
        grade="none"
        focus={player.focus}
      />
      <span className={styles.personName}>{player.name}</span>
    </span>
  );
}

/**
 * The whole game, built for a phone held in one hand.
 *
 * Every question is on the page at once, stacked. The one she is on is sharp;
 * everything below it is blurred out of focus and disabled, and comes into
 * focus only as she works down.
 *
 * A question is exactly the same height before and after she answers it: the
 * two cells under the question are one grid that never changes shape, only
 * contents. Before, they are the two people to choose between. After, they are
 * her answer and mine, side by side — mine typed into Supabase by hand and
 * revealed one question at a time, which is the only reason to play this.
 *
 * The database is the only memory. Nothing is kept on the phone, so she can
 * close the tab at question nine, open it a week later on a different phone,
 * and find question nine — and so can I, from mine.
 */
export default function Likely() {
  const [answers, setAnswers] = useState<Answers>({});
  /** Mine. Empty until the fetch lands, and empty forever if there are no keys. */
  const [mine, setMine] = useState<Record<string, string>>({});
  /** The answered question whose choices are open again. One at a time. */
  const [editing, setEditing] = useState<string | null>(null);
  /** The rigged question, mid-argument. */
  const [teasing, setTeasing] = useState<string | null>(null);
  /** Index to scroll to once the next question has come into focus. */
  const [focus, setFocus] = useState<number | null>(null);
  /** State of the last push. */
  const [sync, setSync] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  /**
   * Restart is armed by the first tap and only fires on the second. There is
   * one of these buttons pinned to the top of the screen for the whole scroll,
   * and a single mis-tap would wipe every answer she has given with no way
   * back.
   */
  const [arming, setArming] = useState(false);
  /**
   * The first read. Nothing is shown until it lands: an empty stack looks
   * exactly like a game she has not started, and she would answer straight
   * over the top of what is already in the table.
   */
  const [opening, setOpening] = useState<'reading' | 'open' | 'unreachable'>(
    connected ? 'reading' : 'open',
  );

  const cards = useRef<Array<HTMLLIElement | null>>([]);
  const end = useRef<HTMLElement | null>(null);
  const timer = useRef(0);
  /* Taps come faster than round trips. Only the newest push may set the mark,
     or a slow early failure could land after a later success. */
  const pushes = useRef(0);
  /** Disarms the restart button if the second tap never comes. */
  const armed = useRef(0);
  /* The rigged question answers itself on a timer, so the handler that lands
     a second later must not write from the state it closed over. */
  const latest = useRef<Answers>({});

  /* Both columns, in one request, before anything is drawn. Runs after mount
     rather than during render — the server has no idea what is in the table
     and the first client render has to match what it sent. */
  const read = useCallback(() => {
    if (!connected) return () => {};

    let alive = true;
    setOpening('reading');

    loadStored(GAME)
      .then(({ mine: theirs, hers }) => {
        if (!alive) return;
        latest.current = hers as Answers;
        setAnswers(hers as Answers);
        setMine(theirs);
        setOpening('open');
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
      window.clearTimeout(timer.current);
      window.clearTimeout(armed.current);
    },
    [],
  );

  /* The next question is already unblurred by the time this runs — it is the
     render that follows the answer, not the one that carries it. */
  useEffect(() => {
    if (focus === null) return;
    setFocus(null);

    const node = focus >= QUESTIONS.length ? end.current : cards.current[focus];
    if (!node) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    node.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  }, [focus]);

  /**
   * Sends the whole set, not the one answer that changed. That is deliberate:
   * a failed push needs no queue and no retry of its own, because the next tap
   * carries everything again — and on the last question, the retry button.
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

  function commit(question: Question, index: number, value: Answer) {
    const fresh = !latest.current[question.id];
    const next = { ...latest.current, [question.id]: value };

    latest.current = next;
    setAnswers(next);
    push(next);
    setEditing(null);

    if (fresh) setFocus(index + 1);
  }

  function choose(question: Question, index: number, value: Answer) {
    /* The rigged one. It lets her tap, refuses, and answers itself. */
    if (question.rigged && value !== question.rigged) {
      setTeasing(question.id);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        setTeasing(null);
        commit(question, index, question.rigged as Answer);
      }, TEASE);
      return;
    }

    commit(question, index, question.rigged ?? value);
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
    restart();
  }

  /* Empties her column in the database. Mine is not touched — it is not hers
     to reset. */
  function restart() {
    latest.current = {};
    setAnswers({});
    setEditing(null);
    setSync('idle');
    resetAnswers(GAME).catch(() => {});
    cards.current[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const firstOpen = QUESTIONS.findIndex((question) => !answers[question.id]);
  const done = firstOpen === -1;
  const answered = QUESTIONS.filter((question) => answers[question.id]).length;

  if (opening !== 'open') {
    return (
      <div className={styles.game}>
        <section className={styles.opening} aria-live="polite">
          {opening === 'reading' ? (
            <>
              <span className={styles.openingMark} aria-hidden="true">
                <Loader2 size={18} strokeWidth={1.6} />
              </span>
              <p className={styles.openingLine}>Finding where you left off…</p>
            </>
          ) : (
            <>
              <span className={styles.openingMark} data-cold="" aria-hidden="true">
                <CloudOff size={18} strokeWidth={1.6} />
              </span>

              <p className={styles.openingLine}>
                I cannot reach your answers right now. They are safe — nothing here is lost.
                Check your signal and try again.
              </p>

              <button className={styles.send} type="button" onClick={read}>
                <RefreshCw size={15} strokeWidth={2} />
                <span className={styles.sendLabel}>Try again</span>
              </button>
            </>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className={styles.game}>
      {/* Sticky, thin, and the only chrome the game has. */}
      <div className={styles.rail} role="status" aria-live="polite">
        <span className={styles.railTrack} aria-hidden="true">
          <span
            className={styles.railFill}
            style={{ '--p': answered / QUESTIONS.length } as CSSProperties}
          />
        </span>
        <span className={styles.railCount}>
          {String(answered).padStart(2, '0')} <span aria-hidden="true">/</span> {QUESTIONS.length}
        </span>

        {/* Only once she has answered everything: until then the way forward
            is down the page, not back to the start. */}
        {done && (
          <button
            className={styles.railRestart}
            type="button"
            data-arming={arming || undefined}
            onClick={askRestart}
          >
            <RotateCcw size={12} strokeWidth={2} />
            <span>{arming ? 'Sure?' : 'Restart'}</span>
          </button>
        )}

        {/* Quiet on purpose. It is not a thing to worry about — the phone has
            every answer whatever this says. */}
        {sync !== 'idle' && (
          <span className={styles.railSync} data-state={sync}>
            {sync === 'saving' ? (
              <Loader2 size={12} strokeWidth={2.2} />
            ) : sync === 'saved' ? (
              <Check size={12} strokeWidth={2.4} />
            ) : (
              <CloudOff size={12} strokeWidth={2.2} />
            )}
          </span>
        )}
      </div>

      <ol className={styles.stack}>
        {QUESTIONS.map((question, i) => {
          const answer = answers[question.id];
          const locked = !done && i > firstOpen;
          const open = !answer || editing === question.id;
          const state = locked ? 'locked' : open ? 'active' : 'answered';
          const Icon = ICONS[question.icon];
          const yesno = question.kind === 'yesno';

          const his = mine[question.id] as Answer | undefined;
          const match = !open && his ? (his === answer ? 'yes' : 'no') : undefined;

          return (
            <li
              className={styles.card}
              key={question.id}
              ref={(node) => {
                cards.current[i] = node;
              }}
              data-state={state}
              /* Distance below the live question, so the blur deepens the
                 further down the stack a question sits. */
              style={{ '--d': locked ? Math.min(i - firstOpen, 5) : 0 } as CSSProperties}
            >
              <div className={styles.head}>
                <span className={styles.badge} aria-hidden="true">
                  {Icon ? <Icon size={16} strokeWidth={1.6} /> : null}
                </span>

                <div className={styles.headText}>
                  <span className={styles.number} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className={styles.question}>{question.text}</h2>
                </div>
              </div>

              {/* Two boxes to choose between before the tap; one joined panel
                  after it, with the verdict sitting on the seam. Both are
                  exactly `--row` tall, so answering never moves the page. */}
              {open ? (
                <div className={styles.body}>
                  {yesno ? (
                    (['yes', 'no'] as const).map((value) => (
                      <button
                        className={styles.choice}
                        key={value}
                        type="button"
                        disabled={locked}
                        onClick={() => choose(question, i, value)}
                      >
                        <span className={styles.plain}>{value === 'yes' ? 'Yes' : 'No'}</span>
                      </button>
                    ))
                  ) : (
                    PLAYERS.map((player) => (
                      <button
                        className={styles.choice}
                        key={player.id}
                        type="button"
                        disabled={locked}
                        /* The rigged question, caught in the act. */
                        data-rejected={
                          teasing === question.id && player.id !== question.rigged ? '' : undefined
                        }
                        data-forced={
                          teasing === question.id && player.id === question.rigged ? '' : undefined
                        }
                        onClick={() => choose(question, i, player.id)}
                      >
                        <Face id={player.id} />
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* The closing question was never mine to answer, so it has no
                   second half: her answer sits alone, in the middle. */
                <div className={styles.pair} data-match={match} data-solo={yesno || undefined}>
                  <div className={styles.side}>
                    {!yesno && <span className={styles.sideLabel}>You said</span>}

                    {yesno ? (
                      <span className={styles.plain}>{answer === 'yes' ? 'Yes' : 'No'}</span>
                    ) : (
                      <Face id={answer} />
                    )}
                  </div>

                  {!yesno && (
                    <>
                      {/* The seam. It is the point of the whole row. */}
                      <span className={styles.seam} aria-hidden="true">
                        {match && (
                          <span className={styles.seamMark}>
                            {match === 'yes' ? (
                              <Check size={14} strokeWidth={2.6} />
                            ) : (
                              <X size={14} strokeWidth={2.6} />
                            )}
                          </span>
                        )}
                      </span>

                      <div className={styles.side} data-quiet={!his ? '' : undefined}>
                        <span className={styles.sideLabel}>I said</span>

                        {his ? <Face id={his} /> : <span className={styles.pending}>Not yet</span>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Reserved from the start on the questions that have one, so
                  answering never changes the height of the card. */}
              {question.note && (
                <p
                  className={styles.note}
                  data-shown={(answer && !open) || teasing === question.id ? '' : undefined}
                >
                  {teasing === question.id ? 'Nice try. It has always been you.' : question.note}
                </p>
              )}

              {/* Under the answer, and rendered on every card whether or not it
                  has been answered — `visibility` rather than a mount, so the
                  row is reserved and a tap never shifts the page. Hidden also
                  means out of the tab order, which is what we want. */}
              <div className={styles.tools} data-shown={answer && !open ? '' : undefined}>
                <button
                  className={styles.change}
                  type="button"
                  onClick={() => setEditing(question.id)}
                >
                  <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                  <span>Change your answer</span>
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {done && (
        <section className={styles.end} ref={end} aria-labelledby="end-title">
          <h2 className={styles.endTitle} id="end-title">
            AI analysis of our answers
          </h2>

          {/* Four seconds of theatre, then a verdict that was decided long
              before she answered anything. */}
          <Report />

          {/* There is no send button any more: every tap went out as it
              happened. All that is left is to say so, and to offer one retry
              if the last one did not make it. */}
          {!connected ? (
            <p className={styles.sendNote}>
              Nothing is being kept — this copy of the page has no database behind it.
            </p>
          ) : sync === 'failed' ? (
            <>
              <button className={styles.send} type="button" onClick={() => push(answers)}>
                <RefreshCw size={15} strokeWidth={2} />
                <span className={styles.sendLabel}>Send them again</span>

                <span className={styles.sparks} aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </button>

              <p className={styles.sendNote} role="status" aria-live="polite">
                The last one did not get through. Press this once you have signal, or just
                change any answer — that sends them all again.
              </p>
            </>
          ) : null}

          <button
            className={styles.restart}
            type="button"
            data-arming={arming || undefined}
            onClick={askRestart}
          >
            <RotateCcw size={12} strokeWidth={2} />
            <span>{arming ? 'Tap again to erase everything' : 'Start again'}</span>
          </button>
        </section>
      )}
    </div>
  );
}
