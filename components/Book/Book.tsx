'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CloudOff,
  Loader2,
  Lock,
  MessageCircle,
  Plane,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

import {
  QUESTION,
  TALK,
  TRIPS,
  dayOf,
  daysUntil,
  messageFor,
  nightsOf,
  spanOf,
  tripById,
  weekOf,
  whatsappLink,
  type Leg,
  type Trip,
} from '@/lib/games/book-trip';
import { complete } from '@/lib/games/upgrade-trip';
import { connected, loadStored, pushAnswers, resetAnswers } from '@/lib/results';

import styles from './Book.module.scss';

const GAME = 'book-trip';

/** The one that has to be finished before this page is a page. */
const BEFORE = 'upgrade-trip';

/**
 * Book your trip.
 *
 * Two boarding passes and one quiet way out from under them. She taps a pass,
 * and nothing has happened yet — the tap is a choice, not a booking. What it
 * does is put the choice on its own screen, over a blurred copy of the page,
 * with one button on it that says exactly what it is about to do.
 *
 * The booking is that second tap, and it does two things at once: it writes the
 * row, and it opens WhatsApp with the message already typed. Neither waits for
 * the other, because they answer different questions — the row is what the page
 * reads when she comes back, the message is how I find out tonight.
 *
 * None of which she sees until the upgrade is finished. The order matters: she
 * should have taken everything she is being given before she is asked to name
 * the week, and a locked tile on the front page is not enough on its own — the
 * address is guessable and she is the sort of person who would guess it.
 *
 * After that the page is done: the passes are gone, the one she took is stamped,
 * and there is no control anywhere on this screen that changes it. That is the
 * whole design. A date she can flip back and forth is a date I cannot buy a
 * ticket against, so the finality is the feature — and it is why the confirm is
 * two taps and why it only ever lands after the database says it landed.
 *
 * The one exception is the third option. "Talk to me first" books nothing, so
 * it locks nothing: it leaves a note in the same row and hands the passes back
 * whenever she wants them.
 */
