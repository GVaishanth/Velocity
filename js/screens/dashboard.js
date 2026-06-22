/* ============================================
   VELOCITY — DASHBOARD SCREEN (WITH MARKET)
   Career hub between races
   Now includes Driver Market for hiring/firing
   ============================================ */

window.DashboardScreen = (() => {

    let container = null;
    let isActive = false;

    function init() {
        container = document.getElementById('dashboard-content');
        if (!container) return;
        attachListeners();
    }

    function render() {
        if (!container) return;
        const career = Safe.get(StateManager, 'get') ? StateManager.get('career') : null;

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

        // Defensive deep copies / fallbacks
        const safeCareer = {
            ...career,
            schedule: Safe.getArray(career, 'schedule', []),
            drivers: Safe.getArray(career, 'drivers', []),
            allTeams: Safe.getArray(career, 'allTeams', []),
            championship: Safe.ensureObject(career.championship),
            carStats: Safe.ensureObject(career.carStats),
            team: Safe.ensureObject(career.team)
        };

        if (typeof ContractService !== 'undefined') {
            ContractService.ensureCareerContracts(career);
            try { StateManager.set('career', career); } catch(e) {}
        }

        // Authoritative calendar handling. Dashboard never generates its own calendar;
        // invalid calendars are logged and repaired only by CalendarService.
        if (typeof CalendarService !== 'undefined') {
            const calendarValidation = CalendarService.validateCareerCalendar(career);
            if (!calendarValidation.valid) {
                console.error('[Dashboard] Invalid career calendar detected before render:', calendarValidation.errors, calendarValidation);
            }
            CalendarService.ensureCareerCalendar(career, { seasonLength: career.totalRounds || 10 });
            safeCareer.schedule = [...career.schedule];
            safeCareer.seasonCalendar = [...career.seasonCalendar];
            safeCareer.totalRounds = career.totalRounds;
            try { StateManager.set('career', career); } catch(e) {}
        }

        const nextRaceInfo = (typeof CalendarService !== 'undefined')
            ? CalendarService.getNextRace(career)
            : { track: null, trackId: null, remainingRounds: 0, calendar: Safe.getArray(career, 'schedule', []) };
        const scheduleArr = nextRaceInfo.calendar || Safe.getArray(career, 'schedule', []);
        const nextTrack = nextRaceInfo.track;
        const isSeasonComplete = (typeof CalendarService !== 'undefined')
            ? CalendarService.isSeasonComplete(career)
            : Safe.getNumber(career, 'currentRound', 0) >= Safe.getNumber(career, 'totalRounds', 1);

        const playerDriverStandings = Safe.safeFilter(Safe.getArray(safeCareer.championship, 'driverStandings', []), d => d.teamId === Safe.get(safeCareer, 'team.id'))
            .map(d => ({
                ...d,
                position: Safe.safeFilter(Safe.getArray(safeCareer.championship, 'driverStandings', []), x => true)
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .findIndex(x => x.driverId === d.driverId) + 1
            }));

        const playerConstructorPos = Safe.safeFilter(Safe.getArray(safeCareer.championship, 'constructorStandings', []), c => true)
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .findIndex(c => c.teamId === Safe.get(safeCareer, 'team.id')) + 1;

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
        const isMulti = career.isMultiplayer;
        const onlinePlayers = (typeof OnlineManager !== 'undefined') ? OnlineManager.getOnlinePlayers() : [];
        const everyoneReady = onlinePlayers.every(p => p.isReadyForWeekend);
        const myReady = onlinePlayers.find(p => p.username === OnlineManager.getMyUsername())?.isReadyForWeekend;
        const champInfo = getChampionshipSnapshot(career, constructorPos);
        const livery = career.livery || { primary: career.team?.color || '#00FF41', secondary: '#111111', accent: '#FFFFFF' };

        return `
            <div class="dashboard-main-grid" style="--team-primary:${livery.primary || career.team?.color || '#00FF41'}; --team-secondary:${livery.secondary || '#111111'}; --team-accent:${livery.accent || '#FFFFFF'};">
                <!-- NEXT RACE CARD -->
                <div class="dashboard-card dashboard-next-race">
                    <div class="card-header-row">
                        <div class="card-label">NEXT RACE</div>
                        <div class="card-badge">ROUND ${career.currentRound + 1}</div>
                    </div>

                    ${nextTrack ? `
                        <div class="next-race-content">
                            <div class="next-race-flag">${nextTrack.flag}</div>
                            <div style="min-width:0; flex:1;">
                                <div class="next-race-name">${escapeHTML(nextTrack.name)}</div>
                                ${renderTrackPreview(nextTrack, career)}
                                <div class="next-race-country">${escapeHTML(nextTrack.country)} • ${nextTrack.city || ''}</div>
                            </div>
                        </div>

                        <div class="next-race-stats">
                            <div class="race-stat">
                                <div class="race-stat-label">Country</div>
                                <div class="race-stat-value" style="font-size: 12px;">${nextTrack.flag}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Weather</div>
                                <div class="race-stat-value">${nextTrack.rainProbability}%</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Laps</div>
                                <div class="race-stat-value">${nextTrack.laps}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Weekend</div>
                                <div class="race-stat-value" style="font-size: 12px;">${nextTrack.type.replace('_', ' ')}</div>
                            </div>
                        </div>

                        ${isMulti ? `
                            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
                                <div style="font-family: Orbitron; font-size: 11px; color: var(--gray-400); text-align: center;">CONSTRUCTOR READINESS (${onlinePlayers.filter(p => p.isReadyForWeekend).length}/${onlinePlayers.length})</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                                    ${onlinePlayers.map(p => `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${p.isReadyForWeekend ? 'var(--green)' : 'var(--gray-700)'};" title="${p.username}"></div>`).join('')}
                                </div>
                            </div>
                            <button class="btn btn-full ${myReady ? 'btn-danger' : 'btn-glow'}" id="db-mp-ready" style="margin-bottom: 10px; font-family: Orbitron; font-weight: 900;">
                                ${myReady ? 'CANCEL READY' : '✓ READY FOR WEEKEND'}
                            </button>
                            <button class="btn btn-primary btn-full btn-large" id="db-enter-race" ${!everyoneReady ? 'disabled' : ''} style="${!everyoneReady ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                ${everyoneReady ? '🏁 LAUNCH RACE WEEKEND' : '⌛ WAITING FOR GRID...'}
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-full btn-large" id="db-enter-race">
                                🏁 ENTER RACE WEEKEND
                            </button>
                        `}
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
                    <div class="standings-summary compact-standings">
                        <div class="standing-block team-accent-block">
                            <div class="standing-label">CONSTRUCTORS</div>
                            <div class="standing-position">P${constructorPos}</div>
                            <div class="standing-points">${champInfo.points} pts</div>
                        </div>

                        <div class="champ-info-grid">
                            <div><span>Gap</span><b>${champInfo.gapText}</b></div>
                            <div><span>Wins</span><b>${champInfo.wins}</b></div>
                            <div><span>Podiums</span><b>${champInfo.podiums}</b></div>
                            <div><span>Last 5</span><b>${champInfo.form}</b></div>
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

                <!-- TEAM HEADQUARTERS -->
                <div class="dashboard-card headquarters-dashboard-card">
                    <div class="card-label">TEAM HEADQUARTERS</div>
                    <div class="standings-summary">
                        <div class="standing-block">
                            <div class="standing-label">FACILITY RATING</div>
                            <div class="standing-position" style="color:#FFD700;">${getFacilityRating(career)}</div>
                            <div class="standing-points">${getActiveUpgrades(career).length} upgrades active</div>
                        </div>
                        <div class="driver-standings-mini">
                            <div class="driver-standing-row">
                                <span class="driver-name-mini">Next Completion</span>
                                <span class="driver-pts">${getNextCompletionDays(career) === null ? '—' : `${getNextCompletionDays(career)} Days`}</span>
                            </div>
                            <div class="driver-standing-row">
                                <span class="driver-name-mini">Budget Impact</span>
                                <span class="driver-pts">$${formatMoney(getHQMaintenance(career))}/yr</span>
                            </div>
                            <div class="hq-level-summary">
                                ${renderHQLevelSummary(career)}
                            </div>
                            <button class="btn btn-glow btn-full" id="db-open-hq" style="margin-top:10px;font-family:Orbitron;font-weight:900;">OPEN HQ</button>
                        </div>
                    </div>
                </div>

                <!-- SPONSOR SNAPSHOT -->
                <div class="dashboard-card sponsor-dashboard-card">
                    <div class="card-label">SPONSORS & PARTNERSHIPS</div>
                    <div class="sponsor-card-content">
                        <div class="sponsor-primary-panel">
                            <div class="standing-label">MAIN SPONSOR</div>
                            <div class="sponsor-main-name">${escapeHTML(career.activeSponsor?.name || 'NONE')}</div>
                            <div class="sponsor-meta-line">${career.activeSponsor ? `${career.activeSponsor.type?.replace('_', ' ') || 'PARTNER'} • ${career.activeSponsor.riskLevel || 'LOW'} RISK` : 'No active sponsor contract'}</div>
                            <button class="btn btn-glow btn-full" id="db-open-sponsors" style="margin-top:12px;font-family:Orbitron;font-weight:900;">OPEN SPONSORS</button>
                        </div>
                        <div class="sponsor-detail-grid">
                            <div class="sponsor-detail-row"><span>Contract Length</span><b>${career.activeSponsor ? `${career.activeSponsor.contractLength} Years` : '—'}</b></div>
                            <div class="sponsor-detail-row"><span>Current Objective</span><b>${escapeHTML(career.activeSponsor?.objective?.label || career.activeSponsor?.objective?.type || 'Sign Sponsor')}</b></div>
                            <div class="sponsor-detail-row"><span>Objective Reward</span><b>$${formatMoney(career.activeSponsor?.raceBonus || 0)}</b></div>
                            <div class="sponsor-detail-row"><span>Sponsor Income</span><b>$${formatMoney(career.sponsorIncomeThisSeason || 0)}</b></div>
                            <div class="sponsor-detail-row"><span>Team Reputation</span><b>${Math.round(career.teamReputation || career.fanPopularity || 50)}</b></div>
                            <div class="sponsor-detail-row"><span>Available Offers</span><b>${career.sponsorOffers?.length || 0}</b></div>
                        </div>
                    </div>
                </div>

                <!-- QUICK ACTIONS -->
                <div class="dashboard-card quick-actions-card">
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
                        <button class="action-btn" id="db-media">
                            <div class="action-icon">🎙️</div>
                            <div class="action-label" style="color: #0080FF;">Media Press Room</div>
                            <div class="action-sub">Resolve Live Mid-Week Dilemmas</div>
                        </button>
                        <button class="action-btn" id="db-livery">
                            <div class="action-icon">🎨</div>
                            <div class="action-label" style="color: #FF00FF;">Livery Editor</div>
                            <div class="action-sub">${career.livery?.changesThisSeason || 0}/2 Changes Used</div>
                        </button>
                        <button class="action-btn" id="db-academy">
                            <div class="action-icon">🌱</div>
                            <div class="action-label" style="color: #00BFFF;">Driver Academy</div>
                            <div class="action-sub">${career.academy?.drivers?.length || 0} Prospects • Reserve ${career.academy?.reserveDriver ? 'Ready' : 'Empty'}</div>
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
                                <div class="calendar-row ${isPast ? 'past' : ''} ${isCurrent ? 'current' : ''}" ${isCurrent ? 'data-current-round="true"' : ''}>
                                    <div class="cal-round">R${idx + 1}</div>
                                    <div class="cal-flag">${t.flag}</div>
                                    ${renderMiniTrackLayout(t, career)}
                                    <div class="cal-name">
                                        <div class="cal-track-title">${escapeHTML(t.name)}</div>
                                        <div class="cal-track-info">${escapeHTML(t.country || 'Global')}</div>
                                    </div>
                                    <div class="cal-distance">${t.length} km</div>
                                    <div class="cal-laps">${t.laps} Laps</div>
                                    <div class="cal-status">
                                        ${isPast && result ? `<span class="cal-result">P${result.playerBestPosition || '-'}</span>` :
                                          isCurrent ? '<span class="cal-next">ACTIVE</span>' :
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

        container.querySelector('#db-mp-ready')?.addEventListener('click', () => {
            if (typeof OnlineManager !== 'undefined') OnlineManager.toggleWeekendReady();
        });

        container.querySelector('#db-home-btn')?.addEventListener('click', () => {
            confirmLeave();
        });

        container.querySelector('#db-back-home')?.addEventListener('click', () => {
            const isMulti = StateManager.get('career')?.isMultiplayer;
            if (isMulti && typeof OnlineManager !== 'undefined') {
                OnlineManager.cleanup(true);
            }
            EventBus.emit('nav:home');
        });

        const enterRaceWeekend = () => {
            const race = StateManager.get('race');
            if (race && race.isMultiplayerRace) {
                if (typeof OnlineManager !== 'undefined' && OnlineManager.isHost()) {
                    OnlineManager.broadcastAction('START_WEEKEND', {});
                    EventBus.emit('nav:go', { screen: 'race-weekend', color: '#00FF41' });
                } else {
                    Notifications.info('Waiting for Host', 'The Host must initiate the Race Weekend.');
                }
            } else {
                EventBus.emit('nav:go', { screen: 'race-weekend', color: '#00FF41' });
            }
        };
        container.querySelector('#db-enter-race')?.addEventListener('click', enterRaceWeekend);

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

        container.querySelector('#db-open-sponsors')?.addEventListener('click', () => {
            if (typeof showSponsorsStudioModal === 'function') showSponsorsStudioModal();
        });

        container.querySelector('#db-media')?.addEventListener('click', () => {
            if (typeof showMediaPressRoomModal === 'function') showMediaPressRoomModal();
        });

        container.querySelector('#db-livery')?.addEventListener('click', () => {
            showLiveryEditorModal();
        });
        container.querySelector('#db-academy')?.addEventListener('click', () => {
            showAcademyModal();
        });
        container.querySelector('#db-open-hq')?.addEventListener('click', () => {
            EventBus.emit('nav:go', { screen: 'headquarters', color: '#FFD700' });
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
        const buttons = document.querySelectorAll('[data-upgrade]');
        console.log(`[Dashboard] Attaching R&D listeners to ${buttons.length} buttons`);
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                try {
                    const upgrade = JSON.parse(btn.dataset.upgrade);
                    applyUpgrade(upgrade);
                } catch (err) {
                    console.error('[Dashboard] R&D Parse Error:', err);
                }
            });
        });
    }

    function getFuturisticCarSVG(options = {}) {
        const { primary = '#0080FF', secondary = '#111', accent = '#FFF', mode = 'livery', view = 'side' } = options;
        
        const getPartColor = (partId) => {
            if (mode === 'rd') return '#111';
            // Mapping logic for livery
            if (['f1-body', 'f1-body-side', 'f1-rw', 'f1-rw-pillar'].includes(partId)) return primary;
            if (['f1-sidepods', 'f1-sidepods-side', 'f1-engine', 'f1-engine-side', 'f1-engine-cover'].includes(partId)) return secondary;
            if (['f1-nose', 'f1-nose-side', 'f1-fw', 'f1-fw-side', 'f1-front-wing'].includes(partId)) return accent;
            return '#050505';
        };

        const getStrokeColor = (partId) => {
            if (mode === 'rd') return '#0080FF';
            return 'rgba(255,255,255,0.2)';
        };

        if (view === 'top') {
            return `
                <svg viewBox="0 0 300 500" style="width: 100%; max-height: 400px; filter: drop-shadow(0 0 15px rgba(0,128,255,0.1));">
                    <defs>
                        <linearGradient id="grad-wire-top" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#0080FF;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#00D4FF;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <g transform="translate(150, 250) scale(0.9)">
                        <!-- SYMMETRIC TOP VIEW (Centered at 0,0) -->
                        
                        <!-- WHEELS (TYRES) -->
                        <g id="f1-wheels" class="f1-car-part">
                            <!-- Rear -->
                            <rect x="-135" y="100" width="45" height="90" rx="8" fill="#050505" stroke="${getStrokeColor('f1-wheels')}" stroke-width="1.5"/>
                            <rect x="90" y="100" width="45" height="90" rx="8" fill="#050505" stroke="${getStrokeColor('f1-wheels')}" stroke-width="1.5"/>
                            <!-- Front -->
                            <rect x="-125" y="-180" width="40" height="75" rx="6" fill="#050505" stroke="${getStrokeColor('f1-wheels')}" stroke-width="1.5"/>
                            <rect x="85" y="-180" width="40" height="75" rx="6" fill="#050505" stroke="${getStrokeColor('f1-wheels')}" stroke-width="1.5"/>
                        </g>

                        <!-- REAR WING (AERO) -->
                        <rect id="f1-rear-wing" class="f1-car-part" x="-80" y="180" width="160" height="40" fill="${getPartColor('f1-rw')}" stroke="${getStrokeColor('f1-rear-wing')}" stroke-width="2"/>

                        <!-- ENGINE COVER (POWERTRAIN) -->
                        <path id="f1-engine" class="f1-car-part" d="M -40 180 L 40 180 L 35 0 L -35 0 Z" fill="${getPartColor('f1-engine')}" stroke="${getStrokeColor('f1-engine')}" stroke-width="2"/>

                        <!-- SIDEPODS (AERO) -->
                        <g id="f1-sidepods" class="f1-car-part">
                            <path d="M -35 0 C -100 20, -100 120, -40 150 Z" fill="${getPartColor('f1-sidepods')}" stroke="${getStrokeColor('f1-sidepods')}" stroke-width="2"/>
                            <path d="M 35 0 C 100 20, 100 120, 40 150 Z" fill="${getPartColor('f1-sidepods')}" stroke="${getStrokeColor('f1-sidepods')}" stroke-width="2"/>
                        </g>

                        <!-- COCKPIT & HALO (CHASSIS) -->
                        <g id="f1-body" class="f1-car-part">
                            <ellipse cx="0" cy="-20" rx="25" ry="50" fill="#080808" stroke="#FFF" stroke-width="1.5"/>
                            <path d="M -25 -40 Q 0 -90, 25 -40" fill="none" stroke="#FFF" stroke-width="3" opacity="0.8"/>
                        </g>

                        <!-- NOSE (CHASSIS) -->
                        <path id="f1-nose" class="f1-car-part" d="M -25 -70 L 25 -70 L 15 -210 L -15 -210 Z" fill="${getPartColor('f1-nose')}" stroke="${getStrokeColor('f1-nose')}" stroke-width="2"/>

                        <!-- FRONT WING (AERO) -->
                        <path id="f1-front-wing" class="f1-car-part" d="M -130 -240 L 130 -240 L 130 -210 L 80 -200 L -80 -200 L -130 -210 Z" fill="${getPartColor('f1-front-wing')}" stroke="${getStrokeColor('f1-front-wing')}" stroke-width="2"/>

                        <!-- SUSPENSION ARMS (CHASSIS) -->
                        <g id="f1-suspension" class="f1-car-part" stroke="${getStrokeColor('f1-suspension')}" stroke-width="1.5">
                            <!-- Front -->
                            <line x1="-15" y1="-180" x2="-85" y2="-150"/>
                            <line x1="-15" y1="-150" x2="-85" y2="-150"/>
                            <line x1="15" y1="-180" x2="85" y2="-150"/>
                            <line x1="15" y1="-150" x2="85" y2="-150"/>
                            <!-- Rear -->
                            <line x1="-35" y1="140" x2="-90" y2="150"/>
                            <line x1="35" y1="140" x2="90" y2="150"/>
                        </g>

                        <!-- COOLING (DURABILITY) -->
                        <g id="f1-cooling" class="f1-car-part">
                            <rect x="-30" y="50" width="60" height="30" fill="rgba(0,128,255,0.1)" stroke="${getStrokeColor('f1-cooling')}" stroke-width="1" stroke-dasharray="2 2"/>
                        </g>
                    </g>
                </svg>
            `;
        }

        // SIDE VIEW (For Livery Editor)
        return `
            <svg viewBox="0 0 600 220" style="width: 100%; filter: drop-shadow(0 0 20px rgba(0,0,0,0.8));">
                <defs>
                    <linearGradient id="wheel-shine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#333" />
                        <stop offset="50%" stop-color="#111" />
                        <stop offset="100%" stop-color="#000" />
                    </linearGradient>
                </defs>
                <g transform="translate(10, 10)">
                    <!-- REAR WING ASSEMBLY -->
                    <rect id="f1-rw-pillar-side" x="480" y="60" width="12" height="70" fill="${primary}" stroke="rgba(255,255,255,0.2)" />
                    <path id="f1-rw-side" d="M 450 60 L 550 50 L 560 100 L 450 100 Z" fill="${primary}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                    <rect x="490" y="55" width="40" height="5" fill="white" />

                    <!-- WHEELS -->
                    <g id="f1-wheels-side">
                        <!-- Rear -->
                        <circle cx="470" cy="160" r="55" fill="url(#wheel-shine)" stroke="#222" stroke-width="3"/>
                        <circle cx="470" cy="160" r="22" fill="#080808" stroke="${accent}" stroke-width="2"/>
                        <!-- Front -->
                        <circle cx="120" cy="165" r="50" fill="url(#wheel-shine)" stroke="#222" stroke-width="3"/>
                        <circle cx="120" cy="165" r="18" fill="#080808" stroke="${accent}" stroke-width="2"/>
                    </g>

                    <!-- CHASSIS BODY -->
                    <path id="f1-body-side" d="M 80 150 L 150 160 L 380 160 L 480 140 L 480 80 L 380 85 L 150 90 L 80 140 Z" fill="${primary}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

                    <!-- SIDEPODS -->
                    <path id="f1-sidepods-side" d="M 180 100 Q 220 165, 380 155 L 360 100 Z" fill="${secondary}" stroke="rgba(255,255,255,0.1)"/>

                    <!-- ENGINE COVER & FIN -->
                    <path id="f1-engine-side" d="M 300 90 Q 330 40, 380 80 L 480 75 L 480 120 L 380 130 Z" fill="${secondary}" stroke="rgba(255,255,255,0.1)"/>
                    <path d="M 380 50 L 470 75 L 380 80 Z" fill="${secondary}" opacity="0.6" />

                    <!-- FRONT WING -->
                    <path id="f1-fw-side" d="M 0 140 L 100 155 L 100 175 L 0 165 Z" fill="${accent}" stroke="rgba(255,255,255,0.3)"/>
                    
                    <!-- NOSE CONE -->
                    <path id="f1-nose-side" d="M 100 155 L 180 95 L 200 125 L 100 175 Z" fill="${accent}" stroke="rgba(255,255,255,0.2)"/>

                    <!-- COCKPIT & HALO -->
                    <path d="M 220 95 C 220 40, 340 40, 340 95" fill="none" stroke="#FFF" stroke-width="4" opacity="0.8"/>
                    <ellipse cx="280" cy="95" rx="40" ry="12" fill="rgba(0,0,0,0.6)" stroke="#0080FF" stroke-width="2"/>
                </g>
            </svg>
        `;
    }

    function updateRDCarHighlight(dept) {
        const partsMap = {
            'AERODYNAMICS': ['f1-front-wing', 'f1-rear-wing', 'f1-sidepods'],
            'POWERTRAIN': ['f1-engine'],
            'DURABILITY': ['f1-cooling'],
            'CHASSIS': ['f1-nose', 'f1-body', 'f1-suspension'],
            'TYRES': ['f1-wheels']
        };

        // Select parts in the TOP VIEW SVG
        document.querySelectorAll('.f1-car-part').forEach(p => {
            p.style.filter = '';
            p.style.stroke = '#0080FF';
            p.style.strokeWidth = '2';
            if (p.tagName === 'line') p.style.strokeWidth = '1.5';
        });

        const parts = partsMap[dept] || [];
        parts.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.style.filter = 'drop-shadow(0 0 12px #00FF41)';
                el.style.stroke = '#00FF41';
                el.style.strokeWidth = '4';
                if (el.tagName === 'line') el.style.strokeWidth = '3';
            }
        });
    }

    function applyUpgrade(upgrade) {
        const career = StateManager.get('career');
        if (!career || !upgrade) return;

        if (career.rdPoints < upgrade.rdCost || career.budget < upgrade.moneyCost) {
            Notifications.error('Insufficient Resources', 'You need both R&D Points and Budget.');
            return;
        }

        // Deduct resources
        career.rdPoints -= upgrade.rdCost;
        career.budget -= upgrade.moneyCost;
        
        // Apply stat gain
        const currentVal = career.carStats[upgrade.stat] || 70;
        career.carStats[upgrade.stat] = Math.min(99, currentVal + upgrade.gain);
        
        // Record for visual highlight
        career.lastUpgradedPart = upgrade.dept;

        // Sync to allTeams for the race engine
        const playerTeam = career.allTeams?.find(t => t.id === career.team.id);
        if (playerTeam) {
            playerTeam.carStats = { ...career.carStats };
        }

        StateManager.set('career', career);
        StateManager.saveGame();

        if (typeof AudioManager !== 'undefined') AudioManager.uiConfirm();
        Notifications.success(`Upgraded ${upgrade.name}`, `+${upgrade.gain} ${formatStatName(upgrade.stat)} confirmed.`);

        // In-place UI Updates
        const modalHeader = document.getElementById('modal-header');
        if (modalHeader) {
            modalHeader.textContent = `Car Development • ${career.rdPoints} Pts • $${formatMoney(career.budget)}`;
        }

        const list = document.getElementById('rd-upgrades-list');
        if (list) {
            list.innerHTML = renderUpgradesListHTML(career);
            attachRDUpgradeListeners();
        }

        // Visual Highlight
        updateRDCarHighlight(upgrade.dept);

        // Silent dashboard refresh
        render();
    }

    function showRDModal() {
        const career = StateManager.get('career');
        const rdPoints = career.rdPoints || 0;
        const budget = career.budget || 0;

        Modals.open({
            title: `Car Development • ${rdPoints} Pts • $${formatMoney(budget)}`,
            body: `
                <div style="display: flex; flex-direction: column; gap: var(--space-lg); max-width: 650px;">
                    <div style="text-align: center; position: relative; background: radial-gradient(circle, rgba(0,128,255,0.15) 0%, rgba(0,0,0,0.8) 70%); border-radius: var(--radius-lg); border: 1px solid rgba(0,128,255,0.3); padding: 16px; box-shadow: 0 0 30px rgba(0,128,255,0.2); overflow: hidden;">
                        <div style="font-family: Orbitron; font-size: 10px; font-weight: 900; color: var(--blue); letter-spacing: 4px; position: absolute; top: 12px; left: 16px;">⚡ TOP-DOWN CHASSIS ANALYSIS</div>
                        
                        <div id="rd-car-preview-container">
                            ${getFuturisticCarSVG({ mode: 'rd', view: 'top' })}
                        </div>

                        <div style="display: flex; justify-content: space-around; font-family: Rajdhani; font-size: 11px; font-weight: 700; color: var(--gray-400); margin-top: 6px;">
                            <span>🛞 SYM-GRIP AXLES</span>
                            <span>⚡ CORE HYBRID UNIT</span>
                            <span>🛡️ STRUCTURAL CELL</span>
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
                if (career.lastUpgradedPart) {
                    updateRDCarHighlight(career.lastUpgradedPart);
                }
            }
        });
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
                    <div class="market-command-bar">
                        <div>
                            <div class="market-kicker">TRANSFER MARKET INTELLIGENCE</div>
                            <p class="market-subtitle">Search, filter, compare and negotiate with elite drivers. Free agents and expiring contracts are highlighted for rapid squad planning.</p>
                        </div>
                        <div class="market-controls-row">
                            <input class="input" id="market-search" placeholder="Search driver or nationality..." style="min-width:220px;">
                            <select class="select" id="market-sort" style="min-width:160px;">
                                <option value="rating">Sort: OVR</option>
                                <option value="potential">Sort: Potential</option>
                                <option value="age">Sort: Age</option>
                                <option value="salary">Sort: Salary</option>
                            </select>
                        </div>
                    </div>
                    <div id="market-comparison-panel" class="market-comparison-panel">
                        <div class="market-kicker">COMPARISON MODE — SELECT UP TO 3 DRIVERS</div>
                        <div id="market-comparison-grid" class="market-comparison-grid"></div>
                    </div>

                    <div class="market-section-tabs">
                        <span>AVAILABLE DRIVERS</span><span>CONTRACT EXPIRING SOON</span><span>TOP PROSPECTS</span>
                    </div>

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
                                            <div class="m-contract" style="font-family: Orbitron; font-size: 9px; font-weight: 800; color: ${d.freeAgent || d.contractYears <= 0 ? '#FF0033' : '#FFD700'}; margin-top: 3px;">CONTRACT: ${d.contractYears || 0}Y • SALARY $${formatMoney(d.salary || 0)} • ${d.contractStatus || 'ACTIVE'}</div>
                                            <div class="m-development" style="font-family: Orbitron; font-size: 9px; font-weight: 800; color: #00BFFF; margin-top: 2px;">AGE ${d.age} • POT ${d.potentialRating || d.rating} • PEAK ${d.peakAgeStart || 26}-${d.peakAgeEnd || 33} • RET ${(100 * (d.retirementRisk || 0)).toFixed(0)}%</div>
                                        </div>
                                        <div class="m-rating-box" style="text-align: right;">
                                            <div class="m-rate" style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: #00FF41;">${d.rating || 80}</div>
                                            <div class="m-salary" style="font-family: Orbitron; font-size: 10px; color: var(--gray-500);">VAL $${formatMoney(d.marketValue || d.cost || 10000000)}</div>
                                        </div>
                                        <button class="btn btn-glow market-btn renew-btn" data-renew="${d.id}" style="padding: 8px 12px; font-family: Orbitron; font-weight: 900; font-size: 10px; border-radius: 6px;">RENEW</button>
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
                attachMarketSearchAndCompare(availableDrivers, career);
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
            const canAfford = (d.cost || d.marketValue || 0) <= career.budget;
            const teamFull = career.drivers.length >= 2;
            const disabled = !canAfford || teamFull;
            const interest = d.freeAgent ? 'High' : (d.contractYears || 0) <= 1 ? 'Medium' : 'Low';
            const traitList = (d.traits || []).slice(0, 3).join(' • ') || 'Developing Profile';

            return `
                <div class="market-pro-driver-card ${disabled ? 'disabled' : ''}" data-driver-name="${escapeHTML(d.name)}" data-nationality="${escapeHTML(d.nationality || '')}" data-rating="${d.rating || 0}" data-age="${d.age || 0}" data-potential="${d.potentialRating || d.rating || 0}" data-salary="${d.salary || d.cost || 0}">
                    <div class="market-card-topline">
                        <label class="compare-chip"><input type="checkbox" class="market-compare" data-driver-id="${d.id}"> COMPARE</label>
                        <span class="interest-badge ${interest.toLowerCase()}">INTEREST ${interest}</span>
                    </div>
                    <div class="market-card-hero">
                        <div class="market-driver-flag">${escapeHTML(d.flag || '🏁')}</div>
                        <div class="market-driver-main">
                            <div class="market-driver-name">${escapeHTML(d.name)}</div>
                            <div class="market-driver-sub">${escapeHTML(d.nationality || 'Global')} • Age ${d.age || '—'} • ${d.freeAgent ? 'Free Agent' : `${d.contractYears || 0}Y Contract`}</div>
                        </div>
                        <div class="market-ovr-pill"><span>OVR</span>${d.rating || 80}</div>
                    </div>
                    <div class="market-card-grid">
                        <div><span>Potential</span><b>${d.potentialRating || d.rating || '—'}</b></div>
                        <div><span>Salary</span><b>$${formatMoney(d.salary || d.cost || 0)}</b></div>
                        <div><span>Market Value</span><b>$${formatMoney(d.marketValue || d.cost || 0)}</b></div>
                        <div><span>Contract</span><b>${d.freeAgent ? 'Free' : `${d.contractYears || 0}Y`}</b></div>
                    </div>
                    <div class="market-trait-line">${escapeHTML(traitList)}</div>
                    <button class="btn btn-glow market-btn sign-btn" data-hire="${d.id}" ${disabled ? 'disabled' : ''}>
                        ${teamFull ? 'ROSTER FULL' : 'NEGOTIATE'}
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

    function attachMarketSearchAndCompare(availableDrivers, career) {
        const search = document.getElementById('market-search');
        const sort = document.getElementById('market-sort');
        const list = document.getElementById('available-driver-list');
        const renderFiltered = () => {
            if (!list) return;
            const term = (search?.value || '').toLowerCase();
            const sortBy = sort?.value || 'rating';
            let drivers = availableDrivers.filter(d => `${d.name} ${d.nationality}`.toLowerCase().includes(term));
            drivers.sort((a, b) => {
                if (sortBy === 'potential') return (b.potentialRating || b.rating || 0) - (a.potentialRating || a.rating || 0);
                if (sortBy === 'age') return (a.age || 99) - (b.age || 99);
                if (sortBy === 'salary') return (a.salary || a.cost || 0) - (b.salary || b.cost || 0);
                return (b.rating || 0) - (a.rating || 0);
            });
            list.innerHTML = renderAvailableDrivers(drivers, career, 'all');
            attachMarketDriverListeners(availableDrivers, career);
        };
        search?.addEventListener('input', renderFiltered);
        sort?.addEventListener('change', renderFiltered);
    }

    function updateMarketComparison() {
        const checked = [...document.querySelectorAll('.market-compare:checked')].slice(0, 3);
        document.querySelectorAll('.market-compare').forEach(cb => { if (!checked.includes(cb) && checked.length >= 3) cb.checked = false; });
        const panel = document.getElementById('market-comparison-panel');
        const grid = document.getElementById('market-comparison-grid');
        if (!panel || !grid) return;
        if (checked.length === 0) { panel.classList.remove('active'); grid.innerHTML = ''; return; }
        panel.classList.add('active');
        grid.innerHTML = checked.map(cb => {
            const card = cb.closest('.market-pro-driver-card');
            return `<div class="compare-card"><b>${card.querySelector('.market-driver-name')?.textContent || 'Driver'}</b><span>OVR ${card.dataset.rating}</span><span>Potential ${card.dataset.potential}</span><span>Age ${card.dataset.age}</span><span>Salary $${formatMoney(parseInt(card.dataset.salary || '0'))}</span></div>`;
        }).join('');
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
        document.querySelectorAll('[data-renew]').forEach(btn => {
            btn.addEventListener('click', () => renewDriverContract(btn.dataset.renew));
        });
        document.querySelectorAll('.market-compare').forEach(cb => cb.addEventListener('change', updateMarketComparison));
    }

    function renewDriverContract(driverId) {
        const career = StateManager.get('career');
        if (!career || typeof ContractService === 'undefined') return;
        const driver = career.drivers.find(d => d.id === driverId);
        if (!driver) return;
        const proposedSalary = Math.round((driver.salary || 1000000) * 1.08);
        Modals.confirm({
            title: `Renew ${driver.name}?`,
            body: `Offer a 2-year renewal at $${formatMoney(proposedSalary)} salary. Signing bonus is approximately $${formatMoney(proposedSalary * 0.25)}.`,
            confirmText: 'Renew Contract',
            confirmType: 'primary',
            onConfirm: () => {
                const result = ContractService.renewDriver(career, driverId, 2, proposedSalary);
                if (!result.ok) {
                    Notifications.error('Renewal Failed', result.reason);
                    return;
                }
                StateManager.set('career', career);
                StateManager.saveGame();
                if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('CONTRACT_SYNC', { career });
                Notifications.success('Contract Renewed', `${driver.name} renewed for 2 years.`);
                Modals.close();
                setTimeout(() => showDriverMarketModal(), 250);
            }
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
                if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('CONTRACT_SYNC', { career });

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
                const signedDriver = (typeof ContractService !== 'undefined') ? ContractService.withDriverContract(driver, career.team.id, 2) : driver;
                career.drivers.push(signedDriver);

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
                if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('CONTRACT_SYNC', { career });

                Notifications.success(`Signed ${driver.name}!`, `Welcome to ${career.team.name}`);
                Modals.close();
                setTimeout(() => showDriverMarketModal(), 300);
            }
        });
    }

    function showLiveryEditorModal() {
        const career = StateManager.get('career');
        const livery = career.livery || { primary: career.team.color, secondary: '#111111', accent: '#FFFFFF', pattern: 'solid', changesThisSeason: 0 };
        const LIVERY_UPDATE_COST = 5000000; // $5M
        const MAX_CHANGES = 2;

        const canChange = livery.changesThisSeason < MAX_CHANGES && career.budget >= LIVERY_UPDATE_COST;

        Modals.open({
            title: `🎨 LIVERY EDITOR — SESSION USAGE: ${livery.changesThisSeason}/${MAX_CHANGES}`,
            className: 'modal-lg',
            body: `
                <div style="display: flex; flex-direction: column; gap: 20px; font-family: 'Rajdhani', sans-serif;">
                    <p style="color: var(--gray-300); font-size: 15px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
                        Redesign your Constructor's visual identity. Official FIA regulations limit major livery overhauls to <b>twice per season</b>.
                    </p>

                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
                        <!-- PREVIEW -->
                        <div style="background: #050505; border: 2px solid var(--border-subtle); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                            <div style="font-family: Orbitron; font-size: 10px; color: var(--gray-500); position: absolute; top: 10px; left: 10px;">LIVE WIND TUNNEL PREVIEW</div>
                            
                            <div id="livery-car-preview-container" style="width: 100%;">
                                ${getFuturisticCarSVG({ 
                                    primary: livery.primary, 
                                    secondary: livery.secondary, 
                                    accent: livery.accent,
                                    mode: 'livery'
                                })}
                            </div>

                            <div style="margin-top: 20px; display: flex; gap: 10px;">
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${livery.primary}; border: 1px solid white;" id="swatch-p"></div>
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${livery.secondary}; border: 1px solid white;" id="swatch-s"></div>
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${livery.accent}; border: 1px solid white;" id="swatch-a"></div>
                            </div>
                        </div>

                        <!-- CONTROLS -->
                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="form-group">
                                <label class="form-label">PRIMARY COLOR (BODY)</label>
                                <input type="color" class="input" id="livery-primary" value="${livery.primary}" style="height: 40px; padding: 2px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">SECONDARY COLOR (SIDEPODS)</label>
                                <input type="color" class="input" id="livery-secondary" value="${livery.secondary}" style="height: 40px; padding: 2px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">ACCENT COLOR (NOSE)</label>
                                <input type="color" class="input" id="livery-accent" value="${livery.accent}" style="height: 40px; padding: 2px;">
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #FF00FF;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-family: Orbitron; font-size: 12px; font-weight: 900; color: #FFF;">MODIFICATION COST: <span style="color: var(--red);">$${formatMoney(LIVERY_UPDATE_COST)}</span></div>
                                <div style="font-size: 11px; color: var(--gray-400);">Current Budget: $${formatMoney(career.budget)}</div>
                            </div>
                            ${livery.changesThisSeason >= MAX_CHANGES ? 
                                `<span style="color: var(--red); font-family: Orbitron; font-weight: 900; font-size: 12px;">SEASON LIMIT REACHED</span>` :
                                (career.budget < LIVERY_UPDATE_COST ? 
                                    `<span style="color: var(--red); font-family: Orbitron; font-weight: 900; font-size: 12px;">INSUFFICIENT FUNDS</span>` :
                                    `<button class="btn btn-glow" id="btn-apply-livery" style="border-color: #FF00FF; color: #FF00FF;">APPLY OVERHAUL</button>`)
                            }
                        </div>
                    </div>
                </div>
            `,
            actions: [{ label: 'Discard Changes', type: 'secondary' }],
            onOpen: () => {
                const pInput = document.getElementById('livery-primary');
                const sInput = document.getElementById('livery-secondary');
                const aInput = document.getElementById('livery-accent');
                
                const sP = document.getElementById('swatch-p');
                const sS = document.getElementById('swatch-s');
                const sA = document.getElementById('swatch-a');

                const updatePreview = () => {
                    const primary = pInput.value;
                    const secondary = sInput.value;
                    const accent = aInput.value;

                    // Update UI Swatches
                    if (sP) sP.style.backgroundColor = primary;
                    if (sS) sS.style.backgroundColor = secondary;
                    if (sA) sA.style.backgroundColor = accent;

                    // Update SVG Parts (Side View)
                    const body = document.getElementById('f1-body-side');
                    const rw = document.getElementById('f1-rw-side');
                    const rwPillar = document.getElementById('f1-rw-pillar-side');
                    const sidepods = document.getElementById('f1-sidepods-side');
                    const engine = document.getElementById('f1-engine-side');
                    const nose = document.getElementById('f1-nose-side');
                    const fw = document.getElementById('f1-fw-side');

                    if (body) body.setAttribute('fill', primary);
                    if (rw) rw.setAttribute('fill', primary);
                    if (rwPillar) rwPillar.setAttribute('fill', primary);
                    if (sidepods) sidepods.setAttribute('fill', secondary);
                    if (engine) engine.setAttribute('fill', secondary);
                    if (nose) nose.setAttribute('fill', accent);
                    if (fw) fw.setAttribute('fill', accent);
                };

                pInput?.addEventListener('input', updatePreview);
                sInput?.addEventListener('input', updatePreview);
                aInput?.addEventListener('input', updatePreview);

                document.getElementById('btn-apply-livery')?.addEventListener('click', () => {
                    const newLivery = {
                        primary: pInput.value,
                        secondary: sInput.value,
                        accent: aInput.value,
                        pattern: 'solid',
                        changesThisSeason: livery.changesThisSeason + 1
                    };

                    career.budget -= LIVERY_UPDATE_COST;
                    career.livery = newLivery;
                    StateManager.set('career', career);
                    StateManager.saveGame();

                    if (typeof AudioManager !== 'undefined') AudioManager.uiConfirm();
                    Notifications.success('Livery Updated!', 'Constructor visual identity synchronized.');
                    
                    // --- MULTIPLAYER SYNC: Broadcast Livery Overhaul ---
                    const race = StateManager.get('race');
                    if (race && race.isMultiplayerRace && typeof OnlineManager !== 'undefined') {
                        OnlineManager.broadcastAction('LIVERY_UPDATE', { livery: newLivery });
                    }
                    
                    Modals.close();
                    render();
                });
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
        if (!career || typeof SponsorService === 'undefined') return;
        SponsorService.ensureSponsors(career);

        Modals.open({
            title: `🤝 SPONSORS & PARTNERSHIPS — REPUTATION ${Math.round(career.teamReputation || 50)}`,
            className: 'modal-xl',
            body: `
                <div style="display:flex;flex-direction:column;gap:18px;font-family:Rajdhani;">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                        <div class="info-card"><b>Main Sponsor</b><br>${escapeHTML(career.activeSponsor?.name || 'None')}</div>
                        <div class="info-card"><b>Season Income</b><br>$${formatMoney(career.sponsorIncomeThisSeason || 0)}</div>
                        <div class="info-card"><b>Active Deals</b><br>${career.sponsorContracts?.length || 0}</div>
                        <div class="info-card"><b>Offers</b><br>${career.sponsorOffers?.length || 0}</div>
                    </div>

                    <div>
                        <h3 style="font-family:Orbitron;color:#FFD700;font-size:13px;">ACTIVE CONTRACTS</h3>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                            ${(career.sponsorContracts || []).map(sp => `
                                <div style="background:var(--surface-1);border:1px solid rgba(255,215,0,.35);border-radius:12px;padding:14px;">
                                    <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-family:Orbitron;color:white;">${escapeHTML(sp.name)}</b><span style="color:#FFD700;font-family:Orbitron;">${sp.type}</span></div>
                                    <div style="font-size:12px;color:var(--gray-300);margin-top:6px;">${sp.contractLength} years left • Risk ${sp.riskLevel} • Req Rep ${sp.reputationRequirement}</div>
                                    <div style="font-size:12px;color:#00FF41;">Base $${formatMoney(sp.basePayment)} • Race Bonus $${formatMoney(sp.raceBonus)} • Championship $${formatMoney(sp.championshipBonus)}</div>
                                    <div style="font-size:12px;color:#FFD700;">Goal: ${escapeHTML(sp.objective?.label || sp.objective?.type || 'Objective')}</div>
                                    <div style="margin-top:8px;display:flex;gap:6px;">
                                        <button class="btn btn-glow sponsor-renew" data-id="${sp.id}" style="font-size:9px;">RENEW</button>
                                        <button class="btn btn-danger sponsor-terminate" data-id="${sp.id}" style="font-size:9px;">TERMINATE</button>
                                    </div>
                                </div>
                            `).join('') || '<div style="color:var(--gray-500);">No active sponsors.</div>'}
                        </div>
                    </div>

                    <div>
                        <h3 style="font-family:Orbitron;color:#00BFFF;font-size:13px;">AVAILABLE OFFERS</h3>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                            ${(career.sponsorOffers || []).map(sp => {
                                const can = SponsorService.canSign(career, sp);
                                return `
                                    <div style="background:linear-gradient(135deg,rgba(20,20,30,.9),rgba(8,8,14,.95));border:1px solid ${can.ok ? '#0080FF' : '#555'};border-radius:12px;padding:14px;${can.ok ? '' : 'opacity:.6;'}">
                                        <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-family:Orbitron;color:white;">${escapeHTML(sp.name)}</b><span style="color:#FFD700;font-family:Orbitron;">${sp.type}</span></div>
                                        <div style="font-size:12px;color:var(--gray-300);margin-top:6px;">${sp.contractLength} years • Risk ${sp.riskLevel} • Rep Required ${sp.reputationRequirement}</div>
                                        <div style="font-size:12px;color:#00FF41;">Upfront $${formatMoney(sp.upfrontPayment)} • Base $${formatMoney(sp.basePayment)} • Race $${formatMoney(sp.raceBonus)}</div>
                                        <div style="font-size:12px;color:#FFD700;">Goal: ${escapeHTML(sp.objective?.label || sp.objective?.type)}</div>
                                        <div style="margin-top:8px;display:flex;gap:6px;">
                                            <button class="btn btn-glow sponsor-accept" data-id="${sp.id}" ${can.ok ? '' : 'disabled'} style="font-size:9px;">ACCEPT</button>
                                            <button class="btn sponsor-counter" data-id="${sp.id}" ${can.ok ? '' : 'disabled'} style="font-size:9px;">COUNTER +15%</button>
                                            <button class="btn btn-danger sponsor-reject" data-id="${sp.id}" style="font-size:9px;">REJECT</button>
                                        </div>
                                        ${can.ok ? '' : `<div style="font-size:11px;color:var(--red);margin-top:6px;">${escapeHTML(can.reason)}</div>`}
                                    </div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `,
            actions: [{ label: 'RETURN TO DASHBOARD', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.sponsor-accept').forEach(btn => btn.addEventListener('click', () => {
                    const res = SponsorService.acceptOffer(career, btn.dataset.id);
                    if (!res.ok) { Notifications.error('Sponsor Rejected', res.reason); return; }
                    StateManager.set('career', career); StateManager.saveGame?.();
                    if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('SPONSOR_SYNC', { career });
                    Notifications.success('Sponsor Signed', `${res.sponsor.name} pays $${formatMoney(res.upfrontPayment)} upfront.`);
                    Modals.close(); render();
                }));
                document.querySelectorAll('.sponsor-reject').forEach(btn => btn.addEventListener('click', () => { SponsorService.rejectOffer(career, btn.dataset.id); StateManager.set('career', career); StateManager.saveGame?.(); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-counter').forEach(btn => btn.addEventListener('click', () => { const r = SponsorService.counterOffer(career, btn.dataset.id, 1.15); StateManager.set('career', career); StateManager.saveGame?.(); Notifications.info('Counter Offer', r.accepted ? 'Sponsor accepted improved terms.' : 'Sponsor walked away.'); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-terminate').forEach(btn => btn.addEventListener('click', () => { const r = SponsorService.terminateContract(career, btn.dataset.id); if (!r.ok) return; StateManager.set('career', career); StateManager.saveGame?.(); Notifications.warning('Sponsor Terminated', `Penalty $${formatMoney(r.penalty)} paid.`); Modals.close(); showSponsorsStudioModal(); }));
                document.querySelectorAll('.sponsor-renew').forEach(btn => btn.addEventListener('click', () => { const sp = career.sponsorContracts.find(s => s.id === btn.dataset.id); if (sp) { sp.contractLength += 1; sp.basePayment = Math.round(sp.basePayment * 1.05); StateManager.set('career', career); StateManager.saveGame?.(); Notifications.success('Sponsor Renewed', `${sp.name} extended by 1 year.`); Modals.close(); showSponsorsStudioModal(); } }));
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

    function renewStaffContract(role) {
        const career = StateManager.get('career');
        if (!career || typeof ContractService === 'undefined') return;
        const member = career.staff?.[role];
        if (!member) return;
        const proposedSalary = Math.round((member.salary || 1000000) * 1.08);
        Modals.confirm({
            title: `Renew ${member.name}?`,
            body: `Offer a 2-year ${role} renewal at $${formatMoney(proposedSalary)} salary. Signing bonus is approximately $${formatMoney(proposedSalary * 0.20)}.`,
            confirmText: 'Renew Staff Contract',
            confirmType: 'primary',
            onConfirm: () => {
                const result = ContractService.renewStaff(career, role, 2, proposedSalary);
                if (!result.ok) {
                    Notifications.error('Renewal Failed', result.reason);
                    return;
                }
                StateManager.set('career', career);
                StateManager.saveGame();
                if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('CONTRACT_SYNC', { career });
                Notifications.success('Staff Contract Renewed', `${member.name} renewed for 2 years.`);
                Modals.close();
                setTimeout(() => showTeamModal(), 250);
            }
        });
    }

    function showFacilitiesModal() {
        const career = StateManager.get('career');
        if (!career || typeof FacilityService === 'undefined') return;
        FacilityService.ensureCareerFacilities(career);
        const defs = FacilityService.FACILITIES;
        const benefits = FacilityService.calculateBenefits(career);
        Modals.open({
            title: `🏢 ${career.headquarters?.name || 'Team Headquarters'}`,
            className: 'modal-xl',
            body: `
                <div style="display:flex;flex-direction:column;gap:16px;font-family:Rajdhani;">
                    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
                        <div class="info-card"><b>Board</b><br>${career.headquarters.boardConfidence}%</div>
                        <div class="info-card"><b>Shareholders</b><br>${career.headquarters.shareholderConfidence}%</div>
                        <div class="info-card"><b>Sponsors</b><br>${career.headquarters.sponsorConfidence}%</div>
                        <div class="info-card"><b>Maintenance</b><br>$${formatMoney(benefits.maintenanceCost)}/season</div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                        ${Object.entries(defs).map(([key, def]) => {
                            const f = career.headquarters.facilities[key];
                            const cost = FacilityService.upgradeCost(key, f.level);
                            const weeks = FacilityService.upgradeWeeks(key, f.level);
                            return `
                                <div style="background:var(--surface-1);border:1px solid rgba(255,215,0,.25);border-radius:12px;padding:14px;">
                                    <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
                                        <div style="font-family:Orbitron;font-weight:900;color:white;">${def.icon} ${def.name}</div>
                                        <div style="font-family:Orbitron;color:#FFD700;">LVL ${f.level}/10</div>
                                    </div>
                                    <div style="font-size:12px;color:var(--gray-300);margin:6px 0;">${def.benefit}</div>
                                    ${f.upgrade ? `<div style="color:#00BFFF;font-family:Orbitron;font-size:11px;">UPGRADING TO L${f.upgrade.toLevel}: ${f.upgrade.weeksRemaining} WEEKS LEFT</div>` : `<button class="btn btn-glow facility-upgrade" data-facility="${key}" ${f.level >= 10 ? 'disabled' : ''} style="font-size:10px;">UPGRADE $${formatMoney(cost)} • ${weeks} WEEKS</button>`}
                                </div>`;
                        }).join('')}
                    </div>
                    <div style="font-size:12px;color:var(--gray-400);">Benefits: Aero x${benefits.aeroResearch.toFixed(2)} • Power x${benefits.powertrainResearch.toFixed(2)} • Driver Dev x${benefits.driverDevelopment.toFixed(2)} • Academy x${benefits.academyQuality.toFixed(2)} • Scouting x${benefits.scoutingAccuracy.toFixed(2)} • Sponsor Income x${benefits.sponsorIncome.toFixed(2)}</div>
                </div>
            `,
            actions: [{ label: 'Close HQ', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.facility-upgrade').forEach(btn => btn.addEventListener('click', () => {
                    const result = FacilityService.requestUpgrade(career, btn.dataset.facility);
                    if (!result.ok) { Notifications.error('Project Rejected', result.reason); return; }
                    StateManager.set('career', career); StateManager.saveGame();
                    if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('FACILITY_SYNC', { career });
                    Notifications.success('Facility Project Approved', `${defs[btn.dataset.facility].name} upgrade started.`);
                    Modals.close(); showFacilitiesModal();
                }));
            }
        });
    }

    function showAcademyModal() {
        const career = StateManager.get('career');
        if (!career || typeof AcademyService === 'undefined') return;
        AcademyService.ensureCareerAcademies(career);
        const academy = career.academy;
        const regions = Object.entries(AcademyService.REGIONS || {});
        Modals.open({
            title: '🌱 DRIVER ACADEMY — YOUTH DEVELOPMENT',
            className: 'modal-xl',
            body: `
                ${(() => {
                    const drivers = academy.drivers || [];
                    const featured = [...drivers].sort((a,b)=>(b.potentialRating || b.rating || 0)-(a.potentialRating || a.rating || 0))[0];
                    const avgPotential = drivers.length ? Math.round(drivers.reduce((s,d)=>s+(d.potentialRating || d.rating || 0),0)/drivers.length) : 0;
                    return `
                    <div class="academy-hub">
                        <div class="academy-command-row">
                            <div class="academy-stat"><span>Academy Rating</span><b>${academy.facilities || 0}</b></div>
                            <div class="academy-stat"><span>Total Prospects</span><b>${drivers.length}</b></div>
                            <div class="academy-stat"><span>Average Potential</span><b>${avgPotential}</b></div>
                            <div class="academy-stat"><span>Highest Potential</span><b>${featured ? `${escapeHTML(featured.name)} (${featured.potentialRange || featured.potentialRating})` : '—'}</b></div>
                        </div>
                        ${featured ? `
                            <div class="featured-prospect-card">
                                <div class="prospect-avatar">${featured.flag || '🏁'}</div>
                                <div class="prospect-main">
                                    <div class="market-kicker">FEATURED PROSPECT</div>
                                    <h2>${escapeHTML(featured.name)}</h2>
                                    <div class="prospect-sub">Age ${featured.age} • ${escapeHTML(featured.nationality || 'Global')} • OVR ${featured.rating}</div>
                                    <div class="prospect-potential">Potential ${featured.potentialRange || featured.potentialRating || 'Unknown'}</div>
                                    <div class="academy-traits">${(featured.academyTraits || featured.traits || []).map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div>
                                </div>
                                <div class="trend-box"><span>Development Trend</span><b>${(featured.developmentRate || 1) >= 1.35 ? 'Future Star' : (featured.developmentRate || 1) >= 1 ? 'Positive' : 'Watchlist'}</b></div>
                            </div>
                        ` : ''}
                        <div class="academy-filter-row">
                            <span>FILTERS</span><button class="btn academy-filter">Age</button><button class="btn academy-filter">Potential</button><button class="btn academy-filter">Nationality</button><button class="btn academy-filter">Development Trend</button>
                        </div>
                        <div class="academy-table-wrap">
                            <table class="academy-table">
                                <thead><tr><th>Name</th><th>Age</th><th>OVR</th><th>Potential</th><th>Development</th><th>Status</th><th>Actions</th></tr></thead>
                                <tbody>
                                    ${drivers.map(d => `
                                        <tr>
                                            <td><b>${d.flag || '🏁'} ${escapeHTML(d.name)}</b><br><small>${escapeHTML(d.nationality || '')}</small></td>
                                            <td>${d.age}</td><td>${d.rating}</td><td>${d.potentialRange || d.potentialRating || '—'}</td>
                                            <td>${(d.developmentRate || 1) >= 1.35 ? 'Rapid' : (d.developmentRate || 1) >= 1 ? 'Steady' : 'Slow'}</td>
                                            <td>${d.academyStatus || 'ACADEMY'}</td>
                                            <td><button class="btn btn-glow academy-reserve" data-id="${d.id}">Reserve</button><button class="btn btn-primary academy-promote" data-id="${d.id}">Promote</button><button class="btn btn-danger academy-release" data-id="${d.id}">Release</button></td>
                                        </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="scouting-command">
                            <div><div class="market-kicker">SCOUTING NETWORK</div><p>Discover future stars by region. Better HQ scouting improves accuracy.</p></div>
                            <div class="scout-region-grid">${regions.map(([key, r]) => `<button class="btn btn-glow academy-scout" data-region="${key}">${r.name}<br><small>$1.0M</small></button>`).join('')}</div>
                        </div>
                        <div class="scouting-reports-grid">
                            ${(academy.scoutingReports || []).slice(-4).map(r => `<div class="scout-report-card"><b>${r.region} • Quality ${r.quality}</b>${(r.prospects || []).map(p => `<div class="report-prospect"><span>${p.flag} ${escapeHTML(p.name)} — ${p.rating} / ${p.potentialRange}</span><button class="btn btn-glow academy-sign" data-report="${r.id}" data-id="${p.id}">SIGN</button></div>`).join('')}</div>`).join('') || '<div class="scout-report-card muted">No scouting reports yet.</div>'}
                        </div>
                    </div>`;
                })()}
            `,
            actions: [{ label: 'Close Academy', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('.academy-scout').forEach(btn => btn.addEventListener('click', () => {
                    const res = AcademyService.scoutRegion(career, btn.dataset.region, 1000000);
                    if (!res.ok) { Notifications.error('Scouting Failed', res.reason); return; }
                    StateManager.set('career', career); StateManager.saveGame(); Modals.close(); showAcademyModal();
                }));
                document.querySelectorAll('.academy-sign').forEach(btn => btn.addEventListener('click', () => {
                    const res = AcademyService.signProspect(career, btn.dataset.report, btn.dataset.id);
                    if (!res.ok) { Notifications.error('Signing Failed', res.reason); return; }
                    StateManager.set('career', career); StateManager.saveGame(); Modals.close(); showAcademyModal();
                }));
                document.querySelectorAll('.academy-reserve').forEach(btn => btn.addEventListener('click', () => { AcademyService.promoteToReserve(career, btn.dataset.id); StateManager.set('career', career); StateManager.saveGame(); Modals.close(); showAcademyModal(); }));
                document.querySelectorAll('.academy-promote').forEach(btn => btn.addEventListener('click', () => { AcademyService.promoteToMainTeam(career, btn.dataset.id, 1); StateManager.set('career', career); StateManager.saveGame(); Modals.close(); showAcademyModal(); }));
                document.querySelectorAll('.academy-release').forEach(btn => btn.addEventListener('click', () => { AcademyService.releaseAcademyDriver(career, btn.dataset.id); StateManager.set('career', career); StateManager.saveGame(); Modals.close(); showAcademyModal(); }));
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
                                <span style="flex: 1; font-family: 'Rajdhani'; font-weight: 600;">${escapeHTML(d.name)}<br><small style="color:${d.freeAgent || d.contractYears <= 0 ? '#FF0033' : '#FFD700'}; font-family:Orbitron;">${d.contractYears || 0}Y • $${formatMoney(d.salary || 0)} • ${d.contractStatus || 'ACTIVE'}</small><br><small style="color:#00BFFF; font-family:Orbitron;">AGE ${d.age} • POT ${d.potentialRating || d.rating} • PEAK ${d.peakAgeStart || 26}-${d.peakAgeEnd || 33}</small></span>
                                <span style="color: var(--gray-500); font-size: 12px;">Rating ${d.rating}</span>
                            </div>
                        `).join('')}
                    </div>

                    <div>
                        <h3 style="font-family: 'Orbitron'; font-size: 13px; color: var(--gray-400); margin-bottom: var(--space-sm);">STAFF</h3>
                        ${Object.entries(career.staff).map(([role, s]) => s ? `
                            <div style="display: flex; padding: var(--space-sm) var(--space-md); background: var(--surface-1); border-radius: 4px; margin-bottom: 4px; align-items: center;">
                                <span style="flex: 1; font-family: 'Rajdhani';">${escapeHTML(s.name)}<br><small style="color:${s.freeAgent || s.contractYears <= 0 ? '#FF0033' : '#FFD700'}; font-family:Orbitron;">${s.contractYears || 0}Y • $${formatMoney(s.salary || 0)} • ${s.contractStatus || 'ACTIVE'}</small></span>
                                <button class="btn btn-glow staff-renew-btn" data-staff-renew="${role}" style="font-size:9px;padding:5px 8px;">RENEW</button>
                                <span style="color: var(--gray-500); font-size: 11px;">${role}</span>
                            </div>
                        ` : '').join('')}
                    </div>
                </div>
            `,
            actions: [{ label: 'Close', type: 'secondary' }],
            onOpen: () => {
                document.querySelectorAll('[data-staff-renew]').forEach(btn => {
                    btn.addEventListener('click', () => renewStaffContract(btn.dataset.staffRenew));
                });
            }
        });
    }

    function showHistoryModal() {
        const career = StateManager.get('career');
        const history = career.raceHistory || [];

        Modals.open({
            title: 'Championship Race History',
            className: 'modal-lg',
            body: history.length === 0 ? '<p style="color: var(--gray-500); text-align: center; padding: var(--space-xl);">No races completed yet.</p>' : `
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 500px; overflow-y: auto; padding-right: 10px;">
                    ${history.map((r, idx) => {
                        const track = getTrackById(r.trackId);
                        const results = r.fullResults || [];
                        return `
                            <details class="history-item-details" style="background: var(--surface-1); border-radius: 8px; border: 1px solid var(--border-subtle); overflow: hidden;">
                                <summary style="display: flex; padding: 12px 16px; align-items: center; gap: 15px; cursor: pointer; list-style: none; user-select: none;">
                                    <span style="font-family: 'Orbitron'; color: var(--gray-500); width: 35px; font-weight: 800;">R${r.round || idx + 1}</span>
                                    <span style="font-size: 20px;">${track?.flag || '🏁'}</span>
                                    <div style="flex: 1;">
                                        <div style="font-family: 'Rajdhani'; font-weight: 700; font-size: 15px; color: #FFF;">${escapeHTML(track?.name || 'Unknown Grand Prix')}</div>
                                        <div style="font-family: 'Rajdhani'; font-size: 12px; color: var(--gray-500);">${escapeHTML(track?.country || 'Global')}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="color: var(--green); font-family: 'Orbitron'; font-weight: 900; font-size: 18px;">P${r.playerBestPosition || '-'}</div>
                                        <div style="font-size: 10px; color: var(--gray-500); font-family: Orbitron;">BEST POS</div>
                                    </div>
                                    <span class="dropdown-arrow" style="font-size: 10px; color: var(--gray-600); margin-left: 10px;">▼</span>
                                </summary>
                                <div style="padding: 0 16px 16px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2);">
                                    <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-family: 'Rajdhani'; font-size: 13px;">
                                        <thead>
                                            <tr style="text-align: left; color: var(--gray-500); font-size: 10px; font-family: Orbitron; border-bottom: 1px solid var(--border-subtle);">
                                                <th style="padding: 5px;">POS</th>
                                                <th>DRIVER</th>
                                                <th>TEAM</th>
                                                <th style="text-align: right; padding-right: 5px;">PTS</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${results.map(res => {
                                                const isPlayer = res.team?.id === career.team?.id;
                                                return `
                                                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); ${isPlayer ? 'background: rgba(0,255,65,0.05); color: #00FF41;' : 'color: #CCC;'}">
                                                        <td style="padding: 8px 5px; font-family: Orbitron; font-weight: 700;">${res.position}</td>
                                                        <td>${escapeHTML(res.driver?.name)}</td>
                                                        <td style="font-size: 11px; opacity: 0.8;">${escapeHTML(res.team?.shortName || res.team?.name)}</td>
                                                        <td style="text-align: right; padding-right: 5px; font-weight: 800;">${res.points || 0}</td>
                                                    </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </details>
                        `;
                    }).join('')}
                </div>
                <style>
                    .history-item-details summary::-webkit-details-marker { display: none; }
                    .history-item-details[open] .dropdown-arrow { transform: rotate(180deg); }
                    .history-item-details:hover { border-color: var(--green); }
                </style>
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
        if (career.livery) career.livery.changesThisSeason = 0;
        career.rdPoints = (career.rdPoints || 0) + 1500;
        career.budget = (career.budget || 0) + 35000000;
        career._lastSponsorOutcome = null;

        // --- DRIVER DEVELOPMENT + CONTRACTS + SILLY SEASON ---
        if (typeof DriverDevelopmentService !== 'undefined') {
            const devResult = DriverDevelopmentService.processSeasonEnd(career);
            if (devResult?.developmentLog?.length) console.log('[DriverDevelopment]', devResult.developmentLog);
            if (devResult?.retirements?.length) console.log('[DriverRetirements]', devResult.retirements);
            if (devResult?.rookies?.length) console.log('[Rookies]', devResult.rookies);
        }
        if (typeof SponsorService !== 'undefined') {
            const sponsorResult = SponsorService.processSeasonEnd(career);
            SponsorService.processAI(career);
            if (sponsorResult?.expired?.length) console.log('[Sponsors] Expired:', sponsorResult.expired.map(s => s.name));
        }
        if (typeof FacilityService !== 'undefined') {
            const facilityResult = FacilityService.processSeasonEnd(career);
            if (facilityResult?.construction?.completed?.length || facilityResult?.ai?.log?.length) console.log('[Facilities]', facilityResult);
        }
        if (typeof AcademyService !== 'undefined') {
            const academyResult = AcademyService.processSeasonEnd(career);
            if (academyResult?.log?.length) console.log('[Academy]', academyResult.log);
        }
        if (typeof ContractService !== 'undefined') {
            const contractResult = ContractService.processSeasonEnd(career);
            if (contractResult?.movementLog?.length) {
                console.log('[Contracts] Personnel movement:', contractResult.movementLog);
            }
        } else if (typeof SillySeason !== 'undefined') {
            const newGrid = SillySeason.processSeasonEnd(career);
            if (newGrid) career.allTeams = newGrid;
        }
        if (typeof StateManager !== 'undefined' && StateManager.initChampionshipStandings) {
            career.championship = StateManager.initChampionshipStandings(career.allTeams);
        }

        if (typeof CalendarService !== 'undefined') {
            CalendarService.generateNextSeason(career, {
                seasonLength: career.totalRounds || 10,
                selectedTrackIds: career.selectedTrackIds || career.customCalendar || null,
                shuffle: !(career.selectedTrackIds || career.customCalendar)
            });
        } else {
            // Last-resort compatibility only; CalendarService is the authoritative path.
            const nextCalendar = TRACKS_DATA.sort(() => Math.random() - 0.5).slice(0, career.totalRounds).map(t => t.id);
            career.schedule = [...nextCalendar];
            career.seasonCalendar = [...nextCalendar];
            career.totalRounds = nextCalendar.length;
            career.currentRound = 0;
        }
        career.raceHistory = [];
        career.championship.driverStandings.forEach(d => {
            d.points = 0; d.wins = 0; d.podiums = 0;
        });
        career.championship.constructorStandings.forEach(c => {
            c.points = 0; c.wins = 0;
        });

        StateManager.set('career', career);
        StateManager.saveGame();

        // --- SILLY SEASON SUMMARY ---
        if (typeof Notifications !== 'undefined') {
            Notifications.success(`Season ${career.season} begins!`, 'The driver market has been reshuffled.');
            
            // Randomly highlight a major move if any
            const playerTeamId = career.team.id;
            const majorMoves = [];
            career.allTeams.forEach(t => {
                if (t.id !== playerTeamId) {
                    t.drivers.forEach(d => {
                        if (d.rating > 85) majorMoves.push(`${d.name} is now with ${t.name}`);
                    });
                }
            });
            if (majorMoves.length > 0) {
                const move = majorMoves[Math.floor(Math.random() * majorMoves.length)];
                setTimeout(() => Notifications.info('Transfer News', move), 2000);
            }
        }

        render();
    }

    function confirmLeave() {
        const isMulti = StateManager.get('career')?.isMultiplayer;
        Modals.confirm({
            title: isMulti ? 'Leave Online Championship?' : 'Return Home?',
            body: isMulti ? 'This will terminate your connection to the grid. You cannot resume this specific online session later.' : 'Your career is auto-saved. You can continue anytime from Single Player.',
            confirmText: isMulti ? 'LEAVE GRID' : 'Return Home',
            onConfirm: () => {
                if (isMulti && typeof OnlineManager !== 'undefined') {
                    OnlineManager.cleanup(true); // True = Clear session
                }
                EventBus.emit('nav:home');
            }
        });
    }

    /* === UTILS === */
    function getChampionshipSnapshot(career, constructorPos) {
        const standings = [...(career.championship?.constructorStandings || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
        const mine = standings.find(c => c.teamId === career.team?.id) || { points: 0, wins: 0, podiums: 0 };
        const leader = standings[0] || mine;
        const ahead = standings[constructorPos - 2];
        const behind = standings[constructorPos] || null;
        let gapText = 'LEADER';
        if (constructorPos > 1 && leader) gapText = `-${Math.max(0, (leader.points || 0) - (mine.points || 0))} to P1`;
        else if (behind) gapText = `+${Math.max(0, (mine.points || 0) - (behind.points || 0))} ahead P2`;
        const recent = (career.raceHistory || []).slice(-5).map(r => `P${r.playerBestPosition || '-'}`);
        return {
            points: mine.points || 0,
            wins: mine.wins || 0,
            podiums: mine.podiums || 0,
            gapText,
            form: recent.length ? recent.join(' ') : '—'
        };
    }

    function getHQMaintenance(career) {
        return (typeof FacilityService !== 'undefined') ? FacilityService.calculateBenefits(career).maintenanceCost : 0;
    }

    function renderHQLevelSummary(career) {
        const f = career.headquarters?.facilities || {};
        const item = (key, label) => `<span>${label} Lv.${f[key]?.level || 1}</span>`;
        return [
            item('simulation', 'Simulator'),
            item('aerodynamics', 'Aero Center'),
            item('driverDevelopment', 'Academy'),
            item('manufacturing', 'Factory')
        ].join('');
    }

    function renderMiniTrackLayout(track, career) {
        const teamColor = career?.team?.color || '#00FF41';
        return `
            <div class="cal-track-mini-layout">
                <svg viewBox="0 0 700 600" preserveAspectRatio="xMidYMid meet">
                    <path d="${track.svgPath}" fill="none" stroke="rgba(255,255,255,.13)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="${track.svgPath}" fill="none" stroke="#00D4FF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
                    <path d="${track.svgPath}" fill="none" stroke="${teamColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
                </svg>
            </div>`;
    }

    function renderTrackPreview(track, career) {
        if (!track?.svgPath) return '';
        const teamColor = career?.team?.color || '#00FF41';
        return `
            <div class="next-race-track-preview" title="${escapeHTML(track.name)} layout">
                <svg viewBox="0 0 700 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                    <path d="${track.svgPath}" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"/>
                    <path d="${track.svgPath}" fill="none" stroke="#00D4FF" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity="0.92"/>
                    <path d="${track.svgPath}" fill="none" stroke="${teamColor}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
                    <circle cx="100" cy="100" r="5" fill="#FF0033" opacity="0.9"/>
                </svg>
            </div>
        `;
    }

    function getFacilityRating(career) {
        if (typeof FacilityService !== 'undefined') FacilityService.ensureCareerFacilities(career);
        const facilities = career?.headquarters?.facilities || {};
        const levels = Object.values(facilities).map(f => f.level || 1);
        return Math.round((levels.reduce((sum, l) => sum + l, 0) / Math.max(1, levels.length)) * 10);
    }

    function getActiveUpgrades(career) {
        return Object.entries(career?.headquarters?.facilities || {}).filter(([, f]) => !!f.upgrade);
    }

    function getNextCompletionDays(career) {
        const weeks = getActiveUpgrades(career).map(([, f]) => f.upgrade?.weeksRemaining).filter(Number.isFinite);
        if (!weeks.length) return null;
        return Math.min(...weeks) * 7;
    }

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
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 18%, var(--border-subtle));
                border-radius: var(--radius-lg);
                padding: var(--space-lg);
            }
            .btn-glow { border-color: var(--team-primary, #00FF41); color: var(--team-primary, #00FF41); }
            .dashboard-next-race { grid-column: span 1; grid-row: span 2; overflow: hidden; }
            .sponsor-dashboard-card { grid-column: span 2; min-height: 245px; }
            .quick-actions-card { grid-column: 1 / -1; width: min(100%, 1120px); justify-self: center; }
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
            .next-race-track-preview {
                width: 100%;
                height: 88px;
                margin: 8px 0 7px;
                border-radius: 10px;
                background:
                    radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.10), transparent 62%),
                    linear-gradient(135deg, rgba(0,0,0,0.62), rgba(12,18,28,0.82));
                border: 1px solid rgba(0, 212, 255, 0.24);
                box-shadow: inset 0 0 18px rgba(0, 212, 255, 0.06), 0 0 14px rgba(0, 128, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            .next-race-track-preview svg {
                width: 96%;
                height: 92%;
                filter: drop-shadow(0 0 7px rgba(0,212,255,0.55));
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
            .team-accent-block { border: 1px solid color-mix(in srgb, var(--team-primary) 55%, transparent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--team-primary) 10%, transparent); }
            .champ-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; }
            .champ-info-grid div { background: var(--surface-1); border-radius: 6px; padding: 7px 8px; }
            .champ-info-grid span { display:block; font-family:Orbitron; font-size:8px; color:var(--gray-500); text-transform:uppercase; letter-spacing:1px; }
            .champ-info-grid b { font-family:Rajdhani; font-size:13px; color:var(--white); }
            .hq-level-summary { display:grid; grid-template-columns:repeat(2,1fr); gap:4px; margin-top:6px; }
            .hq-level-summary span { background:rgba(255,215,0,.08); color:#FFD700; border:1px solid rgba(255,215,0,.18); border-radius:4px; padding:3px 5px; font-family:Orbitron; font-size:8px; text-align:center; }
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
            .sponsor-card-content {
                display: grid;
                grid-template-columns: minmax(230px, 0.9fr) minmax(360px, 1.4fr);
                gap: 18px;
                align-items: stretch;
                min-height: 178px;
            }
            .sponsor-primary-panel {
                background: linear-gradient(135deg, rgba(255,215,0,0.12), rgba(0,0,0,0.28));
                border: 1px solid rgba(255,215,0,0.32);
                border-radius: 12px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .sponsor-main-name {
                font-family: Orbitron;
                font-size: clamp(18px, 1.7vw, 26px);
                line-height: 1.1;
                font-weight: 900;
                color: #FFD700;
                margin: 8px 0;
                overflow-wrap: anywhere;
            }
            .sponsor-meta-line {
                font-family: Orbitron;
                font-size: 10px;
                color: var(--gray-400);
                letter-spacing: 1px;
            }
            .sponsor-detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            .sponsor-detail-row {
                background: var(--surface-1);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 10px 12px;
                min-height: 58px;
            }
            .sponsor-detail-row span {
                display: block;
                font-family: Orbitron;
                font-size: 9px;
                color: var(--gray-500);
                letter-spacing: 1px;
                text-transform: uppercase;
                margin-bottom: 5px;
            }
            .sponsor-detail-row b {
                font-family: Rajdhani;
                font-size: 15px;
                line-height: 1.05;
                color: var(--white);
                overflow-wrap: anywhere;
            }
            .quick-actions-card .card-label { text-align: center; margin-bottom: 14px; }
            .action-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 12px;
                align-items: stretch;
            }
            .action-btn {
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
                padding: 14px 12px;
                min-height: 106px;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white; text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
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
                display: flex; flex-direction: column; gap: 6px;
                max-height: 420px; overflow-y: auto;
            }
            .calendar-row {
                display: grid;
                grid-template-columns: 42px 28px 64px minmax(210px,1fr) 78px 78px 72px;
                align-items: center;
                gap: 10px;
                padding: 8px 10px;
                background: linear-gradient(135deg, rgba(20,20,28,.82), rgba(8,8,12,.94));
                border: 1px solid rgba(255,255,255,.07);
                border-radius: 10px;
                font-size: 12px;
                min-height: 74px;
                transition: .2s ease;
            }
            .calendar-row.past { opacity: 0.62; }
            .calendar-row.current {
                background: linear-gradient(135deg, rgba(0,255,65,0.13), rgba(0,128,255,0.08));
                border: 1px solid var(--green);
                box-shadow: 0 0 18px rgba(0,255,65,.16), inset 0 0 18px rgba(0,255,65,.04);
            }
            .calendar-row.current:hover { transform: translateY(-1px); }
            .cal-round {
                font-family: 'Orbitron'; font-weight: 900;
                color: var(--gray-500); width: 36px;
            }
            .cal-flag { font-size: 18px; }
            .cal-track-mini-layout { width: 62px; height: 42px; border-radius: 8px; background: rgba(0,0,0,.34); border: 1px solid rgba(0,212,255,.18); display:flex; align-items:center; justify-content:center; overflow:hidden; }
            .cal-track-mini-layout svg { width: 95%; height: 95%; filter: drop-shadow(0 0 5px rgba(0,212,255,.5)); }
            .cal-name { min-width: 0; font-family: 'Rajdhani'; }
            .cal-track-title { font-weight: 800; font-size: 14px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .cal-track-info { font-size: 10px; color: var(--gray-500); text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }
            .cal-distance, .cal-laps { font-family: Orbitron; font-size: 10px; color: var(--gray-300); text-align: center; }
            .cal-status { text-align: center; }
            .cal-result {
                font-family: 'Orbitron'; font-weight: 800;
                color: var(--green);
            }
            .cal-next {
                font-family: 'Orbitron'; font-weight: 800;
                color: var(--green); font-size: 10px;
                background: rgba(0,255,65,0.2);
                padding: 4px 8px; border-radius: 999px;
            }
            .cal-upcoming { color: var(--gray-700); }
            @media (max-width: 1200px) {
                .sponsor-dashboard-card { grid-column: 1 / -1; }
                .sponsor-card-content { grid-template-columns: 1fr 1.35fr; }
                .action-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            }
            @media (max-width: 860px) {
                .sponsor-card-content { grid-template-columns: 1fr; }
                .sponsor-detail-grid { grid-template-columns: 1fr 1fr; }
                .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .calendar-row { grid-template-columns: 38px 26px 62px minmax(150px,1fr) 68px 68px 64px; }
            }
            @media (max-width: 520px) {
                .sponsor-detail-grid { grid-template-columns: 1fr; }
                .action-grid { grid-template-columns: 1fr; }
                .next-race-track-preview { height: 74px; }
                .calendar-row { grid-template-columns: 34px 24px 58px 1fr 54px; gap: 7px; }
                .cal-distance, .cal-status { display: none; }
                .cal-track-info { font-size: 9px; }
            }

            /* === PREMIUM ACADEMY / MARKET REFINEMENTS === */
            .academy-hub { display:flex; flex-direction:column; gap:16px; font-family:Rajdhani; }
            .academy-command-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
            .academy-stat { background:linear-gradient(135deg,rgba(0,191,255,.12),rgba(0,0,0,.35)); border:1px solid rgba(0,191,255,.28); border-radius:12px; padding:14px; }
            .academy-stat span { display:block; font-family:Orbitron; font-size:9px; color:var(--gray-500); letter-spacing:1px; text-transform:uppercase; }
            .academy-stat b { font-family:Orbitron; color:#00BFFF; font-size:20px; }
            .featured-prospect-card { display:grid; grid-template-columns:86px 1fr 160px; gap:16px; align-items:center; background:linear-gradient(135deg,rgba(0,255,65,.08),rgba(0,128,255,.08),rgba(0,0,0,.45)); border:1px solid rgba(0,255,65,.32); border-radius:16px; padding:18px; }
            .prospect-avatar { width:76px; height:76px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:38px; background:rgba(255,255,255,.06); border:2px solid rgba(0,191,255,.4); }
            .prospect-main h2 { font-family:Orbitron; margin:4px 0; }
            .prospect-sub { color:var(--gray-300); font-weight:700; }
            .prospect-potential { color:#FFD700; font-family:Orbitron; font-size:12px; margin-top:4px; }
            .academy-traits { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
            .academy-traits span { background:rgba(255,215,0,.12); color:#FFD700; border:1px solid rgba(255,215,0,.3); border-radius:999px; padding:3px 8px; font-size:10px; font-family:Orbitron; }
            .trend-box { background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; text-align:center; }
            .trend-box span { display:block; font-family:Orbitron; font-size:9px; color:var(--gray-500); }
            .trend-box b { color:#00FF41; font-family:Orbitron; }
            .academy-filter-row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; font-family:Orbitron; font-size:10px; color:var(--gray-400); }
            .academy-table-wrap { overflow:auto; border:1px solid rgba(255,255,255,.08); border-radius:12px; }
            .academy-table { width:100%; border-collapse:collapse; font-size:13px; }
            .academy-table th { font-family:Orbitron; color:var(--gray-500); font-size:10px; text-align:left; padding:10px; background:rgba(255,255,255,.04); }
            .academy-table td { padding:10px; border-top:1px solid rgba(255,255,255,.05); }
            .scouting-command { display:grid; grid-template-columns:220px 1fr; gap:14px; background:var(--surface-1); border-radius:12px; padding:14px; }
            .scout-region-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
            .scouting-reports-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
            .scout-report-card { background:rgba(255,215,0,.06); border:1px solid rgba(255,215,0,.25); border-radius:12px; padding:12px; }
            .report-prospect { display:flex; justify-content:space-between; gap:8px; margin-top:8px; font-size:12px; }
            .market-command-bar { display:flex; justify-content:space-between; gap:16px; align-items:center; background:linear-gradient(135deg,rgba(0,128,255,.14),rgba(0,255,65,.08)); border:1px solid rgba(0,128,255,.32); border-radius:14px; padding:14px; }
            .market-kicker { font-family:Orbitron; color:#00BFFF; font-size:10px; font-weight:900; letter-spacing:2px; text-transform:uppercase; }
            .market-controls-row { display:flex; gap:10px; flex-wrap:wrap; }
            .market-section-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; font-family:Orbitron; font-size:10px; color:#FFD700; text-align:center; }
            .market-section-tabs span { background:rgba(255,215,0,.08); border:1px solid rgba(255,215,0,.22); border-radius:8px; padding:8px; }
            .market-comparison-panel { display:none; background:rgba(0,0,0,.35); border:1px solid rgba(255,255,255,.1); border-radius:12px; padding:12px; }
            .market-comparison-panel.active { display:block; }
            .market-comparison-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:8px; }
            .compare-card { background:var(--surface-1); border-radius:10px; padding:10px; display:flex; flex-direction:column; gap:4px; font-family:Orbitron; font-size:10px; }
            .market-pro-driver-card { background:linear-gradient(135deg,rgba(20,20,28,.88),rgba(8,8,12,.97)); border:1px solid rgba(0,128,255,.45); border-radius:14px; padding:14px; display:flex; flex-direction:column; gap:10px; transition:.2s ease; }
            .market-pro-driver-card:hover { transform:translateY(-3px); border-color:#00FF41; box-shadow:0 10px 30px rgba(0,255,65,.08); }
            .market-pro-driver-card.disabled { opacity:.55; }
            .market-card-topline,.market-card-hero { display:flex; justify-content:space-between; align-items:center; gap:10px; }
            .compare-chip { font-family:Orbitron; font-size:9px; color:var(--gray-400); }
            .interest-badge { font-family:Orbitron; font-size:9px; border-radius:999px; padding:3px 8px; background:rgba(255,215,0,.12); color:#FFD700; }
            .interest-badge.high { color:#00FF41; background:rgba(0,255,65,.12); }
            .interest-badge.low { color:var(--gray-400); }
            .market-driver-flag { font-size:32px; }
            .market-driver-main { flex:1; min-width:0; }
            .market-driver-name { font-family:Orbitron; font-weight:900; color:#fff; font-size:16px; }
            .market-driver-sub { font-size:12px; color:var(--gray-400); }
            .market-ovr-pill { width:58px;height:58px;border-radius:50%;border:2px solid #00FF41; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#00FF41; font-family:Orbitron; font-weight:900; }
            .market-ovr-pill span { font-size:8px; color:var(--gray-500); }
            .market-card-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
            .market-card-grid div { background:rgba(255,255,255,.04); border-radius:8px; padding:8px; }
            .market-card-grid span { display:block; font-family:Orbitron; font-size:8px; color:var(--gray-500); text-transform:uppercase; }
            .market-card-grid b { color:#fff; }
            .market-trait-line { color:#FFD700; font-size:11px; min-height:16px; }
            @media(max-width:900px){ .academy-command-row,.featured-prospect-card,.scouting-command,.scouting-reports-grid,.market-command-bar{grid-template-columns:1fr; display:grid;} .scout-region-grid,.market-comparison-grid{grid-template-columns:1fr;} }

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

    function isPageActive() { return isActive; }

    function destroy() { isActive = false; }

    return { init, render, isPageActive, destroy };
})();