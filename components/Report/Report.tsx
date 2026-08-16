'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { MessageCircle, Sparkles } from 'lucide-react';

import Frame from '@/components/Frame/Frame';
import { PLAYERS, type Side } from '@/lib/games/who-is-more-likely';
import { whatsappLink } from '@/lib/whatsapp';

import styles from './Report.module.scss';

/**
 * Reading a verdict is not doing anything, so the report ends with the one
 * thing that is: a chat with the message already typed and unsent.
 *
 * Double quotes because the message carries a plain apostrophe of its own:
 * this is going into WhatsApp, not onto the page.
 */
const MESSAGE =
  "Cool game, but you'll have to try harder to prove you deserve a sexy goddess like me. Call me tonight.";

const WHATSAPP = whatsappLink(MESSAGE);

/**
 * The machine's rulings. The winner never changes — these are not findings,
 * they are things I wanted said out loud by something that sounds objective.
 */
const FINDINGS: Array<{ id: string; label: string; winner: Side }> = [
  { id: 'survive', label: 'Less likely to survive the trip', winner: 'mateusz' },
  // { id: 'scene', label: 'Better kisser', winner: 'mateusz' },
  { id: 'romantic', label: 'More romantic of the two', winner: 'mateusz' },
  { id: 'pretending', label: 'Lying about not giving a fuck', winner: 'iza' },
  { id: 'danger', label: 'In more danger around the other', winner: 'mateusz' },
  { id: 'missing', label: 'Missing the other one more', winner: 'iza' },
  { id: 'date', label: 'Better looking on our date in Poland', winner: 'iza' },
];

interface Bar {
  id: string;
  label: string;
  value: number;
}

interface Analysis {
  bars: Bar[];
  compatibility: number;
  /** Absent when VERDICTS is empty. */
  verdict?: string;
}

/** Inclusive, and always generous — the machine is on our side. */
function between(low: number, high: number) {
  return low + Math.floor(Math.random() * (high - low + 1));
}

function pick<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

/* Empty is allowed: the line under the number simply does not appear. */
const VERDICTS: string[] = [
  // 'You are not going to like how high this is.',
  // 'The machine has seen worse. It has never seen better.',
];

/* Shown while the "analysis" runs. Which one appears depends only on how far
   the counter has got, so the messages and the number can never disagree. */
const STAGES: Array<[number, string]> = [
  [0, 'Reading your answers…'],
  [20, 'Comparing answers…'],
  [40, 'Measuring what you lied about…'],
  [60, 'Checking this twice…'],
  [80, 'Almost there, Izabela…'],
];

/**
 * Milliseconds between steps of the counter. With a random 1–4% jump each
 * time, the whole analysis runs ~2.2s — anywhere from 1.7s to 2.9s, which is
 * the point: a machine that always takes exactly the same time is a machine
 * that is not thinking. Raise this to slow the whole thing down; nothing else
 * controls the duration.
 */
const TICK = 55;

function build(): Analysis {
  return {
    bars: [
      { id: 'hot', label: 'Sexiness of the pair', value: between(100, 100) },
      { id: 'bed', label: 'Odds of sleeping in one bed', value: between(91, 97) },
    ],
    compatibility: between(95, 99),
    verdict: VERDICTS.length ? pick(VERDICTS) : undefined,
  };
}

export default function Report() {
  const [percent, setPercent] = useState(0);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  /** Flipped a frame after the report appears, so the bars grow from nothing. */
  const [grown, setGrown] = useState(false);
  const timer = useRef(0);

  const run = useCallback(() => {
    window.clearInterval(timer.current);

    /* Reduced motion gets the answer, not the performance of it. */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPercent(100);
      setAnalysis(build());
      setGrown(true);
      return;
    }

    timer.current = window.setInterval(() => {
      setPercent((current) => {
        /* Uneven steps — a perfectly linear progress bar reads as a fake, and
           this one has to read as a machine actually chewing on something. */
        const next = Math.min(100, current + between(1, 4));
        if (next === 100) {
          window.clearInterval(timer.current);
          setAnalysis(build());
        }
        return next;
      });
    }, TICK);
  }, []);

  useEffect(() => {
    run();
    return () => window.clearInterval(timer.current);
  }, [run]);

  /* One frame after the numbers exist, so the transition has a start value. */
  useEffect(() => {
    if (!analysis || grown) return;
    const frame = window.requestAnimationFrame(() => setGrown(true));
    return () => window.cancelAnimationFrame(frame);
  }, [analysis, grown]);

  if (!analysis) {
    return (
      <div className={styles.working} role="status" aria-live="polite">
        <span className={styles.workingMark} aria-hidden="true">
          <Sparkles size={18} strokeWidth={1.5} />
        </span>

        <p className={styles.workingLabel}>Analysing Iza's answers</p>

        <p className={styles.percent}>
          {percent}
          <span aria-hidden="true">%</span>
        </p>

        <span className={styles.workingTrack} aria-hidden="true">
          <span className={styles.workingFill} style={{ '--p': percent } as CSSProperties} />
        </span>

        <p className={styles.stage}>
          {[...STAGES].reverse().find(([at]) => percent >= at)?.[1]}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.report} data-grown={grown || undefined}>
      <section className={styles.block}>
        {/* <h3 className={styles.blockTitle}>Individually</h3> */}

        <ol className={styles.findings}>
          {FINDINGS.map((finding, i) => {
            const player = PLAYERS.find((candidate) => candidate.id === finding.winner);

            return (
              <li
                className={styles.finding}
                key={finding.id}
                style={{ '--i': i } as CSSProperties}
              >
                <p className={styles.findingLabel}>{finding.label}</p>

                {player && (
                  <span className={styles.winner}>
                    <Frame
                      className={styles.winnerFace}
                      src={player.src}
                      alt=""
                      grade="none"
                      focus={player.focus}
                    />
                    <span className={styles.winnerName}>{player.name}</span>
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      <ol className={styles.bars}>
        {analysis.bars.map((bar, i) => (
          <li
            className={styles.bar}
            key={bar.id}
            style={{ '--i': i + FINDINGS.length, '--v': bar.value } as CSSProperties}
          >
            <div className={styles.barHead}>
              <span className={styles.barLabel}>{bar.label}</span>
              <span className={styles.barValue}>{bar.value}%</span>
            </div>

            <span className={styles.barTrack} aria-hidden="true">
              <span className={styles.barFill} />
            </span>
          </li>
        ))}
      </ol>

      <div className={styles.verdict}>
        <p className={styles.verdictLabel}>Compatibility</p>

        <p className={styles.verdictNumber}>
          {analysis.compatibility}
          <span className={styles.verdictUnit} aria-hidden="true">
            %
          </span>
        </p>

        {analysis.verdict && <p className={styles.verdictLine}>{analysis.verdict}</p>}
      </div>

      <p className={styles.required}>Confirmation requires live testing in Poland.</p>

      <a className={styles.reply} href={WHATSAPP} target="_blank" rel="noopener noreferrer">
        <MessageCircle size={15} strokeWidth={2} />
        <span className={styles.replyLabel}>Click me</span>

        <span className={styles.sparks} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      </a>
    </div>
  );
}
