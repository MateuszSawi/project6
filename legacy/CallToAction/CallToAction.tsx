'use client';

import { useId, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Mail } from 'lucide-react';

import styles from './CallToAction.module.scss';

/** Where the answer goes. Change to your own address. */
const CONTACT_EMAIL = 'hello@example.com';

interface WeekendOption {
  id: string;
  label: string;
  /** Machine-readable range for <time dateTime>. */
  range: string;
  month: string;
  hint: string;
}

const WEEKENDS: WeekendOption[] = [
  {
    id: '2026-08-08',
    label: '8 – 9',
    range: '2026-08-08/2026-08-09',
    month: 'August',
    hint: 'The soonest. Long light, warm sea.',
  },
  {
    id: '2026-08-15',
    label: '15 – 16',
    range: '2026-08-15/2026-08-16',
    month: 'August',
    hint: 'Mid-month, and quieter on the coast.',
  },
  {
    id: '2026-08-22',
    label: '22 – 23',
    range: '2026-08-22/2026-08-23',
    month: 'August',
    hint: 'Cathedral recitals at their fullest.',
  },
  {
    id: '2026-08-29',
    label: '29 – 30',
    range: '2026-08-29/2026-08-30',
    month: 'August',
    hint: 'The last of the summer, gone gold.',
  },
];

export default function CallToAction() {
  const groupId = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<WeekendOption | null>(null);

  const choice = WEEKENDS.find((w) => w.id === selected) ?? null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (choice) setConfirmed(choice);
  }

  const mailto = confirmed
    ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
        'Gdańsk weekend — my answer',
      )}&body=${encodeURIComponent(
        `I choose the weekend of ${confirmed.label} ${confirmed.month}.`,
      )}`
    : '#';

  return (
    <section className={styles.section} id="choose" aria-labelledby="choose-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>
          <span className={styles.rule} aria-hidden="true" />
          One small decision
        </p>

        <h2 className={styles.title} id="choose-title">
          Choose your <em>weekend</em>
        </h2>

        <p className={styles.lede}>
          Any of these four will do — the trains, the room and the route are ready for all
          of them. All that is missing is which one. Before the 5th of September, whenever
          you know.
        </p>

        {/* Live region: announces the confirmation swap to screen readers. */}
        <p className="visuallyHidden" role="status" aria-live="polite">
          {confirmed
            ? `Weekend of ${confirmed.label} ${confirmed.month} selected.`
            : 'No weekend selected yet.'}
        </p>

        {confirmed ? (
          <div className={styles.done}>
            <span className={styles.doneMark} aria-hidden="true">
              <Check size={20} strokeWidth={1.5} />
            </span>

            <p className={styles.doneKicker}>Then it is settled.</p>

            <p className={styles.doneDate}>
              <time dateTime={confirmed.range}>
                {confirmed.label} {confirmed.month}
              </time>
            </p>

            <p className={styles.doneBody}>
              The coast will be waiting, and so will the room. Send this along and there is
              nothing else for you to arrange.
            </p>

            <div className={styles.doneActions}>
              <a className={styles.primary} href={mailto}>
                <Mail size={16} strokeWidth={1.5} aria-hidden="true" />
                Send my answer
                <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </a>

              <button
                type="button"
                className={styles.ghost}
                onClick={() => setConfirmed(null)}
              >
                Choose a different weekend
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <fieldset className={styles.fieldset}>
              <legend className="visuallyHidden">Available weekends</legend>

              <div className={styles.options}>
                {WEEKENDS.map((weekend) => {
                  const inputId = `${groupId}-${weekend.id}`;
                  const isActive = selected === weekend.id;

                  return (
                    <div className={styles.option} key={weekend.id}>
                      <input
                        className={styles.input}
                        type="radio"
                        name={`${groupId}-weekend`}
                        id={inputId}
                        value={weekend.id}
                        checked={isActive}
                        onChange={() => setSelected(weekend.id)}
                      />
                      <label className={styles.card} htmlFor={inputId}>
                        <span className={styles.cardMonth}>{weekend.month}</span>
                        <span className={styles.cardDate}>
                          <time dateTime={weekend.range}>{weekend.label}</time>
                        </span>
                        <span className={styles.cardHint}>{weekend.hint}</span>
                        <span className={styles.cardTick} aria-hidden="true">
                          <Check size={13} strokeWidth={2} />
                        </span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className={styles.actions}>
              <button type="submit" className={styles.primary} disabled={!choice}>
                {choice ? `Choose ${choice.label} ${choice.month}` : 'Select a weekend'}
                <ArrowUpRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </button>

              <p className={styles.deadline}>
                <time dateTime="2026-09-05">Before 5 September</time> — no rush before
                then.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
