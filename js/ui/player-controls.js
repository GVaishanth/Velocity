/* ============================================
   VELOCITY — PLAYER CONTROLS (HIGH PERFORMANCE & ICONIC)
   Cockpit Bottom Bar — Features Dual Driver Cards (35% each)
   with precise live DOM updates to eliminate button recreation glitches
   ============================================ */

const PlayerControls = (() => {

    let container = null;
    let isInitialized = false;
    let boundClickListener = null;
    let eventSubscriptions = [];

    /**
     * Initialize player controls in a container
     */
    function init(containerElement) {
        if (isInitialized) destroy(); // Pristine cleanup
        container = containerElement;
        if (!container) return;

        render();
        attachListeners();
        isInitialized = true;
    }

    /**
     * Build the root controls UI (Matches User's exact 10% bottom blueprint)
     */
    function render() {
        if (!container) return;

        container.innerHTML = `
            <!-- Block 1: Playback Controls (Moved Left down to 20%) -->
            <div class="playback-controls" style="flex: 0 0 20%; max-width: 20%; height: 100%; display: flex; align-items: center; justify-content: flex-start; background: #0a0a0a; border-right: 1px solid var(--border-subtle); padding: 0 12px; gap: 6px;">
                <button class="playback-btn" id="btn-pause" title="Pause/Resume (Space)" style="width: 44px; height: 44px; font-size: 20px; cursor: pointer;">
                    <span id="pause-icon">⏸</span>
                </button>
                <button class="playback-btn" id="btn-speed-down" title="Slower (↓)" style="width: 40px; height: 40px; font-size: 16px; cursor: pointer;">⏪</button>
                <span class="speed-indicator" id="speed-display" style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: var(--green); min-width: 55px; text-align: center;">2X</span>
                <button class="playback-btn" id="btn-speed-up" title="Faster (↑)" style="width: 40px; height: 40px; font-size: 16px; cursor: pointer;">⏩</button>
                <button class="playback-btn" id="btn-skip" title="Skip to End (Enter)" style="width: 40px; height: 40px; font-size: 16px; cursor: pointer;">⏭</button>
            </div>

            <!-- Blocks 2 & 3: Drivers Wrapper (Expanded up to 80%) -->
            <div id="driver-cockpit-cards" style="flex: 0 0 80%; max-width: 80%; height: 100%; display: flex; align-items: center; justify-content: flex-start; padding: 0 20px; gap: 24px; background: #050505;">
                <!-- Filled dynamically -->
            </div>
        `;

        renderDriverControls();
    }

    /**
     * Render the driver control cards for player's drivers (Called on lap complete)
     */
    function renderDriverControls() {
        const cockpitEl = container?.querySelector('#driver-cockpit-cards');
        if (!cockpitEl) return;

        if (typeof RaceEngine === 'undefined') return;
        const playerCars = RaceEngine.getLocalPlayerCars ? RaceEngine.getLocalPlayerCars() : [];
        if (playerCars.length === 0) {
            cockpitEl.innerHTML = '<div style="color: var(--gray-500); font-family: Orbitron;">No local constructor cars found</div>';
            return;
        }

        const html = playerCars.map(car => buildDriverControlHTML(car)).join('');
        cockpitEl.innerHTML = html;
    }

    /**
     * Build HTML for one driver cockpit card (Exactly 35% of bottom bar space)
     */
    function buildDriverControlHTML(car) {
        try {
            if (!car || !car.driver) return '';
            const mode = car.drivingMode || 'STANDARD';
            const boostsLeft = car.overtakeBoostsRemaining !== undefined ? car.overtakeBoostsRemaining : 3;
            const isPitting = car.isPittingNow;
            const isDoubleStacking = car.pitPhase === 'stack_waiting';
            const pitsUsed = car.pitStopCount || 0;

            let pitBtnText = isDoubleStacking ? 'STACKING...' : isPitting ? 'PITTING...' : 'PIT NOW';
            let pitBtnClass = isDoubleStacking ? 'btn-yellow' : isPitting ? 'pitting' : '';

            // Initial Telemetry calculations
            const risk = Math.min(100, Math.round(car.boostRiskPercent || 0));
            const regen = Math.min(100, Math.round(car.boostRegenProgress || 0));
            const riskColor = risk > 70 ? '#FF0033' : risk > 40 ? '#FFD700' : '#00FF41';

            const dName = car.driver.name ? escapeHTML(car.driver.name) : 'RACER';

            return `
                <div class="driver-control-cockpit" data-car-id="${car.id}" style="flex: 1; max-width: 48%; height: 90%; background: #111111; border: 1px solid #2a2a2a; border-radius: var(--radius-md); padding: 6px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.8);">
                    <!-- Col 1: Driver Name & Position -->
                    <div style="display: flex; flex-direction: column; min-width: 90px;">
                        <span style="font-family: Orbitron; font-weight: 900; font-size: 14px; color: var(--white); text-transform: uppercase;">${dName}</span>
                        <span style="font-family: Orbitron; font-weight: 900; font-size: 20px; color: var(--green); margin-top: 2px;">P${car.position || 0}</span>
                        <span style="font-family: Rajdhani; font-size: 11px; color: var(--gray-400); margin-top: 2px;">Pits: ${pitsUsed}</span>
                    </div>

                    <!-- Col 2: High-Contrast Premium ERS Mode Toggles -->
                    <div class="mode-selector" style="display: flex; gap: 4px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0;">
                        <button class="mode-btn" data-mode="PUSH" data-car-id="${car.id}" ${isPitting ? 'disabled' : ''} style="padding: 8px 12px; font-family: Orbitron; font-size: 11px; font-weight: 900; border-radius: 4px; border: 1px solid ${mode === 'PUSH' ? '#FF0033' : '#333'}; background: ${mode === 'PUSH' ? '#FF0033' : '#1a1a1a'}; color: ${mode === 'PUSH' ? '#FFFFFF' : '#888'}; cursor: pointer; transition: all 0.2s ease;">PUSH</button>
                        <button class="mode-btn" data-mode="STANDARD" data-car-id="${car.id}" ${isPitting ? 'disabled' : ''} style="padding: 8px 12px; font-family: Orbitron; font-size: 11px; font-weight: 900; border-radius: 4px; border: 1px solid ${mode === 'STANDARD' ? '#FFFFFF' : '#333'}; background: ${mode === 'STANDARD' ? '#FFFFFF' : '#1a1a1a'}; color: ${mode === 'STANDARD' ? '#000000' : '#888'}; cursor: pointer; transition: all 0.2s ease;">STD</button>
                        <button class="mode-btn" data-mode="CONSERVE" data-car-id="${car.id}" ${isPitting ? 'disabled' : ''} style="padding: 8px 12px; font-family: Orbitron; font-size: 11px; font-weight: 900; border-radius: 4px; border: 1px solid ${mode === 'CONSERVE' ? '#00FF41' : '#333'}; background: ${mode === 'CONSERVE' ? '#00FF41' : '#1a1a1a'}; color: ${mode === 'CONSERVE' ? '#000000' : '#888'}; cursor: pointer; transition: all 0.2s ease;">SAVE</button>
                    </div>

                    <!-- Col 3: Strategy Action Buttons -->
                    <div style="display: flex; gap: 8px; align-items: center; flex-shrink: 0;">
                        <button class="pit-btn" data-action="pit" data-car-id="${car.id}" ${isPitting ? 'disabled' : ''} style="padding: 8px 14px; font-family: Orbitron; font-size: 11px; font-weight: 900; width: 85px; text-align: center; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; border: 1px solid ${isDoubleStacking ? '#FFD700' : isPitting ? '#FF0033' : '#FF0033'}; background: ${isDoubleStacking ? '#FFD700' : isPitting ? '#FF0033' : 'rgba(255,0,51,0.15)'}; color: ${isDoubleStacking ? '#000' : isPitting ? '#FFF' : '#FF0033'};">
                            ${pitBtnText}
                        </button>

                        <button class="boost-btn" data-action="boost" data-car-id="${car.id}" ${boostsLeft === 0 || isPitting || car.overtakeBoostActive ? 'disabled' : ''} style="padding: 8px 14px; font-family: Orbitron; font-size: 11px; font-weight: 900; background: ${car.overtakeBoostActive ? 'rgba(255,215,0,0.2)' : '#1a1a1a'}; border: 1px solid #FFD700; color: #FFD700; border-radius: 6px; width: 95px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
                            🚀 BOOST (${boostsLeft}/3)
                        </button>
                    </div>

                    <!-- Col 4: Live Sub-millisecond DOM Embedded Gauges -->
                    <div style="display: flex; flex-direction: column; gap: 4px; width: 110px; background: rgba(0,0,0,0.6); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); flex-shrink: 0;">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <div style="display: flex; justify-content: space-between; font-size: 9px; font-family: Orbitron; font-weight: 900; color: ${riskColor};" id="risk-txt-${car.id}">
                                <span>RISK</span><span>${risk}%</span>
                            </div>
                            <div style="width: 100%; height: 5px; background: var(--gray-800); border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: ${risk}%; background-color: ${riskColor}; transition: width 0.1s linear;" id="risk-bar-${car.id}"></div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 2px;">
                            <div style="display: flex; justify-content: space-between; font-size: 9px; font-family: Orbitron; font-weight: 900; color: #FFD700;" id="regen-txt-${car.id}">
                                <span>ERS</span><span>${regen}%</span>
                            </div>
                            <div style="width: 100%; height: 5px; background: var(--gray-800); border-radius: 2px; overflow: hidden;">
                                <div style="height: 100%; width: ${regen}%; background: linear-gradient(90deg, #BB9900, #FFD700); transition: width 0.1s linear;" id="regen-bar-${car.id}"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (err) {
            console.warn('[PlayerControls] Build driver card error:', err);
            return '';
        }
    }

    /**
     * High-Performance Live DOM Telemetry Update (Runs at 60fps without rebuilding buttons)
     */
    function updateTelemetry() {
        if (!isInitialized || typeof RaceEngine === 'undefined') return;
        const playerCars = RaceEngine.getLocalPlayerCars ? RaceEngine.getLocalPlayerCars() : [];

        playerCars.forEach(car => {
            const risk = Math.min(100, Math.round(car.boostRiskPercent || 0));
            const regen = Math.min(100, Math.round(car.boostRegenProgress || 0));
            const riskColor = risk > 70 ? '#FF0033' : risk > 40 ? '#FFD700' : '#00FF41';

            // Direct DOM updates
            const riskBar = document.getElementById(`risk-bar-${car.id}`);
            const riskTxt = document.getElementById(`risk-txt-${car.id}`);
            if (riskBar) {
                riskBar.style.width = `${risk}%`;
                riskBar.style.backgroundColor = riskColor;
            }
            if (riskTxt) {
                riskTxt.style.color = riskColor;
                riskTxt.innerHTML = `<span>RISK</span><span>${risk}%</span>`;
            }

            const regenBar = document.getElementById(`regen-bar-${car.id}`);
            const regenTxt = document.getElementById(`regen-txt-${car.id}`);
            if (regenBar) {
                regenBar.style.width = `${regen}%`;
            }
            if (regenTxt) {
                regenTxt.innerHTML = `<span>ERS</span><span>${regen}%</span>`;
            }
        });
    }

    /**
     * Attach event listeners
     */
    function attachListeners() {
        if (!container) return;

        // Playback controls
        container.querySelector('#btn-pause')?.addEventListener('click', () => {
            if (typeof RaceEngine !== 'undefined') RaceEngine.togglePause();
            updatePauseIcon();
        });

        container.querySelector('#btn-speed-up')?.addEventListener('click', () => {
            speedUp();
        });

        container.querySelector('#btn-speed-down')?.addEventListener('click', () => {
            speedDown();
        });

        container.querySelector('#btn-skip')?.addEventListener('click', () => {
            confirmSkip();
        });

        // Driver controls (delegated with explicit cleanup reference)
        boundClickListener = (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const carId = target.dataset.carId;
            const mode = target.dataset.mode;
            const action = target.dataset.action;

            if (typeof RaceEngine === 'undefined') return;

            if (mode && carId) {
                RaceEngine.setDriverMode(carId, mode);
                renderDriverControls();
                if (typeof EventBus !== 'undefined') EventBus.emit('ui:click');
                if (typeof OnlineManager !== 'undefined' && OnlineManager.sendLiveAction) OnlineManager.sendLiveAction({ type: 'MODE', carId, mode });
            } else if (action === 'pit' && carId) {
                RaceEngine.playerPitCall(carId);
                renderDriverControls();
                if (typeof EventBus !== 'undefined') EventBus.emit('ui:click');
                if (typeof OnlineManager !== 'undefined' && OnlineManager.sendLiveAction) OnlineManager.sendLiveAction({ type: 'PIT', carId });
            } else if (action === 'boost' && carId) {
                const used = RaceEngine.activateOvertakeBoost(carId);
                if (used) {
                    renderDriverControls();
                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('ui:notify', {
                            message: 'Overtake boost activated! ERS Mistake Risk increased.',
                            type: 'success'
                        });
                    }
                    if (typeof OnlineManager !== 'undefined' && OnlineManager.sendLiveAction) OnlineManager.sendLiveAction({ type: 'BOOST', carId });
                } else {
                    if (typeof EventBus !== 'undefined') EventBus.emit('ui:error');
                }
            }
        };
        container.addEventListener('click', boundClickListener);

        // Keyboard shortcuts and EventBus bindings
        if (typeof EventBus === 'undefined') return;

        const subs = [
            EventBus.on('race:toggle_pause', () => {
                if (typeof RaceEngine !== 'undefined') RaceEngine.togglePause();
                updatePauseIcon();
            }),
            EventBus.on('race:speed_up', speedUp),
            EventBus.on('race:speed_down', speedDown),
            EventBus.on('race:skip', () => {
                confirmSkip();
            }),
            EventBus.on('race:driver_mode', (data) => {
                if (typeof RaceEngine === 'undefined') return;
                const playerCars = RaceEngine.getLocalPlayerCars ? RaceEngine.getLocalPlayerCars() : [];
                const car = playerCars[data.driver];
                if (car) {
                    RaceEngine.setDriverMode(car.id, data.mode);
                    renderDriverControls();
                }
            }),
            EventBus.on('race:pit_call', (data) => {
                if (typeof RaceEngine === 'undefined') return;
                const playerCars = RaceEngine.getLocalPlayerCars ? RaceEngine.getLocalPlayerCars() : [];
                const car = playerCars[data.driver];
                if (car) {
                    RaceEngine.playerPitCall(car.id);
                    renderDriverControls();
                }
            }),
            EventBus.on('race:speed_change', (data) => {
                updateSpeedDisplay(data.speed);
            }),
            EventBus.on('race:pause', () => updatePauseIcon()),
            EventBus.on('race:resume', () => updatePauseIcon()),
            EventBus.on('race:lap_complete', () => {
                renderDriverControls();
            }),
            EventBus.on('race:radio', (data) => {
                addRadioMessage(data);
            }),
            EventBus.on('race:pit_stop', (event) => {
                if (typeof RaceEngine === 'undefined') return;
                const car = RaceEngine.getCar ? RaceEngine.getCar(event.carId) : null;
                if (car && (car.isLocalPlayer || car.isPlayer)) {
                    addRadioMessage({
                        text: `${event.driver} pits for ${event.compound}`,
                        priority: 'info'
                    });
                }
            }),
            EventBus.on('weather:changed', (event) => {
                if (typeof WeatherSystem === 'undefined') return;
                const fromWeather = WeatherSystem.WEATHER_STATES?.[event.from];
                const toWeather = WeatherSystem.WEATHER_STATES?.[event.to];
                addRadioMessage({
                    text: `Weather: ${fromWeather?.name} → ${toWeather?.name}`,
                    priority: 'warning'
                });
            }),
            EventBus.on('race:driver_pit_request', (data) => {
                if (typeof EventBus !== 'undefined') {
                    EventBus.emit('ui:notify', {
                        message: `📻 ${data.car?.driver?.name}: ${data.reason}`,
                        type: 'warning',
                        duration: 4000
                    });
                }
            }),
            EventBus.on('race:boost_activated', (data) => {
                renderDriverControls();
            })
        ];

        eventSubscriptions = subs;
    }

    /**
     * Speed control cycle
     */
    const SPEED_LEVELS = [1, 2, 5, 10, 30];

    function speedUp() {
        if (typeof RaceEngine === 'undefined') return;
        const current = RaceEngine.getSpeed();
        const idx = SPEED_LEVELS.indexOf(current);
        const next = SPEED_LEVELS[Math.min(idx + 1, SPEED_LEVELS.length - 1)];
        RaceEngine.setSpeed(next);
        updateSpeedDisplay(next);
    }

    function speedDown() {
        if (typeof RaceEngine === 'undefined') return;
        const current = RaceEngine.getSpeed();
        const idx = SPEED_LEVELS.indexOf(current);
        const next = SPEED_LEVELS[Math.max(idx - 1, 0)];
        RaceEngine.setSpeed(next);
        updateSpeedDisplay(next);
    }

    function updateSpeedDisplay(speed) {
        const display = container?.querySelector('#speed-display');
        if (display) display.textContent = `${speed}X`;
    }

    /**
     * Update pause icon
     */
    function updatePauseIcon() {
        const icon = container?.querySelector('#pause-icon');
        if (!icon || typeof RaceEngine === 'undefined') return;
        icon.textContent = RaceEngine.isCurrentlyPaused() ? '▶' : '⏸';
    }

    /**
     * Confirm skip to end with modal
     */
    function confirmSkip() {
        if (typeof Modals !== 'undefined') {
            Modals.confirm({
                title: 'Skip to End?',
                body: 'This will instantly simulate the rest of the race. Continue?',
                confirmText: 'Skip Race',
                onConfirm: () => {
                    if (typeof RaceEngine !== 'undefined') RaceEngine.skipToEnd();
                }
            });
        } else {
            if (confirm('Skip to end of race?')) {
                if (typeof RaceEngine !== 'undefined') RaceEngine.skipToEnd();
            }
        }
    }

    /**
     * Add an iconic radio message directly to the new remote #race-radio-panel!
     */
    function addRadioMessage(data) {
        const messagesEl = document.getElementById('radio-messages');
        if (!messagesEl) return;

        const isStaff = data.isStaff || data.text?.startsWith('Engineer:') || data.text?.startsWith('Strategist:') || data.text?.startsWith('Team Boss:') || data.text?.startsWith('Pit Crew:') || data.text?.startsWith('Team Principal:') || data.text?.startsWith('Meteorologist:') || data.text?.startsWith('Pit Crew Boss:');
        const textLower = (data.text || '').toLowerCase();
        const isCrash = data.priority === 'critical' || data.isCrash || textLower.includes('🚨') || textLower.includes('dnf') || data.category === 'crash' || textLower.includes('destroyed') || textLower.includes('exploded') || textLower.includes('wall') || textLower.includes('f***') || textLower.includes('***k');

        let bubbleCol = isStaff ? '#00FF41' : '#0080FF';
        let bubbleBg = isStaff ? 'rgba(0,255,65,0.08)' : 'rgba(0,128,255,0.08)';
        if (isCrash) {
            bubbleCol = '#FF003C';
            bubbleBg = 'rgba(255, 0, 60, 0.2)';
        }

        const alignment = isStaff ? 'flex-end' : 'flex-start';
        const radiusRule = isStaff ? '12px 12px 2px 12px' : '12px 12px 12px 2px';

        const msg = document.createElement('div');
        msg.className = `radio-message ${data.priority || 'info'}`;
        msg.style.cssText = `
            align-self: ${alignment};
            background: ${bubbleBg};
            border: ${isCrash ? '2px solid #FF003C' : '1px solid ' + bubbleCol + '44'};
            border-left: ${isCrash ? '4px solid #FF003C' : (!isStaff ? '3px solid ' + bubbleCol : '1px solid ' + bubbleCol + '44')};
            border-right: ${isCrash ? '1px solid #FF003C' : (isStaff ? '3px solid ' + bubbleCol : '1px solid ' + bubbleCol + '44')};
            border-radius: ${radiusRule};
            padding: 8px 14px;
            max-width: 85%;
            font-family: Rajdhani;
            font-size: 14px;
            font-weight: 700;
            color: var(--white);
            margin-bottom: 6px;
            box-shadow: ${isCrash ? '0 0 12px rgba(255,0,60,0.6)' : '0 2px 10px rgba(0,0,0,0.5)'};
        `;
        msg.innerHTML = escapeHTML(data.text);

        messagesEl.appendChild(msg);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        while (messagesEl.children.length > 30) {
            messagesEl.removeChild(messagesEl.firstChild);
        }

        // Lively staff automated chat response if incoming from driver
        if (!isStaff && (data.driver || data.text?.includes(':')) && !data._hasReplied && Math.random() < 0.8) {
            data._hasReplied = true;
            setTimeout(() => {
                let replies = [
                    "Engineer: Understood. All internal power unit parameters are rock solid.",
                    "Strategist: Copy that. We are sticking exactly to Plan A target deltas.",
                    "Engineer: Telemetry looks remarkably clean across all channels. Beautiful consistent rhythm.",
                    "Engineer: Copy. Wind direction has shifted slightly at Turn 1 apex, watch entry stability.",
                    "Strategist: We are fully projected for a massive points haul. Maintain your exact lap delta."
                ];

                if (isCrash) {
                    replies = [
                        "Engineer: Are you okay? Switch off the car. Please confirm you are okay on radio.",
                        "Team Principal: Are you alright? We see the extreme G-load on telemetry. Deploying medical vehicle.",
                        "Engineer: Copy that, severe impact detected. Switch off MGU-K and MGU-H. Medical car is on the way.",
                        "Strategist: Absolute heartbreak, mate. Main priority is your physical safety. Pit crew standing down.",
                        "Engineer: Yellow flags active. Double yellow. Medical team is dispatched. Just catch your breath."
                    ];
                } else if (data.category === 'tire_cliff' || data.category === 'tire_wearing' || textLower.includes('tire') || textLower.includes('box') || textLower.includes('rubber') || textLower.includes('graining')) {
                    replies = [
                        "Engineer: Copy that. We confirm rear carcass degradation on telemetry. Box box, box this lap.",
                        "Strategist: Understood. Pit box is fully primed. Box this lap for fresh Medium rubber. Confirming wing adjust.",
                        "Pit Crew Boss: Standby, fresh Soft compounds and spare front wing ready on the blankets. Drive straight in.",
                        "Strategist: Copy. We are executing Plan B undercut now. Push on your in-lap, box box.",
                        "Engineer: Telemetry confirms surface rubber scrubbed. Box confirm, box now."
                    ];
                } else if (data.category === 'gap_closing' || textLower.includes('catching') || textLower.includes('striking') || textLower.includes('drs') || textLower.includes('move') || textLower.includes('past')) {
                    replies = [
                        "Engineer: Mode Push. You have ERS Overtake Boost available, deploy on the exit of Turn 2.",
                        "Strategist: Rival ahead is suffering from severe rear brake clipping. Capitalize in the DRS zone!",
                        "Engineer: Copy. You are 0.4s up on his micro-sectors right now, Strat 5. Let's get this done.",
                        "Team Principal: Brilliant racecraft out there! Slicing through the field like an absolute champion.",
                        "Engineer: Target acquired. Battery state of charge is 85%, Mode Overtake is fully operational."
                    ];
                } else if (data.category === 'weather_rain' || data.category === 'weather_dry' || textLower.includes('wet') || textLower.includes('rain') || textLower.includes('drying') || textLower.includes('inters')) {
                    replies = [
                        "Meteorologist: Radar shows a heavy Class 4 rain cell moving exactly over Sector 2. Be ready for Inters.",
                        "Strategist: Copy. Sector 1 is losing surface temperature rapidly. Intermediate rubber is warmed.",
                        "Engineer: Track thermals dropping fast. Shift your brake bias rearward by 1% for stability.",
                        "Strategist: Most of the grid is staying out one more lap. Let's box right now and master the crossover!",
                        "Engineer: Understood. Inter linkage confirmed on telemetry. Dash delta target updated."
                    ];
                } else if (data.category === 'mistake' || textLower.includes('locked') || textLower.includes('mistake') || textLower.includes('wide') || textLower.includes('moment')) {
                    replies = [
                        "Engineer: Copy that, reset your rhythm and go again. Aerodynamic floor sensors show zero stall.",
                        "Team Principal: Keep your head down! Still plenty of laps remaining to recover the lost delta.",
                        "Engineer: Front left brake thermals spiked slightly but normalising now. Focus on your mid-corner speed.",
                        "Strategist: All good, we only dropped 0.8s to our rival undercut window. Fully manageable.",
                        "Engineer: Understood. Let the surface carcass cool for two corners before hitting Mode Push again."
                    ];
                } else if (data.category === 'good_lap' || data.category === 'push_mode' || data.category === 'overtake_made' || textLower.includes('personal best') || textLower.includes('great')) {
                    replies = [
                        "Engineer: That was a phenomenal sector! You are absolutely lighting up the intermediate sheets.",
                        "Team Principal: Mega driving! Absolute world class pace. Keep pulling away!",
                        "Strategist: Pace delta is absolutely lethal right now. We are putting 0.5s a lap on the entire midfield.",
                        "Engineer: P1 absolute fastest micro-sectors! Powertrain synchronization is performing flawlessly.",
                        "Engineer: Gorgeous job. Fuel consumption target is exactly on Plan A, keep running in clean air."
                    ];
                }

                const replyText = replies[Math.floor(Math.random() * replies.length)];
                addRadioMessage({
                    text: replyText,
                    priority: isCrash ? 'warning' : 'positive',
                    isStaff: true
                });
            }, 1500 + Math.random() * 1500);
        }

        setTimeout(() => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        }, 45000);
    }

    /**
     * Force refresh controls exactly once
     */
    function refresh() {
        if (!isInitialized) return;
        renderDriverControls();
        updatePauseIcon();
        if (typeof RaceEngine !== 'undefined') updateSpeedDisplay(RaceEngine.getSpeed());
    }

    function escapeHTML(str) {
        if (!str) return '';
        return str.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }

    /**
     * Destroy and pristine cleanup
     */
    function destroy() {
        if (container && boundClickListener) {
            container.removeEventListener('click', boundClickListener);
            boundClickListener = null;
        }
        eventSubscriptions.forEach(unsub => {
            if (typeof unsub === 'function') unsub();
        });
        eventSubscriptions = [];

        if (container) container.innerHTML = '';
        container = null;
        isInitialized = false;
    }

    return {
        init,
        refresh,
        updateTelemetry,
        destroy
    };
})();