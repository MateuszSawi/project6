#!/usr/bin/env python3
"""Build the sprite atlas for the "Iza on her way to Poland" runner.

Takes the GandalfHardcore character pack in public/pixel/, recolours the hair
layer to the site's bordeaux palette, flattens skin + hair + dress into one
atlas, and writes it to public/games/runner/.

    python scripts/build-runner-sprites.py

Re-runnable: it only reads from public/pixel/ and overwrites its own output.

Why recolour rather than ship the original: the pack's licence permits
modifying the assets and using them in a project, but not redistributing the
art itself. Only the flattened, recoloured atlas ends up in public/ — the
source sheets stay out of the deploy.
"""

from __future__ import annotations

import json
import os
from collections import Counter

from PIL import Image

# --------------------------------------------------------------------------
# Paths
# --------------------------------------------------------------------------

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def find_pixel_dir() -> str:
    """Locate the source pack, preferring a home outside public/.

    Anything under public/ is copied verbatim into out/ and published, and the
    pack's licence does not allow redistributing the art. assets/ is where this
    project already keeps source material that is not meant to be served, so it
    is checked first and public/ is only the fallback.
    """
    for candidate in (os.path.join(ROOT, "assets", "pixel"),
                      os.path.join(ROOT, "public", "pixel")):
        if os.path.isdir(candidate):
            if os.path.normpath(candidate).startswith(
                    os.path.normpath(os.path.join(ROOT, "public"))):
                # ASCII only: the Windows console this runs in is not UTF-8.
                print("note: reading from public/pixel, and everything in there "
                      "is published on deploy.\n      Move it to assets/pixel "
                      "and this script will follow.\n")
            return candidate
    raise SystemExit("cannot find the sprite pack in assets/pixel or public/pixel")


PIXEL = find_pixel_dir()
PACK = os.path.join(PIXEL, "GandalfHardcore Character Asset Pack",
                    "GandalfHardcore Character Asset Pack")
CLOTHING = os.path.join(PIXEL, "GandalfHardcore 43x Female Clothing",
                        "GandalfHardcore 43x Female Clothing")
OUT_DIR = os.path.join(ROOT, "public", "games", "runner")

SKIN = os.path.join(PACK, "Character skin colors", "Female Skin2.png")
HAIR = os.path.join(PACK, "Female Hair", "Female Hair1.png")
DRESS = os.path.join(CLOTHING, "Long dress red.png")

# --------------------------------------------------------------------------
# Source sheet geometry — measured, not guessed. Every sheet in the pack is
# 800x448 laid out as a 10x7 grid of 80x64 cells, with the character's feet on
# the last row of each cell.
# --------------------------------------------------------------------------

FRAME_W, FRAME_H = 80, 64
SRC_COLS, SRC_ROWS = 10, 7

# Source row -> (name, frame count). The pack ships no landing animation, so
# the game reuses the last jump frame on touchdown.
ANIMATIONS = [
    ("idle", 0, 5),
    ("run", 2, 8),
    ("jump", 3, 4),
]

# The one frame that also leaves the atlas as a file of its own, for the tile
# on the front page. A tile is not a canvas — it wants a picture it can drop
# in, and the pose it wants is the one the game is named after: off the ground,
# arms out, on her way. (animation, frame index)
STILL = ("jump", 1)

# --------------------------------------------------------------------------
# Bordeaux ramp, darkest to lightest. Matches styles/variables.scss.
# --------------------------------------------------------------------------

BORDO_RAMP = [
    (0x4A, 0x0E, 0x22),  # shadow
    (0x7D, 0x19, 0x35),  # base
    (0xD4, 0x57, 0x7A),  # highlight
]


def luma(rgb) -> float:
    """Rec. 709 relative luminance — the ordering we preserve when recolouring."""
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]


def ramp_at(t: float) -> tuple[int, int, int]:
    """Sample BORDO_RAMP at t in [0, 1], linearly between adjacent stops."""
    if t <= 0:
        return BORDO_RAMP[0]
    if t >= 1:
        return BORDO_RAMP[-1]
    span = 1 / (len(BORDO_RAMP) - 1)
    i = min(int(t / span), len(BORDO_RAMP) - 2)
    f = (t - i * span) / span
    a, b = BORDO_RAMP[i], BORDO_RAMP[i + 1]
    return tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3))


def recolour_hair(img: Image.Image) -> tuple[Image.Image, list]:
    """Map the hair layer's shades onto the bordeaux ramp, darkest to lightest.

    The pack's hair sheets use 3 or 4 flat shades and no partial alpha, so this
    is an exact palette substitution rather than a filter: every source shade
    gets exactly one destination shade, ordering by luminance is preserved, and
    alpha is copied untouched. With a 3-shade sheet each shade lands precisely
    on one ramp stop.
    """
    img = img.convert("RGBA")
    shades = sorted({p for p in img.getdata() if p[3] != 0}, key=luma)
    if not shades:
        raise SystemExit(f"hair layer has no opaque pixels")

    n = len(shades)
    mapping = {
        src: ramp_at(0.0 if n == 1 else i / (n - 1))
        for i, src in enumerate(shades)
    }

    counts = Counter(p for p in img.getdata() if p[3] != 0)
    out = Image.new("RGBA", img.size)
    out.putdata([
        (*mapping[p], p[3]) if p[3] != 0 else (0, 0, 0, 0)
        for p in img.getdata()
    ])

    report = [
        {
            "from": "#%02X%02X%02X" % src[:3],
            "to": "#%02X%02X%02X" % mapping[src],
            "pixels": counts[src],
            "luma_before": round(luma(src), 1),
            "luma_after": round(luma(mapping[src]), 1),
        }
        for src in shades
    ]
    return out, report


