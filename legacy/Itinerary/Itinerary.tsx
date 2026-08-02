import {
  Anchor,
  Castle,
  Footprints,
  Gem,
  Music2,
  Trees,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import Reveal from '@/components/Reveal/Reveal';
import { STOPS, type IconName } from '@/lib/itinerary';

import styles from './Itinerary.module.scss';

/* Icons are resolved here rather than in the data module: they are components,
   and components cannot cross the server/client boundary as props. */
const ICONS: Record<IconName, LucideIcon> = {
  organ: Music2,
  sea: Waves,
  amber: Gem,
  sand: Footprints,
  castle: Castle,
  alpaca: Trees,
  harbour: Anchor,
};

export default function Itinerary() {
  return (
    <section className={styles.section} id="itinerary" aria-labelledby="itinerary-title">
      <div className={styles.inner}>
        <Reveal as="header" className={styles.head}>
          <p className={styles.eyebrow}>
            <span className={styles.rule} aria-hidden="true" />
            The itinerary · Seven movements
          </p>
          <h2 className={styles.title} id="itinerary-title">
            Seven places, arranged <em>like stanzas</em>
          </h2>
          <p className={styles.intro}>
            Nothing here is compulsory. If a morning wants to become slower, it becomes
            slower — the order simply holds the weekend together, the way a frame holds a
            painting without ever being the point of it.
          </p>
        </Reveal>

        <ol className={styles.list}>
          {STOPS.map((stop, i) => {
            const Icon = ICONS[stop.icon];

            return (
              <Reveal
                as="li"
                key={stop.id}
                className={styles.item}
                delay={Math.min(i, 3) * 70}
              >
                <article className={styles.entry} data-accent={stop.accent} id={stop.id}>
                  <div className={styles.marker} aria-hidden="true">
                    <span className={styles.index}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className={styles.node}>
                      <Icon size={16} strokeWidth={1.4} />
                    </span>
                  </div>

                  <div className={styles.content}>
                    <p className={styles.when}>{stop.when}</p>
                    <h3 className={styles.entryTitle}>{stop.title}</h3>
                    <p className={styles.place}>{stop.place}</p>
                    <p className={styles.body}>{stop.body}</p>
                    <p className={styles.note}>{stop.note}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ol>

        <Reveal className={styles.coda}>
          <p>
            Seven places, two days, and a great deal of unhurried air in between.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
