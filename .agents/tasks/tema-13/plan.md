# Implementation Plan: theme "Kliping Merah" (reference: jsambac.com/tema-13)

Worktree: `/Users/Projects/udangan-website/.worktrees/tema-13` (branch `feat/tema-13`, base `main`). Always use absolute paths, because relative paths land in the parent workspace.
Reference capture: `/Users/Projects/udangan-website/.reference/jsambac-tema-13/` (`notes.md` is the source of truth for measurements). Below, `REF` means that folder and `WT` means the worktree.
Template theme: `WT/src/themes/surat-marun/` (built from another jsambac page that runs on the same runtime).
Checklist walked by the per-section loop: `/Users/Projects/udangan-website/.agents/tasks/tema-13/sections.json`.

## 0. Decisions

- **Slug `kliping-merah`, display name "Kliping Merah".** The design is a scrapbook ("kliping") of taped black-and-white photos and paper notes on a red cover and closing card. The two-word Indonesian noun + colour form matches `surat-marun`, `pita-krayon`, `renda-rimba` and `tirai-beludru`. The slug is not used anywhere in `src/` or `scripts/`. Theme slugs are not top-level routes, so `RESERVED_SLUGS` needs no change.
- **Architecture: a copy of surat-marun.** Copy its `canvas.tsx` (`u()`, `txt()`, `box()`, `Section`, `useFit`), its `index.tsx`/`manifest.ts`/`tokens.ts`/`fonts.ts` shape, `prepareBehindCover: true`, and `art/textures.ts` (`paperBg`). Constants are prefixed `km` and CSS classes `km-`. The canvas is 430 px wide, which equals the reference screenshot width. Every coordinate below is in **screenshot px**: reference layout px × 0.7706, so numbers can be read straight off the PNGs.
- **No original image is shipped.** Every tema-13 image is a 1028-px composite JPG that bakes in the demo couple's photos, names, parents and dates (notes.md, "Usage restriction"). The remaining files are third-party linkundangan UI (`card.png`, `clippy.svg`, `bg-rekening.jpg`, stickers, `loading.gif`, PhotoSwipe skin). The repo policy never uses either kind. Tape, paper notes, the torn polaroid, the ledger card, red hand-drawn ovals, the heart and the pill textures are redrawn as SVG/CSS in `kliping-merah/art/`, like surat-marun did. The baked text becomes live text. So no asset has status `dev`, `pnpm build` is not blocked, and `THEME_ASSETS` stays `{}`.
- **The animation engine reproduces the reference's `animation-scroll.js`.** A `<Anim kind>` wrapper is added in `canvas.tsx`, and each element has its own trigger. The class is added when the element's top passes 57% of the viewport height (`scrollY + innerHeight/1.75 > offsetTop`, done with an IntersectionObserver using `rootMargin: "0px 0px -42.86% 0px"`). It is removed again when the element is entirely below the viewport, so the animation replays like the reference. Nothing triggers before `opened`. The kinds and timings come from `REF/raw/keyframes.css`, all at 2.5 s: `grow` (scale 0→1, `transition: transform 2.5s ease`), `left` (translateX(-100vw)→0, 2.5 s ease; the reference animates `left:-999px`, and transform is used for perf), `right` (translateX(100vw)→0), `swing` (animate.css swing, 2.5 s, `transform-origin: top center`, fill both), and `bounce` (animate.css bounce, 2.5 s, origin center bottom). Under `prefers-reduced-motion` everything is static and visible. In lite mode, swing and bounce become a 0.6 s fade.
- **Loading screen omitted.** The reference shows it for under 400 ms. README §10 requires the names to be visible in the first HTML, and §14 sets LCP ≤ 2.5 s, so an overlay would cost LCP for no lasting visual.
- **Stickers omitted from the guestbook.** `_shared/runtime/guestbook.tsx` has no sticker field, and the 35 GIFs are third-party. The form keeps Name / Attendance / Message / Cancel / Send. The Sticker button is not rendered, so no dead control appears.
- **The "Invitation by Jsambac" credit and the jsambac.com pill are omitted.** They are the vendor's branding, not part of the couple's design. The closing card keeps its bottom padding.
- **Sections not in tema-13** (`dressCode` as its own section, `liveStream`, `rsvp`) are left out of `manifest.sections`. The dress code text is shown in the "Catatan" box of the location section, which is where tema-13 puts it. RSVP is merged into `ucapan`, as in surat-marun.
- **Music:** reuse `/placeholders/music/renda-rimba.m4a` ("Romantic Wedding Acoustic Guitar", Tunetank, already in `public/placeholders/CREDITS.md`). Add "Kliping Merah" to that row's theme column. The Beatles MP3 in the capture is never used.
- **Desktop:** ThemeRoot's 440-px column on `--inv-backdrop: #e4e2dd` is accepted. The reference card is 867 px wide on desktop, but notes.md says no separate desktop design exists.
- **Arabic quote text** (`quote.arabic`) is not shown in `ayat`, because the reference shows only the translation and source. The bismillah in `salam` uses a tiny Amiri subset.

## 1. Design tokens

### Palette (`WT/src/themes/kliping-merah/tokens.ts`)
Variant 1 is **Merah**, the reference palette. The other two variants change only the red tokens.

| Token | Merah | Biru Tinta | Hijau Botol | Use |
|---|---|---|---|---|
| `--inv-red` | `#990f0a` | `#1f3a68` | `#24493a` | cover card, closing card, heading text, red rules/outlines, heart, pill |
| `--inv-paper` | `#e4e2dd` | same | same | page and section background |
| `--inv-paper-note` | `#efeee9` | same | same | heading paper notes, ledger card |
| `--inv-cream` | `#e8e0d0` | same | same | lettering on red |
| `--inv-ink` | `#212529` | same | same | body text |
| `--inv-muted` | `#808080` | same | same | form labels, stats, wishes |
| `--inv-teal` | `#356364` | same | same | Send / Load more outline |
| `--inv-teal-dark` | `#072d2e` | same | same | Attendance pill |
| `--inv-gold` | `#d4c472` | same | same | map iframe border |
| `--inv-story-bar` | `#3d3d3d` (black at 0.89 opacity over paper) | same | same | love story date bar |
| runtime `--inv-bg` / `--inv-bg-alt` | `#e4e2dd` / `#efefec` | | | |
| `--inv-text` / `--inv-text-muted` | `#212529` / `#808080` | | | |
| `--inv-primary` / `--inv-primary-text` | `#ffffff` / `#212529` | | | music button: white circle |
| `--inv-surface` / `--inv-surface-text` | `#3f8f4a` / `#ffffff` | | | toast: green "Berhasil disalin" |
| `--inv-backdrop` | `#e4e2dd` | | | desktop background |

