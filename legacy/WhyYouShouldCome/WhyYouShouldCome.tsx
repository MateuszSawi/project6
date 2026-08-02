'use client';

import { useMemo, useState } from 'react';
import {
  CigaretteOff,
  Disc3,
  Dumbbell,
  Feather,
  Flame,
  HandHeart,
  Lock,
  PersonStanding,
  ShieldCheck,
  Stamp,
  Wallet,
  Wine,
  type LucideIcon,
} from 'lucide-react';

import styles from './WhyYouShouldCome.module.scss';

type Accent = 'terracotta' | 'sage' | 'ocean' | 'amber';

interface Article {
  id: string;
  /** Roman numeral, printed as the article number. */
  numeral: string;
  title: string;
  /** The pull — what is actually being offered. */
  body: string;
  /** The push — mock-legal small print, where the teasing lives. */
  clause: string;
  icon: LucideIcon;
  accent: Accent;
  /**
   * Binding articles cannot be signed or unsigned. They hold either way,
   * which is rather the point of them.
   */
  binding?: boolean;
}

const ARTICLES: Article[] = [
  {
    id: 'soundtrack',
    numeral: 'I',
    title: 'The Ultimate Beach House Soundtrack',
    body: 'Beach House on repeat, at a volume the car was not designed for. A night drive along the coast with the windows down, and later the same records under an open sky, where they have always belonged.',
    clause:
      'Aux privileges are granted immediately and unconditionally. They are revoked, permanently, the instant anyone skips “Space Song.”',
    icon: Disc3,
    accent: 'ocean',
  },
  {
    id: 'vape',
    numeral: 'II',
    title: 'The Anti-Vape Treaty',
    body: 'The vape does not come. It stays in Poland, in a drawer, for the entire duration of your visit. Not negotiated, not bargained down — simply dropped, because you would prefer it.',
    clause:
      'The undersigned reserves the right to be quietly insufferable about this sacrifice for a total of one hour, non-consecutive.',
    icon: CigaretteOff,
    accent: 'sage',
  },
  {
    id: 'arm',
    numeral: 'III',
    title: 'The Specialized Arm Therapy',
    body: 'You mentioned a sore arm. This has been noted, filed, and taken extremely seriously. Expert relaxing massages are hereby offered for the full weekend, at any hour, until the arm forgets it ever complained.',
    clause:
      'Certified by no recognised institution whatsoever. Offered on request, ended the second you say so, and never mentioned again.',
    icon: HandHeart,
    accent: 'terracotta',
  },
  {
    id: 'climate',
    numeral: 'IV',
    title: 'The Polish Micro-Climate',
    body: 'Baltic evenings turn cold quickly and without warning. Fortunately, the undersigned arrives equipped with a personal thermal system — chest hair of genuinely premium insulating quality, available at no extra charge.',
    clause:
      'Independently rated somewhere between a good wool coat and a small, well-behaved bonfire. Results may vary by wind direction.',
    icon: Flame,
    accent: 'amber',
  },
  {
    id: 'tall',
    numeral: 'V',
    title: 'The Premium Tall-Guy Perks',
    body: 'Standing considerably above the Albanian national average, the undersigned guarantees a front-row view of everything worth seeing. On shoulders, or carried outright, whenever the walking stops being fun.',
    clause:
      'Crowds are not a problem you will be asked to solve. Statistically speaking, you have never had this view before.',
    icon: PersonStanding,
    accent: 'ocean',
  },
  {
    id: 'gym',
    numeral: 'VI',
    title: 'Gym & Gains Masterclass',
    body: 'A private session at his gym, with every training secret handed over free of charge, in the correct order, with terrible form corrected patiently and without laughing.',
    clause:
      'Touching the exhibits is permitted only for very well-behaved visitors. Museum rules. The curator decides, and the curator is easily persuaded.',
    icon: Dumbbell,
    accent: 'terracotta',
  },
  {
    id: 'bond',
    numeral: 'VII',
    title: 'The 100% Comfort & Safety Bond',
    body: 'Your boundaries are sacred. You have your own room and your own key, absolute respect, and zero pressure of any kind — nothing on this page is a debt, and nothing here needs earning. You come as you like, you rest when you like, you say no whenever you like, and it changes nothing. You are returned to Albania safe, sound, and happier than you left.',
    clause:
      'This article is not on offer and cannot be signed away. It holds whether you accept the rest or not, and it holds for a lifetime.',
    icon: ShieldCheck,
    accent: 'ocean',
    binding: true,
  },
  {
    id: 'stars',
    numeral: 'VIII',
    title: 'Stargazing, Wine & Poetry',
    body: 'Your wine — the exact one, bought in advance, not a close approximation. The Polish night sky, which is enormous and unhurried and does not perform for anyone. Poetry read badly out loud, and compliments in a quantity you will find difficult to argue with.',
    clause:
      'Compliments are supplied unprompted and in unlimited volume. Requests are nonetheless honoured immediately and without teasing. Mostly.',
    icon: Wine,
    accent: 'amber',
  },
  {
    id: 'logistics',
    numeral: 'IX',
    title: 'Full Financial & Logistic Sovereignty',
    body: 'Flights, food, trains, hidden places nobody photographs, and dinners far better than the itinerary lets on — all of it covered, one hundred percent, already handled. Your only assignment is a packed bag.',
    clause:
      'Attempts to pay will be met with a quiet, immovable refusal. Persistent attempts will be met with the same refusal, in Polish.',
    icon: Wallet,
    accent: 'sage',
  },
];

