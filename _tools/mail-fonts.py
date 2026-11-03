#!/usr/bin/env python3
"""
Cut the two fonts that draw the site's email addresses:

    fonts/NKLMail-Display.woff2  from fonts/Montserrat-latin.woff2
                                 (the email buttons, which are in Montserrat)
    fonts/NKLMail-Sans.woff2     from fonts/IBMPlexSans-Regular-Latin1.woff2
                                 (an address in running text)

The pages hold an address not as text but as code points of Unicode's Private
Use Area, which mean nothing to a program reading the HTML or the DOM: code
point `first` + i stands for the i-th character of `characters` in
_data/mail_glyphs.yml. Each font is cut down to the glyphs of those characters
(and the ligatures they make), keeping the outlines, spacing, kerning and
hinting of the font it comes from, and maps them from those code points instead
of from the letters. Its glyphs are unnamed and in a shuffled order, so the
file does not say which glyph is which either; the shuffle is seeded by the
table, so the same table always cuts the same fonts. The default script (DFLT),
which a run of Private Use characters is shaped with, gets the Latin script's
features, so kerning and ligatures work as they do in the letters.

IBM Plex Sans reserves its name ("Plex"), so the cut carries another one; the
fonts' licences are in fonts/*-OFL.txt.

Usage, from the repository root (needs fontTools and brotli:
`pip install fonttools brotli`):

    python3 _tools/mail-fonts.py               # cut the fonts from the table
    python3 _tools/mail-fonts.py --new-table   # draw a new table first

A new table also has to go into js/site.js (MAIL_FIRST, MAIL_CHARACTERS); the
build fails until it does (_plugins/mail_glyphs.rb).
"""

import argparse
import copy
import random
import re
import secrets
import string
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.reorderGlyphs import reorderGlyphs
from fontTools.ttLib.tables._c_m_a_p import cmap_format_4

TABLE = Path("_data/mail_glyphs.yml")
CHARACTERS = string.ascii_lowercase + string.ascii_uppercase + string.digits + ".-_+@"
# Clear of the Private Use code points that IBM Plex Sans's Pi file has
# (U+ECE0, U+EFCC; see _sass/_fonts.scss).
RANGE = (0xE100, 0xEB00)

FONTS = [
    # source, output, family name, PostScript name, name it may not keep
    ("fonts/Montserrat-latin.woff2", "fonts/NKLMail-Display.woff2",
     "NKL Mail Display", "NKLMailDisplay", "Montserrat"),
    ("fonts/IBMPlexSans-Regular-Latin1.woff2", "fonts/NKLMail-Sans.woff2",
     "NKL Mail Sans", "NKLMailSans", "Plex"),
]

HEADER = """\
# The table behind the site's email addresses (see _tools/mail-fonts.py).
# A page holds an address as code points of Unicode's Private Use Area, which
# mean nothing to a program reading it: code point `first` + i stands for the
# i-th character of `characters`, and the fonts fonts/NKLMail-*.woff2 draw it
# as that character. js/site.js holds the same table (MAIL_FIRST,
# MAIL_CHARACTERS), to turn an address back into text for its mailto link and
# for copying; the build fails if the two differ (_plugins/mail_glyphs.rb).
# Do not edit by hand: `python3 _tools/mail-fonts.py --new-table` draws a new
# table and cuts new fonts for it.
"""


def read_table():
    text = TABLE.read_text(encoding="utf-8")
    first = re.search(r"^first:\s*0x([0-9A-Fa-f]+)\s*$", text, re.M)
    chars = re.search(r'^characters:\s*"([^"]+)"\s*$', text, re.M)
    if not first or not chars:
        sys.exit(f"{TABLE}: no `first` or `characters`")
    first, chars = int(first.group(1), 16), chars.group(1)
    if sorted(chars) != sorted(CHARACTERS):
        sys.exit(f"{TABLE}: `characters` is not a reordering of {CHARACTERS!r}")
    return first, chars


