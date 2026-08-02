import Arrival from '@/components/Arrival/Arrival';
import Atmosphere from '@/components/Atmosphere/Atmosphere';
import Candles from '@/components/Candles/Candles';
import SvgFilters from '@/components/Filters/SvgFilters';
import Ignition from '@/components/Ignition/Ignition';
import Invitation from '@/components/Invitation/Invitation';
import Places from '@/components/Places/Places';
import Terms from '@/components/Terms/Terms';

import styles from './page.module.scss';

export default function Page() {
  return (
    <>
      <SvgFilters />
      <Atmosphere />

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
      </main>
    </>
  );
}
