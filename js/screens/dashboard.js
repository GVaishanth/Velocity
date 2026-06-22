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
        const { primary: teamPrimary, secondary: teamSecondary, accent: teamAccent } = getTeamPalette(career);
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
            <div class="dashboard-container" style="--team-primary:${teamPrimary}; --team-secondary:${teamSecondary}; --team-accent:${teamAccent};">
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
                        <div class="next-race-hero">
                            <div class="next-race-content">
                                <div class="next-race-flag">${nextTrack.flag}</div>
                                <div class="next-race-header-copy">
                                    <div class="next-race-name">${escapeHTML(nextTrack.name)}</div>
                                    <div class="next-race-country">${formatNextRaceLocation(nextTrack)}</div>
                                </div>
                            </div>

                            <div class="next-race-track-shell">
                                <div class="next-race-track-label">CIRCUIT TELEMETRY</div>
                                ${renderTrackPreview(nextTrack, career)}
                            </div>
                        </div>

                        <div class="next-race-stats">
                            <div class="race-stat">
                                <div class="race-stat-label">Weather</div>
                                <div class="race-stat-value">${nextTrack.rainProbability}%</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Laps</div>
                                <div class="race-stat-value">${nextTrack.laps}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Length</div>
                                <div class="race-stat-value race-stat-value-length">${formatTrackLength(nextTrack.length)}</div>
                            </div>
                            <div class="race-stat">
                                <div class="race-stat-label">Weekend</div>
                                <div class="race-stat-value" style="font-size: 12px;">${formatWeekendType(nextTrack.type)}</div>
                            </div>
                        </div>

                        ${isMulti ? `
                            <div class="next-race-actions">
                                <div class="next-race-readiness-block">
                                    <div class="next-race-readiness-label">CONSTRUCTOR READINESS (${onlinePlayers.filter(p => p.isReadyForWeekend).length}/${onlinePlayers.length})</div>
                                    <div class="next-race-readiness-dots">
                                        ${onlinePlayers.map(p => `<div style="width: 8px; height: 8px; border-radius: 50%; background: ${p.isReadyForWeekend ? 'var(--green)' : 'var(--gray-700)'};" title="${p.username}"></div>`).join('')}
                                    </div>
                                </div>
                                <button class="btn btn-full ${myReady ? 'btn-danger' : 'btn-glow'}" id="db-mp-ready" style="font-family: Orbitron; font-weight: 900;">
                                    ${myReady ? 'CANCEL READY' : '✓ READY FOR WEEKEND'}
                                </button>
                                <button class="btn btn-primary btn-full btn-large" id="db-enter-race" ${!everyoneReady ? 'disabled' : ''} style="${!everyoneReady ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                    ${everyoneReady ? '🏁 LAUNCH RACE WEEKEND' : '⌛ WAITING FOR GRID...'}
                                </button>
                            </div>
                        ` : `
                            <div class="next-race-actions">
                                <button class="btn btn-primary btn-full btn-large" id="db-enter-race">
                                    🏁 ENTER RACE WEEKEND
                                </button>
                            </div>
                        `}
                    ` : '<div>No upcoming races</div>'}
                </div>

                <!-- TEAM STATS -->
                <div class="dashboard-card dashboard-team-performance-card">
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
                <div class="dashboard-card dashboard-standings-card">
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
                            <div class="action-label team-action-label">Media Press Room</div>
                            <div class="action-sub">Resolve Live Mid-Week Dilemmas</div>
                        </button>
                        <button class="action-btn" id="db-livery">
                            <div class="action-icon">🎨</div>
                            <div class="action-label team-action-label">Livery Editor</div>
                            <div class="action-sub">${career.livery?.changesThisSeason || 0}/2 Changes Used</div>
                        </button>
                        <button class="action-btn" id="db-academy">
                            <div class="action-icon">🌱</div>
                            <div class="action-label team-action-label">Driver Academy</div>
                            <div class="action-sub">${career.academy?.drivers?.length || 0} Prospects • Reserve ${career.academy?.reserveDriver ? 'Ready' : 'Empty'}</div>
                        </button>

                    </div>
                </div>

                <!-- TEAM HEADQUARTERS -->
                <div class="dashboard-card headquarters-dashboard-card">
                    <div class="card-label">TEAM HEADQUARTERS</div>
                    <div class="standings-summary">
                        <div class="standing-block hq-summary-block">
                            <div class="standing-label">FACILITY RATING</div>
                            <div class="standing-position hq-rating-value">${getFacilityRating(career)}</div>
                            <div class="standing-points">${getActiveUpgrades(career).length} upgrades active</div>
                        </div>
                        <div class="driver-standings-mini">
                            <div class="driver-standing-row">
                                <span class="driver-name-mini">Next Completion</span>
                                <span class="driver-pts">${getNextCompletionDays(career) === null ? '—' : `${getNextCompletionDays(career)} Days`}</span>
                            </div>
                            <div class="driver-standing-row">
                                <span class="driver-name-mini">Budget</span>
                                <span class="driver-pts hq-budget-value">$${formatMoney(career.budget)}</span>
                            </div>
                            <div class="driver-standing-row">
                                <span class="driver-name-mini">Maintenance</span>
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
            if (typeof TeamReportsModule !== 'undefined') TeamReportsModule.advanceToNextSeason();
        });

        container.querySelector('#db-rd')?.addEventListener('click', () => {
            if (typeof RDModule !== 'undefined') RDModule.open();
        });

        container.querySelector('#db-market')?.addEventListener('click', () => {
            if (typeof DriverMarketModule !== 'undefined') DriverMarketModule.open();
        });

        container.querySelector('#db-standings')?.addEventListener('click', () => {
            if (typeof TeamReportsModule !== 'undefined') TeamReportsModule.openStandings();
        });

        container.querySelector('#db-team')?.addEventListener('click', () => {
            if (typeof TeamReportsModule !== 'undefined') TeamReportsModule.openTeam();
        });

        container.querySelector('#db-history')?.addEventListener('click', () => {
            if (typeof TeamReportsModule !== 'undefined') TeamReportsModule.openHistory();
        });

        container.querySelector('#db-open-sponsors')?.addEventListener('click', () => {
            if (typeof SponsorsModule !== 'undefined') SponsorsModule.open();
        });

        container.querySelector('#db-media')?.addEventListener('click', () => {
            if (typeof showMediaPressRoomModal === 'function') showMediaPressRoomModal();
        });

        container.querySelector('#db-livery')?.addEventListener('click', () => {
            showLiveryEditorModal();
        });
        container.querySelector('#db-academy')?.addEventListener('click', () => {
            if (typeof DriverAcademyModule !== 'undefined') DriverAcademyModule.open();
        });
        container.querySelector('#db-open-hq')?.addEventListener('click', () => {
            EventBus.emit('nav:go', { screen: 'headquarters', color: '#FFD700' });
        });
    }

    function showLiveryEditorModal() {
        const career = StateManager.get('career');
        if (!career) return;

        const safeLivery = getSafeLiveryConfig(career);
        const LIVERY_UPDATE_COST = 5000000; // $5M
        const MAX_CHANGES = 2;
        const canChange = safeLivery.changesThisSeason < MAX_CHANGES && career.budget >= LIVERY_UPDATE_COST;
        const previewSVG = window.CarSVGUtils?.getFuturisticCarSVG({
            primary: safeLivery.primary,
            secondary: safeLivery.secondary,
            accent: safeLivery.accent,
            mode: 'livery'
        }) || '';

        Modals.open({
            title: `🎨 LIVERY EDITOR — SESSION USAGE: ${safeLivery.changesThisSeason}/${MAX_CHANGES}`,
            className: 'modal-lg',
            body: `
                <div style="display: flex; flex-direction: column; gap: 20px; font-family: 'Rajdhani', sans-serif;">
                    <p style="color: var(--gray-300); font-size: 15px; border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px;">
                        Redesign your Constructor's visual identity. Official FIA regulations limit major livery overhauls to <b>twice per season</b>.
                    </p>

                    <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px;">
                        <div style="background: #050505; border: 2px solid var(--border-subtle); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; overflow: hidden;">
                            <div style="font-family: Orbitron; font-size: 10px; color: var(--gray-500); position: absolute; top: 10px; left: 10px;">LIVE WIND TUNNEL PREVIEW</div>
                            <div id="livery-car-preview-container" style="width: 100%;">${previewSVG}</div>

                            <div style="margin-top: 20px; display: flex; gap: 10px;">
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${safeLivery.primary}; border: 1px solid white;" id="swatch-p"></div>
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${safeLivery.secondary}; border: 1px solid white;" id="swatch-s"></div>
                                <div style="width: 30px; height: 30px; border-radius: 4px; background: ${safeLivery.accent}; border: 1px solid white;" id="swatch-a"></div>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 15px;">
                            <div class="form-group">
                                <label class="form-label">PRIMARY COLOR (BODY)</label>
                                <input type="color" class="input" id="livery-primary" value="${safeLivery.primary}" style="height: 40px; padding: 2px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">SECONDARY COLOR (SIDEPODS)</label>
                                <input type="color" class="input" id="livery-secondary" value="${safeLivery.secondary}" style="height: 40px; padding: 2px;">
                            </div>
                            <div class="form-group">
                                <label class="form-label">ACCENT COLOR (NOSE)</label>
                                <input type="color" class="input" id="livery-accent" value="${safeLivery.accent}" style="height: 40px; padding: 2px;">
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 4px solid #FF00FF;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <div style="font-family: Orbitron; font-size: 12px; font-weight: 900; color: #FFF;">MODIFICATION COST: <span style="color: var(--red);">$${formatMoney(LIVERY_UPDATE_COST)}</span></div>
                                <div style="font-size: 11px; color: var(--gray-400);">Current Budget: $${formatMoney(career.budget)}</div>
                            </div>
                            ${safeLivery.changesThisSeason >= MAX_CHANGES
                                ? `<span style="color: var(--red); font-family: Orbitron; font-weight: 900; font-size: 12px;">SEASON LIMIT REACHED</span>`
                                : (career.budget < LIVERY_UPDATE_COST
                                    ? `<span style="color: var(--red); font-family: Orbitron; font-weight: 900; font-size: 12px;">INSUFFICIENT FUNDS</span>`
                                    : `<button class="btn btn-glow" id="btn-apply-livery" style="border-color: #FF00FF; color: #FF00FF;">APPLY OVERHAUL</button>`)
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
                const previewContainer = document.getElementById('livery-car-preview-container');

                const updatePreview = () => {
                    const previewLivery = getSafeLiveryConfig(career, {
                        primary: pInput?.value,
                        secondary: sInput?.value,
                        accent: aInput?.value,
                        pattern: safeLivery.pattern,
                        changesThisSeason: safeLivery.changesThisSeason
                    });

                    if (sP) sP.style.backgroundColor = previewLivery.primary;
                    if (sS) sS.style.backgroundColor = previewLivery.secondary;
                    if (sA) sA.style.backgroundColor = previewLivery.accent;
                    if (previewContainer && window.CarSVGUtils?.getFuturisticCarSVG) {
                        previewContainer.innerHTML = window.CarSVGUtils.getFuturisticCarSVG({
                            primary: previewLivery.primary,
                            secondary: previewLivery.secondary,
                            accent: previewLivery.accent,
                            mode: 'livery'
                        });
                    }
                };

                pInput?.addEventListener('input', updatePreview);
                sInput?.addEventListener('input', updatePreview);
                aInput?.addEventListener('input', updatePreview);

                document.getElementById('btn-apply-livery')?.addEventListener('click', () => {
                    const newLivery = getSafeLiveryConfig(career, {
                        primary: pInput?.value,
                        secondary: sInput?.value,
                        accent: aInput?.value,
                        pattern: 'solid',
                        changesThisSeason: safeLivery.changesThisSeason + 1
                    });

                    career.budget -= LIVERY_UPDATE_COST;
                    career.livery = newLivery;
                    StateManager.set('career', career);
                    StateManager.saveGame();

                    if (typeof AudioManager !== 'undefined') AudioManager.uiConfirm();
                    Notifications.success('Livery Updated!', 'Constructor visual identity synchronized.');

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

    function getSafeLiveryConfig(career, override = null) {
        const baseTeam = career?.team || {};
        const sourceLivery = override || career?.livery || {};
        if (window.CarSVGUtils?.normalizeLivery) {
            const normalized = window.CarSVGUtils.normalizeLivery(sourceLivery, baseTeam);
            return {
                ...normalized,
                changesThisSeason: Number.isFinite(sourceLivery?.changesThisSeason)
                    ? sourceLivery.changesThisSeason
                    : Number.isFinite(career?.livery?.changesThisSeason)
                        ? career.livery.changesThisSeason
                        : 0,
                pattern: sourceLivery?.pattern || career?.livery?.pattern || 'solid'
            };
        }
        return {
            primary: baseTeam?.color || '#FF0000',
            secondary: '#FFFFFF',
            accent: '#000000',
            pattern: sourceLivery?.pattern || 'solid',
            changesThisSeason: Number.isFinite(sourceLivery?.changesThisSeason) ? sourceLivery.changesThisSeason : 0
        };
    }

    function getTeamPalette(career) {
        const livery = getSafeLiveryConfig(career);
        return {
            primary: livery.primary,
            secondary: livery.secondary,
            accent: livery.accent
        };
    }

    function formatTrackLength(length) {
        const numericLength = Number(length);
        if (!Number.isFinite(numericLength)) return '—';
        return `${numericLength.toFixed(3)} km`;
    }

    function formatWeekendType(type) {
        if (!type) return 'Standard';
        return type.replace(/_/g, ' ');
    }

    function formatNextRaceLocation(track) {
        if (!track) return '—';
        return [track.country, track.city, formatTrackLength(track.length)]
            .filter(value => value && value !== '—')
            .join(' • ');
    }

    function renderMiniTrackLayout(track, career) {
        const { primary, accent } = getTeamPalette(career);
        const svg = window.TrackDisplayUtils?.renderMiniTrackSvg(track, { main: primary, accent }) || '';
        return `
            <div class="cal-track-mini-layout">
                ${svg}
            </div>`;
    }

    function renderTrackPreview(track, career) {
        if (!track?.svgPath) return '';
        const { secondary, accent } = getTeamPalette(career);
        const svg = window.TrackDisplayUtils?.renderDashboardTrackSvg(track, { main: secondary, accent }) || '';
        return `
            <div class="next-race-track-preview" title="${escapeHTML(track.name)} layout">
                ${svg}
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
                color: var(--team-primary, var(--green)); font-weight: 700;
            }
            .dashboard-main-grid {
                display: grid;
                grid-template-columns: 1.5fr 1fr 1fr;
                grid-template-areas:
                    "next performance standings"
                    "next headquarters actions"
                    "sponsors sponsors sponsors"
                    "calendar calendar calendar";
                grid-auto-rows: auto;
                gap: var(--space-lg);
                align-items: stretch;
            }
            @media (max-width: 1200px) {
                .dashboard-main-grid {
                    grid-template-columns: 1.15fr 1fr;
                    grid-template-areas:
                        "next performance"
                        "next standings"
                        "headquarters actions"
                        "sponsors sponsors"
                        "calendar calendar";
                }
            }
            @media (max-width: 700px) {
                .dashboard-main-grid {
                    grid-template-columns: 1fr;
                    grid-template-areas:
                        "next"
                        "performance"
                        "standings"
                        "headquarters"
                        "actions"
                        "sponsors"
                        "calendar";
                }
            }
            .dashboard-card {
                background: var(--surface-glass);
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 18%, var(--border-subtle));
                border-radius: var(--radius-lg);
                padding: 20px;
                min-height: 100%;
                display: flex;
                flex-direction: column;
            }
            .dashboard-card > .card-label {
                font-family: 'Orbitron';
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                text-transform: uppercase;
                color: var(--gray-400);
                line-height: 1.1;
                margin-bottom: 14px;
            }
            .dashboard-card > .card-header-row {
                margin-bottom: 14px;
            }
            .dashboard-card .btn {
                min-height: 44px;
                padding: 11px 16px;
                border-radius: 10px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                line-height: 1;
            }
            .dashboard-card .btn-large {
                min-height: 54px;
                padding: 13px 18px;
            }
            .dashboard-card .btn-full {
                width: 100%;
            }
            .btn-glow { border-color: var(--team-primary, #00FF41); color: var(--team-primary, #00FF41); }
            .dashboard-next-race { grid-area: next; overflow: hidden; }
            .dashboard-team-performance-card { grid-area: performance; }
            .dashboard-standings-card { grid-area: standings; }
            .headquarters-dashboard-card { grid-area: headquarters; }
            .quick-actions-card { grid-area: actions; width: 100%; justify-self: stretch; align-self: stretch; }
            .sponsor-dashboard-card { grid-area: sponsors; min-height: 0; width: 100%; }
            .calendar-card { grid-area: calendar; width: 100%; }
            .card-header-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            .card-badge {
                font-family: 'Orbitron'; font-size: 10px;
                padding: 3px 8px;
                background: color-mix(in srgb, var(--team-primary, #00FF41) 15%, transparent);
                color: var(--team-primary, var(--green)); border-radius: 4px;
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 28%, transparent);
                letter-spacing: 1px;
                line-height: 1.1;
                white-space: nowrap;
            }
            .dashboard-next-race {
                min-height: 100%;
                display: flex;
                flex-direction: column;
            }
            .next-race-hero {
                display: flex;
                flex-direction: column;
                gap: 10px;
                flex: 1;
                min-height: 0;
                margin-bottom: 12px;
            }
            .next-race-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 0;
            }
            .next-race-header-copy {
                min-width: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .next-race-flag {
                font-size: 32px;
                line-height: 1;
                flex-shrink: 0;
                margin-top: 1px;
            }
            .next-race-name {
                font-family: 'Orbitron';
                font-weight: 800;
                font-size: 19px;
                letter-spacing: 1.4px;
                line-height: 1.08;
                color: var(--white);
                text-shadow: 0 0 14px color-mix(in srgb, var(--team-accent, #FFFFFF) 12%, transparent);
            }
            .next-race-country {
                font-family: 'Rajdhani';
                font-size: 11.5px;
                color: var(--gray-500);
                line-height: 1.28;
                letter-spacing: 0.2px;
            }
            .next-race-track-shell {
                display: flex;
                flex-direction: column;
                gap: 7px;
                flex: 1;
                min-height: 0;
                padding: 8px;
                border-radius: 14px;
                background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 10%, transparent);
            }
            .next-race-track-label {
                font-family: 'Orbitron';
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 2.2px;
                color: var(--gray-500);
                text-transform: uppercase;
                line-height: 1;
                padding-left: 2px;
            }
            .next-race-track-preview {
                width: 100%;
                height: 84px;
                min-height: 84px;
                margin: 0;
                padding: 3px;
                border-radius: 12px;
                background: var(--black);
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 38%, transparent);
                box-shadow:
                    inset 0 0 0 1px color-mix(in srgb, var(--team-accent, #FFFFFF) 10%, transparent),
                    inset 0 0 22px color-mix(in srgb, var(--team-accent, #FFFFFF) 8%, transparent),
                    0 0 14px color-mix(in srgb, var(--team-accent, #FFFFFF) 12%, transparent);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                flex: 1;
                position: relative;
            }
            .next-race-track-preview::before {
                content: '';
                position: absolute;
                inset: 0;
                background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 18%, transparent 82%, rgba(255,255,255,0.02));
                pointer-events: none;
            }
            .next-race-track-preview::after {
                content: '';
                position: absolute;
                inset: 8px;
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 10%, transparent);
                border-radius: 8px;
                pointer-events: none;
            }
            .next-race-track-preview svg {
                width: 100%;
                height: 100%;
                filter: drop-shadow(0 0 10px color-mix(in srgb, var(--team-accent, #FFFFFF) 52%, transparent));
                position: relative;
                z-index: 1;
            }
            .next-race-stats {
                display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 12px;
            }
            .race-stat {
                background: linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02));
                padding: 10px 10px;
                border-radius: 8px;
                text-align: center;
                min-height: 56px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                border: 1px solid rgba(255,255,255,0.06);
            }
            .race-stat-label {
                font-family: 'Orbitron';
                font-size: 8.5px; color: var(--gray-500);
                text-transform: uppercase; letter-spacing: 1.2px;
                line-height: 1.1;
                margin-bottom: 5px;
            }
            .race-stat-value {
                font-family: 'Orbitron';
                font-weight: 800;
                font-size: 14px;
                line-height: 1.05;
                color: var(--white);
            }
            .race-stat-value-length {
                font-size: 12px;
                color: var(--team-accent, var(--white));
            }
            .next-race-readiness-block {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 8px 10px;
                border-radius: 8px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
            }
            .next-race-readiness-label {
                font-family: Orbitron;
                font-size: 10px;
                letter-spacing: 1.2px;
                color: var(--gray-400);
                text-align: center;
            }
            .next-race-readiness-dots {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                justify-content: center;
            }
            .next-race-actions {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: auto;
            }
            .dashboard-next-race #db-enter-race {
                margin-top: 0;
            }
            .team-overall-display {
                display: flex;
                align-items: flex-start;
                gap: 16px;
                flex: 1;
            }
            .overall-circle {
                width: 80px; height: 80px; border-radius: 50%;
                border: 3px solid var(--team-primary, var(--green));
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                background: color-mix(in srgb, var(--team-primary, #00FF41) 8%, transparent);
            }
            .overall-value {
                font-family: 'Orbitron'; font-size: 24px;
                font-weight: 800; color: var(--team-primary, var(--green));
            }
            .overall-label {
                font-size: 8px; color: var(--gray-500);
                letter-spacing: 1px;
            }
            .stats-list { flex: 1; display: flex; flex-direction: column; gap: 8px; }
            .stat-row-mini {
                display: grid;
                grid-template-columns: 74px 1fr 34px;
                align-items: center;
                gap: 10px;
                font-size: 11px;
                min-height: 20px;
            }
            .stat-row-label {
                font-family: 'Rajdhani'; color: var(--gray-400);
                font-size: 10px;
                line-height: 1.2;
            }
            .stat-row-value {
                font-family: 'Orbitron'; font-weight: 700;
                text-align: right;
                line-height: 1;
            }
            .standings-summary {
                display: flex;
                flex-direction: column;
                gap: 12px;
                flex: 1;
            }
            .standing-block {
                background: var(--surface-1);
                padding: 14px 16px;
                border-radius: var(--radius-md);
                text-align: center;
            }
            .standing-label {
                font-family: 'Orbitron';
                font-size: 10px; color: var(--gray-500);
                letter-spacing: 2px; text-transform: uppercase;
                line-height: 1.1;
            }
            .standing-position {
                font-family: 'Orbitron'; font-size: 32px;
                font-weight: 800; color: var(--team-primary, var(--green));
                margin: 6px 0 4px;
                line-height: 0.95;
            }
            .standing-points {
                font-family: 'Rajdhani'; color: var(--gray-400);
                font-size: 12px;
                line-height: 1.2;
            }
            .team-accent-block { border: 1px solid color-mix(in srgb, var(--team-primary) 55%, transparent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--team-primary) 10%, transparent); }
            .champ-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .champ-info-grid div {
                background: var(--surface-1);
                border-radius: 6px;
                padding: 8px 10px;
                min-height: 48px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .champ-info-grid span { display:block; font-family:Orbitron; font-size:8px; color:var(--gray-500); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
            .champ-info-grid b { font-family:Rajdhani; font-size:13px; color:var(--white); line-height:1.15; }
            .hq-summary-block {
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 30%, transparent);
                box-shadow: inset 0 0 16px color-mix(in srgb, var(--team-accent, #FFFFFF) 8%, transparent);
            }
            .hq-rating-value { color: var(--team-accent, var(--white)); }
            .hq-budget-value { color: var(--team-primary, var(--green)); }
            .hq-level-summary { display:grid; grid-template-columns:repeat(2,1fr); gap:6px; margin-top:6px; }
            .hq-level-summary span {
                background: color-mix(in srgb, var(--team-accent, #FFFFFF) 8%, transparent);
                color: var(--team-accent, var(--white));
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 20%, transparent);
                border-radius:4px; padding:4px 6px; font-family:Orbitron; font-size:8px; text-align:center;
                line-height: 1.2;
            }
            .driver-standings-mini {
                display: flex; flex-direction: column; gap: 6px;
            }
            .driver-standing-row {
                display: flex; align-items: center; gap: var(--space-sm);
                background: var(--surface-1); padding: 8px 10px;
                border-radius: 6px; font-size: 12px;
                min-height: 40px;
            }
            .driver-pos {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--team-primary, var(--green)); width: 30px;
                line-height: 1;
            }
            .driver-name-mini { flex: 1; font-family: 'Rajdhani'; line-height: 1.2; }
            .driver-pts {
                font-family: 'Orbitron'; font-weight: 700;
                color: var(--gray-300);
                line-height: 1;
                text-align: right;
                min-width: 64px;
            }
            .sponsor-card-content {
                display: grid;
                grid-template-columns: minmax(250px, 0.95fr) minmax(0, 2.05fr);
                gap: 16px;
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
                gap: 6px;
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
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
                align-content: start;
            }
            .sponsor-detail-row {
                background: var(--surface-1);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 8px;
                padding: 10px 12px;
                min-height: 60px;
                display: flex;
                flex-direction: column;
                justify-content: center;
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
            .quick-actions-card .card-label { text-align: center; margin-bottom: 12px; }
            .quick-actions-card {
                display: flex;
                flex-direction: column;
            }
            .action-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
                align-items: stretch;
                align-content: stretch;
                grid-auto-rows: minmax(0, 1fr);
                flex: 1;
            }
            .action-btn {
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: 10px;
                padding: 12px 12px;
                min-height: 96px;
                height: 100%;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white; text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 4px;
            }
            .action-btn:hover {
                border-color: var(--team-primary, var(--green));
                background: color-mix(in srgb, var(--team-primary, #00FF41) 7%, transparent);
                box-shadow: 0 0 18px color-mix(in srgb, var(--team-primary, #00FF41) 14%, transparent);
                transform: translateY(-2px);
            }
            .action-icon { font-size: 22px; line-height: 1; }
            .action-label {
                font-family: 'Rajdhani'; font-weight: 700;
                font-size: 12px; letter-spacing: 1px;
                line-height: 1.15;
                min-height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .team-action-label {
                color: var(--team-accent, var(--white));
            }
            .action-btn:hover .team-action-label {
                color: var(--team-primary, var(--white));
            }
            .action-sub {
                font-size: 10px; color: var(--gray-500);
                line-height: 1.3;
                min-height: 26px;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                text-align: center;
            }
            .calendar-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                max-height: 420px;
                overflow-y: auto;
            }
            .calendar-row {
                display: grid;
                grid-template-columns: 42px 28px 64px minmax(210px,1fr) 78px 78px 72px;
                align-items: center;
                gap: 10px;
                padding: 8px 12px;
                background: linear-gradient(135deg, rgba(20,20,28,.82), rgba(8,8,12,.94));
                border: 1px solid rgba(255,255,255,.07);
                border-radius: 10px;
                font-size: 12px;
                min-height: 72px;
                transition: .2s ease;
            }
            .calendar-row > * { min-width: 0; }
            .calendar-row.past { opacity: 0.62; }
            .calendar-row.current {
                background: linear-gradient(135deg, color-mix(in srgb, var(--team-primary, #00FF41) 14%, transparent), color-mix(in srgb, var(--team-accent, #FFFFFF) 8%, transparent));
                border: 1px solid var(--team-primary, var(--green));
                box-shadow: 0 0 18px color-mix(in srgb, var(--team-primary, #00FF41) 18%, transparent), inset 0 0 18px color-mix(in srgb, var(--team-accent, #FFFFFF) 6%, transparent);
            }
            .calendar-row.current:hover { transform: translateY(-1px); }
            .cal-round {
                font-family: 'Orbitron'; font-weight: 900;
                color: var(--gray-500); width: 36px;
                text-align: center;
                justify-self: center;
                line-height: 1;
            }
            .cal-flag { font-size: 18px; line-height: 1; justify-self: center; }
            .cal-track-mini-layout {
                width: 62px; height: 42px; border-radius: 8px; background: rgba(0,0,0,.34);
                border: 1px solid color-mix(in srgb, var(--team-accent, #FFFFFF) 20%, transparent);
                display:flex; align-items:center; justify-content:center; overflow:hidden;
            }
            .cal-track-mini-layout svg {
                width: 95%; height: 95%; filter: drop-shadow(0 0 5px color-mix(in srgb, var(--team-accent, #FFFFFF) 45%, transparent));
            }
            .cal-name {
                min-width: 0;
                font-family: 'Rajdhani';
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .cal-track-title { font-weight: 800; font-size: 14px; color: var(--white); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.15; }
            .cal-track-info { font-size: 10px; color: var(--gray-500); text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; line-height: 1.15; }
            .cal-distance, .cal-laps { font-family: Orbitron; font-size: 10px; color: var(--gray-300); text-align: center; line-height: 1.2; }
            .cal-status {
                text-align: center;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 24px;
            }
            .cal-result {
                font-family: 'Orbitron'; font-weight: 800;
                color: var(--team-primary, var(--green));
                text-shadow: 0 0 10px color-mix(in srgb, var(--team-primary, #00FF41) 22%, transparent);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 48px;
                line-height: 1;
            }
            .cal-next {
                font-family: 'Orbitron'; font-weight: 800;
                color: var(--team-primary, var(--green)); font-size: 10px;
                background: color-mix(in srgb, var(--team-primary, #00FF41) 18%, transparent);
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 26%, transparent);
                padding: 4px 8px; border-radius: 999px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 56px;
                line-height: 1;
            }
            .cal-upcoming {
                color: var(--gray-700);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 48px;
                line-height: 1;
            }
            @media (max-width: 1200px) {
                .sponsor-card-content { grid-template-columns: minmax(240px, 0.95fr) minmax(0, 1.75fr); }
                .sponsor-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            }
            @media (max-width: 860px) {
                .dashboard-card { padding: 18px; }
                .team-overall-display { flex-direction: column; gap: 14px; }
                .next-race-track-shell { padding: 8px; }
                .next-race-track-preview {
                    height: 74px;
                    min-height: 74px;
                }
                .sponsor-card-content { grid-template-columns: 1fr; }
                .sponsor-detail-grid { grid-template-columns: 1fr 1fr; }
                .calendar-row { grid-template-columns: 38px 26px 62px minmax(150px,1fr) 68px 68px 64px; }
            }
            @media (max-width: 700px) {
                .dashboard-container { padding: var(--space-lg); }
                .dashboard-card { padding: 16px; }
                .next-race-content { gap: 10px; }
                .next-race-flag { font-size: 28px; }
                .next-race-track-shell { padding: 7px; }
                .sponsor-detail-grid { grid-template-columns: 1fr; }
                .action-grid { grid-template-columns: 1fr; }
                .next-race-track-preview {
                    height: 58px;
                    min-height: 58px;
                }
                .calendar-row { grid-template-columns: 34px 24px 58px 1fr 54px; gap: 7px; }
                .cal-distance, .cal-status { display: none; }
                .cal-track-info { font-size: 9px; }
            }

        `;
        document.head.appendChild(style);
    }

    function isPageActive() { return isActive; }

    function destroy() { isActive = false; }

    return { init, render, isPageActive, destroy };
})();