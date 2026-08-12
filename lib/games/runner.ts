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
  { km: 500, line: 'Faster.' },
  { km: 1000, line: 'Halfway.' },
  { km: 1500, line: 'Almost.' },
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
  line: 'You made it. You have no idea how much I have missed you.',
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
    cheapest way to buy back the look-ahead that zooming in cost — and the road
    needs more of it now that a formation can be three pieces long. The drawn
    frame is 80 wide and centred on her, so its left edge has been off the
    canvas for a while; what keeps her on screen is that her body starts 27
    units into that frame. At 20 it begins at x=7 and there are seven units of
    room left, so this is very nearly as far as it goes. */
export const RUNNER_X = 20;

/**
 * How fast she is going, by how far she has come. Straight lines between the
 * points below, held flat past the last one.
 *
 * A single rate was the simpler thing and the wrong shape: at a constant gain
 * the ceiling arrived around 1200km and the last two fifths of the road to
 * Gdańsk were run flat out, which is exactly where the formations that ask the
 * most of her open up. Tapering it buys that stretch back — the climb is 31
 * units per 250km out of Tirana and ten by the end — so `duck`, `chasm` and
 * `climb` are all met at a speed she can still read, and the top of the road
 * arrives with the city rather than sitting over half the journey.
 *
 * The last point is the ceiling, and it is why the endless road can be run
 * forever: past Gdańsk nothing gets faster, only denser. It has come down four
 * times now — 360, 350, 330, 310 — and each time for the same reason, which is
 * the only one that matters here: the road was arriving faster than it could be
 * read. At 300, with her standing at RUNNER_X, an obstacle is on screen for
 * about eight tenths of a second before it reaches her, against a person's
 * roughly two tenths of reaction. It also came down from 375 when the world was
 * zoomed in — a smaller world is a shorter view of the road — so the two have
 * to be read together: raise it and the zoom has to come back out.
 */
export const SPEED_RAMP: { km: number; speed: number }[] = [
  { km: 0, speed: 165 },
  { km: 250, speed: 196 },
  { km: 500, speed: 217 },
  { km: 750, speed: 238 },
  /* From here on the road is opening up faster than it is speeding up: `duck`,
     `chasm`, `climb` and the rest all unlock past 1000, and what they need is
     reading time rather than a slower thumb. The climb is down to ten units per
     250km by the end, a third of what it leaves Tirana at. */
  { km: 1000, speed: 250 },
  { km: 1250, speed: 270 },
  { km: 1500, speed: 280 },
  { km: 1750, speed: 290 },
  { km: 2000, speed: 300 },
];

/** Not a crawl. The opening used to sit at 130 for long enough to be dull. */
export const BASE_SPEED = SPEED_RAMP[0].speed;
/** The ceiling. Derived, so it cannot drift from the ramp that reaches it. */
export const MAX_SPEED = SPEED_RAMP[SPEED_RAMP.length - 1].speed;

/** Units per second at `km`, read off SPEED_RAMP. */
export function speedAt(km: number): number {
  for (let i = 1; i < SPEED_RAMP.length; i += 1) {
    const b = SPEED_RAMP[i];
    if (km < b.km) {
      const a = SPEED_RAMP[i - 1];
      return a.speed + ((b.speed - a.speed) * (km - a.km)) / (b.km - a.km);
    }
  }
  return MAX_SPEED;
}

export const GRAVITY = 1500;

/* ---------- The jump -----------------------------------------------------
   The jump is analogue: held to the top it peaks at JUMP_V² / 2·GRAVITY,
   let go of at once it peaks at JUMP_MIN_V² / 2·GRAVITY. That is the whole
   difference between this and the version before it, where one press bought
   one arc and every obstacle on the road was cleared by the same one.

     held      450 -> 67.5 units up, 0.60s in the air
     released  250 -> 20.8 units up, 0.33s in the air

   Read those against the block heights below: anything under 20 is a tap,
   anything over 30 wants most of the hold, and the beams overhead are only
   survivable at the short end. The two numbers are the difficulty curve.
   ------------------------------------------------------------------------ */