Swatches: `[red, "#e4e2dd", "#e8e0d0"]`. Manifest `thumbnail`: `{ background: "linear-gradient(160deg,#a8140e 0%,#7a0b07 100%)", foreground: "#e8e0d0" }`.

### Typography: OFL substitutes, CSS variable, file

| Role in reference | Substitute (OFL, google/fonts path) | Var / constant | Output file in `WT/src/themes/_fonts/` | Subset |
|---|---|---|---|---|
| Hand-lettered rounded caps (cover names, headings, bride/groom, NOVEMBER, AKAD NIKAH, THANK YOU; ltcomical) | Patrick Hand `ofl/patrickhand/PatrickHand-Regular.ttf` | `--km-hand` / `kmHand` | `patrick-hand.woff2` | LATIN |
| Small mono labels (cover corners, parents, event times, collage labels, closing row) | DM Mono 400 `ofl/dmmono/DMMono-Regular.ttf` | `--km-mono` / `kmMono` | `dm-mono-400.woff2` | LATIN |
| Typewriter (quotes, "We invite you…", "Kindly confirm…", gift message, closing message) | Courier Prime 400 `ofl/courierprime/CourierPrime-Regular.ttf` | `--km-type` / `kmType` | `courier-prime-400.woff2` | LATIN |
| Handwritten script (collage note and quote, the "&" between the couple) | Nothing You Could Do `ofl/nothingyoucoulddo/NothingYouCouldDo.ttf` | `--km-script` / `kmScript` | `nothing-you-could-do.woff2` | LATIN |
| Marcellus (venue, Catatan, LOVE STORY, story text) | Marcellus `ofl/marcellus/Marcellus-Regular.ttf` (the real font) | `--km-serif` / `kmSerif` | `marcellus-400.woff2` | LATIN |
| Alata (countdown, attendance, gift bank and number, date digits) | Alata `ofl/alata/Alata-Regular.ttf` (the real font) | `--km-alata` / `kmAlata` | `alata-400.woff2` | LATIN |
| Poppins (form labels and buttons) | Poppins `ofl/poppins/Poppins-Regular.ttf`, `Poppins-Bold.ttf` | `--km-pop` / `kmPop` | `poppins-400.woff2`, `poppins-700.woff2` | LATIN |
| DM Sans (Dear, guest, Open Invitation (aller), THE DAY, wishes, A.N) | existing `dm-sans-400-700.woff2` (shared with surat-marun) | `--km-sans` / `kmSans` | existing | — |
| Bismillah calligraphy | Amiri `ofl/amiri/Amiri-Regular.ttf` | `--km-arab` / `kmArab` | `amiri-bismillah.woff2` | `text`: "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ" only |

- **Loading:** `WT/src/themes/kliping-merah/fonts.ts` uses `next/font/local` with `display: "swap"` and `preload: false`, following `surat-marun/fonts.ts`. It exports `fontClassName`.
- **Cover budget:** the cover uses 3 files, Patrick Hand + DM Mono + DM Sans.
- **Total budget:** about 190 KB, under the 250 KB limit. Check the sizes after `pnpm fonts:build` with `ls -la WT/src/themes/_fonts`.
- **Build entries:** add a `// ---- Kliping Merah ----` block to `WT/scripts/fonts-build.ts` after the Surat Marun block, following its entry shape (`name`, `src`, `license: "ofl/<family>/OFL.txt"`, `outputs`).
- **Licenses:** `fonts:build` copies them to `_fonts/licenses/<family>-OFL.txt`. Then run `pnpm licenses:build`.
- **Bad source path:** if a path 404s, look up the exact filename at https://github.com/google/fonts/tree/main/ofl/<family>. Do not switch to a non-OFL font. Special Elite and Homemade Apple are Apache 2.0 and therefore excluded.
- **Canvas font stacks:** `canvas.tsx` defines `F = { hand, mono, type, script, serif, alata, pop, sans, arab }`, each as `var(--km-x), '<Family>', <fallback>`.

### Spacing / geometry (canvas 430)
- The content column is 430 wide on paper `#e4e2dd`. Section heights from the reference crops:

  | Section | Height (px) |
  |---|---|
  | ayat | 644 |
  | salam (THE DAY 540, plus bismillah and invite about 120) | about 660 |
  | profil | about 580 |
  | acara | 512 |
  | hitungMundur | 144 |
  | maps | 878 |
  | loveStory | 548 |
  | galeri | 1295 |
  | ucapan | 1792 |
  | amplop | 862 |
  | penutup | about 1300 (without the credits) |

- Sections whose text comes from data use `minHeight` plus flow layout (padding-based) rather than a fixed height, so long data grows the section.
- Shared heading block, used by maps, ucapan and amplop: a paper note 296×108 at top 80–97 with two tapes, then a red rule (1 px, `--inv-red`, 307 wide) 55 px below the note, then a red-outlined pill or message box (266 wide, radius 40, 1 px `--inv-red`) 45 px below the rule.

## 2. Asset slots (ASSET-AUDIT.md convention)

- **Audit section:** add a section to `WT/src/themes/ASSET-AUDIT.md`, after Pita Krayon:
  - heading: `## Kliping Merah (referensi jsambac tema-13)`
  - same 10 columns as the other sections
  - IDs prefixed `km-`
  - File paths relative to `REF`
