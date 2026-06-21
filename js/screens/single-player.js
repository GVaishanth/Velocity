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
        let hasSave = false;
        let saveData = null;
        try {
            hasSave = typeof SaveSystem !== 'undefined' && SaveSystem.exists && SaveSystem.exists('gamestate');
            saveData = hasSave && SaveSystem.load ? SaveSystem.load('gamestate') : null;
        } catch(e) { console.warn('[SinglePlayer] Save check failed', e); }
        
        // If the save file is actually a multiplayer session (legacy bug), ignore it
        if (saveData && saveData.career?.isMultiplayer) {
            hasSave = false;
            saveData = null;
        }
        if (saveData && !saveData.career && saveData.race?.isLiveRaceState) {
            hasSave = true;
        }

        const saveMeta = hasSave && SaveSystem.getMeta ? SaveSystem.getMeta('gamestate') : null;

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
                            ` : hasSave && saveData?.race?.isLiveRaceState ? `
                                Live Race Recovery<br>
                                <span style="color: var(--gray-500); font-size: 11px">
                                    ${escapeHTML(saveData.race.track?.name || 'Saved Race')} • Lap ${saveData.race.currentLap || 0}/${saveData.race.totalLaps || '?'}<br>
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
            // Runtime isolation: never let an active multiplayer career bleed into Single Player UI/state.
            const activeCareer = StateManager.get('career');
            if (activeCareer?.isMultiplayer) {
                StateManager.saveGame?.(); // saves to mp_gamestate because isMultiplayer=true
                StateManager.set('career', null);
                StateManager.set('race', null);
                StateManager.set('mode', 'MENU');
            }
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

        }
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
        const race = StateManager.get('race');
        if (!career && race?.isLiveRaceState) {
            Notifications.success('Live race recovered', `${race.track?.name || 'Saved Race'} - Lap ${race.currentLap || 0}`);
            StateManager.set('mode', 'LIVE_RACE');
            EventBus.emit('nav:go', { screen: 'race', color: '#00FF41' });
            return;
        }
        if (!career) {
            Notifications.error('No career data found');
            return;
        }

        Notifications.success('Career loaded', `${career.team.name} - Season ${career.season}`);

        if (race?.isLiveRaceState && !race.finished) {
            StateManager.set('mode', 'LIVE_RACE');
            EventBus.emit('nav:go', { screen: 'race', color: '#00FF41' });
        } else {
            StateManager.set('mode', 'CAREER');
            EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' });
        }
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

        // Set up race state through the shared initializer
        if (typeof RaceInitializer === 'undefined') throw new Error('RaceInitializer unavailable: cannot launch Quick Race');
        RaceInitializer.initializeRace({
            mode: 'QUICK_RACE',
            source: 'quick-race',
            track: quickTrack,
            totalLaps: quickTrack.laps,
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

    return { init, render, destroy };
})();
