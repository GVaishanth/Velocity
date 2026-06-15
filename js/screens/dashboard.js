/* ============================================
   VELOCITY — DASHBOARD SCREEN (WITH MARKET)
   Career hub between races
   Now includes Driver Market for hiring/firing
   ============================================ */

const DashboardScreen = (() => {

    let container = null;
    let isActive = false;

    function init() {
        container = document.getElementById('dashboard-content');
        if (!container) return;
        attachListeners();
    }

    function render() {
        if (!container) return;
        const career = StateManager.get('career');

        if (!career) {
            container.innerHTML = `
                <div style="padding: var(--space-3xl); text-align: center;">
                    <h2 style="color: var(--gray-400);">No active career</h2>
                    <button class="btn btn-primary" id="db-back">Return Home</button>
                </div>
            `;
            container.querySelector('#db-back')?.addEventListener('click', () => {
                EventBus.emit('nav:home');
            });
            return;
        }

        const nextTrackId = career.schedule[career.currentRound];
        const nextTrack = nextTrackId ? getTrackById(nextTrackId) : null;
        const isSeasonComplete = career.currentRound >= career.totalRounds;

        const playerDriverStandings = career.championship.driverStandings
            .filter(d => d.teamId === career.team.id)
            .map(d => ({
                ...d,
                position: career.championship.driverStandings
                    .sort((a, b) => b.points - a.points)
                    .findIndex(x => x.driverId === d.driverId) + 1
            }));

        const playerConstructorPos = career.championship.constructorStandings
            .sort((a, b) => b.points - a.points)
            .findIndex(c => c.teamId === career.team.id) + 1;

        container.innerHTML = `
            <div class="dashboard-container">
                <button class="home-btn" id="db-home-btn" title="Back to Home">⌂</button>

                <div class="dashboard-header">
                    <div class="dashboard-team-info">
                        <div class="dashboard-team-logo" style="background: ${career.team.color}">
                            ${career.team.shortName}
                        </div>
                        <div>
                            <div class="dashboard-team-name">${escapeHTML(career.team.name)}</div>
                            <div class="dashboard-team-season">
                                Season ${career.season} • ${isSeasonComplete ? `Championship Complete (${career.totalRounds}/${career.totalRounds} Races)` : `Round ${career.currentRound + 1}/${career.totalRounds}`}
                            </div>
                        </div>
                    </div>

                    <div class="dashboard-budget">
                        <div class="budget-mini-label">BUDGET</div>
                        <div class="budget-mini-value">$${formatMoney(career.budget)}</div>
                    </div>
                </div>

                ${isSeasonComplete ? renderSeasonComplete(career) : renderActiveSeasonContent(career, nextTrack, playerDriverStandings, playerConstructorPos)}
            </div>
        `;

        injectStyles();
        attachContentListeners();
    }

    function renderActiveSeasonContent(career, nextTrack, playerDrivers, constructorPos) {
        return `
            <div class="dashboard-main-grid">
                <!-- NEXT RACE CARD -->
                <div class="dashboard-card dashboard-next-race">
                    <div class="card-header-row">
                        <div class="card-label">NEXT RACE</div>
                        <div class="card-badge">ROUND ${career.currentRound + 1}</div>
                    </div>

                    ${nextTrack ? `
                        <div class="next-race-content">
                            <div class="next-race-flag">${nextTrack.flag}</div>
                            <div>
                                <div class="next-race-name">${escapeHTML(nextTrack.name)}</div>
                                <div class="next-race-country">${escapeHTML(nextTrack.country)} • ${nextTrack.city || ''}</div>
                            </div>
                        </div>

                        <div class="next-race-stats">
                            <div class="race-stat">
                                <div class="race-stat-label">Length</div>
                                <div class="race-stat-value">${nextTrack.length} km</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Laps</div>
                                <div class="race-stat-value">${nextTrack.laps}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Type</div>
                                <div class="race-stat-value" style="font-size: 12px;">${nextTrack.type.replace('_', ' ')}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Rain</div>
                                <div class="race-stat-value">${nextTrack.rainProbability}%</div>
                            </div>
                        </div>

                        <button class="btn btn-primary btn-full btn-large" id="db-enter-race">
                            🏁 ENTER RACE WEEKEND
                        </button>
                    ` : '<div>No upcoming races</div>'}
                </div>

                <!-- TEAM STATS -->
                <div class="dashboard-card">
                    <div class="card-label">TEAM PERFORMANCE</div>
                    <div class="team-overall-display">
                        <div class="overall-circle">
                            <div class="overall-value">${calculateOverall(career.carStats)}</div>
                            <div class="overall-label">OVERALL</div>
                        </div>
                        <div class="stats-list">
                            ${Object.entries(career.carStats).map(([key, val]) => `
                                <div class="stat-row-mini">
                                    <div class="stat-row-label">${formatStatName(key)}</div>
                                    <div class="stat-row-bar">
                                        <div class="stat-bar"><div class="stat-bar-fill" style="width: ${val}%"></div></div>
                                    </div>
                                    <div class="stat-row-value">${val}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- STANDINGS -->
                <div class="dashboard-card">
                    <div class="card-label">CHAMPIONSHIP POSITION</div>
                    <div class="standings-summary">
                        <div class="standing-block">
                            <div class="standing-label">CONSTRUCTORS</div>
                            <div class="standing-position">P${constructorPos}</div>
                            <div class="standing-points">
                                ${career.championship.constructorStandings.find(c => c.teamId === career.team.id)?.points || 0} pts
                            </div>
                        </div>

                        <div class="driver-standings-mini">
                            ${playerDrivers.map(d => `
                                <div class="driver-standing-row">
                                    <span class="driver-pos">P${d.position}</span>
                                    <span class="driver-name-mini">${escapeHTML(d.driverName)}</span>
                                    <span class="driver-pts">${d.points} pts</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- QUICK ACTIONS -->
                <div class="dashboard-card">
                    <div class="card-label">QUICK ACTIONS</div>
                    <div class="action-grid">
                        <button class="action-btn" id="db-rd">
                            <div class="action-icon">🔧</div>
                            <div class="action-label">Car R&D</div>
                            <div class="action-sub">${career.rdPoints} pts</div>
                        </button>
                        <button class="action-btn" id="db-market">
                            <div class="action-icon">💼</div>
                            <div class="action-label">Driver Market</div>
                            <div class="action-sub">Sign drivers</div>
                        </button>
                        <button class="action-btn" id="db-standings">
                            <div class="action-icon">📊</div>
                            <div class="action-label">Standings</div>
                            <div class="action-sub">Full table</div>
                        </button>
                        <button class="action-btn" id="db-team">
                            <div class="action-icon">👥</div>
                            <div class="action-label">Team Info</div>
                            <div class="action-sub">View roster</div>
                        </button>
                        <button class="action-btn" id="db-history">
                            <div class="action-icon">📜</div>
                            <div class="action-label">Race History</div>
                            <div class="action-sub">${career.raceHistory?.length || 0} matches</div>
                        </button>
                        <button class="action-btn" id="db-sponsors">
                            <div class="action-icon">🤝</div>
                            <div class="action-label" style="color: #FFD700;">Corporate Sponsors</div>
                            <div class="action-sub">${career.activeSponsor ? escapeHTML(career.activeSponsor.name) : 'Sign Definitive Sponsor'}</div>
                        </button>
                        <button class="action-btn" id="db-media">
                            <div class="action-icon">🎙️</div>
                            <div class="action-label" style="color: #0080FF;">Media Press Room</div>
                            <div class="action-sub">Resolve Live Mid-Week Dilemmas</div>
                        </button>
                    </div>
                </div>

                <!-- CALENDAR PREVIEW -->
                <div class="dashboard-card calendar-card">
                    <div class="card-label">SEASON CALENDAR</div>
                    <div class="calendar-list">
                        ${career.schedule.map((tId, idx) => {
                            const t = getTrackById(tId);
                            if (!t) return '';
                            const isPast = idx < career.currentRound;
                            const isCurrent = idx === career.currentRound;
                            const result = career.raceHistory?.[idx];

                            return `
                                <div class="calendar-row ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}">
                                    <div class="cal-round">R${idx + 1}</div>
                                    <div class="cal-flag">${t.flag}</div>
                                    <div class="cal-name">${escapeHTML(t.name)}</div>
                                    <div class="cal-status">
                                        ${isPast && result ? `<span class="cal-result">P${result.playerBestPosition || '-'}</span>` :
                                          isCurrent ? '<span class="cal-next">NEXT</span>' :
                                          '<span class="cal-upcoming">—</span>'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function renderSeasonComplete(career) {
        const champion = career.championship.driverStandings
            .sort((a, b) => b.points - a.points)[0];
        const constructorChamp = career.championship.constructorStandings
            .sort((a, b) => b.points - a.points)[0];

        const playerWonDrivers = champion && career.drivers.some(d => d.id === champion.driverId);
        const playerWonConstructors = constructorChamp?.teamId === career.team.id;

        return `
            <div style="text-align: center; padding: var(--space-3xl); max-width: 800px; margin: 0 auto;">
                <div style="font-size: 80px; margin-bottom: var(--space-lg);">🏆</div>
                <h2 style="font-family: 'Orbitron'; font-size: 32px; letter-spacing: 4px; margin-bottom: var(--space-md);">
                    SEASON ${career.season} COMPLETE
                </h2>

                <div style="margin: var(--space-2xl) 0; display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                    <div class="card">
                        <div class="card-label">DRIVERS CHAMPION</div>
                        <div style="font-family: 'Orbitron'; font-size: 20px; margin: var(--space-md) 0;">
                            ${escapeHTML(champion?.driverName || '-')}
                        </div>
                        <div style="color: var(--gray-500);">${champion?.points || 0} points</div>
                        ${playerWonDrivers ? '<div style="color: var(--green); margin-top: 8px;">★ YOUR DRIVER!</div>' : ''}
                    </div>

                    <div class="card">
                        <div class="card-label">CONSTRUCTORS CHAMPION</div>
                        <div style="font-family: 'Orbitron'; font-size: 20px; margin: var(--space-md) 0; color: ${constructorChamp?.teamColor || '#fff'}">
                            ${escapeHTML(constructorChamp?.teamName || '-')}
                        </div>
                        <div style="color: var(--gray-500);">${constructorChamp?.points || 0} points</div>
                        ${playerWonConstructors ? '<div style="color: var(--green); margin-top: 8px;">★ YOUR TEAM!</div>' : ''}
                    </div>
                </div>

                <div style="display: flex; gap: var(--space-md); justify-content: center; margin-top: var(--space-xl);">
                    <button class="btn" id="db-back-home">← RETURN HOME</button>
                    <button class="btn btn-primary" id="db-next-season">🏁 NEXT SEASON</button>
                </div>
            </div>
        `;
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:dashboard:enter', () => {
            isActive = true;
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'dashboard') isActive = false;
        });

        EventBus.on('race:weekend_complete', () => {
            if (isActive) render();
        });
    }

    function attachContentListeners() {
        if (!container) return;

        container.querySelector('#db-home-btn')?.addEventListener('click', () => {
            confirmLeave();
        });

        container.querySelector('#db-back-home')?.addEventListener('click', () => {
            EventBus.emit('nav:home');
        });

        container.querySelector('#db-enter-race')?.addEventListener('click', () => {
            EventBus.emit('nav:go', { screen: 'race-weekend', color: '#00FF41' });
        });

        container.querySelector('#db-next-season')?.addEventListener('click', () => {
            advanceToNextSeason();
        });

        container.querySelector('#db-rd')?.addEventListener('click', () => {
            showRDModal();
        });

        container.querySelector('#db-market')?.addEventListener('click', () => {
            showDriverMarketModal();
        });

        container.querySelector('#db-standings')?.addEventListener('click', () => {
            showStandingsModal();
        });

        container.querySelector('#db-team')?.addEventListener('click', () => {
            showTeamModal();
        });

        container.querySelector('#db-history')?.addEventListener('click', () => {
            showHistoryModal();
        });

        container.querySelector('#db-sponsors')?.addEventListener('click', () => {
            if (typeof showSponsorsStudioModal === 'function') showSponsorsStudioModal();
        });

        container.querySelector('#db-media')?.addEventListener('click', () => {
            if (typeof showMediaPressRoomModal === 'function') showMediaPressRoomModal();
        });
    }

    /* === R&D MODAL === */

    function renderUpgradesListHTML(career) {
        const rdPoints = career?.rdPoints || 0;
        const budget = career?.budget || 0;

        const upgrades = [
            { id: 'u1', dept: 'AERODYNAMICS', name: 'Front Wing Multi-Flap', stat: 'aerodynamics', gain: 3, rdCost: 500, moneyCost: 1200000, desc: 'Increases downforce and high-speed cornering stability.' },
            { id: 'u2', dept: 'AERODYNAMICS', name: 'Venturi Under-Floor', stat: 'aerodynamics', gain: 4, rdCost: 800, moneyCost: 2100000, desc: 'Optimizes dirty air suction and ground effect suction.' },
            { id: 'u3', dept: 'POWERTRAIN', name: 'Power Unit Turbo MK2', stat: 'powerUnit', gain: 4, rdCost: 900, moneyCost: 2500000, desc: 'Delivers raw top speed acceleration down the main straights.' },
            { id: 'u4', dept: 'DURABILITY', name: 'Sidepod Heat Exchangers', stat: 'cooling', gain: 3, rdCost: 600, moneyCost: 1400000, desc: 'Prevents ERS thermal mistakes and engine overheating mistakes.' },
            { id: 'u5', dept: 'CHASSIS', name: 'Active Suspension Geometry', stat: 'mechanicalGrip', gain: 4, rdCost: 750, moneyCost: 1900000, desc: 'Improves traction out of tight, low-speed hairpins.' },
            { id: 'u6', dept: 'TYRES', name: 'Tire Thermal Rims', stat: 'tireManagement', gain: 3, rdCost: 550, moneyCost: 1300000, desc: 'Extends peak grip life and reduces tire blowout cliff degradation.' },
            { id: 'u7', dept: 'DURABILITY', name: 'Gearbox Reliability Audit', stat: 'reliability', gain: 3, rdCost: 650, moneyCost: 1500000, desc: 'Reduces mechanical DNF failures across full championship seasons.' }
        ];

        return upgrades.map(u => {
            const canAfford = rdPoints >= u.rdCost && budget >= u.moneyCost;
            const currentStat = career?.carStats?.[u.stat] || 70;
            return `
                <div class="rd-upgrade-card" data-dept="${u.dept}" style="display: flex; align-items: center; gap: var(--space-md); padding: 12px; background: var(--surface-1); border-radius: var(--radius-md); border: 1px solid ${canAfford ? 'rgba(0,255,65,0.3)' : 'var(--border-subtle)'};">
                    <div style="flex: 1;">
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="badge" style="background: var(--surface-2); color: var(--blue); font-family: Orbitron; font-size: 8px;">${u.dept}</span>
                            <span style="font-family: 'Rajdhani'; font-weight: 800; font-size: 15px; color: var(--white);">${u.name}</span>
                        </div>
                        <div style="color: var(--gray-400); font-size: 11px; margin-top: 4px;">${escapeHTML(u.desc)}</div>
                        <div style="color: var(--gray-500); font-size: 11px; margin-top: 2px; font-family: Orbitron; font-weight: 700;">
                            ${formatStatName(u.stat)}: <span style="color: var(--white)">${currentStat}</span> → <span style="color: var(--green)">${Math.min(98, currentStat + u.gain)}</span>
                        </div>
                    </div>
                    <div style="text-align: right; font-family: Orbitron;">
                        <div style="color: var(--green); font-weight: 900; font-size: 16px;">+${u.gain}</div>
                        <div style="color: var(--yellow); font-size: 11px; font-weight: 700; margin-top: 2px;">${u.rdCost} Pts</div>
                        <div style="color: var(--gray-300); font-size: 11px; font-weight: 700;">$${formatMoney(u.moneyCost)}</div>
                    </div>
                    <button class="btn ${canAfford ? 'btn-glow' : 'btn-danger'}"
                        data-upgrade='${JSON.stringify(u)}'
                        ${!canAfford ? 'disabled' : ''} style="padding: 12px 20px; font-family: Orbitron; font-weight: 900; font-size: 12px; margin-left: 8px;">
                        BUILD
                    </button>
                </div>
            `;
        }).join('');
    }

    function attachRDUpgradeListeners() {
        document.querySelectorAll('[data-upgrade]').forEach(btn => {
            btn.addEventListener('click', () => {
                const upgrade = JSON.parse(btn.dataset.upgrade);
                applyUpgrade(upgrade);
            });
        });
    }

    function showRDModal() {
        const career = StateManager.get('career');
        const rdPoints = career.rdPoints || 0;
        const budget = career.budget || 0;

        Modals.open({
            title: `Car Development • ${rdPoints} Pts • $${formatMoney(budget)}`,
            body: `
                <div style="display: flex; flex-direction: column; gap: var(--space-lg); max-width: 650px;">
                    <!-- SPECTACULAR F1 CAR CHASSIS DIAGRAM -->
                    <div style="text-align: center; position: relative; background: radial-gradient(circle, rgba(0,128,255,0.15) 0%, rgba(0,0,0,0.8) 70%); border-radius: var(--radius-lg); border: 1px solid rgba(0,128,255,0.3); padding: 16px; box-shadow: 0 0 30px rgba(0,128,255,0.2); overflow: hidden;">
                        <div style="font-family: Orbitron; font-size: 10px; font-weight: 900; color: var(--blue); letter-spacing: 4px; position: absolute; top: 12px; left: 16px;">⚡ CAR CHASSIS WIREFRAME</div>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 220" style="width: 100%; max-height: 180px; filter: drop-shadow(0 0 12px rgba(0,255,65,0.4)); margin-top: 10px;">
                            <!-- Central floor / spine -->
                            <path d="M 120 110 L 220 80 L 460 80 L 520 100 L 520 120 L 460 140 L 220 140 Z" fill="none" stroke="#00FF41" stroke-width="2" stroke-dasharray="4 2" />
                            <!-- Front Nose & Wing -->
                            <path d="M 60 90 L 120 105 L 120 115 L 60 130 L 50 130 L 50 90 Z" fill="rgba(0,255,65,0.2)" stroke="#00FF41" stroke-width="3" />
                            <line x1="80" y1="80" x2="80" y2="140" stroke="#00FF41" stroke-width="4" />
                            <!-- Cockpit & Halo -->
                            <ellipse cx="280" cy="110" rx="35" ry="20" fill="rgba(0,128,255,0.3)" stroke="#0080FF" stroke-width="3" />
                            <path d="M 255 110 C 255 90 305 90 305 110 C 305 130 255 130 255 110" fill="none" stroke="#FFFFFF" stroke-width="4" />
                            <!-- Sidepods -->
                            <path d="M 290 75 L 420 70 L 440 85 L 420 95 L 290 95 Z" fill="rgba(255,215,0,0.2)" stroke="#FFD700" stroke-width="2" />
                            <path d="M 290 145 L 420 150 L 440 135 L 420 125 L 290 125 Z" fill="rgba(255,215,0,0.2)" stroke="#FFD700" stroke-width="2" />
                            <!-- Powertrain Deck -->
                            <rect x="330" y="100" width="100" height="20" fill="rgba(255,0,51,0.3)" stroke="#FF0033" stroke-width="2" />
                            <polygon points="360,95 380,95 390,110 380,125 360,125" fill="#FF0033" />
                            <!-- Rear Wing -->
                            <rect x="520" y="70" width="30" height="80" fill="rgba(0,255,65,0.3)" stroke="#00FF41" stroke-width="4" />
                            <line x1="500" y1="110" x2="535" y2="110" stroke="#FFFFFF" stroke-width="6" />
                            <!-- Front Wide Tires -->
                            <rect x="140" y="45" width="55" height="28" rx="6" fill="#111111" stroke="#FFD700" stroke-width="3" />
                            <rect x="140" y="147" width="55" height="28" rx="6" fill="#111111" stroke="#FFD700" stroke-width="3" />
                            <line x1="167" y1="73" x2="167" y2="108" stroke="#FFFFFF" stroke-width="4" />
                            <line x1="167" y1="112" x2="167" y2="147" stroke="#FFFFFF" stroke-width="4" />
                            <!-- Rear Wide Tires -->
                            <rect x="450" y="35" width="65" height="34" rx="8" fill="#111111" stroke="#FFD700" stroke-width="3" />
                            <rect x="450" y="151" width="65" height="34" rx="8" fill="#111111" stroke="#FFD700" stroke-width="3" />
                            <line x1="482" y1="69" x2="482" y2="85" stroke="#FFFFFF" stroke-width="5" />
                            <line x1="482" y1="135" x2="482" y2="151" stroke="#FFFFFF" stroke-width="5" />
                        </svg>
                        <div style="display: flex; justify-content: space-around; font-family: Rajdhani; font-size: 11px; font-weight: 700; color: var(--gray-400); margin-top: 6px;">
                            <span>🛞 High-Downforce Aero</span>
                            <span>⚡ 1000HP V6 Powertrain</span>
                            <span>🛡️ Carbon Composite Chassis</span>
                        </div>
                    </div>

                    <!-- UPGRADES LIST -->
                    <div id="rd-upgrades-list" style="display: flex; flex-direction: column; gap: var(--space-sm); max-height: 280px; overflow-y: auto; padding-right: 6px;">
                        ${renderUpgradesListHTML(career)}
                    </div>
                </div>
            `,
            actions: [
                { label: 'Done Upgrading', type: 'secondary' }
            ],
            onOpen: () => {
                attachRDUpgradeListeners();
            }
        });
    }

    function applyUpgrade(upgrade) {
        const career = StateManager.get('career');
        if (career.rdPoints < upgrade.rdCost || career.budget < upgrade.moneyCost) {
            Notifications.error('Insufficient Resources', 'You need both R&D Points and Budget.');
            return;
        }

        career.rdPoints -= upgrade.rdCost;
        career.budget -= upgrade.moneyCost;
        career.carStats[upgrade.stat] = Math.min(98, career.carStats[upgrade.stat] + upgrade.gain);

        const playerTeam = career.allTeams?.find(t => t.id === career.team.id);
        if (playerTeam) {
            playerTeam.carStats = { ...career.carStats };
        }

        StateManager.set('career', career);
        StateManager.saveGame();

        if (typeof AudioManager !== 'undefined') AudioManager.uiConfirm();
        Notifications.success(`+${upgrade.gain} ${formatStatName(upgrade.stat)} Built!`, upgrade.name);

        // Sub-millisecond seamless in-place DOM updates without re-opening or popping up the modal!
        const modalHeaderEl = document.getElementById('modal-header');
        if (modalHeaderEl) {
            modalHeaderEl.textContent = `Car Development • ${career.rdPoints} Pts • $${formatMoney(career.budget)}`;
        }

        const upgradesListEl = document.getElementById('rd-upgrades-list');
        if (upgradesListEl) {
            upgradesListEl.innerHTML = renderUpgradesListHTML(career);
            attachRDUpgradeListeners();
        }

        // Refresh underlying dashboard graphics silently
        render();
    }

    /* === DRIVER MARKET MODAL === */

    function showDriverMarketModal() {
        const career = StateManager.get('career');
        if (!career) return;

        const currentDriverIds = career.drivers.map(d => d.id);
        // Also exclude drivers currently signed to AI teams
        const aiDriverIds = [];
        career.allTeams?.forEach(team => {
            if (team.id !== career.team.id) {
                team.drivers?.forEach(d => aiDriverIds.push(d.id));
            }
        });

        const availableDrivers = DRIVERS_DATA.filter(d =>
            !currentDriverIds.includes(d.id) && !aiDriverIds.includes(d.id)
        );

        Modals.open({
            title: `💼 DRIVER MARKET STUDIO — EXECUTIVE BUDGET: $${formatMoney(career.budget)}`,
            className: 'modal-xl modal-market',
            body: `
                <div class="market-master-studio" style="display: flex; flex-direction: column; gap: 16px; font-family: 'Rajdhani', sans-serif;">
                    <p class="market-subtitle" style="font-size: 14px; font-weight: 600; color: var(--gray-300); line-height: 1.4; border-bottom: 1px solid var(--border-subtle); padding-bottom: 10px;">
                        Sign elite drivers to your active Constructor lineup. Released drivers return to the available pool. Drivers signed to rival teams are locked.
                    </p>

                    <div class="market-split-flex" style="display: flex; gap: 24px; flex-wrap: wrap;">
                        <!-- Left Column: Owned Roster (Width 40%) -->
                        <div class="market-roster-column" style="flex: 1; min-width: 320px; max-width: 480px; display: flex; flex-direction: column;">
                            <div class="m-col-header" style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(0, 128, 255, 0.2), rgba(0, 255, 65, 0.15)); border: 1px solid rgba(0, 128, 255, 0.4); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-family: Orbitron; font-weight: 900; font-size: 13px; color: #FFFFFF; letter-spacing: 2px;">
                                <span class="m-head-icon">🏎️</span>
                                <span class="m-head-title">YOUR ROSTER (MAX 2)</span>
                            </div>
                            <div class="market-roster-list" style="display: flex; flex-direction: column; gap: 8px;">
                                ${career.drivers.map((d, idx) => `
                                    <div class="market-driver-row owned" style="background: linear-gradient(135deg, rgba(20,20,30,0.85), rgba(10,10,15,0.95)); border: 1px solid #00FF41; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; box-shadow: 0 4px 20px rgba(0,255,65,0.15);">
                                        <span class="m-flag" style="font-size: 24px;">${escapeHTML(d.flag || '🏁')}</span>
                                        <div class="m-info" style="flex: 1; min-width: 0;">
                                            <div class="m-name" style="font-family: Rajdhani; font-weight: 800; font-size: 16px; color: #FFFFFF;">${escapeHTML(d.name)}</div>
                                            <div class="m-stats" style="font-family: Orbitron; font-size: 10px; font-weight: 700; color: var(--gray-400); margin-top: 2px;">Pace ${d.stats?.pace || 80} • Wet ${d.stats?.wetSkill || 80} • Race ${d.stats?.racecraft || 80}</div>
                                        </div>
                                        <div class="m-rating-box" style="text-align: right;">
                                            <div class="m-rate" style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: #00FF41;">${d.rating || 80}</div>
                                            <div class="m-salary" style="font-family: Orbitron; font-size: 10px; color: var(--gray-500);">$${formatMoney(d.cost || 10000000)}</div>
                                        </div>
                                        <button class="btn btn-danger market-btn release-btn" data-release="${idx}" style="padding: 8px 14px; font-family: Orbitron; font-weight: 900; font-size: 10px; border-radius: 6px;">RELEASE</button>
                                    </div>
                                `).join('')}
                                ${career.drivers.length < 2 ? `
                                    <div class="market-empty-slot" style="padding: 16px; background: rgba(255,215,0,0.08); border: 2px dashed #FFD700; border-radius: 10px; text-align: center; font-family: Orbitron; font-size: 12px; font-weight: 900; color: #FFD700; margin-top: 8px; box-shadow: inset 0 0 15px rgba(255,215,0,0.15);">
                                        + OPEN SEAT — SIGN DRIVER FROM AVAILABLE POOL
                                    </div>
                                ` : ''}
                            </div>

                            <div class="market-summary-box" style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-top: 16px; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; font-family: Orbitron; font-size: 11px; font-weight: 900; color: var(--gray-400);">
                                    <span>CONSTRUCTOR SALARY CAP</span>
                                    <span style="color: #FFFFFF;">$120.0M</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-family: Orbitron; font-size: 11px; font-weight: 900; color: var(--gray-400);">
                                    <span>AVAILABLE BUDGET</span>
                                    <span style="color: #00FF41;">$${formatMoney(career.budget)}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Available Drivers Pool (Width 58%) -->
                        <div class="market-pool-column" style="flex: 1.5; min-width: 360px; display: flex; flex-direction: column;">
                            <div class="m-col-header" style="display: flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(0, 128, 255, 0.2), rgba(0, 255, 65, 0.15)); border: 1px solid rgba(0, 128, 255, 0.4); border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; font-family: Orbitron; font-weight: 900; font-size: 13px; color: #FFFFFF; letter-spacing: 2px;">
                                <span class="m-head-icon">💼</span>
                                <span class="m-head-title">AVAILABLE DRIVERS POOL (${availableDrivers.length})</span>
                            </div>

                            <div class="market-filters-system" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
                                <button class="market-filter-chip active" data-filter="all" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; font-family: Orbitron; font-size: 10px; font-weight: 800; color: var(--gray-400); cursor: pointer; transition: all 0.2s ease;">ALL</button>
                                <button class="market-filter-chip" data-filter="elite" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; font-family: Orbitron; font-size: 10px; font-weight: 800; color: var(--gray-400); cursor: pointer; transition: all 0.2s ease;">ELITE (88+)</button>
                                <button class="market-filter-chip" data-filter="strong" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; font-family: Orbitron; font-size: 10px; font-weight: 800; color: var(--gray-400); cursor: pointer; transition: all 0.2s ease;">STRONG (82-87)</button>
                                <button class="market-filter-chip" data-filter="mid" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; font-family: Orbitron; font-size: 10px; font-weight: 800; color: var(--gray-400); cursor: pointer; transition: all 0.2s ease;">MID (75-81)</button>
                                <button class="market-filter-chip" data-filter="budget" style="padding: 6px 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 16px; font-family: Orbitron; font-size: 10px; font-weight: 800; color: var(--gray-400); cursor: pointer; transition: all 0.2s ease;">BUDGET (&lt;75)</button>
                            </div>

                            <div class="available-drivers-grid" id="available-driver-list" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; max-height: 380px; overflow-y: auto; padding-right: 6px;">
                                ${renderAvailableDrivers(availableDrivers, career, 'all')}
                            </div>
                        </div>
                    </div>
                </div>
            `,
            actions: [{ label: 'RETURN TO DASHBOARD', type: 'secondary' }],
            onOpen: () => {
                attachMarketFilterListeners(availableDrivers, career);
                attachMarketDriverListeners(availableDrivers, career);
            }
        });
    }

    function renderAvailableDrivers(drivers, career, filter) {
        let filtered = drivers;
        if (filter === 'elite') filtered = drivers.filter(d => d.rating >= 88);
        else if (filter === 'strong') filtered = drivers.filter(d => d.rating >= 82 && d.rating < 88);
        else if (filter === 'mid') filtered = drivers.filter(d => d.rating >= 75 && d.rating < 82);
        else if (filter === 'budget') filtered = drivers.filter(d => d.rating < 75);

        filtered.sort((a, b) => b.rating - a.rating);

        if (filtered.length === 0) {
            return '<div style="padding: var(--space-lg); text-align: center; color: var(--gray-500); grid-column: 1 / -1;">No drivers in this tier</div>';
        }

        return filtered.map(d => {
            const canAfford = d.cost <= career.budget;
            const teamFull = career.drivers.length >= 2;
            const disabled = !canAfford || teamFull;

            return `
                <div class="m-driver-card ${disabled ? 'disabled' : ''}" style="background: linear-gradient(135deg, rgba(20,20,28,0.8), rgba(8,8,12,0.95)); border: 1px solid ${disabled ? 'rgba(255,255,255,0.1)' : '#0080FF'}; border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; transition: all 0.2s ease; ${disabled ? 'opacity: 0.5;' : ''}">
                    <span class="m-flag" style="font-size: 24px;">${escapeHTML(d.flag || '🏁')}</span>
                    <div class="m-info" style="flex: 1; min-width: 0;">
                        <div class="m-name" style="font-family: Rajdhani; font-weight: 800; font-size: 15px; color: #FFFFFF; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(d.name)}</div>
                        <div class="m-stats" style="font-family: Orbitron; font-size: 9px; font-weight: 700; color: var(--gray-400); margin-top: 2px;">Pace ${d.stats?.pace || 80} • Wet ${d.stats?.wetSkill || 80} • Race ${d.stats?.racecraft || 80}</div>
                    </div>
                    <div style="text-align: right;">
                        <div class="m-rating" style="font-family: Orbitron; font-weight: 900; font-size: 16px; color: #00FF41;">${d.rating || 80}</div>
                        <div class="m-cost" style="font-family: Orbitron; font-weight: 700; font-size: 10px; color: ${canAfford ? '#FFD700' : 'var(--red)'};">$${formatMoney(d.cost || 10000000)}</div>
                    </div>
                    <button class="btn btn-glow market-btn sign-btn"
                        data-hire="${d.id}"
                        ${disabled ? 'disabled' : ''} style="padding: 6px 12px; font-family: Orbitron; font-weight: 900; font-size: 10px; border-radius: 6px;">
                        ${teamFull ? 'FULL' : 'SIGN'}
                    </button>
                </div>
            `;
        }).join('');
    }

    function attachMarketFilterListeners(availableDrivers, career) {
        document.querySelectorAll('.market-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.market-filter-chip').forEach(c => {
                    c.classList.remove('active');
                    c.style.background = 'rgba(255,255,255,0.05)';
                    c.style.color = 'var(--gray-400)';
                    c.style.borderColor = 'rgba(255,255,255,0.15)';
                    c.style.boxShadow = 'none';
                });
                chip.classList.add('active');
                chip.style.background = '#0080FF';
                chip.style.color = '#FFFFFF';
                chip.style.borderColor = '#00FF41';
                chip.style.boxShadow = '0 0 15px rgba(0,128,255,0.6)';

                const list = document.getElementById('available-driver-list');
                if (list) {
                    list.innerHTML = renderAvailableDrivers(availableDrivers, career, chip.dataset.filter);
                    attachMarketDriverListeners(availableDrivers, career);
                }
            });
        });
    }

    function attachMarketDriverListeners(availableDrivers, career) {
        document.querySelectorAll('[data-release]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.release);
                releaseDriver(idx);
            });
        });

        document.querySelectorAll('[data-hire]').forEach(btn => {
            btn.addEventListener('click', () => {
                const driverId = btn.dataset.hire;
                hireDriver(driverId);
            });
        });
    }

    function releaseDriver(idx) {
        const career = StateManager.get('career');
        if (!career.drivers[idx]) return;

        const driver = career.drivers[idx];

        Modals.confirm({
            title: 'Release Driver?',
            body: `Release ${driver.name}? You'll need to sign a replacement before the next race.`,
            confirmText: 'Release',
            confirmType: 'danger',
            onConfirm: () => {
                // Remove from team
                career.drivers.splice(idx, 1);

                // Update playerTeam in allTeams
                const playerTeam = career.allTeams?.find(t => t.id === career.team.id);
                if (playerTeam) playerTeam.drivers = career.drivers;

                // Remove from championship standings
                career.championship.driverStandings = career.championship.driverStandings.filter(
                    d => d.driverId !== driver.id
                );

                StateManager.set('career', career);
                StateManager.saveGame();

                Notifications.success(`${driver.name} released`);
                Modals.close();
                setTimeout(() => showDriverMarketModal(), 300);
            }
        });
    }

    function hireDriver(driverId) {
        const career = StateManager.get('career');
        const driver = DRIVERS_DATA.find(d => d.id === driverId);
        if (!driver) return;

        if (career.drivers.length >= 2) {
            Notifications.error('Team is full. Release a driver first.');
            return;
        }
        if (driver.cost > career.budget) {
            Notifications.error('Not enough budget');
            return;
        }

        Modals.confirm({
            title: `Sign ${driver.name}?`,
            body: `
                <div style="text-align: center; padding: var(--space-md);">
                    <div style="font-size: 32px; margin-bottom: var(--space-sm);">${driver.flag}</div>
                    <div style="font-family: 'Orbitron'; font-size: 18px; margin-bottom: var(--space-sm);">${escapeHTML(driver.name)}</div>
                    <div style="color: var(--gray-400); margin-bottom: var(--space-md);">Rating ${driver.rating} • Cost $${formatMoney(driver.cost)}</div>
                    <div style="color: var(--green);">Budget after: $${formatMoney(career.budget - driver.cost)}</div>
                </div>
            `,
            confirmText: 'Sign Contract',
            confirmType: 'primary',
            onConfirm: () => {
                career.budget -= driver.cost;
                career.drivers.push(driver);

                const playerTeam = career.allTeams?.find(t => t.id === career.team.id);
                if (playerTeam) playerTeam.drivers = career.drivers;

                // Add to championship standings
                career.championship.driverStandings.push({
                    driverId: driver.id,
                    driverName: driver.name,
                    nationality: driver.nationality,
                    teamId: career.team.id,
                    teamName: career.team.name,
                    teamColor: career.team.color,
                    points: 0,
                    wins: 0,
                    podiums: 0,
                    bestFinish: 99
                });

                StateManager.set('career', career);
                StateManager.saveGame();

                Notifications.success(`Signed ${driver.name}!`, `Welcome to ${career.team.name}`);
                Modals.close();
                setTimeout(() => showDriverMarketModal(), 300);
            }
        });
    }

    /* === STANDINGS / TEAM / HISTORY === */

    function showStandingsModal() {
        const career = StateManager.get('career');
        const driverStandings = [...career.championship.driverStandings].sort((a, b) => b.points - a.points);
        const constructorStandings = [...career.championship.constructorStandings].sort((a, b) => b.points - a.points);

        Modals.open({
            title: 'Championship Standings',
            className: 'modal-lg',
            body: `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                    <div>
                        <h3 style="font-family: 'Orbitron'; font-size: 14px; margin-bottom: var(--space-md); color: var(--gray-400);">DRIVERS</h3>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${driverStandings.map((d, idx) => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: ${d.teamId === career.team.id ? 'rgba(0,255,65,0.1)' : 'var(--surface-1)'}; border-radius: 4px; border-left: 4px solid ${d.teamColor || '#ffffff'};">
                                    <span style="font-family: 'Orbitron'; font-weight: 700; font-size: 13px; width: 26px; color: var(--gray-300);">P${idx + 1}</span>
                                    <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-family: 'Rajdhani'; font-weight: 700; font-size: 14px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(d.driverName)}</span>
                                        <span style="font-family: 'Orbitron'; font-weight: 600; font-size: 10px; color: var(--gray-400); text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(d.teamName || 'Independent')}</span>
                                    </div>
                                    <span style="font-family: 'Orbitron'; font-weight: 900; font-size: 13px; color: ${d.teamId === career.team.id ? 'var(--green)' : 'var(--white)'};">${d.points} PTS</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h3 style="font-family: 'Orbitron'; font-size: 14px; margin-bottom: var(--space-md); color: var(--gray-400);">CONSTRUCTORS</h3>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            ${constructorStandings.map((c, idx) => `
                                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: ${c.teamId === career.team.id ? 'rgba(0,255,65,0.1)' : 'var(--surface-1)'}; border-radius: 4px; border-left: 4px solid ${c.teamColor || '#ffffff'};">
                                    <span style="font-family: 'Orbitron'; font-weight: 700; font-size: 13px; width: 26px; color: var(--gray-300);">P${idx + 1}</span>
                                    <div style="flex: 1; display: flex; flex-direction: column; min-width: 0;">
                                        <span style="font-family: 'Rajdhani'; font-weight: 700; font-size: 14px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(c.teamName)}</span>
                                    </div>
                                    <span style="font-family: 'Orbitron'; font-weight: 900; font-size: 13px; color: ${c.teamId === career.team.id ? 'var(--green)' : 'var(--white)'};">${c.points} PTS</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `,
            actions: [{ label: 'Close', type: 'secondary' }]
        });
    }

    function showSponsorsStudioModal() {
        const career = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
        if (!career) return;

        const sponsors = [
            { id: 'sp1', name: 'AWS Subspace Matrix', payout: 2500000, fine: 1000000, goal: 'Double Constructor Top-10 Finishes', desc: 'AWS Subspace pays $2.5M per match but demands both local constructor machines finish in the points (P1-P10). Breaching incurs a $1.0M network fine.' },
            { id: 'sp2', name: 'Petronas Synthetic Core', payout: 3500000, fine: 1500000, goal: 'At Least One Podium Step', desc: 'Petronas Synthetic Core wires $3.5M per match but requires at least one driver to step onto the podium steps (P1-P3). Breaching incurs a $1.5M synthetic oil bill.' },
            { id: 'sp3', name: 'Monster Energy Slingshot', payout: 4500000, fine: 2000000, goal: 'Absolute Fastest Lap of Match', desc: 'Monster Energy Slingshot provides a massive $4.5M payout but mandates your Constructor achieves the overall match fastest lap. Breaching deducts a $2.0M beverage refund.' },
            { id: 'sp4', name: 'Red Bull Esport Transcendent', payout: 6000000, fine: 3000000, goal: 'Double Constructor Podiums (P1-P3)', desc: 'Red Bull Esport Transcendent delivers an absolute transcendent $6.0M payout but strictly enforces double Constructor podium finishes (P1-P3). Breaching deducts a $3.0M front wing bill.' }
        ];

        Modals.open({
            title: `🤝 CORPORATE SPONSORSHIP STUDIO — CURRENT: ${career.activeSponsor ? escapeHTML(career.activeSponsor.name) : 'NONE'}`,
            className: 'modal-xl',
            body: `
                <div style="display: flex; flex-direction: column; gap: 16px; font-family: 'Rajdhani', sans-serif;">
                    <p style="color: var(--gray-300); font-size: 15px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; line-height: 1.4;">
                        Sign a definitive primary corporate sponsor to bankroll your Constructor operations. You earn their massive payout after every match if you meet their mandatory finish threshold. Breaching the contract incurs highly sarcastic corporate billing invoices!
                    </p>

                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                        ${sponsors.map(sp => {
                            const isCurrent = career.activeSponsor?.id === sp.id;
                            return `
                                <div class="sponsor-card" style="background: linear-gradient(135deg, rgba(20,20,30,0.85), rgba(8,8,14,0.95)); border: 2px solid ${isCurrent ? '#FFD700' : '#0080FF'}; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; box-shadow: ${isCurrent ? '0 0 30px rgba(255,215,0,0.4)' : '0 8px 25px rgba(0,0,0,0.8)'}; transition: all 0.3s ease;">
                                    <div>
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                                            <span style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: var(--white);">${escapeHTML(sp.name)}</span>
                                            <span style="font-family: Orbitron; font-size: 11px; font-weight: 900; color: ${isCurrent ? '#000' : '#FFD700'}; background: ${isCurrent ? '#FFD700' : 'rgba(255,215,0,0.15)'}; padding: 4px 10px; border-radius: 6px;">${isCurrent ? '★ ACTIVE SPONSOR' : 'AVAILABLE'}</span>
                                        </div>
                                        <div style="font-family: Orbitron; font-size: 11px; font-weight: 800; color: #00FF41; margin-bottom: 8px; background: rgba(0,255,65,0.1); padding: 6px 10px; border-radius: 6px; border: 1px solid #00FF41;">
                                            🎯 MANDATORY THRESHOLD: ${escapeHTML(sp.goal)}
                                        </div>
                                        <p style="font-size: 13px; font-weight: 600; color: var(--gray-400); line-height: 1.4;">${escapeHTML(sp.desc)}</p>
                                    </div>

                                    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px; margin-top: auto; flex-wrap: wrap; gap: 10px;">
                                        <div>
                                            <div style="font-family: Orbitron; font-size: 10px; color: var(--gray-500); font-weight: 700;">MATCH PAYOUT / FINE</div>
                                            <div style="font-family: Orbitron; font-weight: 900; font-size: 15px;"><span style="color: #00FF41;">+$${formatMoney(sp.payout)}</span> / <span style="color: var(--red);">-$${formatMoney(sp.fine)}</span></div>
                                        </div>
                                        <button class="btn btn-glow sponsor-btn" data-sponsor-id="${sp.id}" ${isCurrent ? 'disabled' : ''} style="padding: 10px 20px; font-family: Orbitron; font-weight: 900; font-size: 11px; border-radius: 8px;">
                                            ${isCurrent ? 'SIGNED CONTRACT' : 'SIGN CONTRACT'}
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `,
            actions: [{ label: 'RETURN TO DASHBOARD', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.sponsor-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const spId = btn.dataset.sponsorId;
                        const selectedSp = sponsors.find(x => x.id === spId);
                        if (!selectedSp) return;

                        career.activeSponsor = selectedSp;
                        if (typeof StateManager !== 'undefined') {
                            StateManager.set('career', career);
                            StateManager.saveGame?.();
                        }
                        if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                        if (typeof Notifications !== 'undefined') Notifications.success('🤝 Corporate Sponsorship Contract Signed!', `${selectedSp.name} bankrolls operations.`);
                        Modals.close();
                        if (typeof render === 'function') render();
                    });
                });
            }
        });
    }

    function showMediaPressRoomModal() {
        const career = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
        if (!career) return;

        const dilemmas = [
            {
                id: 'media_1',
                title: '🎙️ LIVE Esport PRESS CONFERENCE — THE PIT RADIO CONTROVERSY',
                question: 'Your star driver is publicly complaining to the Esport broadcasting media about team strategy favoring their younger teammate during same-lap Pirelli undercut calls. How does the Constructor Principal respond?',
                options: [
                    { label: '🛡️ Back the veteran driver Principal style', effect: 'Star driver earns +5 Consistency, but younger talent Aggression spikes +10.', onApply: () => { if (career.drivers[0]) career.drivers[0].stats.consistency = Math.min(99, career.drivers[0].stats.consistency + 5); if (career.drivers[1]) career.drivers[1].stats.racecraft = Math.min(99, career.drivers[1].stats.racecraft + 10); } },
                    { label: '⚖️ Impose strict Plan A team orders', effect: 'Both drivers gain +3 Consistency and Pace, but active team popularity dips -5%.', onApply: () => { career.drivers.forEach(d => { d.stats.consistency = Math.min(99, d.stats.consistency + 3); d.stats.pace = Math.min(99, d.stats.pace + 3); }); career.fanPopularity = Math.max(10, (career.fanPopularity || 50) - 5); } },
                    { label: '⚔️ Let them fight purely on active match track', effect: 'Uncompromising competitive racing. Both drivers spike +10 Aggression and +5 Racecraft!', onApply: () => { career.drivers.forEach(d => { d.stats.racecraft = Math.min(99, d.stats.racecraft + 5); }); } }
                ]
            },
            {
                id: 'media_2',
                title: '🎙️ LIVE Esport PRESS CONFERENCE — NETCODE LATENCY ACCUSATIONS',
                question: 'During an elite broadcast interview, rival Constructor principals accuse your team live data uplink of employing illegal WebRTC data burst scripts down the primary DRS straights. What is your formal press rebuttal?',
                options: [
                    { label: '🚀 Sarcastically bill them for network netcode repairs', effect: 'Embrace elite broadcast humor. Constructor Fan Popularity spikes +10%, Budget earns +$1.0M in viral sponsorship clicks!', onApply: () => { career.fanPopularity = Math.min(100, (career.fanPopularity || 50) + 10); career.budget += 1000000; } },
                    { label: '🔧 Invite stewards to fully inspect sub-millisecond telemetry', effect: 'Transcendent professional engineering tone. Car Stat Reliability rises +4, local drivers gain +3 Consistency.', onApply: () => { career.carStats.reliability = Math.min(99, career.carStats.reliability + 4); career.drivers.forEach(d => { d.stats.consistency = Math.min(99, d.stats.consistency + 3); }); } },
                    { label: '🏎️ State our active powertrain acceleration needs no netcode', effect: 'Powertrain supremacy tone. Car Stat powerUnit spikes +5, rival Constructor relations turn freezing cold.', onApply: () => { career.carStats.powerUnit = Math.min(99, career.carStats.powerUnit + 5); } }
                ]
            },
            {
                id: 'media_3',
               title: '🎙️ LIVE Esport PRESS CONFERENCE — FRONT WING GROUND STALL',
                question: 'Paddock Esport journalists report your active front wing aerodynamic R&D updates are completely stalling out in high-speed dirty air suction. What is your formal engineering press statement?',
                options: [
                    { label: '💨 Publicly confirm upcoming multi-flap upgrade silences doubters', effect: 'High R&D ambition. Constructor rdPoints spikes +500 Pts to execute R&D upgrades instantly!', onApply: () => { career.rdPoints += 500; } },
                    { label: '🛡️ Blame rival Constructor teams for generating excessive dirty air suction', effect: 'Masterful F1 Esport sarcasm. Both active local drivers gain +5 Racecraft and Pace.', onApply: () => { career.drivers.forEach(d => { d.stats.racecraft = Math.min(99, d.stats.racecraft + 5); d.stats.pace = Math.min(99, d.stats.pace + 5); }); } },
                    { label: '💡 Explain our absolute mathematical sidewall centering matrices', effect: 'Absolute algorithmic engineering tone. Car Stat aerodynamics and mechanicalGrip spike +4.', onApply: () => { career.carStats.aerodynamics = Math.min(99, career.carStats.aerodynamics + 4); career.carStats.mechanicalGrip = Math.min(99, career.carStats.mechanicalGrip + 4); } }
                ]
            }
        ];

        const randomDilemma = dilemmas[Math.floor(Math.random() * dilemmas.length)];

        Modals.open({
            title: randomDilemma.title,
            className: 'modal-lg',
            body: `
                <div style="display: flex; flex-direction: column; gap: 20px; font-family: 'Rajdhani', sans-serif;">
                    <div style="display: flex; gap: 20px; background: rgba(0,128,255,0.1); border: 2px solid #0080FF; padding: 20px; border-radius: 16px; align-items: center;">
                        <span style="font-size: 48px; flex-shrink: 0;">🎙️</span>
                        <p style="font-size: 16px; font-weight: 700; color: #FFFFFF; line-height: 1.4; margin: 0;">${escapeHTML(randomDilemma.question)}</p>
                    </div>

                    <div style="font-family: Orbitron; font-size: 12px; font-weight: 900; color: var(--yellow); letter-spacing: 2px; text-transform: uppercase;">SELECT EXECUTIVE Formal PRESS REBUTTAL:</div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        ${randomDilemma.options.map((opt, idx) => `
                            <div class="dilemma-opt-card" data-dilemma-idx="${idx}" style="background: linear-gradient(135deg, rgba(20,20,30,0.85), rgba(8,8,14,0.95)); border: 2px solid rgba(255,255,255,0.15); border-radius: 14px; padding: 18px; display: flex; flex-direction: column; gap: 8px; cursor: pointer; transition: all 0.2s ease;">
                                <div style="font-family: Orbitron; font-weight: 900; font-size: 15px; color: #FFFFFF;">${escapeHTML(opt.label)}</div>
                                <div style="font-family: Rajdhani; font-size: 13px; font-weight: 700; color: #00FF41; background: rgba(0,255,65,0.1); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(0,255,65,0.3); align-self: flex-start;">
                                    ⚡ EXECUTIVE DELTA REWARD: ${escapeHTML(opt.effect)}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            actions: [{ label: 'CANCEL PRESS CONFERENCE', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.dilemma-opt-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = parseInt(card.dataset.dilemmaIdx);
                        const selectedOpt = randomDilemma.options[idx];
                        if (!selectedOpt) return;

                        selectedOpt.onApply();
                        if (typeof StateManager !== 'undefined') {
                            StateManager.set('career', career);
                            StateManager.saveGame?.();
                        }
                        if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                        if (typeof Notifications !== 'undefined') Notifications.success('🎙️ Official Press Statement Deployed!', 'Media Esport sentiment and Constructor deltas updated flawlessly.');
                        Modals.close();
                        if (typeof render === 'function') render();
                    });
                });
            }
        });
    }

    function showTeamModal() {
        const career = StateManager.get('career');
        Modals.open({
            title: `${career.team.name} - Roster`,
            body: `
                <div style="display: flex; flex-direction: column; gap: var(--space-lg);">
                    <div>
                        <h3 style="font-family: 'Orbitron'; font-size: 13px; color: var(--gray-400); margin-bottom: var(--space-sm);">DRIVERS</h3>
                        ${career.drivers.map(d => `
                            <div style="display: flex; padding: var(--space-sm) var(--space-md); background: var(--surface-1); border-radius: 4px; margin-bottom: 4px; align-items: center;">
                                <span style="margin-right: var(--space-sm);">${d.flag}</span>
                                <span style="flex: 1; font-family: 'Rajdhani'; font-weight: 600;">${escapeHTML(d.name)}</span>
                                <span style="color: var(--gray-500); font-size: 12px;">Rating ${d.rating}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div>
                        <h3 style="font-family: 'Orbitron'; font-size: 13px; color: var(--gray-400); margin-bottom: var(--space-sm);">STAFF</h3>
                        ${Object.entries(career.staff).map(([role, s]) => s ? `
                            <div style="display: flex; padding: var(--space-sm) var(--space-md); background: var(--surface-1); border-radius: 4px; margin-bottom: 4px; align-items: center;">
                                <span style="flex: 1; font-family: 'Rajdhani';">${escapeHTML(s.name)}</span>
                                <span style="color: var(--gray-500); font-size: 11px;">${role}</span>
                            </div>
                        ` : '').join('')}
                    </div>
                </div>
            `,
            actions: [{ label: 'Close', type: 'secondary' }]
        });
    }

    function showHistoryModal() {
        const career = StateManager.get('career');
        const history = career.raceHistory || [];

        Modals.open({
            title: 'Race History',
            body: history.length === 0 ? '<p style="color: var(--gray-500); text-align: center; padding: var(--space-xl);">No races completed yet.</p>' : `
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    ${history.map((r, idx) => {
                        const track = getTrackById(r.trackId);
                        return `
                            <div style="display: flex; padding: var(--space-sm) var(--space-md); background: var(--surface-1); border-radius: 4px; align-items: center; gap: var(--space-sm);">
                                <span style="font-family: 'Orbitron'; color: var(--gray-500); width: 30px;">R${idx + 1}</span>
                                <span>${track?.flag || ''}</span>
                                <span style="flex: 1; font-family: 'Rajdhani'; font-size: 13px;">${escapeHTML(track?.name || 'Unknown')}</span>
                                <span style="color: var(--green); font-family: 'Orbitron'; font-weight: 700;">P${r.playerBestPosition || '-'}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            `,
            actions: [{ label: 'Close', type: 'secondary' }]
        });
    }

    function advanceToNextSeason() {
        const career = StateManager.get('career');

        const champion = career.championship.driverStandings.sort((a, b) => b.points - a.points)[0];
        const constructorChamp = career.championship.constructorStandings.sort((a, b) => b.points - a.points)[0];

        const profile = StateManager.get('profile');
        if (champion && career.drivers.some(d => d.id === champion.driverId)) {
            profile.totalChampionships = (profile.totalChampionships || 0) + 1;
        }
        if (constructorChamp?.teamId === career.team.id) {
            profile.constructorChampionships = (profile.constructorChampionships || 0) + 1;
        }

        if (!profile.careerHistory) profile.careerHistory = [];
        const myTeamStanding = career.championship.constructorStandings.find(c => c.teamId === career.team.id);
        const myFinalPos = career.championship.constructorStandings.sort((a, b) => b.points - a.points).findIndex(c => c.teamId === career.team.id) + 1;

        profile.careerHistory.push({
            season: career.season,
            teamName: career.team.name,
            teamColor: career.team.color,
            position: myFinalPos,
            points: myTeamStanding ? myTeamStanding.points : 0,
            wins: myTeamStanding ? myTeamStanding.wins : 0,
            totalRounds: career.totalRounds || 5
        });

        StateManager.set('profile', profile);
        StateManager.saveProfile();

        career.season++;
        career.currentRound = 0;
        career.rdPoints = (career.rdPoints || 0) + 1500;
        career.budget = (career.budget || 0) + 35000000;
        career._lastSponsorOutcome = null;
        career.schedule = TRACKS_DATA
            .sort(() => Math.random() - 0.5)
            .slice(0, career.totalRounds)
            .map(t => t.id);
        career.raceHistory = [];
        career.championship.driverStandings.forEach(d => {
            d.points = 0; d.wins = 0; d.podiums = 0;
        });
        career.championship.constructorStandings.forEach(c => {
            c.points = 0; c.wins = 0;
        });

        StateManager.set('career', career);
        StateManager.saveGame();

        Notifications.success(`Season ${career.season} begins!`);
        render();
    }

    function confirmLeave() {
        Modals.confirm({
            title: 'Return Home?',
            body: 'Your career is auto-saved. You can continue anytime from Single Player.',
            confirmText: 'Return Home',
            onConfirm: () => EventBus.emit('nav:home')
        });
    }

    /* === UTILS === */
    function calculateOverall(stats) {
        const sum = Object.values(stats).reduce((a, b) => a + b, 0);
        return Math.round(sum / Object.keys(stats).length);
    }

    function formatStatName(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
    }

    function formatMoney(n) {
        if (typeof n !== 'number') return '0';
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return n.toString();
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function injectStyles() {
        if (document.getElementById('db-styles')) return;
        const style = document.createElement('style');
        style.id = 'db-styles';
        style.textContent = `
            .dashboard-container {
                width: 100%; min-height: 100%;
                padding: var(--space-xl);
                background: var(--black);
                position: relative;
            }
            .dashboard-header {
                display: flex; justify-content: space-between; align-items: center;
                margin-bottom: var(--space-xl);
                padding-bottom: var(--space-lg);
                border-bottom: 1px solid var(--border-subtle);
            }
            .dashboard-team-info { display: flex; align-items: center; gap: var(--space-md); }
            .dashboard-team-logo {
                width: 56px; height: 56px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-family: 'Orbitron'; font-weight: 900; color: white;
                font-size: 16px;
            }
            .dashboard-team-name {
                font-family: 'Orbitron'; font-weight: 700;
                font-size: 22px; letter-spacing: 2px;
            }
            .dashboard-team-season {
                font-family: 'Rajdhani'; font-size: 13px;
                color: var(--gray-500); letter-spacing: 2px;
            }
            .dashboard-budget { text-align: right; }
            .budget-mini-label {
                font-family: 'Rajdhani'; font-size: 11px;
                color: var(--gray-500); letter-spacing: 2px;
            }
            .budget-mini-value {
                font-family: 'Orbitron'; font-size: 22px;
                color: var(--green); font-weight: 700;
            }
            .dashboard-main-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr 1fr;
                grid-auto-rows: auto;
                gap: var(--space-lg);
            }
            @media (max-width: 1200px) {
                .dashboard-main-grid { grid-template-columns: 1fr 1fr; }
            }
            @media (max-width: 700px) {
                .dashboard-main-grid { grid-template-columns: 1fr; }
            }
            .dashboard-card {
                background: var(--surface-glass);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
            }
            .dashboard-next-race { grid-column: span 1; grid-row: span 2; }
            .calendar-card { grid-column: 1 / -1; }
            .card-header-row {
                display: flex; justify-content: space-between;
                margin-bottom: var(--space-md);
            }
            .card-badge {
                font-family: 'Orbitron'; font-size: 10px;
                padding: 2px 8px; background: rgba(0,255,65,0.15);
                color: var(--green); border-radius: 4px;
                letter-spacing: 1px;
            }
            .next-race-content {
                display: flex; align-items: center; gap: var(--space-md);
                margin-bottom: var(--space-lg);
            }
            .next-race-flag { font-size: 40px; }
            .next-race-name {
                font-family: 'Orbitron'; font-weight: 700;
                font-size: 18px; letter-spacing: 1px;
            }
            .next-race-country {
                font-family: 'Rajdhani'; font-size: 12px;
                color: var(--gray-500);
            }
            .next-race-stats {
                display: grid; grid-template-columns: repeat(4, 1fr);
                gap: var(--space-sm); margin-bottom: var(--space-lg);
            }
            .race-stat {
                background: var(--surface-1);
                padding: var(--space-sm); border-radius: 4px;
                text-align: center;
            }
            .race-stat-label {
                font-size: 9px; color: var(--gray-500);
                text-transform: uppercase; letter-spacing: 1px;
            }
            .race-stat-value {
                font-family: 'Orbitron'; font-weight: 700;
                font-size: 14px; margin-top: 2px;
            }
            .team-overall-display {
                display: flex; align-items: center; gap: var(--space-lg);
            }
            .overall-circle {
                width: 80px; height: 80px; border-radius: 50%;
                border: 3px solid var(--green);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                background: rgba(0,255,65,0.05);
            }
            .overall-value {
                font-family: 'Orbitron'; font-size: 24px;
                font-weight: 800; color: var(--green);
            }
            .overall-label {
                font-size: 8px; color: var(--gray-500);
                letter-spacing: 1px;
            }
            .stats-list { flex: 1; display: flex; flex-direction: column; gap: 4px; }
            .stat-row-mini {
                display: grid; grid-template-columns: 60px 1fr 30px;
                align-items: center; gap: var(--space-sm); font-size: 11px;
            }
            .stat-row-label {
                font-family: 'Rajdhani'; color: var(--gray-400);
                font-size: 10px;
            }
            .stat-row-value {
                font-family: 'Orbitron'; font-weight: 700;
                text-align: right;
            }
            .standings-summary {
                display: flex; flex-direction: column; gap: var(--space-md);
            }
            .standing-block {
                background: var(--surface-1); padding: var(--space-md);
                border-radius: var(--radius-md); text-align: center;
            }
            .standing-label {
                font-size: 10px; color: var(--gray-500);
                letter-spacing: 2px; text-transform: uppercase;
            }
            .standing-position {
                font-family: 'Orbitron'; font-size: 32px;
                font-weight: 800; color: var(--green);
                margin: 4px 0;
            }
            .standing-points {
                font-family: 'Rajdhani'; color: var(--gray-400);
                font-size: 12px;
            }
            .driver-standings-mini {
                display: flex; flex-direction: column; gap: 4px;
            }
            .driver-standing-row {
                display: flex; align-items: center; gap: var(--space-sm);
                background: var(--surface-1); padding: 6px var(--space-sm);
                border-radius: 4px; font-size: 12px;
            }
            .driver-pos {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--green); width: 30px;
            }
            .driver-name-mini { flex: 1; font-family: 'Rajdhani'; }
            .driver-pts {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--gray-300);
            }
            .action-grid {
                display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-sm);
            }
            .action-btn {
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: var(--space-md);
                cursor: pointer;
                transition: all 0.2s ease;
                color: white; text-align: center;
            }
            .action-btn:hover {
                border-color: var(--green);
                background: rgba(0,255,65,0.05);
                transform: translateY(-2px);
            }
            .action-icon { font-size: 24px; margin-bottom: 4px; }
            .action-label {
                font-family: 'Rajdhani'; font-weight: 700;
                font-size: 12px; letter-spacing: 1px;
            }
            .action-sub {
                font-size: 10px; color: var(--gray-500);
                margin-top: 2px;
            }
            .calendar-list {
                display: flex; flex-direction: column; gap: 2px;
                max-height: 240px; overflow-y: auto;
            }
            .calendar-row {
                display: flex; align-items: center;
                gap: var(--space-sm); padding: 6px var(--space-sm);
                background: var(--surface-1); border-radius: 4px;
                font-size: 12px;
            }
            .calendar-row.past { opacity: 0.5; }
            .calendar-row.current {
                background: rgba(0,255,65,0.1);
                border: 1px solid var(--green);
            }
            .cal-round {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--gray-500); width: 30px;
            }
            .cal-flag { font-size: 14px; }
            .cal-name { flex: 1; font-family: 'Rajdhani'; }
            .cal-result {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--green);
            }
            .cal-next {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--green); font-size: 10px;
                background: rgba(0,255,65,0.2);
                padding: 2px 6px; border-radius: 3px;
            }
            .cal-upcoming { color: var(--gray-700); }

            /* === DRIVER MARKET STYLES === */
            .market-modal {
                display: flex;
                flex-direction: column;
                max-height: 65vh;
            }
            .market-section-title {
                font-family: 'Orbitron', sans-serif;
                font-size: 12px;
                letter-spacing: 3px;
                text-transform: uppercase;
                margin-bottom: var(--space-sm);
                color: var(--gray-400);
            }
            .market-filters {
                display: flex;
                gap: var(--space-xs);
                margin-bottom: var(--space-md);
                flex-wrap: wrap;
            }
            .market-filter-chip {
                padding: 4px 12px;
                border-radius: 20px;
                background: var(--surface-2);
                border: 1px solid var(--border-subtle);
                font-family: 'Rajdhani', sans-serif;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--gray-400);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .market-filter-chip:hover {
                border-color: var(--green);
                color: var(--green);
            }
            .market-filter-chip.active {
                background: rgba(0, 255, 65, 0.15);
                border-color: var(--green);
                color: var(--green);
            }
            .market-driver-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                max-height: 400px;
                overflow-y: auto;
                padding-right: 4px;
            }
            .market-driver-row {
                display: flex;
                align-items: center;
                gap: var(--space-sm);
                padding: var(--space-sm) var(--space-md);
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                transition: all 0.2s ease;
            }
            .market-driver-row:hover:not(.disabled) {
                background: var(--surface-2);
                border-color: var(--green);
            }
            .market-driver-row.disabled {
                opacity: 0.5;
            }
            .market-driver-row.owned {
                border-color: rgba(0, 255, 65, 0.3);
                background: rgba(0, 255, 65, 0.05);
            }
            .market-flag {
                font-size: 18px;
                flex-shrink: 0;
            }
            .market-driver-info {
                flex: 1;
                min-width: 0;
            }
            .market-driver-name {
                font-family: 'Rajdhani', sans-serif;
                font-weight: 700;
                font-size: 14px;
            }
            .market-driver-stats {
                font-size: 10px;
                color: var(--gray-500);
                margin-top: 2px;
                display: flex;
                align-items: center;
                gap: var(--space-sm);
            }
            .market-traits {
                font-size: 12px;
            }
            .market-rating {
                font-family: 'Orbitron', sans-serif;
                font-weight: 800;
                font-size: 18px;
                color: var(--green);
                min-width: 40px;
                text-align: center;
            }
            .market-cost {
                font-family: 'Rajdhani', sans-serif;
                font-weight: 600;
                font-size: 13px;
                color: var(--gray-300);
                min-width: 70px;
                text-align: right;
            }
            .market-cost.unaffordable {
                color: var(--red);
            }
            .market-btn {
                padding: 6px 14px;
                font-size: 10px;
                letter-spacing: 1px;
                min-width: 70px;
            }
            .market-empty-slot {
                padding: var(--space-md);
                text-align: center;
                background: var(--surface-1);
                border: 1px dashed var(--gray-700);
                border-radius: var(--radius-md);
                color: var(--gray-500);
                font-style: italic;
                font-family: 'Rajdhani', sans-serif;
                font-size: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    function destroy() { isActive = false; }

    return { init, render, destroy };
})();