import type { Metadata } from 'next';

import GameLayout from '@/components/GameLayout/GameLayout';
import Last from '@/components/Last/Last';

export const metadata: Metadata = {
  title: 'Last game before the trip',
  robots: { index: false, follow: false },
};

/**
 * The last one. A title, a button, and three lines behind it — no lede,
 * because anything written above the button would be explaining a joke
 * before telling it.
 */
export default function LastPage() {
  return (
    <GameLayout
      count="last"
      title="Last game before the trip"
      /* A button and three lines — there is nothing here that could ever need
         a second screen, and the default page reserves room under the content
         that would leave her scrolling down to nothing. */
      compact
    >
      <Last />
    </GameLayout>
  );
}
