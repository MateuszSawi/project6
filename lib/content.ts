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
   * own colour are left on `soft`. `none` shows the file untouched. Defaults
   * to `soft`.
   */
  grade?: 'soft' | 'strong' | 'none';
  /** object-position, when the subject is not in the middle of the file. */
  focus?: string;
  /**
   * Overrides the tile shape for this one photograph, as a CSS `aspect-ratio`
   * value. The wall otherwise rotates three portrait crops so no two
   * neighbours match; set this only when a file's own proportions matter more
   * than the rhythm — a tall subject cropped to a shorter frame loses its
   * point. Match the file exactly and nothing is cropped at all.
   */
  ratio?: string;
}

export const PLACES: Place[] = [
  {
    id: 'oldtown',
    title: 'Gdańsk',
    place: 'Old Town & Ferris wheel',
    src: '/images/old-town.jpg',
    grade: 'none', // shown exactly as the file is
    ratio: '3 / 4', // the file's own shape — tall houses, nothing clipped
  },
  {
    id: 'oliwa',
    title: 'Park Oliwski',
    place: 'There is a Japanese garden art',
    src: '/images/park-oliwski.jpg',
    grade: 'none',
  },
  {
    id: 'art',
    title: 'Art gallery',
    place: '“Art is a flash of love”',
    src: '/images/art.jpg', // already saturated
    grade: 'none',
  },
  {
    id: 'gdynia',
    title: 'Gdynia',
    place: 'We’ll go here at sunset',
    src: '/images/gdynia.jpg', // blue hour, warm lamps — rich already
    grade: 'none',
  },
  {
    id: 'sopot',
    title: 'Sopot',
    place: 'Polish Saranda',
    src: '/images/sopot.jpg',
    grade: 'none',
    focus: '50% 78%', // the top half of the file is empty sky
  },
  {
    id: 'spit',
    title: 'Rewa',
    place: 'Two Seas',
    src: '/images/rewa.jpg',
  },
  {
    id: 'alpacas',
    title: 'Alpacas',
    place: 'Yes, you will feed the alpacas',
    src: '/images/alpaki.jpg',
    grade: 'none', // overcast and flat
    focus: '50% 40%', // keep the face, drop some of the ground
  },
  {
    id: 'castle',
    title: 'Abandoned Castle',
    place: 'Every princess needs a castle',
    src: '/images/lapalice.jpg',
    grade: 'none', // desaturated on purpose, but needs bite
  },
  {
    id: 'seals',
    title: 'Historic Polish village',
    place: 'Even older than you',
    src: '/images/wioska-fok.webp',
    grade: 'none',
  },
  {
    id: 'rumia',
    title: 'Rumia',
    place: 'My city',
    src: '/images/rumia-park.jpg', // vivid green already
    grade: 'none',
  },
  {
    id: 'sky',
    title: 'The Sky',
    place: 'Away from people and all problems',
    src: '/images/niebo-gwiazdy.jpg', // dark, keep it that way
  },
  {
    id: 'secret',
    title: 'The Secret',
    place: 'Not telling.',
    /* Sits inside the tile rather than under it — the plate is its background. */
    line: 'I have not shown you the best ones here. You will see when you come.',
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
  | 'care'
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
    id: 'care',
    line: 'You will be safe with me.',
    sub: 'Out of the two of us, I am only worried about my own safety around you.',
    icon: 'care',
  },
  {
    id: 'vape',
    line: 'I will consider quitting the vape for you.',
    sub: 'One time offer.',
    icon: 'vape',
  },
  {
    id: 'arm',
    line: 'I give excellent massages.',
    sub: 'I will take care of your arm.',
    icon: 'hands',
  },
  {
    id: 'carry',
    line: 'I will carry you. In my arms and on my shoulders.',
    sub: 'I am strong and tall. You have never had this view.',
    icon: 'tall',
  },
  {
    id: 'sound',
    line: 'We will listen to good music. You are the DJ.',
    sub: 'I have good speakers at home and in the car.',
    icon: 'sound',
  },
  {
    id: 'money',
    line: 'I take care of everything.',
    sub: 'Just relax and let me make you happy.',
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
    sub: 'I will be careful with it though. I do not want to break it.',
    icon: 'heart',
    wide: true,
  },
  {
    id: 'more',
    line: 'And this is not the whole list.',
    sub: 'You will have to come and see the rest.',
    icon: 'more',
    wide: true,
  },
  {
    id: 'safe',
    line: 'No pressure. No expectations. No rush with anything.',
    lines: [
      'If you want to go home earlier, say so — I book the earliest flight and ask no questions.',
      'I will never make you uncomfortable and I will never cross a line.',
      'Your safety and comfort are my priorities.',
      // 'I will still lead.',
      'That part is not a joke.',
    ],
    icon: 'shield',
    grave: true,
  },
];

