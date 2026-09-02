---
name: VITROLA
description: House letterhead with a phonograph seal — the list is the document.
colors:
  paper: "#E8E7E2"
  ink: "#141414"
  ink-2: "color-mix(in srgb, #141414 62%, #E8E7E2)"
  signal: "#9B1D2A"
typography:
  display:
    fontFamily: "IM Fell English, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 7.5vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "0.02em"
  trade:
    fontFamily: "IM Fell English, Times New Roman, serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "clamp(1.65rem, 3vw, 2.15rem)"
    fontWeight: 600
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  lede:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Schibsted Grotesk, system-ui, sans-serif"
    fontSize: "0.92rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "-0.01em"
rounded:
  none: "0"
  disc: "50%"
spacing:
  gutter: "clamp(1.25rem, 4vw, 3.5rem)"
  gap: "1.15rem"
  section: "2.75rem"
  row: "1.15rem"
components:
  skip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    padding: "0.35rem 0.6rem"
    rounded: "{rounded.none}"
  wordmark:
    typography: "{typography.display}"
    textColor: "{colors.ink}"
  trade:
    typography: "{typography.trade}"
    textColor: "{colors.ink-2}"
  seal:
    textColor: "{colors.ink}"
    width: "5.5rem"
    height: "5.5rem"
    rounded: "{rounded.disc}"
  overlay:
    backgroundColor: "{colors.paper}"
    width: "3.5rem"
    height: "3.5rem"
    rounded: "{rounded.disc}"
  overlay-hover:
    backgroundColor: "{colors.paper}"
    width: "3.5rem"
    height: "3.5rem"
    rounded: "{rounded.disc}"
  rail-row:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "1.15rem 0 1.05rem"
    rounded: "{rounded.none}"
  rail-title:
    typography: "{typography.title}"
    textColor: "{colors.ink}"
  go:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
---

# Design System: VITROLA

## Overview

**Creative North Star: "House Letterhead"**

VITROLA is the web software factory's evaluation room, nested as a house brand inside a client product repo. This surface is not a product landing and not a card gallery. It is the letterhead the client came to use: studio name at display scale, trade line, a grooved phonograph disc with the vitrola engraving as its label, a measured brief, then a numbered staff of prototypes. The list is the document. The disc is the house mark — the object the house is named for.

The field is uncoated paper; the voice is black ink. Hierarchy is Schibsted Grotesk in size and weight steps. Modules sit flush left on one sheet. Rows are open type on the field — no tiles, no enclosure, no lift. Client name (Dr. Rocha) appears as a fact in the brief and colophon; it does not lend clinical color, chrome, or product UI to this letterhead. On mockups, the same circular mark is injected as a floating return overlay; it is house chrome on a foreign page, not a second surface on the letterhead.

**Key Characteristics:**
- Paper field, ink type, ink staff rules — one material on the sheet
- Grooved disc with ink-engraving label on the mast; same mark as the mockup overlay
- Single grotesque; display through label are size steps of the same face
- Flush-left modules on a 12-column sheet; the brief is a measure, not a card
- Numbered rail is the only action on the gallery; hover underlines the title
- Square letterhead except the disc; signal wine appears only as the focus ring

## Colors

Two inks on one paper. The accent is a focus instrument, not a brand wash.

### Primary
- **Black Ink** (`ink`): type, wordmark, staff rules, groove strokes, skip-link fill, selection background, overlay border. The house voice.

### Secondary
- **Focus Wine** (`signal`): `:focus-visible` outline only (2px, offset 3px), on the sheet and on the overlay. Not a fill, not a heading color, not a hover wash.

### Neutral
- **Uncoated Cool Paper** (`paper`): full-viewport field, skip-link type, selection type, overlay fill. Not a framed page on a darker desktop.
- **Diluted Ink** (`ink-2`): lede, rail number/id/status, summary, colophon. Secondary reading, still the same ink.

### Named Rules
**The Ink-on-Paper Rule.** The field is paper. Type, staff, and grooves are ink. Diluted ink is for secondary reading. Signal is reserved for focus.

## Typography

**Display Font:** IM Fell English (Times New Roman serif fallback) — lockup only
**Body Font:** Schibsted Grotesk (with system-ui, sans-serif)
**Label/Mono Font:** none — labels stay in the grotesque; empty-state `code` inherits the face at weight 600

**Character:** The house nameplate is letterpress serif. The reading page is the sharp grotesque. Authority of the lockup is the old face at two sizes; authority of the list is Schibsted size steps.

