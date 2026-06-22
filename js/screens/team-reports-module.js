/* ============================================
   VELOCITY — TEAM REPORTS MODULE
   Premium F1 archive + constructor dossier
   ============================================ */

window.TeamReportsModule = (() => {
    let historyState = {
        season: null,
        tab: 'standings',
        raceRound: null,
        selectedDriverId: null,
        selectedTeamId: null
    };

    let teamInfoState = {
        focusType: 'driver',
        driverId: null,
        staffRole: null
    };

    /* === BASIC STANDINGS MODAL (UNCHANGED ENTRY) === */
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

    /* === PREMIUM HISTORY ARCHIVE === */
    function buildHistoryArchive(career, profile) {
        const archive = [];
        if (career?.championship?.driverStandings?.length) archive.push(buildLiveSeasonArchive(career));
        (profile?.careerHistory || []).forEach(season => {
            if (!archive.some(item => item.season === season.season)) archive.push(buildArchivedSeasonArchive(season));
        });
        return archive.sort((a, b) => (b.season || 0) - (a.season || 0));
    }

    function buildLiveSeasonArchive(career) {
        const allTeams = Array.isArray(career.allTeams) ? career.allTeams : [];
        const teamMap = new Map(allTeams.map(team => [team.id, team]));
        const driverStats = new Map();
        const teamStats = new Map();

        (career.championship?.driverStandings || []).forEach(entry => {
            driverStats.set(entry.driverId, {
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: 0,
                fastestLaps: 0,
                bestFinish: Number.isFinite(entry.bestFinish) && entry.bestFinish < 90 ? entry.bestFinish : null,
                resultLine: []
            });
        });

        (career.championship?.constructorStandings || []).forEach(entry => {
            teamStats.set(entry.teamId, {
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: 0,
                fastestLaps: 0,
                bestFinish: null,
                points: entry.points || 0
            });
        });

        const raceResults = (career.raceHistory || []).map((race, idx) => {
            const track = typeof getTrackById === 'function' ? getTrackById(race.trackId) : null;
            const fullResults = Array.isArray(race.fullResults) ? race.fullResults : [];
            const winner = fullResults.find(result => result.position === 1) || null;
            const fastestLap = fullResults.find(result => result.fastestLap) || null;

            fullResults.forEach(result => {
                if (!result?.driver?.id || !result?.team?.id) return;
                const dStats = driverStats.get(result.driver.id) || {
                    wins: 0,
                    podiums: 0,
                    poles: 0,
                    fastestLaps: 0,
                    bestFinish: null,
                    resultLine: []
                };
                const tStats = teamStats.get(result.team.id) || {
                    wins: 0,
                    podiums: 0,
                    poles: 0,
                    fastestLaps: 0,
                    bestFinish: null,
                    points: 0
                };

                if (result.fastestLap) {
                    dStats.fastestLaps += 1;
                    tStats.fastestLaps += 1;
                }
                if (!Number.isFinite(dStats.bestFinish) || result.position < dStats.bestFinish) dStats.bestFinish = result.position;
                if (!Number.isFinite(tStats.bestFinish) || result.position < tStats.bestFinish) tStats.bestFinish = result.position;
                dStats.resultLine.push({
                    round: race.round || idx + 1,
                    trackName: track?.name || `Round ${race.round || idx + 1}`,
                    position: result.position,
                    points: (result.points || 0) + (result.fastestLapBonus || 0),
                    fastestLap: !!result.fastestLap
                });
                driverStats.set(result.driver.id, dStats);
                teamStats.set(result.team.id, tStats);
            });

            return {
                round: race.round || idx + 1,
                trackId: race.trackId,
                trackName: track?.name || `Round ${race.round || idx + 1}`,
                winner: winner?.driver?.name || '—',
                playerBestFinish: race.playerBestPosition ?? '—',
                playerPoints: race.playerPoints ?? 0,
                poleSitter: race.poleSitterName || race.poleSitter || '—',
                fastestLap: fastestLap?.driver?.name || '—',
                status: 'Complete',
                classification: fullResults
            };
        });

        const driverStandings = [...(career.championship?.driverStandings || [])]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .map((entry, idx) => ({
                position: idx + 1,
                driverId: entry.driverId,
                driverName: entry.driverName,
                teamId: entry.teamId,
                teamName: entry.teamName,
                teamColor: entry.teamColor,
                wins: entry.wins || 0,
                podiums: entry.podiums || 0,
                poles: driverStats.get(entry.driverId)?.poles || 0,
                fastestLaps: driverStats.get(entry.driverId)?.fastestLaps || 0,
                points: entry.points || 0,
                bestFinish: driverStats.get(entry.driverId)?.bestFinish ?? null,
                resultLine: driverStats.get(entry.driverId)?.resultLine || []
            }));

        const constructorStandings = [...(career.championship?.constructorStandings || [])]
            .sort((a, b) => (b.points || 0) - (a.points || 0))
            .map((entry, idx) => {
                const team = teamMap.get(entry.teamId);
                return {
                    position: idx + 1,
                    teamId: entry.teamId,
                    teamName: entry.teamName,
                    teamColor: entry.teamColor,
                    wins: entry.wins || 0,
                    podiums: entry.podiums || 0,
                    poles: teamStats.get(entry.teamId)?.poles || 0,
                    fastestLaps: teamStats.get(entry.teamId)?.fastestLaps || 0,
                    points: entry.points || 0,
                    bestFinish: teamStats.get(entry.teamId)?.bestFinish ?? null,
                    drivers: (team?.drivers || []).map(driver => driver.name),
                    teamRating: team?.carStats ? calculateOverall(team.carStats) : null,
                    summary: team?.history || 'Current season team record.'
                };
            });

        const playerConstructorPos = constructorStandings.find(item => item.teamId === career.team?.id)?.position ?? '—';
        const playerConstructorPoints = constructorStandings.find(item => item.teamId === career.team?.id)?.points ?? 0;

        return {
            season: career.season,
            label: `Season ${career.season}`,
            isActive: true,
            hasDetailedData: true,
            totalRaces: career.totalRounds || raceResults.length,
            playerTeamId: career.team?.id || null,
            overview: {
                worldChampion: driverStandings[0]?.driverName || '—',
                constructorsChampion: constructorStandings[0]?.teamName || '—',
                mostWins: Math.max(0, ...driverStandings.map(item => item.wins || 0)),
                mostPoles: Math.max(0, ...driverStandings.map(item => item.poles || 0)),
                mostPodiums: Math.max(0, ...driverStandings.map(item => item.podiums || 0)),
                mostFastestLaps: Math.max(0, ...driverStandings.map(item => item.fastestLaps || 0)),
                totalRaces: career.totalRounds || raceResults.length,
                playerTeamPosition: playerConstructorPos,
                playerTeamPoints: playerConstructorPoints
            },
            raceResults,
            driverStandings,
            constructorStandings
        };
    }

    function buildArchivedSeasonArchive(season) {
        return {
            season: season.season,
            label: `Season ${season.season}`,
            isActive: false,
            hasDetailedData: false,
            totalRaces: season.totalRounds || 0,
            playerTeamId: `legacy_${season.season}_${season.teamName || 'team'}`,
            overview: {
                worldChampion: '—',
                constructorsChampion: season.position === 1 ? (season.teamName || 'Player Team') : '—',
                mostWins: season.wins ?? '—',
                mostPoles: '—',
                mostPodiums: '—',
                mostFastestLaps: '—',
                totalRaces: season.totalRounds || '—',
                playerTeamPosition: season.position ?? '—',
                playerTeamPoints: season.points ?? '—'
            },
            raceResults: [],
            driverStandings: [],
            constructorStandings: [{
                position: season.position ?? '—',
                teamId: `legacy_${season.season}_${season.teamName || 'team'}`,
                teamName: season.teamName || 'Player Team',
                teamColor: season.teamColor || '#FFFFFF',
                wins: season.wins ?? '—',
                podiums: '—',
                poles: '—',
                fastestLaps: '—',
                points: season.points ?? '—',
                bestFinish: season.position ? 1 : '—',
                drivers: [],
                teamRating: null,
                summary: season.position === 1 ? 'Archived championship-winning summary.' : `Archived constructor result: P${season.position ?? '—'}.`
            }],
            archiveNote: 'Detailed standings, race archive, and per-driver season records were not preserved in this historical save snapshot.'
        };
    }

    function ensureHistorySelection(archive) {
        if (!archive.length) return null;
        if (historyState.season === null || !archive.some(item => item.season === historyState.season)) {
            historyState.season = archive[0].season;
        }
        const selectedSeason = archive.find(item => item.season === historyState.season) || archive[0];
        const raceResults = selectedSeason.raceResults || [];
        if (historyState.raceRound === null || !raceResults.some(item => item.round === historyState.raceRound)) {
            historyState.raceRound = raceResults[0]?.round || null;
        }
        if (historyState.selectedDriverId === null || !selectedSeason.driverStandings.some(item => item.driverId === historyState.selectedDriverId)) {
            historyState.selectedDriverId = selectedSeason.driverStandings[0]?.driverId || null;
        }
        if (historyState.selectedTeamId === null || !selectedSeason.constructorStandings.some(item => item.teamId === historyState.selectedTeamId)) {
            historyState.selectedTeamId = selectedSeason.constructorStandings[0]?.teamId || null;
        }
        return selectedSeason;
    }

    function showHistoryModal() {
        const career = StateManager.get('career');
        const profile = StateManager.get('profile') || StateManager.loadProfile?.() || {};
        const archive = buildHistoryArchive(career, profile);

        historyState = {
            season: archive[0]?.season ?? null,
            tab: 'archive',
            raceRound: archive[0]?.raceResults?.[0]?.round ?? null,
            selectedDriverId: archive[0]?.driverStandings?.[0]?.driverId ?? null,
            selectedTeamId: archive[0]?.constructorStandings?.[0]?.teamId ?? null
        };

        const rerender = () => {
            const currentCareer = StateManager.get('career');
            const currentProfile = StateManager.get('profile') || StateManager.loadProfile?.() || {};
            const latestArchive = buildHistoryArchive(currentCareer, currentProfile);
            const season = ensureHistorySelection(latestArchive);
            const shell = document.getElementById('history-archive-shell');
            if (!shell || !season) return;
            shell.innerHTML = renderHistoryArchive(season, latestArchive, currentCareer);
            attachHistoryListeners(latestArchive, currentCareer, currentProfile, rerender);
        };

        Modals.open({
            title: '🏁 RACE HISTORY DATABASE',
            className: 'modal-xl modal-reports',
            body: '<div id="history-archive-shell"></div>',
            actions: [{ label: 'Close Archive', type: 'secondary' }],
            onOpen: rerender
        });
    }

    function renderHistoryArchive(season, archive, career) {
        const selectedRace = season.raceResults.find(item => item.round === historyState.raceRound) || season.raceResults[0] || null;
        const selectedDriver = season.driverStandings.find(item => item.driverId === historyState.selectedDriverId) || season.driverStandings[0] || null;
        const selectedTeam = season.constructorStandings.find(item => item.teamId === historyState.selectedTeamId) || season.constructorStandings[0] || null;

        return `
            ${renderHistoryStyles()}
            <div class="report-shell">
                <section class="report-section">
                    <div class="report-command-bar">
                        <div>
                            <div class="market-kicker">RACE HISTORY</div>
                            <div class="report-title">${escapeHTML(season.label)}</div>
                            <div class="report-subtitle">Official FIA archive view for completed championship rounds and season standings.</div>
                        </div>
                        <div class="report-command-controls">
                            <label class="report-control report-control-select">
                                <span>Season</span>
                                <select class="select" id="history-season-select">
                                    ${archive.map(item => `<option value="${item.season}" ${item.season === season.season ? 'selected' : ''}>${item.season}</option>`).join('')}
                                </select>
                            </label>
                            <div class="report-tabs">
                                ${renderHistoryTab('archive', 'Race Archive')}
                                ${renderHistoryTab('standings', 'Standings')}
                            </div>
                        </div>
                    </div>
                    <div class="report-overview-grid">
                        <div class="report-overview-card accent"><span>World Champion</span><b>${escapeHTML(season.overview.worldChampion)}</b></div>
                        <div class="report-overview-card"><span>Constructors Champion</span><b>${escapeHTML(season.overview.constructorsChampion)}</b></div>
                        <div class="report-overview-card"><span>Most Wins</span><b>${escapeHTML(String(season.overview.mostWins ?? '—'))}</b></div>
                        <div class="report-overview-card"><span>Most Poles</span><b>${escapeHTML(String(season.overview.mostPoles ?? '—'))}</b></div>
                        <div class="report-overview-card"><span>Most Podiums</span><b>${escapeHTML(String(season.overview.mostPodiums ?? '—'))}</b></div>
                        <div class="report-overview-card"><span>Most Fastest Laps</span><b>${escapeHTML(String(season.overview.mostFastestLaps ?? '—'))}</b></div>
                        <div class="report-overview-card"><span>Total Races</span><b>${escapeHTML(String(season.overview.totalRaces ?? '—'))}</b></div>
                        <div class="report-overview-card"><span>Player Team Final Position</span><b>${String(season.overview.playerTeamPosition).startsWith('P') ? season.overview.playerTeamPosition : `P${season.overview.playerTeamPosition}`}</b></div>
                        <div class="report-overview-card"><span>Player Team Points</span><b>${escapeHTML(String(season.overview.playerTeamPoints ?? '—'))}</b></div>
                    </div>
                    ${!season.hasDetailedData ? `<div class="report-note">${escapeHTML(season.archiveNote || 'Detailed archived race data is not available for this season.')}</div>` : ''}
                </section>

                ${historyState.tab === 'archive' ? `
                    <div class="report-main-grid">
                        <div class="report-primary-column">
                            ${renderRaceArchiveTable(season, career)}
                            ${renderRaceClassificationPanel(selectedRace, career)}
                        </div>
                        <div class="report-side-column">
                            ${renderSelectedRaceOverview(selectedRace, career)}
                            ${renderSelectedRaceTeamSummary(selectedRace, career)}
                            ${renderSelectedRaceDriverSummary(selectedRace, selectedDriver)}
                        </div>
                    </div>
                ` : `
                    <div class="report-main-grid">
                        <div class="report-primary-column">
                            ${renderDriverStandingsTable(season)}
                            ${renderConstructorStandingsTable(season)}
                        </div>
                        <div class="report-side-column">
                            ${renderDriverSummaryPanel(selectedDriver)}
                            ${renderTeamSummaryPanel(selectedTeam)}
                        </div>
                    </div>
                `}
            </div>
        `;
    }

    function renderHistoryTab(id, label) {
        return `<button class="report-tab ${historyState.tab === id ? 'active' : ''}" data-history-tab="${id}">${escapeHTML(label)}</button>`;
    }

    function getRacePlayerBestResult(race, career) {
        const classification = race?.classification || [];
        const playerRows = classification.filter(row => row.team?.id === career.team?.id);
        if (!playerRows.length) return null;
        return [...playerRows].sort((a, b) => (a.position || 99) - (b.position || 99))[0];
    }

    function getRacePodium(race) {
        return (race?.classification || [])
            .filter(row => Number.isFinite(row.position) && row.position <= 3)
            .sort((a, b) => a.position - b.position)
            .map(row => row.driver?.name || '—');
    }

    function renderRaceArchiveTable(season, career) {
        if (!season.raceResults.length) return `<div class="history-empty-card">No race-by-race archive is stored for this season.</div>`;
        return `
            <div class="history-table-shell">
                <div class="history-table-title">Race Archive</div>
                <div class="history-table-wrap">
                    <table class="history-data-table">
                        <thead>
                            <tr>
                                <th>Season</th>
                                <th>Round</th>
                                <th>Track</th>
                                <th>Grid</th>
                                <th>Finish</th>
                                <th>Points</th>
                                <th>Winner</th>
                                <th>Fastest Lap</th>
                                <th>Weather</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.raceResults.map(race => {
                                const playerBest = getRacePlayerBestResult(race, career);
                                const grid = Number.isFinite(playerBest?.car?.gridPosition) ? `P${playerBest.car.gridPosition}` : '—';
                                const finish = race.playerBestFinish === '—' ? '—' : `P${race.playerBestFinish}`;
                                return `
                                    <tr class="history-row ${historyState.raceRound === race.round ? 'selected' : ''}" data-history-race="${race.round}">
                                        <td>${season.season}</td>
                                        <td>R${race.round}</td>
                                        <td>${escapeHTML(race.trackName)}</td>
                                        <td>${grid}</td>
                                        <td>${finish}</td>
                                        <td>${race.playerPoints ?? '—'}</td>
                                        <td>${escapeHTML(race.winner)}</td>
                                        <td>${escapeHTML(race.fastestLap || '—')}</td>
                                        <td>—</td>
                                        <td>${escapeHTML(race.status || 'Complete')}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderSelectedRaceOverview(race, career) {
        if (!race) return `<div class="history-empty-card">Select a completed round to review race details.</div>`;
        const playerTeamRows = (race.classification || []).filter(row => row.team?.id === career.team?.id);
        const playerBest = getRacePlayerBestResult(race, career);
        const playerPoints = playerTeamRows.reduce((sum, row) => sum + (row.points || 0) + (row.fastestLapBonus || 0), 0);
        const podium = getRacePodium(race);
        const pitStops = Number.isFinite(playerBest?.car?.pitStopCount) ? playerBest.car.pitStopCount : '—';
        const gridPos = Number.isFinite(playerBest?.car?.gridPosition) ? `P${playerBest.car.gridPosition}` : '—';
        const finishPos = race.playerBestFinish === '—' ? '—' : `P${race.playerBestFinish}`;
        return `
            <div class="history-detail-card">
                <div class="history-detail-kicker">Selected Race Overview</div>
                <h3>${escapeHTML(race.trackName)}</h3>
                <div class="history-detail-grid">
                    <div><span>Track</span><b>${escapeHTML(race.trackName)}</b></div>
                    <div><span>Date</span><b>Season ${career.season} • R${race.round}</b></div>
                    <div><span>Weather</span><b>—</b></div>
                    <div><span>Grid Position</span><b>${gridPos}</b></div>
                    <div><span>Finish Position</span><b>${finishPos}</b></div>
                    <div><span>Points</span><b>${playerPoints}</b></div>
                    <div><span>Winner</span><b>${escapeHTML(race.winner)}</b></div>
                    <div><span>Fastest Lap</span><b>${escapeHTML(race.fastestLap || '—')}</b></div>
                    <div><span>Pit Stops</span><b>${pitStops}</b></div>
                    <div><span>Safety Cars</span><b>—</b></div>
                    <div><span>Race Status</span><b>${escapeHTML(race.status || 'Complete')}</b></div>
                    <div><span>Pole Sitter</span><b>${escapeHTML(race.poleSitter || '—')}</b></div>
                </div>
                <div class="history-summary-block">
                    <span>Podium</span>
                    <p>${podium.length ? escapeHTML(podium.join(' • ')) : '—'}</p>
                </div>
                <div class="history-summary-block">
                    <span>Race Notes</span>
                    <p>No saved race notes available for this round.</p>
                </div>
            </div>
        `;
    }

    function renderRaceClassificationPanel(race, career) {
        if (!race?.classification?.length) return `<div class="history-empty-card">No full classification stored for this race.</div>`;
        return `
            <div class="history-table-shell">
                <div class="history-table-title">Full Classification</div>
                <div class="history-table-wrap">
                    <table class="history-data-table compact">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Driver</th>
                                <th>Team</th>
                                <th>Points</th>
                                <th>FL</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${race.classification.map(row => {
                                const isPlayer = row.team?.id === career.team?.id;
                                const isWinner = row.position === 1;
                                const fl = row.fastestLap ? '★' : '—';
                                return `
                                    <tr class="history-row ${isPlayer ? 'player' : ''} ${historyState.selectedDriverId === row.driver?.id ? 'selected' : ''}" data-history-driver="${row.driver?.id || ''}" data-history-team="${row.team?.id || ''}">
                                        <td>${row.position}</td>
                                        <td>${escapeHTML(row.driver?.name || '—')} ${isWinner ? '<span class="history-inline-badge winner">WIN</span>' : ''}</td>
                                        <td>${escapeHTML(row.team?.name || '—')}</td>
                                        <td>${(row.points || 0) + (row.fastestLapBonus || 0)}</td>
                                        <td>${fl}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderSelectedRaceTeamSummary(race, career) {
        if (!race?.classification?.length) return `<div class="history-empty-card">No team summary available for this race.</div>`;
        const teamRows = race.classification.filter(row => row.team?.id === career.team?.id);
        const teamPoints = teamRows.reduce((sum, row) => sum + (row.points || 0) + (row.fastestLapBonus || 0), 0);
        const bestFinish = teamRows.length ? Math.min(...teamRows.map(row => row.position || 99)) : null;
        const previousRace = (career.raceHistory || []).find(item => item.round === race.round - 1);
        const previousPoints = previousRace?.playerPoints ?? null;
        const delta = previousPoints === null ? '—' : `${teamPoints >= previousPoints ? '+' : ''}${teamPoints - previousPoints}`;
        return `
            <div class="history-detail-card">
                <div class="history-detail-kicker">Team Result Summary</div>
                <h3>${escapeHTML(career.team?.name || 'Player Team')}</h3>
                <div class="history-detail-grid">
                    <div><span>Drivers</span><b>${teamRows.length ? escapeHTML(teamRows.map(row => row.driver?.name || '—').join(', ')) : '—'}</b></div>
                    <div><span>Team Points</span><b>${teamPoints}</b></div>
                    <div><span>Best Finish</span><b>${bestFinish ? `P${bestFinish}` : '—'}</b></div>
                    <div><span>Outcome</span><b>${teamPoints > 0 ? (teamRows.length > 1 && teamPoints >= 15 ? 'Strong Points Finish' : 'Points Scored') : 'No Points'}</b></div>
                    <div><span>Delta vs Previous Race</span><b>${delta}</b></div>
                    <div><span>Status</span><b>${teamRows.length > 1 && teamPoints > 0 ? 'Both Cars Classified' : 'Engineering Review'}</b></div>
                </div>
            </div>
        `;
    }

    function renderSelectedRaceDriverSummary(race, driver) {
        if (!race?.classification?.length || !driver) return `<div class="history-empty-card">Select a driver from the classification to inspect race details.</div>`;
        const row = race.classification.find(item => item.driver?.id === driver.driverId) || null;
        if (!row) {
            return `<div class="history-empty-card">Selected driver did not appear in the stored classification for this round.</div>`;
        }
        return `
            <div class="history-detail-card">
                <div class="history-detail-kicker">Driver Result Summary</div>
                <h3>${escapeHTML(driver.driverName)}</h3>
                <div class="history-detail-grid">
                    <div><span>Team</span><b>${escapeHTML(driver.teamName)}</b></div>
                    <div><span>Position</span><b>P${row.position}</b></div>
                    <div><span>Points</span><b>${(row.points || 0) + (row.fastestLapBonus || 0)}</b></div>
                    <div><span>Fastest Lap</span><b>${row.fastestLap ? 'Yes' : '—'}</b></div>
                </div>
                <div class="history-summary-block">
                    <span>Result Line</span>
                    <p>R${race.round} • ${escapeHTML(race.trackName)} • P${row.position} • ${(row.points || 0) + (row.fastestLapBonus || 0)} pts${row.fastestLap ? ' • Fastest Lap' : ''}</p>
                </div>
            </div>
        `;
    }

    function renderDriverStandingsTable(season) {
        if (!season.driverStandings.length) return `<div class="history-empty-card">Full driver positions are not available for this archived season.</div>`;
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
                                <th>Fastest Laps</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.driverStandings.map(row => `
                                <tr class="history-row ${historyState.selectedDriverId === row.driverId ? 'selected' : ''}" data-history-driver="${row.driverId}" data-history-team="${row.teamId}">
                                    <td>P${row.position}</td>
                                    <td>${escapeHTML(row.driverName)}</td>
                                    <td>${escapeHTML(row.teamName)}</td>
                                    <td>${row.wins}</td>
                                    <td>${row.podiums}</td>
                                    <td>${row.poles}</td>
                                    <td>${row.fastestLaps}</td>
                                    <td>${row.points}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderConstructorStandingsTable(season) {
        if (!season.constructorStandings.length) return `<div class="history-empty-card">Full constructor positions are not available for this archived season.</div>`;
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
                                <th>Fastest Laps</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${season.constructorStandings.map(row => `
                                <tr class="history-row ${historyState.selectedTeamId === row.teamId ? 'selected' : ''}" data-history-team="${row.teamId}">
                                    <td>${String(row.position).startsWith('P') ? row.position : `P${row.position}`}</td>
                                    <td>${escapeHTML(row.teamName)}</td>
                                    <td>${escapeHTML(String(row.wins ?? '—'))}</td>
                                    <td>${escapeHTML(String(row.podiums ?? '—'))}</td>
                                    <td>${escapeHTML(String(row.poles ?? '—'))}</td>
                                    <td>${escapeHTML(String(row.fastestLaps ?? '—'))}</td>
                                    <td>${escapeHTML(String(row.points ?? '—'))}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function renderTeamSummaryPanel(team) {
        if (!team) return `<div class="history-empty-card">Select a constructor to inspect season details.</div>`;
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
                    <div><span>Drivers</span><b>${team.drivers?.length ? escapeHTML(team.drivers.join(', ')) : '—'}</b></div>
                    <div><span>Team Rating</span><b>${team.teamRating ?? '—'}</b></div>
                </div>
                <div class="history-summary-block">
                    <span>Season Summary</span>
                    <p>${escapeHTML(team.summary || 'No team summary is stored for this season.')}</p>
                </div>
            </div>
        `;
    }

    function renderDriverSummaryPanel(driver) {
        if (!driver) return `<div class="history-empty-card">Select a driver to inspect season details.</div>`;
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
                    <div><span>Best Finish</span><b>${driver.bestFinish ? `P${driver.bestFinish}` : '—'}</b></div>
                </div>
                <div class="history-summary-block">
                    <span>Recent Results</span>
                    ${driver.resultLine?.length
                        ? `<div class="history-result-line">${driver.resultLine.slice(-5).map(item => `R${item.round} ${escapeHTML(item.trackName)} P${item.position}`).join(' • ')}</div>`
                        : `<p>No multi-round result line is stored for this driver.</p>`}
                </div>
            </div>
        `;
    }

    function attachHistoryListeners(archive, career, profile, rerender) {
        document.getElementById('history-season-select')?.addEventListener('change', (e) => {
            historyState.season = parseInt(e.target.value, 10);
            historyState.raceRound = null;
            historyState.selectedDriverId = null;
            historyState.selectedTeamId = null;
            rerender();
        });

        document.querySelectorAll('[data-history-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                historyState.tab = btn.dataset.historyTab || 'standings';
                rerender();
            });
        });

        document.querySelectorAll('[data-history-race]').forEach(row => {
            row.addEventListener('click', () => {
                historyState.raceRound = parseInt(row.dataset.historyRace, 10);
                rerender();
            });
        });

        document.querySelectorAll('[data-history-driver]').forEach(row => {
            row.addEventListener('click', () => {
                const id = row.dataset.historyDriver;
                if (id) historyState.selectedDriverId = id;
                const teamId = row.dataset.historyTeam;
                if (teamId) historyState.selectedTeamId = teamId;
                rerender();
            });
        });

        document.querySelectorAll('[data-history-team]').forEach(row => {
            row.addEventListener('click', () => {
                const teamId = row.dataset.historyTeam;
                if (teamId) historyState.selectedTeamId = teamId;
                rerender();
            });
        });
    }

    function renderHistoryStyles() {
        return `
            <style>
                #modal-box.modal-xl.modal-reports {
                    width: min(96vw, 1380px);
                    max-width: 1380px;
                    max-height: 86vh;
                }
                .report-shell { display:flex; flex-direction:column; gap:16px; font-family:Rajdhani, sans-serif; }
                .report-section, .history-table-shell, .history-detail-card, .history-empty-card, .report-note { background: linear-gradient(135deg, rgba(20,20,30,0.88), rgba(8,8,14,0.96)); border:1px solid rgba(255,255,255,0.10); border-radius:16px; padding:16px; }
                .report-command-bar { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap; background:linear-gradient(135deg,rgba(0,128,255,.14),rgba(0,255,65,.08)); border:1px solid rgba(0,128,255,.32); border-radius:14px; padding:14px; }
                .report-title { font-family:Orbitron; color:var(--white); font-size:22px; margin-top:4px; }
                .report-subtitle { color:var(--gray-400); font-size:13px; margin-top:6px; line-height:1.4; }
                .report-command-controls { display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap; }
                .report-control span, .report-overview-card span, .history-table-title, .history-detail-kicker, .history-detail-grid span, .history-summary-block span { display:block; font-family:Orbitron; font-size:9px; color:var(--gray-500); letter-spacing:1px; text-transform:uppercase; }
                .report-control-select { min-width:180px; }
                .report-control-select span { margin-bottom:6px; }
                .report-tabs { display:flex; gap:8px; flex-wrap:wrap; }
                .report-tab { padding:8px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.04); color:var(--gray-300); cursor:pointer; font-family:Orbitron; font-size:10px; letter-spacing:1px; }
                .report-tab.active { border-color:var(--green); background:rgba(0,255,65,0.12); color:var(--white); }
                .report-overview-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin-top:14px; }
                .report-overview-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; min-height:82px; }
                .report-overview-card.accent { border-color:rgba(0,255,65,0.22); box-shadow: inset 0 0 16px rgba(0,255,65,0.06); }
                .report-overview-card b { display:block; margin-top:6px; font-family:Orbitron; font-size:17px; color:var(--white); line-height:1.15; overflow-wrap:anywhere; }
                .report-note { color:var(--gray-300); line-height:1.45; }
                .report-main-grid { display:grid; grid-template-columns:minmax(0,1.6fr) minmax(360px,0.9fr); gap:16px; align-items:start; }
                .report-primary-column, .report-side-column { display:flex; flex-direction:column; gap:16px; }
                .history-table-wrap { overflow:auto; margin-top:10px; border-radius:12px; border:1px solid rgba(255,255,255,0.08); }
                .history-data-table { width:100%; border-collapse:collapse; font-family:Rajdhani; font-size:13px; }
                .history-data-table.compact { font-size:12px; }
                .history-data-table th { position:sticky; top:0; background:rgba(255,255,255,0.05); font-family:Orbitron; font-size:10px; color:var(--gray-500); text-align:left; padding:10px; z-index:1; }
                .history-data-table td { padding:10px; border-top:1px solid rgba(255,255,255,0.05); color:var(--white); }
                .history-row { cursor:pointer; transition:background .18s ease; }
                .history-row:hover, .history-row.selected { background:rgba(0,255,65,0.08); }
                .history-row.player { box-shadow: inset 3px 0 0 var(--green); }
                .history-inline-badge { display:inline-flex; align-items:center; justify-content:center; margin-left:6px; padding:2px 6px; border-radius:999px; font-family:Orbitron; font-size:8px; letter-spacing:1px; }
                .history-inline-badge.winner { background:rgba(255,215,0,0.14); color:#FFD700; border:1px solid rgba(255,215,0,0.22); }
                .history-detail-card h3 { font-family:Orbitron; color:var(--white); margin:6px 0 0; font-size:20px; }
                .history-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
                .history-detail-grid div, .history-summary-block { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 12px; }
                .history-detail-grid b { display:block; margin-top:4px; font-family:Orbitron; color:var(--white); font-size:13px; line-height:1.2; overflow-wrap:anywhere; }
                .history-summary-block { margin-top:12px; }
                .history-summary-block p, .history-result-line { margin-top:8px; color:var(--gray-300); line-height:1.45; }
                .history-empty-card { color:var(--gray-400); text-align:center; }
                @media (max-width: 1050px) {
                    .report-overview-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
                    .report-main-grid { grid-template-columns:1fr; }
                }
                @media (max-width: 700px) {
                    .report-command-controls { width:100%; align-items:stretch; }
                    .report-control-select { width:100%; }
                    .report-overview-grid, .history-detail-grid { grid-template-columns:1fr; }
                }
            </style>
        `;
    }

    /* === TEAM INFO DATABASE === */
    function getTeamStructureData(career) {
        return {
            reserveDriver: career.academy?.reserveDriver || null,
            academyDrivers: Array.isArray(career.academy?.drivers) ? career.academy.drivers : []
        };
    }

    function getFacilityDatabaseRows(career) {
        const facilities = career.headquarters?.facilities || {};
        const defs = {
            simulation: 'Simulator',
            driverDevelopment: 'Academy',
            manufacturing: 'Factory',
            aerodynamics: 'Aerodynamics',
            rd: 'R&D'
        };
        return Object.entries(defs).map(([key, label]) => {
            const facility = facilities[key] || { level: 1, upgrade: null };
            const upgrade = facility.upgrade || null;
            const progress = upgrade ? Math.max(4, Math.min(100, 100 - (upgrade.weeksRemaining / upgrade.totalWeeks) * 100)) : facility.level * 10;
            return {
                key,
                label,
                level: facility.level || 1,
                status: upgrade ? `Upgrading to Lv.${upgrade.toLevel}` : 'Operational',
                progress,
                completion: upgrade ? `${upgrade.weeksRemaining * 7} Days Remaining` : '—'
            };
        });
    }

    function showTeamModal() {
        const career = StateManager.get('career');
        teamInfoState = {
            focusType: 'driver',
            driverId: career.drivers?.[0]?.id || null,
            staffRole: Object.keys(career.staff || {})[0] || null
        };

        const rerender = () => {
            const currentCareer = StateManager.get('career');
            const shell = document.getElementById('team-dossier-shell');
            if (!shell || !currentCareer) return;
            shell.innerHTML = renderTeamDossier(currentCareer);
            attachTeamDossierListeners(currentCareer, rerender);
        };

        Modals.open({
            title: '🏎️ CONSTRUCTOR OPERATIONS DATABASE',
            className: 'modal-xl modal-reports',
            body: '<div id="team-dossier-shell"></div>',
            actions: [{ label: 'Close Dossier', type: 'secondary' }],
            onOpen: rerender
        });
    }

    function renderTeamDossier(career) {
        const team = career.team || {};
        const constructorStandings = [...(career.championship?.constructorStandings || [])].sort((a, b) => (b.points || 0) - (a.points || 0));
        const teamStanding = constructorStandings.findIndex(item => item.teamId === team.id) + 1;
        const teamData = constructorStandings.find(item => item.teamId === team.id) || { points: 0, wins: 0, podiums: 0 };
        const selectedDriver = career.drivers?.find(driver => driver.id === teamInfoState.driverId) || career.drivers?.[0] || null;
        const selectedStaffRole = (career.staff && career.staff[teamInfoState.staffRole]) ? teamInfoState.staffRole : Object.keys(career.staff || {})[0] || null;
        const selectedStaff = selectedStaffRole ? career.staff[selectedStaffRole] : null;
        const driverSeasonRows = (career.championship?.driverStandings || []).filter(row => row.teamId === team.id);
        const teamRating = calculateOverall(career.carStats || {});
        const bestFinish = getTeamBestFinish(career);
        const form = (career.raceHistory || []).slice(-5).map(race => `P${race.playerBestPosition || '-'}`).join(' ') || '—';
        const racesCompleted = career.raceHistory?.length || 0;
        const hqRating = getHQRating(career);
        const historicalSummary = getTeamHistoricalSummary(career);
        const structure = getTeamStructureData(career);
        const facilityRows = getFacilityDatabaseRows(career);
        const palette = getTeamPalette(career);

        return `
            ${renderTeamDossierStyles()}
            <div class="report-shell team-report-shell" style="--teamdb-primary:${palette.primary}; --teamdb-secondary:${palette.secondary}; --teamdb-accent:${palette.accent};">
                <section class="report-section">
                    <div class="report-command-bar">
                        <div>
                            <div class="market-kicker">TEAM INFO</div>
                            <div class="report-title">${escapeHTML(team.name || 'Player Team')}</div>
                            <div class="report-subtitle">${escapeHTML(team.shortName || 'TEAM')} • Season ${career.season} • Constructors P${teamStanding || '—'} • ${teamData.points || 0} pts</div>
                        </div>
                        <div class="report-overview-grid compact-head">
                            <div class="report-overview-card"><span>Budget</span><b>$${formatMoney(career.budget || 0)}</b></div>
                            <div class="report-overview-card"><span>Team Rating</span><b>${teamRating}</b></div>
                            <div class="report-overview-card"><span>Facility Rating</span><b>${hqRating}</b></div>
                        </div>
                    </div>
                    <div class="report-overview-grid team-overview-grid">
                        <div class="report-overview-card accent"><span>Constructors Position</span><b>P${teamStanding || '—'}</b></div>
                        <div class="report-overview-card"><span>Current Points</span><b>${teamData.points || 0}</b></div>
                        <div class="report-overview-card"><span>Season Wins</span><b>${teamData.wins || 0}</b></div>
                        <div class="report-overview-card"><span>Season Podiums</span><b>${teamData.podiums || 0}</b></div>
                        <div class="report-overview-card"><span>Best Finish</span><b>${bestFinish ? `P${bestFinish}` : '—'}</b></div>
                        <div class="report-overview-card"><span>Current Form</span><b>${escapeHTML(form)}</b></div>
                        <div class="report-overview-card"><span>Races Completed</span><b>${racesCompleted}</b></div>
                        <div class="report-overview-card"><span>Facility Rating</span><b>${hqRating}</b></div>
                    </div>
                </section>

                <div class="report-main-grid">
                    <div class="report-primary-column">
                        <div class="history-table-shell">
                            <div class="history-table-title">Team Structure</div>
                            <div class="team-structure-group">
                                <div class="team-structure-heading">Drivers</div>
                                <div class="team-normal-driver-list">
                                    ${career.drivers.map(driver => renderDriverCard(driver, driverSeasonRows, selectedDriver?.id)).join('')}
                                </div>
                            </div>
                            <div class="team-structure-group compact-group">
                                <div class="team-structure-heading">Reserve Driver</div>
                                <div class="team-normal-support-list">
                                    ${structure.reserveDriver ? renderSupportPersonCard(structure.reserveDriver, 'Reserve Driver', 'reserve', selectedDriver?.id) : '<div class="team-normal-placeholder">No reserve driver stored.</div>'}
                                </div>
                            </div>
                            <div class="team-structure-group compact-group">
                                <div class="team-structure-heading">Academy Drivers</div>
                                <div class="team-normal-support-list">
                                    ${structure.academyDrivers.length ? structure.academyDrivers.map(driver => renderSupportPersonCard(driver, 'Academy Driver', 'academy', selectedDriver?.id)).join('') : '<div class="team-normal-placeholder">No academy drivers stored.</div>'}
                                </div>
                            </div>
                            <div class="team-structure-group compact-group">
                                <div class="team-structure-heading">Leadership Roles</div>
                                <div class="team-normal-role-grid">
                                    <div class="teamdb-role-chip"><span>Technical Director</span><b>${escapeHTML(career.staff?.techDirector?.name || '—')}</b></div>
                                    <div class="teamdb-role-chip"><span>Chief Strategist</span><b>${escapeHTML(career.staff?.strategist?.name || '—')}</b></div>
                                    <div class="teamdb-role-chip"><span>Head Engineer</span><b>—</b></div>
                                </div>
                            </div>
                        </div>

                        <div class="history-table-shell">
                            <div class="history-table-title">Staff Overview</div>
                            <div class="team-normal-staff-list">
                                ${Object.entries(career.staff || {}).map(([role, staff]) => staff ? renderStaffRow(role, staff, selectedStaffRole) : '').join('')}
                            </div>
                        </div>
                    </div>

                    <div class="report-side-column">
                        ${renderTeamFocusPanel(selectedDriver, selectedStaff, selectedStaffRole, driverSeasonRows, historicalSummary)}
                    </div>
                </div>

                <div class="team-report-bottom-grid">
                    <div class="history-table-shell">
                        <div class="history-table-title">Car Performance</div>
                        <div class="team-normal-performance-grid">
                            <div class="team-normal-overall-pill"><span>Overall</span><b>${teamRating}</b></div>
                            <div class="team-normal-performance-bars">
                                ${Object.entries(career.carStats || {}).map(([key, value]) => renderPerformanceBar(formatStatName(key), value)).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="history-table-shell">
                        <div class="history-table-title">Season Performance</div>
                        <div class="report-overview-grid compact-grid">
                            <div class="report-overview-card"><span>Wins</span><b>${teamData.wins || 0}</b></div>
                            <div class="report-overview-card"><span>Podiums</span><b>${teamData.podiums || 0}</b></div>
                            <div class="report-overview-card"><span>Current Points</span><b>${teamData.points || 0}</b></div>
                            <div class="report-overview-card"><span>Best Finish</span><b>${bestFinish ? `P${bestFinish}` : '—'}</b></div>
                            <div class="report-overview-card"><span>Last 5 Results</span><b>${escapeHTML(form)}</b></div>
                            <div class="report-overview-card"><span>Races Completed</span><b>${racesCompleted}</b></div>
                        </div>
                    </div>

                    <div class="history-table-shell">
                        <div class="history-table-title">Facility Database</div>
                        <div class="team-normal-facility-list">
                            ${facilityRows.map(row => renderFacilityRow(row)).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderDriverCard(driver, seasonRows, selectedDriverId) {
        const season = seasonRows.find(row => row.driverId === driver.id) || { points: 0, wins: 0, podiums: 0, bestFinish: 99 };
        const traitList = getDriverTraitLabels(driver).slice(0, 3);
        return `
            <button class="teamdb-driver-card ${selectedDriverId === driver.id ? 'active' : ''}" data-teamdb-driver="${driver.id}">
                <div class="teamdb-driver-top">
                    <span class="teamdb-flag">${escapeHTML(driver.flag || '🏁')}</span>
                    <div class="teamdb-driver-rating"><span>OVR</span><b>${driver.rating || '—'}</b></div>
                </div>
                <div class="teamdb-driver-name">${escapeHTML(driver.name)}</div>
                <div class="teamdb-driver-meta">${escapeHTML(driver.nationality || 'Global')} • Age ${driver.age || '—'} • POT ${driver.potentialRating || driver.rating || '—'}</div>
                <div class="teamdb-driver-metrics">
                    <div><span>Points</span><b>${season.points || 0}</b></div>
                    <div><span>Wins</span><b>${season.wins || 0}</b></div>
                    <div><span>Podiums</span><b>${season.podiums || 0}</b></div>
                </div>
                <div class="teamdb-tags">${traitList.length ? traitList.map(trait => `<span>${escapeHTML(trait)}</span>`).join('') : '<span>No traits listed</span>'}</div>
            </button>
        `;
    }

    function renderStaffRow(role, staff, selectedRole) {
        return `
            <div class="teamdb-staff-row ${selectedRole === role ? 'active' : ''}" data-teamdb-staff="${role}">
                <div class="teamdb-staff-copy">
                    <div class="teamdb-staff-role">${escapeHTML(formatRoleName(role))}</div>
                    <div class="teamdb-staff-name">${escapeHTML(staff.name)}</div>
                    <div class="teamdb-staff-meta">${escapeHTML(staff.contractStatus || 'ACTIVE')} • $${formatMoney(staff.salary || 0)}</div>
                </div>
                <button class="btn btn-glow teamdb-staff-renew" data-staff-renew="${role}">RENEW</button>
            </div>
        `;
    }

    function renderSupportPersonCard(person, label, mode, selectedDriverId) {
        const active = mode !== 'academy' && selectedDriverId === person.id ? 'active' : '';
        return `
            <button class="teamdb-driver-card support-card ${active}" ${mode !== 'academy' ? `data-teamdb-driver="${person.id}"` : ''}>
                <div class="teamdb-driver-top">
                    <span class="teamdb-flag">${escapeHTML(person.flag || '🏁')}</span>
                    <div class="teamdb-driver-rating"><span>${escapeHTML(label)}</span><b>${person.rating || '—'}</b></div>
                </div>
                <div class="teamdb-driver-name">${escapeHTML(person.name || 'Unknown')}</div>
                <div class="teamdb-driver-meta">${escapeHTML(person.nationality || 'Global')} • Age ${person.age || '—'} • POT ${person.potentialRating || person.rating || '—'}</div>
            </button>
        `;
    }

    function renderFacilityRow(row) {
        return `
            <div class="teamdb-facility-row">
                <div class="teamdb-facility-head">
                    <span>${escapeHTML(row.label)}</span>
                    <b>Lv.${row.level}</b>
                </div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${row.progress}%"></div></div>
                <div class="teamdb-facility-meta">
                    <span>${escapeHTML(row.status)}</span>
                    <span>${escapeHTML(row.completion)}</span>
                </div>
            </div>
        `;
    }

    function renderTeamFocusPanel(driver, staff, staffRole, seasonRows, historicalSummary) {
        const season = driver ? seasonRows.find(row => row.driverId === driver.id) || { points: 0, wins: 0, podiums: 0, bestFinish: 99 } : null;

        return `
            <div class="history-table-shell team-focus-shell">
                <div class="history-table-title">Detail Panel</div>
                ${driver ? `
                    <div class="teamdb-detail-card">
                        <div class="teamdb-detail-kicker">Driver Detail</div>
                        <h3>${escapeHTML(driver.name)}</h3>
                        <div class="teamdb-detail-grid">
                            <div><span>Team</span><b>${escapeHTML(StateManager.get('career')?.team?.name || 'Player Team')}</b></div>
                            <div><span>Nationality</span><b>${escapeHTML(driver.nationality || 'Global')}</b></div>
                            <div><span>Age</span><b>${driver.age || '—'}</b></div>
                            <div><span>OVR</span><b>${driver.rating || '—'}</b></div>
                            <div><span>Potential</span><b>${driver.potentialRating || driver.rating || '—'}</b></div>
                            <div><span>Status</span><b>${escapeHTML(driver.contractStatus || 'ACTIVE')}</b></div>
                            <div><span>Points</span><b>${season?.points || 0}</b></div>
                            <div><span>Wins</span><b>${season?.wins || 0}</b></div>
                            <div><span>Podiums</span><b>${season?.podiums || 0}</b></div>
                            <div><span>Best Finish</span><b>${Number.isFinite(season?.bestFinish) && season.bestFinish < 99 ? `P${season.bestFinish}` : '—'}</b></div>
                        </div>
                        <div class="teamdb-detail-block">
                            <span>Traits</span>
                            <div class="teamdb-tags">${getDriverTraitLabels(driver).map(trait => `<span>${escapeHTML(trait)}</span>`).join('') || '<span>No traits listed</span>'}</div>
                        </div>
                        <div class="teamdb-detail-block">
                            <span>Recent Results</span>
                            <p>${escapeHTML((StateManager.get('career')?.raceHistory || []).slice(-5).map(race => `R${race.round} P${race.playerBestPosition || '-'}`).join(' • ') || '—')}</p>
                        </div>
                    </div>
                ` : ''}
                ${staff ? `
                    <div class="teamdb-detail-card secondary">
                        <div class="teamdb-detail-kicker">Staff Detail</div>
                        <h3>${escapeHTML(staff.name)}</h3>
                        <div class="teamdb-detail-grid">
                            <div><span>Role</span><b>${escapeHTML(formatRoleName(staffRole))}</b></div>
                            <div><span>Salary</span><b>$${formatMoney(staff.salary || 0)}</b></div>
                            <div><span>Contract</span><b>${staff.contractYears || 0}Y</b></div>
                            <div><span>Status</span><b>${escapeHTML(staff.contractStatus || 'ACTIVE')}</b></div>
                            <div><span>Rating</span><b>${staff.rating ?? '—'}</b></div>
                            <div><span>Summary</span><b>${escapeHTML(staff.specialty || staff.bio || 'Team operations record')}</b></div>
                        </div>
                    </div>
                ` : ''}
                <div class="teamdb-detail-card secondary">
                    <div class="teamdb-detail-kicker">Championship History</div>
                    <h3>${escapeHTML(StateManager.get('career')?.team?.name || 'Player Team')}</h3>
                    <div class="teamdb-detail-grid">
                        <div><span>Championships Won</span><b>${historicalSummary.championships}</b></div>
                        <div><span>Best Historical Finish</span><b>${historicalSummary.bestFinish ? `P${historicalSummary.bestFinish}` : '—'}</b></div>
                        <div><span>Seasons Completed</span><b>${historicalSummary.seasons}</b></div>
                        <div><span>Historical Points</span><b>${historicalSummary.points}</b></div>
                    </div>
                    <div class="teamdb-detail-block">
                        <span>Recent Legacy Seasons</span>
                        <p>${historicalSummary.recent.length ? escapeHTML(historicalSummary.recent.map(item => `S${item.season} P${item.position} ${item.points} pts`).join(' • ')) : 'No completed legacy seasons stored yet.'}</p>
                    </div>
                </div>
            </div>
        `;
    }

    function renderPerformanceBar(label, value) {
        return `
            <div class="teamdb-performance-row">
                <div class="teamdb-performance-head"><span>${escapeHTML(label)}</span><b>${value}</b></div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.max(0, Math.min(100, value || 0))}%"></div></div>
            </div>
        `;
    }

    function attachTeamDossierListeners(career, rerender) {
        document.querySelectorAll('[data-teamdb-driver]').forEach(btn => {
            btn.addEventListener('click', () => {
                teamInfoState.focusType = 'driver';
                teamInfoState.driverId = btn.dataset.teamdbDriver;
                rerender();
            });
        });
        document.querySelectorAll('[data-teamdb-staff]').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('[data-staff-renew]')) return;
                teamInfoState.focusType = 'staff';
                teamInfoState.staffRole = row.dataset.teamdbStaff;
                rerender();
            });
        });
        document.querySelectorAll('[data-staff-renew]').forEach(btn => {
            btn.addEventListener('click', () => renewStaffContract(btn.dataset.staffRenew));
        });
    }

    function renderTeamDossierStyles() {
        return `
            <style>
                .team-report-shell { display:flex; flex-direction:column; gap:16px; }
                .team-overview-grid { margin-top:14px; }
                .report-overview-grid.compact-head { display:grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap:10px; width:min(100%, 420px); min-width:0; margin-top:0; }
                .report-overview-grid.compact-grid { grid-template-columns: repeat(2, minmax(0,1fr)); margin-top:10px; }
                .teamdb-driver-card, .teamdb-staff-row, .teamdb-detail-card, .teamdb-facility-row { background:linear-gradient(135deg, rgba(20,20,30,0.88), rgba(8,8,14,0.96)); border:1px solid rgba(255,255,255,0.10); border-radius:14px; }
                .team-structure-group { display:flex; flex-direction:column; gap:10px; }
                .team-structure-group.compact-group { margin-top:14px; }
                .team-structure-heading { font-family:Orbitron; font-size:10px; color:var(--teamdb-accent, #FFD700); letter-spacing:1.5px; text-transform:uppercase; }
                .team-normal-driver-list { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; margin-top:0; }
                .team-normal-support-list, .team-normal-staff-list, .team-normal-facility-list { display:flex; flex-direction:column; gap:8px; margin-top:0; }
                .team-normal-role-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; }
                .teamdb-role-chip { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 12px; }
                .teamdb-role-chip span { display:block; font-family:Orbitron; font-size:8px; color:var(--gray-500); letter-spacing:1px; text-transform:uppercase; }
                .teamdb-role-chip b { display:block; margin-top:5px; font-family:Orbitron; font-size:12px; color:var(--white); line-height:1.2; overflow-wrap:anywhere; }
                .team-normal-placeholder { padding:12px; border-radius:12px; border:1px dashed rgba(255,255,255,0.10); color:var(--gray-500); text-align:center; font-size:12px; background:rgba(255,255,255,0.02); }
                .teamdb-driver-card { padding:14px; display:flex; flex-direction:column; gap:10px; cursor:pointer; text-align:left; transition:0.18s ease; border-left:3px solid color-mix(in srgb, var(--teamdb-primary, #00FF41) 70%, white 10%); }
                .teamdb-driver-card.support-card { min-height:0; }
                .teamdb-driver-card.active, .teamdb-driver-card:hover { background: rgba(0,255,65,0.08); border-color: var(--teamdb-primary, #00FF41); transform: translateY(-2px); }
                .teamdb-driver-top { display:flex; justify-content:space-between; gap:10px; align-items:flex-start; }
                .teamdb-flag { font-size:24px; }
                .teamdb-driver-rating { min-width:58px; text-align:center; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:6px 8px; }
                .teamdb-driver-rating span, .teamdb-driver-metrics span, .teamdb-staff-role, .teamdb-detail-kicker, .teamdb-detail-grid span, .teamdb-detail-block span, .teamdb-performance-head span, .team-normal-overall-pill span, .teamdb-facility-head span { display:block; font-family:Orbitron; font-size:8px; color:var(--gray-500); letter-spacing:1px; text-transform:uppercase; }
                .teamdb-driver-rating b, .team-normal-overall-pill b, .teamdb-facility-head b { display:block; margin-top:3px; font-family:Orbitron; font-size:18px; color:var(--teamdb-accent, #FFD700); }
                .teamdb-driver-name, .teamdb-detail-card h3 { font-family:Orbitron; font-size:15px; color:var(--white); line-height:1.15; margin:0; }
                .teamdb-driver-meta, .teamdb-staff-meta, .teamdb-detail-block p, .team-normal-legacy-list, .teamdb-facility-meta { color:var(--gray-400); font-size:12px; line-height:1.4; }
                .teamdb-driver-metrics { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:8px; }
                .teamdb-driver-metrics div, .teamdb-detail-grid div { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:8px 10px; }
                .teamdb-driver-metrics b, .teamdb-detail-grid b, .teamdb-detail-block b, .teamdb-performance-head b { display:block; margin-top:4px; color:var(--white); font-family:Orbitron; font-size:12px; line-height:1.2; overflow-wrap:anywhere; }
                .teamdb-tags { display:flex; flex-wrap:wrap; gap:6px; }
                .teamdb-tags span { background: rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:999px; padding:4px 8px; font-size:10px; color:var(--gray-300); }
                .teamdb-staff-row { padding:12px; display:flex; justify-content:space-between; gap:12px; align-items:center; cursor:pointer; transition:0.18s ease; }
                .teamdb-staff-row.active, .teamdb-staff-row:hover { background: rgba(0,191,255,0.08); }
                .teamdb-staff-row.placeholder-static { cursor:default; }
                .teamdb-staff-copy { flex:1; min-width:0; }
                .teamdb-staff-name { color:var(--white); font-family:Orbitron; font-size:14px; margin-top:4px; }
                .team-focus-shell { padding:16px; }
                .teamdb-detail-card { padding:14px; }
                .teamdb-detail-card.secondary { margin-top:14px; }
                .teamdb-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
                .teamdb-detail-block { margin-top:12px; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:10px 12px; }
                .team-report-bottom-grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:16px; }
                .team-normal-performance-grid { display:grid; grid-template-columns: 110px 1fr; gap:14px; align-items:flex-start; margin-top:10px; }
                .team-normal-overall-pill { text-align:center; padding:12px; background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; }
                .team-normal-performance-bars { display:flex; flex-direction:column; gap:10px; }
                .teamdb-performance-row { display:flex; flex-direction:column; gap:6px; }
                .teamdb-performance-head { display:flex; justify-content:space-between; gap:10px; }
                .teamdb-facility-row { padding:12px; display:flex; flex-direction:column; gap:8px; }
                .teamdb-facility-head { display:flex; justify-content:space-between; gap:12px; align-items:center; }
                .teamdb-facility-meta { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; }
                .team-normal-legacy-list { display:flex; flex-direction:column; gap:6px; margin-top:12px; }
                @media (max-width: 1100px) {
                    .report-overview-grid.compact-head, .report-overview-grid.compact-grid, .team-report-bottom-grid { grid-template-columns: repeat(2, minmax(0,1fr)); width:100%; }
                }
                @media (max-width: 700px) {
                    .report-overview-grid.compact-head, .report-overview-grid.compact-grid, .team-normal-driver-list, .teamdb-driver-metrics, .teamdb-detail-grid, .team-report-bottom-grid, .team-normal-performance-grid, .team-normal-role-grid { grid-template-columns:1fr; min-width:0; }
                    .teamdb-staff-row, .teamdb-facility-meta { flex-direction:column; align-items:flex-start; }
                }
            </style>
        `;
    }

    /* === EXISTING SEASON TRANSITION === */
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

        if (typeof Notifications !== 'undefined') {
            Notifications.success(`Season ${career.season} begins!`, 'The driver market has been reshuffled.');
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

        if (window.DashboardScreen?.render) window.DashboardScreen.render();
    }

    /* === HELPERS === */
    function getDriverTraitLabels(driver) {
        return (driver?.traits || []).map(traitKey => {
            const trait = typeof DRIVER_TRAITS !== 'undefined' ? DRIVER_TRAITS[traitKey] : null;
            return trait ? `${trait.icon} ${trait.name}` : String(traitKey).replace(/_/g, ' ');
        });
    }

    function calculateOverall(stats) {
        const values = Object.values(stats || {}).filter(v => Number.isFinite(v));
        if (!values.length) return 0;
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    function getTeamBestFinish(career) {
        const finishes = (career.raceHistory || []).map(race => race.playerBestPosition).filter(v => Number.isFinite(v));
        return finishes.length ? Math.min(...finishes) : null;
    }

    function getHQRating(career) {
        const facilities = career.headquarters?.facilities || {};
        const levels = Object.values(facilities).map(f => f.level || 1);
        return levels.length ? Math.round((levels.reduce((sum, level) => sum + level, 0) / levels.length) * 10) : '—';
    }

    function getTeamHistoricalSummary(career) {
        const profile = StateManager.get('profile') || {};
        const seasons = (profile.careerHistory || []).filter(entry => entry.teamName === career.team?.name);
        return {
            championships: seasons.filter(entry => entry.position === 1).length,
            bestFinish: seasons.length ? Math.min(...seasons.map(entry => entry.position || 99)) : null,
            seasons: seasons.length,
            points: seasons.reduce((sum, entry) => sum + (entry.points || 0), 0),
            recent: seasons.slice(-3).reverse()
        };
    }

    function getTeamPalette(career) {
        const livery = career?.livery || {};
        return {
            primary: livery.primary || career?.team?.color || '#00FF41',
            secondary: livery.secondary || '#111111',
            accent: livery.accent || '#FFFFFF'
        };
    }

    function formatRoleName(role) {
        return String(role || '').replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
    }

    function formatStatName(key) {
        return String(key || '').replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
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

    return {
        openStandings: showStandingsModal,
        openTeam: showTeamModal,
        openHistory: showHistoryModal,
        advanceToNextSeason
    };
})();