- **Values for every row:** Slot `—`, Status `belum dicek`, Catatan "tidak dipakai — dibuat ulang SVG/CSS" or "foto/teks demo pasangan" as appropriate.
- **Why this is safe:**
  - `scripts/assets-sync.ts` skips rows without a slot.
  - The heading is not in `REFERENCES`, so `assets:sync` copies nothing.
  - `index.generated.ts` stays empty.
- **Caveat:** `pnpm ref:assets` regenerates the whole audit from `REFERENCES` and would drop this section, as it already would for Surat Marun. Do not run it. Document this in the section's intro line.
- Also add a `### Kliping Merah` block to `WT/src/themes/ASSET-NOTES.md`, listing each SVG replacement and its file (pattern: the Surat Marun block at line 74).

| ID | Source (REF/…) | Role | Theme replacement (file → component) | Status |
|---|---|---|---|---|
| `km-cover-art` | `assets/img/F20250829-68b161bd2cc90.jpg` (1028×1340) | Cover lettering, names, corner and side labels | live text in `sections/Cover.tsx` | belum dicek (demo names) |
| `km-cover-bg` | `assets/img/4250785-2.jpg` | Cover modal background, hidden under the colour | CSS `--inv-paper` | belum dicek |
| `km-ayat` | `assets/img/F20250829-68b161bebbe59.jpg` | Torn polaroid, yellow tape, quote, red oval | `art/Ornaments.tsx` → `TornPolaroid`, `MaskingTape tone="yellow"`, `HandOval`; live quote | belum dicek (demo photo) |
| `km-the-day` | `assets/img/F20250829-68b161bd6a9ea.jpg` | THE DAY split portrait | two `next/image` halves + live text | belum dicek (demo photo) |
| `km-bride` | `assets/img/F20250829-68b161bc40bb3.jpg` | Bismillah, invite line, bride name, parents, polaroid, "&" | live text + `Polaroid` (CSS) | belum dicek (demo data) |
| `km-groom` | `assets/img/F20250829-68b161bc64bf6.jpg` | Groom polaroid, name, parents | live text + `Polaroid` | belum dicek (demo data) |
| `km-date` | `assets/img/F20250829-68b1628c6bff4.jpg` | NOVEMBER, day boxes, heart, year, events | live text + `HeartOutline` | belum dicek (demo data) |
| `km-venue-head` | `assets/img/F20250829-68b1628f1a147.jpg` | "DIRECTION TO VENUE" paper note + tapes | `PaperNote` + `MaskingTape` ×2 | belum dicek |
| `km-collage` | `assets/img/F20250829-68b162933b80f.jpg` | Scrapbook collage | `sections/Collage.tsx` + `LedgerCard` | belum dicek (demo photos) |
| `km-rsvp-head` | `assets/img/F20250829-68b1628f7be8e.jpg` | "SHARE YOUR BLESSING" note, rule, pill | `HeadingNote` | belum dicek |
| `km-gift-head` | `assets/img/F20250829-68b1628dccd40.jpg` | "WEDDING GIFT" note, rule, message box | `HeadingNote` | belum dicek |
| `km-closing` | `assets/img/F20250829-68b1628c92cf7.jpg` | Red card, 3-photo strip, THANK YOU, oval | `sections/Closing.tsx` + `HandOval` | belum dicek (demo photos) |
| `km-rekening` | `assets/img/bg-rekening.jpg` | Gift pill brushed texture | CSS gradient (`brushedPill()` in `art/textures.ts`) | belum dicek (third-party UI) |
| `km-card` | `assets/img/card.png` | Gift card icon | inline SVG copied from `surat-marun/sections/Gift.tsx` | belum dicek (third-party UI) |
| `km-clippy` | `assets/svg/clippy.svg` | Copy icon | inline SVG copied from `surat-marun/sections/Gift.tsx` | belum dicek (third-party UI) |
| `km-envelope` | `assets/img/envelope-love.webp` | Sticker modal ornament | not used (no sticker modal) | belum dicek |
| `km-loading` | `assets/img/loading.gif` | Loading spinner | not used | belum dicek |
| `km-pswp` | `assets/img/default-skin.png` | PhotoSwipe skin | not used | belum dicek |

- **Stickers:** `assets/stickers/*` (35 files) get one summary row, `km-stickers`, marked "tidak dipakai (pihak ketiga)".
- **Fonts and audio:** the files in `assets/fonts/*` and `assets/audio/*` are never used, per README §8 and §9. Mention this in the section intro, not as rows.
- **Placeholder photos** already exist in `WT/public/placeholders/photos/`:
  - `wedding-cover`, `wedding-bride`, `wedding-groom`
  - `wedding-strip1..3`
  - `wedding-closing`
  - `wedding-g1..8`

  No new photos are needed. All of them are greyscaled with CSS `filter: grayscale(1)` on the image wrapper. This is a static filter and is not animated.

## 3. Sections in reference page order

Each section is a file in `WT/src/themes/kliping-merah/sections/` registered in `index.tsx`. Manifest:

```
sections: ["cover","ayat","salam","profil","acara","hitungMundur","maps","loveStory","galeri","ucapan","amplop","penutup"]
sectionOrder: same as sections
weddingPhotos: ["cover","couple","strip","closing"]
defaultMusic: { url: "/placeholders/music/renda-rimba.m4a", title: "Romantic Wedding Acoustic Guitar", artist: "Tunetank" }
```

Dummy data comes from `WT/src/themes/_shared/dummy/index.ts`:
- couple Sekar / Raka
- events Akad 08:00–10:00 and Resepsi 11:00–selesai, 40 days ahead, two different venues
- `loveStory` with 3 items
- `gallery` g1–g8
- `photos.strip` 1–3
- gift: BCA and Mandiri, plus `physical`
- `dressCode.text` plus colours

Dates are derived from `firstEvent(inv.data.events)` (`@/lib/datetime`).

### 3.0 Scaffold: registration, tokens, fonts, cover, opening, fixed UI (`scaffold`)

