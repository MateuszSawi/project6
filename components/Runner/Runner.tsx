'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ARRIVAL,
  ARRIVAL_BEAT_MS,
  ARRIVAL_DEAF_MS,
  BASE_SPEED,
  CITIES,
  COYOTE_S,
  GRAVITY,
  GROUND_FROM_BOTTOM,
  HEAD_H,
  HITBOX_W,
  JUMP_BUFFER_S,
  JOURNEY_KM,
  JUMP_MIN_V,
  JUMP_V,
  KM_PER_UNIT,
  MILESTONES,
  MILESTONE_MS,
  PALETTE,
  PIT_FALL,
  RUNNER_X,
  SPRITE,
  VOID_FLOOR,
  WORLD_H,
  barPosition,
  connected,
  loadBest,
  pickFormation,
  restGap,
  saveBest,
  speedAt,
} from '@/lib/games/runner';

import styles from './Runner.module.scss';

/* 'arrived' is a pause, not an ending: the run is frozen mid-road while she is
   told she made it, and the same run then carries on with `endless` set. */
type Phase = 'loading' | 'ready' | 'playing' | 'arrived' | 'over';

/** A ledge on the road. Landing on top of one is fine; meeting it side-on is not. */
interface Block {
  x: number;
  w: number;
  h: number;
  /** Which of the three shapes to draw. */
  kind: number;
}

/** A beam over the road. Her head has to be below `clear` for the whole width. */
interface Hang {
  x: number;
  w: number;
  clear: number;
}

/** A hole in the road. Nothing to hit — there is simply no floor here. */
interface Pit {
  x: number;
  w: number;
}

interface Game {
  /** Distance travelled, in world units. */
  dist: number;
  km: number;
  speed: number;
  /** Height above the road. Zero on the road, o.h while stood on a ledge. */
  lift: number;
  vy: number;
  grounded: boolean;
  /** Height of the surface under her right now — the road, a ledge top, or
      VOID_FLOOR while there is nothing under her at all. */
  floor: number;
  /** Seconds of jump still allowed after stepping off a ledge. */
  coyote: number;
  /** Seconds a pressed jump stays remembered while she is still airborne. */
  buffered: number;
  /** Whether the button is down right now. The whole of the analogue jump. */
  held: boolean;
  blocks: Block[];
  hangs: Hang[];
  pits: Pit[];
  /** World units still to travel before the next formation appears. */
  untilSpawn: number;
  /** So the same shape of road never comes round twice running. */
  lastForm: string | null;
  animT: number;
  /** How many milestones have already been shown. */
  passed: number;
  /** True once Gdańsk is behind her and the road has no far end any more. */
  endless: boolean;
}

interface View {
  /** Device pixels per world unit. Not a whole number — see the resize note. */
  scale: number;
  w: number;
  h: number;
  groundY: number;
  /** Rounds a world coordinate onto the device pixel grid. */
  snap: (v: number) => number;
}

function freshGame(): Game {
  return {
    dist: 0,
    km: 0,
    speed: BASE_SPEED,
    lift: 0,
    vy: 0,
    grounded: true,
    floor: 0,
    coyote: 0,
    buffered: 0,
    held: false,
    blocks: [],
    hangs: [],
    pits: [],
    untilSpawn: 220,
    lastForm: null,
    animT: 0,
    passed: 0,
    endless: false,
  };
}

/** What the thumb pad says it will do if pressed right now. */
const PAD_LABEL: Record<Phase, string> = {
  loading: 'One moment',
  ready: 'Tap to go',
  playing: 'Jump',
  /* Not a call to action: pressing the pad here does nothing on purpose. */
  arrived: 'Arrived',
  over: 'Tap to go again',
};

