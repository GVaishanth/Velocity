/* ============================================
   VELOCITY — SINGLE PLAYER SCREEN
   Landing page for single-player mode
   Shows 4 game modes: New Career, Continue,
   Challenge Mode, Load Game
   ============================================ */

window.SinglePlayerScreen = (() => {

    let container = null;
    let isActive = false;

    /**
     * Initialize the screen
     */
    function init() {
        container = document.getElementById('sp-content');
        if (!container) return;
        attachListeners();
    }

    /**
     * Render the single player landing
     */
    function render() {
        if (!container) return;

        // --- ISOLATED SAVE CHECK ---
        // We only care about single-player saves here.
        let hasSave = SaveSystem.exists('gamestate');
        let saveData = hasSave ? SaveSystem.load('gamestate') : null;
        
        // If the save file is actually a multiplayer session (legacy bug), ignore it
        if (saveData && saveData.career?.isMultiplayer) {
            hasSave = false;
            saveData = null;
        }

        const saveMeta = hasSave ? SaveSystem.getMeta('gamestate') : null;

        container.innerHTML = `
            <div class="sp-container">
                <button class="home-btn" id="sp-home-btn" title="Back to Home">⌂</button>

                <div class="sp-header">
                    <h1 class="screen-title" style="color: var(--green); text-shadow: 0 0 20px var(--green-glow)">
                        SINGLE PLAYER
                    </h1>
                    <p class="sp-tagline">Choose your path to glory</p>
                </div>

                <div class="sp-modes-grid">
                    <div class="sp-mode-card" data-mode="new-career">
                        <div class="sp-mode-icon">🏆</div>
                        <div class="sp-mode-title">NEW CAREER</div>
                        <div class="sp-mode-desc">Start a new championship journey from scratch</div>
                        <button class="btn btn-glow btn-full">START</button>
                    </div>

                    <div class="sp-mode-card ${!hasSave ? 'disabled' : ''}" data-mode="continue">
                        <div class="sp-mode-icon">▶️</div>
                        <div class="sp-mode-title">CONTINUE</div>
                        <div class="sp-mode-desc">
                            ${hasSave && saveData?.career ? `
                                ${escapeHTML(saveData.career.team?.name || 'Unknown Team')}<br>
                                <span style="color: var(--gray-500); font-size: 11px">
                                    Season ${saveData.career.season || 1} • ${(saveData.career.currentRound || 0) >= (saveData.career.totalRounds || 1) ? `Completed (${saveData.career.totalRounds}/${saveData.career.totalRounds})` : `Round ${(saveData.career.currentRound || 0) + 1}/${saveData.career.totalRounds || 1}`}<br>
                                    ${saveMeta ? saveMeta.date : ''}
                                </span>
                            ` : 'No saved career found'}
                        </div>
                        <button class="btn btn-glow btn-full" ${!hasSave ? 'disabled' : ''}>RESUME</button>
                    </div>

                    <div class="sp-mode-card" data-mode="challenge">
                        <div class="sp-mode-icon">⏱️</div>
                        <div class="sp-mode-title">QUICK RACE</div>
                        <div class="sp-mode-desc">Jump straight into a single race with a random team</div>
                        <button class="btn btn-glow btn-full">RACE NOW</button>
                    </div>

                    <div class="sp-mode-card" data-mode="load">
                        <div class="sp-mode-icon">📁</div>
                        <div class="sp-mode-title">LOAD GAME</div>
                        <div class="sp-mode-desc">Import a saved career from file or backup</div>
                        <button class="btn btn-glow btn-full">LOAD</button>
                    </div>

                    <div class="sp-mode-card premium-scenario-card" data-mode="scenarios">
                        <div class="sp-mode-icon" style="color: #FFD700; text-shadow: 0 0 20px rgba(255,215,0,0.6);">📜</div>
                        <div class="sp-mode-title" style="color: #FFD700;">HALL OF GLORY</div>
                        <div class="sp-mode-desc">Drop straight into iconic historical F1 title shootouts & extreme managerial scenarios</div>
                        <button class="btn btn-glow btn-full" style="background: rgba(255,215,0,0.1); border-color: #FFD700; color: #FFD700;">SELECT SCENARIO</button>
                    </div>
                </div>

                <div class="sp-footer">
                    <p class="sp-hint">Press ESC at any time to return home</p>
                </div>
            </div>
        `;

        // Inject minimal page-specific styles
        injectStyles();
    }

    /**
     * Attach event listeners
     */
    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:singleplayer:enter', () => {
            isActive = true;
            render();
            attachCardListeners();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'singleplayer') isActive = false;
        });
    }

    /**
     * Attach listeners to mode cards
     */
    function attachCardListeners() {
        if (!container) return;

        // Home button
        const homeBtn = container.querySelector('#sp-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                EventBus.emit('nav:home');
            });
        }

        // Mode cards
        const cards = container.querySelectorAll('.sp-mode-card');
        cards.forEach(card => {
            if (card.classList.contains('disabled')) return;
            card.addEventListener('click', () => {
                handleModeSelect(card.dataset.mode);
            });
        });
    }

    /**
     * Handle mode selection
     */
    function handleModeSelect(mode) {
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();

        switch (mode) {
            case 'new-career':
                startNewCareer();
                break;

            case 'continue':
                continueCareer();
                break;

            case 'challenge':
                quickRace();
                break;

            case 'load':
                loadGame();
                break;

            case 'scenarios':
                showScenariosHub();
                break;
        }
    }

    /**
     * Display The Hall of Glory Scenario Selection Hub
     */
    function showScenariosHub() {
        Modals.open({
            title: 'THE HALL OF GLORY — LEGENDARY SCENARIOS',
            className: 'modal-lg',
            body: `
                <div class="scenarios-hub-container" style="display: flex; flex-direction: column; gap: 20px;">
                    <p style="color: var(--gray-400); font-size: 15px; font-family: Rajdhani; text-align: center; margin-bottom: 10px;">
                        Select an iconic historical Grand Prix scenario. Your power unit, starting rubber, weather, and grid delta will be fully pre-configured.
                    </p>

                    <!-- SCENARIO 1: MIRACLE OF BRAZIL -->
                    <div class="scenario-card" style="display: flex; gap: 16px; background: var(--surface-1); border: 2px solid #00FF41; border-radius: 8px; padding: 16px; align-items: center;">
                        <div style="font-size: 40px; min-width: 60px; text-align: center;">🌧️🇧🇷</div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                                <span class="badge" style="background: rgba(0,255,65,0.2); color: var(--green); font-family: Orbitron; font-size: 10px; padding: 2px 6px;">WET SHOOTOUT</span>
                                <span style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: var(--white);">THE MIRACLE OF BRAZIL</span>
                            </div>
                            <p style="font-family: Rajdhani; font-size: 14px; color: var(--gray-300); margin-bottom: 8px; line-height: 1.4;">
                                You sit P6 on completely slick Soft tires in a torrential Brazilian downpour with exactly 5 laps remaining. You must immediately execute an emergency box for Intermediates, master the slick braking transition, and slice through rival spray to snatch P1 and win the Constructor title by 1 point!
                            </p>
                            <div style="font-family: Orbitron; font-size: 11px; color: var(--gray-400); display: flex; gap: 16px; flex-wrap: wrap;">
                                <span>🎯 Target: Win Race (P1)</span>
                                <span>🏎️ Constructor: Novara Racing</span>
                                <span>🗺️ Circuit: Interlagos Senna</span>
                            </div>
                        </div>
                        <button class="btn btn-glow" style="padding: 12px 24px; font-family: Orbitron; font-weight: 900;" onclick="SinglePlayerScreen.launchScenario('miracle_of_brazil')">
                            EXECUTE
                        </button>
                    </div>

                    <!-- SCENARIO 2: ABU DHABI SHOOTOUT -->
                    <div class="scenario-card" style="display: flex; gap: 16px; background: var(--surface-1); border: 2px solid #FFD700; border-radius: 8px; padding: 16px; align-items: center;">
                        <div style="font-size: 40px; min-width: 60px; text-align: center;">🇦🇪🏆</div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                                <span class="badge" style="background: rgba(255,215,0,0.2); color: var(--yellow); font-family: Orbitron; font-size: 10px; padding: 2px 6px;">FINAL LAP SPRINT</span>
                                <span style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: var(--white);">THE ABU DHABI SHOOTOUT</span>
                            </div>
                            <p style="font-family: Rajdhani; font-size: 14px; color: var(--gray-300); margin-bottom: 8px; line-height: 1.4;">
                                2 laps remaining. The green flags wave after a lengthy Safety Car neutralization. You sit P2 on fresh Soft rubber right on the gearbox of the rival World Champion who is struggling on dead Hard rubber. You have exactly 3 charges of ERS Boost—execute the ultimate title move!
                            </p>
                            <div style="font-family: Orbitron; font-size: 11px; color: var(--gray-400); display: flex; gap: 16px; flex-wrap: wrap;">
                                <span>🎯 Target: Pass Rival (P1)</span>
                                <span>🏎️ Constructor: Invicta Red</span>
                                <span>🗺️ Circuit: Sunset Boulevard</span>
                            </div>
                        </div>
                        <button class="btn btn-glow" style="padding: 12px 24px; font-family: Orbitron; font-weight: 900; background: rgba(255,215,0,0.1); border-color: #FFD700; color: #FFD700;" onclick="SinglePlayerScreen.launchScenario('abu_dhabi_shootout')">
                            EXECUTE
                        </button>
                    </div>

                    <!-- SCENARIO 3: STRAT 5 MONACO DEFENSE -->
                    <div class="scenario-card" style="display: flex; gap: 16px; background: var(--surface-1); border: 2px solid #FF0033; border-radius: 8px; padding: 16px; align-items: center;">
                        <div style="font-size: 40px; min-width: 60px; text-align: center;">🇲🇨🛡️</div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 4px;">
                                <span class="badge" style="background: rgba(255,0,51,0.2); color: var(--red); font-family: Orbitron; font-size: 10px; padding: 2px 6px;">STREET DEFENSE</span>
                                <span style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: var(--white);">THE STRAT 5 MONACO DEFENSE</span>
                            </div>
                            <p style="font-family: Rajdhani; font-size: 14px; color: var(--gray-300); margin-bottom: 8px; line-height: 1.4;">
                                8 narrow street laps remaining. You lead the Monaco Grand Prix in P1 but your power unit and ERS thermals are absolutely critical. Two incredibly relentless rival Constructor cars are glued directly to your diffuser. Master your cockpit regen and impenetrable defensive lines to hold P1!
                            </p>
                            <div style="font-family: Orbitron; font-size: 11px; color: var(--gray-400); display: flex; gap: 16px; flex-wrap: wrap;">
                                <span>🎯 Target: Defend P1</span>
                                <span>🏎️ Constructor: Veloce Scuderia</span>
                                <span>🗺️ Circuit: Crimson Bay GP</span>
                            </div>
                        </div>
                        <button class="btn btn-glow" style="padding: 12px 24px; font-family: Orbitron; font-weight: 900; background: rgba(255,0,51,0.1); border-color: #FF0033; color: #FF0033;" onclick="SinglePlayerScreen.launchScenario('monaco_defense')">
                            EXECUTE
                        </button>
                    </div>
                </div>
            `,
            actions: [{ label: 'Cancel', type: 'secondary' }]
        });
    }

    /**
     * Launch selected Legendary Scenario
     */
    function launchScenario(scenarioId) {
        Modals.close();
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();

        let playerTeamId = 'novara';
        let trackId = 'interlagos_senna';
        let totalLaps = 8;
        let startLap = 3;
        let status = 'GREEN';
        let weather = 'HEAVY_RAIN';
        let startingTire = 'SOFT';
        let playerWear = 65;
        let playerRisk = 15;
        let playerBoosts = 3;
        let rivalTire = 'WET';
        let rivalWear = 15;

        let name = 'The Miracle of Brazil';

        if (scenarioId === 'abu_dhabi_shootout') {
            playerTeamId = 'invicta';
            trackId = 'sunset_boulevard';
            totalLaps = 6;
            startLap = 4;
            status = 'SAFETY_CAR';
            weather = 'CLOUDY';
            startingTire = 'SOFT';
            playerWear = 10;
            playerRisk = 20;
            playerBoosts = 3;
            rivalTire = 'HARD';
            rivalWear = 85;
            name = 'The Abu Dhabi Shootout';
        } else if (scenarioId === 'monaco_defense') {
            playerTeamId = 'veloce';
            trackId = 'crimson_bay';
            totalLaps = 8;
            startLap = 0;
            status = 'GREEN';
            weather = 'CLOUDY';
            startingTire = 'MEDIUM';
            playerWear = 45;
            playerRisk = 80;
            playerBoosts = 1;
            rivalTire = 'SOFT';
            rivalWear = 20;
            name = 'The Strat 5 Monaco Defense';
        }

        const team = TEAMS_DATA.find(t => t.id === playerTeamId) || TEAMS_DATA[0];
        const track = TRACKS_DATA.find(t => t.id === trackId) || TRACKS_DATA[0];

        // Assign player drivers
        const usedDriverIds = [];
        const playerDrivers = [DRIVERS_DATA[0], DRIVERS_DATA[1]];
        playerDrivers.forEach(d => usedDriverIds.push(d.id));

        // Build all 12 teams
        const allTeams = TEAMS_DATA.map(t => {
            if (t.id === team.id) {
                return {
                    ...t,
                    isPlayer: true,
                    isLocalPlayer: true,
                    drivers: playerDrivers,
                    carStats: { ...t.baseCarStats }
                };
            } else {
                const aiDrivers = [];
                for (let k = 0; k < 2; k++) {
                    const avail = DRIVERS_DATA.filter(d => !usedDriverIds.includes(d.id));
                    const d = avail[Math.floor(Math.random() * avail.length)] || DRIVERS_DATA[k];
                    usedDriverIds.push(d.id);
                    aiDrivers.push(d);
                }
                return {
                    ...t,
                    isPlayer: false,
                    isLocalPlayer: false,
                    drivers: aiDrivers,
                    carStats: { ...t.baseCarStats }
                };
            }
        });

        // Collect all 24 drivers to construct definitive grid
        let allDrivers = [];
        allTeams.forEach(t => {
            t.drivers?.forEach(d => {
                allDrivers.push({ driver: d, team: t });
            });
        });

        // Sort so player drivers land exactly on assigned starting positions
        let grid = [];
        let pDrivers = allDrivers.filter(x => x.team.id === team.id);
        let rDrivers = allDrivers.filter(x => x.team.id !== team.id);

        if (scenarioId === 'abu_dhabi_shootout') {
            // P1 must be Paragon (Mercedes style)
            const pRival = rDrivers.find(x => x.team.id === 'paragon') || rDrivers[0];
            rDrivers = rDrivers.filter(x => x.driver.id !== pRival.driver.id);
            const ordered = [
                pRival,
                pDrivers[0],
                pDrivers[1],
                ...rDrivers
            ];
            grid = ordered.map((item, idx) => ({ carId: item.driver.id, position: idx + 1 }));
        } else if (scenarioId === 'monaco_defense') {
            // Player is P1 and P2
            const ordered = [
                pDrivers[0],
                rDrivers[0],
                rDrivers[1],
                pDrivers[1],
                ...rDrivers.slice(2)
            ];
            grid = ordered.map((item, idx) => ({ carId: item.driver.id, position: idx + 1 }));
        } else {
            // Miracle of Brazil: Player sits P5 and P6
            const ordered = [
                rDrivers[0],
                rDrivers[1],
                rDrivers[2],
                rDrivers[3],
                pDrivers[0],
                pDrivers[1],
                ...rDrivers.slice(4)
            ];
            grid = ordered.map((item, idx) => ({ carId: item.driver.id, position: idx + 1 }));
        }

        const scenarioTrack = { ...track, laps: totalLaps };

        const rivalSetups = [];
        for (let i = 0; i < 24; i++) {
            let rComp = rivalTire;
            let rWear = rivalWear + Math.random() * 5;
            let rGap = i * 1.5;
            if (scenarioId === 'abu_dhabi_shootout' && i === 0) {
                // Rival World Champ in P1
                rComp = 'HARD';
                rWear = 85;
                rGap = 0;
            } else if (scenarioId === 'abu_dhabi_shootout' && i === 1) {
                // Player in P2
                rGap = 0.5;
            } else if (scenarioId === 'monaco_defense') {
                rComp = 'SOFT';
                rWear = 20 + i * 2;
                if (i === 1) rGap = 0.4;
                if (i === 2) rGap = 0.8;
            } else if (scenarioId === 'miracle_of_brazil') {
                if (i < 4) {
                    rComp = (i % 2 === 0) ? 'WET' : 'INTERMEDIATE';
                    rWear = 15 + i * 3;
                    rGap = i * 2.2;
                }
            }
            rivalSetups.push({ compound: rComp, wearPercent: rWear, gap: rGap });
        }

        const scenarioConfig = {
            id: scenarioId,
            name: name,
            startLap: startLap,
            totalLaps: totalLaps,
            status: status,
            weather: weather,
            scLaps: status === 'SAFETY_CAR' ? 1 : 0,
            playerSetup: {
                compound: startingTire,
                wearPercent: playerWear,
                boostRisk: playerRisk,
                boosts: playerBoosts
            },
            rivalSetups: rivalSetups
        };

        StateManager.set('mode', 'SCENARIO_RACE');
        StateManager.set('race', {
            track: scenarioTrack,
            allTeams: allTeams,
            playerTeamId: team.id,
            difficulty: 'ELITE',
            strategy: { startingTire: startingTire, pitStops: 1, aggression: 8 },
            grid: grid,
            isScenario: true,
            scenarioConfig: scenarioConfig
        });

        EventBus.emit('nav:go', { screen: 'race', color: '#FFD700' });
    }

    /**
     * Start a new career
     */
    function startNewCareer() {
        const saveData = SaveSystem.load('gamestate');
        const hasActiveCareer = saveData && saveData.career && !saveData.career.finished && (saveData.career.currentRound || 0) < (saveData.career.totalRounds || 5);

        if (hasActiveCareer) {
            Modals.confirm({
                title: 'Start New Career?',
                body: 'You have an active saved career in progress. Starting a new one will overwrite it. Confirmed?',
                confirmText: 'Start New Career',
                confirmType: 'danger',
                onConfirm: () => {
                    SaveSystem.remove('gamestate');
                    StateManager.set('career', null);
                    proceedToTeamSetup();
                }
            });
        } else {
            proceedToTeamSetup();
        }
    }

    /**
     * Proceed to team setup wizard
     */
    function proceedToTeamSetup() {
        StateManager.set('mode', 'CAREER_SETUP');
        EventBus.emit('nav:go', { screen: 'team-setup', color: '#00FF41' });
    }

    /**
     * Continue existing career
     */
    function continueCareer() {
        const loaded = StateManager.loadFromSave();
        if (!loaded) {
            Notifications.error('Failed to load saved career');
            return;
        }

        const career = StateManager.get('career');
        if (!career) {
            Notifications.error('No career data found');
            return;
        }

        Notifications.success('Career loaded', `${career.team.name} - Season ${career.season}`);

        StateManager.set('mode', 'CAREER');
        EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' });
    }

    /**
     * Quick race mode - immediate race with random teams
     */
    function quickRace() {
        Modals.open({
            title: 'Quick Race Setup',
            body: `
                <div class="quick-race-setup">
                    <p style="color: var(--gray-400); margin-bottom: var(--space-lg);">
                        Pick your team and jump into a race instantly!
                    </p>

                    <div class="form-group">
                        <label class="form-label">Your Team</label>
                        <select class="select" id="quick-team-select">
                            ${TEAMS_DATA.map(t => `
                                <option value="${t.id}">${t.flag} ${t.name}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Starting Tire</label>
                        <select class="select" id="quick-tire-select">
                            <option value="SOFT">Soft</option>
                            <option value="MEDIUM" selected>Medium</option>
                            <option value="HARD">Hard</option>
                            <option value="INTERMEDIATE">Intermediate (Wet)</option>
                            <option value="WET">Wet (Heavy Rain)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Track</label>
                        <select class="select" id="quick-track-select">
                            <option value="random">🎲 Random Track</option>
                            ${TRACKS_DATA.map(t => `
                                <option value="${t.id}">${t.flag} ${t.name}</option>
                            `).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Race Length</label>
                        <select class="select" id="quick-length">
                            <option value="0.3">Short (30%)</option>
                            <option value="0.5" selected>Medium (50%)</option>
                            <option value="1.0">Full Length</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">AI Difficulty</label>
                        <select class="select" id="quick-difficulty">
                            <option value="CASUAL">Casual</option>
                            <option value="COMPETITIVE" selected>Competitive</option>
                            <option value="ELITE">Elite</option>
                        </select>
                    </div>
                </div>
            `,
            actions: [
                { label: 'Cancel', type: 'secondary' },
                {
                    label: 'START RACE',
                    type: 'primary',
                    onClick: () => startQuickRace()
                }
            ]
        });
    }

    /**
     * Initialize and start the quick race
     */
    function startQuickRace() {
        const teamId = document.getElementById('quick-team-select')?.value;
        const trackId = document.getElementById('quick-track-select')?.value;
        const lengthMult = parseFloat(document.getElementById('quick-length')?.value) || 0.5;
        const difficulty = document.getElementById('quick-difficulty')?.value || 'COMPETITIVE';
        const startingTire = document.getElementById('quick-tire-select')?.value || 'MEDIUM';

        const team = getTeamById(teamId);
        if (!team) {
            Notifications.error('Invalid team');
            return;
        }

        // Auto-assign drivers and staff
        const drivers = getRandomDrivers(2);
        const usedDriverIds = drivers.map(d => d.id);

        const staff = {
            techDirector: getRandomStaff('technicalDirectors'),
            strategist: getRandomStaff('chiefStrategists'),
            pitCrew: getRandomStaff('pitCrews')
        };

        // Build all teams for the race
        const allTeams = TEAMS_DATA.map(t => {
            if (t.id === team.id) {
                return {
                    ...t,
                    isPlayer: true,
                    drivers: drivers,
                    carStats: { ...t.baseCarStats }
                };
            } else {
                const aiDrivers = getRandomDrivers(2, usedDriverIds);
                aiDrivers.forEach(d => usedDriverIds.push(d.id));
                return {
                    ...t,
                    isPlayer: false,
                    drivers: aiDrivers,
                    carStats: { ...t.baseCarStats }
                };
            }
        });

        // Get track
        const track = trackId === 'random' ? getRandomTrack() : getTrackById(trackId);

        // Adjust lap count
        const quickTrack = { ...track, laps: Math.max(5, Math.round(track.laps * lengthMult)) };

        // Set up race state
        StateManager.set('mode', 'QUICK_RACE');
        StateManager.set('race', {
            track: quickTrack,
            allTeams: allTeams,
            playerTeamId: team.id,
            difficulty: difficulty,
            strategy: { startingTire: startingTire, pitStops: 2, aggression: 5 },
            isQuickRace: true
        });

        // Navigate to race
        EventBus.emit('nav:go', { screen: 'race', color: '#00FF41' });
    }

    /**
     * Load game from import string
     */
    function loadGame() {
        Modals.prompt({
            title: 'Load Game',
            body: 'Paste your save code below:',
            placeholder: 'Save code...',
            defaultValue: ''
        }).then(code => {
            if (!code) return;

            const success = SaveSystem.importAll(code);
            if (success) {
                Notifications.success('Save imported successfully');
                setTimeout(() => continueCareer(), 500);
            } else {
                Notifications.error('Invalid save code');
            }
        });
    }

    /**
     * Inject page-specific styles
     */
    function injectStyles() {
        if (document.getElementById('sp-screen-styles')) return;

        const style = document.createElement('style');
        style.id = 'sp-screen-styles';
        style.textContent = `
            .sp-container {
                width: 100%; min-height: 100%;
                padding: var(--space-2xl);
                position: relative;
                background:
                    radial-gradient(circle at 30% 50%, rgba(0, 255, 65, 0.04) 0%, transparent 50%),
                    radial-gradient(circle at 70% 50%, rgba(0, 255, 65, 0.03) 0%, transparent 50%),
                    var(--black);
                display: flex;
                flex-direction: column;
            }
            .sp-header {
                text-align: center;
                margin-bottom: var(--space-3xl);
                margin-top: var(--space-xl);
            }
            .sp-tagline {
                font-family: 'Rajdhani', sans-serif;
                font-size: var(--text-base);
                color: var(--gray-500);
                letter-spacing: 6px;
                text-transform: uppercase;
                margin-top: var(--space-md);
            }
            .sp-modes-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: var(--space-xl);
                max-width: 900px;
                margin: 0 auto;
                width: 100%;
            }
            @media (max-width: 800px) {
                .sp-modes-grid { grid-template-columns: 1fr; }
            }
            .sp-mode-card {
                background: var(--surface-glass);
                border: 1px solid rgba(0, 255, 65, 0.15);
                border-radius: var(--radius-lg);
                padding: var(--space-2xl);
                text-align: center;
                cursor: pointer;
                transition: all var(--transition-base);
                backdrop-filter: blur(10px);
                display: flex;
                flex-direction: column;
            }
            .sp-mode-card:hover:not(.disabled) {
                border-color: var(--green);
                transform: translateY(-6px);
                box-shadow: 0 12px 40px rgba(0, 255, 65, 0.15);
            }
            .sp-mode-card.disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            .sp-mode-icon {
                font-size: 48px;
                margin-bottom: var(--space-md);
            }
            .sp-mode-title {
                font-family: 'Orbitron', sans-serif;
                font-weight: 800;
                font-size: var(--text-xl);
                letter-spacing: 3px;
                margin-bottom: var(--space-md);
                color: var(--white);
            }
            .sp-mode-desc {
                flex: 1;
                font-family: 'Rajdhani', sans-serif;
                color: var(--gray-400);
                font-size: var(--text-sm);
                line-height: 1.5;
                margin-bottom: var(--space-lg);
            }

            /* Premium Hall of Glory Spotlight Card */
            .sp-mode-card.premium-scenario-card {
                grid-column: 1 / -1;
                border: 2px solid rgba(255, 215, 0, 0.4);
                background: linear-gradient(135deg, rgba(255,215,0,0.08), rgba(0,0,0,0.5));
            }
            .sp-mode-card.premium-scenario-card:hover {
                border-color: #FFD700;
                box-shadow: 0 0 35px rgba(255,215,0,0.25);
                transform: translateY(-6px);
            }
            @media (max-width: 800px) {
                .sp-mode-card.premium-scenario-card { grid-column: auto; }
            }

            /* Modal scenario cards */
            .scenario-card {
                transition: all var(--transition-base);
            }
            .scenario-card:hover {
                transform: scale(1.01);
                box-shadow: 0 4px 20px rgba(255,255,255,0.08);
            }
            .sp-footer {
                text-align: center;
                margin-top: auto;
                padding-top: var(--space-xl);
            }
            .sp-hint {
                font-family: 'Rajdhani', sans-serif;
                font-size: var(--text-xs);
                color: var(--gray-600);
                letter-spacing: 2px;
                text-transform: uppercase;
            }
        `;
        document.head.appendChild(style);
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

    return { init, render, showScenariosHub, launchScenario, destroy };
})();