**Creating the theme.** Run `pnpm -C WT theme:new kliping-merah --nama="Kliping Merah"`. Then overwrite the generated files with copies adapted from surat-marun: `manifest.ts`, `tokens.ts`, `fonts.ts`, `index.tsx`, `theme.css`, `canvas.tsx` and `art/textures.ts`. This auto-updates `registry.generated.ts` and `components.generated.tsx` through `themes:sync`.

**Copied as-is from surat-marun:**
- `canvas.tsx` helpers: `u`, `txt`, `box`, `Section`, `useFit`, `EnterGroup`
- `paperBg` grain
- the Cover's `open()` handler: `done` ref, `startMusic()` called synchronously, then `onOpen()`
- `useFitLine`
- the `--cu` stage scaling, with stage 430 × 860

**New in `canvas.tsx`:** `<Anim kind="grow|left|right|swing|bounce" delay?>`, implemented as described in §0. `theme.css` defines:
- `[data-theme="kliping-merah"] .km-a[data-k=grow]{transform:scale(0);transition:transform 2.5s ease}`, plus `.km-a.km-on{transform:none}`
- `left`/`right` with `translateX(∓100vw)`
- `swing`/`bounce` keyframes copied from `REF/raw/keyframes.css` (renamed `km-swing`, `km-bounce`), applied on `.km-on`
- a `prefers-reduced-motion` block making everything visible

Each section's root uses `overflow-x: clip` so slide-ins do not widen the page.

**Cover** (`sections/Cover.tsx`). Refs: `REF/00-cover.png`, `00-cover@2x.png`, `00-load-t2000.png`, `d00-cover.png`.
- Background `--inv-paper`. The red card (`--inv-red`) is inset 12 px on every side, with radius 25.
- Two lighter vertical bands are visible in the reference at the top (y 0–85) and bottom (y 612+). Skip them, because they are JPG edge artefacts.
- Label rows at y 118 and y 565, DM Mono 400 7.7 px, letter-spacing 0.6, cream:
  - "NOVEMBER" at x 40
  - day "12" at x 158
  - "YEAR OF" at x 278
  - year "2022" right-aligned to x 390
  - Values come from the first event: English month uppercase, day, year.
- Vertical side labels, DM Mono 6.5 px, letter-spacing 1, cream:
  - "THE WEDDING OF", rotated −90°, centred at x 40, y 340
  - "{NICK A} & {NICK B}" uppercase, rotated 90°, centred at x 388, y 340
- Names in Patrick Hand 41 px, letter-spacing 3.5, cream, centred, inside `<h1>`, with `useFitLine` for long names:
  - `shortName(a).toUpperCase()` with its cap centre at y 297
  - "&" at 33 px, y 352
  - name B at y 405
- Guest block:
  - "Dear": DM Sans 700 12.3 px, white, y 675
  - guest name: DM Sans 400 15.4 px, white, y 699, clamped to 2 lines. It falls back to the text "Penerima Undangan" when `guestName` is empty (reference behaviour).
- "Open Invitation" button, centred at y 739, 130×30:
  - pill with a 2.3 px `#313131` border, transparent background
  - DM Sans 700 12.3 px, white
  - book-open icon: the SVG path from surat-marun's Cover
- Copy the root `motion.div`'s accessibility props (role=button, aria-label "Buka undangan", keyboard handler).
- **Entrance:** a CSS keyframe `km-cover-in` (translateY(100%)→0, 1.3 s, ease) on the red card only. This matches `.modal.fade{transition: all 1.3s}`. The text is in the SSR HTML and no opacity-0 is used.
- **Opening:** the framer `exit`:
  - the red card moves `y: "101%"` over 1.3 s with `ease: [0.25, 0.1, 0.25, 1]`
  - the paper layer behind it fades opacity 1→0 over 0.7 s
  - the content is already prepared behind the cover
  - Mid-frames to compare: `REF/01-open-t0000…t3500.png`. At t450 the card has moved down about 380 px; by t1100 it is gone.

**Fixed UI** (`sections/FixedUi.tsx`, set as `MusicControl`). Refs: `REF/i-music-toggled.png`, `REF/i-after-open-top.png`. Three white controls, stacked at `right: 9px` and vertically centred in the column, each with shadow `0 .5rem 1rem rgba(0,0,0,.15)`:
- **"Top" tab** (26×36, radius 6, y about 383): chevron-up icon and the label "Top" at 6.5 px. Clicking it calls `window.scrollTo({top:0, behavior:"smooth"})`.
- **Music circle** (28 px, y about 430): uses `useAudio()` from `_shared/runtime/audio`. Playing shows a music icon that spins (`km-spin` 5 s linear infinite). Paused shows a muted-speaker icon. It is disabled when unavailable, copying FloatingMusicButton's logic.
- **"Read" tab** (26×46, y about 478): refresh icon, "Read", and chevron-down. A toggle auto-scrolls with `window.scrollBy({top:333, behavior:"smooth"})` every 2 s and stops on `wheel`, `touchstart`, a second click, or reaching the bottom. Its icon spins 4 s while active.

Spins are disabled under reduced motion and lite mode.

**Screenshot tooling:** extend `WT/scripts/screenshot.ts` with:
- `--reduced`: `page.emulateMediaFeatures([{name:"prefers-reduced-motion",value:"reduce"}])` before `goto`
- `--selector=<css>`: an element screenshot of that node instead of the page

### 3.1 Ayat: polaroid and QS Ar-Rum 21 (`ayat`)
Refs: `REF/02-hero-countdown-part0.png`, `REF/02-hero-countdown.png`.
- **Reuse from surat-marun:** the Opening's data binding (`inv.data.quote`) and the `Section` wrapper only. surat-marun's layout does not match.
- **Layout:**
  - `TornPolaroid` (SVG, paper `#d9d5cd`, rough left/bottom edges made with an SVG path jitter, soft drop shadow) at x 82–346, y 43–405
  - photo `photos.cover`, greyscale, inset to x 99–330, y 58–390
  - `MaskingTape tone="yellow"` (`#c8a35a`, opacity 0.9, rotated 8°) at x 190–248, y 355–425