const SIGNABLE = ARTICLES.filter((article) => !article.binding);

export default function WhyYouShouldCome() {
  const [signed, setSigned] = useState<Set<string>>(new Set());

  const total = SIGNABLE.length;
  const count = signed.size;
  const complete = count === total;
  const progress = useMemo(() => Math.round((count / total) * 100), [count, total]);

  function toggle(id: string) {
    setSigned((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section
      className={styles.section}
      id="manifesto"
      aria-labelledby="manifesto-title"
    >
      <div className={styles.inner}>
        <div className={styles.certificate} data-complete={complete || undefined}>
          <div className={styles.frame} aria-hidden="true" />

          {/* ---------- Certificate head ---------- */}
          <header className={styles.head}>
            <span className={styles.emblem} aria-hidden="true">
              <Feather size={20} strokeWidth={1.3} />
            </span>

            <p className={styles.eyebrow}>
              Manifesto <span aria-hidden="true">·</span> Nine articles
            </p>

            <h2 className={styles.title} id="manifesto-title">
              Why You Should <em>Come</em>
            </h2>

            <p className={styles.lede}>
              What follows is an official and entirely serious certificate of guarantee,
              drawn up in nine articles, signed in advance, and binding on exactly one of
              the two parties involved. It is not the one holding the pen.
            </p>

            <dl className={styles.issue}>
              <div className={styles.issueRow}>
                <dt>Issued to</dt>
                <dd>The red-haired one, currently nursing a sore arm</dd>
              </div>
              <div className={styles.issueRow}>
                <dt>Issued by</dt>
                <dd>The tall one, building something stubborn in Poland</dd>
              </div>
              <div className={styles.issueRow}>
                <dt>Territory</dt>
                <dd>Gdańsk, Sopot, Gdynia &amp; the whole Baltic coast</dd>
              </div>
            </dl>
          </header>

          {/* ---------- Articles ---------- */}
          <ol className={styles.articles}>
            {ARTICLES.map((article) => {
              const Icon = article.icon;
              const isSigned = signed.has(article.id);

              return (
                <li
                  className={article.binding ? styles.bond : styles.card}
                  key={article.id}
                  data-accent={article.accent}
                  data-signed={isSigned || undefined}
                >
                  <div className={styles.cardHead}>
                    <p className={styles.numeral}>
                      Article <span>{article.numeral}</span>
                    </p>
                    <span className={styles.icon} aria-hidden="true">
                      <Icon size={19} strokeWidth={1.4} />
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{article.title}</h3>
                  <p className={styles.cardBody}>{article.body}</p>

                  <p className={styles.clause}>
                    <span className={styles.clauseLabel}>Small print</span>
                    {article.clause}
                  </p>

                  <div className={styles.cardFoot}>
                    {article.binding ? (
                      <p className={styles.bindingBadge}>
                        <Lock size={13} strokeWidth={1.6} aria-hidden="true" />
                        Binding · not up for negotiation
                      </p>
                    ) : (
                      <button
                        type="button"
                        className={styles.sign}
                        aria-pressed={isSigned}
                        onClick={() => toggle(article.id)}
                      >
                        <span className={styles.signBox} aria-hidden="true" />
                        {isSigned ? 'Accepted' : 'Accept this article'}
                      </button>
                    )}
                  </div>

                  {!article.binding && (
                    <span className={styles.stamp} aria-hidden="true">
                      Accepted
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {/* ---------- Signature block ---------- */}
          <footer className={styles.foot}>
            <div className={styles.progress}>
              <div className={styles.progressHead}>
                <p className={styles.progressLabel}>
                  Articles accepted
                  <span className={styles.progressCount}>
                    {String(count).padStart(2, '0')}
                    <span aria-hidden="true"> / </span>
                    {String(total).padStart(2, '0')}
                  </span>
                </p>

                {count > 0 && (
                  <button
                    type="button"
                    className={styles.reset}
                    onClick={() => setSigned(new Set())}
                  >
                    Tear it up, start again
                  </button>
                )}
              </div>

              <div
                className={styles.track}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={count}
                aria-label="Articles accepted"
              >
                <span
                  className={styles.fill}
                  style={{ transform: `scaleX(${count / total})` }}
                />
              </div>

              <p className={styles.progressNote} role="status" aria-live="polite">
                {complete
                  ? 'Signed, sealed, and still entirely non-binding on your part. The invitation stands either way.'
                  : `${total - count} article${total - count === 1 ? '' : 's'} still awaiting your approval. Take your time. Article VII holds regardless.`}
              </p>
            </div>

            <div className={styles.signature}>
              <div className={styles.signatureLine}>
                <p className={styles.signatureName}>Signed in advance</p>
                <p className={styles.signatureMeta}>
                  Rumia, Pomerania <span aria-hidden="true">·</span> Valid until you say
                  otherwise
                </p>
              </div>

              <span className={styles.seal} data-complete={complete || undefined}>
                <Stamp size={22} strokeWidth={1.3} aria-hidden="true" />
                <span className={styles.sealText}>
                  {complete ? 'Sealed' : 'Awaiting'}
                </span>
              </span>
            </div>
          </footer>
        </div>
      </div>
    </section>
  );
}
