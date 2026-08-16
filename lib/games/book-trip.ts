/**
 * Game three — Book your trip.
 *
 * Not a game at all, which is the point: it is the one screen on this site that
 * spends money. She picks a window, confirms it, and the tickets get bought —
 * so it is written to be hard to do by accident and impossible to undo by
 * accident. Two taps to book, and after the second one the page stops offering
 * her a choice, because there is no longer one to offer.
 *
 * What lands in the database is one row — `book-trip` / `dates` — and its value
 * is one of the ids below, or `talk` if neither window works for her. Never
 * change an id she may already have confirmed; the wording above it is free.
 *
 * Dates are ISO and nothing else is written down twice: the weekday, the month
 * name and the number of nights are all derived from them, so a change of plan
 * is a change of one string. Everything here is UTC arithmetic on a date with
 * no time in it, so it reads the same on her phone as on mine.
 */

/** One flight. */
export interface Leg {
  /** Full city names — she is booking a trip, not reading a departure board. */
  from: string;
  to: string;
  /** ISO date. The weekday comes from here, never typed by hand. */
  date: string;
  /** Local departure time, 24h. Left out while a flight is not settled yet. */
  time?: string;
  /**
   * Local arrival time, 24h, at the other end of the same day. Shown only when
   * there is a departure to show it against — half a flight is worse than none,
   * because an hour on its own is an hour she has to guess the meaning of.
   */
  lands?: string;
}

/** One window she can take: out on the Tuesday, back on the Saturday. */
export interface Trip {
  id: string;
  /** Set small at the top of the pass, so the two are easy to talk about. */
  tag: string;
  /**
   * Which one I would rather she took. A lit word beside the tag and nothing
   * else — no extra glow, no bigger card, no default selection. It is a thumb
   * on the scale, not a hand, and it stays that way: the choice is hers, and a
   * page that pushed her toward one would be a page that lied about that.
   *
   * Only ever set on one of them. Two preferences are none.
   */
  preferred?: boolean;
  out: Leg;
  back: Leg;
}

/**
 * The two windows. Both Tuesday to Saturday, both leaving at the same hour —
 * which is deliberate: the only thing she is actually choosing between is the
 * week, so nothing else on the two passes is allowed to differ.
 */
export const TRIPS: Trip[] = [
  {
    id: 'sep-15',
    tag: 'First option',
    preferred: true,
    out: { from: 'Tirana', to: 'Gdańsk', date: '2026-09-15', time: '13:00', lands: '15:20' },
    back: { from: 'Gdańsk', to: 'Tirana', date: '2026-09-19', time: '12:40', lands: '15:00' },
  },
  {
    id: 'sep-22',
    tag: 'Second option',
    out: { from: 'Tirana', to: 'Gdańsk', date: '2026-09-22', time: '13:00', lands: '15:20' },
    back: { from: 'Gdańsk', to: 'Tirana', date: '2026-09-26', time: '12:40', lands: '15:00' },
  },
];

/** Neither window works. Saved like an answer, but it books nothing. */
export const TALK = 'talk';

/** The row this game keeps. One question, one answer, one trip. */
export const QUESTION = 'dates';

/* ---------- Telling me ----------------------------------
   The database is where the answer is kept; WhatsApp is how
   I find out. Both happen on the same tap, and neither waits
   for the other — a row I have to go and look at is not how
   somebody learns their flights just got chosen.

   Only the words live here. The number and the link are in
   lib/whatsapp, with every other prefilled message on the
   site, so none of them can drift onto the wrong chat.
   -------------------------------------------------------- */

/** What her tap says when it arrives on my phone. */
export function messageFor(trip: Trip | undefined): string {
  if (!trip) {
    return (
      `Neither of those works, but I'm coming. ` +
      `You still have a lot to prove that you deserve a sexy goddess like me, ` +
      `but fine. Call me and we'll find other dates.`
    );
  }

  /* The dates and nothing else. She picked one of two flights I chose, so the
     route and the times are already mine to look up — repeating them back at
     me only buried the one line that is hers. */
  return (
    `I picked ${spanOf(trip)}. ` +
    `You still have a lot to prove that you deserve a sexy goddess like me, ` +
    `but fine. Call me and let's book it.`
  );
}

/* ---------- Dates, spelled out ---------------------------
   No Intl and no local clock: the same three strings come
   out of these on any phone, in any timezone, which is what
   a static export needs if the server and the browser are to
   agree on what day the 15th is.
   -------------------------------------------------------- */

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DAY = 86_400_000;

export interface Day {
  /** 'Tuesday' */
  weekday: string;
  /** 'Tue' — for the leg rows, where the full name would crowd the route. */
  short: string;
  /** 15 */
  day: number;
  /** 'September' */
  month: string;
  /** 'Sep' */
  monthShort: string;
  year: number;
}

function utc(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function dayOf(iso: string): Day {
  const at = new Date(utc(iso));
  const weekday = WEEKDAYS[at.getUTCDay()];
  const month = MONTHS[at.getUTCMonth()];

  return {
    weekday,
    short: weekday.slice(0, 3),
    day: at.getUTCDate(),
    month,
    monthShort: month.slice(0, 3),
    year: at.getUTCFullYear(),
  };
}

/** Nights, not days — it is the number that decides what to pack. */
export function nightsOf(trip: Trip): number {
  return Math.round((utc(trip.back.date) - utc(trip.out.date)) / DAY);
}

/** '15 — 19 September', or both months when a window straddles one. */
export function spanOf(trip: Trip): string {
  const out = dayOf(trip.out.date);
  const back = dayOf(trip.back.date);

  return out.month === back.month
    ? `${out.day} — ${back.day} ${back.month}`
    : `${out.day} ${out.month} — ${back.day} ${back.month}`;
}

/** 'Tuesday → Saturday'. */
export function weekOf(trip: Trip): string {
  return `${dayOf(trip.out.date).weekday} → ${dayOf(trip.back.date).weekday}`;
}

/**
 * How long she has left to wait. Reads the local clock, so it belongs only in
 * something rendered after the page has mounted — which the one screen that
 * calls it is, since it comes up behind a database read.
 */
export function daysUntil(iso: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((utc(iso) - today) / DAY);
}

export function tripById(id: string | null): Trip | undefined {
  return TRIPS.find((trip) => trip.id === id);
}
