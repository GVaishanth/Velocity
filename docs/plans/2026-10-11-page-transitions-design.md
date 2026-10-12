# VELOCITY — Cinematic Page Transition System (Design)

**Date:** 2026-10-11 · **Author:** Arena Agent · **Status:** Implemented
**Generated brief (from user's request):** every page gets a *unique* transition — a distinct **exit** animation for the current page, a themed full-screen **cover** sequence in the middle, and a distinct **entrance** animation for the landing page. Keep the existing F1 visual identity (colors, Orbitron/Rajdhani type, dark carbon theme).

## Principles (from referenced skills)

| Source | Rule applied |
|---|---|
| transitions.dev | Only animate `transform` + `opacity` (compositor thread, 60 fps). Same-color curtains instead of animated masks. |
| make-interfaces-feel-better | Interruptible; exits softer + quicker than entrances; split content into semantic chunks staggered ~80–100 ms; `ease-out` for both directions; skip enter-animation on first load. |
| GSAP skills | Timeline-style staged sequences (lights → hold → release), implemented with WAAPI promises — no runtime dependency. |
| frontend-design / impeccable | One bold element per transition (the cover), disciplined content animation around it. No generic fade-and-slide-everywhere. |
| ui-ux-pro-max | `prefers-reduced-motion` fallback, motion never the only feedback (destination label shown on cover), non-blocking navigation. |

## Architecture

```
nav request (EventBus nav:go)
      │
      ▼
TransitionDirector.go(targetScreen)
 1. OUTRO   — current screen element gets its identity's exit (fast, subtle)
 2. COVER-IN — full-screen themed stage builds + animates to opaque
 3. SWAP    — GameEngine.doScreenSwitch() at full cover (existing flow)
 4. COVER-OUT — cover animates away, destination label flashes
 5. INTRO   — new screen's semantic chunks stagger in (WAAPI)
      │
      ▼ stage torn down, zero DOM residue
```

- **New module:** `js/ui/transition-director.js` — identity registry, stage builder, WAAPI sequencer, interrupt/cancel handling, reduced-motion fallback (300 ms crossfade).
- **New stylesheet:** `css/transition-director.css` — all keyframes; transform/opacity only.
- **Engine hook:** `GameEngine.goToScreen()` routes through the director (`transition:'dive'` / default both use it; `nav:direct` stays instant).
- **Home keeps its tunnel-dive**, upgraded to run inside the director as the `home` identity.
- **Audio hooks (guarded):** whoosh (`diveTransition`) on covers, engine rev on `race`, lights tick clicks on `singleplayer`.

## Identity matrix (exit for current → cover → entrance for landing)

| Screen | Exit (current page) | Cover (mid-sequence) | Entrance (landing page) |
|---|---|---|---|
| home | camera continues forward (scale-up fade) | tire tunnel dive (existing, upgraded) | reverse dive + wheel quadrants stagger-pop |
| singleplayer | cards sink through green scan | **Lights gantry**: 5 red lights ignite, hold, all out | mode cards rise, green underglow, stagger |
| multiplayer | red grid flicker, content scaleY collapse | **Uplink**: radar sweep + nodes link | panels flip in (rotateX), red tracer sweep |
| profile | blue scan wipe-up | **Telemetry**: scan bar + data columns | hologram flicker-in, metric cards stagger |
| tutorial | board tilts away (rotateX) | **Pit board**: gold board slides across | lesson cards rise from pit wall, stagger |
| team-setup | tool drawers slide down | **Garage shutter**: 8 slats descend | panels pop up like tool drawers, budget flash |
| dashboard | bento cards drop through floor | **HQ glass doors**: two panes slide shut | doors part, bento cards scale-in stagger |
| headquarters | elevator descends (translateY+fade) | **Elevator**: gold blind slats rotate | floor panels rise from gold rim line |
| race-weekend | gantry panels slide right off | **Pit lane**: perspective boxes rush past + checkered wipe | session panels assemble left→right |
| race | speed streak (scaleX stretch + fade) | **Formation lap**: 5 lights + radial speed streaks + engine rev | HUD: top bar drops, timing slides from right, controls rise; canvas settles 1.04→1 |
| results | podium settles, flag folds (scaleY) | **Chequered flag**: cloth-row wave sweep | podium steps rise, header pops, sparks |

## Timing

Standard: 220 ms exit + ~700 ms cover + ~450 ms intro ≈ **1.4 s** total.
Race (cinematic): ~**2.2 s**. Reduced motion: **0.3 s** crossfade.
Rapid nav: current sequence is cancelled mid-flight and the new one takes over from the cover state (no white-flash, no queue pile-up).

## Accessibility

- `prefers-reduced-motion: reduce` → single 300 ms crossfade for all pairs.
- Destination name + icon shown on every cover (motion is never the only signal).
- No flashing above 3 Hz (light sequences hold ≥ 280 ms per state).
- Keyboard/ESC guards from the audit fixes remain untouched.