def write_table():
    rng = secrets.SystemRandom()
    first = rng.randrange(RANGE[0], RANGE[1] - len(CHARACTERS))
    chars = list(CHARACTERS)
    rng.shuffle(chars)
    chars = "".join(chars)
    TABLE.write_text(f'{HEADER}first: 0x{first:04X}\ncharacters: "{chars}"\n', encoding="utf-8")
    print(f"{TABLE}: first 0x{first:04X}, characters {chars}")
    print("Now put the same values into js/site.js (MAIL_FIRST, MAIL_CHARACTERS).")


def cut(source, output, family, psname, old_name, first, chars):
    font = TTFont(source, recalcTimestamp=False)
    version = font["name"].getDebugName(5) or "Version 1.000"

    options = subset.Options()
    # Only the features a browser applies on its own: no others are asked for
    # where an address is shown.
    options.layout_features = ["ccmp", "locl", "rlig", "liga", "clig", "calt", "rclt",
                               "kern", "mark", "mkmk", "curs", "rvrn"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.glyph_names = False
    options.hinting = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=[ord(c) for c in chars])
    subsetter.subset(font)

    # The glyphs, mapped from the Private Use code points instead.
    letters = font.getBestCmap()
    mapping = {first + i: letters[ord(c)] for i, c in enumerate(chars)}
    cmap = newTable("cmap")
    cmap.tableVersion = 0
    cmap.tables = []
    for platform, encoding in ((0, 3), (3, 1)):
        table = cmap_format_4(4)
        table.platformID, table.platEncID, table.language = platform, encoding, 0
        table.cmap = dict(mapping)
        cmap.tables.append(table)
    font["cmap"] = cmap
    os2 = font["OS/2"]
    os2.usFirstCharIndex, os2.usLastCharIndex = min(mapping), max(mapping)
    os2.recalcUnicodeRanges(font)

    # Private Use characters belong to no script, so a browser shapes them
    # with the default one: give it the Latin features.
    for tag in ("GSUB", "GPOS"):
        if tag not in font:
            continue
        records = {r.ScriptTag: r for r in font[tag].table.ScriptList.ScriptRecord}
        if "latn" in records and "DFLT" in records:
            records["DFLT"].Script.DefaultLangSys = copy.deepcopy(
                records["latn"].Script.DefaultLangSys)

    # A name of its own.
    name = font["name"]
    for record in list(name.names):
        if record.nameID in (1, 2, 3, 4, 6, 16, 17):
            name.removeNames(nameID=record.nameID)
    for record in name.names:
        text = record.toUnicode()
        if old_name in text and record.nameID != 0:
            record.string = text.replace(old_name, psname)
    for name_id, text in ((1, family), (2, "Regular"), (3, f"{version};NKL;{psname}"),
                          (4, family), (5, version), (6, psname)):
        name.setName(text, name_id, 3, 1, 0x409)
    leftover = [r.toUnicode() for r in name.names
                if old_name in r.toUnicode() and r.nameID != 0]
    if leftover:
        sys.exit(f"{output}: still named {old_name!r}: {leftover}")

    # Glyphs in an order that says nothing, the same for the same table.
    order = font.getGlyphOrder()
    rest = order[1:]
    random.Random(f"{first}:{chars}:{psname}").shuffle(rest)
    reorderGlyphs(font, [order[0]] + rest)

    font.flavor = "woff2"
    font.save(output)
    print(f"{output}: {len(font.getGlyphOrder())} glyphs, {Path(output).stat().st_size} bytes")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--new-table", action="store_true",
                        help=f"draw a new table into {TABLE} first")
    args = parser.parse_args()
    if args.new_table or not TABLE.exists():
        write_table()
    first, chars = read_table()
    for source, output, family, psname, old_name in FONTS:
        cut(source, output, family, psname, old_name, first, chars)


if __name__ == "__main__":
    main()
