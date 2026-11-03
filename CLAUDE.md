# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Jekyll 4 static site for the Narry Kim Lab (RNA biology) at the Institute for Basic Science
and Seoul National University, meant to go live at **narrykim.org** in place of the
lab's WordPress site there. English only.

The design and the code are the Chang lab's site (qbio.io, `../ChangLabSNU.github.io`)
with its colours changed; the content came from the old narrykim.org. When in doubt about
how something should look or work, do what the Chang lab site does.

Tech stack: Jekyll 4.x (Gemfile pins `~> 4.3`), Kramdown (GFM), Liquid templates, Dart Sass.

- CSS: `_sass/_base.scss` is Bootstrap 3.3.7 + Bootswatch Lumen compiled once to plain CSS
  and pruned to what the site uses (its header says what was kept); edit it directly.
  `css/main.scss` holds the site's own rules on top and pulls it in with `@use`. No Bootstrap
  SCSS, mixins or variables remain, and Sass builds with no deprecations silenced -- keep it
  that way (`@use`, not `@import`).
- Design: colours, widths and the font stack are custom properties on `:root` at the top
  of `css/main.scss`; use them rather than new hex values. Two colours carry the lab's
  identity: the old site's red, the one point colour, and `--grey`, the IBS logo's mid
  grey, from which the neutrals are drawn; the large pale grounds -- `--band` (`#f4f4f4`)
  behind the PI on /people/ and the head of every member page, and the home masthead --
  are neutral greys without the IBS logo's touch of blue, which looked cold beside the
  red. The red comes in three strengths:
  `--accent` (`#ca2017`, the old site's own) fills and outlines the buttons and marks
  things -- the carousel's current dot,
  the current section's underline on the inner pages' header;
  `--link` (`#ae241d`, the same red with saturation and lightness each cut by a tenth) is
  every red that is text on a light ground -- links, member names, news dates, the home
  page's current section, the outline button's label; and `--on-ink-link` (`#f4978e`) is
  red text on the dark footers, their links.
  Check contrast (4.5:1 for text) before adding a colour.
  The type is two families, self-hosted (`fonts/`, `@font-face` in `_sass/_fonts.scss`):
  `--display`, Montserrat, for headings, the wordmark, section links, buttons, chips and
  member names, and `--sans`, IBM Plex Sans, for the text. Montserrat is our own
  Latin-only cut of the variable roman and italic, weight 400-800
  (`fonts/Montserrat-OFL.txt` says what was changed; its licence reserves no name).
  IBM Plex Sans is IBM's own split web fonts, unmodified -- its licence reserves the
  name "Plex", so a cut of our own would have to be renamed: Latin1, Pi (primes and
  other symbols) and Greek files for 400, 600 and 700, roman and italic; the browser
  fetches Pi or Greek only on a page with such a character (`fonts/IBMPlexSans-OFL.txt`).
  Each `unicode-range` lists exactly the characters its file has, so anything else falls
  back to a system font. Each family's stack is led by its cut that draws email addresses
  (NKL Mail Display, NKL Mail Sans; see Conventions), whose range is the stretch of the
  Private Use Area its table is drawn from.
  On the text pages (textlay: research, join, contact, about, news) running text stops at
  36em, about 70 characters a line; floated figures keep the column's right-hand side.
- Only the home page (the one with `hero:` front matter) has the pale masthead -- a
  gradient from `--tint` (`#f5f5f5`) to `--tint-deep` (`#ececec`), a step darker above
  the sea under it -- and the ink footer. Every other page gets
  `<body class="inner">`: a `--charcoal` header and footer (`#3d3d3d`, a neutral grey)
  and the same near-black running text as home, grey kept for labels (the `body.inner`
  block in `css/main.scss` repoints the tokens).
- Content pages share the people page's pieces (the "shared pieces" block in
  `css/main.scss`): `.chip` icon buttons for links, `.team-role` for a bold grey role
  line, photos with 12px corners and no shadow, and rows split by `--hairline` rules.
