/**
 * Game two — A guide to keeping Iza happy in Poland.
 *
 * Not a quiz. She is not guessing at anything and there is nothing to get
 * right: every tap is an instruction, and the trip is what comes out of the
 * other end. Which is why it runs one question at a time — she never sees the
 * next one before answering this one.
 *
 * `id` is what lands in the database, on both the question and the option:
 * a row is `guide` / question id, and its value is an option id. Change any
 * wording you like; never change an id she has already answered.
 *
 * `icon` is a lucide-react export name, resolved in Guide.tsx — importing the
 * icons here would drag the whole set into anything that only wants the words.
 *
 * The sections do not get slides of their own. They are still the structure —
 * the order of the questions is their order, and each question says which one
 * it belongs to — but a card that only announced a title was a screen she had
 * to tap through to reach the thing she came for.
 */

export interface Option {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  text: string;
  /** A lucide-react export name. */
  icon: string;
  /** Two to six. The screen lays them out to fit whatever it is given. */
  options: Option[];
}

export interface Section {
  id: string;
  /** Set small above the question, so she always knows which part she is in. */
  title: string;
  icon: string;
  questions: Question[];
}

export const SECTIONS: Section[] = [
  {
    id: 'morning',
    title: 'Morning',
    icon: 'Sunrise',
    questions: [
      {
        id: 'breakfast',
        icon: 'Croissant',
        text: 'Breakfast?',
        options: [
          { id: 'bed', label: 'Breakfast in bed' },
          { id: 'cafe', label: 'Café in Gdańsk' },
          { id: 'skip', label: 'Skip breakfast, sleep longer' },
        ],
      },
      {
        id: 'morning-drink',
        icon: 'Coffee',
        text: 'First drink of the day?',
        options: [
          { id: 'coffee', label: 'Coffee' },
          { id: 'tea', label: 'Tea' },
          { id: 'energy', label: 'Energy drink' },
          { id: 'wine', label: 'Wine' },
        ],
      },
      {
        id: 'wake',
        icon: 'AlarmClock',
        text: 'How early are we waking up?',
        options: [
          { id: '8', label: '8:00' },
          { id: '9', label: '9:00' },
          { id: '10', label: '10:00' },
          { id: 'sleep', label: 'Shut up, I want to sleep' },
        ],
      },
    ],
  },

  {
    id: 'day',
    title: 'Day',
    icon: 'Sun',
    questions: [
      {
        id: 'transport',
        icon: 'Car',
        text: 'Which transport are you picking?',
        options: [
          { id: 'car', label: 'Car' },
          { id: 'shoulders', label: 'Mateusz’s shoulders' },
        ],
      },
      {
        id: 'planning',
        icon: 'Map',
        text: 'How planned should the trip be?',
        options: [
          { id: 'planned', label: 'Everything planned' },
          { id: 'chaos', label: 'Crazy chaos' },
          { id: 'half', label: '50 / 50' },
        ],
      },
      {
        id: 'vibe',
        icon: 'Sparkles',
        text: 'Pick the vibe:',
        options: [
          { id: 'romantic', label: 'Romantic and irresponsible' },
          { id: 'boring', label: 'Boring and responsible' },
        ],
      },
      {
        id: 'rain',
        icon: 'CloudRain',
        text: 'Weather is terrible. What now?',
        options: [
          { id: 'movie', label: 'Movie' },
          { id: 'gallery', label: 'Art gallery' },
          { id: 'cafe', label: 'Café hopping' },
          { id: 'massage', label: 'Massage by candlelight all day long' },
        ],
      },
      {
        id: 'spontaneous',
        icon: 'Dices',
        text: 'One spontaneous thing:',
        options: [
          { id: 'drive', label: 'Drive somewhere without a plan' },
          { id: 'buy', label: 'Buy something stupid' },
          { id: 'restaurant', label: 'Random restaurant that Iza chooses' },
        ],
      },
    ],
  },

  {
    id: 'food',
    title: 'Food',
    icon: 'UtensilsCrossed',
    questions: [
      {
        id: 'cook',
        icon: 'ChefHat',
        text: 'Who cooks?',
        options: [
          { id: 'iza', label: 'Iza' },
          { id: 'mateusz', label: 'Mateusz' },
          { id: 'together', label: 'Together' },
          { id: 'order', label: 'We’re ordering' },
          { id: 'restaurant', label: 'Take me to a nice restaurant' },
        ],
      },
      {
        id: 'dinner',
        icon: 'Soup',
        text: 'What’s for dinner?',
        options: [
          { id: 'shrimps', label: 'Shrimps' },
          { id: 'pasta', label: 'Pasta' },
          { id: 'sushi', label: 'Sushi' },
          { id: 'pierogi', label: 'Polish food — pierogi' },
        ],
      },
      {
        id: 'dessert',
        icon: 'CakeSlice',
        text: 'What’s for dessert?',
        options: [
          { id: 'cake', label: 'Cake' },
          { id: 'icecream', label: 'Ice cream' },
          { id: 'polish', label: 'Polish dessert' },
          { id: 'iza', label: 'Izabela' },
        ],
      },
    ],
  },

  {
    id: 'evening',
    title: 'Evening',
    icon: 'Moon',
    questions: [
      {
        id: 'sunset',
        icon: 'Sunset',
        text: 'Where are we watching the sunset?',
        options: [
          { id: 'beach', label: 'Beach' },
          { id: 'rooftop', label: 'Rooftop' },
          { id: 'outdoor', label: 'Somewhere outdoor' },
          { id: 'surprise', label: 'Surprise me, I’m on vacation' },
        ],
      },
      {
        id: 'evening-drink',
        icon: 'Martini',
        text: 'Evening drink?',
        options: [
          { id: 'wine', label: 'Wine' },
          { id: 'cocktails', label: 'Cocktails' },
          { id: 'beer', label: 'Beer' },
          { id: 'water', label: 'Water' },
        ],
      },
      {
        id: 'movie',
        icon: 'Clapperboard',
        text: 'Movie type?',
        options: [
          { id: 'horror', label: 'Horror' },
          { id: 'comedy', label: 'Comedy' },
          { id: 'romance', label: 'Romance' },
          { id: 'sad', label: 'Sad movie' },
        ],
      },
      {
        id: 'music',
        icon: 'Music',
        text: 'Who’s picking the music?',
        options: [
          { id: 'iza', label: 'DJ Iza' },
          { id: 'mateusz', label: 'DJ Mateusz' },
          { id: 'laughing', label: 'Can’t hear the music over Iza’s laughing' },
        ],
      },
      {
        id: 'date',
        icon: 'CalendarHeart',
        /* The one question with a single option. It is not a choice and was
           never written as one — it is one demand in two sentences, and the
           only thing to do with it is tap it. */
        text: 'Where are we going on the date?',
        options: [
          {
            id: 'your-job',
            label:
              'I don’t give a fuck, it’s your job to plan a date. Prove yourself to me.',
          },
        ],
      },
    ],
  },

  {
    id: 'important',
    title: 'Important matters',
    icon: 'Gem',
    questions: [
      {
        id: 'temperature',
        icon: 'Thermometer',
        text: 'Sleeping temperature?',
        options: [
          { id: 'arctic', label: 'Arctic' },
          { id: 'normal', label: 'Normal' },
          { id: 'albanian', label: 'Albanian summer' },
        ],
      },
      {
        id: 'blanket',
        icon: 'BedDouble',
        text: 'Blanket policy?',
        options: [
          { id: 'separate', label: 'Separate' },
          { id: 'share', label: 'Share' },
          { id: 'steal', label: 'Iza steals it anyway' },
        ],
      },
      {
        id: 'compliments',
        icon: 'HeartHandshake',
        text: 'How much am I complimenting you?',
        options: [
          { id: 'lots', label: 'Lots of compliments for Iza' },
          { id: 'more', label: 'More and more compliments for Iza' },
        ],
      },
    ],
  },

  {
    id: 'trip',
    title: 'The trip',
    icon: 'Plane',
    questions: [
      {
        id: 'first-evening',
        icon: 'Popcorn',
        text: 'First evening should be:',
        options: [
          { id: 'restaurant', label: 'Nice restaurant' },
          { id: 'cooking', label: 'Cooking together' },
          { id: 'movie', label: 'Movie + snacks' },
          { id: 'asleep', label: 'Iza will fall asleep before the evening' },
        ],
      },
      {
        id: 'last-day',
        icon: 'Hourglass',
        text: 'What are we doing on the last day?',
        options: [
          { id: 'slow', label: 'Slow morning' },
          { id: 'trip', label: 'One final trip' },
          { id: 'home', label: 'Stay home' },
          {
            id: 'surprise',
            label: 'You better fucking come up with something interesting, I’m not telling you',
          },
        ],
      },
    ],
  },
];

/* ---------- Flattened, once ------------------------------ */

export type Slide =
  | { kind: 'question'; key: string; section: Section; question: Question }
  | { kind: 'end'; key: string };

/**
 * Every question in order, then the plan. The closing slide is part of the
 * same array so that "the last question" needs no special case anywhere —
 * there is simply one more slide after it.
 */
export const SLIDES: Slide[] = [
  ...SECTIONS.flatMap((section) =>
    section.questions.map(
      (question): Slide => ({ kind: 'question', key: question.id, section, question }),
    ),
  ),
  { kind: 'end', key: 'end' },
];

/** Every question, flat — progress counts against this. */
export const QUESTIONS: Question[] = SECTIONS.flatMap((section) => section.questions);

/** Answers, as they are stored: question id -> option id. */
export type Answers = Record<string, string>;

/** The label she picked, for the plan at the end. */
export function labelOf(question: Question, id: string | undefined): string | undefined {
  return question.options.find((option) => option.id === id)?.label;
}
