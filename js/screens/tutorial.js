/* ============================================
   VELOCITY — TUTORIAL SCREEN
   Interactive how-to-play guide with chapters
   ============================================ */

window.TutorialScreen = (() => {

    let container = null;
    let isActive = false;
    let currentChapter = 0;
    let completedChapters = new Set();

    const CHAPTERS = [
        {
            id: 'overview',
            title: 'Game Overview',
            content: () => `
                <p>Welcome to <strong style="color: var(--yellow)">VELOCITY - CONSTRUCTOR CHAMPIONSHIP</strong>, a strategic racing management game where you build a team, develop your car, and dominate the championship.</p>

                <h3>Your Role</h3>
                <p>You're the team principal. Every decision matters:</p>
                <ul>
                    <li>Sign the best drivers within your budget</li>
                    <li>Hire skilled staff to gain a competitive edge</li>
                    <li>Develop your car between races</li>
                    <li>Make strategy calls during live races</li>
                    <li>Build a legacy across multiple seasons</li>
                </ul>

                <h3>Win Conditions</h3>
                <ul>
                    <li>Win individual races</li>
                    <li>Win the Drivers Championship</li>
                    <li>Win the Constructors Championship</li>
                    <li>Beat your rivals and become a racing legend</li>
                </ul>
            `
        },
        {
            id: 'timing',
            title: 'Reading the Timing Screen',
            content: () => `
                <p>The timing screen is your command center during races. Master it to make smart decisions.</p>

                <h3>Key Columns</h3>
                <ul>
                    <li><strong>POS</strong> — Current position with change indicator (▲▼)</li>
                    <li><strong>GAP</strong> — Time behind the leader</li>
                    <li><strong>INT</strong> — Time behind the car directly ahead</li>
                    <li><strong>LAST LAP</strong> — Most recent lap time</li>
                    <li><strong>TIRE</strong> — Current compound (color-coded)</li>
                    <li><strong>LAPS</strong> — Laps on current tire set</li>
                    <li><strong>PIT</strong> — Number of pit stops made</li>
                </ul>

                <h3>Sector Colors</h3>
                <div class="tutorial-demo">
                    <div class="tutorial-demo-content" style="gap: var(--space-xl);">
                        <div style="text-align: center;">
                            <div style="color: #AA33FF; font-family: 'Orbitron'; font-size: 20px;">PURPLE</div>
                            <div style="color: var(--gray-500); font-size: 11px;">Overall fastest</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: var(--green); font-family: 'Orbitron'; font-size: 20px;">GREEN</div>
                            <div style="color: var(--gray-500); font-size: 11px;">Personal best</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="color: var(--yellow); font-family: 'Orbitron'; font-size: 20px;">YELLOW</div>
                            <div style="color: var(--gray-500); font-size: 11px;">Slower than best</div>
                        </div>
                    </div>
                </div>
            `
        },
        {
            id: 'tires',
            title: 'Tire Management',
            content: () => `
                <p>Tire strategy can win or lose a race. Each compound has a unique performance profile.</p>

                <h3>Compounds</h3>
                <div class="tutorial-demo">
                    <div class="compound-demo">
                        <div class="compound-demo-item">
                            <div class="compound-dot" style="background: #FF3333"></div>
                            <div class="compound-label">SOFT</div>
                            <div class="compound-stats">Fastest<br>Wears quick</div>
                        </div>
                        <div class="compound-demo-item">
                            <div class="compound-dot" style="background: #FFD700"></div>
                            <div class="compound-label">MEDIUM</div>
                            <div class="compound-stats">Balanced<br>All-rounder</div>
                        </div>
                        <div class="compound-demo-item">
                            <div class="compound-dot" style="background: #F0F0F0"></div>
                            <div class="compound-label">HARD</div>
                            <div class="compound-stats">Durable<br>Slower</div>
                        </div>
                        <div class="compound-demo-item">
                            <div class="compound-dot" style="background: #00CC66"></div>
                            <div class="compound-label">INTER</div>
                            <div class="compound-stats">Damp track<br>Light rain</div>
                        </div>
                        <div class="compound-demo-item">
                            <div class="compound-dot" style="background: #0066FF"></div>
                            <div class="compound-label">WET</div>
                            <div class="compound-stats">Heavy rain<br>Slow on dry</div>
                        </div>
                    </div>
                </div>

                <h3>The Cliff</h3>
                <p>Tires don't degrade linearly. After their optimal window, performance drops sharply — this is "the cliff." Pit before you hit it!</p>

                <h3>Tire Phases</h3>
                <ul>
                    <li><strong>Warming</strong> — First few laps, building up to peak</li>
                    <li><strong>Optimal</strong> — Peak grip, push hard</li>
                    <li><strong>Wearing</strong> — Slow degradation</li>
                    <li><strong>Cliff</strong> — Rapid performance loss</li>
                    <li><strong>Dead</strong> — Box immediately!</li>
                </ul>
            `
        },
        {
            id: 'pitstops',
            title: 'Pit Stop Strategy',
            content: () => `
                <p>Pit stops are mini-battles within the race. Time them right to gain positions.</p>

                <h3>When to Pit</h3>
                <ul>
                    <li><strong>Tire degradation</strong> — Before they fall off the cliff</li>
                    <li><strong>Weather change</strong> — Rain coming? Switch compounds</li>
                    <li><strong>Safety car</strong> — Free pit stop! Other cars are slow too</li>
                    <li><strong>Undercut</strong> — Pit early on fresh tires to leapfrog rivals</li>
                    <li><strong>Overcut</strong> — Stay out, build pace on aging tires</li>
                </ul>

                <h3>Player Controls</h3>
                <ul>
                    <li><strong>PIT NOW</strong> button — Call your driver in next lap</li>
                    <li><strong>Driver Modes</strong> — PUSH / STANDARD / SAVE</li>
                    <li><strong>BOOST</strong> — Temporary overtake boost (3 uses per race)</li>
                </ul>

                <h3>Keyboard Shortcuts</h3>
                <ul>
                    <li><kbd>Space</kbd> — Pause/Resume</li>
                    <li><kbd>↑</kbd> / <kbd>↓</kbd> — Adjust playback speed</li>
                    <li><kbd>Enter</kbd> — Skip to end</li>
                    <li><kbd>P</kbd> — Pit driver 1</li>
                    <li><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> — Set driver mode</li>
                    <li><kbd>ESC</kbd> — Return home</li>
                </ul>
            `
        },
        {
            id: 'weather',
            title: 'Weather & Conditions',
            content: () => `
                <p>Weather changes everything. A dry race can become a wet one in moments.</p>

                <h3>Weather States</h3>
                <ul>
                    <li>☀️ <strong>Dry</strong> — Standard racing conditions</li>
                    <li>☁️ <strong>Cloudy</strong> — Cooler, can shift to rain</li>
                    <li>🌦️ <strong>Light Rain</strong> — Intermediates required</li>
                    <li>🌧️ <strong>Heavy Rain</strong> — Full wets, low visibility</li>
                    <li>🌤️ <strong>Drying</strong> — Track returning to dry</li>
                </ul>

                <h3>Wet Driving Tips</h3>
                <ul>
                    <li>Drivers with high <strong>Wet Skill</strong> excel in rain</li>
                    <li>Mistakes are 2.5× more likely in heavy rain</li>
                    <li>Lap times are 5-8 seconds slower in heavy rain</li>
                    <li>Use the weather forecast to plan ahead</li>
                </ul>

                <h3>Wet Master Trait</h3>
                <p>Drivers with the <strong style="color: var(--yellow)">Wet Master</strong> trait get +10 wet skill — invaluable when the skies open up.</p>
            `
        },
        {
            id: 'championship',
            title: 'Championship & Points',
            content: () => `
                <p>Championships are won across an entire season, race by race.</p>

                <h3>Points System</h3>
                <div class="tutorial-demo">
                    <div class="tutorial-demo-content">
                        <table style="width: 100%; max-width: 400px;">
                            <tr style="border-bottom: 1px solid var(--border-subtle);">
                                <th style="text-align: left; padding: 6px; color: var(--yellow);">Position</th>
                                <th style="text-align: right; padding: 6px; color: var(--yellow);">Points</th>
                            </tr>
                            ${[25, 18, 15, 12, 10, 8, 6, 4, 2, 1].map((pts, i) => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                                    <td style="padding: 6px; color: var(--gray-300);">${['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th'][i]}</td>
                                    <td style="text-align: right; padding: 6px; font-family: 'Orbitron'; font-weight: 700;">${pts}</td>
                                </tr>
                            `).join('')}
                            <tr>
                                <td style="padding: 6px; color: var(--gray-500); font-size: 11px;">+ Fastest Lap</td>
                                <td style="text-align: right; padding: 6px; font-family: 'Orbitron'; color: #AA33FF;">+1</td>
                            </tr>
                        </table>
                    </div>
                </div>

                <h3>Two Championships</h3>
                <ul>
                    <li><strong>Drivers Championship</strong> — Best individual driver</li>
                    <li><strong>Constructors Championship</strong> — Best team (both drivers combined)</li>
                </ul>

                <p>You need both drivers performing to win the Constructors title!</p>
            `
        },
        {
            id: 'advanced',
            title: 'Advanced Tactics',
            content: () => `
                <p>Master these techniques to dominate the field.</p>

                <h3>DRS & Slipstream</h3>
                <ul>
                    <li>Within <strong>1 second</strong> of car ahead → DRS activated (+0.5s pace)</li>
                    <li>Within <strong>2 seconds</strong> → slipstream effect</li>
                    <li>Within <strong>3 seconds</strong> → dirty air penalty (-0.3s)</li>
                </ul>

                <h3>The Undercut</h3>
                <p>Pit one lap earlier than the car ahead. With fresh tires, you'll set faster laps and emerge ahead when they pit.</p>

                <h3>The Overcut</h3>
                <p>Stay out longer on old tires. If your driver can manage them, you'll have fresher rubber at the end while rivals struggle.</p>

                <h3>Driver Traits Matter</h3>
                <ul>
                    <li><strong>Qualifying Specialist</strong> — Pole position machine</li>
                    <li><strong>Overtaker</strong> — Great in traffic</li>
                    <li><strong>Tire Whisperer</strong> — Makes stints last longer</li>
                    <li><strong>Wet Master</strong> — King in the rain</li>
                    <li><strong>Iron Will</strong> — Fewer mistakes under pressure</li>
                </ul>

                <h3>Build a Balanced Team</h3>
                <p>Don't blow your entire budget on one star driver. A balanced lineup of solid performers with great staff will outscore a star-and-rookie team.</p>
            `
        },
        {
            id: 'doppler_radar',
            title: 'Doppler Meteorology Radar',
            content: () => `
                <p>During live racing, your lower Tactical Deck holds an elite Esport satellite weather station. Use it to outsmart your rival principals!</p>

                <h3>Standing Water Saturation</h3>
                <p>The circuit asphalt actively saturates or dries out. Watch your Standing Water numbers to nail the perfect compound window:</p>
                <ul>
                    <li>🔴 <strong>SLICKS (Soft/Med/Hard)</strong>: <kbd>0% – 18%</kbd> Standing Water</li>
                    <li>🟢 <strong>INTERMEDIATES (Inters)</strong>: <kbd>18% – 55%</kbd> Standing Water</li>
                    <li>🔵 <strong>FULL WETS (Heavy Rain)</strong>: <kbd>&gt; 55%</kbd> Standing Water</li>
                </ul>

                <h3>Real-Time Striking Apex Micro-Timer</h3>
                <p>When a sudden weather shift approaches within 5 laps, your Doppler console delivers a precise sub-decimal prediction forecasting exactly which lap and Turn apex the cloud will hit!</p>

                <h3>One-Click Quick Pirelli Call</h3>
                <p>When the optimal crossover hits, hit your <strong style="color: #00FF41;">🚀 EXECUTE QUICK PIRELLI BOX CALL</strong> radar button. Your local Williams/Novara Constructor machines instantly execute an unscheduled manual pit undercut without wrestling through any side menus!</p>
            `
        },
        {
            id: 'vsc_sprint',
            title: 'Virtual Safety Car Sprints',
            content: () => `
                <p>When minor debris or driver mistakes occur, the stewards initiate a high-stakes 15-second Virtual Safety Car (VSC) minigame.</p>

                <h3>Mandatory FIA Delta Maintenance</h3>
                <p>Inside your VSC tactical console, you will see a moving graphical FIA Target Line and an interactive Dual Driver Pacing slider.</p>
                <p>You must actively balance your range slider to keep your green Constructor Pacing Bar perfectly matched within <kbd>±8%</kbd> of the moving golden FIA target line.</p>

                <h3>Slingshot Pace Surge Bonus</h3>
                <p>Flawless target tracking charges up your cumulative laser Slingshot gauge. If you achieve <kbd>&gt; 65%</kbd> Slingshot Charge when the 15-second countdown ends:</p>
                <p><strong style="color: #FFD700;">🟢 GREEN FLAG!</strong> Your dual dual drivers earn an immediate <strong style="color: #00FF41;">-2.5s absolute pace acceleration bonus</strong> and a free bonus Overtake ERS Boost charge out of the neutralization!</p>
            `
        },
        {
            id: 'multiplayer',
            title: 'Online Multiplayer Arena',
            content: () => `
                <p>Challenge up to 11 human constructors in the serverless Global Arena.</p>

                <h3>Hosting a Lobby</h3>
                <ul>
                    <li><strong>Lobby Code</strong> — Share the SALT-based unique code with friends.</li>
                    <li><strong>Ready System</strong> — You cannot launch until all human grid members click their cards to toggle 🏁 READY.</li>
                    <li><strong>Master Control</strong> — The Host sets the season length, difficulty, and simulation speed.</li>
                </ul>

                <h3>Multiplayer Synergy</h3>
                <ul>
                    <li><strong>Unique Roster</strong> — Drivers, Teams, and Staff are locked once chosen. No two constructors can have the same setup.</li>
                    <li><strong>Synchronized Weekend</strong> — Practice and Qualifying sessions start for everyone at once. Grid results are identical across all clients.</li>
                    <li><strong>Skip Voting</strong> — Skipping the rest of a race requires a unanimous vote from all human players.</li>
                </ul>

                <h3>Netcode & Latency</h3>
                <p>Watch the 🛰️ ms ping indicator. The Host broadcasts race positions every 2 seconds to ensure a perfectly synchronized 24-car field worldwide. If you lose connection, an emergency <strong>RECONNECT</strong> popup will appear on your Home Screen.</p>
            `
        }
    ];

    function init() {
        container = document.getElementById('tutorial-content');
        if (!container) return;
        attachListeners();
    }

    function render() {
        if (!container) return;

        container.innerHTML = `
            <div class="tutorial-container">
                <button class="home-btn" id="tut-home-btn" title="Back to Home" style="z-index: 50;">⌂</button>

                <div class="tutorial-sidebar">
                    <h2 class="tutorial-sidebar-title">CHAPTERS</h2>
                    <div class="tutorial-chapter-list">
                        ${CHAPTERS.map((ch, idx) => `
                            <div class="tutorial-chapter-item ${idx === currentChapter ? 'active' : ''} ${completedChapters.has(idx) ? 'completed' : ''}"
                                 data-chapter="${idx}">
                                <div class="chapter-number">${String(idx + 1).padStart(2, '0')}</div>
                                <div class="chapter-info">
                                    <div class="chapter-title">${escapeHTML(ch.title)}</div>
                                    <div class="chapter-status ${completedChapters.has(idx) ? 'done' : ''}">
                                        ${completedChapters.has(idx) ? '✓ Read' : 'Unread'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tutorial-main">
                    <div class="tutorial-content-header">
                        <h1 class="tutorial-content-title">${escapeHTML(CHAPTERS[currentChapter].title)}</h1>
                        <div class="tutorial-content-subtitle">
                            Chapter ${currentChapter + 1} of ${CHAPTERS.length}
                        </div>
                    </div>

                    <div class="tutorial-body">
                        ${CHAPTERS[currentChapter].content()}
                    </div>

                    <div class="tutorial-footer">
                        <button class="btn" id="tut-prev"
                            ${currentChapter === 0 ? 'disabled' : ''}>
                            ← PREVIOUS
                        </button>

                        <div class="tutorial-progress">
                            ${CHAPTERS.map((_, idx) => `
                                <div class="tutorial-progress-dot ${idx === currentChapter ? 'active' : ''} ${completedChapters.has(idx) ? 'completed' : ''}"></div>
                            `).join('')}
                        </div>

                        <button class="btn ${currentChapter === CHAPTERS.length - 1 ? 'btn-yellow' : ''}" id="tut-next">
                            ${currentChapter === CHAPTERS.length - 1 ? 'COMPLETE ✓' : 'NEXT →'}
                        </button>
                    </div>

                    ${completedChapters.size === CHAPTERS.length ? `
                        <button class="btn btn-ready-to-race" id="tut-ready">
                            I'M READY TO RACE
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:tutorial:enter', () => {
            isActive = true;
            currentChapter = 0;
            render();
            attachChapterListeners();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'tutorial') isActive = false;
        });
    }

    function attachChapterListeners() {
        if (!container) return;

        container.querySelector('#tut-home-btn')?.addEventListener('click', () => {
            EventBus.emit('nav:home');
        });

        // Chapter selection
        container.querySelectorAll('.tutorial-chapter-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.chapter);
                navigateToChapter(idx);
            });
        });

        // Previous / Next
        container.querySelector('#tut-prev')?.addEventListener('click', () => {
            if (currentChapter > 0) navigateToChapter(currentChapter - 1);
        });

        container.querySelector('#tut-next')?.addEventListener('click', () => {
            completedChapters.add(currentChapter);
            if (currentChapter < CHAPTERS.length - 1) {
                navigateToChapter(currentChapter + 1);
            } else {
                if (typeof Notifications !== 'undefined') Notifications.success('How to Play Complete!', 'Redirecting to Single Player Paddock...');
                if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'singleplayer', color: '#00FF41' });
            }
        });

        // Ready to race button
        container.querySelector('#tut-ready')?.addEventListener('click', () => {
            if (typeof Notifications !== 'undefined') Notifications.success('Ready to Race!', 'Redirecting to Single Player Paddock...');
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'singleplayer', color: '#00FF41' });
        });
    }

    function navigateToChapter(idx) {
        if (idx < 0 || idx >= CHAPTERS.length) return;
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
        currentChapter = idx;
        render();
        attachChapterListeners();

        // Scroll main content to top
        const main = container.querySelector('.tutorial-main');
        if (main) main.scrollTop = 0;
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function destroy() {
        isActive = false;
    }

    return { init, render, destroy };
})();