/** Straight up, and stays there as long as the button is down. */
export const JUMP_V = 450;
/**
 * What the rise is cut back to the moment the button comes up.
 *
 * A floor rather than a multiplier: a proportional cut makes the shortest
 * possible tap a twitch that barely leaves the road, and every runner that
 * does it that way is fighting its own input latency. This way the smallest
 * jump is still a jump — it just clears less.
 */
export const JUMP_MIN_V = 250;

/** Kilometres per world unit. Sets how long the road takes: Gdańsk lands at
    about 56 seconds. Where the MILESTONES fall inside that follows from their
    own km values, so this is the only knob for the length of the trip. */
export const KM_PER_UNIT = 0.125;

/** Her collision box. Narrower than SPRITE.content.w, so the skirt and the
    trailing hair overhang it and a near miss reads as a miss. */
export const HITBOX_W = 20;
/** How tall she counts as when something is passing over her head. Under her
    real 48, for the same reason HITBOX_W is under her real width. */
export const HEAD_H = 44;

/**
 * The range the formations below are allowed to use.
 *
 * Blocks are ledges, not spikes: landing on top of one is a good outcome and
 * only meeting one side-on ends the run. What has changed is that clearing one
 * is no longer free — at 36 a block needs three quarters of the hold, and the
 * short end of the range is what a tap buys. Nothing may go above the max: she
 * jumps from the top of ledges too, and the world only has so much headroom.
 */
export const OBSTACLE_MIN_H = 14;
export const OBSTACLE_MAX_H = 36;

/** How far below the road counts as gone. The far wall of a hole is what
    actually ends most falls — see the wall test in the step — so this is only
    the backstop, and it is shallow so the screen changes while she is still
    visibly in the hole rather than somewhere under it. */
export const PIT_FALL = 10;

/** The floor over a hole. Any number she cannot fall onto. */
export const VOID_FLOOR = -999;

/* ==========================================================================
   Formations
   --------------------------------------------------------------------------
   The road is built out of these rather than out of single random blocks. A
   block with random dimensions is noise: within one narrow range every one of
   them asks the same question. A formation asks a different question each time
   — how much jump, or none at all, or whether to go over the pair or land
   between them.

   Offsets and the widths of pits and beams are in SECONDS OF TRAVEL, scaled by
   whatever speed she is doing when the formation spawns. That is the only way
   the timing means anything: a hole 60 units wide is a stroll at 165 and a
   commitment at 360. Block widths stay in world units, because a block's width
   is furniture — the arc clears it either way.
   ========================================================================== */

export type Piece =
  /** A ledge standing on the road. `w` in world units. */
  | { kind: 'block'; at: number; h: number; w: number; face?: number }
  /**
   * A beam over the road — a gantry, a low bridge. `clear` is the height of
   * its underside above the road, so she passes below it and dies if her head
   * is in it. This is the piece that makes a big jump a mistake.
   */
  | { kind: 'hang'; at: number; clear: number; secs: number }
  /** A hole in the road. The one thing that punishes jumping too early. */
  | { kind: 'pit'; at: number; secs: number };

export interface Formation {
  id: string;
  /** Kilometre from which this may appear, so the road opens up as she goes. */
  from: number;
  /** In ascending `at` order — the spawner relies on it to keep its arrays sorted. */
  pieces: Piece[];
}

/**
 * Every shape the road can take, in the order she meets them. Read the comment
 * on each as the question it asks; if two of them ask the same question, one of
 * them should not be here.
 *
 * The thresholds are spread across the whole 2000 km to Gdańsk — roughly one
 * new shape every 200 km — rather than being spent in the first quarter of it.
 * The last two arrive at the city and beyond it, so the endless road is still
 * showing her something she has not seen.
 */
