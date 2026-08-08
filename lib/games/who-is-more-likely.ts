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

/* Cropped to the face and cut down to 256px: these are drawn at ~40px and
   nowhere else, so anything larger is bytes she pays for and never sees. The
   uncropped originals live outside public/ — see assets/players. */
export const PLAYERS: Player[] = [
  { id: 'iza', name: 'Iza', src: '/players/iza.webp' },
  { id: 'mateusz', name: 'Mateusz', src: '/players/mateusz.webp' },
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
  { id: 'arrested', icon: 'Siren', text: 'Who is more likely to get arrested?' },
  {
    id: 'horror',
    icon: 'Ghost',
    text: 'Who is more likely to shit themselves from fear while watching a horror?',
  },
  { id: 'responsible', icon: 'Anchor', text: 'Who is more likely to be the responsible one?' },
  { id: 'drunk', icon: 'Wine', text: 'Who is more likely to get drunk first?' },
  { id: 'sing', icon: 'ShowerHead', text: 'Who is more likely to sing in the shower?' },
  {
    id: 'argument',
    icon: 'Swords',
    text: 'Who is more likely to start an argument over nothing?',
    rigged: 'iza',
  },
  {
    id: 'apologize',
    icon: 'HandHeart',
    text: 'Who is more likely to make peace first after an argument?',
  },
  { id: 'jealous', icon: 'Eye', text: 'Who is more likely to get jealous?' },
  {
    id: 'prove',
    icon: 'Medal',
    text: 'Who is more likely to have to prove themselves to the other?',
  },
  {
    id: 'pretend',
    icon: 'Drama',
    text: 'Who is more likely to pretend they don’t give a fuck when they obviously do?',
  },
  { id: 'hugs', icon: 'HeartHandshake', text: 'Who is more likely to give better hugs?' },
  { id: 'carry', icon: 'Dumbbell', text: 'Who is more likely to carry the other in their arms?' },
  { id: 'flirt', icon: 'Flame', text: 'Who is more likely to do more of the flirting?' },
  { id: 'first-move', icon: 'Footprints', text: 'Who is more likely to make the first move?' },
  { id: 'ass', icon: 'Cherry', text: 'Who is more likely to have better ass?' },
  { id: 'kiss', icon: 'Heart', text: 'Who is more likely to kiss better?' },
  { id: 'surprise', icon: 'Gift', text: 'Who is more likely to plan a ridiculous surprise?' },
  {
    id: 'bad-idea',
    icon: 'TriangleAlert',
    text: 'Who is more likely to say “this was a bad idea” and secretly love it?',
  },
  {
    id: 'obsessed',
    icon: 'Globe',
    text: 'Who is more likely to become obsessed with the other’s country?',
  },
  {
    id: 'miss-first',
    icon: 'Hourglass',
    text: 'Who is more likely to miss the other one first?',
  },
  {
    id: 'love-first',
    icon: 'HeartPulse',
    text: 'Who is more likely to steal the other’s heart?',
  },
  {
    id: 'one-more-day',
    icon: 'CalendarHeart',
    text: 'Who is more likely to want one more day together?',
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
