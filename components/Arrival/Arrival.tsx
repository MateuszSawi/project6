import { ArrowDown } from 'lucide-react';

import Backdrop from '@/components/Backdrop/Backdrop';
import { BACKDROP } from '@/lib/content';

import styles from './Arrival.module.scss';

/** Her entire workload, in full. */
const DUTIES = [
  'Get on the plane.',
  'Pack the best dress you own.',
  'Look as perfect as you always do.',
  'Bring your amazing energy.'
];

export default function Arrival() {
  return (
    <section className={styles.section} id="arrival" aria-labelledby="arrival-title">
      <Backdrop images={BACKDROP} className={styles.stage} focus="50% 58%" />
      <span className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <h2 className={styles.title} id="arrival-title">
          <span className={styles.titleTop}>You. Coming to me.</span>
          <em className={styles.titleBottom}>To Poland.</em>
        </h2>

        <p className={styles.body}>
          Flights, food, tickets, dinners — all booked, all paid for, everything is on me.<br/>
          You get your own room and your own key. You decide who comes in and when.<br/>
          From the moment you land your safety and comfort are my responsibility.
        </p>

        <p className={styles.jobLead}>
          I take care of everything. But you have responsibilities too:
        </p>

        <ol className={styles.job}>
          {DUTIES.map((duty, i) => (
            <li className={styles.duty} key={duty}>
              <span className={styles.dutyIndex} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.dutyText}>{duty}</span>
            </li>
          ))}
        </ol>

        <a className={styles.more} href="#terms">
          <span className={styles.moreLabel}>See why you should come</span>
          <ArrowDown size={18} strokeWidth={1.6} aria-hidden="true" />

          {/* Embers drifting off the edges. Decorative, five of them. */}
          <span className={styles.sparks} aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </span>
        </a>
      </div>
    </section>
  );
}
