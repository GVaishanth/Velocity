/* ============================================
   VELOCITY — RACE SCREEN
   Live race controller — wires together
   timing table, track render, player controls
   ============================================ */

window.RaceScreen = (() => {

    let isActive = false;
    let raceInitialized = false;
    let resultsProcessed = false;
    let weatherUpdateInterval = null;
    let registeredSubsystems = [];
    let lastRaceSnapshotSync = 0;

    function init() {
        attachListeners();
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:race:enter', () => {
            isActive = true;
            setupRace();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'race' && isActive) {
                cleanup();
                isActive = false;
            }
        });

        EventBus.on('race:finish', (data) => {
            setTimeout(() => {
                handleRaceComplete(data);
            }, 1500);
        });

        EventBus.on('race:skipped_to_end', (data) => {
            handleRaceComplete({ results: data.results });
        });

        EventBus.on('settings:updated', (settings) => {
            // If a race is running and speed setting changed, apply it
            if (isActive && typeof RaceEngine !== 'undefined' && RaceEngine.getState && RaceEngine.getState()) {
                if (settings.raceSpeed !== undefined) {
                    RaceEngine.setSpeed(settings.raceSpeed);
                }
            }
        });

        // Live HUD display updaters
        EventBus.on('race:new_lap', (data) => {
            const lapDisplay = document.getElementById('current-lap-display');
            if (lapDisplay) lapDisplay.textContent = data.lap;
        });

        EventBus.on('weather:changed', () => {
            if (typeof updateWeatherDisplay === 'function') updateWeatherDisplay();
        });

        EventBus.on('race:safety_car', () => {
            const status = document.getElementById('race-status-display');
            if (status) {
                status.textContent = 'SAFETY CAR';
                status.className = 'race-status sc';
            }
        });

        EventBus.on('race:incident', (event) => {
            const car = RaceEngine.getCar ? RaceEngine.getCar(event.carId) : null;
            if (car && typeof Effects !== 'undefined' && typeof TrackRenderer !== 'undefined') {
                const pos = TrackRenderer.getTrackPosition(car.trackProgress);
                if (event.type === 'crash' || (event.effects && event.effects.dnf)) {
                    Effects.triggerCrash(pos.x, pos.y);
                    // Lock console if player car DNFs
                    if (car.isPlayer && typeof PlayerControls !== 'undefined') {
                        PlayerControls.refresh();
                    }
                } else if (event.message && event.message.includes('lock')) {
                    Effects.triggerSmoke(pos.x, pos.y, 1.5);
                } else if (event.message && event.message.includes('spin')) {
                    Effects.triggerSmoke(pos.x, pos.y, 3.0);
                }
            }
        });

        EventBus.on('race:green_flag', () => {
            const status = document.getElementById('race-status-display');
            if (status) {
                status.textContent = 'RACING';
                status.className = 'race-status green';
            }
        });
    }

    function setupRace() {
        try {
            console.log('[RaceScreen] Setting up race...');
            resultsProcessed = false;
            const raceData = Safe.get(StateManager, 'get') ? StateManager.get('race') : null;
            if (!raceData || !raceData.track || !Array.isArray(raceData.allTeams)) {
                console.error('[RaceScreen] Invalid or missing raceData');
                if (typeof Notifications !== 'undefined') Notifications.error('Race data corrupted', 'Returning to home');
                setTimeout(() => EventBus.emit('nav:home'), 800);
                return;
            }

            // Build the race UI
            buildRaceUI(raceData);

            // Initialize race engine
            const settings = StateManager.get('settings') || {};
            const speed = raceData.speed || settings.raceSpeed || 2;

            if (raceData.isLiveRaceState && Array.isArray(raceData.cars) && typeof RaceEngine.restoreRace === 'function') {
                console.log('[RaceScreen] Restoring authoritative live race state');
                RaceEngine.restoreRace(raceData);
            } else {
                if (typeof RaceInitializer !== 'undefined' && RaceInitializer.validateRaceConfig) {
                    const validation = RaceInitializer.validateRaceConfig(raceData);
                    if (!validation.valid) {
                        console.error('[RaceScreen] Race setup validation failed:', validation.errors, raceData);
                        throw new Error('Invalid race setup: ' + validation.errors.join('; '));
                    }
                }
                RaceEngine.initRace(raceData.track, raceData.allTeams, {
                    difficulty: raceData.difficulty || settings.difficulty || 'COMPETITIVE',
                    speed: speed,
                    playerTeamId: raceData.playerTeamId,
                    strategy: raceData.strategy,
                    grid: raceData.grid || (typeof StateManager !== 'undefined' ? StateManager.get('qualiStartingGrid') : null),
                    weather: raceData.weather,
                    isCareerRace: raceData.isCareerRace,
                    isQuickRace: raceData.isQuickRace,
                    isMultiplayerRace: raceData.isMultiplayerRace,
                });
            }

            // --- CRITICAL CHECK: Ensure engine state exists before proceeding ---
            if (!RaceEngine.getState()) {
                throw new Error('RaceEngine failed to initialize state');
            }
            if (typeof StateManager !== 'undefined' && typeof RaceEngine.getSerializableState === 'function') {
                StateManager.set('race', RaceEngine.getSerializableState());
                StateManager.set('mode', 'LIVE_RACE');
            }

            // Setup rendering
            const trackCanvas = document.getElementById('race-track-canvas');
            if (trackCanvas) {
                AnimationLoop.start(trackCanvas, raceData.track, RaceEngine.getCars());
                AnimationLoop.attachListeners();
            }

            // Initialize UI components
            const timingPanel = document.getElementById('race-timing-panel');
            if (timingPanel) {
                TimingTable.init(timingPanel);
            }

            const bottomBar = document.getElementById('race-bottom-bar');
            if (bottomBar) {
                PlayerControls.init(bottomBar);
            }

            // Register timing table update loop
            if (typeof GameEngine !== 'undefined') {
                const timingSub = {
                    update: () => {
                        if (isActive) {
                            TimingTable.forceUpdate();
                            if (typeof PlayerControls !== 'undefined' && PlayerControls.updateTelemetry) {
                                PlayerControls.updateTelemetry();
                            }

                            // --- LIVE SPONSOR TRACKING ---
                            updateSponsorHUD();

                            // Keep StateManager.race aligned to the authoritative RaceEngine live state for saves/reconnects
                            const now = Date.now();
                            if (now - lastRaceSnapshotSync > 2000 && typeof RaceEngine.getSerializableState === 'function') {
                                StateManager.set('race', RaceEngine.getSerializableState());
                                lastRaceSnapshotSync = now;
                            }
                            
                            // Dynamic Engine Audio Modulation based on player's lead car pace
                            if (typeof AudioManager !== 'undefined') {
                                const pCars = RaceEngine.getPlayerCars ? RaceEngine.getPlayerCars() : [];
                                if (pCars.length > 0) {
                                    // Map driving mode and temp to sound intensity
                                    let intensity = 0.4;
                                    if (pCars[0].drivingMode === 'PUSH') intensity = 0.8;
                                    if (pCars[0].drivingMode === 'CONSERVE') intensity = 0.2;
                                    if (pCars[0].overtakeBoostActive) intensity = 1.0;
                                    AudioManager.modulateEngine(intensity);
                                }
                            }
                        }
                    }
                };
                GameEngine.registerSubsystem(timingSub);
                registeredSubsystems.push(timingSub);
            }

            // Race engine update loop
            if (typeof GameEngine !== 'undefined') {
                const engineSub = {
                    update: (dt) => {
                        if (isActive) RaceEngine.update(dt);
                    }
                };
                GameEngine.registerSubsystem(engineSub);
                registeredSubsystems.push(engineSub);
            }

            raceInitialized = true;

            // Start sequence
            setTimeout(() => {
                startRace();
            }, 300);
        } catch (err) {
            console.error('[RaceScreen] setupRace critical error:', err);
            Notifications.error('Race initialization failed', 'Returning to home screen');
            setTimeout(() => EventBus.emit('nav:home'), 2000);
        }
    }

    function updateSponsorHUD() {
        const career = StateManager.get('career');
        if (!career || !career.activeSponsor) return;

        const statusEl = document.getElementById('sponsor-objective-status');
        if (!statusEl) return;

        const sp = career.activeSponsor;
        const pCars = RaceEngine.getLocalPlayerCars();
        const pRes = [...pCars].sort((a, b) => a.position - b.position);

        let met = false;
        let progressStr = '';

        if (sp.id === 'sp1') { // Double Top-10
            const inPoints = pRes.filter(c => c.position <= 10 && c.status !== 'DNF').length;
            met = inPoints >= 2;
            progressStr = `CARS IN POINTS: ${inPoints}/2`;
        } else if (sp.id === 'sp2') { // Podium
            met = pRes.some(c => c.position <= 3 && c.status !== 'DNF');
            progressStr = met ? 'PODIUM SECURED' : 'CHASING PODIUM';
        } else if (sp.id === 'sp3') { // Fastest Lap
            const state = RaceEngine.getState();
            met = pRes.some(c => c.id === state?.fastestLapDriverId);
            progressStr = met ? 'FASTEST LAP HELD' : 'PURSUING FL';
        } else if (sp.id === 'sp4') { // Double Podium
            const podiums = pRes.filter(c => c.position <= 3 && c.status !== 'DNF').length;
            met = podiums >= 2;
            progressStr = `PODIUMS: ${podiums}/2`;
        }

        statusEl.textContent = progressStr;
        statusEl.style.color = met ? '#00FF41' : '#FFD700';
    }

    function buildRaceUI(raceData) {
        const track = raceData.track;
        const career = StateManager.get('career');
        const roundNum = career?.currentRound + 1;
        const totalRounds = career?.totalRounds;

        const topBar = document.getElementById('race-top-bar');
        if (topBar) {
            topBar.innerHTML = `
                <div class="race-info-left">
                    ${roundNum && totalRounds ? `<div class="race-round">ROUND ${roundNum}/${totalRounds}</div>` : ''}
                    <div class="race-name">${track.flag} ${escapeHTML(track.name)}</div>
                </div>

                <div class="race-info-center">
                    <div class="lap-counter">
                        <span class="current-lap" id="current-lap-display">0</span>
                        <span style="margin: 0 4px;">/</span>
                        <span class="total-laps" id="total-laps-display">${track.laps}</span>
                    </div>
                </div>

                <div class="race-info-right">
                    <div class="weather-indicator" id="weather-display">
                        <span class="weather-icon">☀️</span>
                        <span>22°C</span>
                    </div>
                    <div class="race-status green" id="race-status-display">RACING</div>
                </div>
            `;
        }

        // Build track header
        const trackPanel = document.getElementById('race-track-panel');
        if (trackPanel) {
            let trackHeader = trackPanel.querySelector('.track-header');
            if (!trackHeader) {
                trackHeader = document.createElement('div');
                trackHeader.className = 'track-header';
                trackPanel.insertBefore(trackHeader, trackPanel.firstChild);
            }
            trackHeader.innerHTML = `
                <div class="track-title">${escapeHTML(track.name)}</div>
                <div class="track-length">${track.length} km • ${track.corners} corners</div>
            `;

            const oldRadar = trackPanel.querySelector('#meteorology-radar-hud');
            const oldVsc = trackPanel.querySelector('#vsc-minigame-hud');
            if (oldRadar) oldRadar.remove();
            if (oldVsc) oldVsc.remove();
        }

        // Build Deck Tab 2: Live Doppler Weather Radar (Proposal 4)
        const weatherPane = document.getElementById('deck-pane-weather');
        if (weatherPane) {
            weatherPane.innerHTML = `
                <div class="tactical-weather-interior">
                    <div class="radar-header-bar">
                        <span class="r-title">⚡ ACTIVE DOPPLER SATELLITE RADAR</span>
                        <span style="font-family: Orbitron; font-size: 10px; color: var(--green);">REAL-TIME FEEDS</span>
                    </div>

                    <div class="radar-split-flex">
                        <div class="radar-screen-dock" title="Doppler Subspace Sky Feed">
                            <div class="radar-grid-lines"></div>
                            <div class="radar-sweep-blade"></div>
                            <div class="sky-cloud-blip" id="radar-blip-1" style="top: 30%; left: 20%;"></div>
                            <div class="sky-cloud-blip" id="radar-blip-2" style="top: 75%; right: 25%;"></div>
                        </div>

                        <div class="radar-data-matrix">
                            <div class="radar-data-row">
                                <span>CIRCUIT STANDING WATER:</span>
                                <span class="water-num" id="radar-water-val">0.0%</span>
                            </div>

                            <div class="crossover-deltas-box">
                                <div class="c-delta-item slick active" id="delta-slick">
                                    <span>🔴 SLICKS (Soft/Med/Hard):</span>
                                    <span>0% – 18% Standing Water</span>
                                </div>
                                <div class="c-delta-item inter" id="delta-inter">
                                    <span>🟢 INTERMEDIATES (Inters):</span>
                                    <span>18% – 55% Standing Water</span>
                                </div>
                                <div class="c-delta-item wet" id="delta-wet">
                                    <span>🔵 FULL WETS (Heavy Rain):</span>
                                    <span>> 55% Standing Water</span>
                                </div>
                            </div>

                            <div class="micro-timer-box" id="radar-micro-timer">
                                <div class="timer-head">⏱️ DOPPLER MICRO-TIMER PREDICTION:</div>
                                <div class="timer-val" id="radar-timer-text">No sky shift projected within 5 Laps</div>
                                <div class="apex-val" id="radar-apex-text">Stable Sky Parameter</div>
                            </div>

                            <div class="radar-quick-box" id="radar-quick-call">
                                <button class="btn btn-glow quick-box-btn" id="radar-btn-box-call" style="width: 100%; font-family: Orbitron; font-weight: 900; font-size: 11px; padding: 10px; background: rgba(0,255,65,0.15); border-color: #00FF41; color: #00FF41; cursor: pointer;">
                                    🚀 EXECUTE QUICK PIRELLI BOX CALL
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const boxBtn = weatherPane.querySelector('#radar-btn-box-call');
            boxBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                const weather = typeof RaceEngine?.getWeather === 'function' ? RaceEngine.getWeather() : null;
                if (!weather) return;

                const targetComp = typeof WeatherSystem?.getOptimalCompound === 'function' ? WeatherSystem.getOptimalCompound(weather) : 'INTERMEDIATE';
                const pCars = typeof RaceEngine?.getPlayerCars === 'function' ? RaceEngine.getPlayerCars() : [];
                
                pCars.forEach(c => {
                    if (typeof RaceEngine?.playerPitCall === 'function') {
                        RaceEngine.playerPitCall(c.id, targetComp);
                    } else {
                        c.pitNextLap = true;
                        c.nextCompound = targetComp;
                    }
                });

                if (typeof PlayerControls !== 'undefined') PlayerControls.refresh?.();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                if (typeof Notifications !== 'undefined') {
                    Notifications.success('🚀 PIRELLI Quick CROSSOVER BOX CALLED', `Pitting local Constructor cars next lap for fresh ${targetComp} rubber!`);
                }
            });
        }

        // Build Deck Tab 3: FIA Virtual Safety Car Minigame (Proposal 5)
        const vscPane = document.getElementById('deck-pane-vsc');
        if (vscPane) {
            vscPane.innerHTML = `
                <div class="tactical-vsc-interior">
                    <div class="vsc-header-bar">
                        <span class="v-title">⚠️ ACTIVE FIA VIRTUAL SAFETY CAR (VSC) MINIGAME</span>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-yellow" id="btn-trigger-vsc-start" style="padding: 4px 10px; font-family: Orbitron; font-size: 10px; font-weight: 900; border-radius: 4px; cursor: pointer;" title="Initiate Live VSC Pacing Neutralization">⚠️ INITIATE VSC SPRINT</button>
                            <button class="btn btn-danger" id="btn-trigger-vsc-end" style="padding: 4px 10px; font-family: Orbitron; font-size: 10px; font-weight: 900; border-radius: 4px; cursor: pointer;" title="Conclude VSC Neutralization">🛑 END VSC</button>
                        </div>
                    </div>

                    <p class="vsc-tagline">
                        Mandatory FIA Virtual Safety Car neutralization active. Balance your dual Constructor drivers' pacing slider below to stay perfectly within ±0.05s of the moving graphical FIA target. Flawless maintenance delivers a definitive -2.5s slingshot pace surge out of the neutralization!
                    </p>

                    <div class="vsc-timer-banner">
                        <span>MANDATORY NEUTRALIZATION CONCLUDING IN:</span>
                        <span class="timer-digits" id="vsc-time-digits">15.0s</span>
                    </div>

                    <div class="vsc-arena-box">
                        <div class="arena-background-grid"></div>
                        <div class="fia-target-line" id="vsc-target-line" style="left: 50%;">
                            <span class="t-badge">FIA MANDATORY DELTA</span>
                        </div>
                        <div class="player-pace-bar" id="vsc-player-bar" style="left: 50%;">
                            <span class="p-badge">CONSTRUCTOR PACING</span>
                        </div>
                    </div>

                    <div class="vsc-controller-box">
                        <label class="c-label">DUAL DRIVER PACING SLIDER (0% - 100%)</label>
                        <input type="range" class="vsc-range-slider" id="vsc-range-input" min="0" max="100" value="50">
                    </div>

                    <div class="vsc-charge-box">
                        <div class="charge-label-flex">
                            <span id="vsc-charge-text">⚡ SLINGSHOT SPRINT CHARGE PRIMING:</span>
                            <span class="charge-val" id="vsc-charge-val">0%</span>
                        </div>
                        <div class="vsc-charge-track">
                            <div class="vsc-charge-fill" id="vsc-charge-fill" style="width: 0%;"></div>
                        </div>
                    </div>
                </div>
            `;

            const vscStartBtn = vscPane.querySelector('#btn-trigger-vsc-start');
            const vscEndBtn = vscPane.querySelector('#btn-trigger-vsc-end');

            vscStartBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                VscMinigameManager.start();
            });

            vscEndBtn?.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                VscMinigameManager.end();
            });
        }

        // --- SPONSOR LIVE TRACKING ---
        const tacticalDeck = document.getElementById('race-tactical-deck');
        if (tacticalDeck && career.activeSponsor) {
            let sponsorHud = document.getElementById('sponsor-live-hud');
            if (!sponsorHud) {
                sponsorHud = document.createElement('div');
                sponsorHud.id = 'sponsor-live-hud';
                sponsorHud.style.cssText = 'position: absolute; top: -35px; right: 10px; background: rgba(0,0,0,0.85); border: 1px solid #FFD700; border-radius: 6px; padding: 6px 12px; font-family: Orbitron; font-size: 10px; color: #FFD700; display: flex; align-items: center; gap: 8px; z-index: 100; box-shadow: 0 4px 15px rgba(0,0,0,0.5);';
                tacticalDeck.parentElement.style.position = 'relative'; // Ensure parent is relative
                tacticalDeck.appendChild(sponsorHud);
            }
            sponsorHud.innerHTML = `
                <span style="opacity: 0.7;">🎯 ${career.activeSponsor.name}:</span>
                <span id="sponsor-objective-status" style="font-weight: 900; text-shadow: 0 0 8px #FFD700;">CALCULATING...</span>
            `;
        }

        // Attach Tactical Deck Navigation delegates
        const deckNavBtns = document.querySelectorAll('#race-tactical-deck .deck-tab-btn');
        deckNavBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const targetTab = btn.dataset.deckTab;
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                switchTacticalDeckTab(targetTab);
            });
        });

        // Clear any existing interval, then start a new one
        if (weatherUpdateInterval) {
            clearInterval(weatherUpdateInterval);
        }
        weatherUpdateInterval = setInterval(updateWeatherDisplay, 1000);
    }

    function switchTacticalDeckTab(tabId) {
        const deckNavBtns = document.querySelectorAll('#race-tactical-deck .deck-tab-btn');
        const deckPanes = document.querySelectorAll('#race-tactical-deck .deck-tab-pane');

        deckNavBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.deckTab === tabId);
        });

        deckPanes.forEach(p => {
            p.classList.toggle('active', p.id === `deck-pane-${tabId}`);
        });
    }

    const VscMinigameManager = (() => {
        let isActive = false;
        let vscTimer = 15.0;
        let playerSlider = 50;
        let fiaTarget = 50;
        let slingshotCharge = 0;
        let updateInterval = null;

        function start() {
            if (isActive) return;
            isActive = true;
            vscTimer = 15.0;
            slingshotCharge = 0;

            if (typeof switchTacticalDeckTab === 'function') switchTacticalDeckTab('vsc');

            if (typeof RaceEngine !== 'undefined') RaceEngine.setSpeed?.(0.75);
            if (typeof AudioManager !== 'undefined') AudioManager.uiNotify?.();
            if (typeof Notifications !== 'undefined') {
                Notifications.warning('⚠️ VSC DEPLOYED', 'Balance your dual Constructor drivers pacing slider perfectly within ±0.05s of the moving graphical FIA target!');
            }

            if (updateInterval) clearInterval(updateInterval);
            updateInterval = setInterval(() => {
                if (!isActive) return;
                vscTimer -= 0.05;

                const timeDigits = document.getElementById('vsc-time-digits');
                const targetLine = document.getElementById('vsc-target-line');
                const playerBar = document.getElementById('vsc-player-bar');
                const rangeInput = document.getElementById('vsc-range-input');
                const chargeFill = document.getElementById('vsc-charge-fill');
                const chargeVal = document.getElementById('vsc-charge-val');
                const chargeText = document.getElementById('vsc-charge-text');

                if (vscTimer <= 0) {
                    end();
                    return;
                }

                fiaTarget = 50 + Math.sin(performance.now() * 0.0025) * 35;
                playerSlider = parseFloat(rangeInput?.value || 50);

                const diff = Math.abs(playerSlider - fiaTarget);
                if (diff < 8.0) {
                    slingshotCharge = Math.min(100, slingshotCharge + 0.05 * 14);
                } else if (diff > 22.0) {
                    slingshotCharge = Math.max(0, slingshotCharge - 0.05 * 8);
                }

                if (timeDigits) timeDigits.textContent = `${Math.max(0, vscTimer).toFixed(1)}s`;
                if (targetLine) targetLine.style.left = `${fiaTarget}%`;
                if (playerBar) playerBar.style.left = `${playerSlider}%`;
                if (chargeFill) chargeFill.style.width = `${slingshotCharge}%`;
                if (chargeVal) chargeVal.textContent = `${Math.round(slingshotCharge)}%`;

                if (chargeFill && chargeText) {
                    if (slingshotCharge >= 80) {
                        chargeFill.style.background = 'linear-gradient(90deg, #00FF41, #FFD700)';
                        chargeFill.style.boxShadow = '0 0 25px #00FF41';
                        chargeText.textContent = '⚡ SLINGSHOT SPRINT CHARGE PRIMED:';
                        chargeText.style.color = '#00FF41';
                    } else {
                        chargeFill.style.background = 'linear-gradient(90deg, #0080FF, #00FF41)';
                        chargeFill.style.boxShadow = '0 0 20px #00FF41';
                        chargeText.textContent = '⚡ SLINGSHOT SPRINT CHARGE PRIMING:';
                        chargeText.style.color = 'var(--gray-400)';
                    }
                }
            }, 50);
        }

        function end() {
            if (!isActive) return;
            isActive = false;
            if (updateInterval) clearInterval(updateInterval);
            updateInterval = null;

            if (typeof switchTacticalDeckTab === 'function') switchTacticalDeckTab('radio');

            if (typeof RaceEngine !== 'undefined') RaceEngine.setSpeed?.(2);
            if (typeof AudioManager !== 'undefined') AudioManager.raceGo?.();

            if (slingshotCharge >= 65) {
                const pCars = typeof RaceEngine?.getPlayerCars === 'function' ? RaceEngine.getPlayerCars() : [];
                pCars.forEach(car => {
                    car.pendingTimePenalty = Math.min(0, (car.pendingTimePenalty || 0) - 2.5);
                    car.overtakeBoostsRemaining = Math.min(3, (car.overtakeBoostsRemaining || 0) + 1);
                });
                if (typeof Notifications !== 'undefined') {
                    Notifications.success('🚀 VSC SLINGSHOT SPRINT SURGE Executed!', 'Flawless mandatory FIA time delta maintenance delivers a definitive -2.5s slingshot pace surge and a bonus Overtake ERS charge out of the neutralization!');
                }
            } else {
                if (typeof Notifications !== 'undefined') {
                    Notifications.info('🟢 VSC NEUTRALIZATION ENDED', 'Green flag green flag! Standard racing resumed.');
                }
            }
        }

        return { start, end };
    })();

    function updateWeatherDisplay() {
        const weatherEl = document.getElementById('weather-display');
        if (!weatherEl) return;

        const weather = RaceEngine.getWeather();
        if (!weather) return;

        const info = WeatherSystem.getDisplayInfo(weather);
        weatherEl.innerHTML = `
            <span class="weather-icon">${info.icon}</span>
            <span>AIR: ${info.airTemp.toFixed(1)}°C</span>
            <span style="margin: 0 5px; opacity: 0.3;">|</span>
            <span>TRACK: ${info.trackTemp.toFixed(1)}°C</span>
        `;

        // Update Live Meteorology Radar HUD if present (Proposal 4)
        const waterVal = document.getElementById('radar-water-val');
        if (waterVal) waterVal.textContent = `${(info.wetness || 0).toFixed(1)}%`;

        const dSlick = document.getElementById('delta-slick');
        const dInter = document.getElementById('delta-inter');
        const dWet = document.getElementById('delta-wet');

        if (dSlick && dInter && dWet) {
            dSlick.className = 'c-delta-item slick';
            dInter.className = 'c-delta-item inter';
            dWet.className = 'c-delta-item wet';

            if ((info.wetness || 0) < 18) dSlick.classList.add('active');
            else if ((info.wetness || 0) <= 55) dInter.classList.add('active');
            else dWet.classList.add('active');
        }

        // Doppler Sky Precise Micro-Timer Prediction
        const timerText = document.getElementById('radar-timer-text');
        const apexText = document.getElementById('radar-apex-text');
        const nextCell = weather.scheduledChanges?.find(c => !c.triggered) || null;

        const pCars = typeof RaceEngine.getPlayerCars === 'function' ? RaceEngine.getPlayerCars() : [];
        const pCar = pCars[0] || (typeof RaceEngine.getCars === 'function' ? RaceEngine.getCars()[0] : null);

        if (timerText && apexText) {
            if (nextCell && pCar) {
                const currProg = (pCar.lapCount || 0) + (pCar.trackProgress || 0);
                const lapsAway = Math.max(0.01, nextCell.lap - currProg);

                if (lapsAway <= 5.0) {
                    const toInfo = WeatherSystem.WEATHER_STATES?.[nextCell.to] || { name: 'Sky Cell' };
                    timerText.textContent = `⚠️ Incoming ${toInfo.name}: exactly in ${lapsAway.toFixed(2)} Laps`;
                    timerText.style.color = '#FFD700';

                    const trackObj = StateManager.get('race')?.track || { corners: 18 };
                    const strikingProg = ((pCar.trackProgress || 0) + lapsAway % 1.0) % 1.0;
                    const strikingCorner = Math.floor(strikingProg * (trackObj.corners || 18)) + 1;
                    apexText.textContent = `Predicted Impact Apex: exactly at Turn ${strikingCorner} Apex`;
                    apexText.style.color = '#00FF41';
                } else {
                    timerText.textContent = `Stable sky projected (> 5 Laps remaining)`;
                    timerText.style.color = '#FFFFFF';
                    apexText.textContent = `Doppler radar tracking clear`;
                    apexText.style.color = 'var(--gray-500)';
                }
            } else {
                timerText.textContent = `Sky parameters stable for remaining distance`;
                timerText.style.color = '#FFFFFF';
                apexText.textContent = `Optimal crossover tracking active`;
                apexText.style.color = '#00FF41';
            }
        }

        // Dynamic cloud blip Doppler movement
        const blip1 = document.getElementById('radar-blip-1');
        const blip2 = document.getElementById('radar-blip-2');
        if (blip1 && blip2) {
            const phase1 = (performance.now() * 0.001) % 1.0;
            const phase2 = (performance.now() * 0.0008 + 0.5) % 1.0;
            blip1.style.top = `${25 + phase1 * 55}%`;
            blip1.style.left = `${20 + phase1 * 60}%`;
            blip2.style.top = `${75 - phase2 * 55}%`;
            blip2.style.right = `${25 + phase2 * 60}%`;
        }
    }

    function startRace() {
        if (typeof TimingTable !== 'undefined') TimingTable.forceUpdate();
        if (typeof PlayerControls !== 'undefined') PlayerControls.refresh();

        console.log('[RaceScreen] Initiating start sequence...');

        let started = false;
        const forceStart = () => {
            if (started) return;
            started = true;
            console.log('[RaceScreen] Executing RaceEngine.start()');
            if (typeof RaceEngine !== 'undefined') RaceEngine.start();
        };

        const restoredLiveRace = !!RaceEngine.getState()?.isLiveRaceState && (RaceEngine.getState()?.elapsedTime || 0) > 0;
        if (restoredLiveRace) {
            forceStart();
        } else if (typeof Transitions !== 'undefined' && Transitions.raceLightSequence) {
            // Give sequence 15s to finish, otherwise force start
            const safetyTimeout = setTimeout(forceStart, 15000);
            
            Transitions.raceLightSequence(() => {
                clearTimeout(safetyTimeout);
                forceStart();
            });
        } else {
            forceStart();
        }
    }

    function handleRaceComplete(data) {
        if (!data || !data.results || resultsProcessed) return;
        resultsProcessed = true;

        try {
            const career = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
            if (career && StateManager.get('race')?.isCareerRace) {
                try { recordRaceForCareer(data.results); } catch(err) { console.error('[RaceScreen] recordRaceForCareer error:', err); }
            }

            try { updatePlayerStats(data.results); } catch(err) { console.error('[RaceScreen] updatePlayerStats error:', err); }

            if (typeof StateManager?.set === 'function') StateManager.set('raceResults', data.results);
        } catch (err) {
            console.error('[RaceScreen] Indestructible handleRaceComplete error:', err);
            if (typeof StateManager?.set === 'function') StateManager.set('raceResults', data.results || []);
        }

        setTimeout(() => {
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'results', color: '#FFD700' });
        }, 500);
    }

    function recordRaceForCareer(results) {
        const career = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
        if (!career || !Array.isArray(results)) return;

        // --- BUG FIX: Check if this specific round has already been recorded ---
        const currentRoundNum = (career.currentRound || 0) + 1;
        if (!career.raceHistory) career.raceHistory = [];
        
        // --- MULTIPLAYER: Use Host-provided results if available to prevent desync ---
        const race = StateManager.get('race');
        if (race && race.isMultiplayerRace && !OnlineManager.isHost()) {
            console.log('[RaceScreen] Multiplayer Client: Using Host-authoritative results.');
        }

        if (career.raceHistory.some(h => h.round === currentRoundNum)) {
            console.warn(`[RaceScreen] Round ${currentRoundNum} already recorded in history. Blocking duplicate increment.`);
            return;
        }

        const playerResults = results.filter(r => r && r.team && r.team.id === career.team?.id);
        const bestPlayer = [...playerResults].sort((a, b) => (a?.position || 99) - (b?.position || 99))[0];

        career.raceHistory.push({
            trackId: career.schedule?.[career.currentRound || 0],
            round: currentRoundNum,
            playerBestPosition: bestPlayer?.position || 99,
            playerPoints: playerResults.reduce((sum, r) => sum + (r?.points || 0), 0),
            fullResults: results // Store full results for history dropdown
        });

        results.forEach(r => {
            if (!r || !r.driver || !r.team) return;

            const driverStanding = career.championship?.driverStandings?.find(d => d.driverId === r.driver.id);
            if (driverStanding) {
                driverStanding.points += (r.points || 0) + (r.fastestLapBonus || 0);
                if (r.position === 1) driverStanding.wins = (driverStanding.wins || 0) + 1;
                if (r.position <= 3) driverStanding.podiums = (driverStanding.podiums || 0) + 1;
                if (r.position < (driverStanding.bestFinish || 99)) driverStanding.bestFinish = r.position;
            }

            const teamStanding = career.championship?.constructorStandings?.find(c => c.teamId === r.team.id);
            if (teamStanding) {
                teamStanding.points += (r.points || 0) + (r.fastestLapBonus || 0);
                if (r.position === 1) teamStanding.wins = (teamStanding.wins || 0) + 1;
                if (r.position <= 3) teamStanding.podiums = (teamStanding.podiums || 0) + 1;
            }
        });

        const playerPoints = playerResults.reduce((sum, r) => sum + (r?.points || 0) + (r?.fastestLapBonus || 0), 0);
        career.rdPoints = (career.rdPoints || 0) + 100 + (playerPoints * 10);
        career.budget = Math.max(0, (career.budget || 0) + 500000 + (playerPoints * 100000));

        if (career.activeSponsor) {
            const sp = career.activeSponsor;
            let goalMet = false;

            const pRes = [...playerResults].sort((a, b) => (a?.position || 99) - (b?.position || 99));
            if (sp.id === 'sp1') { goalMet = pRes.length >= 2 && pRes[0]?.position <= 10 && pRes[1]?.position <= 10; }
            else if (sp.id === 'sp2') { goalMet = pRes.some(x => x?.position <= 3); }
            else if (sp.id === 'sp3') { goalMet = pRes.some(x => x?.fastestLapBonus > 0 || x?.fastestLap); }
            else if (sp.id === 'sp4') { goalMet = pRes.length >= 2 && pRes[0]?.position <= 3 && pRes[1]?.position <= 3; }

            if (goalMet) {
                career.budget += sp.payout || 2500000;
                career._lastSponsorOutcome = { met: true, name: sp.name, amount: sp.payout };
            } else {
                career.budget = Math.max(0, career.budget - (sp.fine || 1000000));
                career._lastSponsorOutcome = { met: false, name: sp.name, amount: sp.fine };
            }
        }

        // career.currentRound = (career.currentRound || 0) + 1; // REMOVED: Now handled by ResultsScreen continue button
        StateManager.set('career', career);
        StateManager.saveGame?.();
    }

    function updatePlayerStats(results) {
        const profile = StateManager.get('profile');
        const race = StateManager.get('race');
        if (!race || !profile) return;

        const playerResults = results.filter(r => r.team.id === race.playerTeamId);
        if (playerResults.length === 0) return;

        profile.totalRaces = (profile.totalRaces || 0) + 1;
        playerResults.forEach(r => {
            if (r.position === 1) profile.totalWins = (profile.totalWins || 0) + 1;
            if (r.position <= 3) profile.totalPodiums = (profile.totalPodiums || 0) + 1;
            if (r.fastestLap) profile.totalFastestLaps = (profile.totalFastestLaps || 0) + 1;
        });

        // XP gain (safer formula)
        const xpGain = playerResults.reduce((sum, r) => sum + (10 * Math.max(1, 21 - r.position)), 0);
        profile.xp = (profile.xp || 0) + xpGain;

        // Check achievements safely
        const eventData = {
            win: playerResults.some(r => r.position === 1),
            podium: playerResults.some(r => r.position <= 3),
            fastestLap: playerResults.some(r => r.fastestLap),
            points: playerResults.reduce((sum, r) => sum + r.points, 0)
        };

        if (typeof checkAllAchievements === 'function') {
            try {
                const newAchievements = checkAllAchievements(profile, eventData);
                newAchievements.forEach(a => {
                    if (typeof unlockAchievement === 'function') {
                        unlockAchievement(profile, a.id);
                    }
                });
            } catch (e) {
                console.warn('[RaceScreen] Achievement check failed:', e);
            }
        }

        if (typeof calculateLevel === 'function') {
            try {
                profile.level = calculateLevel(profile.xp);
            } catch (e) {
                console.warn('[RaceScreen] Level calculation failed:', e);
            }
        }

        StateManager.set('profile', profile);
        StateManager.saveProfile();
    }

    function cleanup() {
        // Clear weather update interval
        if (weatherUpdateInterval) {
            clearInterval(weatherUpdateInterval);
            weatherUpdateInterval = null;
        }

        // Unregister all subsystems we added
        if (typeof GameEngine !== 'undefined') {
            registeredSubsystems.forEach(sub => {
                try {
                    GameEngine.unregisterSubsystem(sub);
                } catch (e) {
                    console.warn('[RaceScreen] Failed to unregister subsystem:', e);
                }
            });
        }
        registeredSubsystems = [];

        if (typeof RaceEngine !== 'undefined' && typeof RaceEngine.getSerializableState === 'function' && RaceEngine.getState()) {
            try { StateManager.set('race', RaceEngine.getSerializableState()); } catch(e) {}
        }
        if (typeof RaceEngine !== 'undefined') RaceEngine.destroy();
        if (typeof AnimationLoop !== 'undefined') AnimationLoop.stop();
        if (typeof TimingTable !== 'undefined') TimingTable.destroy();
        if (typeof PlayerControls !== 'undefined') PlayerControls.destroy();
        raceInitialized = false;
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function destroy() {
        cleanup();
        isActive = false;
    }

    return { init, startRace, destroy };
})();