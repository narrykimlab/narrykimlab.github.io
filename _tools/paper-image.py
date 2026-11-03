#!/usr/bin/env python3
"""
Make a paper's picture for its card on the Research page
(_includes/research_papers.html): the white margins trimmed, then white
added round the figure to make it 3:2, the card's own shape, with a little
room on every side, at most 1200px wide, as a JPEG in images/papers/. The
card shows the picture whole (object-fit: contain), so a picture made this
way fills its box and nothing in it is cut off.

A fragment cut through at the edge of a panel (half a label, an arrow from
the next panel) is best painted out before, in any image editor.

Usage, from the repository root (needs Pillow: `pip install pillow`):

    python3 _tools/paper-image.py figure.png images/papers/s41587-025-02891-7.jpg

then name the file in the paper's `image:` in _data/publist.yml.
"""

import sys

from PIL import Image, ImageChops

RATIO = 3 / 2
TOP_BOTTOM = 0.06   # the least room above and below, a share of the height
SIDES = 0.04        # and on either side, a share of the width
WIDEST = 1200


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__.strip().split("\n\n")[-2])
    source, output = sys.argv[1], sys.argv[2]
    image = Image.open(source).convert("RGBA")
    flat = Image.new("RGB", image.size, "white")
    flat.paste(image, mask=image.split()[3])

    # The figure: whatever is not (nearly) white.
    difference = ImageChops.difference(flat, Image.new("RGB", flat.size, "white")).convert("L")
    box = difference.point(lambda v: 255 if v > 24 else 0).getbbox()
    if not box:
        sys.exit(f"{source}: nothing but white")
    figure = flat.crop(box)
    w, h = figure.size

    height = max(h / (1 - 2 * TOP_BOTTOM), w / ((1 - 2 * SIDES) * RATIO))
    width, height = round(height * RATIO), round(height)
    card = Image.new("RGB", (width, height), "white")
    card.paste(figure, ((width - w) // 2, (height - h) // 2))
    if width > WIDEST:
        card = card.resize((WIDEST, round(WIDEST / RATIO)), Image.LANCZOS)
    card.save(output, "JPEG", quality=92, subsampling=0, optimize=True, progressive=True)
    print(f"{output}: {card.size[0]}x{card.size[1]}")


if __name__ == "__main__":
    main()
