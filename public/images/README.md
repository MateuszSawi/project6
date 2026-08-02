# Photographs

Every file here is wired up in `lib/content.ts`. Nothing is auto-discovered — if
you add a photo, add an entry there too.

## In use

| File | Where it appears |
| --- | --- |
| `old-town.jpg` | Arrival backdrop **and** the grid — *Old Town, Gdańsk* |
| `sopot.jpg` | Arrival backdrop **and** the grid — *The Pier, Sopot* |
| `niebo-gwiazdy.jpg` | Arrival backdrop **and** the grid — *The Sky* |
| `park-oliwski.jpg` | Arrival backdrop **and** the grid — *The Park, Park Oliwski* |
| `gdynia.jpg` | Grid — *The Port, Gdynia* |
| `orlowo.jpg` | Grid — *The Cliff, Orłowo* |
| `rewa.jpg` | Grid — *Two Seas, Rewa* |
| `wioska-fok.webp` | Grid — *The Seals, the fishing village* |
| `alpaki.jpg` | Grid — *The Alpacas, Bojano* |
| `lapalice.jpg` | Grid — *The Unfinished, Łapalice Castle* |
| `rumia-park.jpg` | Grid — *Close to Home, Rumia* |

The twelfth tile is the secret. It has no photograph on purpose.

## Two rules

- **ASCII filenames only.** `orłowo.jpg` was renamed to `orlowo.jpg` — non-ASCII
  characters in a URL have to be percent-encoded and break on some hosts.
- **Backdrops want the big files.** The four used behind the arrival headline are
  full-bleed at 100vw; low-resolution files show every artefact there. The grid
  tiles are small enough to forgive a weak photo.

## Swapping a photo

Drop the new file in, point the `src` at it in `lib/content.ts`. A missing or
broken file falls back to a burgundy plate rather than a broken image, so the
page never looks unfinished while you are still gathering them.
