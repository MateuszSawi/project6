import type { Metadata } from 'next';

import Book from '@/components/Book/Book';
import GameLayout from '@/components/GameLayout/GameLayout';

export const metadata: Metadata = {
  title: 'Book your trip — Iza in Poland',
  robots: { index: false, follow: false },
};

/**
 * Game three, and the only one that is not a game: the two windows and the
 * flights in them live in lib/games/book-trip.ts, and what she taps here is
 * what I buy.
 *
 * The lede says the price of the tap out loud. Everything else on this site can
 * be played with; this one cannot, and she should know that before she looks at
 * the dates rather than after.
 */
export default function BookTripPage() {
  return (
    <GameLayout
      count="book-trip"
      title="Book your trip"
      /* Facts, not a flourish. She is holding two dates in her head while she
         reads this, so it is set in the readable face rather than the serif
         italic the other games close their lede with. */
      plainLede
      lede={
        <p>
          {/* Both Tuesday to Saturday, both leaving at 13:00, both four nights.
          <br /> */}
          Pick one, confirm the time off at work, and I book the flights.
          <br />
          That one is not a game.
        </p>
      }
    >
      <Book />
    </GameLayout>
  );
}