- **Quote:** `quote.translation` in Courier Prime 11.5 px, line-height 17, letter-spacing 0.4, `--inv-ink`, left-aligned in x 58–375 starting at y 458, wrapped in typographic quotes.
- **Source:** `quote.source` in Courier Prime 10 px at x 60, below the quote plus 30 px. It is surrounded by `HandOval` (red, stroke 2, a slightly open hand-drawn ellipse path) at about 133×42.
- **Motion:** static (the reference `#i80sll` has no animation).
- **Data:** `photos.cover`, `quote.translation`, `quote.source`.

### 3.2 Salam: THE DAY, bismillah, invite line (`the-day`)
Refs: `REF/02-hero-countdown-part1.png`, the top of `REF/02-hero-countdown-part2.png`, `REF/02-hero-countdown-anim-t0350.png`, `REF/02-hero-countdown-anim-t1100.png`.
- **New section;** surat-marun has no counterpart.
- **Photo block** x 16–414, y 22–520:
  - left half `photos.strip[0]`, right half `photos.strip[1]` (each falls back to `photos.cover`)
  - each 198 wide, `object-fit: cover`, greyscale
  - a 2 px paper seam in the middle
- **Centred text block** (white):
  - "THE DAY": DM Sans 700 9.5 px, letter-spacing 3.5, y 245
  - "{NICK A} & {NICK B}" / "ARE TYING THE KNOT": DM Sans 400 6 px, letter-spacing 1.5, y 267 and 277
  - a small rule (10 px, white 0.6) at y 287
  - the date `dd.mm.yy` from the first event: DM Sans 6.5 px, letter-spacing 1, y 297
- **Below the photo:**
  - bismillah "بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ" in Amiri 22 px, `#111`, centred, 58 px below the photo. Only when `greeting.style === "islami"`, same rule as `_shared/sections/Intro.tsx`.
  - "We invite you to join our wedding" in Courier Prime 11.5 px, letter-spacing 1, 46 px lower
- **Motion:** the photo block uses `Anim grow` (2.5 s ease from scale 0). The text block scales with it because it is inside the photo block. The bismillah and invite line are static.
- **Data:** `photos.strip`, nicknames, first event date, `greeting.style`.

### 3.3 Profil: bride, "&", groom (`couple`)
Refs: `REF/02-hero-countdown-part2.png`, `REF/02-hero-countdown-part3.png`, `REF/02-hero-countdown-anim-p2-t0450.png`, `REF/02-hero-countdown-anim-p3-t0450.png`.
- **Reuse from surat-marun's `Couple.tsx`:**
  - `couple(d)` order handling
  - `parentsLines(childOrder, father, mother, …)` from `_shared/format` (it yields `lead` and `names`, including "(Alm)")
  - `useFit` for long names
- **Layout changes:** an asymmetric pair replaces surat-marun's "The Bride/Groom" cards.
- **Person A block** (about 330 tall):
  - full name (`displayFullName`, uppercase) in Patrick Hand 22 px, letter-spacing 2, `--inv-red`, line-height 40, left-aligned in a 150-px box at x 67, first line at y 192. It wraps to up to 3 lines and is not clipped.
  - parents in DM Mono 8.5 px, line-height 19, `--inv-red`, right-aligned to x 188, at y 297: `lead` + " dari", then the father line, then "& " + the mother line
  - `Polaroid` (white `#f7f7f5` frame, 3 px sides, 60 px bottom, shadow `0 4px 12px rgb(0 0 0/.25)`, rotated 2°) at x 220–385, y 145–405, photo = `person.photo`, greyscale
- **Separator:** "&" in Nothing You Could Do 34 px, `--inv-red`, centred at y 408.
- **Person B block** (about 266 tall), mirrored:
  - polaroid at x 45–210, rotated −2°
  - name left-aligned at x 248, starting at y 68
  - parents left-aligned at x 248, y 178
- **Motion:** block A uses `Anim left` and block B uses `Anim right` (2.5 s ease). The "&" is static.
- **Data:** bride/groom `fullName`, `title`, `childOrder`, `father`, `mother`, `photo`, plus `order`.

### 3.4 Acara: month, day row, heart, year, events (`date`)
Refs: `REF/02-hero-countdown-part4.png`.
- **Reuse from surat-marun's `Event.tsx`:** the event list mapping, plus `eventTimeLabel` as a fallback. The envelopes, frames and location parts are dropped; the location moves to `maps`.
- **Layout:**
  - month (English, uppercase) in Patrick Hand 23 px, letter-spacing 3, `#111`, y 37
  - day row centred at y 114, made of 5 boxes 40×40, radius 7:
    - days d−2 and d+2: border 1.3 px `#c4c4c4`, text `#b0b0b0`, at x 45 and x 343
    - days d−1 and d+1: border 1.3 px `#555`, text `#222`, at x 107 and x 272
    - day d: inside `HeartOutline` (SVG, stroke `--inv-red` 1.5, 72×64, at x 179)
    - Digits are Alata: 15 px in the boxes, 20 px in the heart.
    - Neighbouring days are computed with `Date.UTC` so month boundaries are correct.
  - year in Alata 22 px, y 198
  - one block per event: name uppercase in Patrick Hand 17 px, letter-spacing 1.5, `--inv-red` (first at y 279); time in DM Mono 13 px, letter-spacing 1, `#111`, 44 px below; then a 1 px `#9a9a9a` rule from x 66 to 366, 24 px below the time. The next event starts 106 px after the rule.
  - Time format: "HH.MM - HH.MM TZ", or "HH.MM - Selesai TZ" when `untilFinished`.
- **Motion:** the whole block uses `Anim grow`, like `#iizve4`.
- **Data:** `events[]` (`name`, `date`, `startTime`, `endTime`, `untilFinished`, `timezone`).

