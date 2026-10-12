# 🏁 VELOCITY — Constructor Championship

A cinematic Formula 1 team-management sim that runs entirely in the browser.
Build a constructor, climb through a 10-round season on **21 laser-traced
circuits**, manage qualifying shootouts, tire strategy, facilities, sponsors
and your driver academy — or race a friend in the multiplayer lobby.

**Zero build step. Zero dependencies at runtime. Pure HTML/CSS/JS.**

---

## ▶️ Play

Open `index.html` in any modern browser — or host the folder on any static
server:

```bash
# any of these
python3 -m http.server 8000
npx serve .
```

Then visit `http://localhost:8000/`.

## 🌐 Deploy to GitHub Pages

The project is ready for static hosting (all asset paths are relative):

```bash
git init
git add -A
git commit -m "VELOCITY — initial release"
git branch -M main
git remote add origin https://github.com/<you>/velocity.git
git push -u origin main
```

Then in **Settings → Pages**: pick the `main` branch / root folder →
the game is live at `https://<you>.github.io/velocity/` within a minute.
(The included `.nojekyll` file disables Jekyll processing.)

## 🎮 Game loop

1. **SINGLE PLAYER → New Career** — pick a constructor, hire drivers & staff
2. **Race weekend** — practice → knockout qualifying (Q1/Q2/Q3 with cutoffs)
   → live strategy (tire compound, pit stops, aggression) → Grand Prix
3. **Race** — full-length broadcast sim with incidents, weather, DRS battles
4. **Between rounds** — upgrade HQ facilities, sign sponsors, develop the car,
   scout academy drivers, watch the driver market shuffle

## 🛠 Tech

- Rendering: canvas race broadcast + DOM/DOM-anim UI (WAAPI only, transform/opacity)
- Transitions: themed cover identities (rim-dive zoom, uplink radar, tire tunnel…)
- Persistence: localStorage career saves
- Multiplayer: PeerJS over WebRTC (loaded from CDN)
- Fonts: Orbitron / Rajdhani / Inter (Google Fonts CDN)

## 📁 Structure

```
index.html            shell + screen containers
css/                  theme (carbon F1), per-screen styles, mobile rules
js/core/              state manager, save system, event bus, audio, game engine
js/data/              teams, drivers, staff, tire compounds, 21 traced circuits
js/screens/           home, dashboards, HQ, race-weekend, race, results, multiplayer…
js/simulation/        lap calculator, tire model, weather, AI drivers, incidents
js/ui/                transition director & cinematic effects
tools/test/           puppeteer e2e suites (career, weekend, screen sweep)
```

## ✅ Quality gates

Three regression suites live in `tools/test/` (run with the game served on
:8000): career round-advancement, full race-weekend roundtrip, and a
screen-by-screen sweep at mobile viewport. All pass with zero console errors
at 390×844, 768×1024 and 1440×900.

## 📄 License

Released under the MIT License — see [LICENSE](LICENSE).