def main() -> None:
    for path in (SKIN, HAIR, DRESS):
        if not os.path.exists(path):
            raise SystemExit(f"missing source sheet: {path}")

    skin = Image.open(SKIN).convert("RGBA")
    hair_src = Image.open(HAIR).convert("RGBA")
    dress = Image.open(DRESS).convert("RGBA")

    for name, img in (("skin", skin), ("hair", hair_src), ("dress", dress)):
        if img.size != (FRAME_W * SRC_COLS, FRAME_H * SRC_ROWS):
            raise SystemExit(f"{name} sheet is {img.size}, expected "
                             f"{(FRAME_W * SRC_COLS, FRAME_H * SRC_ROWS)}")

    hair, report = recolour_hair(hair_src)

    # Skin under hair under dress — the pack is drawn to composite in that order.
    sheet = Image.alpha_composite(skin, hair)
    sheet = Image.alpha_composite(sheet, dress)

    # Repack the three rows we actually use into a tight atlas, so the game
    # downloads three animations instead of seven.
    cols = max(count for _, _, count in ANIMATIONS)
    atlas = Image.new("RGBA", (cols * FRAME_W, len(ANIMATIONS) * FRAME_H))
    meta = {
        "frameWidth": FRAME_W,
        "frameHeight": FRAME_H,
        "animations": {},
    }

    for row, (name, src_row, count) in enumerate(ANIMATIONS):
        for i in range(count):
            cell = sheet.crop((i * FRAME_W, src_row * FRAME_H,
                               (i + 1) * FRAME_W, (src_row + 1) * FRAME_H))
            if cell.getbbox() is None:
                raise SystemExit(f"{name} frame {i} is empty — wrong row?")
            # The pack draws her facing left; the game runs right. Mirrored per
            # cell rather than across the whole sheet, which would also reverse
            # the order of the frames within each animation.
            atlas.paste(cell.transpose(Image.FLIP_LEFT_RIGHT),
                        (i * FRAME_W, row * FRAME_H))
        meta["animations"][name] = {"row": row, "frames": count}

    # The union of every frame's content box, so the game knows the real
    # footprint inside the 80x64 cell without hardcoding a guess.
    boxes = [
        atlas.crop((i * FRAME_W, row * FRAME_H,
                    (i + 1) * FRAME_W, (row + 1) * FRAME_H)).getbbox()
        for row, (_, _, count) in enumerate(ANIMATIONS)
        for i in range(count)
    ]
    meta["contentBox"] = {
        "x": min(b[0] for b in boxes),
        "y": min(b[1] for b in boxes),
        "width": max(b[2] for b in boxes) - min(b[0] for b in boxes),
        "height": max(b[3] for b in boxes) - min(b[1] for b in boxes),
    }

    # Cropped to its own edges rather than to contentBox: this file is placed
    # by its outline, not aligned against the other frames, so the empty margin
    # every cell carries would only push her off-centre in the tile.
    still_row = meta["animations"][STILL[0]]["row"]
    still = atlas.crop((STILL[1] * FRAME_W, still_row * FRAME_H,
                        (STILL[1] + 1) * FRAME_W, (still_row + 1) * FRAME_H))
    still = still.crop(still.getbbox())

    os.makedirs(OUT_DIR, exist_ok=True)
    atlas_path = os.path.join(OUT_DIR, "iza.png")
    atlas.save(atlas_path, optimize=True)
    still_path = os.path.join(OUT_DIR, "iza-still.png")
    still.save(still_path, optimize=True)
    with open(os.path.join(OUT_DIR, "iza.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
        f.write("\n")

    print(f"hair: {os.path.basename(HAIR)}")
    for r in report:
        print(f"  {r['from']} -> {r['to']}   {r['pixels']:>5} px   "
              f"luma {r['luma_before']:>5.1f} -> {r['luma_after']:>5.1f}")
    print(f"\natlas   {atlas.size[0]}x{atlas.size[1]}  "
          f"{os.path.getsize(atlas_path)} bytes  -> {atlas_path}")
    print(f"still   {still.size[0]}x{still.size[1]}  "
          f"{os.path.getsize(still_path)} bytes  -> {still_path}  "
          f"({STILL[0]} frame {STILL[1]})")
    print(f"content box inside each cell: {meta['contentBox']}")


if __name__ == "__main__":
    main()
