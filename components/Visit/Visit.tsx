'use client';

import { useEffect, useRef } from 'react';

import { countVisit, type VisitKey } from '@/lib/visits';

/**
 * Counts one arrival on the page it is dropped into, and renders nothing.
 *
 * A component rather than a call inside each page because every page here is a
 * server component, and this has to happen in a browser.
 */
export default function Visit({ name }: { name: VisitKey }) {
  const counted = useRef(false);

  useEffect(() => {
    /* Strict Mode mounts every effect twice in development. Without this the
       numbers would be double everywhere but production, which is the worst of
       both — wrong, and only wrong where nobody is looking. */
    if (counted.current) return;
    counted.current = true;
    countVisit(name);
  }, [name]);

  return null;
}
