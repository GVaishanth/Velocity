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
        const results = StateManager.get('raceResults');
        const race = StateManager.get('race');

        if (!results || !race) {
            container.innerHTML = `
                <div style="text-align: center; padding: var(--space-3xl);">
                    <h2>No race results</h2>
                    <button class="btn btn-primary" id="res-back">Return Home</button>
                </div>
            `;
            container.querySelector('#res-back')?.addEventListener('click', () => EventBus.emit('nav:home'));
            return;
        }

        const podium = results.slice(0, 3);
        const playerResults = results.filter(r => r.team.id === race.playerTeamId);
        const bestPlayer = playerResults.sort((a, b) => a.position - b.position)[0];
        const playerWon = bestPlayer?.position === 1;

        const careerObj = typeof StateManager?.get === 'function' ? StateManager.get('career') : null;
        const spOutcome = careerObj?._lastSponsorOutcome || null;

        container.innerHTML = `
            <div class="results-container">
                <button class="home-btn" id="res-home-btn">⌂</button>

                <div class="results-header">
                    <h1 class="results-title">RACE RESULTS</h1>
                    <div class="results-subtitle">${escapeHTML(race.track.flag)} ${escapeHTML(race.track.name)}</div>
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

                <!-- PLAYER SUMMARY -->
                <div class="player-summary">
                    <h2 class="summary-title">YOUR PERFORMANCE</h2>
                    <div class="player-results-grid">
                        ${playerResults.map(r => `
                            <div class="player-result-card ${r.position === 1 ? 'winner' : ''} ${r.position <= 3 ? 'podium' : ''}">
                                <div class="result-pos">P${r.position}</div>
                                <div class="result-info">
                                    <div class="result-driver">${escapeHTML(r.driver.name)}</div>
                                    <div class="result-detail">
                                        ${r.status === 'DNF' ? `<span style="color: var(--red)">DNF: ${escapeHTML(r.dnfReason || 'Retired')}</span>` :
                                          `Best Lap: ${formatLapTime(r.bestLap)}`}
                                    </div>
                                </div>
                                <div class="result-points">
                                    <div class="points-num">${r.points}</div>
                                    <div class="points-label">PTS</div>
                                    ${r.fastestLapBonus > 0 ? '<div style="color: #AA33FF; font-size: 10px;">+1 FL</div>' : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- FULL RESULTS -->
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
                            ${results.map(r => `
                                <tr class="${r.team.id === race.playerTeamId ? 'player-result' : ''} ${r.status === 'DNF' ? 'dnf' : ''}">
                                    <td class="pos-cell">
                                        <span class="pos-num ${r.position === 1 ? 'pos-1' : r.position === 2 ? 'pos-2' : r.position === 3 ? 'pos-3' : ''}">${r.position}</span>
                                    </td>
                                    <td>
                                        <span style="margin-right: 6px;">${r.driver.flag || ''}</span>
                                        ${escapeHTML(r.driver.name)}
                                    </td>
                                    <td>
                                        <span style="display: inline-block; width: 4px; height: 14px; background: ${r.team.color}; margin-right: 6px; vertical-align: middle;"></span>
                                        ${escapeHTML(r.team.shortName || r.team.name)}
                                    </td>
                                    <td class="time-cell">
                                        ${r.status === 'DNF' ? 'DNF' :
                                          r.gap === null ? formatRaceTime(r.time) : formatGap(r.gap)}
                                    </td>
                                    <td class="time-cell">${r.bestLap ? formatLapTime(r.bestLap) : '—'}</td>
                                    <td style="font-family: 'Orbitron'; font-weight: 700;">${r.points}${r.fastestLapBonus > 0 ? '+1' : ''}</td>
                                </tr>
                            `).join('')}
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

        // Confetti for victory
        if (playerWon && typeof Transitions !== 'undefined') {
            setTimeout(() => Transitions.confetti(4000), 500);
        }
    }

    function renderPodium(podium) {
        if (podium.length < 3) {
            return '<div style="text-align: center; padding: var(--space-xl);">Race results incomplete</div>';
        }

        const order = [podium[1], podium[0], podium[2]]; // 2nd, 1st, 3rd
        const heights = ['second', 'first', 'third'];
        const positions = ['2', '1', '3'];

        return order.map((p, idx) => `
            <div class="podium-block podium-${heights[idx]}">
                <div class="podium-driver">
                    <div class="podium-avatar">${p.driver.flag || '🏎️'}</div>
                    <div class="podium-name">${escapeHTML(p.driver.lastName || p.driver.name)}</div>
                    <div class="podium-team" style="color: ${p.team.color}">
                        ${escapeHTML(p.team.shortName || p.team.name)}
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