- JS: `js/site.js` runs the home carousel, driving Bootstrap 3's CSS classes directly (no
  jQuery), and makes the email addresses mailto links (see Conventions). The carousel holds still while the
  mouse is over it or keyboard focus is in it (WCAG 2.2.2), stops autoplaying under
  `prefers-reduced-motion`, and its arrows answer Enter and Space. It also runs the photos
  page's viewer, a modal `<dialog class="lightbox">` in `_pages/photos.md`: a photo
  (a link marked `data-lightbox`, which carries its date and caption) opens nearly full
  window over the darkened page, at its own proportions; the side buttons, the arrow keys
  and a sideways swipe move through the photos in page order, wrapping round at the ends;
  the close button, Escape and a click on the dark ground close it, and focus returns to
  the photo. Videos are not in it: they link to YouTube. Without scripts, or with a click
  meant for a new tab, a photo is a plain link to its file. On /publications/by-topic/
  the topics, with their numbers of papers, are a column beside the papers on a wide
  screen (992px up) that stays in view as the list scrolls (`position: sticky`), and the
  script marks the one being read (`aria-current`, a red rule): the last heading above a
  line a third of the way down the window. On a narrower screen they are a list on top.
  Every paper and book chapter in a list (the publication pages, a member's profile) has
  a Cite button, which opens `<dialog class="cite-dialog">` (`_includes/cite_dialog.html`,
  once per page) with its citation as APA, Nature, BibTeX, EndNote or RIS, fetched from
  `/publications/cite.json` the first time; Copy puts it on the clipboard (or selects it
  to copy by hand) and the last three can be downloaded as files. It closes like the
  photo viewer and hands focus back to the button. Without scripts the buttons stay
  hidden.
- Home's first screen fills the window, as on the Chang lab site: the masthead is at
  least `100svh`, the hero text sits 7:3 in the space it has, and the scene lies along
  the window's bottom edge, the masthead's 8px bottom border in the sea floor's colour
  (on touch screens the sea runs on 88px past the window's bottom, since Safari on iOS 26
  ends `100svh` at its floating toolbar's top edge and shows the page below the window
  through the toolbar: only water lies there). Just
  above the sea, two wide chevrons cue that the page goes on below: a link to `#content`
  (the `<main>`), bobbing gently and scrolling smoothly unless motion is reduced. They
  take only room the text leaves over (`.cue-room`, a container query), so where there
  is none they are left out rather than push the scene down; on touch screens they sit
  in that 88px of water below the window's bottom instead. The scene is `js/tails.js` on `<canvas class="scene">`, an animation with no game: mRNAs
  swim like tadpoles in a sea, the 5' cap worn as a red cap and a messenger bag slung
  across them (messengers, after all), their poly(A) tails shortening bead by bead
  (deadenylation) until an mRNA with none left fades away. Four enzymes wander among
  them -- TENT4A and TENT4B (grey) throw A's and a G onto a short tail that passes near
  (mixed tailing; the deadenylase stalls at the G), TUT4 and TUT7 (red) throw U's onto a
  nearly bare one (uridylation) -- blinking, winking, glancing about, and smiling with a
  hop after a delivery. Soon after U's land, a lime Pac-Man races in from the left,
  gobbles the tail from its 3' end, leaps over the head and shoots off to the right,
  leaving the mRNA to fade. Two that linger side by side give each
  other a high five (none seeks one out); a helper left outside by a narrowing window
  dashes back in, startled, and glides on a little; and none stays in one spot more than
  a few seconds (it turns back from an edge, and a watchdog sends a loiterer off). A
  phone has two of them, unlabelled. The tuning keeps U's about as common as the TENT4s'
  A's: TUTs notice from further off, a short tail shortens more slowly, and a narrow
  scene's mRNAs come with shorter tails, so they get short before swimming out; a scene
  wider than 1000px holds the TUTs back a little (fully from 1400px), as more tails
  come their way. The water's colours are `--sea` and `--sea-deep`, which the script
  reads from the CSS. The water below the top `--sea-top` (20px) is the canvas's own
  CSS background, painted once; each frame draws only the band where the surface
  ripples, in the same gradient, reaching 2px into the background so that no hairline
  shows between them. It runs at about 30 frames a second in vector at the device's
  pixel ratio (at most 2), stepping down to 20 and then 12 on a device whose frames come
  late or hold the main thread for over half the time between them; it stops while out
  of view or in a hidden tab, shows one still frame under `prefers-reduced-motion`, and
  starts the same on every visit (a fixed seed).
- Icons: Font Awesome Free 5.15.3 shapes as inline SVG (see Conventions). The site icon is
  the old site's black RNA strand on a white rounded square with transparent corners:
  `favicon.ico` (16, 32, 48px), `favicon-192.png`, and
  `apple-touch-icon.png` (180px on white, since iOS fills transparency with black).

## Build & Serve

Ruby version is pinned in `.ruby-version` (CI reads it too); `Gemfile.lock` needs Bundler 4.
On the lab server Ruby, Bundler and the gems live in the `nklabwww` conda env
(`environment.yml`). Enter it with `cdrun`; plain `bundle` outside it is the system Ruby
and will not match. The env was first made as a clone of the Chang lab's `qbiowww`,
whose Gemfile and lock this site shares; if the locks drift apart, update this env, not
that one. `run.sh` serves on port 4001 (the Chang lab preview takes 4000) with
livereload, which also needs port 35729.

```bash
cdrun nklabwww "bundle install"      # Install dependencies into the env
./run.sh                             # Dev server at http://localhost:4001, live reload
cdrun nklabwww "JEKYLL_ENV=production bundle exec jekyll build"   # Production build into _site/
```

CI also runs `htmlproofer` over `_site/` (internal links and images only); the exact
invocation is in `.github/workflows/jekyll.yml` and README.md. Run it before pushing.

## Architecture

### Data-driven content (`_data/`)

All dynamic content lives in YAML data files. `_plugins/data_check.rb` checks them on every
build and fails it with a list of problems: missing required fields, an author `link` that
is not in team.yml, unknown categories or topics, a non-boolean `active`, missing photos,
years or dates out of order, icon names missing from `icons.yml`. Its rules mirror what
the templates read -- when a template starts reading a new field, update the matching rule.

- **team.yml** — Members, current (`active: true`, shown on /people/) and former. Fields:
  `name`, `photo` (file in `images/members/`), `info` (the role line), `category`
  (principal-investigator/postdoc/student/research-assistant/support), `sort-key`
  (lastname-firstname), `active`, optional `intro` (one line on the card), `email`, and
  `link`, the slug of the profile page `_pages/people/<link>.md`.
- **publist.yml** — Papers, newest first; /publications/ groups them by `year` as they
  come, so the order matters (the data check enforces it). Fields: `authors`, `title`,
  `journal`, `year`, `vip` (optional: `volume(issue):pages` with the last page in full,
  "84(9):1764-1782.e10", or "12:6026" for an article number; the data check enforces
  the form, since the citations take it apart), `doi`, `url` (where the title
  links), `supplement` (optional, a link to supplementary data or code), `topics`
  (one or more ids from topics.yml, a list: `[mirna-biogenesis, methods]`), and
  `research` (optional, one of those topics: the section of the Research page the paper
  goes under, which shows its newest two so marked; only the lab's own papers, not
  reviews or collaborations it had a small part in), and `image` (optional, the picture
  on the right of its card there: a file in `images/papers/` named for the DOI,
  `s41587-025-02891-7.jpg`, a panel or a graphical abstract made 3:2 on white by
  `_tools/paper-image.py`; the data check fails on a missing file). Each author
  has `name` as printed ("J. J. Seo") and, for a lab member, either
  `link` (a team.yml link, for someone with a profile page) or `lab: true` (no link;
  every author is set alike), plus `is_first`/`is_corresponding` for the superscripts
  (`is_first` only when two or more share first place; `is_corresponding` on every
  corresponding author, sole or not, each shown `✉`; the data check warns of a paper
  with none). A `lab: true` author may also have `full_name`, the former member the initials
  stand for, spelled as in alumni_members.yml: the name then links to their entry on
  /people/ (`#alumni-<name slugified>`). Initials alone cannot say who it is ("Y. Lee"
  is three people over the years), hence a field on each author line rather than one
  table; a `full_name` that is not in alumni_members.yml stays unlinked and the build
  warns. Journal names are spelled out in full and consistently, since
  /publications/by-journal/ groups by them.
- **topics.yml** — The topics of /publications/by-topic/, in the order it lists them
  (the Research page's sections first, in its order): `id`, which a paper's `topics`
  names, and `name`, the heading. A paper is listed under each of its topics; `other`
  is for a paper no other topic fits, and goes alone.
- **chapters.yml** — Book chapters, the same fields as publist.yml but no `topics`.
- **patents.yml** — Patents, by `title`.
- **alumni_members.yml** — Former members, most recently departed first (the people page
  keeps file order): `name`, `position`, `years` ([first, last] or [last]), `current`
  (where they are now), optional `url` (an outside page about them; the name, in the
  text colour like every other, then links to it with a small link icon after it, so
  that no one stands out for having a page). Each entry is the
  anchor `/people/#alumni-<name slugified>` the publications' `full_name` links point
  at, so a renamed entry needs those changed too (the build warns of any left over).
- **news.yml** — Announcements, newest first: `date` ("Feb 26, 2025", or a year alone,
  "2025", when the day is not known) and `headline` (HTML allowed).
- **photos.yml** — The photos page, newest first: `period` (the heading it falls under,
  "2021–2025"), `date` ("May 2025"), `caption`, and either `photo` (a file in
  `images/photos/`) or `youtube` (a video id) with `thumb` (its thumbnail, also in
  `images/photos/`; YouTube's `hqdefault.jpg` with the letterbox bars cut off).

### Layouts (`_layouts/`)

- **default.html** — Base: the masthead (`header.html`, plus `hero.html` when the page has
  `hero:` front matter), the content and the footer.
- **homelay.html** — Two-column (8/4) with news sidebar.
- **gridlay.html** — Full-width grid (people, publications, photos).
- **textlay.html** — Full-width text (research, join, contact, all news, about, 404).
- **redirected.html** — A stub that sends an old address on to its new one with a meta
  refresh (no script, for the CSP). Used by `_pages/redirects/`, one file per address of
  the old WordPress site (`/en/members/` → `/people/`, the Korean pages to their English
  counterparts); `defaults` in `_config.yml` gives them this layout and `sitemap: false`,
  so a stub is just `permalink` (the old address) and `redirect_to`.
- **member.html** — A member's profile: photo, name and position, then the links (CV,
  GitHub, ORCID, Google Scholar, PubMed, email) as icon buttons beside the text, and the member's
  papers from `{% include publication_in_profile.html %}` in the page body, which matches
  the page's file name against author `link`s (the PI's page leaves it out: it would be
  the whole list; hers has Education and Positions instead). The email button is
  `_includes/email_chip.html` (see Email addresses under Conventions).

### Pages (`_pages/`)

Content pages live here. Member profiles are in `_pages/people/[link].md`. The sections
are People (/people/), Research, Publications (with /publications/by-topic/ and
/publications/by-journal/), Photos, and the "Join us" button (/join/); Contact and About
this site are linked from the footer, All news from the home page.

### Key includes (`_includes/`)

- **header.html** — Wordmark, the four section links and the "Join us" button.
  `aria-current` marks the section of the current page (its first URL segment): "page" on
  the section's own page, "true" on a page under it (a profile under People).
- **hero.html** — The home page's headline, intro and buttons, from the page's `hero:`
  front matter (see `_pages/home.md`), then the scene's canvas and its script.
- **team_lead.html** — The people page's opening band: the PI's photo, role, name, intro
  and buttons (her full profile, email).
- **team_list.html** — The member cards (4:5 photo, name, role, optional intro; each a link
  to the profile), for the active members in `selected_categories`. With
  `order="monthly"` they are shuffled into an order seeded by the month in Korea
  (`_plugins/monthly_shuffle.rb`); `TEAM_ORDER_MONTH=2026-11` builds as if it were
  another month.
- **publication_entry.html** — One publication (title, authors, journal, year, volume,
  then its Cite button), used on the publication pages and the profiles;
  **research_papers.html** puts a Research section's newest two papers marked
  `research` under it, each a card like a Notion bookmark linking to the paper (title,
  plain author names, journal and year, and the paper's `image` on the right, or on top
  in a narrow card; no Cite button, which a link cannot hold);
  **publication_author_list.html** formats its authors;
  **publication_extras.html** is the book chapters and patents the publication pages end
  with; **cite_dialog.html** is the Cite window, included once by each page that lists
  papers.

## Common Content Tasks

### Add a team member

1. Add an entry to `_data/team.yml` with `active: true`
2. Create `_pages/people/<link>.md` (copy an existing one): front matter `layout: member`,
   `title` (the name), `position`, then every link key, left empty where there is none
   (an empty one shows no button, and the member can fill it in): `email`, `github`,
   `orcid` (the iD, `0000-0000-0000-0000`), `scholar` (the user id), `pubmed` (a full
   search URL), `cv`; then `image` and `permalink: /people/<link>`, in that order as in
   every profile; then the body: a bio, `## Current project` (`## Role` for the office staff),
   `## Education` as a `<ul class="chronological">` where known, and
   `{% include publication_in_profile.html %}`
3. Add the photo as `images/members/<link>.jpg`, at least 520px wide (the people page
   crops it to 4:5 around the centre and resizes it)

### Replace a placeholder

Much of what the profiles say is a stand-in until each member writes their own. The
bios of members with papers or a public profile are drawn from those; everything else
is invented, and so overblown (superpowers, starships, schools from films and cartoons
such as Hogwarts) that no reader takes it for real: each such block in a profile follows
a `{% comment %}PLACEHOLDER ...{% endcomment %}` line, a made-up card intro in
`_data/team.yml` carries the same words as a `# PLACEHOLDER ...` comment, a made-up
email in a profile's front matter a `# placeholder` comment, and every made-up email
ends in `.example`, a domain reserved never to deliver mail.
`grep -rn -i placeholder _pages/people _data/team.yml` lists them.
Replace the text and drop the marker. In a real Education entry, a year followed by `?`
(`2011?–2017`) is an estimate: only the year the degree ended was known.

### Add a publication

Add an entry to the top of `_data/publist.yml`. Give lab authors `link:` if they have a
profile page, `lab: true` (and `full_name:`, for a former member) otherwise, and the paper
its `topics` (`_data/topics.yml`). Write `vip` as `volume(issue):pages` with the last
page in full, or leave it out while the paper is online only; mark `is_corresponding`
on every corresponding author (each gets `✉`) and `is_first` on co-first authors only.
The Cite button and its citations follow from the entry. A lab member who co-authored
from elsewhere (a former member in their own lab) still gets `lab: true` and
`full_name`, so the name links to them. If the paper is the lab's own work on one of
the Research page's topics, give it `research:` too, naming that topic; it then shows
under the section, pushing out the older of the two there. For the picture on its card,
crop a telling panel or the graphical abstract, paint out any fragment cut at its edge,
make it 3:2 with `python3 _tools/paper-image.py <figure> images/papers/<DOI suffix>.jpg`
(needs Pillow), and name it in `image:`. The site serves its own copy: no image is
loaded from the publisher.

### Add news

Add an entry to the top of `_data/news.yml`. HTML is supported in `headline`.

### Add photos

Put the file in `images/photos/` (`YYMM-what.jpg`, at most about 2000px on the long side)
and add an entry to `_data/photos.yml` in date order, under its period. For the home
carousel, crop a 3:2 copy into `images/home-slider/` and add a slide and a dot to the
carousel in `_pages/home.md`; every slide but the first carries `loading="lazy"`.

### Move a member to former members

Set `active: false` in team.yml (the profile stays, so author links keep working), set
`position: Former member (<first year>–<last year>)` on the profile page, and add an
entry to the top of `_data/alumni_members.yml`.

### Change a page's social card

`_includes/head.html` builds the title, description, canonical link and Open Graph tags
from front matter: `title`, the page's short name (the tab shows "People | Narry Kim Lab",
except on the home page), `excerpt`, one sentence on what the page holds (falls back to
`site.description`), and `image` (falls back to a lab photo). Member pages compose their
description from `title` and `position`. `sitemap: false` excludes a page from the sitemap
(the 404 page has it).