export const FORMATIONS: Formation[] = [
  /* ---- Out of Tirana. Nothing here needs more than a tap. ---- */

  /** A kerb. The tap. */
  { id: 'hop', from: 0, pieces: [{ kind: 'block', at: 0, h: 16, w: 18 }] },
  /** Waist high — the first one that wants more than the tap. */
  { id: 'kerb', from: 0, pieces: [{ kind: 'block', at: 0, h: 24, w: 28, face: 1 }] },
  /* ---- The road starts biting. ---- */

  /** A hole. Jumping too early now costs something, which it never did before. */
  { id: 'gap', from: 150, pieces: [{ kind: 'pit', at: 0, secs: 0.30 }] },
  /**
   * Kerb, then a hole too far past it to be taken in the same arc and too soon
   * after it to stroll to. Land off the first and go straight back up: the
   * first thing on the road that is two jumps rather than one.
   */
  {
    id: 'stagger',
    from: 250,
    pieces: [
      { kind: 'block', at: 0, h: 18, w: 20 },
      { kind: 'pit', at: 0.40, secs: 0.26 },
    ],
  },
  /** Nearly the full hold. */
  { id: 'wall', from: 320, pieces: [{ kind: 'block', at: 0, h: 34, w: 22 }] },
  /**
   * A platform worth the name. On its own a ledge was nothing — hop up, run
   * along, hop down, no decision anywhere in it — so this one ends at a cliff.
   * Getting onto it is a real hold at 26 high, and the far edge is the takeoff
   * for the hole rather than a step back down to the road.
   */
  {
    id: 'drop',
    from: 380,
    pieces: [
      { kind: 'block', at: 0, h: 26, w: 40, face: 2 },
      { kind: 'pit', at: 0.34, secs: 0.26 },
    ],
  },
  /**
   * Two of them, close enough to read as one thing to get over — which is what
   * they are. There is no landing between them, and the top of the first is a
   * trap rather than a rest: step off it and the side of the second arrives
   * before her feet reach the road. Held close together on purpose, so that
   * one arc over the pair is the obvious answer rather than a discovery.
   */
  {
    id: 'pair',
    from: 480,
    pieces: [
      { kind: 'block', at: 0, h: 22, w: 20 },
      { kind: 'block', at: 0.22, h: 22, w: 20 },
    ],
  },

  /* ---- Beams, and with them the first reason ever to jump small. ---- */

  /** Nothing to do but keep her feet down. A rest that looks like a threat. */
  { id: 'beam', from: 650, pieces: [{ kind: 'hang', at: 0, clear: 58, secs: 0.40 }] },
  /** Clear the hole and land on the shelf on the far side of it. */
  {
    id: 'shelf',
    from: 800,
    pieces: [
      { kind: 'pit', at: 0, secs: 0.26 },
      { kind: 'block', at: 0.32, h: 24, w: 30, face: 1 },
    ],
  },
  /**
   * A stepping stone standing in the middle of a hole — the one place a
   * platform is not optional. Over the lot in one arc if she has the nerve,
   * or down onto the stone and up again. Kept low so the second option is a
   * tap rather than a second full commitment.
   */
  {
    id: 'island',
    from: 900,
    pieces: [
      { kind: 'pit', at: 0, secs: 0.40 },
      { kind: 'block', at: 0.16, h: 14, w: 24 },
    ],
  },
  /** Up onto the low one, up onto the high one, off the end. */
  {
    id: 'steps',
    from: 1000,
    pieces: [
      { kind: 'block', at: 0, h: 18, w: 26 },
      { kind: 'block', at: 0.24, h: 32, w: 26, face: 1 },
    ],
  },
  /**
   * Two holes with one stride of road between them. Too far apart for one arc
   * — the full jump is 0.6s and this is 0.70 — so the landing has to turn
   * straight back into a takeoff, on a strip she has about a fifth of a second
   * of. The tightest rhythm on the road.
   */
  {
    id: 'twin',
    from: 1150,
    pieces: [
      { kind: 'pit', at: 0, secs: 0.24 },
      { kind: 'pit', at: 0.46, secs: 0.24 },
    ],
  },

  /* ---- The half of the road that asks her to choose. ---- */

  /**
   * The signature of the whole thing: hop the kerb, but hop it SHORT, because
   * the beam lands 0.26s later and the full arc is still 0.30s from the ground
   * at that point. Held all the way, this one is fatal however well timed.
   *
   * The clearance was 56 and that was the wrong number. She is 44 to the top of
   * her head and the smallest jump in the game peaks at 20.8, so 56 left her
   * over the beam for most of any arc at all — one press length survived and
   * every other one died, which does not read as a decision, it reads as a
   * broken obstacle. At 68 the short hop has real room and the full jump is
   * still fatal, which was always the point.
   */
  {
    id: 'duck',
    from: 1200,
    pieces: [
      { kind: 'block', at: 0, h: 16, w: 18 },
      { kind: 'hang', at: 0.26, clear: 68, secs: 0.22 },
    ],
  },
  /** A hole worth respecting: the short hop does not cross this one. */
  { id: 'chasm', from: 1450, pieces: [{ kind: 'pit', at: 0, secs: 0.40 }] },
  /**
   * Three beats in one breath: hop the kerb short, run the length of the beam
   * with her feet down, then a real jump once she is out from under it.
   *
   * The last block is held a long way past the beam — 1.05s rather than the
   * 0.72 it started at. Nearer, the run-up for it begins while she is still
   * underneath, so the small hop the beam demands and the big one the block
   * demands are the same press, and only one length of it lives. Every step
   * out bought room until about here, and nothing after.
   */
  {
    id: 'tunnel',
    from: 1600,
    pieces: [
      { kind: 'block', at: 0, h: 16, w: 18 },
      { kind: 'hang', at: 0.26, clear: 68, secs: 0.24 },
      { kind: 'block', at: 1.05, h: 26, w: 22, face: 1 },
    ],
  },
  /** A staircase. Three hops up, then the drop off the top. */
  {
    id: 'climb',
    from: 1700,
    pieces: [
      { kind: 'block', at: 0, h: 20, w: 18 },
      { kind: 'block', at: 0.30, h: 28, w: 18 },
      { kind: 'block', at: 0.60, h: 36, w: 18 },
    ],
  },

  /* ---- Gdańsk, and the road past it. ---- */

  /**
   * The one that asks for the two halves of the jump at once: a hole to get
   * over with a beam across the top of it. The hole is narrow deliberately —
   * airtime and height are the same number, so a hole that needed a real jump
   * would leave one exact hold that works and nothing either side of it. As it
   * stands the tap crosses it comfortably and the hold is fatal, which is a
   * decision rather than a lock. The beam starts before the hole so the two
   * read as one obstacle.
   */
  {
    id: 'bridge',
    from: 2000,
    pieces: [
      { kind: 'hang', at: -0.06, clear: 78, secs: 0.34 },
      { kind: 'pit', at: 0, secs: 0.18 },
    ],
  },
  /** Over the hole, then straight back down for the gate. Endless road only. */
  {
    id: 'gate',
    from: 2400,
    pieces: [
      { kind: 'pit', at: 0, secs: 0.26 },
      { kind: 'hang', at: 0.46, clear: 62, secs: 0.24 },
    ],
  },
];

