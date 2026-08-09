/**
 * "Iza on her way to Poland" — the numbers and the one bit of persistence.
 *
 * Everything here is either tuning the game does not want to hardcode inside a
 * draw loop, or the record, which lives in Supabase and nowhere else.
 *
 * On the record: this site is a static export (see next.config.mjs), so there
 * is no /api route to POST to — the same Supabase REST call lib/results.ts
 * makes is the API. Writes go through a `security definer` function that only
 * ever moves the number upward, so a losing run cannot erase a winning one.
 * See runner-setup.sql.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False on a build with no keys — the game plays, it just cannot remember. */
export const connected = Boolean(URL && KEY);

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: KEY as string,
    Authorization: `Bearer ${KEY}`,
  };
}

/**
 * The record, read before the first run so the opening screen can show it.
 * Returns 0 rather than throwing: a game that will not start because a number
 * failed to arrive is worse than a game that starts without the number.
 */
export async function loadBest(): Promise<number> {
  if (!connected) return 0;

  try {
    const response = await fetch(
      `${URL}/rest/v1/runner_best?game=eq.runner&select=best_km`,
      { headers: headers(), cache: 'no-store' },
    );
    if (!response.ok) return 0;

    const rows = (await response.json()) as Array<{ best_km: number }>;
    return rows[0]?.best_km ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Sends the run that just ended and returns the record as the database now
 * holds it — which is not always what was sent, since the function keeps the
 * larger of the two. Throws so the end screen can say the send did not land.
 */
export async function saveBest(km: number): Promise<number> {
  if (!connected) throw new Error('Nowhere to send it yet.');

  const response = await fetch(`${URL}/rest/v1/rpc/save_runner_best`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ p_km: Math.max(0, Math.round(km)) }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail.slice(0, 200) || `Supabase said ${response.status}.`);
  }

  return (await response.json()) as number;
}

/* ==========================================================================
   The road
   ========================================================================== */

export interface Milestone {
  /** Distance in km at which the line appears. */
  km: number;
  /** One sentence, shown for a moment and then gone. */
  line: string;
}

/** The far end of the road: Gdańsk, and the scale everything else is read on. */
export const JOURNEY_KM = 2000;

/**
 * The markers on the bar, one at each end. Tirana at zero is where she starts,
 * so it is a label rather than something to reach; Gdańsk is the arrival and
 * sits on the last pixel of the bar.
 */
export const CITIES: { km: number; name: string }[] = [
  { km: 0, name: 'Tirana' },
  { km: JOURNEY_KM, name: 'Gdańsk' },
];

/**
 * The three moments something is said on the way to Gdańsk. All of them land
 * before the arrival, deliberately: the last one used to sit on JOURNEY_KM and
 * would now flash underneath the arrival screen in the same frame.
 */
export const MILESTONES: Milestone[] = [
  { km: 500, line: 'Keep running.' },
  { km: 1000, line: 'Halfway. Faster.' },
  { km: 1500, line: 'Almost here.' },
];

/** How long a milestone sentence stays on screen, in ms. */
export const MILESTONE_MS = 3400;

/**
 * What she is told on reaching Gdańsk, in two beats — the arrival, and then
 * the invitation to carry on into the endless road. The second one fades in a
 * moment after the first so they read in order rather than all at once.
 */
export const ARRIVAL = {
  city: 'Gdańsk',
  line: 'You made it. Now I finally get to do what I have been thinking about for months.',
  next: 'You can keep playing in endless mode.',
  cta: 'Keep going',
} as const;

/** When the second beat fades in, in ms after the arrival screen appears. */
export const ARRIVAL_BEAT_MS = 1200;
/**
 * How long before the button out of the arrival screen can be pressed.
 *
 * Covers the second beat rather than just an in-flight tap: pressed sooner, the
 * screen would go before the line it exists to show had appeared at all.
 */
export const ARRIVAL_DEAF_MS = ARRIVAL_BEAT_MS + 500;

/**
 * Where the dot sits on the bar, 0..1.
 *
 * Straight proportion, with Gdańsk on the end of the bar. The run itself does
 * not stop there — she can keep going and the counter keeps counting — but the
 * dot has nowhere further to sit, so it stays on the city.
 */
export function barPosition(km: number): number {
  return Math.min(1, km / JOURNEY_KM);
}

