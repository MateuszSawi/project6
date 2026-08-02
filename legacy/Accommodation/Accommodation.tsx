import { BedDouble, Coffee, DoorClosed, MapPin, ShieldCheck, Train } from 'lucide-react';

import Reveal from '@/components/Reveal/Reveal';

import styles from './Accommodation.module.scss';

const COMFORTS = [
  {
    icon: DoorClosed,
    title: 'A room that is entirely yours',
    body: 'Your own private room, your own door, your own key. Nobody passes through it, and nobody knocks unless you ask them to.',
  },
  {
    icon: ShieldCheck,
    title: 'One hundred percent privacy',
    body: 'Complete privacy is the premise of this weekend, not a feature of it. Your space, your hours, your silence.',
  },
  {
    icon: BedDouble,
    title: 'Quiet, warm, and unhurried',
    body: 'Soft light, clean linen, and a household that keeps its voice down in the morning. Sleep as late as the day allows.',
  },
  {
    icon: Coffee,
    title: 'Mornings at your own pace',
    body: 'Coffee waiting whenever you surface. No schedule begins until you decide it has.',
  },
] as const;

export default function Accommodation() {
  return (
    <section
      className={styles.section}
      id="sanctuary"
      aria-labelledby="sanctuary-title"
    >
      <div className={styles.inner}>
        <div className={styles.grid}>
          <Reveal as="header" from="left" className={styles.head}>
            <p className={styles.eyebrow}>
              <span className={styles.rule} aria-hidden="true" />
              Your sanctuary · Rumia
            </p>

            <h2 className={styles.title} id="sanctuary-title">
              A quiet room, <em>kept for you</em>
            </h2>

            <p className={styles.lede}>
              You will stay in Rumia — a calm town at the edge of the Tricity, ten
              minutes from the trains that thread the whole coast together. It is the
              still point the weekend returns to each evening.
            </p>

            <p className={styles.body}>
              Everything about the stay has been arranged around one idea: that you
              should be able to close a door and be completely alone whenever you want
              to be. Come back late, come back early, come back quiet. The room does not
              have an opinion.
            </p>

            <p className={styles.pledge}>
              <span className={styles.pledgeMark} aria-hidden="true">
                “
              </span>
              Total privacy, total comfort, and not a single arrangement left for you to
              make.
            </p>
          </Reveal>

          <Reveal className={styles.panel}>
            <div className={styles.plate}>
              <MapPin size={15} strokeWidth={1.5} aria-hidden="true" />
              <span>Rumia · Tricity, Pomerania</span>
            </div>

            <ul className={styles.comforts}>
              {COMFORTS.map(({ icon: Icon, title, body }) => (
                <li className={styles.comfort} key={title}>
                  <span className={styles.comfortIcon} aria-hidden="true">
                    <Icon size={17} strokeWidth={1.4} />
                  </span>
                  <div>
                    <h3 className={styles.comfortTitle}>{title}</h3>
                    <p className={styles.comfortBody}>{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className={styles.transit}>
              <Train size={15} strokeWidth={1.5} aria-hidden="true" />
              <span>
                Gdynia in twelve minutes, Gdańsk in thirty-five — every departure already
                checked.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
