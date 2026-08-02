/**
 * ARCHIVED — the quote section was cut from the page.
 * Kept whole in case it comes back; nothing in the app imports this.
 */

export type Tone = 'aside' | 'peak' | 'note';

export interface VerseLine {
  text: string;
  tone?: Tone;
}

export const VERSE: VerseLine[] = [
  { text: 'My mother told me to stay away from girls like you.' },
  { text: 'She was not specific enough.', tone: 'aside' },
  { text: 'You are a red flag — excellent quality.' },
  { text: 'Hand-stitched. Almost certainly imported.' },
  {
    text: 'You do not give a fuck, and you have said so in full sentences, with punctuation.',
  },
  { text: 'Fine.', tone: 'aside' },
  { text: 'You still make me wanna be romantic,', tone: 'peak' },
  { text: 'and I would like it noted that this is entirely your fault.', tone: 'note' },
];

export const AUTHOR = '';
export const AUTHOR_FALLBACK = 'The tall one, from Poland';
export const AUTHOR_NOTE = 'Written in Poland. Sent to Albania.';
