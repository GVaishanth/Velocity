/* ============================================
   VELOCITY — RESULTS SCREEN
   Post-race results with podium animation,
   stats, championship updates
   ============================================ */

const ResultsScreen = (() => {

    let container = null;
    let isActive = false;

    function init() {
        container = document.getElementById('results-content');
        if (!container) return;
        attachListeners();
    }

    function render() {
        if (!container) return;
        try {
            const results = StateManager.get('raceResults');
            const race = StateManager.get('race');

            if (!results || !Array.isArray(results) || results.length === 0 || !race) {
                container.innerHTML = `
                    <div style="text-align: center; padding: var(--space-3xl);">
                        <h2 style="font-family: Orbitron; color: var(--yellow);">NO CLASSIFICATION RECOGNIZED</h2>
                        <p style="color: var(--gray-400); font-family: Rajdhani; margin-bottom: 20px;">The Grand Prix results sheet is currently syncing or unavailable.</p>
                        <button class="btn btn-glow" id="res-back">RETURN TO HOME</button>
                    </div>
                `;
                container.querySelector('#res-back')?.addEventListener('click', () => typeof EventBus !== 'undefined' && EventBus.emit('nav:home'));
                return;
            }

            const podium = results.slice(0, 3);
            const playerResults = results.filter(r => r && r.team && r.team.id === race.playerTeamId);
            const bestPlayer = playerResults.sort((a, b) => (a?.position || 99) - (b?.position || 99))[0];
            const playerWon = bestPlayer?.position === 1;

            const careerObj = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
            const spOutcome = careerObj?._lastSponsorOutcome || null;

            container.innerHTML = `
                <div class="results-container">
                    <button class="home-btn" id="res-home-btn">⌂</button>

                    <div class="results-header">
                        <h1 class="results-title">RACE RESULTS</h1>
                        <div class="results-subtitle">${escapeHTML(race.track?.flag || '🏁')} ${escapeHTML(race.track?.name || 'Grand Prix')}</div>
                    </div>

                    <!-- PODIUM -->
                    <div class="podium-display">
                        ${renderPodium(podium)}
                    </div>

                    ${playerWon ? `<div class="victory-banner">🏆 YOU WIN! 🏆</div>` : ''}

                    ${spOutcome ? `
                        <div class="sponsor-outcome-banner" style="margin: 20px auto; max-width: 800px; padding: 20px; background: linear-gradient(135deg, rgba(20,20,30,0.92), rgba(10,10,15,0.98)); border: 3px solid ${spOutcome.met ? '#00FF41' : 'var(--red)'}; border-radius: 16px; text-align: center; box-shadow: 0 0 30px ${spOutcome.met ? 'rgba(0,255,65,0.4)' : 'rgba(255,0,51,0.4)'};">
                            <div style="font-family: Orbitron; font-weight: 900; font-size: 18px; color: ${spOutcome.met ? '#00FF41' : 'var(--red)'}; margin-bottom: 8px; letter-spacing: 2px;">
                                ${spOutcome.met ? '🤝 DEFINITIVE SPONSOR PAYOUT SECURED!' : '⚠️ CORPORATE SPONSOR FINE FAX RECEIVED!'}
                            </div>
                            <div style="font-family: Rajdhani; font-size: 15px; font-weight: 700; color: var(--gray-200); line-height: 1.4;">
                                ${spOutcome.met ? 
                                  `Corporate Primary Sponsor <strong style="color: #FFFFFF; font-family: Orbitron;">${escapeHTML(spOutcome.name)}</strong> wires <strong style="color: #00FF41; font-family: Orbitron;">+$${formatMoney(spOutcome.amount)}</strong> directly to your Constructor operations for satisfying your mandatory target setup!` : 
                                  `Corporate Billing for primary sponsor <strong style="color: #FFFFFF; font-family: Orbitron;">${escapeHTML(spOutcome.name)}</strong> sends a highly sarcastic Esport fax billing your Constructor team <strong style="color: var(--red); font-family: Orbitron;">-$${formatMoney(spOutcome.amount)}</strong> for breaching your mandatory finish agreement!`}
                            </div>
                        </div>
                    ` : ''}

                    <!-- PLAYER PERFORMANCE SUMMARY -->
                    <div class="player-summary">
                        <h2 class="summary-title">YOUR PERFORMANCE</h2>
                        <div class="player-results-grid">
                            ${playerResults.map(r => {
                                if (!r) return '';
                                const pos = r?.position || 99;
                                const isDnf = r?.status === 'DNF';
                                const dName = r?.driver?.name || 'RACER';
                                const bLap = r?.bestLap ? formatLapTimeLocal(r.bestLap) : '—';
                                const pts = r?.points || 0;
                                const flBonus = r?.fastestLapBonus > 0 ? '<div style="color: #AA33FF; font-size: 10px; font-family: Orbitron; font-weight: 900;">+1 FL</div>' : '';

                                return `
                                    <div class="player-result-card ${pos === 1 ? 'winner' : ''} ${pos <= 3 ? 'podium' : ''}">
                                        <div class="result-pos">P${pos}</div>
                                        <div class="result-info">
                                            <div class="result-driver">${escapeHTML(dName)}</div>
                                            <div class="result-detail">
                                                ${isDnf ? `<span style="color: var(--red);">DNF: ${escapeHTML(r.dnfReason || 'Retired')}</span>` :
                                                  `Best Match Lap: ${bLap}`}
                                            </div>
                                        </div>
                                        <div class="result-points">
                                            <div class="points-num">${pts}</div>
                                            <div class="points-label">PTS</div>
                                            ${flBonus}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- FULL CLASSIFICATION SHEETS -->
                    <div class="full-results">
                        <h2 class="summary-title">FULL CLASSIFICATION</h2>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>POS</th>
                                    <th>DRIVER</th>
                                    <th>TEAM</th>
                                    <th>TIME / GAP</th>
                                    <th>BEST LAP</th>
                                    <th>PTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.map(r => {
                                    if (!r) return '';
                                    const isPlayerTeam = r?.team?.id && race?.playerTeamId && r.team.id === race.playerTeamId;
                                    const isDnf = r?.status === 'DNF';
                                    const pos = r?.position || 99;
                                    const dName = r?.driver?.name || 'RACER';
                                    const dFlag = r?.driver?.flag || '';
                                    const tName = r?.team?.shortName || r?.team?.name || 'CONSTRUCTOR';
                                    const tCol = r?.team?.color || '#ffffff';
                                    const timeGap = isDnf ? '<span style="color: var(--red); font-weight: 700;">DNF</span>' : (r?.gap === null || r?.gap === undefined ? formatRaceTimeLocal(r?.time) : formatGapLocal(r?.gap));
                                    const bLap = r?.bestLap ? formatLapTimeLocal(r.bestLap) : '—';
                                    const pts = r?.points || 0;
                                    const flBonus = r?.fastestLapBonus > 0 ? '+1' : '';

                                    return `
                                        <tr class="${isPlayerTeam ? 'player-result' : ''} ${isDnf ? 'dnf' : ''}">
                                            <td class="pos-cell">
                                                <span class="pos-num ${pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : ''}">${pos}</span>
                                            </td>
                                            <td>
                                                <span style="margin-right: 6px;">${escapeHTML(dFlag)}</span>
                                                ${escapeHTML(dName)}
                                            </td>
                                            <td>
                                                <span style="display: inline-block; width: 4px; height: 14px; background: ${tCol}; margin-right: 6px; vertical-align: middle;"></span>
                                                ${escapeHTML(tName)}
                                            </td>
                                            <td class="time-cell">${timeGap}</td>
                                            <td class="time-cell">${bLap}</td>
                                            <td style="font-family: Orbitron; font-weight: 700; color: ${isPlayerTeam ? '#00FF41' : 'var(--white)'};">${pts}${flBonus}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="results-actions">
                        ${race.isScenario ? `
                            <button class="btn btn-glow btn-large" id="res-scenario-action" style="background: rgba(255,215,0,0.15); border-color: #FFD700; color: #FFD700; font-weight: 900; font-family: Orbitron; padding: 16px 32px;">
                                RETURN TO HALL OF GLORY →
                            </button>
                        ` : race.isCareerRace ? `
                            <button class="btn btn-primary btn-large" id="res-continue">
                                CONTINUE TO DASHBOARD →
                            </button>
                        ` : `
                            <button class="btn btn-primary btn-large" id="res-home-action">
                                RETURN HOME
                            </button>
                        `}
                    </div>
                </div>
            `;

            injectStyles();
            attachContentListeners();

            if (playerWon && typeof Transitions !== 'undefined') {
                setTimeout(() => Transitions.confetti?.(4000), 500);
            }
        } catch (err) {
            console.error('[ResultsScreen] Render error:', err);
            container.innerHTML = `
                <div style="text-align: center; padding: var(--space-3xl);">
                    <h2 style="font-family: Orbitron; color: var(--red);">CLASSIFICATION SHEET REFRESH FAILURE</h2>
                    <p style="color: var(--gray-400); font-family: Rajdhani; margin-bottom: 20px;">An unhandled reference was intercepted while constructing the full classification sheets.</p>
                    <button class="btn btn-glow" id="res-back-err">RETURN TO PADDOCK</button>
                </div>
            `;
            container.querySelector('#res-back-err')?.addEventListener('click', () => typeof EventBus !== 'undefined' && EventBus.emit('nav:home'));
        }
    }

    function formatLapTimeLocal(seconds) {
        if (typeof formatLapTime === 'function') {
            try { return formatLapTime(seconds); } catch {}
        }
        if (!seconds || isNaN(seconds)) return '--:--.---';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }

    function formatGapLocal(seconds) {
        if (typeof formatGap === 'function') {
            try { return formatGap(seconds); } catch {}
        }
        if (seconds === null || seconds === undefined || isNaN(seconds)) return '';
        if (Math.abs(seconds) < 0.001) return 'LEADER';
        const abs = Math.abs(seconds);
        if (abs < 60) return `+${abs.toFixed(3)}`;
        const m = Math.floor(abs / 60);
        const s = (abs % 60).toFixed(3);
        return `+${m}:${s.padStart(6, '0')}`;
    }

    function formatRaceTimeLocal(seconds) {
        if (!seconds || isNaN(seconds)) return '—';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = (seconds % 60).toFixed(3);
        if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.padStart(6,'0')}`;
        return `${m}:${s.padStart(6,'0')}`;
    }

    function renderPodium(podium) {
        if (!podium || !Array.isArray(podium) || podium.length === 0) {
            return '<div style="text-align: center; padding: var(--space-xl); color: var(--gray-500); font-family: Orbitron;">Podium summary incomplete</div>';
        }

        const p1 = podium[0] || { driver: { name: 'P1' }, team: { name: 'Team' }, position: 1 };
        const p2 = podium[1] || { driver: { name: 'P2' }, team: { name: 'Team' }, position: 2 };
        const p3 = podium[2] || { driver: { name: 'P3' }, team: { name: 'Team' }, position: 3 };

        const order = [p2, p1, p3]; // 2nd, 1st, 3rd
        const heights = ['second', 'first', 'third'];
        const positions = ['2', '1', '3'];

        return order.map((p, idx) => `
            <div class="podium-block podium-${heights[idx]}">
                <div class="podium-driver">
                    <div class="podium-avatar">${escapeHTML(p?.driver?.flag || '🏎️')}</div>
                    <div class="podium-name">${escapeHTML(p?.driver?.lastName || p?.driver?.name || 'RACER')}</div>
                    <div class="podium-team" style="color: ${p?.team?.color || '#FFF'};">
                        ${escapeHTML(p?.team?.shortName || p?.team?.name || 'CONSTRUCTOR')}
                    </div>
                </div>
                <div class="podium-stand">
                    <div class="podium-position">${positions[idx]}</div>
                </div>
            </div>
        `).join('');
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:results:enter', () => {
            isActive = true;
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'results') isActive = false;
        });
    }

    function attachContentListeners() {
        container.querySelector('#res-home-btn')?.addEventListener('click', () => {
            EventBus.emit('nav:home');
        });

        container.querySelector('#res-continue')?.addEventListener('click', () => {
            EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' });
        });

        container.querySelector('#res-home-action')?.addEventListener('click', () => {
            EventBus.emit('nav:home');
        });

        container.querySelector('#res-scenario-action')?.addEventListener('click', () => {
            EventBus.emit('nav:go', { screen: 'singleplayer', color: '#FFD700' });
            setTimeout(() => {
                if (typeof SinglePlayerScreen !== 'undefined' && typeof SinglePlayerScreen.showScenariosHub === 'function') {
                    SinglePlayerScreen.showScenariosHub();
                }
            }, 700);
        });
    }

    function formatRaceTime(seconds) {
        if (!seconds) return '—';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = (seconds % 60).toFixed(3);
        if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.padStart(6,'0')}`;
        return `${m}:${s.padStart(6,'0')}`;
    }

    function injectStyles() {
        if (document.getElementById('res-styles')) return;
        const style = document.createElement('style');
        style.id = 'res-styles';
        style.textContent = `
            .results-container {
                width: 100%; min-height: 100%;
                padding: var(--space-xl);
                background: var(--black);
                position: relative;
                overflow-y: auto;
            }
            .results-header {
                text-align: center; margin-bottom: var(--space-2xl);
            }
            .results-title {
                font-family: 'Orbitron'; font-weight: 800;
                font-size: 36px; letter-spacing: 6px;
                color: var(--white);
                text-shadow: 0 0 30px var(--green-glow);
            }
            .results-subtitle {
                font-family: 'Rajdhani'; color: var(--gray-400);
                letter-spacing: 3px; margin-top: var(--space-sm);
                font-size: 16px;
            }

            .podium-display {
                display: flex; justify-content: center;
                align-items: flex-end; gap: var(--space-md);
                margin: var(--space-2xl) auto;
                max-width: 800px;
                min-height: 280px;
            }
            .podium-block {
                display: flex; flex-direction: column;
                align-items: center;
                animation: slideInUp 0.6s ease;
            }
            .podium-block:nth-child(1) { animation-delay: 0.2s; animation-fill-mode: backwards; }
            .podium-block:nth-child(2) { animation-delay: 0s; }
            .podium-block:nth-child(3) { animation-delay: 0.4s; animation-fill-mode: backwards; }

            .podium-driver {
                text-align: center; margin-bottom: var(--space-md);
            }
            .podium-avatar {
                width: 64px; height: 64px;
                background: var(--surface-2);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 32px; margin: 0 auto var(--space-sm);
                border: 3px solid;
            }
            .podium-first .podium-avatar { border-color: #FFD700; box-shadow: 0 0 30px rgba(255,215,0,0.4); }
            .podium-second .podium-avatar { border-color: #C0C0C0; }
            .podium-third .podium-avatar { border-color: #CD7F32; }

            .podium-name {
                font-family: 'Orbitron'; font-weight: 700;
                font-size: 16px; letter-spacing: 2px;
            }
            .podium-team {
                font-family: 'Rajdhani'; font-size: 12px;
                letter-spacing: 2px;
            }
            .podium-stand {
                width: 140px;
                display: flex; align-items: center; justify-content: center;
                background: linear-gradient(180deg, var(--gray-800), var(--gray-900));
                border-top: 3px solid;
            }
            .podium-first .podium-stand {
                height: 180px; border-color: #FFD700;
                background: linear-gradient(180deg, rgba(255,215,0,0.2), var(--gray-900));
            }
            .podium-second .podium-stand {
                height: 140px; border-color: #C0C0C0;
                background: linear-gradient(180deg, rgba(192,192,192,0.2), var(--gray-900));
            }
            .podium-third .podium-stand {
                height: 100px; border-color: #CD7F32;
                background: linear-gradient(180deg, rgba(205,127,50,0.2), var(--gray-900));
            }
            .podium-position {
                font-family: 'Orbitron'; font-weight: 900;
                font-size: 60px; color: var(--white);
                text-shadow: 0 0 20px rgba(255,255,255,0.3);
            }
            .podium-first .podium-position { color: #FFD700; }
            .podium-second .podium-position { color: #C0C0C0; }
            .podium-third .podium-position { color: #CD7F32; }

            .victory-banner {
                text-align: center;
                font-family: 'Orbitron'; font-weight: 900;
                font-size: 28px; letter-spacing: 6px;
                color: #FFD700;
                margin: var(--space-xl) 0;
                text-shadow: 0 0 30px rgba(255,215,0,0.5);
                animation: pulse-glow 1.5s ease-in-out infinite;
            }

            .player-summary, .full-results {
                max-width: 1000px; margin: var(--space-2xl) auto;
            }
            .summary-title {
                font-family: 'Orbitron'; font-size: 16px;
                letter-spacing: 4px; color: var(--gray-400);
                margin-bottom: var(--space-md);
                padding-bottom: var(--space-sm);
                border-bottom: 1px solid var(--border-subtle);
            }
            .player-results-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: var(--space-md);
            }
            @media (max-width: 700px) {
                .player-results-grid { grid-template-columns: 1fr; }
            }
            .player-result-card {
                display: flex; align-items: center; gap: var(--space-md);
                padding: var(--space-md);
                background: var(--surface-1);
                border: 1px solid var(--border-subtle);
                border-radius: var(--radius-md);
            }
            .player-result-card.podium { border-color: var(--green-dim); }
            .player-result-card.winner {
                border-color: #FFD700;
                background: rgba(255,215,0,0.05);
                box-shadow: 0 0 20px rgba(255,215,0,0.2);
            }
            .result-pos {
                font-family: 'Orbitron'; font-weight: 800;
                font-size: 28px; color: var(--green);
                width: 60px; text-align: center;
            }
            .result-info { flex: 1; }
            .result-driver {
                font-family: 'Rajdhani'; font-weight: 700;
                font-size: 16px;
            }
            .result-detail {
                font-family: 'Rajdhani'; color: var(--gray-500);
                font-size: 12px; margin-top: 2px;
            }
            .result-points { text-align: center; min-width: 60px; }
            .points-num {
                font-family: 'Orbitron'; font-weight: 800;
                font-size: 24px; color: var(--white);
            }
            .points-label {
                font-size: 9px; color: var(--gray-500);
                letter-spacing: 2px;
            }

            .results-table {
                width: 100%; border-collapse: collapse;
                background: var(--surface-glass);
                border-radius: var(--radius-md);
                overflow: hidden;
            }
            .results-table th {
                font-family: 'Orbitron'; font-size: 10px;
                color: var(--gray-400); letter-spacing: 2px;
                text-align: left; padding: var(--space-sm);
                border-bottom: 1px solid var(--border-subtle);
            }
            .results-table td {
                padding: var(--space-sm);
                font-family: 'Rajdhani'; font-size: 13px;
                border-bottom: 1px solid rgba(255,255,255,0.03);
            }
            .results-table tr.player-result {
                background: rgba(0,255,65,0.05);
            }
            .results-table tr.dnf {
                opacity: 0.5; text-decoration: line-through;
            }
            .pos-num {
                font-family: 'Orbitron'; font-weight: 700;
            }
            .pos-1 { color: #FFD700; }
            .pos-2 { color: #C0C0C0; }
            .pos-3 { color: #CD7F32; }

            .results-actions {
                text-align: center; margin: var(--space-2xl) 0;
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

    function destroy() { isActive = false; }

    return { init, render, destroy };
})();