/* ============================================================
   THE WAITING MONTH — games, quizzes, tests
   ============================================================ */

export interface Game {
  id: string;
  /**
   * Route under /games. Absent while the game is still sealed — a tile with
   * no href renders as a locked plate instead of a link, so a game can be
   * announced here long before it exists.
   */
  href?: string;
  /** The whole tile — there is nothing above or below it any more. */
  title: string;
  /** Photograph behind the tile. Only the ones that are open get one. */
  src?: string;
  /**
   * A still figure standing in the tile instead of a photograph — for the
   * games that are drawn rather than shot. Pixel art, shown at its own edges
   * and never stretched, so the file should be cropped to the character.
   * Ignored when `src` is set; a tile gets one kind of picture or the other.
   */
  sprite?: string;
  /** See Place.grade. */
  grade?: 'soft' | 'strong' | 'none';
  /** object-position, when the subject is not in the middle of the file. */
  focus?: string;
}

/**
 * The list at the foot of the page. Order is the order she sees.
 *
 * A sealed tile is named only once its shape is settled — a title is a promise
 * with edges, and the edges are the part most likely to move. The ones still
 * numbered are the ones that could turn out to be anything.
 *
 * To open a sealed one: add `href` (and a `src`, if it deserves a photograph)
 * and build the matching route under app/games. Nothing else changes.
 */
export const GAMES: Game[] = [
  {
    id: 'runner',
    href: '/games/runner/',
    title: 'Iza on her way to Poland',
    /* Her, out of the game itself, standing still: one frame lifted from the
       sprite atlas by scripts/build-runner-sprites.py. */
    sprite: '/games/runner/iza-still.png',
  },
  {
    id: 'guide',
    title: 'A guide to keeping Iza happy',
  },
  {
    id: 'likely',
    /* Built and deployed, but not linked yet — put this line back when it
       opens and the tile turns into a door. */
    // href: '/games/who-is-more-likely/',
    title: 'Who is more likely to?',
    src: '/games/who-is-more-likely.webp',
    grade: 'none',
  },
  {
    id: 'truth',
    title: 'Surprise two',
  },
  {
    id: 'know',
    title: 'Surprise three',
  },
];

/**
 * Backdrop for the arrival section — these cross-fade behind the headline,
 * each one slowly pushing in. Landscape, and dark enough to carry white text.
 * Missing files simply never appear; the gradient underneath holds the section.
 */
/* Backdrops run full-bleed at 100vw, so only wide, high-resolution files
   belong here. They live in /public/hero-desktop and /public/arrival-desktop.

   The first entry in each set is the one that shows on load and is fetched
   eagerly, so it is the lightest file of the set — the rest stream in behind
   the fade. */

/** Behind the opening. */
export const HERO_BACKDROP: string[] = [
  '/hero-desktop/1.3.jpg',
  '/hero-desktop/481041814_1174186204067568_5210615880035920574_n.jpg',
  '/hero-desktop/pexels-gsn-travel-37635271.jpg',
  '/hero-desktop/1733209364.Gdynia-noca.jpg',
];

/** Behind "You. Coming to me." */
export const BACKDROP: string[] = [
  '/arrival-desktop/2.1.jpg',
  '/arrival-desktop/pexels-gsn-travel-37635263.jpg',
  '/arrival-desktop/pexels-kublizz-550505632-17505476.jpg',
];