/* ==========================================================================
   Tuning
   --------------------------------------------------------------------------
   The world is measured in units, not pixels, and one unit is a whole number
   of device pixels — see the resize handler in Runner.tsx. That is what keeps
   the sprite sharp: at a fractional scale, nearest-neighbour sampling makes
   some source pixels wider than others and the art shimmers as it moves.
   Speeds are units per second, so nothing depends on frame rate or on how
   large the canvas happens to be.
   ========================================================================== */

/**
 * Height of the visible world, exactly, on every device — the scale follows
 * from it rather than the other way round.
 *
 * 172 rather than the old 180 is the zoom: a smaller world at the same canvas
 * size means everything in it is drawn larger. It does not go much below this,
 * because a jump peaks 67.5 units up and she is 48 tall, so 115.5 of the 142
 * above the road are already spoken for.
 */
export const WORLD_H = 172;
/** The ground line, measured up from the bottom edge. */
export const GROUND_FROM_BOTTOM = 30;
/** Where she runs, measured from the left edge. Well over toward it: every
    unit she moves left is a unit more road visible ahead of her, which is the
    cheapest way to buy back the look-ahead that zooming in cost. */
export const RUNNER_X = 32;

/** Not a crawl. The opening used to sit at 130 for long enough to be dull. */
export const BASE_SPEED = 165;
/**
 * The ceiling, and the reason the endless road can be run forever.
 *
 * Speed climbs with distance and then stops here. At 360, with her standing at
 * RUNNER_X, an obstacle is on screen for 0.53s before it reaches her and the
 * jump has to start 0.10s out, leaving 0.44s to see it and press.
 *
 * It came down from 375 when the world was zoomed in: a smaller world is a
 * shorter view of the road, and at 375 that left only 0.39s. The pair of them
 * have to be read together — raise this and the zoom has to come back out.
 */
export const MAX_SPEED = 360;
/** Units per second gained per km travelled — flat out at about 1200 km, some
    forty seconds in. Gentler than it was, for the same reason as the ceiling. */
export const SPEED_GAIN = 0.16;

export const GRAVITY = 1500;
export const JUMP_V = 450;

/** Kilometres per world unit. Sets how long the road takes: Gdańsk lands at
    about 56 seconds. Where the MILESTONES fall inside that follows from their
    own km values, so this is the only knob for the length of the trip. */
export const KM_PER_UNIT = 0.125;

/** Her collision box. Narrower than SPRITE.content.w, so the skirt and the
    trailing hair overhang it and a near miss reads as a miss. */
export const HITBOX_W = 20;
export const OBSTACLE_MIN_H = 18;
export const OBSTACLE_MAX_H = 34;

/**
 * Obstacles are ledges, not spikes: getting on top of one is a good outcome,
 * and only meeting one side-on ends the run. So the jump never has to carry
 * her over the whole width of anything — it only has to lift her feet above
 * OBSTACLE_MAX_H, and the arc peaks at JUMP_V² / 2·GRAVITY, which is roughly
 * twice that. Width can therefore be free, and no obstacle can be unfair.
 */
export const OBSTACLE_MIN_W = 16;
export const OBSTACLE_MAX_W = 30;

/** Grace after running off a ledge in which a jump still counts, in seconds. */
export const COYOTE_S = 0.1;
/** A jump pressed this long before landing is remembered and fires on landing. */
export const JUMP_BUFFER_S = 0.14;

/**
 * The sprite atlas, as scripts/build-runner-sprites.py writes it. That script
 * prints these numbers when it runs; if it is ever pointed at different source
 * sheets, they are what to check.
 */
export const SPRITE = {
  src: '/games/runner/iza.png',
  frameW: 80,
  frameH: 64,
  /** The character's actual footprint inside the 80x64 cell. */
  content: { x: 27, y: 16, w: 26, h: 48 },
  rows: {
    idle: { row: 0, frames: 5 },
    run: { row: 1, frames: 8 },
    jump: { row: 2, frames: 4 },
  },
} as const;

/* ---------- Palette ------------------------------------------------------
   Mirrors styles/variables.scss. Canvas cannot read SCSS, so these are the
   one place the two are allowed to disagree — keep them in step by hand.
   ------------------------------------------------------------------------ */

export const PALETTE = {
  sky: '#171216',
  skyLow: '#1f181d',
  far: '#241820',
  near: '#33202b',
  ground: '#291f25',
  groundLine: '#7d1a2d',
  /* The body stays dark so she reads clearly when stood on top of one; the
     outline is what makes the block itself visible against the sky. */
  obstacle: '#4a1220',
  obstacleEdge: '#d4577a',
  obstacleFace: '#7d1a2d',
  accent: '#d6516a',
} as const;