/** Deterministic noise, so the scenery is the same shape every time past it. */
function noise(n: number): number {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/* Grouped by hand rather than by toLocaleString, which separates digits
   differently depending on the locale the runtime happens to pick — and
   would then differ between the prerendered HTML and the browser. */
const formatKm = (km: number) =>
  Math.floor(km)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * Endless runner on a canvas. One button, no menus, playable with a thumb.
 *
 * The loop owns everything that changes every frame and writes the counter and
 * the progress dot straight into the DOM through refs. React is told only when
 * something actually changes shape — the phase, a milestone, the record — so a
 * run is not two hundred re-renders a second.
 */
export default function Runner() {
  const fieldRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kmRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const game = useRef<Game>(freshGame());
  const view = useRef<View>({
    scale: 1,
    w: 240,
    h: WORLD_H,
    groundY: WORLD_H - GROUND_FROM_BOTTOM,
    snap: (v) => v,
  });
  const sprite = useRef<HTMLImageElement | null>(null);
  /** The loop and the listeners read the phase from here, never from state. */
  const phaseRef = useRef<Phase>('loading');

  /** Flips once, when the atlas has decoded. The loop keys off this rather
      than off the phase, so starting a run does not tear the loop down. */
  const [booted, setBooted] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [best, setBest] = useState(0);
  const [result, setResult] = useState({ km: 0, record: false, endless: false });
  const [saveFailed, setSaveFailed] = useState(false);
  /** False while the arrival screen is still saying what it has to say. */
  const [canLeave, setCanLeave] = useState(false);
  /* Carries an id as well as the words: the three lines may well end up
     identical, and keying the element on the text alone would make React
     reuse the node and swallow the entrance animation. */
  const [milestone, setMilestone] = useState<{ id: number; line: string } | null>(null);

  /** Read inside the loop, where the state copy would be a frame stale. */
  const bestRef = useRef(0);

  const toPhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const rememberBest = useCallback((km: number) => {
    bestRef.current = km;
    setBest(km);
  }, []);

  /** Resumes the same run with the far end taken off it. */
  const leaveGdansk = useCallback(() => {
    const g = game.current;
    g.endless = true;
    /* A clear stretch of road out of the city. Without it she resumes into
       whatever happened to be under her nose while the screen was up, which is
       a death she had no way to see coming. */
    g.blocks = [];
    g.hangs = [];
    g.pits = [];
    g.untilSpawn = g.speed * 1.4;
    g.buffered = 0;
    g.held = false;
    toPhase('playing');
  }, [toPhase]);

  const reset = useCallback(() => {
    game.current = freshGame();
    setMilestone(null);
    setSaveFailed(false);
    toPhase('ready');
  }, [toPhase]);

  /* The way on stays inert until the second beat is up, so it cannot be hit
     before it has said anything. */
  useEffect(() => {
    if (phase !== 'arrived') return;
    setCanLeave(false);
    const id = setTimeout(() => setCanLeave(true), ARRIVAL_DEAF_MS);
    return () => clearTimeout(id);
  }, [phase]);

  /* ---------- Everything in place before the first frame ---------------- */

  useEffect(() => {
    let alive = true;

    const image = new Image();
    const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('sprite atlas failed to load'));
    });
    image.src = SPRITE.src;

    /* Only the atlas holds the opening screen up. It is eight kilobytes off the
       same origin, so it lands almost at once and she is on the road straight
       away — which is the point of that screen.

       The record is not waited for. It is a Supabase round trip, and putting it
       in front of the first frame meant a slow phone connection could sit on a
       black canvas for seconds. It arrives when it arrives. */
    loaded
      .then((img) => {
        if (!alive) return;
        sprite.current = img;
        toPhase('ready');
        setBooted(true);
      })
      .catch(() => {
        if (!alive) return;
        toPhase('ready');
        setBooted(true);
      });

    loadBest().then((record) => {
      if (alive) rememberBest(record);
    });

    return () => {
      alive = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [toPhase, rememberBest]);

  /* ---------- The loop --------------------------------------------------- */

  useEffect(() => {
    if (!booted) return;

    const stage = stageRef.current;
    const field = fieldRef.current;
    const canvas = canvasRef.current;
    if (!stage || !field || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let frame = 0;
    let last = 0;
    /* Timestamp before which a tap will not restart. See press(). */
    let armAt = 0;
    let milestoneTimer: ReturnType<typeof setTimeout> | undefined;

    /* ---------- Size ----------------------------------------------------
       The scale is exact rather than rounded to whole device pixels, so the
       world is WORLD_H units tall on every device and the framing is the same
       everywhere. Rounding it was the earlier approach and it cannot zoom: on
       a phone it only ever lands on 4 or 5 device pixels per unit, and 5 puts
       the top of a jump eight units below the ceiling.

       What rounding bought was pixel-exact drawing, and that is kept by
       snapping coordinates onto the device grid at draw time instead. The one
       thing it cannot give back is a whole number of device pixels per sprite
       pixel: at a scale of 4.48 some source pixels land on four and some on
       five. At the three-times density this runs at, that is a third of a CSS
       pixel of variation, and she does not move horizontally at all.
       -------------------------------------------------------------------- */

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const dw = Math.round(rect.width * dpr);
      const dh = Math.round(rect.height * dpr);

      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }

      const scale = dh / WORLD_H;
      view.current = {
        scale,
        w: dw / scale,
        h: WORLD_H,
        groundY: WORLD_H - GROUND_FROM_BOTTOM,
        snap: (v) => Math.round(v * scale) / scale,
      };

      /* Resizing the backing store resets the context, so both of these have
         to be set here and not once at startup. */
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);

    /* ---------- Input ---------------------------------------------------- */

    /**
     * Returns whether the press did anything, so the pad only lights up for
     * the ones that landed.
     *
     * `deliberate` means it came from the pad or the keyboard rather than from
     * the road. Only those can start a run: a tap anywhere on the canvas was
     * enough before, and between the pad sitting right under the thumb and the
     * screen being the biggest target on the page, runs kept beginning before
     * anyone meant them to.
     */
    const press = (deliberate: boolean): boolean => {
      const g = game.current;

      if (phaseRef.current === 'ready') {
        if (!deliberate) return false;
        game.current = freshGame();
        setMilestone(null);
        setSaveFailed(false);
        last = 0;
        toPhase('playing');
        return true;
      }

      /* Recorded rather than acted on: the step decides whether it can be
         spent now or has to wait for her to land. Jumping stays available from
         anywhere — it is reflex, not a decision.

         `held` is the other half of it. How long this stays true is how high
         she goes, so the press is a beginning now rather than an event. */
      if (phaseRef.current === 'playing') {
        g.buffered = JUMP_BUFFER_S;
        g.held = true;
        return true;
      }

      /* Only as far as the opening screen, never straight into a run, so this
         one is safe from anywhere. Deaf for a moment after a crash, or the tap
         already on its way when she hit would skip past the score. */
      if (phaseRef.current === 'over' && last >= armAt) {
        reset();
        return true;
      }

      /* Nothing here for 'arrived'. Leaving Gdańsk is a button, deliberately:
         at that moment her thumb is still in the rhythm of jumping, and any
         tap-to-continue would be spent on reflex before she had read a word. */
      return false;
    };

    /* touchstart rather than click: it arrives as the thumb lands instead of
       when it lifts, which on a phone is most of the difference between a jump
       that felt taken and one that felt missed. */
    const fromPad = (e: Event) =>
      Boolean((e.target as HTMLElement | null)?.closest('[data-pad]'));

    const onTouch = (e: TouchEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button')) return;
      /* No preventDefault while the arrival screen is up: there is no jump to
         take, and swallowing the gesture would also swallow the scroll that
         long copy on a short phone needs. */
      if (phaseRef.current === 'arrived') return;
      e.preventDefault();
      if (press(fromPad(e))) field.classList.add(styles.hit);
    };

    /* Letting go is now part of the move, not just the end of one: the step
       clips her rise the first frame it sees this false. */
    const release = () => {
      game.current.held = false;
      field.classList.remove(styles.hit);
    };

    /* Desktop. Suppressed on touch devices by the preventDefault above, which
       is what stops a single tap counting twice. */
    const onMouse = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('button')) return;
      if (press(fromPad(e))) field.classList.add(styles.hit);
    };

    const isJumpKey = (code: string) =>
      code === 'Space' || code === 'ArrowUp' || code === 'KeyW';

    const onKey = (e: KeyboardEvent) => {
      if (!isJumpKey(e.code)) return;
      /* Auto-repeat is the operating system's, not hers. Ignored for the press
         and irrelevant to `held`, which the keyup is what ends. */
      if (e.repeat) return;
      if ((e.target as HTMLElement | null)?.closest('button, a')) return;
      e.preventDefault();
      /* A key is as deliberate as the pad. */
      if (press(true)) field.classList.add(styles.hit);
    };

    /* The keyboard's half of the analogue jump. Without this a key press is a
       held press forever and the whole thing collapses back to one arc. */
    const onKeyUp = (e: KeyboardEvent) => {
      if (!isJumpKey(e.code)) return;
      release();
    };

    /* On the field, not the canvas: the pad underneath has to jump too, and it
       is the whole reason the pad exists. */
    field.addEventListener('touchstart', onTouch, { passive: false });
    field.addEventListener('mousedown', onMouse);
    field.addEventListener('touchend', release);
    field.addEventListener('touchcancel', release);
    window.addEventListener('mouseup', release);
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    /* A window that loses focus mid-jump never sees the keyup, and she would
       carry the hold into the next thing she did. */
    window.addEventListener('blur', release);

    /* ---------- Gdańsk ------------------------------------------------------ */

    const arrive = () => toPhase('arrived');

    /* ---------- Death ----------------------------------------------------- */

    const finish = () => {
      const km = Math.floor(game.current.km);
      const { endless } = game.current;
      armAt = last + 450;
      toPhase('over');
      setResult({ km, record: endless && km > bestRef.current, endless });

      /* Only the endless road is scored. A run that never reached Gdańsk has
         not started counting yet, and letting it write would leave a record
         below the arrival — a number nobody in endless could ever be shown. */
      if (!connected || !endless) return;
      saveBest(km)
        .then(rememberBest)
        .catch(() => setSaveFailed(true));
    };

    /* ---------- Step ------------------------------------------------------ */

    const step = (dt: number) => {
      const g = game.current;
      const v = view.current;

      g.speed = speedAt(g.km);

      const moved = g.speed * dt;
      g.dist += moved;
      g.km += moved * KM_PER_UNIT;
      g.animT += dt;

      /* Where her feet were before this frame moved them. This is the whole
         difference between landing on a ledge and walking into its side. */
      const wasAt = g.lift;

      /* Three lists rather than one because they are three different questions
         at collision time — what to stand on, what not to hit, and where there
         is no floor. Each stays sorted by x, so only the head can have left. */
      for (const o of g.blocks) o.x -= moved;
      for (const o of g.hangs) o.x -= moved;
      for (const o of g.pits) o.x -= moved;
      /* `while`, not `if`: a formation puts down as many as three blocks at
         once, and a long frame could carry more than one of them off the end. */
      while (g.blocks.length && g.blocks[0].x + g.blocks[0].w < -20) g.blocks.shift();
      while (g.hangs.length && g.hangs[0].x + g.hangs[0].w < -20) g.hangs.shift();
      while (g.pits.length && g.pits[0].x + g.pits[0].w < -20) g.pits.shift();

      /* Spawning is measured in distance, not in seconds, and everything the
         formation puts down is a multiple of the current speed — so a hole
         takes the same time to cross and a beam the same time to pass under
         however fast she is going. See FORMATIONS. */
      g.untilSpawn -= moved;
      if (g.untilSpawn <= 0) {
        const f = pickFormation(g.km, g.lastForm);
        const s = g.speed;
        const x0 = v.w + 12;
        /* Where the formation actually finishes, measured rather than declared
           — a piece can be wide in units or wide in seconds, and only the
           spawner knows the speed that reconciles the two. */
        let end = 0;

        for (const p of f.pieces) {
          const at = p.at * s;
          if (p.kind === 'block') {
            g.blocks.push({ x: x0 + at, w: p.w, h: p.h, kind: p.face ?? 0 });
            end = Math.max(end, at + p.w);
          } else if (p.kind === 'hang') {
            const w = p.secs * s;
            g.hangs.push({ x: x0 + at, w, clear: p.clear });
            end = Math.max(end, at + w);
          } else {
            const w = p.secs * s;
            g.pits.push({ x: x0 + at, w });
            end = Math.max(end, at + w);
          }
        }

        g.lastForm = f.id;
        g.untilSpawn = end + restGap(g.km) * s;
      }

      /* A jump asked for slightly too early is remembered rather than dropped,
         and one asked for slightly too late still counts — see COYOTE_S. Both
         of these are what stop a miss feeling like the game's fault. */
      g.buffered = Math.max(0, g.buffered - dt);
      if (g.buffered > 0 && (g.grounded || g.coyote > 0)) {
        g.vy = JUMP_V;
        g.grounded = false;
        g.coyote = 0;
        g.buffered = 0;
      }

      /* The analogue half. Clipped every frame the button is up rather than
         once on release, which costs nothing and means a jump fired out of the
         buffer after she let go comes out short — the tap she actually made,
         not the one the buffer remembered. */
      if (!g.grounded && !g.held && g.vy > JUMP_MIN_V) {
        g.vy = JUMP_MIN_V;
      }

      /* Her speed at the start of the frame, kept so the entry test below can
         ask where her feet were partway through it. */
      const vy0 = g.vy;

      if (!g.grounded) {
        g.coyote = Math.max(0, g.coyote - dt);
        /* Position from the exact arc rather than from the new velocity. The
           plain Euler pair loses ½·g·dt² of height every step, which at 20fps
           costs eleven units off the top of the jump and at 144fps costs one —
           a jump that means something different per device. This term is what
           makes the apex the same everywhere. */
        g.lift += g.vy * dt - 0.5 * GRAVITY * dt * dt;
        g.vy -= GRAVITY * dt;
      }

      /* Obstacles are ledges, not spikes. Only the moment she first reaches
         one decides anything: feet above its top and it becomes floor to stand
         on, feet below and she has met it side-on. After that it is furniture.
         The test is taken at the instant within the frame that contact happens
         rather than at the frame boundary — at 30fps a boundary is 9 units of
         road, which was enough to make the same jump live or die depending on
         the frame rate. */
      const half = HITBOX_W / 2;
      const cx0 = RUNNER_X - half;
      const cx1 = RUNNER_X + half;
      let floor = 0;

      /* A hole takes the floor away rather than putting something in the way,
         which is what makes it the one thing that punishes jumping too early.
         She has to be entirely inside one to fall: a toe on either lip is
         enough to stand on, so an edge is caught rather than clipped. */
      for (const p of g.pits) {
        if (p.x > cx0) break;
        if (cx1 <= p.x + p.w) {
          floor = VOID_FLOOR;
          break;
        }
      }

      for (const o of g.blocks) {
        if (o.x > cx1 || o.x + o.w < cx0) continue;

        const before = o.x + moved;
        if (before > cx1) {
          const f = moved > 0 ? Math.min(1, Math.max(0, (before - cx1) / moved)) : 0;
          const tau = f * dt;
          const feet = wasAt + vy0 * tau - 0.5 * GRAVITY * tau * tau;
          if (feet < o.h - 0.5) {
            finish();
            return;
          }
        }

        /* Above VOID_FLOOR by a mile, so a block laid across a hole bridges it. */
        floor = Math.max(floor, o.h);
      }

      if (g.lift <= floor) {
        /* Reaching a surface from below it is not a landing — it is the far
           wall of the hole she is already inside, and without this she would
           be lifted out of a narrow one by the very edge she failed to reach.
           `wasAt` rather than the current lift, so the unit or two a normal
           landing overshoots by does not read the same way. */
        if (wasAt < floor - 1) {
          finish();
          return;
        }
        g.lift = floor;
        g.vy = 0;
        g.grounded = true;
      } else if (g.grounded) {
        /* Ran off the end of a ledge — falling, but still allowed to jump for
           a beat, which is the difference between a mistake and a mistrial.
           Over a hole this is the last chance to get out of it, and it is a
           real one: COYOTE_S is a hair longer than the fall to PIT_FALL. */
        g.grounded = false;
        g.coyote = COYOTE_S;
      }

      g.floor = floor;

      /* Down the hole. Tested after the floor has settled, so a block bridging
         a pit has already had its say. */
      if (g.lift < -PIT_FALL) {
        finish();
        return;
      }

      /* Beams. Unlike a block this is not a moment of contact but a stretch of
         road she has to be low along the whole of — she can jump into one from
         underneath, which is exactly the mistake it exists to punish. */
      for (const o of g.hangs) {
        if (o.x > cx1) break;
        if (o.x + o.w < cx0) continue;
        if (g.lift + HEAD_H > o.clear) {
          finish();
          return;
        }
      }

      if (!g.endless && g.km >= JOURNEY_KM) {
        arrive();
        return;
      }

      /* Milestones fire in order, so a frame long enough to skip past two of
         them still shows the first rather than silently eating it. */
      const next = MILESTONES[g.passed];
      if (next && g.km >= next.km) {
        g.passed += 1;
        setMilestone({ id: g.passed, line: next.line });
        clearTimeout(milestoneTimer);
        milestoneTimer = setTimeout(() => setMilestone(null), MILESTONE_MS);
      }
    };

    /* ---------- Draw ------------------------------------------------------ */

    const draw = () => {
      const g = game.current;
      const v = view.current;
      const groundY = v.groundY;
      /* Every edge below lands on the device pixel grid through this, which is
         what keeps the blocks hard-edged now the scale is not a whole number. */
      const snap = v.snap;

      const sky = ctx.createLinearGradient(0, 0, 0, groundY);
      sky.addColorStop(0, PALETTE.sky);
      sky.addColorStop(1, PALETTE.skyLow);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, v.w, groundY);

      /* Two bands of blocks at different speeds. Deterministic from their own
         index, so the same shape comes back if the same ground is covered. */
      const band = (factor: number, spacing: number, top: number, colour: string) => {
        ctx.fillStyle = colour;
        const shift = g.dist * factor;
        const first = Math.floor(shift / spacing);
        for (let i = first; i < first + Math.ceil(v.w / spacing) + 2; i += 1) {
          const x = i * spacing - shift;
          const h = top + noise(i) * top * 0.9;
          const w = spacing * (0.45 + noise(i + 3.1) * 0.4);
          ctx.fillRect(snap(x), snap(groundY - h), snap(w), h);
        }
      };

      band(0.12, 62, 34, PALETTE.far);
      band(0.32, 41, 20, PALETTE.near);

      ctx.fillStyle = PALETTE.ground;
      ctx.fillRect(0, groundY, v.w, v.h - groundY);
      ctx.fillStyle = PALETTE.groundLine;
      ctx.fillRect(0, groundY, v.w, snap(1));

      /* Dashes on the road, so speed is visible even with nothing else moving.
         Kept dimmer than the blocks: in the accent they read as things to jump
         over, and there are a lot of them. */
      ctx.fillStyle = PALETTE.groundLine;
      const dashShift = g.dist % 30;
      for (let x = -dashShift; x < v.w; x += 30) {
        ctx.fillRect(snap(x), snap(groundY + 7), 13, snap(1));
      }

      /* Holes are punched out of the finished road rather than the road being
         drawn around them — one fill over the top costs nothing and saves the
         surface, its line and its dashes all having to know where the gaps
         are. Both walls are lit, so the far one reads as something to land on
         rather than as the end of the picture. */
      const line = snap(1);
      for (const p of g.pits) {
        const x = snap(p.x);
        const w = snap(p.w);

        ctx.fillStyle = PALETTE.pit;
        ctx.fillRect(x, groundY, w, v.h - groundY);
        ctx.fillStyle = PALETTE.obstacleEdge;
        ctx.fillRect(x, groundY, line, v.h - groundY);
        ctx.fillRect(x + w - line, groundY, line, v.h - groundY);
      }

      /* Every obstacle is a plain block, because every obstacle is a plain
         block to the collision code — she stands on that top edge. Sloped and
         pointed silhouettes were the first thing drawn here and had to go:
         they promise a hitbox the game does not have.

         Outlined in the accent rather than left as a dark mass, which against
         a near-black sky was something you noticed a moment too late. The top
         is drawn twice as thick as the sides: it is the one edge that is a
         surface, and it should look like one. */
      for (const o of g.blocks) {
        const x = snap(o.x);
        const y = snap(groundY - o.h);
        const w = snap(o.w);

        /* A block standing in a hole has no road to sit on. Stopped at the
           ground line like every other one it reads as a slab hanging over the
           gap — a rendering fault rather than a stepping stone — so it is
           carried down to the bottom of the frame instead, and stands in the
           hole the way the walls of the hole do. */
        let base = groundY;
        for (const p of g.pits) {
          if (p.x >= o.x + o.w) break;
          if (p.x + p.w > o.x) {
            base = v.h;
            break;
          }
        }

        ctx.fillStyle = PALETTE.obstacle;
        ctx.fillRect(x, y, w, base - y);

        ctx.fillStyle = PALETTE.obstacleEdge;
        ctx.fillRect(x, y, w, line * 2);
        ctx.fillRect(x, y, line, base - y);
        ctx.fillRect(x + w - line, y, line, base - y);

        ctx.fillStyle = PALETTE.obstacleFace;
        if (o.kind === 1) {
          ctx.fillRect(x + snap(4), y + snap(6), w - snap(8), line);
        } else if (o.kind === 2) {
          ctx.fillRect(x + snap(Math.floor(o.w / 2)), y + snap(5), line, groundY - y - snap(9));
        }
      }

      /* Beams. Carried right up to the top of the frame rather than drawn as a
         floating bar, so there is no reading of it that involves going over —
         it is a bridge, and the sky above it is not somewhere she can be. The
         underside gets the thick lit edge for the same reason the top of a
         block does: it is the edge that decides things. */
      for (const o of g.hangs) {
        const x = snap(o.x);
        const w = snap(o.w);
        const y = snap(groundY - o.clear);

        ctx.fillStyle = PALETTE.obstacle;
        ctx.fillRect(x, 0, w, y);

        ctx.fillStyle = PALETTE.obstacleEdge;
        ctx.fillRect(x, y - line * 2, w, line * 2);
        ctx.fillRect(x, 0, line, y);
        ctx.fillRect(x + w - line, 0, line, y);

        /* A rib down the middle, so a wide beam is not a blank slab. */
        ctx.fillStyle = PALETTE.obstacleFace;
        ctx.fillRect(x + snap(Math.floor(o.w / 2)), y - snap(9), line, snap(7));
      }

      /* Her shadow, shrinking as she climbs — the only cue for how high she is
         once she has left the ground. */
      const img = sprite.current;
      const air = g.lift - g.floor;
      /* Nothing to cast onto over a hole, which is most of what a hole is. */
      if (air > 0.5 && g.floor !== VOID_FLOOR) {
        /* Cast onto whatever is under her, not onto the road, or it detaches
           from her the moment she is over a ledge. */
        const t = Math.max(0, 1 - air / 60);
        ctx.globalAlpha = 0.32 * t;
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(RUNNER_X, groundY - g.floor + 1, 9 * t + 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (img) {
        const { frameW, frameH, rows } = SPRITE;
        let row: number = rows.idle.row;
        let index: number = Math.floor(g.animT * 6) % rows.idle.frames;

        if (phaseRef.current === 'playing') {
          if (g.grounded) {
            row = rows.run.row;
            /* Faster legs at higher speed, or she looks like she is skating. */
            index = Math.floor(g.animT * (10 + g.speed / 22)) % rows.run.frames;
          } else {
            row = rows.jump.row;
            index = g.vy > 150 ? 0 : g.vy > 0 ? 1 : g.vy > -150 ? 2 : 3;
          }
        }

        /* Snapped so her edges land on device pixels. The size is snapped too,
           so the same source pixel does not straddle a boundary differently on
           the way up than on the way down. */
        ctx.drawImage(
          img,
          index * frameW,
          row * frameH,
          frameW,
          frameH,
          snap(RUNNER_X - frameW / 2),
          snap(groundY - g.lift - frameH),
          snap(frameW),
          snap(frameH),
        );
      }
    };

    /* ---------- Frames ----------------------------------------------------- */

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;

      if (phaseRef.current === 'playing' && dt > 0) {
        step(dt);
      } else if (dt > 0) {
        game.current.animT += dt;
      }

      draw();

      if (kmRef.current) kmRef.current.textContent = formatKm(game.current.km);
      const p = barPosition(game.current.km);
      if (dotRef.current) dotRef.current.style.left = `${p * 100}%`;
      if (trailRef.current) trailRef.current.style.width = `${p * 100}%`;
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(milestoneTimer);
      observer.disconnect();
      field.removeEventListener('touchstart', onTouch);
      field.removeEventListener('mousedown', onMouse);
      field.removeEventListener('touchend', release);
      field.removeEventListener('touchcancel', release);
      window.removeEventListener('mouseup', release);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', release);
    };
  }, [booted, toPhase, rememberBest, reset]);

  /* ---------- Chrome ------------------------------------------------------ */

  return (
    <section className={styles.wrap}>
      <div className={styles.hud}>
        {/* Above the counter rather than beside it: it is the number being
            chased, so it reads first. On screen for the whole run, not just the
            endless part — it is only ever set there, but it is worth seeing
            from the start. */}
        {/* {best > 0 && (
          <p className={styles.bestReading}>Furthest so far — {formatKm(best)} km</p>
        )} */}

        <p className={styles.reading}>
          <span className={styles.km} ref={kmRef}>
            0
          </span>
          <span className={styles.unit}>km</span>
        </p>

        <div className={styles.bar} aria-hidden="true">
          <div className={styles.track}>
            <div className={styles.trail} ref={trailRef} />
            {CITIES.map((c) => {
              const at = barPosition(c.km);
              /* A label centred on a marker sitting at 0% would hang off the
                 left edge, so the ends align to their own side instead. */
              const shift = at < 0.02 ? '0' : at > 0.98 ? '-100%' : '-50%';
              return (
                <span key={c.name} className={styles.mark} style={{ left: `${at * 100}%` }}>
                  <span className={styles.markCity} style={{ transform: `translateX(${shift})` }}>
                    {c.name}
                  </span>
                </span>
              );
            })}
            <div className={styles.dot} ref={dotRef} />
          </div>
        </div>
      </div>

      <div
        className={`${styles.field}${phase === 'arrived' ? ` ${styles.arrivalOpen}` : ''}`}
        ref={fieldRef}
      >
        <div className={styles.stage} ref={stageRef}>
          <canvas className={styles.canvas} ref={canvasRef} />

          {milestone && phase === 'playing' && (
            <p className={styles.milestone} key={milestone.id}>
              {milestone.line}
            </p>
          )}

          {phase === 'loading' && (
            <div className={styles.veil}>
              <p className={styles.loading}>Packing…</p>
            </div>
          )}

          {phase === 'ready' && (
            <div className={`${styles.veil} ${styles.veilClear}`}>
              {/* <p className={styles.eyebrow}>Tirana</p> */}
              {/* The hold is the whole game now and nothing on screen shows it,
                  so it gets said here. The beams are worth a line too: they are
                  the one thing that kills for jumping rather than for not. */}
              <p className={styles.hint}>
                Tap the pad to go.
                <br />
                Hold it longer to jump higher.
                <br /><br />
                {/* Stay down for the beams. */}
              </p>
              {/* {best > 0 && <p className={styles.record}>Furthest so far — {formatKm(best)} km</p>} */}
            </div>
          )}

          {phase === 'arrived' && (
            <div className={styles.veil}>
              <p className={styles.eyebrow}>{ARRIVAL.city}</p>
              <p className={styles.arrival}>{ARRIVAL.line}</p>
              {/* Second beat. The delay is set here rather than in the
                  stylesheet so it cannot drift from ARRIVAL_DEAF_MS, which is
                  what stops a tap arriving before this line does. */}
              <p
                className={styles.onward}
                style={{ animationDelay: `${ARRIVAL_BEAT_MS}ms` }}
              >
                {ARRIVAL.next}
              </p>
              {/* onClick, not onPointerDown. A pointerdown swaps the screen
                  out from under the finger, and the mouse events the browser
                  then synthesises for the touch land on whatever replaced it —
                  which on this screen meant leaving Gdańsk and spending a jump
                  in the same tap. Waiting for the click keeps the button under
                  the finger for the whole gesture. The field has
                  touch-action: none, so there is no delay to pay for it. */}
              <button
                className={styles.again}
                style={{ animationDelay: `${ARRIVAL_BEAT_MS}ms` }}
                type="button"
                disabled={!canLeave}
                onClick={leaveGdansk}
              >
                <span className={styles.againLabel}>{ARRIVAL.cta}</span>
              </button>
            </div>
          )}

          {phase === 'over' && (
            <div className={styles.veil}>
              <p className={styles.eyebrow}>{result.record ? 'Furthest yet' : 'Stopped at'}</p>
              <p className={styles.score}>
                {formatKm(result.km)}
                <span className={styles.scoreUnit}>km</span>
              </p>
              {!result.endless && (
                <p className={styles.record}>
                  {formatKm(JOURNEY_KM - result.km)} km to go
                </p>
              )}
              {result.endless && best > result.km && (
                <p className={styles.record}>Furthest so far — {formatKm(best)} km</p>
              )}
              {saveFailed && <p className={styles.warn}>That one did not reach the table.</p>}
              {/* onClick for the same reason as the arrival button above: on
                  pointerdown this screen vanished mid-tap and the synthetic
                  mousedown landed on the opening screen behind it, starting a
                  run nobody asked for. */}
              <button className={styles.again} type="button" onClick={reset}>
                <span className={styles.againLabel}>Again</span>
              </button>
            </div>
          )}
        </div>

        {/* Somewhere to put the thumb that is not on top of the game. Held in
            the same tap target as the canvas, so it does the same thing. */}
        <div
          data-pad=""
          className={`${styles.pad}${phase === 'arrived' ? ` ${styles.padMuted}` : ''}`}
        >
          <span className={styles.padLabel}>{PAD_LABEL[phase]}</span>
        </div>
      </div>
    </section>
  );
}
