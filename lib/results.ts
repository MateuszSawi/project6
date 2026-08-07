/**
 * Where the answers live: Supabase, and nowhere else.
 *
 * There is deliberately no local copy. One table is the whole truth, so she
 * opens the game on any phone and finds exactly what she left — and so do I,
 * from mine. The cost is that a tap made with no signal is a tap that did not
 * happen; the game says so plainly rather than pretending otherwise.
 *
 * One table, `answers`, one row per question:
 *   mateusz_answer — mine, typed in by hand
 *   iza_answer     — hers, written by the game on every tap
 *
 * Reads go straight at the table. Writes only ever go through two `security
 * definer` functions, which is what keeps my column and the question texts out
 * of reach of anything running in a browser.
 *
 * Until the two env vars exist all of this is off: `connected` is false, the
 * page says so, and nothing throws. See SUPABASE.md.
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

export interface Stored {
  /** Mine, typed into the table by hand. */
  mine: Record<string, string>;
  /** Hers, as she left them — the memory of every earlier visit. */
  hers: Record<string, string>;
}

/**
 * Both columns, in one request, before the game is shown.
 *
 * Throws rather than returning empty when the request fails: an empty game is
 * indistinguishable from a game she has not started, and quietly showing her a
 * blank stack would invite her to answer over the top of what she already has.
 */
export async function loadStored(game: string): Promise<Stored> {
  if (!connected) return { mine: {}, hers: {} };

  const query = `game=eq.${encodeURIComponent(game)}&select=question_id,mateusz_answer,iza_answer`;
  const response = await fetch(`${URL}/rest/v1/answers?${query}`, {
    headers: headers(),
    /* Always the current row, never one the browser kept from an earlier
       visit — this is the only copy there is. */
    cache: 'no-store',
  });

  if (!response.ok) throw new Error(`Supabase said ${response.status}.`);

  const rows = (await response.json()) as Array<{
    question_id: string;
    mateusz_answer: string | null;
    iza_answer: string | null;
  }>;

  const stored: Stored = { mine: {}, hers: {} };
  for (const row of rows) {
    if (row.mateusz_answer) stored.mine[row.question_id] = row.mateusz_answer;
    if (row.iza_answer) stored.hers[row.question_id] = row.iza_answer;
  }

  return stored;
}

/**
 * Writes her answers. Called on every tap with the complete set rather than
 * the one that changed — that is the entire error handling, because a push
 * that fails is repaired by the next tap instead of by a queue.
 */
export async function pushAnswers(game: string, answers: unknown): Promise<void> {
  if (!connected) throw new Error('Nowhere to send it yet.');

  const response = await fetch(`${URL}/rest/v1/rpc/save_answers`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ p_game: game, p_answers: answers }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(detail.slice(0, 200) || `Supabase said ${response.status}.`);
  }
}

/**
 * Empties her column for one game and leaves mine exactly as it is — "start
 * again" is her starting again, not the game being wiped.
 */
export async function resetAnswers(game: string): Promise<void> {
  if (!connected) return;

  await fetch(`${URL}/rest/v1/rpc/reset_answers`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=minimal' },
    body: JSON.stringify({ p_game: game }),
  });
}
