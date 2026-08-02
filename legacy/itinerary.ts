/**
 * Itinerary content.
 * Kept apart from the view so the copy can be edited without touching JSX.
 */

export type Accent = 'terracotta' | 'sage' | 'ocean' | 'amber';

export type IconName =
  | 'organ'
  | 'sea'
  | 'amber'
  | 'sand'
  | 'castle'
  | 'alpaca'
  | 'harbour';

export interface Stop {
  /** Anchor id, also used as the React key. */
  id: string;
  /** Poetic title — the headline of the entry. */
  title: string;
  /** The real-world place, set beneath the title. */
  place: string;
  /** Loose scheduling hint. Deliberately soft — nothing is on a clock. */
  when: string;
  /** Two or three sentences. Evocative, never a brochure. */
  body: string;
  /** Small caption pinned to the foot of the entry. */
  note: string;
  accent: Accent;
  icon: IconName;
}

export const STOPS: Stop[] = [
  {
    id: 'oliwa',
    title: 'The Whispers of History & Organs',
    place: 'Park Oliwski & Oliwa Cathedral',
    when: 'Saturday · first light',
    body: 'We begin where the city keeps its voice. Beneath the cathedral vault, an eighteenth-century organ opens like a hand — wooden angels turn, stars revolve, and the sound arrives before you are ready for it. Afterwards, the park: gravel paths, a palm house, water so still it holds the whole sky.',
    note: 'Organ recitals run through the morning — we will time our arrival to one.',
    accent: 'ocean',
    icon: 'organ',
  },
  {
    id: 'orlowo',
    title: 'Poetry by the Baltic Sea',
    place: 'Orłowo Cliffs & Żeromski’s House',
    when: 'Saturday · late morning',
    body: 'A wooded cliff falls straight into the Baltic, and the pier walks out to meet it. Stefan Żeromski wrote here, in a small wooden house facing the water, because the sea gave him sentences. Bring nothing to do. The horizon is the whole programme.',
    note: 'The wooden pier is best walked slowly, twice.',
    accent: 'sage',
    icon: 'sea',
  },
  {
    id: 'gdansk',
    title: 'The Amber Soul of Gdańsk',
    place: 'Gdańsk Old Town & Mariacka Street',
    when: 'Saturday · afternoon into dusk',
    body: 'Narrow façades in ochre, rust and pale green, rebuilt stone by stone from photographs. Mariacka is the loveliest street in the country: gargoyle waterspouts, stone terraces, amber glowing in every window like held light. Then the Motława at dusk, when the brick turns copper.',
    note: 'Amber is fossilised resin — forty million years old, warm to the touch.',
    accent: 'amber',
    icon: 'amber',
  },
  {
    id: 'rewa',
    title: 'Where the Water Divides',
    place: 'Rewa & Mechelinki',
    when: 'Sunday · morning',
    body: 'A thin ribbon of sand walks out into the bay until land simply gives up. Stand at the end of the Rewa Spit and the sea is on both sides of you at once, moving in different directions. Mechelinki, further along, is quieter still — reeds, fishing boats, wind.',
    note: 'Wear something the wind can play with. It will.',
    accent: 'ocean',
    icon: 'sand',
  },
  {
    id: 'lapalice',
    title: 'The Mystery of Łapalice Castle',
    place: 'Unfinished architectural poetry',
    when: 'Sunday · midday',
    body: 'An artist began building a castle in the forest in 1979 — twelve towers, fifty-two rooms, a ballroom — and never finished it. What stands is raw brick and open sky, arches framing clouds instead of ceilings. It is more beautiful incomplete than it could ever have been finished.',
    note: 'A cathedral to the unfinished. Bring the camera.',
    accent: 'terracotta',
    icon: 'castle',
  },
  {
    id: 'bojano',
    title: 'Fluffy Alpacas & Secret Parks',
    place: 'Bojano Alpacas & Wejherowo Park',
    when: 'Sunday · afternoon',
    body: 'A field of alpacas who regard visitors with enormous, unbothered calm, and will eat from your palm if you are patient. Then Wejherowo — a wooded park of streams, small bridges and chapels set into the hillside, largely unvisited, entirely yours.',
    note: 'Alpacas hum when they are content. You will hear it.',
    accent: 'sage',
    icon: 'alpaca',
  },
  {
    id: 'hel',
    title: 'The Seal Fisherman Village',
    place: 'Maritime local culture',
    when: 'Sunday · golden hour',
    body: 'Painted boats hauled up on the sand, nets drying in the wind, and grey seals turning slowly in the shallows — a colony brought back from almost nothing. A working village that never learned to perform for anyone. Smoked fish, salt air, and the light going long and gold across the water.',
    note: 'The closing note of the weekend, facing west.',
    accent: 'terracotta',
    icon: 'harbour',
  },
];
