# Prior context from earlier Claude sessions (read before working)

Source: ~/.claude/projects/-Users-Projects-udangan-website/memory/*.md (memories from the user's earlier Claude Code sessions on this repo).

## Closest precedent: theme "Surat Marun"
- On 2026-11-22 a theme was already built from another jsambac page: https://www.jsambac.com/the-wedding-of-nanda-kevin → `src/themes/surat-marun/`. Its screenshots are in `.reference/jsambac/` (00-cover.png … 20.png, g0–g3, strip-*). That folder is NOT tema-13; don't overwrite it.
- jsambac pages likely share structure/runtime (cover open, music, countdown, RSVP, gift, guestbook). Use surat-marun as the primary template: copy its architecture, registration, motion, asset pipeline, and reuse anything that matches tema-13's behaviour. Diff the two references rather than starting from scratch. This is the main way to go faster.

## Reference asset policy (src/themes/ASSET-AUDIT.md)
- User holds design rights → close copy allowed. For surat-marun, ornaments were redrawn as SVG; for tema-13 the user asked for "semirip mungkin", so original ornaments may be used but must be registered in ASSET-AUDIT.md with a status. Statuses: belum dicek/pro → SVG fallback; free/milik → original via `pnpm assets:sync`; `dev` → original used but `pnpm build` is refused by `pnpm check:assets` (prebuild) unless ALLOW_DEV_ASSETS=1. Mark new tema-13 originals `dev` unless told otherwise, and remind the user.
- NEVER use the real couple's photos, names, address, bank numbers or guest wishes from the reference. Rows without a slot (personal photos, template demo photos, site icons, OG images, third-party UI) are never used.
- Fonts: Google Fonts OFL equivalents only (never trial/exported fonts).
- Placeholder photos: Unsplash (public/placeholders/CREDITS.md). Music: Pixabay, user-downloaded (bot check, never automate); reuse an existing track.
- `pnpm ref:assets` / scripts/ref-assets.ts and scripts/ref-shots.ts download reference media/screenshots into gitignored .reference/.

## Workflow conventions the user wants
- Compare section-by-section against reference screenshots before reporting.
- Report screenshots go to `.reference/report/<stage>/` inside the project (gitignored), never /tmp.
- Before commit: `git status` must show no .env, .reference/, .cache/, public/_ref/ staged. Commit messages in Indonesian.
- Stop any server you start, by port: `kill $(lsof -tiTCP:<port> -sTCP:LISTEN)` (the process renames itself next-server). Prior sessions used a prod server on port 3300.
- Perf: check `pmset -g batt` before fps measurements; on battery Chrome caps rAF at 30 fps.
- Copy must not imply customers build invitations themselves (business model is admin-made via WhatsApp).
