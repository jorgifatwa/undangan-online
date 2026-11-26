# Review: scaffold (commit 37ff0c3), rejection 1

Visual fidelity of the cover, label rows, side labels, names, guest block, pill, opening transition and the fixed Top/music/Read stack matches the references within the known diffs. No .env*, .reference/, .cache/ or public/_ref files are committed, and other themes only gain additive registry entries and opt-in screenshot flags.

## Blocker 1: "Read" auto-scroll stops after the first step

- Where: `src/themes/kliping-merah/sections/FixedUi.tsx`, the `useEffect` on `[reading]` (`window.addEventListener("click", stop)`).
- Cause: React 19 commits the discrete click update and flushes its passive effects before the same native click event reaches `window`. The new `click` listener is attached during that dispatch, so the click that turned Read on immediately runs `stop()`. Only the synchronous first `tick()` happens.
- Evidence (spot-check on the running :3013 worktree server, 430×860): after opening the cover, clicking `[aria-label="Gulir otomatis"]` and waiting 4.5 s gives `scrollY` 0 → 333 and `aria-pressed="false"`. Expected about 999 px (333 px every 2 s) and still pressed.
- Consequence: Read moves the page once and then turns itself off, which fails the acceptance criterion "auto-scroll 333px every 2s, stops on touch/wheel/click/bottom".
- Fix: ignore the starting click. Either register the stop listeners in a `setTimeout(..., 0)` (and clear it in cleanup), or listen with `pointerdown` and skip events whose `target` is inside the Read button (`e.target instanceof Node && btnRef.current?.contains(e.target)`). The button's own onClick toggle must still stop reading. Re-verify with the same measurement: scrollY should keep increasing by 333 every 2 s, stop on wheel/touch/click elsewhere and at the bottom, and `aria-pressed` should be true while it runs.
