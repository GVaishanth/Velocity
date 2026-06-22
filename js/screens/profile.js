/* ============================================
   VELOCITY — VIP PROFILE SCREEN (REMODELED)
   Absolute Masterpiece Remodel with Esport Super License,
   Elite Trophy Showcase, Cybernetic Aptitude Radar, Storage Sync
   ============================================ */

window.ProfileScreen = (() => {

    let container = null;
    let isActive = false;
    let currentTab = 'overview';
    let historySeason = null;
    let historyView = 'standings';
    let historyFocus = { type: 'driver', id: null };

    /**
     * Initialize the profile screen
     */
    function init() {
        container = document.getElementById('profile-content');
        if (!container) return;
        attachListeners();
    }

    /**
     * Main rendering execution loop
     */
    function render() {
        if (!container) return;

        // Load active player profile
        const profile = StateManager.loadProfile?.() || StateManager.get('profile') || {};
        const levelData = getLevelProgress(profile.xp || 0);
        const trophyStats = getAchievementStats(profile);

        const usernameDisplay = profile.username || 'RACER_01';
        const userTitleDisplay = profile.userTitle || 'ELITE CONSTRUCTOR';
        const avatarDisplay = profile.avatar || '🪖';

        container.innerHTML = `
            <div class="profile-container">
                <!-- Universal invincible stacking Home button -->
                <button class="home-btn" id="profile-home-btn" title="Back to Home">⌂</button>

                <!-- HOLOGRAPHIC VIP SUPER LICENSE HEADER (Towering 3X Showcase) -->
                <div class="profile-vip-license" style="padding: 56px 64px; display: flex; flex-direction: column; gap: 36px; min-height: 440px; background: linear-gradient(135deg, rgba(20,20,30,0.92), rgba(8,8,14,0.98)); border: 4px solid #0080FF; border-radius: 28px; box-shadow: 0 0 60px rgba(0,128,255,0.4), inset 0 0 40px rgba(0,128,255,0.2); margin-top: 55px !important;">
                    <!-- High-Tech Paddock Security Overlay & ESport Stamp -->
                    <div class="license-security-stamp" style="top: 36px; right: 48px;">
                        <div class="security-barcode" style="font-size: 56px; letter-spacing: 4px;">VELOCITY-FIA-99</div>
                        <div class="security-serial" style="font-size: 12px; letter-spacing: 6px; color: var(--yellow);">SUPER LICENSE • SECURE FIA UPLINK</div>
                    </div>

                    <!-- Upper Tier: Massive Identity Studio Flexboard -->
                    <div class="identity-upper-tier" style="display: flex; align-items: center; gap: 48px; width: 100%; flex-wrap: wrap;">
                        <!-- Custom Esport Towering Emblem Dock -->
                        <div class="license-avatar-dock massive-dock" id="vip-avatar-dock" title="Customize Credentials Studio" style="width: 200px; height: 200px; flex-shrink: 0; cursor: pointer;">
                            <div class="avatar-hexagon-frame" style="font-size: 100px; border-width: 6px; box-shadow: 0 0 40px rgba(0,128,255,0.6), inset 0 0 30px rgba(0,128,255,0.4);">
                                <span id="active-avatar-icon">${escapeHTML(avatarDisplay)}</span>
                            </div>
                            <div class="avatar-edit-overlay" style="font-size: 13px; padding: 10px 0; font-weight: 900; letter-spacing: 3px;">✏️ CUSTOMIZE EMBLEM</div>
                        </div>

                        <!-- Towering Paddock Player Identity -->
                        <div class="player-identity-matrix" style="display: flex; flex-direction: column; justify-content: center; min-width: 0; flex: 1; gap: 16px;">
                            <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                                <span class="player-title-badge" style="font-size: 13px; padding: 8px 24px; margin: 0; border-width: 2px; letter-spacing: 4px; box-shadow: 0 0 20px rgba(255,215,0,0.4);">${escapeHTML(userTitleDisplay)}</span>
                                <button class="edit-license-btn" id="btn-edit-license" title="Edit Constructor Credentials Studio" style="font-size: 15px; padding: 8px 24px; border-width: 2px;">✏️ CREDENTIALS STUDIO</button>
                            </div>
                            <div class="player-username" style="font-size: clamp(38px, 8vw, 64px); letter-spacing: 8px; margin: 0; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--white); font-family: Orbitron; font-weight: 900; text-shadow: 0 0 30px rgba(0,128,255,0.8), 0 4px 8px rgba(0,0,0,0.9);">
                                ${escapeHTML(usernameDisplay)}
                            </div>
                        </div>
                    </div>

                    <!-- Lower Tier: Complete 3X Full-Width Authority Crown & seasonal Precision XP Track -->
                    <div class="authority-lower-tier" style="display: flex; align-items: center; gap: 36px; width: 100%; border-top: 2px solid rgba(0,128,255,0.4); padding-top: 28px; flex-wrap: wrap;">
                        <div class="level-emblem" title="Calculated Executive Paddock Authority Level" style="font-size: 28px; padding: 14px 32px; min-width: 180px; justify-content: center; border-radius: 14px; border: 2px solid #00FF41; box-shadow: 0 0 25px rgba(0,255,65,0.5);">
                            <span style="font-size: 18px;">🏆 LVL</span>
                            <span style="font-size: 42px; color: var(--yellow); font-weight: 900; text-shadow: 0 0 20px rgba(255,215,0,0.8);">${levelData.level}</span>
                        </div>
                        <div class="xp-progress-system" style="flex: 1; min-width: 320px;">
                            <div class="xp-numbers" style="font-size: 16px; margin-bottom: 12px; font-weight: 900; letter-spacing: 3px;">
                                <span style="color: var(--white);">SEASONAL PRESTIGE XP PROGRESSION SYSTEM</span>
                                <span style="color: #00FF41; font-family: Orbitron; font-weight: 900; font-size: 18px; text-shadow: 0 0 12px #00FF41;">${levelData.progressXP} / ${levelData.neededXP}</span>
                            </div>
                            <div class="xp-track" style="height: 18px; border-radius: 9px; border-width: 2px; padding: 2px;">
                                <div class="xp-laser-fill" style="width: ${levelData.percent}%; border-radius: 6px; box-shadow: 0 0 20px #00FF41;"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- THE Elite 2x2 INTERACTIVE DATABASE NAVIGATION CONSOLE BOX -->
                <div class="vip-nav-console-box" style="margin-top: 20px !important;">
                    <div class="console-box-title">⚡ EXECUTIVE PADDOCK DATABASE NAVIGATION CONSOLE</div>
                    <div class="console-buttons-grid">
                        <button class="console-tab-btn ${currentTab === 'overview' ? 'active' : ''}" data-tab="overview">
                            <span class="btn-head">
                                <span class="c-icon">📊</span>
                                <span class="c-title">SUPER LICENSE & METRICS</span>
                            </span>
                            <span class="c-sub">ESport Paddock Super License, Driver Aptitude Radar, Cybernetic Statistics Grid</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
                            <span class="btn-head">
                                <span class="c-icon">🏆</span>
                                <span class="c-title">THE TROPHY CABINET (${trophyStats.unlocked}/${trophyStats.total})</span>
                            </span>
                            <span class="c-sub">Interactive 3D / Glassmorphic Trophies, Professional Silvers, Podium Excellence Badges</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'history' ? 'active' : ''}" data-tab="history">
                            <span class="btn-head">
                                <span class="c-icon">📜</span>
                                <span class="c-title">CAREER LEGACY</span>
                            </span>
                            <span class="c-sub">Immortal Championship History Tiers, Definitive Points Tally, Universal Title Trophies</span>
                        </button>

                        <button class="console-tab-btn ${currentTab === 'data' ? 'active' : ''}" data-tab="data">
                            <span class="btn-head">
                                <span class="c-icon">⚡</span>
                                <span class="c-title">SUBSPACE SYNC</span>
                            </span>
                            <span class="c-sub">Local JSON Save Sync, Storage Capacity Manager, Complete In-Memory Staging Purge</span>
                        </button>
                    </div>
                </div>

                <!-- DYNAMIC TAB INTERIOR -->
                <div id="vip-tab-content" style="position: relative; z-index: 2;">
                    ${renderActiveTab(profile)}
                </div>
            </div>
        `;

        attachContentDelegates();
    }

    /**
     * Render the active tab view
     */
    function renderActiveTab(profile) {
        switch (currentTab) {
            case 'overview': return renderMetricsOverview(profile);
            case 'achievements': return renderTrophyCabinet(profile);
            case 'history': return renderCareerLegacy(profile);
            case 'data': return renderSubspaceSync(profile);
            default: return renderMetricsOverview(profile);
        }
    }

    /**
     * Tab 1: Super License Cybernetic Metrics & Aptitude Showcase
     */
    function renderMetricsOverview(profile) {
        const totalRaces = profile.totalRaces || 0;
        const totalWins = profile.totalWins || 0;
        const winRate = totalRaces > 0 ? ((totalWins / totalRaces) * 100).toFixed(1) : '0.0';

        const metrics = [
            { id: 'races', label: 'Total Grand Prix Entered', value: totalRaces, icon: '🚦' },
            { id: 'wins', label: 'Grand Prix Victories', value: totalWins, icon: '🏆' },
            { id: 'podiums', label: 'Podium Celebrations', value: profile.totalPodiums || 0, icon: '🍾' },
            { id: 'poles', label: 'Pole Position Shootouts', value: profile.totalPoles || 0, icon: '⚡' },
            { id: 'flaps', label: 'Blistering Fastest Laps', value: profile.totalFastestLaps || 0, icon: '⏱️' },
            { id: 'champs', label: 'World Constructor Titles', value: profile.totalChampionships || 0, icon: '♛' },
            { id: 'xp', label: 'Total Prestige XP', value: (profile.xp || 0).toLocaleString(), icon: '✨' },
            { id: 'rate', label: 'Calculated ESport Win Rate', value: `${winRate}%`, icon: '📈' }
        ];

        // Custom aptitude calculations
        const aptitudes = [
            { name: 'Strategic Pit Aggression', percent: Math.min(98, 65 + (profile.totalWins || 0) * 3) },
            { name: 'Wet-Weather Master Delta', percent: Math.min(96, 70 + (profile.totalPodiums || 0) * 2) },
            { name: 'Qualifying Shootout Speed', percent: Math.min(99, 68 + (profile.totalPoles || 0) * 4) },
            { name: 'Consistent Telemetry Rhythm', percent: Math.min(95, 75 + (profile.totalRaces || 0) * 1.5) },
            { name: 'Overtake Slingshot Boldness', percent: Math.min(97, 72 + (profile.totalFastestLaps || 0) * 3) }
        ];

        return `
            <div class="metrics-master-grid">
                ${metrics.map(m => `
                    <div class="cyber-metric-card" title="Calculated ESport Telemetry Channel">
                        <div class="metric-label">
                            <span style="font-size: 16px;">${m.icon}</span>
                            <span>${m.label}</span>
                        </div>
                        <div class="metric-value">${m.value}</div>
                    </div>
                `).join('')}
            </div>

            <!-- Calculated Esport Aptitude Breakdown -->
            <div class="aptitude-showcase">
                <div class="aptitude-title">
                    <span>⚡ EXECUTIVE PADDOCK APTITUDE BREAKDOWN</span>
                </div>
                <div class="aptitude-bars-grid">
                    ${aptitudes.map(a => `
                        <div class="aptitude-bar-item">
                            <div class="aptitude-item-header">
                                <span>${a.name}</span>
                                <span style="color: var(--yellow); font-family: Orbitron;">${a.percent}%</span>
                            </div>
                            <div class="aptitude-item-track">
                                <div class="aptitude-item-fill" style="width: ${a.percent}%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Tab 2: The Trophy Cabinet (3D / Glassmorphic Silverware Showcase)
     */
    function renderTrophyCabinet(profile) {
        const unlocked = profile.achievements || [];
        const visibleAchievements = typeof getVisibleAchievements === 'function' ? getVisibleAchievements() : [];

        // Categorize using all available categories from data
        const tiers = {};
        Object.entries(ACHIEVEMENT_CATEGORIES).forEach(([key, cat]) => {
            tiers[key] = { title: `${cat.icon} ${cat.name.toUpperCase()} EXCELLENCE`, items: [] };
        });

        visibleAchievements.forEach(a => {
            if (tiers[a.category]) {
                tiers[a.category].items.push(a);
            } else {
                if (!tiers['OTHER']) tiers['OTHER'] = { title: '⭐ OTHER MILESTONES', items: [] };
                tiers['OTHER'].items.push(a);
            }
        });

        return `
            <div class="trophy-room-showcase">
                ${Object.entries(tiers).filter(([_, t]) => t.items.length > 0).map(([key, tier]) => `
                    <div class="trophy-tier">
                        <div class="trophy-tier-title">
                            <span>${tier.title}</span>
                        </div>
                        <div class="trophy-cards-grid" style="margin-top: 16px;">
                            ${tier.items.map(a => {
                                const isUnlocked = unlocked.includes(a.id);
                                return `
                                    <div class="master-trophy-card ${isUnlocked ? 'unlocked' : 'locked'}"
                                         title="${escapeHTML(isUnlocked ? a.description : 'Locked Trophy')}"
                                         onclick="ProfileScreen.triggerTrophyCelebration('${isUnlocked}')">
                                        <div class="trophy-hologram-dock">
                                            <span>${isUnlocked ? a.icon : '🔒'}</span>
                                        </div>
                                        <div class="trophy-title">${isUnlocked ? escapeHTML(a.name) : '???'}</div>
                                        <div class="trophy-desc">${isUnlocked ? escapeHTML(a.description) : 'Fulfil the specific Paddock condition to unlock this silverware.'}</div>
                                        <div class="trophy-reward-badge">+${a.xpReward} PRESTIGE XP</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function buildHistoryArchive(profile) {
        const archive = [];
        const career = StateManager.get('career');
        const storedHistory = Array.isArray(profile.careerHistory) ? profile.careerHistory : [];

        if (career?.championship && Array.isArray(career.championship.driverStandings)) {
            archive.push(buildLiveSeasonArchive(career));
        }

        storedHistory.forEach(season => {
            if (!archive.some(entry => entry.season === season.season)) {
                archive.push(buildStoredSeasonArchive(season));
            }
        });

        return archive.sort((a, b) => (b.season || 0) - (a.season || 0));
    }

    function buildLiveSeasonArchive(career) {
        const trackByRound = new Map((career.raceHistory || []).map((race, index) => [race.round || index + 1, race]));
        const allTeams = Array.isArray(career.allTeams) ? career.allTeams : [];
        const driverStatsMap = new Map();
        const teamStatsMap = new Map();

        (career.championship?.driverStandings || []).forEach(entry => {
            driverStatsMap.set(entry.driverId, {
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: 0,
                fastestLaps: 0,
                results: []
            });
        });

        (career.championship?.constructorStandings || []).forEach(entry => {
            teamStatsMap.set(entry.teamId, {
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: 0,
                fastestLaps: 0
            });
        });

        const seasonRaceResults = (career.raceHistory || []).map((race, index) => {
            const track = typeof getTrackById === 'function' ? getTrackById(race.trackId) : null;
            const fullResults = Array.isArray(race.fullResults) ? race.fullResults : [];
            const winner = fullResults.find(result => result.position === 1) || null;
            const fastestLap = fullResults.find(result => result.fastestLap) || null;
            const poleSitter = race.poleSitterName || race.pole || race.qualifyingWinner || null;

            fullResults.forEach(result => {
                if (!result?.driver?.id) return;
                const stats = driverStatsMap.get(result.driver.id) || { wins: 0, podiums: 0, poles: 0, fastestLaps: 0, results: [] };
                if (result.fastestLap) {
                    stats.fastestLaps += 1;
                    const teamStats = teamStatsMap.get(result.team?.id);
                    if (teamStats) teamStats.fastestLaps += 1;
                }
                stats.results.push({
                    round: race.round || index + 1,
                    trackName: track?.name || `Round ${race.round || index + 1}`,
                    position: result.position,
                    points: (result.points || 0) + (result.fastestLapBonus || 0),
                    fastestLap: !!result.fastestLap
                });
                driverStatsMap.set(result.driver.id, stats);
            });

            return {
                round: race.round || index + 1,
                trackName: track?.name || `Round ${race.round || index + 1}`,
                winner: winner?.driver?.name || '—',
                poleSitter: poleSitter || '—',
                fastestLap: fastestLap?.driver?.name || '—'
            };
        });

        const driverStandings = [...(career.championship?.driverStandings || [])]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .map((entry, index) => ({
                position: index + 1,
                driverId: entry.driverId,
                driverName: entry.driverName,
                teamId: entry.teamId,
                teamName: entry.teamName,
                teamColor: entry.teamColor,
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: driverStatsMap.get(entry.driverId)?.poles || 0,
                fastestLaps: driverStatsMap.get(entry.driverId)?.fastestLaps || 0,
                points: entry.points || 0,
                results: driverStatsMap.get(entry.driverId)?.results || []
            }));

        const constructorStandings = [...(career.championship?.constructorStandings || [])]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .map((entry, index) => {
                const team = allTeams.find(item => item.id === entry.teamId);
                return {
                    position: index + 1,
                    teamId: entry.teamId,
                    teamName: entry.teamName,
                    teamColor: entry.teamColor,
                    wins: entry.wins || 0,
                    podiums: entry.podiums || 0,
                    poles: teamStatsMap.get(entry.teamId)?.poles || 0,
                    fastestLaps: teamStatsMap.get(entry.teamId)?.fastestLaps || 0,
                    points: entry.points || 0,
                    drivers: (team?.drivers || []).map(driver => driver.name),
                    teamRating: team?.carStats ? Math.round(Object.values(team.carStats).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(team.carStats).length)) : null,
                    summary: team?.history || 'Season archive generated from live championship data.'
                };
            });

        const overview = {
            worldChampion: driverStandings[0]?.driverName || '—',
            constructorsChampion: constructorStandings[0]?.teamName || '—',
            mostWins: Math.max(0, ...driverStandings.map(driver => driver.wins || 0)),
            mostPoles: Math.max(0, ...driverStandings.map(driver => driver.poles || 0)),
            mostPodiums: Math.max(0, ...driverStandings.map(driver => driver.podiums || 0)),
            mostFastestLaps: Math.max(0, ...driverStandings.map(driver => driver.fastestLaps || 0))
        };

        return {
            season: career.season,
            isActive: true,
            hasDetailedData: true,
            label: `Season ${career.season}`,
            overview,
            driverStandings,
            constructorStandings,
            raceResults: seasonRaceResults,
            playerTeamId: career.team?.id || null
        };
    }

    function buildStoredSeasonArchive(season) {
        const position = season.position || '—';
        const points = season.points || 0;
        const wins = season.wins || 0;
        return {
            season: season.season,
            isActive: false,
            hasDetailedData: false,
            label: `Season ${season.season}`,
            overview: {
                worldChampion: 'Archived Summary Only',
                constructorsChampion: position === 1 ? (season.teamName || 'Player Team') : 'Archived Summary Only',
                mostWins: wins,
                mostPoles: '—',
                mostPodiums: '—',
                mostFastestLaps: '—'
            },
            driverStandings: [],
            constructorStandings: [{
                position,
                teamId: `team_${season.season}_${season.teamName || 'player'}`,
                teamName: season.teamName || 'Player Team',
                teamColor: season.teamColor || '#FFFFFF',
                wins,
                podiums: '—',
                poles: '—',
                fastestLaps: '—',
                points,
                drivers: [],
                teamRating: null,
                summary: position === 1 ? 'Championship-winning campaign archived in summary form.' : `Archived season summary with final position P${position}.`
            }],
            raceResults: [],
            playerTeamId: `team_${season.season}_${season.teamName || 'player'}`,
            archivedSummary: season
        };
    }

    function ensureHistorySelection(archive) {
        if (!archive.length) {
            historySeason = null;
            historyFocus = { type: 'driver', id: null };
            return null;
        }
        if (historySeason === null || !archive.some(season => season.season === historySeason)) {
            historySeason = archive[0].season;
        }
        const selectedSeason = archive.find(season => season.season === historySeason) || archive[0];
        if (historyView !== 'standings' && historyView !== 'results') historyView = 'standings';
        if (historyView === 'standings') {
            const validDriver = selectedSeason.driverStandings.some(driver => driver.driverId === historyFocus.id);
            const validTeam = selectedSeason.constructorStandings.some(team => team.teamId === historyFocus.id);
            if (!validDriver && !validTeam) {
                if (selectedSeason.driverStandings.length) historyFocus = { type: 'driver', id: selectedSeason.driverStandings[0].driverId };
                else if (selectedSeason.constructorStandings.length) historyFocus = { type: 'team', id: selectedSeason.constructorStandings[0].teamId };
                else historyFocus = { type: 'driver', id: null };
            }
        }
        return selectedSeason;
    }

    function renderHistoryOverviewCards(season) {
        return `
            <div class="history-overview-grid">
                <div class="history-overview-card accent"><span>World Champion</span><b>${escapeHTML(season.overview.worldChampion)}</b></div>
                <div class="history-overview-card"><span>Constructors Champion</span><b>${escapeHTML(season.overview.constructorsChampion)}</b></div>
                <div class="history-overview-card"><span>Most Wins</span><b>${escapeHTML(String(season.overview.mostWins ?? '—'))}</b></div>
                <div class="history-overview-card"><span>Most Poles</span><b>${escapeHTML(String(season.overview.mostPoles ?? '—'))}</b></div>
                <div class="history-overview-card"><span>Most Podiums</span><b>${escapeHTML(String(season.overview.mostPodiums ?? '—'))}</b></div>
                <div class="history-overview-card"><span>Most Fastest Laps</span><b>${escapeHTML(String(season.overview.mostFastestLaps ?? '—'))}</b></div>
            </div>
        `;
    }

    function renderDriverHistoryTable(season) {
        if (!season.driverStandings.length) {
            return `<div class="history-empty-card">Detailed driver classification is not present in this archived save snapshot.</div>`;
        }
        return `
            <div class="history-table-shell">
                <div class="history-table-title">Driver Championship</div>
                <div class="history-table-wrap">
                    <table class="history-data-table">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Driver</th>
                                <th>Team</th>
                                <th>Wins</th>
                                <th>Podiums</th>
                                <th>Poles</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.driverStandings.map(driver => `
                                <tr class="history-row ${historyFocus.type === 'driver' && historyFocus.id === driver.driverId ? 'selected' : ''}" data-history-select="driver:${driver.driverId}">
                                    <td>P${driver.position}</td>
                                    <td>${escapeHTML(driver.driverName)}</td>
                                    <td>${escapeHTML(driver.teamName)}</td>
                                    <td>${driver.wins}</td>
                                    <td>${driver.podiums}</td>
                                    <td>${driver.poles}</td>
                                    <td>${driver.points}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderConstructorHistoryTable(season) {
        if (!season.constructorStandings.length) {
            return `<div class="history-empty-card">No constructor archive is available for this season.</div>`;
        }
        return `
            <div class="history-table-shell">
                <div class="history-table-title">Constructor Championship</div>
                <div class="history-table-wrap">
                    <table class="history-data-table">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Team</th>
                                <th>Wins</th>
                                <th>Podiums</th>
                                <th>Poles</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.constructorStandings.map(team => `
                                <tr class="history-row ${historyFocus.type === 'team' && historyFocus.id === team.teamId ? 'selected' : ''}" data-history-select="team:${team.teamId}">
                                    <td>${String(team.position).startsWith('P') ? team.position : `P${team.position}`}</td>
                                    <td>${escapeHTML(team.teamName)}</td>
                                    <td>${escapeHTML(String(team.wins ?? '—'))}</td>
                                    <td>${escapeHTML(String(team.podiums ?? '—'))}</td>
                                    <td>${escapeHTML(String(team.poles ?? '—'))}</td>
                                    <td>${escapeHTML(String(team.points ?? '—'))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderHistoryRaceResults(season) {
        if (!season.raceResults.length) {
            return `<div class="history-empty-card">Race-by-race results were not preserved in this archived season snapshot.</div>`;
        }
        return `
            <div class="history-table-shell full-width">
                <div class="history-table-title">Season Race Results</div>
                <div class="history-table-wrap">
                    <table class="history-data-table">
                        <thead>
                            <tr>
                                <th>Round</th>
                                <th>Track</th>
                                <th>Winner</th>
                                <th>Pole Sitter</th>
                                <th>Fastest Lap</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.raceResults.map(race => `
                                <tr>
                                    <td>R${race.round}</td>
                                    <td>${escapeHTML(race.trackName)}</td>
                                    <td>${escapeHTML(race.winner)}</td>
                                    <td>${escapeHTML(race.poleSitter)}</td>
                                    <td>${escapeHTML(race.fastestLap)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderHistoryDetailPanel(season) {
        if (historyFocus.type === 'team') {
            const team = season.constructorStandings.find(item => item.teamId === historyFocus.id) || season.constructorStandings[0];
            if (!team) return `<div class="history-empty-card">Select a team to inspect season details.</div>`;
            return `
                <div class="history-detail-card">
                    <div class="history-detail-kicker">Team Overview</div>
                    <h3>${escapeHTML(team.teamName)}</h3>
                    <div class="history-detail-grid">
                        <div><span>Final Position</span><b>${String(team.position).startsWith('P') ? team.position : `P${team.position}`}</b></div>
                        <div><span>Points</span><b>${escapeHTML(String(team.points ?? '—'))}</b></div>
                        <div><span>Wins</span><b>${escapeHTML(String(team.wins ?? '—'))}</b></div>
                        <div><span>Podiums</span><b>${escapeHTML(String(team.podiums ?? '—'))}</b></div>
                        <div><span>Poles</span><b>${escapeHTML(String(team.poles ?? '—'))}</b></div>
                        <div><span>Fastest Laps</span><b>${escapeHTML(String(team.fastestLaps ?? '—'))}</b></div>
                        <div><span>Drivers</span><b>${team.drivers?.length ? escapeHTML(team.drivers.join(', ')) : 'Archived summary only'}</b></div>
                        <div><span>Team Rating</span><b>${team.teamRating ?? '—'}</b></div>
                    </div>
                    <div class="history-summary-block">
                        <span>Season Summary</span>
                        <p>${escapeHTML(team.summary || 'No season summary available.')}</p>
                    </div>
                </div>
            `;
        }

        const driver = season.driverStandings.find(item => item.driverId === historyFocus.id) || season.driverStandings[0];
        if (!driver) {
            return `<div class="history-empty-card">Select a driver to inspect season details.</div>`;
        }
        return `
            <div class="history-detail-card">
                <div class="history-detail-kicker">Driver Overview</div>
                <h3>${escapeHTML(driver.driverName)}</h3>
                <div class="history-detail-grid">
                    <div><span>Team</span><b>${escapeHTML(driver.teamName)}</b></div>
                    <div><span>Position</span><b>P${driver.position}</b></div>
                    <div><span>Points</span><b>${driver.points}</b></div>
                    <div><span>Wins</span><b>${driver.wins}</b></div>
                    <div><span>Podiums</span><b>${driver.podiums}</b></div>
                    <div><span>Poles</span><b>${driver.poles}</b></div>
                    <div><span>Fastest Laps</span><b>${driver.fastestLaps}</b></div>
                    <div><span>Status</span><b>${driver.position === 1 ? 'Champion' : `P${driver.position}`}</b></div>
                </div>
                <div class="history-summary-block">
                    <span>Season Results</span>
                    ${driver.results?.length ? `
                        <div class="history-results-list">
                            ${driver.results.map(result => `<div>R${result.round} • ${escapeHTML(result.trackName)} • P${result.position} • ${result.points} pts${result.fastestLap ? ' • FL' : ''}</div>`).join('')}
                        </div>
                    ` : `<p>Per-round driver results were not preserved in this archive.</p>`}
                </div>
            </div>
        `;
    }

    /**
     * Tab 3: Championship History Archive
     */
    function renderCareerLegacy(profile) {
        const archive = buildHistoryArchive(profile);

        if (archive.length === 0) {
            return `
                <div style="text-align: center; padding: 60px 20px; background: var(--surface-1); border-radius: 16px; border: 2px dashed var(--border-medium);">
                    <div style="font-size: 56px; margin-bottom: 16px;">🏎️💨</div>
                    <h3 style="font-family: Orbitron; font-size: 22px; color: var(--yellow); margin-bottom: 12px;">ZERO CAMPAIGNS ON RECORD</h3>
                    <p style="font-family: Rajdhani; font-size: 16px; color: var(--gray-400); max-width: 600px; margin: 0 auto; line-height: 1.5;">
                        You have not completed a full championship campaign yet. Start a season to begin building a full historical archive.
                    </p>
                </div>
            `;
        }

        const selectedSeason = ensureHistorySelection(archive);
        return `
            <style>
                .history-archive-shell { display:flex; flex-direction:column; gap:16px; }
                .history-toolbar, .history-panel, .history-detail-card, .history-empty-card { background: linear-gradient(135deg, rgba(20,20,30,0.88), rgba(8,8,14,0.96)); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 16px; }
                .history-toolbar { display:flex; justify-content:space-between; gap:16px; align-items:flex-end; flex-wrap:wrap; }
                .history-archive-kicker { display:block; font-family: Orbitron; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--yellow); }
                .history-toolbar h2 { font-family: Orbitron; color: var(--white); margin-top: 6px; }
                .history-season-select { min-width: 180px; }
                .history-view-tabs { display:flex; gap:8px; flex-wrap:wrap; }
                .history-view-tab { padding: 8px 12px; border-radius: 999px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--gray-300); cursor:pointer; font-family: Orbitron; font-size: 10px; letter-spacing: 1px; }
                .history-view-tab.active { color: var(--white); border-color: var(--green); background: rgba(0,255,65,0.12); }
                .history-overview-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; }
                .history-overview-card { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px; min-height: 84px; }
                .history-overview-card.accent { border-color: rgba(0,255,65,0.22); box-shadow: inset 0 0 16px rgba(0,255,65,0.06); }
                .history-overview-card span, .history-detail-grid span, .history-summary-block span, .history-table-title, .history-detail-kicker { display:block; font-family: Orbitron; font-size: 9px; color: var(--gray-500); letter-spacing: 1px; text-transform: uppercase; }
                .history-overview-card b { display:block; margin-top: 6px; font-family: Orbitron; font-size: 18px; color: var(--white); line-height: 1.15; overflow-wrap: anywhere; }
                .history-content-grid { display:grid; grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.85fr); gap:16px; align-items:start; }
                .history-tables-stack { display:flex; flex-direction:column; gap:16px; }
                .history-table-shell.full-width { margin-top:0; }
                .history-table-wrap { overflow:auto; margin-top:10px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); }
                .history-data-table { width:100%; border-collapse:collapse; font-family: Rajdhani; font-size: 13px; }
                .history-data-table th { position: sticky; top: 0; background: rgba(255,255,255,0.05); font-family: Orbitron; font-size: 10px; color: var(--gray-500); text-align:left; padding:10px; }
                .history-data-table td { padding:10px; border-top:1px solid rgba(255,255,255,0.05); color: var(--white); }
                .history-row { cursor:pointer; transition: background 0.18s ease; }
                .history-row:hover, .history-row.selected { background: rgba(0,255,65,0.08); }
                .history-detail-card h3 { font-family: Orbitron; color: var(--white); font-size: 22px; margin: 6px 0 14px; }
                .history-detail-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
                .history-detail-grid div, .history-summary-block { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius: 12px; padding:10px 12px; }
                .history-detail-grid b { display:block; margin-top:4px; font-family: Orbitron; color: var(--white); font-size:13px; line-height:1.2; overflow-wrap:anywhere; }
                .history-summary-block { margin-top: 12px; }
                .history-summary-block p { margin-top:8px; color: var(--gray-300); font-family: Rajdhani; line-height:1.45; }
                .history-results-list { display:flex; flex-direction:column; gap:6px; margin-top:8px; color: var(--gray-300); font-family: Rajdhani; font-size: 13px; }
                .history-empty-card { color: var(--gray-400); text-align:center; }
                .history-archive-note { color: var(--gray-400); font-family: Rajdhani; line-height:1.45; }
                @media (max-width: 1050px) {
                    .history-overview-grid { grid-template-columns: repeat(2, minmax(0,1fr)); }
                    .history-content-grid { grid-template-columns: 1fr; }
                }
                @media (max-width: 700px) {
                    .history-overview-grid, .history-detail-grid { grid-template-columns: 1fr; }
                    .history-toolbar { align-items:stretch; }
                    .history-view-tabs { width:100%; }
                }
            </style>
            <div class="history-archive-shell">
                <div class="history-toolbar">
                    <div>
                        <div class="history-archive-kicker">CHAMPIONSHIP HISTORY</div>
                        <h2>${escapeHTML(selectedSeason.label)}</h2>
                    </div>
                    <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end;">
                        <label class="history-season-select">
                            <div class="label" style="margin-bottom:6px;">Season</div>
                            <select class="select" id="history-season-select">
                                ${archive.map(season => `<option value="${season.season}" ${season.season === selectedSeason.season ? 'selected' : ''}>${season.season}</option>`).join('')}
                            </select>
                        </label>
                        <div class="history-view-tabs">
                            <button class="history-view-tab ${historyView === 'standings' ? 'active' : ''}" data-history-view="standings">Standings</button>
                            <button class="history-view-tab ${historyView === 'results' ? 'active' : ''}" data-history-view="results">Race Results</button>
                        </div>
                    </div>
                </div>

                ${renderHistoryOverviewCards(selectedSeason)}

                ${!selectedSeason.hasDetailedData ? `<div class="history-panel history-archive-note">This season is stored as a legacy archive summary. Detailed driver classifications, constructor tables and race-by-race records were not preserved in the original save snapshot.</div>` : ''}

                ${historyView === 'results' ? `
                    ${renderHistoryRaceResults(selectedSeason)}
                ` : `
                    <div class="history-content-grid">
                        <div class="history-tables-stack">
                            ${renderDriverHistoryTable(selectedSeason)}
                            ${renderConstructorHistoryTable(selectedSeason)}
                        </div>
                        ${renderHistoryDetailPanel(selectedSeason)}
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Tab 4: Subspace Sync (Save Storage Manager)
     */
    function renderSubspaceSync() {
        const storageInfo = typeof SaveSystem !== 'undefined' && SaveSystem.getStorageInfo ? SaveSystem.getStorageInfo() : { usedKB: 120, maxKB: 5000, saveCount: 3 };
        const usedPercent = Math.min(100, ((storageInfo.usedKB / storageInfo.maxKB) * 100)).toFixed(1);

        return `
            <div class="storage-master-card">
                <div class="storage-header-flex">
                    <div class="storage-title">⚡ LOCAL SUBSPACE STORAGE USED</div>
                    <div class="storage-figures">${storageInfo.usedKB} KB / ${storageInfo.maxKB} KB (${usedPercent}%)</div>
                </div>
                <div class="storage-bar-track">
                    <div class="storage-bar-fill" style="width: ${usedPercent}%;"></div>
                </div>

                <div class="data-actions-grid">
                    <button class="data-action-btn export" id="sync-btn-export" title="Copy raw JSON snapshot to Clipboard">
                        <span style="font-size: 26px;">📤</span>
                        <span>EXPORT SNAPSHOT</span>
                    </button>
                    <button class="data-action-btn import" id="sync-btn-import" title="Import previously exported JSON code">
                        <span style="font-size: 26px;">📥</span>
                        <span>IMPORT SNAPSHOT</span>
                    </button>
                    <button class="data-action-btn delete" id="sync-btn-reset" title="Purge local workspace storage entirely">
                        <span style="font-size: 26px;">⚠️</span>
                        <span>PURGE ALL DATA</span>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Attach UI event delegates
     */
    function attachContentDelegates() {
        if (!container) return;

        // Ultimate Universal Home Button
        const homeBtn = container.querySelector('#profile-home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                EventBus.emit('nav:home');
            });
        }

        // Tab selection
        container.querySelectorAll('.console-tab-btn, .vip-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentTab = btn.dataset.tab;
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                render();
            });
        });

        container.querySelector('#history-season-select')?.addEventListener('change', (e) => {
            historySeason = parseInt(e.target.value, 10);
            historyFocus = { type: 'driver', id: null };
            render();
        });

        container.querySelectorAll('[data-history-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                historyView = btn.dataset.historyView || 'standings';
                render();
            });
        });

        container.querySelectorAll('[data-history-select]').forEach(row => {
            row.addEventListener('click', () => {
                const [type, id] = String(row.dataset.historySelect || '').split(':');
                historyFocus = { type, id };
                render();
            });
        });

        // Edit Identity Hub
        const editHubs = container.querySelectorAll('#btn-edit-license, #vip-avatar-dock');
        editHubs.forEach(el => {
            el.addEventListener('click', () => {
                showCredentialsWizard();
            });
        });

        // Subspace sync actions
        container.querySelector('#sync-btn-export')?.addEventListener('click', () => {
            if (typeof SaveSystem === 'undefined' || !SaveSystem.exportAll) return;
            const code = SaveSystem.exportAll();
            Modals.open({
                title: '📤 EXPORT JSON SNAPSHOT',
                className: 'modal-lg',
                body: `
                    <p style="color: var(--gray-300); font-family: Rajdhani; font-size: 15px; margin-bottom: 16px;">
                        Copy this encrypted Subspace JSON block to back up your full active Paddock profile and custom Constructor saves across external devices or turn snapshots.
                    </p>
                    <textarea readonly class="input" style="min-height: 200px; font-family: monospace; font-size: 11px; color: var(--green); background: #0a0a0c; border: 1px solid rgba(0,255,65,0.4); padding: 12px; border-radius: 8px; word-break: break-all;">${code}</textarea>
                `,
                actions: [
                    {
                        label: '📋 COPY TO CLIPBOARD',
                        type: 'primary',
                        onClick: () => {
                            navigator.clipboard.writeText(code);
                            if (typeof Notifications !== 'undefined') Notifications.success('Snapshot Copied to Clipboard!');
                            return false;
                        }
                    },
                    { label: 'CLOSE', type: 'secondary' }
                ]
            });
        });

        container.querySelector('#sync-btn-import')?.addEventListener('click', () => {
            if (typeof Modals === 'undefined' || typeof SaveSystem === 'undefined') return;
            Modals.prompt({
                title: '📥 IMPORT JSON SNAPSHOT',
                body: 'Paste your previously exported encrypted Subspace JSON save code below:',
                placeholder: 'Paste raw JSON block here...'
            }).then(code => {
                if (!code) return;
                if (SaveSystem.importAll(code)) {
                    if (typeof Notifications !== 'undefined') Notifications.success('Subspace Data Restored!', 'Reloading workspace parameters...');
                    setTimeout(() => location.reload(), 800);
                } else {
                    if (typeof Notifications !== 'undefined') Notifications.error('Sync Failure', 'Invalid or corrupt Subspace JSON save block.');
                }
            });
        });

        container.querySelector('#sync-btn-reset')?.addEventListener('click', () => {
            if (typeof Modals === 'undefined' || typeof SaveSystem === 'undefined') return;
            Modals.confirm({
                title: '⚠️ PURGE LOCAL WORKSPACE STORAGE?',
                body: 'This will irreversibly wipe your active Paddock profile, all saved Grand Prix campaigns, custom achievements, and custom R&D settings. Confirmed?',
                confirmText: 'PURGE EVERYTHING',
                confirmType: 'danger',
                onConfirm: () => {
                    SaveSystem.clearAll?.();
                    if (typeof Notifications !== 'undefined') Notifications.warning('Purge Executed', 'Workspace initialized to default settings.');
                    setTimeout(() => location.reload(), 600);
                }
            });
        });
    }

    /**
     * Interactive Custom Paddock Credentials Editor
     */
    function showCredentialsWizard() {
        if (typeof Modals === 'undefined') return;
        const profile = StateManager.loadProfile?.() || StateManager.get('profile') || {};
        const currUser = profile.username || 'RACER_01';
        const currTitle = profile.userTitle || 'ELITE CONSTRUCTOR';
        const currAvatar = profile.avatar || '🪖';

        const avatars = ['🪖', '👑', '🏎️', '🤖', '⚡', '🦅', '🦁', '🚀', '🔥', '🛡️', '🏆', '🎯'];
        const titles = [
            'ELITE CONSTRUCTOR',
            'PADDOCK MASTER',
            'TIRE WHISPERER',
            'RAIN SHOOTOUT SPECIALIST',
            'AERODYNAMIC DIRECTOR',
            'SLINGSHOT OVERTAKER',
            'STREET MONACO DEFENDER'
        ];

        Modals.open({
            title: '✏️ CONSTRUCTOR CREDENTIALS STUDIO',
            className: 'modal-lg',
            body: `
                <div style="display: flex; flex-direction: column; gap: 24px;">
                    <!-- Username Input -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">MANDATORY FIA SUPER LICENSE USERNAME</label>
                        <input type="text" class="input" id="edit-input-username" value="${escapeHTML(currUser)}" maxlength="16" style="font-family: Orbitron; font-weight: 900; font-size: 20px; color: var(--white); background: #111115; border-color: #0080FF; text-transform: uppercase;">
                    </div>

                    <!-- Constructor Title Selection -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">EXECUTIVE PADDOCK TITLE</label>
                        <select class="select" id="edit-select-title" style="font-family: Orbitron; font-weight: 700; font-size: 14px; background: #111115; color: var(--green);">
                            ${titles.map(t => `
                                <option value="${t}" ${t === currTitle ? 'selected' : ''}>${t}</option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Esport Avatar Selection -->
                    <div class="form-group">
                        <label class="form-label" style="font-family: Orbitron; font-size: 12px; color: var(--yellow);">ESport RACING AVATAR EMBLEM</label>
                        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px;">
                            ${avatars.map(av => `
                                <div class="avatar-pick-item ${av === currAvatar ? 'selected' : ''}" data-avatar="${av}" style="font-size: 38px; padding: 12px; background: #111115; border: 2px solid ${av === currAvatar ? '#FFD700' : 'rgba(255,255,255,0.1)'}; border-radius: 12px; text-align: center; cursor: pointer; transition: all 0.2s ease; box-shadow: ${av === currAvatar ? '0 0 20px rgba(255,215,0,0.5)' : 'none'};">
                                    ${av}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `,
            actions: [
                { label: 'CANCEL', type: 'secondary' },
                {
                    label: '✔ SAVE CREDENTIALS',
                    type: 'primary',
                    onClick: () => {
                        const newUser = document.getElementById('edit-input-username')?.value?.trim().toUpperCase() || currUser;
                        const newTitle = document.getElementById('edit-select-title')?.value || currTitle;
                        const newAvatar = document.querySelector('.avatar-pick-item.selected')?.dataset?.avatar || currAvatar;

                        profile.username = newUser;
                        profile.userTitle = newTitle;
                        profile.avatar = newAvatar;

                        if (typeof StateManager !== 'undefined') {
                            StateManager.set('profile', profile);
                            StateManager.saveProfile?.();
                        }

                        if (typeof Notifications !== 'undefined') Notifications.success('Credentials Updated!', `Welcome back to the Paddock, ${newUser}.`);
                        render();
                        return true;
                    }
                }
            ],
            onOpen: () => {
                // Attach click listeners to avatar pickers
                const items = document.querySelectorAll('.avatar-pick-item');
                items.forEach(item => {
                    item.addEventListener('click', () => {
                        items.forEach(x => {
                            x.classList.remove('selected');
                            x.style.borderColor = 'rgba(255,255,255,0.1)';
                            x.style.boxShadow = 'none';
                        });
                        item.classList.add('selected');
                        item.style.borderColor = '#FFD700';
                        item.style.boxShadow = '0 0 20px rgba(255,215,0,0.5)';
                        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                    });
                });
            }
        });
    }

    /**
     * Elegant celebration click for unlocked trophies
     */
    function triggerTrophyCelebration(isUnlocked) {
        if (isUnlocked === 'true') {
            if (typeof AudioManager !== 'undefined') AudioManager.raceGo?.();
            if (typeof Transitions !== 'undefined') Transitions.confetti?.(2500);
            if (typeof Notifications !== 'undefined') Notifications.info('Trophy Inspected', 'A definitive ESport Master piece in your silverware collection.');
        } else {
            if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
            if (typeof Notifications !== 'undefined') Notifications.warning('Trophy Locked', 'Fulfil the specific Paddock condition to unlock this silverware.');
        }
    }

    /**
     * Helper to compute exact level & XP deltas
     */
    function getLevelProgress(xp) {
        let needed = 500;
        let totalNeeded = needed;
        let level = 1;
        let prevNeeded = 0;

        while (xp >= totalNeeded && level < 99) {
            level++;
            prevNeeded = totalNeeded;
            needed = Math.floor(needed * 1.4);
            totalNeeded += needed;
        }

        const currentXPInLevel = xp - prevNeeded;
        const neededInLevel = totalNeeded - prevNeeded;
        const percent = Math.min(100, Math.max(0, Math.floor((currentXPInLevel / neededInLevel) * 100)));

        return {
            level,
            progressXP: currentXPInLevel.toLocaleString(),
            neededXP: neededInLevel.toLocaleString(),
            percent
        };
    }

    /**
     * Helper to compute unlocked trophy numbers
     */
    function getAchievementStats(profile) {
        const unlocked = profile.achievements || [];
        const visible = typeof getVisibleAchievements === 'function' ? getVisibleAchievements() : [];
        return {
            unlocked: unlocked.length,
            total: visible.length || 15
        };
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:profile:enter', () => {
            isActive = true;
            currentTab = 'overview';
            historySeason = null;
            historyView = 'standings';
            historyFocus = { type: 'driver', id: null };
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'profile') isActive = false;
        });
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

    return { init, render, triggerTrophyCelebration, destroy };
})();