### Hierarchy
- **Display** (400, `clamp(2.75rem, 7.5vw, 4.5rem)`, line-height 0.92, tracking 0.02em): studio wordmark (`VITROLA`) in IM Fell English.
- **Trade** (400, 0.78rem, line-height 1.2, tracking 0.04em): “Fábrica de software web”, same face, right-aligned under the wordmark.
- **Headline** (600, `clamp(1.65rem, 3vw, 2.15rem)`, line-height 1.12, tracking −0.03em): the page `h1` in the brief (“Protótipos para avaliação”).
- **Title** (600, 1.2rem, line-height 1.2, tracking −0.02em): prototype title on the rail.
- **Lede** (400, 1.125rem, line-height 1.5): brief paragraph in diluted ink.
- **Body** (400, 1.0625rem, line-height 1.5, tracking −0.01em): page default.
- **Label** (500, 0.92rem, tabular-nums): rail index, slug, status, and colophon (colophon at weight 400).

### Named Rules
**The Nameplate Rule.** IM Fell English is the lockup — wordmark and trade — and nowhere else. The rest of the sheet stays Schibsted. **The Size-Step Rule.** On the reading page, hierarchy is size, weight, and tracking of one grotesque.

## Layout

A centered sheet (`max-width: 76rem`) with a 12-column grid and `{spacing.gap}` gutters. Every module — mast, brief, rail, colophon — spans the full grid and sits flush left. Column tracks exist as letterhead structure; they are not a magazine placement system.

The mast is a flush-left lockup: grooved disc on the left, then the nameplate (wordmark over a small right-aligned trade line). The disc is 5.5rem (4.35rem below 720px).

Page padding is `{spacing.gutter}` on the sides, a slightly taller clamp on top, and 4.5rem at the bottom. Vertical rhythm between modules is `{spacing.section}` (about 2.5–2.85rem). The brief is capped at 38rem; rail summaries at 48ch (uncapped below 720px).

The rail is a four-track row on a wide viewport: index (3.25rem), slug (`minmax(6.5rem, 11rem)`), copy, then status and “Abrir” as the trailing auto column. Below 720px it stacks to index + copy / id+status / go. Indices are zero-padded two-digit tabular numbers.

The overlay is house chrome on mockups, plus the session sheet when opened from the gallery letterhead. It is injected by `node start` as a 3.5rem circle on mockup pages, fixed to the bottom-right safe-area inset. The disc opens the house menu (home, annotate, session notes); it does not itself navigate. The gallery keeps a staff-line link to session notes; the floating disc stays hidden there until the sheet is open.

### Named Rules
**The Module Rule.** One grid, typographic state. Modules are flush-left blocks on the sheet. Do not center the brief as a card, and do not park content in interior columns for decoration.

## Elevation & Depth

The letterhead is flat. No shadows, no ambient lift, no tonal panels on the sheet. Depth on the gallery is the vertical staff: 1px solid ink under the mast, 1px solid ink on each row’s top edge, and 1px solid ink under the rail. Hover does not raise the row.

The overlay is the exception: a floating seal on a foreign page, with a soft ink-tinted drop (`0 8px 20px rgba(20, 20, 20, 0.16)` at rest; `0 12px 28px rgba(20, 20, 20, 0.2)` on hover). That lift stays on the overlay. Do not bring it onto the sheet.

### Shadow Vocabulary
- **Overlay rest** (`box-shadow: 0 8px 20px rgba(20, 20, 20, 0.16)`): keeps the injected seal readable on mockup pages.
- **Overlay hover** (`box-shadow: 0 12px 28px rgba(20, 20, 20, 0.2)`): slightly fuller drop with a 1px rise. Still overlay-only.

### Named Rules
**The Staff Rule.** The list is a vertical staff of full ink rules. Rules are 1px solid ink on paper — not diluted hairlines, not box strokes around a tile.

## Shapes

Square letterhead. Radius is `{rounded.none}` on the skip link, rows, sheet, and “Abrir” mark (inline square-cap stroke arrow, 0.95rem, stroke 1.4). The one circle is the disc: mast seal (5.5rem, 4.35rem below 720px) and the 3.5rem overlay. Both use `{rounded.disc}`. The engraving is circular-cropped into the label; the overlay is a 1px ink ring on paper, overflow clipped to the circle.

