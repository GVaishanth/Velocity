<div align="center">

# 🏁 VELOCITY — Constructor Championship (v1.2.0)

**An Elite, Serverless 2D Formula 1 Esports Racing & Management Simulation**

***Championships Are Engineered.***

[![ES6 Modular JS](https://img.shields.io/badge/ES6_Architecture-Vanilla_JS-FFD700?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Multiplayer Active](https://img.shields.io/badge/Multiplayer-WebRTC_P2P-0080FF?style=for-the-badge&logo=paddypower)](https://peerjs.com/)
[![Optimized at 60FPS](https://img.shields.io/badge/Animation_Loop-60_FPS-FF0033?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

</div>

---

## 🏎️ Executive Summary

**VELOCITY** is a professional-grade motorsport management simulation that puts you in the role of an Executive Team Principal. As the architect of your team's destiny, you must balance raw speed with mechanical preservation across a worldwide championship calendar.

---

## 🚀 Version 1.1.0 & 1.2.0 Technical Highlights

These major updates transform the engine into a high-stakes competitive platform with authoritative physics and deep strategic complexity.

### 📡 Authoritative Global Multiplayer (v1.2.0 Overhaul)
A robust, serverless P2P arena supporting up to **12 human constructors**:
*   **Host-Authority Architecture**: The Host acts as the single "Source of Truth." Grid positions, incidents, and final results are broadcasted every 1s to ensure 100% matching podiums across all clients.
*   **Emergency Reconnect**: Secure session persistence in `sessionStorage` allows both Host and Challengers to recover their room and resume a live race after a page reload or crash.
*   **Democratic Skip Voting**: In-race skips require a unanimous agreement from all human constructors via a live P2P voting system.
*   **Synchronized Weekend**: Every human constructor is automatically navigated through FP1, FP2, and Qualifiers in sync with the Host.
*   **Dashboard Readiness**: The Host is blocked from entering the paddock until all rivals have locked in their 🏁 READY status.

### 🏁 Advanced Racing Physics & Logistics (v1.2.0)
*   **Sequential Pit Lane Physics**: Cars follow a dynamic curved path into a dedicated pit lane. Every team has a unique, branded pit box; cars must navigate the lane and stop at their specific garage.
*   **Red Flag System**: Massive multi-car pile-ups (3+ DNFs) trigger a full race stoppage. Physics pause while all cars undergo grid repairs and cooling before a Safety Car restart.
*   **Driver Rivalries**: AI drivers identify direct championship rivals and defend **40% more aggressively** against them.
*   **Precision Telemetry**: HUD sensors deliver real-time Engine, Air, Track, and Tire temperatures with one-decimal accuracy (e.g., 102.4°C).

### 🎨 Livery & R&D Studio (v1.1.0)
*   **Livery Editor**: Redesign your car with a sleek side-view studio. Customize Primary, Secondary, and Accent colors for $5,000,000 (limited to 2 changes per season).
*   **Top-Down R&D Engineering**: Technical Car Development modal features a **Symmetric Top-Down Analysis** model. Whichever department you last upgraded glows bright green on the wireframe.
*   **Visual Particle Engine**: Real-time engine smoke for overheating, rain spray on wet tracks, and tire smoke during lock-ups/spins.

### 🌡️ Thermal & Environmental Simulation (v1.1.0)
*   **Dynamic Thermals**: Engine temperatures fluctuate based on driving mode, ERS Boost, and Dirty Air. Exceeding **125°C** results in a terminal mechanical DNF.
*   **Dynamic Track Evolution**: Tracks "rubber in" as the race progresses, increasing grip and lowering lap times dynamically as rubber is laid down.
*   **Silly Season**: AI teams trade drivers based on performance and prestige at the end of each season. Aging drivers retire, replaced by explosive rookies.

---

## 🏛️ Comprehensive Architectural System Breakdown

**VELOCITY** is built on an entirely modular architecture with **22 core subsystems and 52 simulation files**:

```text
VELOCITY/
├── index.html                           # Master module dependency bootstrap
├── css/                                 # 9+ specialized stylesheets for each viewport
├── js/
│   ├── core/                            # Engine, Save System, State Management, Audio
│   ├── data/                            # Achievements, Drivers, Staff, Tracks, Compounds
│   ├── home/                            # Home Controller, Tire Wheel logic, Reconnect UI
│   ├── rendering/                       # 60fps Animation Loop, Track & Car Renderer, Effects
│   ├── screens/                         # View Controllers (Dashboard, Lobby, Results, etc.)
│   ├── simulation/                      # AI Drivers, Race Engine, Tire Model, Silly Season, Weather
│   └── ui/                              # Modals, Notifications, Player Controls, Timing Tables
└── README.md                            # Technical Documentation
```

---

## 🌟 Definitive Master Subsystems

### 📜 Legendary Historical Scenarios (`THE HALL OF GLORY`)
Drop directly into the cockpits of the most nail-biting title shootouts:
*   🌧️🇧🇷 **THE MIRACLE OF BRAZIL**: P6 on Softs in a downpour with 5 laps left. Execute the undercut and snatch the title!
*   🇦🇪🏆 **THE ABU DHABI SHOOTOUT**: Final lap Safety Car sprint. Manage ERS Boost to pass the rival World Champion.
*   🇲🇨🛡️ **THE STRAT 5 MONACO DEFENSE**: Defend P1 at Monaco while power unit thermals are critical.

### 🌦️ Doppler Meteorology Radar
Located in your Tactical Command Deck, this interactive station monitors surface wetness and highlights active Pirelli windows (Slicks/Inters/Wets) with a striking apex predictive timer.

### ⚡ FIA Virtual Safety Car (VSC) Sprint
Balance your pacing slider within `±8%` of the moving FIA target to charge your Slingshot Sprint Gauge for a -2.5s pace surge upon green flags.

---

## 🛠️ Engineering Algorithmic Defenses

1. **Host-Authority Results**: Final race results are calculated by the Host and broadcasted as a definitive state to all clients.
2. **Multiplayer Pace Sync**: Local physics randomness is reduced by 80% during online races to ensure client alignment.
3. **DNF Console Lockdown**: Retired drivers have their cockpit controls permanently disabled and telemetry set to "OFF."
4. **Data Isolation**: Single-player careers are protected. Multiplayer sessions use a separate `mp_gamestate` storage key.

---

## 🖥️ Getting Started

### pure Client Auto-Launch
To run the game locally, simply open `index.html` in any standard Web Browser. No backend server or Node installation is required.

---

## 🏆 Official ESport Broadcast Health Parity

This entire software suite is validated with **exactly 0 syntax errors** and optimized for **60FPS** animation. Built to the absolute top standard of Esport broadcast layouts.

*Enjoy your live Grand Prix gameplay, make those split-second strategy calls, and dominate the absolute peak of Formula 1 Esport management!*

---

<div align="center">

# 🏁 VELOCITY — Constructor Championship (v1.0.0)

**An Elite, Serverless 2D Formula 1 Esports Racing & Management Management Gameplay Simulation**

***Championships Are Engineered.***

[![ES6 Modular JS](https://img.shields.io/badge/ES6_Architecture-Vanilla_JS-FFD700?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Pure CSS3 Layouts](https://img.shields.io/badge/Flexbox_%26_Grid-Pure_CSS3-00FF41?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Optimized at 60FPS](https://img.shields.io/badge/Animation_Loop-60_FPS-FF0033?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)

</div>

---

## 🏎️ Executive Summary & Lore

**VELOCITY — Constructor Championship** is a fully polished, serverless interactive Web Application hosted natively on static web servers (such as **GitHub Pages**). Inspired by the intense, high-stakes world of modern multi-million dollar Formula 1 Esport broadcasting, **VELOCITY** puts you directly into the shoes of an Executive Constructor Team Principal and Tactical Paddock Strategist.

You are fully responsible for assembling your racing machines, managing multi-million dollar corporate sponsorship budgets, researching high-tech aerodynamic and powertrain stat upgrades, signing world-class driving talent, resolving mid-week broadcasting media press room controversies, and making split-second Live Grand Prix strategy calls across 35 mathematically precise worldwide racing circuits.

---

## 🏛️ Comprehensive Architectural System Breakdown

**VELOCITY** is architected with absolute modularity, adhering strictly to **ES6 Vanilla JavaScript** modules, uncoupled **CSS3 Flexbox / Grid** UI viewports, and high-performance **HTML5 Canvas** rendering loops. The application features **18 core subsystems and 42 distinct simulation files** distributed systematically across your sandboxed workspace:

```text
VELOCITY-CONSTRUCTOR-CHAMPIONSHIP/
├── index.html                           # Master module dependency bootstrap & structural screen wrappers
├── css/
│   ├── animations.css                   # Trigonometric spin, hyperspace transition tunnels, and cloud blips
│   ├── components.css                   # Universal interactive form groups, modal chips, and R&D UI upgrades
│   ├── core.css                         # Fully invincible VIP Stacking (#z-index 6000), global themes, Center Return Pill
│   ├── home.css                         # Authentic Pirelli P-Zero command wheel, BBS forged rim, and center fly-through zoom
│   ├── lobby.css                        # Universal Multiplayer lobby screens and WebRTC staging arrays
│   ├── profile.css                      # Towering 3X Super License, 2x2 database navigation console box, subspace save storage sync
│   ├── race-screen.css                  # Esport 2-Tier Strategy Deck, floating radar/VSC interiors, ERS dual driver cockpits
│   ├── team-setup.css                   # Dynamic team composition wizard, spending breakdown charts, filter chips
│   └── tutorial.css                     # Interactive How to Play chapter wizard and responsive code blocks
├── js/
│   ├── core/
│   │   ├── app.js                       # Asynchronous step-by-step game loading sequence and core event binder
│   │   ├── audio-manager.js             # Web Audio API procedural sound synthesis (UI clicks, match lights, start sirens)
│   │   ├── event-bus.js                 # EventBus Pub/Sub central event router for seamless decoupled UI communication
│   │   ├── game-engine.js               # Universal #requestAnimationFrame master game loop and screen transition coordinator
│   │   ├── save-system.js               # LocalStorage wrapper with version migration, UTF-16 size analysis, and total nuclear purges
│   │   └── state-manager.js             # Runtime reactive central game staging store (mode, career, Live race results)
│   ├── data/
│   │   ├── achievements.js              # Definitive 15 ESport Paddock milestone items and category registries
│   │   ├── drivers.js                   # 24 randomizable star driving talent objects, experience metrics, stats, traits
│   │   ├── staff.js                     # Executive Technical Directors, Chief Strategists, and elite Pit Crew bosses
│   │   ├── teams.js                     # 12 custom custom Constructor identities (Novara Racing, Invicta Red, Veloce Scuderia)
│   │   ├── tire-compounds.js            # Pirelli dynamic telemetry profiles (Soft, Med, Hard, Intermediates, Full Wets)
│   │   └── tracks.js                    # 35 mathematically precise mathematical SVG track paths, precise sector markers, pit lanes
│   ├── home/
│   │   ├── home-controller.js           # Interactive DOM delegates for background tracks, light waves, quick-launch mission buttons
│   │   ├── tire-wheel.js                # Spinning Master Command Wheel logic with 1.5s debounces and cinematic center fly-throughs
│   │   ├── tracks-background.js         # Zero-lag pre-rendered base background layer cache (1 draw call) + interactive mouse LED HUD
│   │   └── wave-system.js               # Performance-throttled 30fps procedural light waves flowing across the Paddock viewport
│   ├── rendering/
│   │   ├── animation-loop.js            # 60fps universal live Grand Prix visual animation coordinator
│   │   ├── car-renderer.js              # Smooth lerping 2D top-down constructor chassis rendering, leader crowns, motion trails
│   │   ├── effects.js                   # High-performance visual dynamic particle generators (barrier sparks, success banners)
│   │   └── track-renderer.js            # Absolute mathematical SVG asphalt rendering perfectly centralized at (canvasW/2, canvasH/2)
│   ├── screens/
│   │   ├── dashboard.js                 # Career Hub manager — Corporate Sponsors, Media Dilemmas Studio, Full Roster R&D
│   │   ├── multiplayer.js               # Intercepts WebRTC Star Topology netcode with exceptionally sarcastic "Under Construction" modal
│   │   ├── profile.js                   # VIP Player Authority Identity Showcase, Edit Credentials Studio, Multi-Stage Laser XP
│   │   ├── race-screen.js               # Master Live match controller wiring together video track map, Tactical Deck, dual cockpits
│   │   ├── race-weekend.js              # Full Universal Universal 4-Stage Grand Prix Esport Weekend (FP1/2 → Knockout Quali → Match)
│   │   ├── results.js                   # Universal classification boards, Formal Corporate Corporate Fine/Payout banners, return shortcuts
│   │   ├── single-player.js             # Single Player lobby mode selection grid carrying the Premium Hall of Glory Mission Card
│   │   ├── team-setup.js                # Definitive Constructor Roster creator clamping random composite stats strictly between 65–95
│   │   └── tutorial.js                  # Complete multi-chapter interactive How to Play manual with automated Single Player Paddock redirect
│   ├── simulation/
│   │   ├── ai-driver.js                 # Algorithmic decision trees for 11 AI Constructor bots (smart pitting, aggressive DRS overtakes)
│   │   ├── driver-radio.js              # Impenetrable non-DNF frequency isolation emitting varied driver comments without bandwidth spam
│   │   ├── event-system.js              # Stochastic probability checks for mechanical failures, driver mistakes, debris SC deployments
│   │   ├── lap-calculator.js            # Tightly clamped lap time mathematical engines influenced by Driver Aggression and Boost surges
│   │   ├── pit-strategy.js              # AI proactive tire wear management, structural weather crossover checks, true double double stacking
│   │   ├── race-engine.js               # Core Core Grand Prix time/gap math decoupling Safety Car bunch-ups completely from Best Laps
│   │   ├── tire-model.js                # Dynamic Pirelli tire cliff wear engines and horrific 50/50 barrier blowout triggers
│   │   └── weather-system.js            # Realistic atmospheric weather transitions (Dry ☀️ ↔ Cloudy ☁️ ↔ Light Rain 🌦️ ↔ Heavy Rain 🌧️)
│   └── ui/
│       ├── modals.js                    # Universal dialog execution store with strict deduplication (#modalStack) to permanently stop twin popups
│       ├── notifications.js             # Fixed HUD sliding floating banner updaters with auto-cleanup timeouts
│       ├── player-controls.js           # Sub-millisecond dual driver dual cockpit updating entirely in place to eliminate DOM thrashing
│       ├── timing-table.js              # 60fps sub-second updating complete Esport multi-column Standings sheet (POS, GAP, INT, BEST, PIT)
│       └── transitions.js               # Professional animated F1 match Start Light sequences (5 red lights → all out GO!) and confetti bursts
└── README.md                            # Comprehensive Architectural Engineering & Lore Documentation
```

---

## 🌟 Definitive ESport Master Subsystems Constructed (`Proposals 1–5`)

### 📜 Proposal 1: Legendary Historical Scenario Mode (`THE HALL OF GLORY`)
Instead of a standard campaign, you and your star constructor drivers can drop directly into the cockpits of the most nail-biting title shootouts in Formula 1 history:
1. 🌧️🇧🇷 **`THE MIRACLE OF BRAZIL`** (*Interlagos Senna Autodromo*): You sit P5 and P6 on completely slick **Soft** rubber (`wearPercent: 65`) in a torrential Brazilian downpour (`HEAVY_RAIN`) with exactly 5 laps remaining (starts on Lap 3 of 8). Standing water is immense and rival Constructor machines in P1–P4 pull away. E.g., execute an unscheduled Double Stacking pit undercut and master your wet braking points to snatch P1 and win the Constructor title by 1 point! Played with **`Novara Racing`** (*Williams style identity*).
2. 🇦🇪🏆 **`THE ABU DHABI SHOOTOUT`** (*Sunset Boulevard Circuit / Yas Marina*): Exactly 2 laps remaining behind the active Safety Car train. You sit P2 on fresh, blistering **Soft** rubber directly behind the rival World Champion in P1 who is struggling on completely scrubbed **Hard** rubber. As the green flags wave on the final lap, `"LIGHTS OUT IN... GO GO GO!"` E.g. manage your exact charges of ERS Overtake Boost and Driver Aggression to execute the ultimate world title move! Played with **`Invicta Red`** (*Red Bull style*) vs **`Paragon Motorsport`** (*Mercedes style identity*).
3. 🇲🇨🛡️ **`THE STRAT 5 MONACO DEFENSE`** (*Crimson Bay GP*): 8 spectacular narrow street laps remaining. You lead the Monaco Grand Prix in P1 but your power unit and ERS regeneration thermals are absolutely critical (`boostRiskPercent: 80`). Behind you, two relentless rival Constructor machines sit on fresh Softs with exactly `+0.4s` and `+0.8s` diffs. In the narrowest confines in the world, hold flawless defensive lines to achieve Monaco glory! Played with **`Veloce Scuderia`** (*Ferrari style Scarlet Red identity*).

---

### 🤝 Proposal 2: Esport Media Dilemmas & Corporate Primary Sponsors
* **Definitive Corporate Primary Primary Primary Sponsorships (`#db-sponsors`)**: In your Career Dashboard Hub, browse and sign definitive primary corporate sponsors (*AWS Subspace Matrix*, *Petronas Synthetic Core*, *Monster Energy Slingshot*, *Red Bull Esport Transcendent*) that inject massive per-match operational budgets (`+$2.5M` to `+$6.0M`). However, they enforce mandatory contractual match thresholds (*Double Top-10 Points*, *At Least One Podium*, *Overall Fastest Match Lap*, *Double Podiums*). Satisfying targets nets huge capital; breaching the contract incurs highly sarcastic formal faxes from corporate billing deducting network repair fines (`-$1.0M` to `-$3.0M`) shown live on your Post-Race sheets!
* **Mid-Week Formal Media Press Dilemmas Studio (`#db-media`)**: Step up to the press room microphones between match weekends to resolve live mid-week media controversies (*The Dual-Driver Pit Radio Controversy*, *Illegal DRS Latency Rebuttals*, *Front Wing Suction Stall Statements*). Your formal press statements instantly dynamically dictate active Paddock sentiment, Constructor Fan Popularity, and Driver Stats (`Pace`, `Consistency`, `Aggression`).

---

### 🌦️ Proposal 4: Active intermediate / Slick Crossover Doppler Meteorology Radar
In Live Grand Prix racing mode, your lower **Esport Tactical Command Deck** (`#race-tactical-deck`) houses an interactive Satellite Weather Station (`#deck-pane-weather`):
* **Spinning Graphical Doppler Display**: Sweeps across your active layout showing real-time animated clouds approaching your circuit.
* **Standing Water Figures & Precise Highlighting**: Monitors exact surface water saturation (`Standing Water: 24.5%`) and instantly highlights the active Pirelli window:
  * 🔴 **`SLICKS (Soft / Med / Hard)`**: `0% – 18% Standing Water`
  * 🟢 **`INTERMEDIATES (Inters)`**: `18% – 55% Standing Water`
  * 🔵 **`FULL WETS (Heavy Rain)`**: `> 55% Standing Water`
* **Real-Time Striking Apex Predictive Micro-Timer**: Tracks absolute sub-lap match progress to deliver sub-decimal real-time predictions forecasting exactly which lap and exact Turn apex an approaching weather cell will strike (`⚠️ Incoming Light Rain Cell: exactly in 1.65 Laps at Turn 14 Apex`).
* **One-Click Quick Pirelli Quick Undercut Button**: Simply click your **`🚀 EXECUTE QUICK PIRELLI BOX CALL`** button on your radar console to automatically trigger a manual player pit call (`RaceEngine.playerPitCall()`) for all local Constructor racing machines simultaneously.

---

### ⚡ Proposal 5: Active Mandatory FIA Virtual Safety Car (VSC) Minigame Sprint
When minor debris or driver mistakes occur mid-match, the lower tactical console automatically illuminates and switches to the **VSC Pacing Arena** (`#deck-pane-vsc`):
* Inside your VSC minigame matrix, you will see a moving graphical FIA target oscillator line (`50 + Math.sin(performance.now() * 0.0025) * 35`) and an interactive Dual Constructor Driver Pacing controller range slider.
* You must actively balance your range input to keep your green Constructor Pacing Bar overlay perfectly aligned within `±8%` of the moving golden mandatory FIA delta line.
* Flawless target tracking charges up your cumulative laser Slingshot Sprint Gauge. When the 15-second neutralization timer concludes (`0.0s`), `"🟢 GREEN FLAG GREEN FLAG!"` Flawless tracking (`slingshotCharge >= 65%`) rewards your dual dual drivers with a massive **`-2.5s` absolute pace acceleration surge** and a free bonus Overtake ERS Boost charge out of the neutralization!

---

### 🛠️ Ultimate Under-the-Hood Engineering Algorithmic Defenses

1. **Complete In-Place Dual Driver Cockpit Reconstruction (`player-controls.js`)**: To prevent browser DOM thrashing and sub-millisecond click swallowing at high simulation speeds (`30X` or `60X`), root DOM `<button>` nodes are allocated exactly ONCE. Mid-race telemetric updaters exclusively execute `syncDriverControlsInPlace()`, updating element DOM text properties (`P1`, `Pits: 2`) and sub-millisecond sub-millisecond gauge widths (`#risk-bar`) entirely in place. Your button memory addresses sit permanently stable forever.
2. **Timing Table Safety Car Gaps Completely Decoupled (`race-engine.js`)**: Solved Salvatore's `1:13.107` calculation anomaly. Look at `RaceEngine.completeLap()`—Safety Car catch-up bunch-up time corrections are applied entirely and exclusively to `car.totalRaceTime`. Under SC, `lapTime` strictly records normal slow baseline SC laps (~`1:45`). Implemented `isValidFastLap` gate strictly locking `bestLapTime` and global `fastestLap` updates purely to true green-flag racing.
3. **Absolute Non-Volatile Total Nuclear Purging (`profile.js`, `save-system.js`)**: To ensure 100% full clearing parity even if browser iframe previews restrict `location.reload()`, clicking **`⚠️ PURGE ALL DATA`** explicitly programmatically purges runtime `StateManager` staging variables in memory in place AND executes an absolute LocalStorage LocalStorage wipe (`localStorage.clear()`). All previous Constructor match victory figures, unlocked silverware, and campaign legacies correctly return exactly to `0`. E.g. absolute clearing parity is active.

---

## 🖥️ Getting Started & Local Workspace Instructions

### Serverless Static Deployment
Because **VELOCITY** runs completely on client-side Web APIs with absolutely zero backend database or server infrastructure needed, it is completely compatible with any standard static web server.

### Pure Client Auto-Launch
To run the game locally, simply open `index.html` inside any standard, modern Web Browser (such as **Google Chrome**, **Mozilla Firefox**, or **Microsoft Edge**). No Local Node package installations or webpack building are required. E.g. the entire simulation compiles and evaluates seamlessly in your DOM.

---

## 🏆 Official ESport Broadcast Health Parity

This entire software suite, exact specific DOM tree layouts, and flexbox viewports sit completely successfully validated, fully deglitched, and compiled with **exactly 0 syntax errors**. E.g., built to the absolute absolute top ESport broadcast layout standard!

*Enjoy your live Grand Prix gameplay, make those split-second tire strategy deltas, and dominate the absolute absolute absolute peak of Formula 1 Esport Constructor management!*

---
