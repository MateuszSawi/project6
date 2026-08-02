'use client';

import type { CSSProperties } from 'react';
import {
  CigaretteOff,
  Flame,
  HandHeart,
  HeartHandshake,
  HeartPulse,
  KeyRound,
  Languages,
  MoreHorizontal,
  PersonStanding,
  ShieldCheck,
  Thermometer,
  Volume2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

import { TERMS, type TermIcon } from '@/lib/content';
import { useInView } from '@/lib/useInView';

import styles from './Terms.module.scss';

const ICONS: Record<TermIcon, LucideIcon> = {
  key: KeyRound,
  vape: CigaretteOff,
  hands: HandHeart,
  sound: Volume2,
  tall: PersonStanding,
  wallet: Wallet,
  language: Languages,
  candle: Flame,
  warm: Thermometer,
  care: HeartHandshake,
  heart: HeartPulse,
  more: MoreHorizontal,
  shield: ShieldCheck,
};

const PROMISES = TERMS.filter((term) => !term.grave);
const GRAVE = TERMS.find((term) => term.grave);

/**
 * The reasons. Nine promises, and one statement that is not one of them —
 * pulled out of the grid entirely so it can never read as part of the bit.
 */
export default function Terms() {
  const [ref, inView] = useInView<HTMLElement>({ threshold: 0.1 });
  const GraveIcon = GRAVE ? ICONS[GRAVE.icon] : null;

  return (
    <section
      className={styles.section}
      id="terms"
      ref={ref}
      data-shown={inView || undefined}
      aria-labelledby="terms-title"
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 className={styles.title} id="terms-title">
            Why you should <em>come</em>
          </h2>
        </header>

        <ul className={styles.list}>
          {PROMISES.map((term, i) => {
            const Icon = ICONS[term.icon];

            return (
              <li
                className={styles.term}
                key={term.id}
                data-wide={term.wide || undefined}
                style={{ '--i': i } as CSSProperties}
              >
                <span className={styles.icon} aria-hidden="true">
                  <Icon size={17} strokeWidth={1.4} />
                </span>

                <div className={styles.text}>
                  <p className={styles.line}>{term.line}</p>
                  {term.sub && <p className={styles.sub}>{term.sub}</p>}
                </div>
              </li>
            );
          })}
        </ul>

        {GRAVE && GraveIcon && (
          <aside
            className={styles.grave}
            style={{ '--i': PROMISES.length } as CSSProperties}
            aria-label="The one that is not a joke"
          >
            <span className={styles.graveIcon} aria-hidden="true">
              <GraveIcon size={24} strokeWidth={1.3} />
            </span>

            <p className={styles.graveLine}>{GRAVE.line}</p>

            <div className={styles.graveBody}>
              {GRAVE.lines?.map((line, i) => (
                <p
                  className={styles.graveText}
                  key={line}
                  data-last={i === (GRAVE.lines?.length ?? 0) - 1 || undefined}
                >
                  {line}
                </p>
              ))}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