### Named Rules
**The Round Exception Rule.** The letterhead is square. The only circle is the phonograph disc — mast seal and overlay. Nothing else is round.
**The No Enclosure Rule.** A prototype is a row on the staff, not a card. No fill, radius, border-box, or shadow around the item.
**The Exposed Count Rule.** A folder is a row: number, slug, title, optional summary/status, open.
**The Grooves-Only Rule.** The platter turns the groove rings only (`90s` linear, infinite). The engraving label stays still. Under `prefers-reduced-motion`, the disc does not spin.

## Components

This letterhead has no product buttons, chips, or cards. The numbered row opens a prototype. After the staff, a single ink line links to session notes — underline on hover, same as a title, not a filled control.

### Skip link
- **Shape:** square; padding 0.35rem 0.6rem
- **Primary:** ink fill, paper type; parked off-canvas until focus
- **Hover / Focus:** on focus, it sits at the top gutter with no transition timing

### Wordmark / mast
Lockup: disc to the left of the nameplate. Studio name in IM Fell English; trade line underneath in the same face, smaller, right-aligned to the wordmark. Mast spans the sheet and closes with the first staff rule. The trade line is part of the mark, not a kicker above the heading. The disc is decorative (`aria-hidden`); it is not a control and not a second wordmark.

### Phonograph seal (signature)
- **Shape:** circle; size 5.5rem (4.35rem below 720px)
- **Grooves:** concentric ink rings (outer and label-ring at 1.15 stroke; inner grooves at 0.45) in an SVG that fills the disc
- **Label:** circular crop of the vitrola ink engraving (`vitrola-mark.png`), inset 22% so it sits as the record label
- **Motion:** grooves rotate; label does not. No spin under reduced motion

### Brief
Headline plus lede in the 38rem measure. Lede uses diluted ink. This is the letterhead’s statement of purpose, not a hero card.

### Rail row (signature)
- **Shape:** open row; padding 1.15rem 0 1.05rem; top staff rule
- **Background:** none (paper shows through)
- **Hover / Focus:** underline the title only (1px, offset 0.18em). The row itself does not fill, lift, or slide. Focus-visible uses the wine outline on the row.
- **Meta:** index, slug, and status in diluted ink at label size, tabular nums
- **Go:** “Abrir” plus the square-cap arrow, weight 600, trailing

### Empty rail
One line of diluted ink. Folder names in `code` inherit the grotesque at weight 600, ink.

### Overlay return (signature)
Injected by the prototype server onto mockup HTML and onto the gallery (for session notes). On mockups: round paper disc, 3.5rem, 1px ink border, engraving fill, fixed bottom-right. Opens the house drawer (paper, ink staff rows: Home, Anotar, Anotações da sessão). The disc slides with the drawer; annotate expands the same sheet to a transparent full viewport with square ink tools; session expands it as a paper sheet of saved prints. After zip, the session clears and the browser returns to the gallery. On the gallery, the idle disc is hidden; the letterhead staff link opens the same session sheet. Hover rises 1px and deepens the drop; focus-visible is the wine ring. Under reduced motion, hover does not translate. This is house chrome, not a product CTA.

### Colophon
Label size, diluted ink, flush left. Client fact plus the round-seal return: the overlay, not browser-back copy, is how mockups send the visitor home.

## Do's and Don'ts

### Do:
- **Do** set the studio wordmark at display scale, keep the trade line directly under it, and trail the identity with the grooved disc.
- **Do** treat the numbered rail as the only action on the first viewport.
- **Do** draw staff rules in 1px solid ink (mast, row tops, rail foot).
- **Do** underline the prototype title on hover and focus-visible (1px, offset 0.18em) and nowhere else.
- **Do** keep the brief in the 38rem measure and the sheet flush left.
- **Do** inject the same circular mark onto mockups as the return overlay.

### Don't:
- **Don't** enclose rows in cards, tiles, chips, or bordered panels.
- **Don't** bring Dr. Rocha clinical/teal product tokens onto this letterhead.
- **Don't** add a kicker or room-label above the heading; the trade line under the wordmark is the only house identification.
- **Don't** animate rows on entrance, stagger, or cascade. The sheet is still; the only motion is the groove spin.
- **Don't** put IM Fell English on the rail, brief, or overlay chrome — it is the nameplate only. The rail opens prototypes; the disc is the house seal, not a CTA.
- **Don't** round anything except the disc, spin the engraving, or park a floating disc on the idle gallery.