## Conventions

- Focus styles use `:focus-visible`, never `:focus` (in `_sass/_base.scss` too): the ring
  and the hover look are for keyboard focus, and a mouse click on something that stays
  on the page -- a carousel arrow, an email button -- must leave no ring behind. The photo
  viewer keeps focus on its dialog while it is paged, for the same reason.
- Headings never skip a level: a page has one `#` (its title), and its sections are `##`.
  CSS sets their size per context; do not drop to `###`/`####` for size.
- Member URL slugs: lowercase hyphenated (`jane-doe`); sort keys `lastname-firstname`.
- Publication author superscripts: `<sup>1</sup>` = co-first author (only when there
  are two or more), `✉` = corresponding author (every one, sole or not, as journals
  mark them): U+2709 with the text variation selector U+FE0E, so phones do not draw a
  colour emoji, hidden from screen readers, which get "(corresponding author)". Author
  names are links without an underline, underlined only on hover and keyboard focus.
- Custom plugins: `_plugins/sri.rb` adds an `sri` filter that hashes a local file at build
  time, and a `fingerprint` filter for its URL:
  `<script src="/js/x.js?v={{ '/js/x.js' | fingerprint }}" integrity="{{ '/js/x.js' | sri }}">`.
  Use both for every script tag. Without the fingerprint, a browser holding the old file in
  its cache finds it fails the new page's integrity check and runs no script at all.
  `_plugins/data_check.rb` validates `_data/` (see above). `_plugins/citations.rb`
  gives each paper and chapter a `cite_id` (its BibTeX key) and writes every citation
  into `/publications/cite.json`, with Liquid off for that file (BibTeX's `{{`).
- Photos go through `{% picture <preset> <path> alt="..." %}` (`_plugins/picture.rb`), not a
  bare `<img>`: it publishes WebP copies at the widths of the preset (`pictures:` in
  `_config.yml`) with `srcset`/`sizes` and the right `width`/`height`, so commit the
  JPEG and let the build resize it. A production build needs libvips (in
  `environment.yml`; CI installs it); other builds fall back to the original image. The
  member page photo and Open Graph images stay plain JPEG, since link-preview crawlers
  handle WebP poorly.
- Icons are inline SVG, not an icon font: `{% include icon.html name="youtube" %}`. The
  shapes live in `_data/icons.yml`, from Font Awesome Free 5.15.3 (CC BY 4.0); to add one,
  copy its `viewBox` and path from that version's SVG. The data check fails the build on
  a name that is not there.
- Email addresses are drawn, not written, so that no program reading the HTML or the DOM
  finds one: `{% include email_chip.html address=... name=... %}` for a button,
  `{% include email_link.html address=... name=... %}` in running text. The `mail_glyphs`
  filter (`_plugins/mail_glyphs.rb`) writes the address as code points of the Private Use
  Area, by the table in `_data/mail_glyphs.yml`, and the fonts NKL Mail Display and NKL
  Mail Sans (`fonts/NKLMail-*.woff2`: Montserrat's and Plex's own glyphs, mapped from those
  code points, cut by `_tools/mail-fonts.py`) draw them, so it looks exactly as the
  letters would. `js/site.js` holds the same table: it makes each a link whose mailto
  address is filled in only while it is pointed at, focused or clicked, and copying a
  selection copies the real address. Screen readers hear "Email <name>". The build fails
  if a page shows a known address or a `mailto:` link as text, or if the script's table
  differs from the data file's. A new table: `python3 _tools/mail-fonts.py --new-table`
  (needs `pip install fonttools brotli`), then copy its two values into `js/site.js`.
- No inline scripts, no `style="..."` attributes or `<style>` blocks, and no third-party
  scripts, fonts or images: the site should keep working under a strict
  Content-Security-Policy (`script-src 'self'`, no `'unsafe-inline'`). A one-off style
  gets a class in `css/main.scss`. Videos are linked, not embedded.
- Links to the site's own pages and assets are root-relative (`{{ site.baseurl }}/...` or
  `relative_url`), never `{{ site.url }}`; only canonical and Open Graph URLs use
  `absolute_url`.

## Deployment

GitHub Pages. `.github/workflows/jekyll.yml` builds every push and pull request with
`JEKYLL_ENV=production` and link-checks the result; only `main` is deployed. It also
rebuilds on a schedule around the turn of each month, which brings in the people page's
new monthly order (GitHub turns off a public repository's schedules after 60 days without
activity; re-enable the workflow in the Actions tab if the order stops changing).
`.github/workflows/external-links.yml` checks outbound links every Monday and keeps a
single "Broken external links" issue open while any fail; it ignores 403/429, which
publishers send to every bot. Dependabot proposes action and gem updates monthly.
There is no `CNAME` yet: add one holding `narrykim.org` when the domain moves here.
Until then the site is served at narrykimlab.github.io while narrykim.org is still the
old WordPress site, so `url` in `_config.yml` is `https://narrykimlab.github.io`: the
canonical, Open Graph, sitemap and `robots.txt` addresses follow it, and a link preview
(Notion, Slack) can load its image. Set it back to `https://narrykim.org` with the CNAME.
