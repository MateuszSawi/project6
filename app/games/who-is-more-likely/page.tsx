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
      title="Who is more likely to?"
      lede={
        <>
          <p>
            The questions are getting better and better.
          </p>
          <p>
            So go through all of them until you finish.
          </p>
        </>
      }
    >
      <Likely />
    </GameLayout>
  );
}
