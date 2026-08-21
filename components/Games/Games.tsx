'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Frown, LockKeyhole } from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import { GAMES } from '@/lib/content';
import { complete } from '@/lib/games/upgrade-trip';
import { connected, loadStored } from '@/lib/results';
import { useInView } from '@/lib/useInView';

import styles from './Games.module.scss';

/**
 * What a tile's `after` can name, and what finishing it means.
 *
 * One entry, and probably always one: this is the order two of the games have
 * to be played in, not a dependency graph.
 */
const GATES: Record<string, { game: string; done: (hers: Record<string, string>) => boolean; wait: string }> = {
  upgrade: {
    game: 'upgrade-trip',
    done: complete,
    wait: 'Upgrade your trip first',
  },
};

/**
 * The foot of the page, and the only part of it that is not finished on
 * purpose.
 *
 * She was supposed to be here now; she comes in a month instead. So the page
 * keeps going: a game, a quiz, a test — one more every few days, each one its
 * own route under /games. A sealed tile is a promise with a date attached to
 * nothing, which is exactly the point — there has to be a reason to come back.
 *
 * The tiles are the same object twice. One has a photograph and a link, the
 * other has neither, and everything else about them matches.
 */
export default function Games() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.05 });

  /**
   * Which gates have opened. Everything starts shut and is opened by the read,
   * never the other way round — a tile that offers a door for half a second
   * and then takes it away is worse than one that took a moment to appear.
   *
   * On a build with no database there is nothing to finish and nothing to
   * remember, so every gate is simply open.
   */
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let alive = true;

    for (const [id, gate] of Object.entries(GATES)) {
      if (!connected) {
        setOpen((was) => ({ ...was, [id]: true }));
        continue;
      }

      loadStored(gate.game)
        .then(({ hers }) => {
          if (alive) setOpen((was) => ({ ...was, [id]: gate.done(hers) }));
        })
        /* Unreachable is not the same as unfinished, but it has to be treated
           as it: the tile behind this stays shut and a reload asks again. */
        .catch(() => {});
    }

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section
      className={styles.section}
      id="games"
      ref={ref}
      data-shown={inView || undefined}
      aria-labelledby="games-title"
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>
            One more month
            <Frown size={13} strokeWidth={2} aria-hidden="true" />
          </p>

          <h2 className={styles.title} id="games-title">
            See you <em>soon enough</em>
          </h2>

          <div className={styles.lede}>
            <p>
              A month is a long time to wait. But I'm not gonna let you be bored.
            </p>
            <p>
              From time to time something new appears down here — a game, a quiz, a test, some
              excuse to keep you thinking about me. Play them while you miss me (I know you do).
            </p>
            <p>
              And don't worry about August not working out. You've got my full attention anyway, and you're keeping it until you get here.
            </p>
            <p className={styles.ledeNote}></p>
          </div>
        </header>

        <ol className={styles.grid}>
          {GAMES.map((game, i) => {
            const number = String(i + 1).padStart(2, '0');

            const art = game.src || game.sprite;

            /* A gate the read has not opened holds the tile shut whatever its
               href says, and puts the reason where "Play" would have been. */
            const gate = game.after ? GATES[game.after] : undefined;
            const held = Boolean(gate) && !(game.after && open[game.after]);
            const href = held ? undefined : game.href;

            /* A tile that does not open keeps its name to itself, whether it
               is held shut by the game above it or simply not built yet. What
               a game is called is part of what she gets for arriving at it, so
               until then every shut tile wears the same question mark and the
               pill underneath carries the only difference that matters: what
               opens it, or that it is not here yet.

               The titles stay in content.ts. They are what the tile turns into
               the moment it has a door, not something waiting to be typed. */
            const name = href ? game.title : '?';

            /* Everything inside the tile, so the linked and the sealed
               versions cannot drift apart — only the wrapper differs.

               The picture and the link are independent: a game can be
               announced with its artwork days before there is anything to
               open. The artwork is all it is announced with, though — the name
               arrives with the door. See `name` above. */
            const body = (
              <>
                {game.src ? (
                  <>
                    <Frame
                      className={styles.art}
                      src={game.src}
                      alt=""
                      grade={game.grade}
                      focus={game.focus}
                    />
                    <span className={styles.scrim} aria-hidden="true" />
                  </>
                ) : game.sprite ? (
                  /* A drawn game shows its character rather than a photograph:
                     she stands on the floor of the tile at her own proportions,
                     with the tile's own gradient left visible behind her.
                     Deliberately not a Frame — the grade, the veil and the
                     grain are a camera's, and there is no camera here. */
                  /* eslint-disable-next-line @next/next/no-img-element -- a
                     handful of pixels, served at their own size; next/image
                     would only resample them soft. */
                  <img
                    className={styles.sprite}
                    src={game.sprite}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    aria-hidden="true"
                  />
                ) : (
                  <span className={styles.glyph} aria-hidden="true">
                    ?
                  </span>
                )}

                <span className={styles.index} aria-hidden="true">
                  {number}
                </span>

                <h3 className={styles.name}>{name}</h3>

                {href ? (
                  <span className={styles.go}>
                    <span className={styles.goLabel}>Play</span>
                    <ArrowRight size={15} strokeWidth={2} />
                  </span>
                ) : held && gate ? (
                  /* The same lit pill as "Play" — this one exists and is
                     finished, and she is one game away from it, so it does not
                     belong with the muted tiles that are only promises.

                     A lock instead of the arrow, and leading rather than
                     trailing: the arrow says "this way", and the whole point of
                     this pill is that it is not yet a way anywhere. Reading the
                     state before the instruction is also the right order — she
                     learns it is shut before she reads what opens it.

                     The keyhole one, not the plain padlock. At this size the
                     plain one is a rounded box with a handle over it and reads
                     as a handbag; the keyhole is the single mark that makes it
                     unmistakably a lock. */
                  <span className={styles.go}>
                    <LockKeyhole size={14} strokeWidth={1.9} />
                    <span className={styles.goLabel}>{gate.wait}</span>
                  </span>
                ) : (
                  <span className={styles.soon}>
                    {/* Same glyph as the held tile above — two different
                        padlocks in one list would read as two different
                        meanings. */}
                    <LockKeyhole size={13} strokeWidth={1.7} />
                    <span className={styles.soonLabel}>Coming soon</span>
                  </span>
                )}
              </>
            );

            return (
              <li className={styles.cell} key={game.id} style={{ '--i': i } as CSSProperties}>
                {href ? (
                  <Link className={styles.card} href={href} data-open="">
                    {body}
                  </Link>
                ) : (
                  <div className={styles.card} data-art={art ? '' : undefined}>
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
