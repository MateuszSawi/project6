/**
 * Game four — Upgrade your trip.
 *
 * The opposite of the guide, which asked her to decide things. This one asks
 * her to take things: five categories, four tiles each, and no limit anywhere.
 * Nothing here costs her a choice — picking one does not cost her another — so
 * the only wrong answer is the one she was too polite to tap.
 *
 * One category at a time, because a list of twenty is a form and five screens
 * of four is a shop. There is no way past a category without taking something
 * from it — refusing all five would be the one outcome this whole game exists
 * to prevent, so the way on simply is not there until she has taken one.
 *
 * ---- What lands in the database ----------------------------------------
 *
 * One row per category — `upgrade-trip` / category id — and its value is her
 * option ids joined with commas: `flower,plushie`.
 *
 * A row can also read `-`, which means she untook everything in a category she
 * had already been through. It is a state she can be in but cannot leave the
 * screen in, so it never survives as an answer — the game reads it as nothing
 * taken and puts her back there.
 *
 * Never change an id she has already tapped. The label above it is free.
 */

export interface Perk {
  id: string;
  label: string;
  /**
   * Under /public/games/upgrade, named `<category>-<perk>.webp`. A missing file
   * shows the burgundy plate instead and nothing else changes — see Frame — so
   * the photographs can be swapped in one at a time, whenever they exist.
   *
   * What ships is a 1000×333 strip cut from the middle of the original, which
   * lives in assets/games/upgrade and is never published. The tile is wider
   * still — around 4.3:1 on a phone, 5.5:1 on a laptop — so `object-fit` takes
   * another band out of the middle of that. The whole width always survives;
   * only the height is ever cut. Anything that has to be seen belongs on the
   * horizontal centre line of the file.
   */
  src: string;
}

export interface Category {
  id: string;
  title: string;
  /** A lucide-react export name, resolved in Upgrade.tsx. */
  icon: string;
  /** Always four. The grid is built for four and the screen is sized for it. */
  perks: Perk[];
}

function tiles(category: string, perks: Array<[string, string]>): Perk[] {
  return perks.map(([id, label]) => ({
    id,
    label,
    src: `/games/upgrade/${category}-${id}.webp`,
  }));
}

export const CATEGORIES: Category[] = [
  {
    id: 'gift',
    title: 'Welcome gift',
    icon: 'Gift',
    perks: tiles('gift', [
      ['flower', 'Flower'],
      ['warm', 'Something warm to wear'],
      ['plushie', 'A plushie'],
      ['surprise', 'You better fucking surprise me with something I like. I’m not telling you'],
    ]),
  },
  {
    id: 'snacks',
    title: 'Snacks waiting for you at home',
    icon: 'ShoppingBasket',
    perks: tiles('snacks', [
      ['sweets', 'Polish sweets'],
      ['fruit', 'Fruit'],
      ['junk', 'Chips and junk'],
      ['everything', 'Everything, I’m too sexy for a diet'],
    ]),
  },
  {
    id: 'privileges',
    title: 'Princess privileges',
    icon: 'Crown',
    perks: tiles('privileges', [
      ['breakfast', 'Breakfast in bed'],
      ['sleep', 'Immunity from being woken up'],
      ['music', 'Full control of the music'],
      ['doors', 'Doors always opened for you'],
    ]),
  },
  {
    id: 'complain',
    title: 'Things you’re allowed to complain about',
    icon: 'MessageSquareWarning',
    perks: tiles('complain', [
      ['weather', 'The weather'],
      ['food', 'Polish food'],
      ['compliments', 'Me not giving you enough compliments'],
      ['everything', 'Everything, all week'],
    ]),
  },
  {
    id: 'important',
    title: 'The most important stuff',
    icon: 'Heart',
    perks: tiles('important', [
      ['hugs', 'Unlimited hugs & kisses, whenever you want. I can’t say no'],
      ['laugh', 'Mateusz laughs at all of Iza’s joke, funny or not'],
      ['candles', 'Candles every evening, as many as you want'],
      ['carried', 'Being carried in my arms or on my shoulders, on request'],
    ]),
  },
];

/**
 * What a category with everything untaken is stored as. An empty string would
 * be read back as an absent row — see loadStored — and this has to survive the
 * round trip, or untaking her last tile would look like a write that failed.
 */
export const NONE = '-';

/**
 * Her answers in the shape the database keeps them: category id -> the joined
 * ids, or `-`. Kept in this shape all the way through the game rather than
 * converted at the edges, so what is on screen and what is in the table can
 * never drift apart.
 */
export type Picks = Record<string, string>;

/** The ids she has taken in one category. */
export function pickedIn(picks: Picks, category: string): string[] {
  const row = picks[category];
  return !row || row === NONE ? [] : row.split(',');
}

/** Flips one tile and gives back the row to store for that category. */
export function toggle(picks: Picks, category: string, perk: string): string {
  const now = pickedIn(picks, category);
  const next = now.includes(perk) ? now.filter((id) => id !== perk) : [...now, perk];
  return next.length ? next.join(',') : NONE;
}

/** How many she has taken across all five. The number the last screen counts. */
export function totalPicked(picks: Picks): number {
  return CATEGORIES.reduce((sum, category) => sum + pickedIn(picks, category.id).length, 0);
}

/** The perks she took in one category, in the order they are shown. */
export function perksOf(picks: Picks, category: Category): Perk[] {
  const taken = pickedIn(picks, category.id);
  return category.perks.filter((perk) => taken.includes(perk.id));
}

/** Categories she has taken at least one thing in. What the bar fills against. */
export function filledCount(picks: Picks): number {
  return CATEGORIES.filter((category) => pickedIn(picks, category.id).length > 0).length;
}

/** Every category has something in it, so there is nothing left to go back to. */
export function complete(picks: Picks): boolean {
  return filledCount(picks) === CATEGORIES.length;
}

/**
 * Where the game opens: the first category with nothing taken in it, or the
 * package if there is no such category. Measured against what she took rather
 * than against which rows exist — a category she emptied out again is a
 * category she has not finished, whatever the table says.
 */
export function resumeAt(picks: Picks): number {
  const at = CATEGORIES.findIndex((category) => pickedIn(picks, category.id).length === 0);
  return at === -1 ? CATEGORIES.length : at;
}
