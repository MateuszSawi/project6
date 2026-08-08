'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Frown, Lock } from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import { GAMES } from '@/lib/content';
import { useInView } from '@/lib/useInView';

import styles from './Games.module.scss';

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

            /* Everything inside the tile, so the linked and the sealed
               versions cannot drift apart — only the wrapper differs.

               The picture and the link are independent: a game can be
               announced with its artwork days before there is anything to
               open, which is exactly what the first one is doing. */
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
                ) : (
                  <span className={styles.glyph} aria-hidden="true">
                    ?
                  </span>
                )}

                <span className={styles.index} aria-hidden="true">
                  {number}
                </span>

                <h3 className={styles.name}>{game.title}</h3>

                {game.href ? (
                  <span className={styles.go}>
                    <span className={styles.goLabel}>Play</span>
                    <ArrowRight size={15} strokeWidth={2} />
                  </span>
                ) : (
                  <span className={styles.soon}>
                    <Lock size={13} strokeWidth={1.6} />
                    <span className={styles.soonLabel}>Coming soon</span>
                  </span>
                )}
              </>
            );

            return (
              <li className={styles.cell} key={game.id} style={{ '--i': i } as CSSProperties}>
                {game.href ? (
                  <Link className={styles.card} href={game.href} data-open="">
                    {body}
                  </Link>
                ) : (
                  <div className={styles.card} data-art={game.src ? '' : undefined}>
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