export default function Book() {
  /** Her answer as it stands in the database. Null until she has given one. */
  const [answer, setAnswer] = useState<string | null>(null);
  /**
   * Tapped, not yet confirmed — and, since the confirmation is a screen of its
   * own, this doubles as whether that screen is up. Nothing has been sent while
   * it is set.
   */
  const [picked, setPicked] = useState<string | null>(null);
  const [phase, setPhase] = useState<'reading' | 'unreachable' | 'open'>(
    connected ? 'reading' : 'open',
  );
  /** Whether the upgrade is finished. Nothing else on this page runs until it is. */
  const [upgraded, setUpgraded] = useState(!connected);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  /** The confirm button, so the dialog opens with it already under her thumb. */
  const send = useRef<HTMLAnchorElement | null>(null);

  const read = useCallback(() => {
    if (!connected) return () => {};

    let alive = true;
    setPhase('reading');

    /* Both games in one go. The gate has to be known before anything is drawn,
       or the passes would flash up in front of her and then be taken away. */
    Promise.all([loadStored(GAME), loadStored(BEFORE)])
      .then(([mine, before]) => {
        if (!alive) return;
        setAnswer(mine.hers[QUESTION] ?? null);
        setUpgraded(complete(before.hers));
        setPhase('open');
      })
      .catch(() => {
        if (alive) setPhase('unreachable');
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(read, [read]);

  /* While the confirmation is up it is the only thing on the screen, and it
     behaves like it: escape closes it, and the page underneath stops scrolling
     so a thumb on the blur cannot move the passes about behind it. */
  useEffect(() => {
    if (!picked) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setPicked(null);
    }

    const held = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    send.current?.focus();

    return () => {
      document.body.style.overflow = held;
      window.removeEventListener('keydown', onKey);
    };
  }, [picked]);

  const booked = tripById(answer);

  /**
   * The only write this game makes, and it runs beside the WhatsApp link
   * rather than in front of it — the anchor is already on its way out while
   * this is still in the air.
   *
   * It sets her answer from what came back, never from what was hoped for: if
   * the push fails the page stays exactly where it was, because a pass stamped
   * against an empty row is a trip nobody booked.
   */
  function confirm() {
    if (!picked) return;

    setFailed(false);

    if (!connected) {
      setAnswer(picked);
      setPicked(null);
      return;
    }

    setSaving(true);

    pushAnswers(GAME, { [QUESTION]: picked })
      .then(() => {
        setAnswer(picked);
        setPicked(null);
      })
      .catch(() => setFailed(true))
      .finally(() => setSaving(false));
  }

  /* Only ever reachable from the note — a booked window has no way back. */
  function undoTalk() {
    setAnswer(null);
    setPicked(null);
    if (connected) resetAnswers(GAME).catch(() => {});
  }

  /* ---------- Waiting on the database --------------------- */

  if (phase === 'reading') {
    return (
      <p className={styles.state} aria-live="polite">
        <Loader2 className={styles.spin} size={16} strokeWidth={1.8} aria-hidden="true" />
        Checking whether you have already picked…
      </p>
    );
  }

  if (phase === 'unreachable') {
    return (
      <div className={styles.opening}>
        <p className={styles.state} aria-live="polite">
          <CloudOff size={16} strokeWidth={1.8} aria-hidden="true" />
          I cannot reach the booking right now. Nothing is lost, and nothing is bought.
        </p>

        <button className={styles.begin} type="button" onClick={read}>
          <RefreshCw size={16} strokeWidth={2} />
          <span className={styles.beginLabel}>Try again</span>
        </button>
      </div>
    );
  }

  /* ---------- Booked. The end of the game. ---------------- */

  if (booked) {
    const left = daysUntil(booked.out.date);

    return (
      <div className={styles.done}>
        <article className={styles.pass} data-state="booked">
          <span className={styles.stamp} aria-hidden="true">
            Booked
          </span>
          <Body trip={booked} />
        </article>

        <div className={styles.after}>
          <p className={styles.settled}>
            <Lock size={13} strokeWidth={2} aria-hidden="true" />
            That is the trip. I am buying the tickets.
          </p>

          {left > 0 && (
            <p className={styles.countdown}>
              {left} {left === 1 ? 'day' : 'days'} until you get on that plane.
            </p>
          )}

          {!connected && (
            <p className={styles.note}>
              Nothing is being kept — this copy of the page has no database behind it.
            </p>
          )}

          <p className={styles.note}>
            You cannot change it here any more. If something happened, tell me and I will move it.
          </p>
        </div>
      </div>
    );
  }

  /* ---------- She wants to talk first --------------------- */

  if (answer === TALK) {
    return (
      <div className={styles.done}>
        <div className={styles.talkBack}>
          <p className={styles.talkTitle}>
            <MessageCircle size={16} strokeWidth={1.8} aria-hidden="true" />
            Neither week, then.
          </p>
          <p className={styles.talkLine}>
            Nothing is booked. Tell me what does work and I will find the flights around it.
          </p>

          <button className={styles.quiet} type="button" onClick={undoTalk}>
            Actually, let me pick one
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Not yet ------------------------------------
     The upgrade comes first. Shown after the booked screen
     and after the note on purpose: an answer she has already
     given is hers to see, whatever order she gave it in.
     -------------------------------------------------------- */

  if (!upgraded) {
    return (
      <div className={styles.done}>
        <div className={styles.talkBack}>
          <p className={styles.talkTitle}>
            <Lock size={16} strokeWidth={1.8} aria-hidden="true" />
            Not this one yet.
          </p>
          <p className={styles.talkLine}>
            Go and upgrade your trip first — all five of them, everything you want out of each.
            The dates open when you are done taking things from me.
          </p>

          <Link className={styles.begin} href="/games/upgrade-trip/">
            <Sparkles size={16} strokeWidth={2} />
            <span className={styles.beginLabel}>Upgrade your trip</span>

            <span className={styles.sparks} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </span>
          </Link>
        </div>
      </div>
    );
  }

  /* ---------- Choosing ------------------------------------ */

  const pickedTrip = tripById(picked);

  return (
    <div className={styles.wrap}>
      <ul className={styles.passes}>
        {TRIPS.map((trip) => {
          const chosen = picked === trip.id;
          const dimmed = Boolean(picked) && !chosen;

          return (
            <li key={trip.id}>
              <button
                className={styles.pass}
                type="button"
                aria-pressed={chosen}
                data-state={chosen ? 'picked' : dimmed ? 'dimmed' : undefined}
                onClick={() => setPicked(chosen ? null : trip.id)}
              >
                <Body trip={trip} />
              </button>
            </li>
          );
        })}
      </ul>

      {/* The way out, and deliberately the quietest thing on the page: there
          are two windows, and this is not a third one. */}
      <button className={styles.quiet} type="button" onClick={() => setPicked(TALK)}>
        Neither option works? Talk to me.
      </button>

      {/* ---------- The confirmation ----------------------
          Over everything, with the page blurred behind it.
          Not a panel wedged under the passes: this is the
          screen where the money gets spent, and it should
          have nothing else on it and nowhere else to look.

          Fixed rather than portalled — nothing above this in
          the tree carries a transform or a filter, so there
          is no containing block for it to get trapped in.
          -------------------------------------------------- */}
      {picked && (
        <div
          className={styles.veil}
          /* The backdrop is a way out, same as "Change option" — see the
             dialog's own handler, which stops a tap inside from reaching
             this one. */
          onClick={() => setPicked(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className={styles.confirmKind}>{pickedTrip ? 'Confirm' : 'Call me'}</p>

            <h2 className={styles.confirmTitle} id="book-confirm-title">
              {pickedTrip ? spanOf(pickedTrip) : 'We will find other dates'}
            </h2>

            {pickedTrip ? (
              <>
                <p className={styles.confirmMeta}>
                  {weekOf(pickedTrip)}
                  <span aria-hidden="true"> · </span>
                  {nightsOf(pickedTrip)} nights
                </p>

                <div className={styles.brief}>
                  <Row leg={pickedTrip.out} label="Out" />
                  <Row leg={pickedTrip.back} label="Back" />
                </div>

                <p className={styles.warn}>
                  {/* Confirm and it is done. I book these flights, and the date stops being a
                  question. You will not be able to change it here. */}
                </p>
              </>
            ) : (
              <p className={styles.warn}>
                {/* Nothing gets booked and nothing is decided. I just get told, and then we find a
                week that works. */}
              </p>
            )}

            {/* An anchor, not a button: the tap has to be the thing that opens
                WhatsApp, or a browser counts the new tab as a popup and eats
                it. The write goes off beside it and lands whenever it lands. */}
            <a
              className={styles.lock}
              ref={send}
              href={whatsappLink(messageFor(pickedTrip))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={confirm}
            >
              <MessageCircle size={16} strokeWidth={2} aria-hidden="true" />
              <span className={styles.lockLabel}>
                {pickedTrip ? 'Click to confirm' : 'Click me'}
              </span>

              <span className={styles.sparks} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </span>
            </a>

            <button className={styles.quiet} type="button" onClick={() => setPicked(null)}>
              Change option
            </button>

            {saving && (
              <p className={styles.saving} aria-live="polite">
                <Loader2 className={styles.spin} size={13} strokeWidth={2} aria-hidden="true" />
                Writing it down…
              </p>
            )}

            {failed && (
              <p className={styles.failed} aria-live="polite">
                <CloudOff size={13} strokeWidth={2} aria-hidden="true" />
                <span>
                  The message went, but I could not write it down.{' '}
                  <button className={styles.retry} type="button" onClick={confirm}>
                    Save it again
                  </button>
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- The pass itself ------------------------------
   One shape, three lives: a button while she is choosing, a
   plate once one is booked. Written once so the booked one is
   unmistakably the same object she tapped.
   -------------------------------------------------------- */

function Body({ trip }: { trip: Trip }) {
  const nights = nightsOf(trip);

  return (
    <>
      <header className={styles.head}>
        <span className={styles.tag}>{trip.tag}</span>

        {/* Said once, quietly, and never again — it does not follow her into
            the confirmation. She should be deciding there, not being nudged. */}
        {trip.preferred && <span className={styles.preferred}>I prefer this one</span>}

        <span className={styles.nights}>
          {nights} {nights === 1 ? 'night' : 'nights'}
        </span>
      </header>

      <p className={styles.span}>{spanOf(trip)}</p>
      <p className={styles.week}>{weekOf(trip)}</p>

      <div className={styles.legs}>
        <Row leg={trip.out} label="Out" />
        <Row leg={trip.back} label="Back" />
      </div>
    </>
  );
}

function Row({ leg, label }: { leg: Leg; label: string }) {
  const day = dayOf(leg.date);

  return (
    <div className={styles.leg}>
      <span className={styles.legTag} aria-hidden="true">
        {label === 'Out' ? (
          <Plane size={12} strokeWidth={1.8} />
        ) : (
          <Plane className={styles.backwards} size={12} strokeWidth={1.8} />
        )}
        {label}
      </span>

      <span className={styles.route}>
        {leg.from}
        <ArrowRight size={13} strokeWidth={1.8} aria-hidden="true" />
        {leg.to}
      </span>

      <span className={styles.when}>
        <span className={styles.date}>
          {day.short} {day.day} {day.monthShort}
        </span>

        {/* Take-off and landing as one figure. An en dash rather than an arrow:
            the route beside it already has an arrow, and two of them in one row
            makes the hours look like a second journey. */}
        {leg.time && (
          <span className={styles.time}>
            {leg.time}
            {leg.lands && (
              <>
                <span className={styles.dash} aria-hidden="true">
                  –
                </span>
                {leg.lands}
              </>
            )}
          </span>
        )}
      </span>
    </div>
  );
}
