import type { Metadata } from 'next';

import GameLayout from '@/components/GameLayout/GameLayout';
import Likely from '@/components/Likely/Likely';

export const metadata: Metadata = {
  title: 'Who is more likely to? — Iza in Poland',
  robots: { index: false, follow: false },
};

/**
 * Game one. The questions live in lib/games/who-is-more-likely.ts.
 *
 * No rules and no instructions — it is a question with two faces under it. The
 * only thing above the stack is a nudge to finish, because the good ones are
 * at the bottom and nobody scrolls that far without a reason.
 *
 * The page is a server component and stays one — only the stack of questions
 * has state, so only that ships as JavaScript.
 */
export default function WhoIsMoreLikelyPage() {
  return (
    <GameLayout
      count="likely"
      title="Who is more likely to?"
      lede={
        <>
          <p>
            All of this is about the trip. Poland, the two of us — and what each of
            us thinks is going to happen.
          </p>
          <p>
            {/* Let us find out how much we can predict, and which of us turns out to be right.  */}
            At the end AI reads the answers and works out how well we match.
          </p>
        </>
      }
    >
      <Likely />
    </GameLayout>
  );
}
