import type { Metadata } from 'next';

import GameLayout from '@/components/GameLayout/GameLayout';
import Upgrade from '@/components/Upgrade/Upgrade';

export const metadata: Metadata = {
  title: 'Upgrade your trip — Iza in Poland',
  robots: { index: false, follow: false },
};

/**
 * Game four. The five categories and their tiles live in
 * lib/games/upgrade-trip.ts.
 *
 * The lede is two words long on purpose. Everything this game has to explain is
 * explained by the grid — she taps a tile, it lights, and the next tap does not
 * take the first one away.
 */
export default function UpgradeTripPage() {
  return (
    <GameLayout
      count="upgrade-trip"
      // kind="Free of charge"
      title="Upgrade your trip to Poland"
      compact
      lede={
        <>
          <p>
            {/* No limits, no expiry. */}
          </p>
        </>
      }
    >
      <Upgrade />
    </GameLayout>
  );
}