### 3.5 Hitung mundur (`countdown`)
Refs: `REF/02-hero-countdown-part5.png`.
- **Reuse:** `useCountdown(eventStart(firstEvent(...)))` and `pad`, both from surat-marun's `Event.tsx`.
- **Change from surat-marun:** never hide the countdown. When the date has passed, show "00" (reference behaviour).
- **Layout:**
  - strip x 110–322, top y 38, background `rgb(128 128 128 / .04)`, top border 4 px dashed `#988d8d69`
  - four counters 46×46, gap 6, white at 0.75 opacity, radius `8px 14px 8px 8px`, `box-shadow: inset 2px 2px 5px #43434361`
  - number in Alata 15.5 px, white fill, `-webkit-text-stroke: 1px #212529`, tabular-nums
  - label (Days, Hours, Minutes, Seconds) in Alata 10 px, `#212529`
- **Motion:** static.
- **Data:** the first event start.

### 3.6 Maps: Direction to Venue and Catatan (`location`)
Refs: `REF/03-location.png`, `REF/03-location-anim-t0350.png`, `REF/03-location-anim-t1100.png`.
- **Reuse:**
  - surat-marun's `places` dedupe (`Event.tsx`, the venueName+address filter)
  - `safeHref(e.mapsUrl, "maps")`
  - the iframe src pattern and lite fallback from `_shared/sections/Event.tsx` `DefaultMaps`: `https://maps.google.com/maps?q=…&z=15&output=embed`, `loading="lazy"`. In lite mode it becomes an "Open in Maps" link.
- **Shared `HeadingNote`** (`art/Ornaments.tsx`; reused by ucapan and amplop):
  - `PaperNote` 305×110 at x 63, y 80, colour `--inv-paper-note`, grain from `paperBg`
  - a tape at its top-right (75×40, rotated 35°, centred at x 365, y 95)
  - a tape at its bottom-left (rotated 35°, centred at x 80, y 185)
  - `MaskingTape` is an SVG with a translucent `#d9d6c8` fill at 0.75 opacity, crumple made with feTurbulence + feDiffuseLighting, and torn ends
  - title in Patrick Hand 27 px, letter-spacing 2.5, `--inv-red`, 2 lines, centred
  - optional props for the rule and pill
- **Here:** the note says "DIRECTION / TO VENUE", with no rule or pill.
- **Venue box** per place, x 26–404, starting at y 283, background `rgba(255,255,255,.52)`, radius 10, padding 16/7:
  - venue name uppercase in Marcellus 15 px, `--inv-ink`
  - address with a 📍 prefix in DM Sans 11.5 px, line-height 25, centred, 10 px below
  - map iframe 270 px tall, padding 7, radius 15, border 2.3 px `--inv-gold`, `box-shadow: inset 0 0 8px rgb(0 0 0/.2)`
- **Catatan box** (only when `dressCode.text` exists): 9 px below the last venue box, same surface:
  - "Catatan" in Marcellus 18.5 px, centred, 30 px top padding
  - `dressCode.text` in Marcellus 10.8 px, weight 400 (with faux-bold avoided), line-height 1.45, `pre-line`
  - when `dressCode.colors` exists, a row of 14 px dots below the text
  - bottom padding 36
- **Motion:**
  - `HeadingNote` uses `Anim grow`
  - venue name and address use `Anim right`
  - the Catatan text uses `Anim left`
  - the map is static
- **Data:** `events[]` `venueName`, `address`, `mapsUrl`; `dressCode`.

### 3.7 Love story (`love-story`)
Refs: `REF/04-love-story.png`, `REF/04-love-story-anim-t0350.png`, `REF/04-love-story-anim-t1100.png`.
- **Reuse:** surat-marun's `Extras.tsx` LoveStory data loop. The visuals are replaced.
- **Layout:**
  - outer card x 8–422, background `rgb(239 239 236 / .75)`, radius 8, padding-top 50
  - "LOVE STORY" in Marcellus 26 px, `--inv-red`, centred, y 68
- **One item per `loveStory` entry:**
  - card x 20–410, border 4 px `rgb(255 255 255/.85)`, radius 8, `box-shadow: 0 1rem 3rem rgb(0 0 0/.18)`, padding 10
  - date bar x 30–400, 32 tall, background `--inv-story-bar`, radius 2: `date` in Marcellus 14.5 px, white
  - text below in Marcellus 12 px, `#000`, line-height 1.6, centred: `title` (weight 400, followed by " — ") + `text`
- **Connectors:** a white bar (8×22, `rgb(255 255 255/.85)`) centred between cards.
- **Motion:**
  - each card uses `Anim swing`
  - each bar uses `Anim bounce`
  - each text uses `Anim right`
  - all 2.5 s
- **Data:** `loveStory[]` (`date`, `title`, `text`). The section is hidden by `isSectionEmpty` when the list is empty.

### 3.8 Galeri: scrapbook collage (`collage`)
Refs: `REF/05-photo-collage.png`, `REF/05-photo-collage-p2.png`, `REF/05-photo-collage-anim-t0350.png`, `REF/05-photo-collage-anim-t1100.png`.
- **Reuse:** surat-marun's `Extras.tsx` Gallery guard only (`if (photos.length === 0) return null`). There is no slider and no Lightbox.
- **Layout:** one absolute composition, 1295 tall, all photos greyscale. Use photo `gallery[i] ?? photos.cover` throughout.
  - **photo 1:** landscape polaroid frame x 62–370, y 55–222. The frame is `#e9e5dd`, radius 6, with a drop shadow; the photo is inset to x 75–355, y 66–211. It shows `gallery[0]`.
  - **photo 2:** `gallery[1]` at x 62–296, y 240–482.
  - **handwritten note:** vertical text in a 60×240 box at x 300, rotated 90° (reads top→bottom), Nothing You Could Do 11 px, `#333`. The text is the constant `NOTE` = "This chapter feels really good. Every day, we continue to love each other more and more. Making memories with you is my favorite thing to do. Thank you for being my home."
  - **`LedgerCard`** (SVG/CSS) at x 52–378, y 516–770:
    - speckled paper `--inv-paper-note` with grain
    - 0.6 px `#bdbdbd` rules at y 545, 560 and 584
    - "THE" at x 72, y 543; "WEDDING" at x 277; "OF" at x 72, y 567, all in DM Mono 6 px
    - date `dd.mm.yy` in Patrick Hand 21 px, `--inv-red`, centred, y 574
    - inner table rectangle x 72–358, y 604–748, with vertical lines at x 118 and 277
    - "{NICK A} & {NICK B}" in DM Mono 6 px, y 619
    - "WE ARE GETTING / MARRIED" in Patrick Hand 20 px, `--inv-red`, rotated −4°, lines at y 676 and 709
  - **photo 3:** `gallery[2]` at x 46–270, y 803–1027.
  - **photo 4:** `gallery[3]` at x 160–383, y 906–1236, on top of photo 3.
  - **date pill:** red, x 349–383, y 806–819, DM Mono 6 px, white, text `dd.mm.yy`.
  - **quote:** in a 100-px box at x 50, y 1045, Nothing You Could Do 11 px, `#333`, line-height 1.45. Text: "Dan segala sesuatu Kami ciptakan berpasang-pasangan supaya kamu mengingat kebesaran Allah." Source line: "Surat Az-Dzariyyah, ayat 49".