/**
 * Picks the next shape of road.
 *
 * Weighted toward whatever has only just become possible, so crossing a
 * threshold is something she notices rather than a slow change in the odds.
 * Never the same one twice running: a repeat is the one thing guaranteed to
 * read as a metronome again.
 */
export function pickFormation(km: number, last: string | null): Formation {
  const open = FORMATIONS.filter((f) => km >= f.from);
  const fresh = open.filter((f) => km - f.from < 700);
  const pool = fresh.length > 1 && Math.random() < 0.55 ? fresh : open;

  const draw = () => pool[Math.floor(Math.random() * pool.length)];
  const first = draw();
  /* One retry, not a loop — with a pool of one there is nothing else to pick
     and a loop would spin forever. */
  return first.id === last && pool.length > 1 ? draw() : first;
}

/**
 * Clear road after a formation, in seconds of travel.
 *
 * The old spawner never gave less than a full second, and the jump is 0.6s —
 * so there was always a stretch of ground to reset the rhythm on, every single
 * time. This starts under a second and closes to about half of one, which is
 * inside the length of a jump: by the far end a landing regularly has to go
 * straight back into a takeoff. The random half is as much the point as the
 * shrinking half.
 *
 * It does not go below about 0.45s. That is roughly the warning she gets at
 * full speed once RUNNER_X and the width of the view are paid for, and a gap
 * shorter than the look-ahead is not difficulty, it is a coin toss.
 */
export function restGap(km: number): number {
  const t = Math.min(1, km / 1400);
  return 0.82 - 0.34 * t + Math.random() * 0.34;
}

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
  /* Inside a hole. Darker than anything else on the screen, because it is the
     one place on the road that is not road. */
  pit: '#0b080a',
  accent: '#d6516a',
} as const;
