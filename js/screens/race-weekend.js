/* ============================================
   VELOCITY — AUTHENTIC F1 RACE WEEKEND SCREEN mode
   Implements Track Intro → Practice (FP1, FP2) →
   3-Round Knockout Qualifying (Q1, Q2, Q3) → Strategy
   ============================================ */

const RaceWeekendScreen = (() => {

    let container = null;
    let isActive = false;
    let currentStage = 'intro'; // 'intro' | 'practice' | 'qualifying' | 'strategy'

    let strategy = {
        startingTire: 'MEDIUM',
        pitStops: 2,
        aggression: 5,
        fuelLoad: 'medium'
    };

    // Free Practice Live State
    let practiceState = {
        session: 'FP1',    // 'FP1' | 'FP2' | 'DONE'
        progress: 0,       // 0 to 15 seconds
        isRunning: false,
        interval: null,
        standings: [],
        crashedInSession: false
    };

    // 3-Round Qualifying Knockout State
    let qualiState = {
        session: 'Q1',     // 'Q1' | 'Q2' | 'Q3' | 'DONE'
        q1Results: [],
        q2Results: [],
        q3Results: [],
        finalGrid: [],     // Combined 24-car definitive starting matrix
        crashedInSession: false
    };

    function init() {
        container = document.getElementById('race-weekend-content');
        if (!container) return;
        attachListeners();
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:race-weekend:enter', () => {
            isActive = true;
            currentStage = 'intro';
            if (typeof StateManager !== 'undefined') {
                const career = StateManager.get('career');
                if (career) {
                    initPracticeState(career);
                    initQualiState(career);
                }
            }
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'race-weekend') {
                isActive = false;
                if (practiceState.interval) clearInterval(practiceState.interval);
            }
        });
    }

    function render() {
        if (!container) return;

        const career = StateManager.get('career');
        if (!career) {
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:home');
            return;
        }

        const trackId = career?.schedule?.[career?.currentRound || 0];
        const track = (typeof getTrackById === 'function' && trackId ? getTrackById(trackId) : null) || (typeof TRACKS_DATA !== 'undefined' && TRACKS_DATA?.[0] ? TRACKS_DATA[0] : { id: 't1', name: 'Grand Prix Circuit', country: 'Germany', flag: '🇩🇪', length: 4.5, laps: 57, corners: 14, drsZones: 2, type: 'RACE', tireDegradation: 5, overtakingDifficulty: 5, rainProbability: 10, svgPath: 'M 100 100 L 600 100 L 600 500 L 100 500 Z' });

        switch (currentStage) {
            case 'intro':
                renderIntroView(track, career);
                break;
            case 'practice':
                renderPracticeView(track, career);
                break;
            case 'qualifying':
                renderQualifyingView(track, career);
                break;
            case 'strategy':
                renderStrategyView(track, career);
                break;
        }

        injectWeekendStyles();
    }

    function renderIntroView(track, career) {
        container.innerHTML = `
            <div class="rw-container">
                <button class="home-btn" id="rw-home-btn" style="z-index: 50;">⌂</button>

                <div class="rw-stage-header">
                    <div class="rw-stage-label">GRAND PRIX WEEKEND • Intro</div>
                    <div class="rw-stage-title">ROUND ${career.currentRound + 1} OF ${career.totalRounds}</div>
                </div>

                <div class="rw-track-intro">
                    <div class="rw-track-flag">${track.flag}</div>
                    <h1 class="rw-track-name">${escapeHTML(track.name)}</h1>
                    <div class="rw-track-location">${escapeHTML(track.country)}${track.city ? ' • ' + escapeHTML(track.city) : ''}</div>

                    <div class="rw-track-svg">
                        <svg viewBox="0 0 700 600" preserveAspectRatio="xMidYMid meet">
                            <path d="${track.svgPath}"
                                fill="none" stroke="rgba(0,255,65,0.2)"
                                stroke-width="14" stroke-linejoin="round" stroke-linecap="round"/>
                            <path d="${track.svgPath}"
                                fill="none" stroke="#00FF41"
                                stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
                        </svg>
                    </div>

                    <div class="rw-track-info-grid">
                        <div class="rw-info-card">
                            <div class="rw-info-label">LENGTH</div>
                            <div class="rw-info-value">${track.length} km</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">LAPS</div>
                            <div class="rw-info-value">${track.laps}</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">CORNERS</div>
                            <div class="rw-info-value">${track.corners}</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">DRS ZONES</div>
                            <div class="rw-info-value">${track.drsZones}</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">TYPE</div>
                            <div class="rw-info-value" style="font-size: 12px;">${track.type?.replace('_', ' ') || 'RACE'}</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">TIRE WEAR</div>
                            <div class="rw-info-value">${track.tireDegradation || 5}/10</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">OVERTAKING</div>
                            <div class="rw-info-value">${11 - (track.overtakingDifficulty || 5)}/10</div>
                        </div>
                        <div class="rw-info-card">
                            <div class="rw-info-label">RAIN PROB</div>
                            <div class="rw-info-value">${track.rainProbability || 10}%</div>
                        </div>
                    </div>

                    <p class="rw-track-desc">${escapeHTML(track.description)}</p>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; gap: var(--space-md);">
                    <button class="btn" id="rw-back">← BACK TO DASHBOARD</button>
                    <button class="btn btn-yellow" id="rw-skip-quali" style="padding: 16px 24px; font-family: Orbitron; font-weight: 900;">⚡ SKIP TO QUALIFIERS</button>
                    <button class="btn btn-primary btn-large" id="rw-start-fp" style="padding: 16px 32px; font-family: Orbitron; font-weight: 900;">
                        FP1 & FP2 PRACTICE →
                    </button>
                </div>
            </div>
        `;

        container.querySelector('#rw-home-btn')?.addEventListener('click', () => EventBus.emit('nav:home'));
        container.querySelector('#rw-back')?.addEventListener('click', () => EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' }));
        container.querySelector('#rw-skip-quali')?.addEventListener('click', () => {
            currentStage = 'qualifying';
            initQualiState(career);
            render();
        });
        container.querySelector('#rw-start-fp')?.addEventListener('click', () => {
            currentStage = 'practice';
            initPracticeState(career);
            render();
        });
    }

    /* ===== FREE PRACTICE 1 & 2 (15s each, Medium rubber by default, 1% crash risk) ===== */

    function initPracticeState(career) {
        practiceState = {
            session: 'FP1',
            progress: 0,
            isRunning: false,
            interval: null,
            standings: generateInitialStandings(career),
            crashedInSession: false
        };
    }

    function generateInitialStandings(career) {
        let allCars = [];
        career.allTeams?.forEach(t => {
            t.drivers?.forEach(d => {
                allCars.push({
                    driver: d,
                    team: t,
                    isPlayer: t.id === career.team?.id,
                    bestTime: null,
                    laps: 0
                });
            });
        });
        return allCars.sort(() => Math.random() - 0.5);
    }

    function renderPracticeView(track, career) {
        container.innerHTML = `
            <div class="rw-container">
                <button class="home-btn" id="rw-home-btn" style="z-index: 50;">⌂</button>

                <div class="rw-stage-header">
                    <div class="rw-stage-label">FREE PRACTICE • Medium Compound Default</div>
                    <div class="rw-stage-title" style="color: ${practiceState.session === 'FP1' ? 'var(--blue)' : 'var(--yellow)'};">${practiceState.session} PRACTICE SESSION</div>
                </div>

                <div class="create-room-panel" style="max-width: 900px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-family: Orbitron; font-weight: 900;">
                        <span style="font-size: 18px; color: var(--white);">SESSION TIMER (${15 - practiceState.progress}s REMAINING)</span>
                        <span class="badge" style="background: var(--surface-2); color: #FFD700; font-size: 14px; padding: 6px 12px;">🛞 MEDIUM TIRES INSTALLED</span>
                    </div>

                    <!-- 15-SECOND LIVE SESSION PROGRESS BAR -->
                    <div style="width: 100%; height: 20px; background: var(--gray-800); border-radius: 10px; overflow: hidden; border: 2px solid var(--border-subtle); margin-bottom: 24px;">
                        <div style="height: 100%; width: ${(practiceState.progress / 15) * 100}%; background: ${practiceState.session === 'FP1' ? 'var(--blue)' : 'var(--yellow)'}; transition: width 1s linear;"></div>
                    </div>

                    <!-- PRACTICE LEADERBOARD -->
                    <div class="panel-title" style="color: var(--green);">⏱️ LIVE SESSION TIMES</div>
                    <div style="display: flex; flex-direction: column; gap: 4px; max-height: 280px; overflow-y: auto; padding-right: 6px;">
                        ${practiceState.standings.map((c, idx) => `
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 14px; background: ${c.isPlayer ? 'rgba(0,255,65,0.1)' : 'var(--surface-1)'}; border: 1px solid ${c.isPlayer ? 'var(--green)' : 'var(--border-subtle)'}; border-radius: 6px; font-family: Rajdhani; font-size: 14px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="font-family: Orbitron; font-weight: 900; width: 25px; color: var(--green);">P${idx + 1}</span>
                                    <span style="color: white; font-weight: 700;">${escapeHTML(c.driver.name)}</span>
                                    <span style="color: var(--gray-400); font-size: 12px;">(${escapeHTML(c.team.name)})</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 24px; font-family: Orbitron; font-weight: 700;">
                                    <span style="color: var(--gray-300); font-size: 12px;">${c.laps} Laps</span>
                                    <span style="color: ${c.bestTime ? '#00FF41' : '#888'}; min-width: 90px; text-align: right;">${c.bestTime ? formatLapTime(c.bestTime) : 'OUT LAP'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- SESSION CONTROLS -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 32px;">
                        <button class="btn" id="fp-back">← ABORT TO DASHBOARD</button>
                        <button class="btn btn-yellow" id="fp-skip-all" style="padding: 16px 24px; font-family: Orbitron; font-weight: 900;">⚡ SKIP DIRECTLY TO QUALIFYING</button>
                        <button class="btn ${practiceState.isRunning ? 'btn-danger' : 'btn-glow'}" id="fp-action-btn" style="padding: 16px 32px; font-family: Orbitron; font-weight: 900; font-size: 16px;">
                            ${practiceState.progress >= 15 ? (practiceState.session === 'FP1' ? '🏁 PROCEED TO FP2 SESSION' : '🏁 PROCEED TO QUALIFIERS') : practiceState.isRunning ? '⏳ SIMULATING 15s SESSION...' : `⚡ LAUNCH ${practiceState.session} SESSION (15s)`}
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#rw-home-btn')?.addEventListener('click', () => EventBus.emit('nav:home'));
        container.querySelector('#fp-back')?.addEventListener('click', () => {
            clearInterval(practiceState.interval);
            EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' });
        });
        container.querySelector('#fp-skip-all')?.addEventListener('click', () => {
            clearInterval(practiceState.interval);
            currentStage = 'qualifying';
            initQualiState(career);
            render();
        });
        container.querySelector('#fp-action-btn')?.addEventListener('click', () => {
            if (practiceState.progress >= 15) {
                if (practiceState.session === 'FP1') {
                    practiceState.session = 'FP2';
                    practiceState.progress = 0;
                    practiceState.standings.forEach(s => { s.bestTime = null; s.laps = 0; });
                    render();
                } else {
                    currentStage = 'qualifying';
                    initQualiState(career);
                    render();
                }
            } else if (!practiceState.isRunning) {
                startPracticeTimer(track, career);
            }
        });
    }

    function startPracticeTimer(track, career) {
        if (typeof AudioManager !== 'undefined') AudioManager.engineRev();
        practiceState.isRunning = true;
        render();

        practiceState.interval = setInterval(() => {
            practiceState.progress++;

            // Update times
            practiceState.standings.forEach(c => {
                c.laps++;
                // 1% Crash Test Execution per weekend session!
                if (c.isPlayer && !practiceState.crashedInSession && Math.random() < 0.01) {
                    practiceState.crashedInSession = true;
                    clearInterval(practiceState.interval);
                    practiceState.isRunning = false;
                    executeCrashAndRepair(c.driver, career, () => {
                        render();
                    });
                    return;
                }

                // Simulate realistic practice time on Medium Default rubber
                const basePace = track?.baseLapTime || 90;
                const score = (c.driver.stats?.pace || 75) * 0.6 + (c.team.baseCarStats?.aerodynamics || 75) * 0.4;
                const lapTime = basePace - ((score - 70) * 0.15) + (Math.random() - 0.5) * 0.8;
                if (!c.bestTime || lapTime < c.bestTime) c.bestTime = lapTime;
            });

            // Sort leaderboard
            practiceState.standings.sort((a, b) => (a.bestTime || 999) - (b.bestTime || 999));

            if (practiceState.progress >= 15) {
                clearInterval(practiceState.interval);
                practiceState.isRunning = false;
                Notifications.success(`${practiceState.session} Session Complete!`, 'Excellent telemetry gathered.');
            }
            render();
        }, 1000);
    }

    function executeCrashAndRepair(driver, career, onDone) {
        if (typeof AudioManager !== 'undefined') AudioManager.uiNotify();
        const repairCost = Math.round(250000 + Math.random() * 550000); // Cost to repair car
        career.budget = Math.max(0, (career.budget || 0) - repairCost);
        StateManager.set('career', career);

        if (typeof Modals !== 'undefined') {
            Modals.open({
                title: '💥 CRITICAL INCIDENT IN SESSION',
                body: `
                    <div style="text-align: center; padding: 16px; max-width: 520px; margin: 0 auto;">
                        <div style="font-size: 64px; margin-bottom: 16px;">🏎️💥💥... 🚧</div>
                        <h3 style="font-family: Orbitron; font-size: 20px; color: var(--red); margin-bottom: 12px;">
                            ${escapeHTML(driver.name)} lost control and crashed into the barriers!
                        </h3>
                        <p style="font-family: Rajdhani; font-size: 15px; color: var(--gray-300); line-height: 1.6; margin-bottom: 16px;">
                            Sarcastic Engineer: "Wow, magnificent line through that corner. E.g., really tested the structural integrity of our carbon chassis. Don't worry, the driver is perfectly fine... but we had to completely rebuild the suspension and front wing."
                        </p>
                        <div style="padding: 12px; background: rgba(255,215,0,0.1); border: 1px solid var(--yellow); border-radius: 8px; color: var(--yellow); font-family: Orbitron; font-size: 14px; font-weight: 900;">
                            🛠️ INSTANT REPAIR BILL: $${formatMoney(repairCost)} PAID. CAR fully REBUILT FOR RACING!
                        </div>
                    </div>
                `,
                actions: [
                    { label: 'Ouch... Understood, Let\'s Keep Going 🏎️', type: 'primary', onClick: () => { if(onDone) onDone(); } }
                ]
            });
        } else {
            Notifications.warning('Driver Crashed!', `Car repaired for $${formatMoney(repairCost)}.`);
            if(onDone) onDone();
        }
    }

    /* ===== 3-ROUND KNOCKOUT QUALIFYING (Q1, Q2, Q3) ===== */

    function initQualiState(career) {
        let allCars = [];
        career.allTeams?.forEach(t => {
            t.drivers?.forEach(d => {
                allCars.push({
                    driver: d,
                    team: t,
                    isPlayer: t.id === career.team?.id,
                    q1Time: null,
                    q2Time: null,
                    q3Time: null,
                    finalGridPos: 0
                });
            });
        });

        qualiState = {
            session: 'Q1',
            q1Results: allCars,
            q2Results: [],
            q3Results: [],
            finalGrid: [],
            crashedInSession: false
        };
    }

    function renderQualifyingView(track, career) {
        container.innerHTML = `
            <div class="rw-container" style="max-width: 1500px; margin: 0 auto; padding: 24px;">
                <button class="home-btn" id="rw-home-btn" style="z-index: 50;">⌂</button>

                <!-- TOP STAGING BANNER -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: radial-gradient(circle at center, #112211, #050505); border: 2px solid var(--green); border-radius: var(--radius-lg); padding: 20px 32px; box-shadow: 0 0 30px rgba(0,255,65,0.2); margin-bottom: 24px;">
                    <div>
                        <div style="font-family: Orbitron; font-size: 13px; font-weight: 900; color: var(--green); letter-spacing: 4px;">🏎️ ESCALATION PROTOCOL ACTIVE</div>
                        <div style="font-family: Orbitron; font-size: 32px; font-weight: 900; color: white; margin-top: 4px; text-transform: uppercase;">KNOCKOUT QUALIFYING • ${qualiState.session}</div>
                    </div>
                    <div style="display: flex; gap: 20px; text-align: center; align-items: center;">
                        <div style="background: rgba(0,0,0,0.6); border: 1px solid var(--border-medium); padding: 10px 20px; border-radius: var(--radius-md);">
                            <span style="font-family: Rajdhani; font-size: 11px; color: var(--gray-400); text-transform: uppercase; letter-spacing: 2px;">Target Q1 / Q2 Cutoff</span>
                            <div style="font-family: Orbitron; font-size: 18px; font-weight: 900; color: var(--yellow); margin-top: 2px;">${qualiState.session === 'Q1' ? '1:34.250' : qualiState.session === 'Q2' ? '1:32.800' : 'POLE SHOOTOUT'}</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.6); border: 1px solid var(--border-medium); padding: 10px 20px; border-radius: var(--radius-md);">
                            <span style="font-family: Rajdhani; font-size: 11px; color: var(--gray-400); text-transform: uppercase; letter-spacing: 2px;">Asphalt Grip State</span>
                            <div style="font-family: Orbitron; font-size: 18px; font-weight: 900; color: var(--blue); margin-top: 2px;">${qualiState.session === 'Q3' ? '108% PEAK RUBBER' : qualiState.session === 'Q2' ? '104% RUBBERED' : 'GREEN TRACK'}</div>
                        </div>
                    </div>
                </div>

                <!-- MAIN QUALIFYING brACKETS (3 DEDICATED COLUMNS SIDE-BY-SIDE!) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; width: 100%;">
                    <!-- COL 1: Q1 -->
                    <div class="quali-bracket-panel" style="background: var(--surface-1); border: 1px solid ${qualiState.session === 'Q1' ? 'var(--green)' : 'var(--border-subtle)'}; border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; opacity: ${qualiState.session === 'Q1' ? '1.0' : '0.7'}; box-shadow: ${qualiState.session === 'Q1' ? '0 0 25px rgba(0,255,65,0.15)' : 'none'};">
                        <div class="panel-title" style="color: var(--green); justify-content: space-between; font-size: 14px;">
                            <span>⚡ Q1 BRACKET (24 CARS)</span>
                            <span class="badge" style="font-size: 8px;">TOP 15 ADVANCE</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                            ${renderSpecificBracketHTML('Q1')}
                        </div>
                    </div>

                    <!-- COL 2: Q2 -->
                    <div class="quali-bracket-panel" style="background: var(--surface-1); border: 1px solid ${qualiState.session === 'Q2' ? 'var(--yellow)' : 'var(--border-subtle)'}; border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; opacity: ${qualiState.session === 'Q2' ? '1.0' : '0.7'}; box-shadow: ${qualiState.session === 'Q2' ? '0 0 25px rgba(255,215,0,0.15)' : 'none'};">
                        <div class="panel-title" style="color: var(--yellow); justify-content: space-between; font-size: 14px;">
                            <span>⚡ Q2 BRACKET (15 CARS)</span>
                            <span class="badge badge-yellow" style="font-size: 8px;">TOP 10 ADVANCE</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                            ${renderSpecificBracketHTML('Q2')}
                        </div>
                    </div>

                    <!-- COL 3: Q3 -->
                    <div class="quali-bracket-panel" style="background: var(--surface-1); border: 1px solid ${qualiState.session === 'Q3' || qualiState.session === 'DONE' ? 'var(--blue)' : 'var(--border-subtle)'}; border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; opacity: ${qualiState.session === 'Q3' || qualiState.session === 'DONE' ? '1.0' : '0.7'}; box-shadow: ${qualiState.session === 'Q3' || qualiState.session === 'DONE' ? '0 0 25px rgba(0,128,255,0.15)' : 'none'};">
                        <div class="panel-title" style="color: var(--blue); justify-content: space-between; font-size: 14px;">
                            <span>🏆 Q3 POLE SHOOTOUT (10 CARS)</span>
                            <span class="badge badge-blue" style="font-size: 8px;">DEFINITIVE POLE</span>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; max-height: 400px; overflow-y: auto; padding-right: 4px;">
                            ${renderSpecificBracketHTML('Q3')}
                        </div>
                    </div>
                </div>

                <!-- BOTTOM CONTROLS & TIRE WARMERS -->
                <div style="display: flex; justify-content: space-between; align-items: center; background: var(--surface-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 20px 32px; margin-top: 24px; box-shadow: 0 0 20px rgba(0,0,0,0.8);">
                    <div>
                        <div style="font-family: Orbitron; font-weight: 900; font-size: 15px; color: white;">⚠️ 1% CATASTROPHIC INCIDENT RISK ACTIVE PER TURN</div>
                        <div style="font-family: Rajdhani; font-size: 13px; color: var(--gray-400); margin-top: 2px;">Crashes instantly trigger engineer repair invoices to rebuild the chassis for the Grand Prix.</div>
                    </div>
                    <div style="display: flex; gap: var(--space-lg); align-items: center;">
                        <button class="btn" id="q-back">← ABORT TO DASHBOARD</button>
                        <button class="btn btn-yellow btn-large" id="q-execute-btn" style="padding: 18px 42px; font-family: Orbitron; font-weight: 900; font-size: 16px; box-shadow: 0 0 30px rgba(255,215,0,0.3); cursor: pointer;">
                            ${getQualiButtonLabel()}
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.querySelector('#rw-home-btn')?.addEventListener('click', () => EventBus.emit('nav:home'));
        container.querySelector('#q-back')?.addEventListener('click', () => EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' }));
        container.querySelector('#q-execute-btn')?.addEventListener('click', () => {
            executeQualiTurn(track, career);
        });
    }

    function getQualiButtonLabel() {
        if (qualiState.session === 'Q1') return '⚡ EXECUTE Q1 SHOOTOUT (24 CARS)';
        if (qualiState.session === 'Q2') return '⚡ EXECUTE Q2 SHOOTOUT (TOP 15)';
        if (qualiState.session === 'Q3') return '🏆 EXECUTE Q3 POLE SHOOTOUT';
        return '🏁 PROCEED DEFINITIVELY TO RACE STRATEGY';
    }

    function renderSpecificBracketHTML(bracketType) {
        let cars = [];
        let elimIndex = 99;
        
        if (bracketType === 'Q1') {
            cars = [...qualiState.q1Results];
            elimIndex = 15;
        } else if (bracketType === 'Q2') {
            cars = [...qualiState.q2Results];
            elimIndex = 10;
        } else if (bracketType === 'Q3') {
            cars = qualiState.session === 'DONE' ? [...qualiState.finalGrid].slice(0, 10) : [...qualiState.q3Results];
            elimIndex = 99; // No one eliminated in Q3 Pole Shootout
        }

        if (cars.length === 0) {
            return `<div style="color: var(--gray-500); font-style: italic; text-align: center; padding: 24px 0;">Awaiting shootout execution...</div>`;
        }

        return cars.map((c, idx) => {
            const isEliminated = idx >= elimIndex;
            const isPlayer = c.isPlayer;
            const isPole = bracketType === 'Q3' && idx === 0 && c.q3Time;
            const bg = isEliminated ? 'rgba(255,0,51,0.08)' : isPole ? 'rgba(255,215,0,0.15)' : isPlayer ? 'rgba(0,255,65,0.12)' : 'var(--surface-1)';
            const border = isEliminated ? '1px solid var(--red)' : isPole ? '2px solid var(--yellow)' : isPlayer ? '1px solid var(--green)' : '1px solid var(--border-subtle)';
            const timeVal = bracketType === 'Q3' ? c.q3Time : bracketType === 'Q2' ? c.q2Time : c.q1Time;
            const timeStr = timeVal ? formatLapTime(timeVal) : 'NO TIME';
            const posCol = isEliminated ? 'var(--red)' : isPole ? 'var(--yellow)' : 'var(--green)';

            return `
                <div class="quali-bracket-row" style="display: flex; align-items: center; justify-content: space-between; padding: 6px 12px; background: ${bg}; border: ${border}; border-radius: var(--radius-sm); font-family: Rajdhani; font-size: 13px; margin-bottom: 4px;">
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
                        <span style="font-family: Orbitron; font-weight: 900; font-size: 13px; width: 28px; color: ${posCol};">P${idx + 1}</span>
                        <span style="color: white; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(c.driver?.name || 'Driver')}</span>
                        <span style="color: var(--gray-400); font-size: 11px;">(${escapeHTML(c.team?.shortName || c.team?.name?.substring(0,3) || 'CON')})</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px; font-family: Orbitron; font-weight: 700; flex-shrink: 0;">
                        ${isPole ? '<span class="badge badge-yellow" style="font-size:8px; padding:2px 4px;">👑 POLE</span>' : isEliminated ? '<span class="badge badge-red" style="font-size:8px; padding:2px 4px;">ELIM</span>' : '<span class="badge badge-green" style="font-size:8px; padding:2px 4px;">SAFE</span>'}
                        <span style="color: ${timeStr === 'NO TIME' ? '#888' : '#FFF'}; font-size: 13px; min-width: 70px; text-align: right;">${timeStr}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function executeQualiTurn(track, career) {
        if (typeof AudioManager !== 'undefined') AudioManager.engineRev();

        if (qualiState.session === 'Q1') {
            // Run Q1 for 24 cars
            qualiState.q1Results.forEach(c => {
                // 1% Crash Test in Quali!
                if (c.isPlayer && !qualiState.crashedInSession && Math.random() < 0.01) {
                    qualiState.crashedInSession = true;
                    c.q1Time = (track?.baseLapTime || 90) + 15; // Slow crash time
                    executeCrashAndRepair(c.driver, career, null);
                    return;
                }
                c.q1Time = simulateQualiPace(c, track);
            });

            qualiState.q1Results.sort((a, b) => (a.q1Time || 999) - (b.q1Time || 999));
            // Setup Q2 top 15
            qualiState.q2Results = qualiState.q1Results.slice(0, 15);
            qualiState.session = 'Q2';

        } else if (qualiState.session === 'Q2') {
            // Run Q2 for Top 15
            qualiState.q2Results.forEach(c => {
                if (c.isPlayer && !qualiState.crashedInSession && Math.random() < 0.01) {
                    qualiState.crashedInSession = true;
                    c.q2Time = (track?.baseLapTime || 90) + 15;
                    executeCrashAndRepair(c.driver, career, null);
                    return;
                }
                c.q2Time = simulateQualiPace(c, track) - 0.3; // Track rubbers in
            });

            qualiState.q2Results.sort((a, b) => (a.q2Time || 999) - (b.q2Time || 999));
            qualiState.q3Results = qualiState.q2Results.slice(0, 10);
            qualiState.session = 'Q3';

        } else if (qualiState.session === 'Q3') {
            // Run Q3 for Top 10 Shootout
            qualiState.q3Results.forEach(c => {
                if (c.isPlayer && !qualiState.crashedInSession && Math.random() < 0.01) {
                    qualiState.crashedInSession = true;
                    c.q3Time = (track?.baseLapTime || 90) + 15;
                    executeCrashAndRepair(c.driver, career, null);
                    return;
                }
                c.q3Time = simulateQualiPace(c, track) - 0.6; // Ultimate Soft rubber pole lap
            });

            qualiState.q3Results.sort((a, b) => (a.q3Time || 999) - (b.q3Time || 999));
            
            // Build Definitive finalGrid: Top 10 + Q2 Eliminated (11-15) + Q1 Eliminated (16-24)
            const q2Elim = qualiState.q2Results.slice(10);
            const q1Elim = qualiState.q1Results.slice(15);
            qualiState.finalGrid = [...qualiState.q3Results, ...q2Elim, ...q1Elim];

            // Save Master finalGrid directly into StateManager so RaceEngine applies it!
            const definitiveStartingGrid = qualiState.finalGrid.map((c, idx) => ({ carId: c.driver.id, position: idx + 1 }));
            StateManager.set('qualiStartingGrid', definitiveStartingGrid);

            qualiState.session = 'DONE';
            Notifications.success('Qualifiers Fully Concluded!', `${qualiState.finalGrid[0]?.driver?.name || 'Pole Driver'} claims the ultimate Pole Position!`);
        } else {
            // Proceed to grand prix strategy
            currentStage = 'strategy';
        }
        render();
    }

    function simulateQualiPace(c, track) {
        const basePace = track?.baseLapTime || 90;
        const driverPace = c.driver?.stats?.pace || 75;
        const aero = c.team?.baseCarStats?.aerodynamics || 75;
        const power = c.team?.baseCarStats?.powerUnit || 75;

        // Formula shaves off time based on elite constructor capabilities
        let perf = (driverPace * 0.5) + (aero * 0.25) + (power * 0.25);
        if (c.isPlayer) perf += 4; // Slight player qualifying competitiveness
        if (c.driver?.traits?.includes('QUALIFYING_SPECIALIST')) perf += 5;

        return basePace - ((perf - 70) * 0.20) + (Math.random() - 0.5) * 0.5;
    }

    /* ===== FINAL STAGE: LIVE GRAND PRIX STRATEGY SETUP mode ===== */

    function renderStrategyView(track, career) {
        const expectedWeather = track.rainProbability > 50 ? 'wet' : track.rainProbability > 25 ? 'mixed' : 'dry';

        container.innerHTML = `
            <div class="rw-container">
                <button class="home-btn" id="rw-home-btn" style="z-index: 50;">⌂</button>

                <div class="rw-stage-header">
                    <div class="rw-stage-label">FINAL STEP • Live Grand Prix Strategy</div>
                    <div class="rw-stage-title">${escapeHTML(track.name)}</div>
                </div>

                <div style="text-align: center; margin-bottom: var(--space-lg);">
                    <span class="badge ${expectedWeather === 'wet' ? 'badge-blue' : expectedWeather === 'mixed' ? 'badge-yellow' : 'badge-green'}" style="font-size: 14px; padding: 8px 16px;">
                        ${expectedWeather === 'wet' ? '🌧️ Heavy Rain Grand Prix forecast' : expectedWeather === 'mixed' ? '🌦️ Variable Rain Shift Grand Prix' : '☀️ Premium Dry Grand Prix Conditions'}
                    </span>
                </div>

                <div class="rw-strategy-grid">
                    <!-- TIRE SELECTOR -->
                    <div class="rw-strategy-card" style="grid-column: span 2;">
                        <h3 class="rw-strategy-title">🛞 OPENING GRAND PRIX COMPOUND</h3>
                        <p class="rw-strategy-desc">Choose your initial tire compound to bolt on for the green flag</p>
                        <div class="tire-options-grid">
                            ${['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'].map(c => {
                                const compound = typeof getCompoundById === 'function' ? getCompoundById(c) : { name: c, description: c, color: '#FFD700' };
                                const selected = strategy.startingTire === c;
                                const isWet = c === 'INTERMEDIATE' || c === 'WET';
                                return `
                                    <div class="tire-option ${selected ? 'selected' : ''}" data-tire="${c}">
                                        <div class="tire-option-dot" style="background: ${compound.color}; box-shadow: 0 0 12px ${compound.color}80;"></div>
                                        <div class="tire-option-content">
                                            <div class="tire-option-name">${compound.name}</div>
                                            <div class="tire-option-desc">${compound.description}</div>
                                            ${isWet ? '<div class="tire-option-tag">FOR WET ASPHALT</div>' : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- PIT STRATEGY -->
                    <div class="rw-strategy-card">
                        <h3 class="rw-strategy-title">🏁 PLANNED PIT STOPS</h3>
                        <p class="rw-strategy-desc">Baseline pit box visits</p>
                        <div class="pit-options">
                            ${[
                                { stops: 1, label: '1-STOP Strategy', desc: 'Highly conservative, long Hard stints' },
                                { stops: 2, label: '2-STOP Balanced', desc: 'Standard balanced Medium/Hard strategy' },
                                { stops: 3, label: '3-STOP Maximum Attack', desc: 'Blistering Soft rubber sprint stints' }
                            ].map(opt => `
                                <div class="pit-option ${strategy.pitStops === opt.stops ? 'selected' : ''}" data-stops="${opt.stops}">
                                    <div class="pit-option-label">${opt.label}</div>
                                    <div class="pit-option-desc">${opt.desc}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- DRIVER AGGRESSION SLIDER -->
                    <div class="rw-strategy-card">
                        <h3 class="rw-strategy-title">⚡ HUMAN DRIVER AGGRESSION LEVEL</h3>
                        <p class="rw-strategy-desc">Shaves valuable seconds but builds tire temperature</p>
                        <div class="aggression-slider">
                            <input type="range" min="1" max="10" value="${strategy.aggression}" class="rw-slider" id="rw-aggression">
                            <div class="slider-labels">
                                <span style="font-family: Orbitron; font-weight: 700;">CAUTIOUS (SAVE)</span>
                                <span class="slider-value" id="aggression-value" style="font-size: 20px;">LVL ${strategy.aggression}</span>
                                <span style="font-family: Orbitron; font-weight: 700; color: #FF0033;">MAX ATTACK</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; max-width: 1000px; margin: var(--space-2xl) auto 0; gap: 20px;">
                    <button class="btn" id="rw-prev-quali">← BACK TO QUALIFYING</button>
                    <button class="btn btn-primary btn-large" id="rw-launch-final-gp" style="padding: 20px 48px; font-family: Orbitron; font-weight: 900; font-size: 22px; box-shadow: 0 0 35px rgba(0,255,65,0.4);">
                        🏁 LAUNCH GRAND PRIX
                    </button>
                </div>
            </div>
        `;

        container.querySelector('#rw-home-btn')?.addEventListener('click', () => EventBus.emit('nav:home'));
        container.querySelector('#rw-prev-quali')?.addEventListener('click', () => {
            currentStage = 'qualifying';
            render();
        });

        // Compound Picker
        container.querySelectorAll('.tire-option').forEach(el => {
            el.addEventListener('click', () => {
                strategy.startingTire = el.dataset.tire;
                render();
            });
        });

        // Pit stops
        container.querySelectorAll('.pit-option').forEach(el => {
            el.addEventListener('click', () => {
                strategy.pitStops = parseInt(el.dataset.stops);
                render();
            });
        });

        // Aggression Slider
        const slider = container.querySelector('#rw-aggression');
        if (slider) {
            slider.addEventListener('input', () => {
                strategy.aggression = parseInt(slider.value);
                const valEl = container.querySelector('#aggression-value');
                if (valEl) valEl.textContent = `LVL ${strategy.aggression}`;
            });
        }

        // Final Grand Prix Launch
        container.querySelector('#rw-launch-final-gp')?.addEventListener('click', () => {
            launchFinalGrandPrix(track, career);
        });
    }

    function launchFinalGrandPrix(track, career) {
        if (typeof AudioManager !== 'undefined') AudioManager.engineRev();

        // Retrieve our definitive qualifying grid if available
        const customGrid = StateManager.get('qualiStartingGrid');

        StateManager.set('race', {
            track: track,
            allTeams: career.allTeams,
            playerTeamId: career.team.id,
            difficulty: career.difficulty || 'COMPETITIVE',
            strategy: strategy,
            grid: customGrid || null,
            isCareerRace: true
        });

        setTimeout(() => {
            if (typeof EventBus !== 'undefined') EventBus.emit('nav:go', { screen: 'race', color: '#00FF41' });
        }, 400);
    }

    function attachIntroListeners() {
        // Minimal delegates included
    }

    function injectWeekendStyles() {
        if (document.getElementById('rw-styles')) return;
        const style = document.createElement('style');
        style.id = 'rw-styles';
        style.textContent = `
            .rw-container {
                width: 100%; min-height: 100%;
                padding: var(--space-xl);
                background: var(--black);
                position: relative;
                overflow-y: auto;
            }
            .rw-stage-header {
                text-align: center;
                margin-bottom: var(--space-2xl);
            }
            .rw-stage-label {
                font-family: 'Rajdhani'; font-size: 14px; font-weight: 800;
                color: var(--green); letter-spacing: 4px;
                text-transform: uppercase;
            }
            .rw-stage-title {
                font-family: 'Orbitron'; font-weight: 900;
                font-size: 32px; letter-spacing: 3px;
                margin-top: 4px; color: white;
            }
            .rw-track-intro {
                max-width: 800px; margin: 0 auto var(--space-xl);
                text-align: center;
            }
            .rw-track-flag { font-size: 52px; margin-bottom: var(--space-md); }
            .rw-track-name {
                font-family: 'Orbitron'; font-weight: 900;
                font-size: 40px; letter-spacing: 4px; color: white;
                margin-bottom: var(--space-sm);
            }
            .rw-track-location {
                font-family: 'Rajdhani'; color: var(--gray-400); font-size: 18px; font-weight: 700;
                letter-spacing: 2px; margin-bottom: var(--space-xl);
            }
            .rw-track-svg {
                width: 100%; max-width: 550px; height: 280px;
                margin: 0 auto var(--space-xl);
                background: var(--surface-1);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-subtle);
                padding: var(--space-md);
            }
            .rw-track-svg svg { width: 100%; height: 100%; }
            .rw-track-info-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: var(--space-md);
                margin-bottom: var(--space-xl);
            }
            @media (max-width: 700px) {
                .rw-track-info-grid { grid-template-columns: repeat(2, 1fr); }
            }
            .rw-info-card {
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                padding: 12px;
                border-radius: var(--radius-md);
            }
            .rw-info-label {
                font-family: 'Rajdhani'; font-size: 10px; font-weight: 800;
                color: var(--gray-400); letter-spacing: 2px;
            }
            .rw-info-value {
                font-family: 'Orbitron'; font-weight: 900;
                font-size: 18px; color: var(--white);
                margin-top: 4px;
            }
            .rw-track-desc {
                color: var(--gray-300); font-style: italic; font-size: 15px;
                line-height: 1.6; margin-bottom: var(--space-xl);
            }
            .rw-strategy-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-lg);
                max-width: 1100px; margin: 0 auto;
            }
            @media (max-width: 800px) {
                .rw-strategy-grid { grid-template-columns: 1fr; }
            }
            .rw-strategy-card {
                background: var(--surface-glass);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                padding: var(--space-xl);
            }
            .rw-strategy-title {
                font-family: 'Orbitron'; font-size: 16px; font-weight: 900; color: white;
                letter-spacing: 2px; margin-bottom: 6px;
            }
            .rw-strategy-desc {
                font-family: 'Rajdhani'; font-size: 13px; font-weight: 700;
                color: var(--gray-400); margin-bottom: var(--space-lg);
            }
            .tire-options-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: var(--space-md);
            }
            .tire-option, .pit-option {
                display: flex; align-items: center; gap: var(--space-md);
                padding: var(--space-md);
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .tire-option:hover, .pit-option:hover {
                border-color: var(--green);
                transform: translateY(-2px);
            }
            .tire-option.selected, .pit-option.selected {
                border-color: var(--green);
                background: rgba(0,255,65,0.08);
                box-shadow: 0 0 15px rgba(0,255,65,0.2);
            }
            .tire-option-dot {
                width: 32px; height: 32px; border-radius: 50%;
                border: 3px solid rgba(255,255,255,0.3);
                flex-shrink: 0;
            }
            .tire-option-content {
                flex: 1;
                min-width: 0;
            }
            .tire-option-name {
                font-family: 'Orbitron'; font-weight: 900; color: white;
                font-size: 14px; letter-spacing: 1px;
                margin-bottom: 2px;
            }
            .tire-option-desc {
                font-family: 'Rajdhani'; font-size: 12px; font-weight: 600;
                color: var(--gray-300); line-height: 1.4;
            }
            .tire-option-tag {
                display: inline-block;
                font-family: 'Orbitron'; font-size: 9px; font-weight: 900;
                color: var(--blue); padding: 3px 8px;
                background: rgba(0,128,255,0.2);
                border-radius: 4px;
                letter-spacing: 1px;
                margin-top: 6px;
            }
            .pit-option-label {
                font-family: 'Orbitron'; font-weight: 900; color: white;
                font-size: 14px; letter-spacing: 1px;
                width: 110px;
            }
            .pit-option-desc {
                font-family: 'Rajdhani'; font-size: 13px; font-weight: 700;
                color: var(--gray-300); flex: 1;
            }
            .rw-slider {
                width: 100%; height: 8px;
                -webkit-appearance: none;
                background: var(--gray-800); border-radius: 4px;
                margin: var(--space-lg) 0; border: 1px solid #333;
            }
            .rw-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 28px; height: 28px;
                background: var(--green); border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 15px var(--green-glow);
            }
            .rw-slider::-moz-range-thumb {
                width: 28px; height: 28px;
                background: var(--green); border-radius: 50%;
                cursor: pointer; border: none;
            }
            .slider-labels {
                display: flex; justify-content: space-between; align-items: center;
                font-family: 'Rajdhani'; font-size: 12px; font-weight: 800;
                color: var(--gray-400); letter-spacing: 1px;
            }
            .slider-value {
                font-family: 'Orbitron'; font-weight: 900;
                color: var(--green); font-size: 16px;
            }
        `;
        document.head.appendChild(style);
    }

    function formatLapTime(seconds) {
        if (seconds === null || seconds === undefined || isNaN(seconds)) return '--:--.---';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function destroy() { isActive = false; }

    return { init, render, destroy };
})();