- **Motion:** the whole composition uses `Anim swing` (transform-origin top center, 2.5 s).
- **Data:** `gallery[0..3]`, first event date, nicknames. Both text strings are static constants.

### 3.9 Ucapan: Share your blessing, RSVP and wishes (`wishes`)
Refs: `REF/06-rsvp-guestbook.png`, `REF/06-rsvp-guestbook-p2.png`, `REF/i-rsvp-form.png`, `REF/06-rsvp-guestbook-anim-t0350.png`.
- **Copy as-is from surat-marun's `Wishes.tsx`:**
  - `useGuestbook()`, `Honeypot`, the submit flow and validation message
  - the `OPTIONS` and `LABEL` mappings
  - stats order (Not sure / Planning to attend / Can't attend)
  - the `shown` + "Load more" pagination
  - the toast "Terima kasih atas konfirmasi & doanya!"
- **Background:** paper, with no dark photo background.
- **Heading:** `HeadingNote` with the text "SHARE YOUR / BLESSING". Then a red rule at y 261 (x 62–369). Then a pill at x 82–348, y 305–386, with "Kindly confirm & / write your wishes for us" in Courier Prime 11.5 px, line-height 17.
- **Form card** x 20–410, starting at y 432: background `rgb(255 255 255/.08)`, border 2 px `#dcdad5`, radius 8, padding 22.
  - labels in Poppins 700 10.5 px, `--inv-muted`
  - inputs and select `#ffffffe6`, radius 999, height 28, Poppins 400 at `max(16px, …)`
  - textarea radius 12, height 84
  - "Cancel": a link-style pill, outline `#ffc107`, text `#ffc107`, Poppins 9 px, 66×24. It clears message and attendance.
  - "Send ›": a pill, outline `--inv-teal`, text `--inv-teal`, 76×24, right-aligned
- **Attendance summary:**
  - a thin rule `#dcdad5`
  - the "Attendance" pill (`--inv-teal-dark`, Alata 12 px, white, 163×20) flanked by gradient rules in `#808080`
  - stats in Alata 23 px, `--inv-muted`, with labels in Poppins 8 px, spaced 82 px apart
- **Wishes list** x 45–385, `max-height: 578px`, `overflow-y: auto`, background `#e9e8e4`, radius 12, padding 8. Each wish:
  - card `#ffffffe6`, radius 6, `outline: 2px dashed #dcdcdc`, `outline-offset: 4px`, margin 14
  - user-circle icon + name in DM Sans 700 12 px, `--inv-muted`
  - badge pill (1 px `#808080` border, 7.5 px)
  - date as `dd/mm/yyyy HH:mm:ss` at 7.5 px
  - message at 12 px
  - "Load more" pill (153×30, outline `--inv-teal`, Poppins 11 px, refresh icon) below the list
- **Not included:** the Sticker button (see §0).
- **Motion:** `HeadingNote` uses `Anim grow`. Everything else is static.
- **Data:** guestbook wishes and stats; `guestName` prefills Name.

### 3.10 Amplop: Wedding gift (`gift`)
Refs: `REF/07-gift.png`, `REF/i-gift-copy-click.png`, `REF/07-gift-anim-t0350.png`.
- **Copy from surat-marun's `Gift.tsx`:**
  - `useCopy()`
  - the account map
  - the card icon and copy icon SVGs
  - the `FALLBACK` text structure
- **Changes from surat-marun:** the toast label is "Berhasil disalin", and the background is paper.
- **Heading:** `HeadingNote` with "WEDDING GIFT" on one line, a rule at y 260, and a message box at x 82–348, y 305–455 (radius 40). The message is `g.intro ?? FALLBACK`, where FALLBACK = "your presence at our wedding is the greatest gift of all. However, if you wish to honor us with a gift, a monetary gift would be greatly appreciated." It is set in Courier Prime 11.5 px, line-height 17, centred, padding 24/28.
- **Accounts:** start at y 563, each 135 px apart.
  - bank name in Alata 13 px, `#0c0c0c`
  - pill x 98–332, 42 tall, white with `brushedPill()` (layered radial-gradients in `#fff`/`#ececec`), `box-shadow: 0 2px 6px rgb(0 0 0/.12)`
  - card icon 26 px at the left, padding 10
  - number in Alata 12 px, letter-spacing 1, `#333`, at x 152
  - copy icon at the right
  - "A.N : {holder uppercase}" in DM Sans 10 px, `#0c0c0c`, 8 px below
  - a 1 px `#bbb` divider (x 98–332) between accounts
- **`g.physical`:** when present, append a matching red-outlined box (radius 24). It contains the recipient, phone and address in Courier Prime 11 px and a "Salin alamat" pill, so the data is not lost.
- **Motion:** `HeadingNote` uses `Anim grow`, and the accounts block also uses `Anim grow` (like `#itxezs`).
- **Data:** `gift.intro`, `gift.accounts[]`, `gift.physical`.

### 3.11 Penutup: Thank you (`closing`)
Refs: `REF/08-closing.png`, `REF/08-closing-p2.png`, `REF/08-closing-anim-t0350.png`.
- **Reuse:** surat-marun's `Closing.tsx` text source only (`inv.data.greeting?.closingText ?? FALLBACK`).
- **Layout:**
  - red card x 8–422 (`--inv-red`), radius 4 at the top, full section height of about 1300
  - photo strip x 125–305: three 180×180 photos at y 80, 268 and 455 (8 px red gaps), greyscale. The photos are `photos.strip[2]`, `photos.closing` and `gallery[4]`, each falling back to `photos.cover`.
  - row at y 704 in DM Mono 8.5 px, `rgb(232 224 208/.8)`: "Dear" at x 30, "our beloved" centred at x 177, "Family & friends" right-aligned to x 393
  - "THANK" in Patrick Hand 44 px, letter-spacing 9, cream, centred, y 828
  - "YOU" in the same style at y 918, inside `HandOval` (cream, stroke 2, 158×52)
  - message in Courier Prime 12 px, letter-spacing 1.5, line-height 20, `rgb(232 224 208/.9)`, centred, x 60–370, starting at y 1006. Paragraphs come from `closingText` split on blank lines.
  - FALLBACK = "for being part of our lives and supporting us through our journey.\n\nWe were so blessed to have you celebrate and be a part of our wedding day."
  - "See you!" in the same style, 36 px below
  - bottom padding 110
- **Motion:** the strip + text block uses `Anim swing`, like `#irzd2v`.
- **Data:** `photos.strip`, `photos.closing`, `gallery`, `greeting.closingText`.

## 4. Verification method (every checklist item)

1. **Dev server on port 3013.** If `lsof -nP -iTCP:3013 -sTCP:LISTEN` shows a listener and `curl -sI http://localhost:3013/preview/kliping-merah` returns 200, reuse it. Otherwise start it:
   ```
   pnpm -C /Users/Projects/udangan-website/.worktrees/tema-13 dev --port 3013 > /tmp/tema-13-dev.log 2>&1 &
   ```
   If it bound to 3000 instead (the script hard-codes `-p 3000`), start it with `pnpm -C <WT> exec next dev --turbopack -p 3013 > /tmp/tema-13-dev.log 2>&1 &` after running `pnpm -C <WT> themes:sync`. The dev log is at `/tmp/tema-13-dev.log`. When work is finished, stop the server with `kill $(lsof -tiTCP:3013 -sTCP:LISTEN)`.
2. **Static checks after each item:** `pnpm -C <WT> typecheck` and `pnpm -C <WT> lint`. Both must pass.
3. **Screenshots** at exactly the reference viewport from notes.md: **430 × 860, isMobile, hasTouch, DSF 1**. Output goes to `/Users/Projects/udangan-website/.reference/report/tema-13/` (gitignored), never `/tmp`.
   - **Cover:**
     ```
     pnpm -C <WT> tsx scripts/screenshot.ts "http://localhost:3013/preview/kliping-merah?bare=1" /Users/Projects/udangan-website/.reference/report/tema-13/cover.png --width=430 --height=860 --wait=2500
     ```
     Compare it with `REF/00-cover.png`.
   - **Opening frames:** use a small puppeteer snippet or `--open --wait` variants. Compare with `REF/01-open-t0450.png` and `t1100`.
   - **Each section (final state):**
     ```
     pnpm -C <WT> tsx scripts/screenshot.ts "http://localhost:3013/preview/kliping-merah?bare=1&open=1&focus=<sectionId>" /Users/Projects/udangan-website/.reference/report/tema-13/<id>.png --width=430 --height=860 --reduced --selector="#inv-<sectionId>"
     ```
     The `--reduced` and `--selector` flags are added in the scaffold item. Compare side by side with the item's `refs`: same width (430), positions within about 4 px, same colours, same fonts and line breaks for equal-length text.
   - **Animations:** run the same command without `--reduced`, using `--open` (which scrolls), and capture at about t350 ms and t1100 ms after the section reaches 57% of the viewport. Compare with the `*-anim-*` refs.
   - **Full page:** use `--full --reduced` and compare with `REF/full-mobile.png`.
4. **Variants and robustness:**
   - `?variant=biru-tinta`, `?lite=1`, and `?to=Bapak%20Ahmad%20Sudrajat%20Wicaksono%20dan%20Keluarga` must render without overflow.
   - Long names (40+ characters) must not overflow. Test them with a temporary local edit only; do not commit it.
5. **Commit after each item** on `feat/tema-13`, in Indonesian, e.g. `Kliping Merah (n/12): <section>`. First, `git status` must show no `.env`, `.reference/`, `.cache/` or `public/_ref/` staged. Never push.
6. **Item 0 also:**
   - `pnpm -C <WT> fonts:build` and `pnpm -C <WT> licenses:build` (commit the woff2 files and licenses)
   - `pnpm -C <WT> assets:sync`: the output must report 0 originals for any theme change, and `git diff` must show no change to other themes' assets
   - `pnpm -C <WT> check:assets`: prints "tidak ada aset berstatus dev"
   - after the cover is done: `pnpm -C <WT> themes:thumbs http://localhost:3013 kliping-merah`

## 5. Gaps and assumptions
- **Countdown:** the reference countdown target (Aug 29 2026) contradicts its images (12.11.22 / Nov 12 2025). The theme uses the first event of the invitation data for everything.
- **Fonts:** the hand-lettering font (`ltcomical`) and the image fonts are not OFL, so the plan uses the closest OFL faces listed in §1. If a reviewer finds Patrick Hand too far off, the next candidate is Gochi Hand (`ofl/gochihand`).
- **Timing values** come from `REF/raw/keyframes.css` and `REF/notes.md`. Easing is `ease` (the CSS default) unless stated.
- **Sticker picker, loading screen and vendor credit** are intentionally not built (§0).
