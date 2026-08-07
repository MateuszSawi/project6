/**
 * Game one — Who is more likely to?
 *
 * The questions are the whole game, so they live on their own away from the
 * page that renders them. `id` is what ends up in the database: change the
 * wording freely, never change an id that has already been answered.
 *
 * `icon` is a lucide-react export name. The mapping to the component lives in
 * Likely.tsx — importing 34 icons in a data file would drag the whole set into
 * anything that only wants the questions.
 */

export type Side = 'iza' | 'mateusz';
export type Answer = Side | 'yes' | 'no';
export type Answers = Record<string, Answer>;

export interface Player {
  id: Side;
  name: string;
  /** Shown at thumbnail size beside the name — a face, cropped square. */
  src: string;
  /** object-position, when the face is not in the middle of the file. */
  focus?: string;
}

/* Placeholders taken from /public — drop the real two in and change `src`.
   These are only ever drawn ~44px wide, so small files are fine here. */
export const PLAYERS: Player[] = [
  { id: 'iza', name: 'Iza', src: '/1.1.jpg' },
  { id: 'mateusz', name: 'Mateusz', src: '/2.2.jpg' },
];

export interface Question {
  id: string;
  text: string;
  /** A lucide-react export name. One per question, none repeated. */
  icon: string;
  /**
   * Rigged. Whatever she taps, the answer is this one — see the tease in
   * Likely.tsx. Exactly one question uses it and the joke dies if a second
   * one does.
   */
  rigged?: Side;
  /** The last one is not about the two of them. */
  kind?: 'yesno';
  /** Shown under the answer. Rigged questions need it. */
  note?: string;
}

export const QUESTIONS: Question[] = [
  {
    id: 'movie-sleep',
    icon: 'Popcorn',
    text: 'Who is more likely to fall asleep during a movie?',
  },
  { id: 'lost', icon: 'Compass', text: 'Who is more likely to get us lost?' },
  {
    id: 'trouble',
    icon: 'Binoculars',
    text: 'Who is more likely to have to keep the other out of trouble?',
  },
  { id: 'drunk', icon: 'Wine', text: 'Who is more likely to get drunk first?' },
  {
    id: 'bad-idea',
    icon: 'TriangleAlert',
    text: 'Who is more likely to say “this was a bad idea” and secretly love it?',
  },
  {
    id: 'argument',
    icon: 'Swords',
    text: 'Who is more likely to start an argument over nothing?',
    rigged: 'iza',
  },
  {
    id: 'responsible',
    icon: 'Anchor',
    text: 'Who is more likely to be the responsible one?',
  },
  {
    id: 'arrested',
    icon: 'Siren',
    text: 'Who is more likely to get arrested?',
  },
  {
    id: 'moods',
    icon: 'CloudLightning',
    text: 'Who is more likely not to survive the trip?',
  },
  {
    id: 'carry',
    icon: 'Dumbbell',
    text: 'Who is more likely to carry the other in their arms?',
  },
  { id: 'ass', icon: 'Cherry', text: 'Who is more likely to have better ass?' },
  {
    id: 'cry',
    icon: 'Frown',
    text: 'Who is more likely to cry at a sad movie?',
  },
  {
    id: 'horror',
    icon: 'Ghost',
    text: 'Who is more likely to shit themselves from fear while watching a horror?',
  },
  {
    id: 'funny',
    icon: 'Laugh',
    text: 'Who is more likely to have to pretend that Iza is funny?',
  },
  {
    id: 'sing',
    icon: 'ShowerHead',
    text: 'Who is more likely to sing in the shower?',
  },
  {
    id: 'first-move',
    icon: 'Footprints',
    text: 'Who is more likely to make the first move?',
  },
  { id: 'jealous', icon: 'Eye', text: 'Who is more likely to get jealous?' },
  {
    id: 'flirt',
    icon: 'Flame',
    text: 'Who is more likely to do more of the flirting?',
  },
  {
    id: 'apologize',
    icon: 'HandHeart',
    text: 'Who is more likely to make peace first after Iza does something wrong?',
  },
  {
    id: 'prove',
    icon: 'Medal',
    text: 'Who is more likely to have to prove themselves to the other?',
  },
  {
    id: 'miss-first',
    icon: 'Hourglass',
    text: 'Who is more likely to miss the other one first?',
  },
  {
    id: 'hugs',
    icon: 'HeartHandshake',
    text: 'Who is more likely to give better hugs?',
  },
  { id: 'kiss', icon: 'Heart', text: 'Who is more likely to kiss better?' },
  {
    id: 'surprise',
    icon: 'Gift',
    text: 'Who is more likely to plan a ridiculous surprise?',
  },
  {
    id: 'pretend',
    icon: 'Drama',
    text: 'Who is more likely to pretend they don’t give a fuck when they obviously do?',
  },
  {
    id: 'love-first',
    icon: 'HeartPulse',
    text: 'Who is more likely to steal the other’s heart?',
  },
  {
    id: 'break-heart',
    icon: 'HeartCrack',
    text: 'Who is more likely to break the other’s heart?',
  },
  {
    id: 'oral',
    icon: 'Banana',
    text: 'Who is more likely to give better oral?',
  },
  {
    id: 'one-more-day',
    icon: 'CalendarHeart',
    text: 'Who is more likely to want one more day together?',
  },
  {
    id: 'obsessed',
    icon: 'Globe',
    text: 'Who is more likely to become obsessed with the other’s country?',
  },
  {
    id: 'lied',
    icon: 'Fingerprint',
    text: 'Did you lie at least once during the test?',
    kind: 'yesno',
  },
];

/** Everything except the closing yes/no — the part that has two sides to it. */
export const SIDED = QUESTIONS.filter((question) => question.kind !== 'yesno');
