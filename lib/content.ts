/**
 * All copy and image wiring for the page.
 *
 * Photographs go in /public/images with exactly the filenames below. Until a
 * file exists its frame renders as a burgundy plate — nothing breaks, nothing
 * needs changing in code when the photos land.
 */

export interface Place {
  id: string;
  /** One to three words. This is the loud part. */
  title: string;
  /** The real place, set small underneath. */
  place: string;
  /** Absent on the secret, which has no photograph by definition. */
  src?: string;
  /** Rendered as a sealed panel across the full width. */
  secret?: boolean;
  /** Secret only — the tile has no photograph, so it needs words instead. */
  line?: string;
  /**
   * Grading strength. `strong` is for flat, hazy or overcast files that need
   * extra saturation and contrast to come alive. Files that already have their
   * own colour are left on `soft`. Defaults to `soft`.
   */
  grade?: 'soft' | 'strong';
  /** object-position, when the subject is not in the middle of the file. */
  focus?: string;
}

export const PLACES: Place[] = [
  {
    id: 'oliwa',
    title: 'The Park',
    place: 'Park Oliwski',
    src: '/images/park-oliwski.jpg',
    grade: 'strong', // flat grey overcast sky
  },
  {
    id: 'oldtown',
    title: 'Old Town',
    place: 'Gdańsk',
    src: '/images/old-town.jpg',
  },
  {
    id: 'sopot',
    title: 'The Pier',
    place: 'Sopot',
    src: '/images/sopot.jpg',
    grade: 'strong', // hazy, pale, low contrast
    focus: '50% 78%', // the top half of the file is empty sky
  },
  {
    id: 'gdynia',
    title: 'The Port',
    place: 'Gdynia',
    src: '/images/gdynia.jpg', // blue hour, warm lamps — rich already
  },
  {
    id: 'cliff',
    title: 'The Cliff',
    place: 'Orłowo',
    src: '/images/orlowo.jpg', // already saturated
  },
  {
    id: 'spit',
    title: 'Two Seas',
    place: 'Rewa',
    src: '/images/rewa.jpg',
  },
  {
    id: 'seals',
    title: 'The Seals',
    place: 'The fishing village',
    src: '/images/wioska-fok.webp',
  },
  {
    id: 'alpacas',
    title: 'The Alpacas',
    place: 'Bojano',
    src: '/images/alpaki.jpg',
    grade: 'strong', // overcast and flat
    focus: '50% 40%', // keep the face, drop some of the ground
  },
  {
    id: 'castle',
    title: 'The Unfinished',
    place: 'Łapalice Castle',
    src: '/images/lapalice.jpg',
    grade: 'strong', // desaturated on purpose, but needs bite
  },
  {
    id: 'rumia',
    title: 'Close to Home',
    place: 'Rumia',
    src: '/images/rumia-park.jpg', // vivid green already
  },
  {
    id: 'sky',
    title: 'The Sky',
    place: 'Away from every light',
    src: '/images/niebo-gwiazdy.jpg', // dark, keep it that way
  },
  {
    id: 'secret',
    title: 'The Secret',
    place: 'Not telling.',
    /* Sits inside the tile rather than under it — the plate is its background. */
    line: 'You will see when you come.',
    secret: true,
  },
];

export type TermIcon =
  | 'key'
  | 'vape'
  | 'hands'
  | 'sound'
  | 'tall'
  | 'wallet'
  | 'language'
  | 'candle'
  | 'warm'
  | 'heart'
  | 'more'
  | 'shield';

export interface Term {
  id: string;
  /** The promise. */
  line: string;
  /** The teasing underneath. Optional — some promises land better bare. */
  sub?: string;
  icon: TermIcon;
  /** Spans the grid. For the one that is doing the heavy lifting. */
  wide?: boolean;
  /** One of these is not a joke, and is laid out as such. */
  grave?: boolean;
  /** Grave only — broken into lines so the clause reads as a stanza, not a paragraph. */
  lines?: string[];
}

export const TERMS: Term[] = [
  {
    id: 'room',
    line: 'You get your own room and your own key.',
    sub: 'I will not come in unless you allow me to.',
    icon: 'key',
  },
  {
    id: 'vape',
    line: 'I will quit the vape for you.',
    sub: 'Ask me afterwards how hard that was.',
    icon: 'vape',
  },
  {
    id: 'arm',
    line: 'I give excellent massages.',
    sub: 'I will take care of your arm.',
    icon: 'hands',
  },
  {
    id: 'sound',
    line: 'We will listen to good music. You are the DJ.',
    sub: 'I have good speakers at home and in the car.',
    icon: 'sound',
  },
  {
    id: 'carry',
    line: 'I will carry you. In my arms and on my shoulders.',
    sub: 'I am tall. You have never had this view.',
    icon: 'tall',
  },
  {
    id: 'money',
    line: 'I plan it, I book it, I pay for it.',
    sub: 'You can turn off your brain and let me make you happy.',
    icon: 'wallet',
  },
  {
    id: 'albanian',
    line: 'You will teach me Albanian.',
    sub: 'I really liked it when you spoke Albanian to me.',
    icon: 'language',
  },
  {
    id: 'candles',
    line: 'I will buy the candles.',
    sub: 'And teach you to be romantic. You will resist but it will not work.',
    icon: 'candle',
  },
  {
    id: 'warm',
    line: 'I have hair on my chest.',
    sub: 'So whenever you want to be held, you will be very warm.',
    icon: 'warm',
  },
  {
    id: 'heart',
    line: 'I will make your heart beat like it never has before.',
    sub: 'You may call that arrogant. I will accept the accusation.',
    icon: 'heart',
    wide: true,
  },
  {
    id: 'more',
    line: 'And this is not the whole list.',
    sub: 'The rest do not survive being written down. You will have to come and see them.',
    icon: 'more',
    wide: true,
  },
  {
    id: 'safe',
    line: 'No pressure. No expectations.',
    lines: [
      'If you want to go home, say so — I book the flight and ask no questions.',
      'I will never make you uncomfortable and I will never cross a line.',
      'But I will still lead.',
      'That one is not a joke.',
    ],
    icon: 'shield',
    grave: true,
  },
];

/**
 * Backdrop for the arrival section — these cross-fade behind the headline,
 * each one slowly pushing in. Landscape, and dark enough to carry white text.
 * Missing files simply never appear; the gradient underneath holds the section.
 */
/* Backdrops run full-bleed at 100vw, so only wide, high-resolution files
   belong here. These live directly in /public, not /public/images. */

/** Behind the opening. */
export const HERO_BACKDROP: string[] = ['/1.1.jpg', '/1.2.webp', '/1.3.jpg'];

/** Behind "You. Coming to me." */
export const BACKDROP: string[] = ['/2.1.jpg', '/2.2.jpg'];
