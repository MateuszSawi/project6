import type { Metadata } from 'next';

import GameLayout from '@/components/GameLayout/GameLayout';
import Guide from '@/components/Guide/Guide';

export const metadata: Metadata = {
  title: 'A guide to keeping Iza happy',
  robots: { index: false, follow: false },
};

/**
 * Game two. The sections, the questions and my lines back all live in
 * lib/games/guide.ts.
 *
 * The page itself is only the poster — everything else happens inside a deck
 * that takes the whole screen, so there is nothing here to explain beyond what
 * she is about to be asked for.
 */
export default function GuidePage() {
  return (
    <GameLayout
      count="guide"
      title="A guide to keeping Iza happy"
      /* One question at a time, and each one has to clear a phone screen
         without a scroll — so the title above it gives up some of its room. */
      compact
      lede={
        <>
          <p>
            Whatever you tap, will happen.
          </p>
        </>
      }
    >
      <Guide />
    </GameLayout>
  );
}
