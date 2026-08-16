import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import Atmosphere from '@/components/Atmosphere/Atmosphere';
import SvgFilters from '@/components/Filters/SvgFilters';
import Visit from '@/components/Visit/Visit';
import type { VisitKey } from '@/lib/visits';

import styles from './GameLayout.module.scss';

interface GameLayoutProps {
  /** Which counter this page adds to. See visits-setup.sql. */
  count: VisitKey;
  title: string;
  /** Set small above the title. Leave it out on a game that explains itself. */
  kind?: string;
  /** A line or two under the title, before the game itself starts. */
  lede?: ReactNode;
  /**
   * Pulls the game itself out toward the edges of a small screen, leaving the
   * words above it on the page's own margins. For games played inside a box of
   * a fixed size, where the gutter is not whitespace but a piece of the game
   * nobody gets to see.
   */
  bleed?: boolean;
  /**
   * Tightens everything above the game — smaller title, less air around it —
   * for the games that have to be played inside one phone screen rather than
   * scrolled through. Off by default: the room is worth more than the fold on
   * a game that is a page anyway.
   */
  compact?: boolean;
  /**
   * Takes the display serif and the italic off the last line of the lede.
   *
   * That styling exists because the last line is usually the dare — the one
   * thing on the page said straight to her — and a serif italic is how this
   * site says something rather than states it. On a page where the lede is
   * facts she has to hold in her head while she chooses, that is exactly
   * wrong: it is the least readable setting of the most important sentence.
   */
  plainLede?: boolean;
  children: ReactNode;
}

/**
 * The room every game is played in.
 *
 * Same dark room as the invitation — the grain, the wash and the vignette are
 * the page, not a decoration of the front page — plus the one thing a subpage
 * needs and the front page does not: a way back.
 *
 * Nothing here knows what a game is. A new one is a folder under app/games
 * with its own content inside this wrapper.
 */
export default function GameLayout({
  count,
  kind,
  title,
  lede,
  bleed,
  compact,
  plainLede,
  children,
}: GameLayoutProps) {
  return (
    <>
      <Visit name={count} />
      <SvgFilters />
      <Atmosphere />

      <main className={styles.page} data-compact={compact || undefined}>
        <div className={styles.inner}>
          <Link className={styles.back} href="/#games">
            <ArrowLeft size={15} strokeWidth={2} />
            <span className={styles.backLabel}>Back</span>
          </Link>

          <header className={styles.head}>
            {kind && <p className={styles.kind}>{kind}</p>}
            <h1 className={styles.title}>{title}</h1>
            {lede && (
              <div className={styles.lede} data-plain={plainLede || undefined}>
                {lede}
              </div>
            )}
          </header>

          <div className={bleed ? styles.bleed : undefined}>{children}</div>
        </div>
      </main>
    </>
  );
}
