import type { Metadata } from 'next';

import GameLayout from '@/components/GameLayout/GameLayout';
import Progress from '@/components/Runner/Progress';
import Runner from '@/components/Runner/Runner';

export const metadata: Metadata = {
  title: 'Iza on her way to Poland',
  robots: { index: false, follow: false },
};

/**
 * The runner. Nothing links here yet — it is reached by typing the address.
 *
 * The road is the point rather than the score, so the counter is in kilometres
 * and the bar runs from Tirana to Gdańsk. Tuning, the milestone lines and the
 * record all live in lib/games/runner.ts.
 */
export default function RunnerPage() {
  return (
    <GameLayout
      count="runner"
      title="Iza on her way to Poland"
      /* The second half of the line is a client component and arrives a moment
         after the first — it is reading the record out of Supabase. Until it
         does, and forever on a build with no database, the sentence is simply
         the sentence. */
      lede={
        <p>
          Come to me. Jump over everything in your way.
          <br/>
          <Progress />
        </p>
      }
      /* The road is the only thing on this page that gets wider for it. */
      bleed
    >
      <Runner />
    </GameLayout>
  );
}
