import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';

import Loader from '@/components/Loader/Loader';

import './globals.scss';

/* latin-ext carries both the Polish and the Albanian diacritics. */
const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-body',
  display: 'swap',
  fallback: ['system-ui', 'Segoe UI', 'sans-serif'],
});

export const metadata: Metadata = {
  title: 'Iza in Poland',
  description: 'An invitation. Poland, candles, and a coast that does not perform.',
  openGraph: {
    title: 'Iza in Poland',
    description: 'An invitation.',
    type: 'website',
  },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#171216',
  colorScheme: 'dark',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /* `data-loading` is in the markup rather than set on hydration, so the
       opening screen's entrance is held from the very first frame. The loader
       takes it off as it starts to leave — see Loader.tsx. */
    <html
      lang="en"
      data-loading=""
      className={`${playfair.variable} ${inter.variable}`}
    >
      <body>
        {/* First in the body so it is painted with the document rather than
            arriving after it — the page must never be seen before the name. */}
        <Loader />
        {children}
      </body>
    </html>
  );
}
