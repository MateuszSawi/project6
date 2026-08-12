import Arrival from '@/components/Arrival/Arrival';
import Atmosphere from '@/components/Atmosphere/Atmosphere';
import Candles from '@/components/Candles/Candles';
import SvgFilters from '@/components/Filters/SvgFilters';
import Games from '@/components/Games/Games';
import Ignition from '@/components/Ignition/Ignition';
import Invitation from '@/components/Invitation/Invitation';
import Notice from '@/components/Notice/Notice';
import Places from '@/components/Places/Places';
import Terms from '@/components/Terms/Terms';
import Visit from '@/components/Visit/Visit';

import styles from './page.module.scss';

export default function Page() {
  return (
    <>
      <Visit name="home" />
      <SvgFilters />
      <Atmosphere />

      {/* One line, once per phone, when something new has been added. */}
      <Notice />

      <Ignition />

      <main className={styles.room}>
        <Arrival />
        {/* Terms sits directly after Arrival — it is what "see why you should
            come" points at, so it has to be the very next thing. */}
        <Terms />
        {/* The shelf pins itself and burns through, then hands over to the grid. */}
        <Candles />
        <Places />
        <Invitation />
        {/* Last, and the only unfinished part of the page on purpose: the
            month of waiting, one new game at a time. */}
        <Games />
      </main>
    </>
  );
}
