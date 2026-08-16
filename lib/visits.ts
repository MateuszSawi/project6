/**
 * Counting who came and where they went.
 *
 * Six counters: the front page and the five games. Kept in Supabase for the
 * same reason the runner's record is — this is a static export (see
 * next.config.mjs), so there is no /api route to post to and the REST call is
 * the API. See visits-setup.sql.
 *
 * Nothing on the page ever reads these back. They are for whoever built the
 * site, not for whoever is looking at it, so the table has no select policy at
 * all and the browser can only ever add one.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** The ones the database knows. Anything else is dropped, there and here. */
export type VisitKey =
  | 'home'
  | 'runner'
  | 'guide'
  | 'likely'
  | 'upgrade-trip'
  | 'book-trip'
  | 'last';

/**
 * Records one arrival. Never throws and never blocks anything: a counter that
 * can break a page is worse than a counter that occasionally misses.
 *
 * Which addresses are left out of the count is decided in the database rather
 * than here — see ignored_ip. Doing it in the browser would mean shipping the
 * list to everyone.
 */
export function countVisit(key: VisitKey): void {
  if (!URL || !KEY) return;

  /* keepalive so the request survives the page being navigated away from,
     which is most of what happens right after one of these fires. */
  fetch(`${URL}/rest/v1/rpc/count_visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({ p_key: key }),
    keepalive: true,
  }).catch(() => {});
}
