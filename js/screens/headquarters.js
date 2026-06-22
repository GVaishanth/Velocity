/* ============================================
   VELOCITY — HEADQUARTERS SCREEN
   Professional team operations center
   ============================================ */

window.HeadquartersScreen = (() => {
    let container = null;
    let isActive = false;

    const FACILITY_ORDER = [
        { key: 'aerodynamics', label: 'Aerodynamics', short: 'Aero' },
        { key: 'manufacturing', label: 'Factory', short: 'Factory' },
        { key: 'simulation', label: 'Simulator', short: 'Simulator' },
        { key: 'driverDevelopment', label: 'Driver Academy', short: 'Driver Academy' },
        { key: 'staffDevelopment', label: 'Staff Academy', short: 'Staff Academy' },
        { key: 'rd', label: 'R&D', short: 'R&D' },
        { key: 'powertrain', label: 'Powertrain', short: 'Powertrain' },
        { key: 'scouting', label: 'Scouting', short: 'Scouting' },
        { key: 'marketing', label: 'Marketing', short: 'Marketing' },
        { key: 'hospitality', label: 'Hospitality', short: 'Hospitality' }
    ];

    const SUMMARY_FACILITIES = ['simulation', 'driverDevelopment', 'manufacturing', 'rd', 'aerodynamics', 'staffDevelopment'];

    function init() {
        container = document.getElementById('headquarters-content');
        attachListeners();
    }

    function attachListeners() {
        if (typeof EventBus === 'undefined') return;
        EventBus.on('screen:headquarters:enter', () => {
            isActive = true;
            render();
        });
        EventBus.on('screen:changed', data => {
            if (data.screen !== 'headquarters') isActive = false;
        });
    }

    function render() {
        if (!container) return;
        const career = StateManager.get('career');
        if (!career) {
            container.innerHTML = `<div style="padding:40px;text-align:center;color:#888;">No career loaded.</div>`;
            return;
        }

        if (typeof FacilityService !== 'undefined') {
            FacilityService.ensureCareerFacilities(career);
            StateManager.set('career', career);
        }

        const hq = career.headquarters || {};
        const benefits = FacilityService.calculateBenefits(career);
        const rating = getFacilityRating(career);
        const active = getActiveUpgrades(career);
        const nextUpgrade = getNextUpgrade(career);
        const palette = getTeamPalette(career);
        const weeklyExpenses = Math.round((benefits.maintenanceCost || 0) / 52);

        container.innerHTML = `
            <div class="hq-page" style="--hq-primary:${palette.primary}; --hq-secondary:${palette.secondary}; --hq-accent:${palette.accent};">
                <button class="home-btn" id="hq-home-btn" title="Back Home">⌂</button>

                <div class="hq-shell">
                    <div class="hq-header">
                        <div>
                            <div class="hq-kicker">TEAM HEADQUARTERS</div>
                            <h1>${escapeHTML(hq.name || `${career.team?.name || 'Team'} Headquarters`)}</h1>
                            <p>Team command center for infrastructure, construction timing and long-term competitive capability.</p>
                        </div>
                    </div>

                    <section class="hq-overview-panel">
                        <div class="hq-section-header">
                            <div>
                                <div class="hq-section-kicker">HQ OVERVIEW</div>
                                <h2>Operations Snapshot</h2>
                            </div>
                        </div>

                        <div class="hq-overview-grid">
                            <div class="hq-overview-card emphasis">
                                <span>Facility Rating</span>
                                <b>${rating}</b>
                            </div>
                            <div class="hq-overview-card">
                                <span>Current Budget</span>
                                <b>$${formatMoney(career.budget || 0)}</b>
                            </div>
                            <div class="hq-overview-card">
                                <span>Weekly Expenses</span>
                                <b>$${formatMoney(weeklyExpenses)}</b>
                            </div>
                            <div class="hq-overview-card">
                                <span>Active Upgrades</span>
                                <b>${active.length}</b>
                            </div>
                            <div class="hq-overview-card next-completion-card">
                                <span>Next Completion</span>
                                <b>${nextUpgrade ? `${escapeHTML(nextUpgrade.label)} Lv.${nextUpgrade.toLevel}` : 'No Active Projects'}</b>
                                <small>${nextUpgrade ? `${nextUpgrade.daysRemaining} Days Remaining` : 'Queue is currently empty'}</small>
                            </div>
                            <div class="hq-overview-card placeholder">
                                <span>Team Reputation</span>
                                <b>—</b>
                                <small>Future feature placeholder</small>
                            </div>
                        </div>

                        <div class="hq-summary-strip">
                            <div class="hq-summary-title">Facility Summary</div>
                            <div class="hq-summary-chips">
                                ${renderFacilitySummary(career)}
                            </div>
                        </div>
                    </section>

                    <section class="hq-grid-section">
                        <div class="hq-section-header">
                            <div>
                                <div class="hq-section-kicker">FACILITY GRID</div>
                                <h2>Infrastructure & Upgrade Planning</h2>
                            </div>
                        </div>
                        <div class="hq-grid">
                            ${FACILITY_ORDER.map(item => renderFacilityCard(career, item)).join('')}
                        </div>
                    </section>

                    <section class="hq-queue-section">
                        <div class="hq-section-header">
                            <div>
                                <div class="hq-section-kicker">UPGRADE QUEUE</div>
                                <h2>Current Construction Pipeline</h2>
                            </div>
                        </div>
                        <div class="hq-queue-list">
                            ${renderUpgradeQueue(career)}
                        </div>
                    </section>

                    <div class="hq-actions">
                        <button class="btn" id="hq-back-dashboard">← BACK TO DASHBOARD</button>
                    </div>
                </div>
            </div>
        `;

        injectStyles();
        attachUI(career);
    }

    function renderFacilitySummary(career) {
        return SUMMARY_FACILITIES.map(key => {
            const item = FACILITY_ORDER.find(f => f.key === key);
            const level = career.headquarters?.facilities?.[key]?.level || 1;
            return `<span class="hq-summary-chip">${escapeHTML(item?.short || key)} Lv.${level}</span>`;
        }).join('');
    }

    function renderFacilityCard(career, item) {
        const def = FacilityService.getDefinition(item.key) || {};
        const facility = career.headquarters?.facilities?.[item.key] || { level: 1 };
        const level = facility.level || 1;
        const cost = level < 10 ? FacilityService.upgradeCost(item.key, level) : 0;
        const weeks = level < 10 ? FacilityService.upgradeWeeks(item.key, level) : 0;
        const currentBenefit = describeBenefit(item.key, level);
        const nextBenefit = level < 10 ? describeBenefit(item.key, level + 1) : 'Maximum facility capability reached';
        const canAfford = (career.budget || 0) >= cost;
        const levelProgress = Math.max(10, Math.min(100, level * 10));
        const upgradeProgress = facility.upgrade
            ? Math.max(4, Math.min(100, 100 - (facility.upgrade.weeksRemaining / facility.upgrade.totalWeeks) * 100))
            : levelProgress;
        const status = getFacilityStatus(facility, canAfford, level);
        const actionLabel = facility.upgrade
            ? 'PROJECT ACTIVE'
            : level >= 10
                ? 'MAX LEVEL'
                : canAfford
                    ? 'UPGRADE'
                    : 'INSUFFICIENT BUDGET';

        return `
            <article class="hq-facility-card ${facility.upgrade ? 'upgrading' : ''}">
                <div class="facility-top">
                    <div class="facility-title-wrap">
                        <div class="facility-title">${def.icon || '🏢'} ${escapeHTML(item.label)}</div>
                        <div class="facility-subtitle">${escapeHTML(def.benefit || 'Long-term team capability improvement')}</div>
                    </div>
                    <div class="facility-level-badge">LVL ${level}</div>
                </div>

                <div class="facility-status-row">
                    <span class="facility-status ${status.className}">${status.label}</span>
                    <span class="facility-timer">${facility.upgrade ? `${facility.upgrade.weeksRemaining} W • ${facility.upgrade.weeksRemaining * 7} D` : (level < 10 ? `${weeks} WEEKS` : 'COMPLETE')}</span>
                </div>

                <div class="facility-progress-block">
                    <div class="facility-progress-head">
                        <span>Upgrade Progress</span>
                        <b>${facility.upgrade ? `${facility.upgrade.toLevel - 1} → ${facility.upgrade.toLevel}` : `Level ${level}/10`}</b>
                    </div>
                    <div class="facility-bar ${facility.upgrade ? 'active' : ''}"><div style="width:${upgradeProgress}%"></div></div>
                </div>

                <div class="facility-detail-grid">
                    <div>
                        <span>Current Benefit</span>
                        <b>${escapeHTML(currentBenefit)}</b>
                    </div>
                    <div>
                        <span>Next Level Benefit</span>
                        <b>${escapeHTML(nextBenefit)}</b>
                    </div>
                    <div>
                        <span>Upgrade Cost</span>
                        <b>${level >= 10 ? '—' : `$${formatMoney(cost)}`}</b>
                    </div>
                    <div>
                        <span>Upgrade Duration</span>
                        <b>${level >= 10 ? '—' : formatDuration(weeks)}</b>
                    </div>
                </div>

                ${facility.upgrade ? `
                    <div class="facility-completion-note">
                        <div><strong>Completion Order:</strong> ${getUpgradeQueuePosition(career, item.key)}</div>
                        <div><strong>Remaining Time:</strong> ${facility.upgrade.weeksRemaining * 7} days</div>
                    </div>
                ` : ''}

                <button class="btn btn-glow hq-upgrade-btn" data-facility="${item.key}" ${facility.upgrade || level >= 10 || !canAfford ? 'disabled' : ''}>${actionLabel}</button>
            </article>
        `;
    }

    function renderUpgradeQueue(career) {
        const queue = getUpgradeQueue(career);
        if (!queue.length) {
            return `<div class="hq-empty-state">No upgrades are currently active. Facility projects will appear here once construction begins.</div>`;
        }
        return queue.map((item, index) => `
            <div class="hq-queue-row">
                <div class="hq-queue-order">#${index + 1}</div>
                <div class="hq-queue-main">
                    <div class="hq-queue-title">${escapeHTML(item.label)} Lv.${item.fromLevel} → Lv.${item.toLevel}</div>
                    <div class="hq-queue-meta">${item.daysRemaining} Days Remaining • ${item.weeksRemaining} Weeks • ${item.status}</div>
                </div>
                <div class="hq-queue-progress">
                    <div class="facility-bar active"><div style="width:${item.progress}%"></div></div>
                </div>
            </div>
        `).join('');
    }

    function getUpgradeQueue(career) {
        return Object.entries(career.headquarters?.facilities || {})
            .filter(([, facility]) => !!facility?.upgrade)
            .map(([key, facility]) => {
                const item = FACILITY_ORDER.find(f => f.key === key);
                const upgrade = facility.upgrade;
                return {
                    key,
                    label: item?.label || FacilityService.getDefinition(key)?.name || key,
                    fromLevel: upgrade.fromLevel,
                    toLevel: upgrade.toLevel,
                    weeksRemaining: upgrade.weeksRemaining,
                    daysRemaining: upgrade.weeksRemaining * 7,
                    progress: Math.max(4, Math.min(100, 100 - (upgrade.weeksRemaining / upgrade.totalWeeks) * 100)),
                    status: 'In Progress'
                };
            })
            .sort((a, b) => a.weeksRemaining - b.weeksRemaining || a.label.localeCompare(b.label));
    }

    function getUpgradeQueuePosition(career, facilityKey) {
        const queue = getUpgradeQueue(career);
        const index = queue.findIndex(item => item.key === facilityKey);
        return index >= 0 ? `#${index + 1}` : '—';
    }

    function getNextUpgrade(career) {
        return getUpgradeQueue(career)[0] || null;
    }

    function getFacilityStatus(facility, canAfford, level) {
        if (facility?.upgrade) return { label: 'UPGRADING', className: 'upgrading' };
        if (level >= 10) return { label: 'MAXIMUM', className: 'maxed' };
        if (canAfford) return { label: 'READY', className: 'ready' };
        return { label: 'BUDGET HOLD', className: 'hold' };
    }

    function describeBenefit(key, level) {
        const pct = value => `${Math.round(value)}%`;
        const fixed = value => `${value.toFixed(1)}`;
        const map = {
            rd: `+${pct(level * 3.5)} R&D output`,
            aerodynamics: `+${pct(level * 4.5)} aero efficiency`,
            powertrain: `+${pct(level * 4)} power efficiency`,
            simulation: `+${pct(level * 2.5)} simulator preparation`,
            manufacturing: `+${fixed(level * 0.45)} reliability`,
            driverDevelopment: `+${pct(level * 6)} academy quality`,
            staffDevelopment: `+${pct(level * 4)} staff growth`,
            scouting: `+${pct(level * 7)} scouting accuracy`,
            marketing: `+${pct(level * 3.5)} sponsor growth`,
            hospitality: `+${pct(level * 2.5)} partner confidence`
        };
        return map[key] || 'Improves team capability';
    }

    function attachUI(career) {
        container.querySelector('#hq-home-btn')?.addEventListener('click', () => EventBus.emit('nav:home'));
        container.querySelector('#hq-back-dashboard')?.addEventListener('click', () => EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' }));
        container.querySelectorAll('.hq-upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const result = FacilityService.requestUpgrade(career, btn.dataset.facility);
                if (!result.ok) {
                    Notifications.error('Project Rejected', result.reason);
                    StateManager.set('career', career);
                    StateManager.saveGame();
                    render();
                    return;
                }
                StateManager.set('career', career);
                StateManager.saveGame();
                if (career.isMultiplayer && typeof OnlineManager !== 'undefined') OnlineManager.broadcastAction('FACILITY_SYNC', { career });
                Notifications.success('Facility Upgrade Started', `Construction begins immediately. ${result.upgrade.weeksRemaining} weeks remaining.`);
                render();
            });
        });
    }

    function getFacilityRating(career) {
        const facilities = career.headquarters?.facilities || {};
        const values = Object.values(facilities).map(f => f.level || 1);
        return Math.round((values.reduce((a, b) => a + b, 0) / Math.max(1, values.length)) * 10);
    }

    function getActiveUpgrades(career) {
        return Object.entries(career.headquarters?.facilities || {}).filter(([, f]) => !!f.upgrade);
    }

    function formatDuration(weeks) {
        if (!Number.isFinite(weeks) || weeks <= 0) return '—';
        return `${weeks} Week${weeks === 1 ? '' : 's'}`;
    }

    function formatMoney(n) {
        if (!Number.isFinite(n)) return '0';
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return String(Math.round(n));
    }

    function getTeamPalette(career) {
        const livery = career?.livery || {};
        return {
            primary: livery.primary || career?.team?.color || '#00FF41',
            secondary: livery.secondary || '#111111',
            accent: livery.accent || '#FFFFFF'
        };
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function injectStyles() {
        if (document.getElementById('hq-screen-styles')) return;
        const style = document.createElement('style');
        style.id = 'hq-screen-styles';
        style.textContent = `
            .hq-page {
                min-height: 100%;
                padding: var(--space-xl);
                background: var(--black);
                color: var(--white);
                position: relative;
            }
            .hq-shell {
                display: flex;
                flex-direction: column;
                gap: 18px;
            }
            .hq-header {
                border-top: 2px solid color-mix(in srgb, var(--hq-accent, #FFFFFF) 40%, transparent);
                border-bottom: 2px solid color-mix(in srgb, var(--hq-primary, #00FF41) 30%, transparent);
                padding: 18px 0;
                background: linear-gradient(90deg, color-mix(in srgb, var(--hq-accent, #FFFFFF) 5%, transparent), color-mix(in srgb, var(--hq-primary, #00FF41) 4%, transparent), transparent);
            }
            .hq-kicker,
            .hq-section-kicker {
                font-family: Orbitron;
                color: var(--hq-accent, #FFD700);
                font-size: 11px;
                font-weight: 900;
                letter-spacing: 3px;
                text-transform: uppercase;
            }
            .hq-header h1,
            .hq-section-header h2 {
                font-family: Orbitron;
                color: #fff;
                margin: 8px 0 6px;
                letter-spacing: 1px;
            }
            .hq-header p {
                color: var(--gray-400);
                font-family: Rajdhani;
                max-width: 760px;
                font-size: 15px;
                line-height: 1.4;
            }
            .hq-section-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                flex-wrap: wrap;
            }
            .hq-overview-panel,
            .hq-grid-section,
            .hq-queue-section {
                background: linear-gradient(135deg, rgba(20,20,30,0.88), rgba(5,8,12,0.96));
                border: 1px solid color-mix(in srgb, var(--hq-primary, #00FF41) 14%, rgba(255,255,255,0.12));
                border-radius: 18px;
                padding: 18px;
                box-shadow: 0 10px 28px rgba(0,0,0,0.28);
            }
            .hq-overview-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin-top: 14px;
            }
            .hq-overview-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 14px;
                min-height: 86px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            .hq-overview-card.emphasis {
                border-color: color-mix(in srgb, var(--hq-primary, #00FF41) 32%, transparent);
                box-shadow: inset 0 0 18px color-mix(in srgb, var(--hq-primary, #00FF41) 8%, transparent);
            }
            .hq-overview-card.placeholder {
                border-style: dashed;
            }
            .hq-overview-card span,
            .facility-detail-grid span,
            .facility-progress-head span,
            .hq-summary-title,
            .facility-subtitle,
            .hq-queue-meta {
                display: block;
                font-family: Orbitron;
                font-size: 9px;
                color: var(--gray-500);
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .hq-overview-card b {
                display: block;
                margin-top: 6px;
                font-family: Orbitron;
                font-size: 22px;
                color: var(--hq-accent, #FFD700);
                line-height: 1.1;
            }
            .hq-overview-card small {
                color: var(--gray-400);
                font-size: 12px;
                margin-top: 5px;
                line-height: 1.35;
            }
            .next-completion-card {
                justify-content: flex-start;
            }
            .hq-summary-strip {
                margin-top: 16px;
                padding-top: 14px;
                border-top: 1px solid rgba(255,255,255,0.08);
            }
            .hq-summary-chips {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }
            .hq-summary-chip {
                display: inline-flex;
                align-items: center;
                padding: 6px 10px;
                border-radius: 999px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                font-family: Orbitron;
                font-size: 10px;
                color: var(--white);
            }
            .hq-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 14px;
                margin-top: 14px;
            }
            .hq-facility-card {
                background: linear-gradient(135deg, rgba(20,20,30,0.82), rgba(8,10,16,0.96));
                border: 1px solid rgba(255,255,255,0.10);
                border-radius: 16px;
                padding: 16px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                transition: .2s ease;
            }
            .hq-facility-card:hover {
                transform: translateY(-2px);
                border-color: color-mix(in srgb, var(--hq-primary, #00FF41) 35%, transparent);
                box-shadow: 0 12px 30px rgba(0,0,0,0.28);
            }
            .hq-facility-card.upgrading {
                box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--hq-accent, #FFFFFF) 24%, transparent);
            }
            .facility-top {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
            }
            .facility-title-wrap { min-width: 0; }
            .facility-title {
                font-family: Orbitron;
                font-weight: 900;
                color: white;
                font-size: 14px;
                line-height: 1.2;
            }
            .facility-subtitle {
                margin-top: 5px;
                line-height: 1.3;
            }
            .facility-level-badge {
                flex-shrink: 0;
                font-family: Orbitron;
                font-weight: 900;
                color: #000;
                background: var(--hq-accent, #FFD700);
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 11px;
                box-shadow: 0 0 16px color-mix(in srgb, var(--hq-accent, #FFD700) 28%, transparent);
            }
            .facility-status-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            .facility-status {
                display: inline-flex;
                align-items: center;
                padding: 5px 9px;
                border-radius: 999px;
                font-family: Orbitron;
                font-size: 9px;
                letter-spacing: 1px;
                text-transform: uppercase;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .facility-status.ready {
                color: #c8ffd7;
                border-color: rgba(0,255,65,0.24);
                background: rgba(0,255,65,0.10);
            }
            .facility-status.upgrading {
                color: #fff0b8;
                border-color: rgba(255,215,0,0.24);
                background: rgba(255,215,0,0.10);
            }
            .facility-status.hold {
                color: #ffd1c7;
                border-color: rgba(255,0,51,0.22);
                background: rgba(255,0,51,0.08);
            }
            .facility-status.maxed {
                color: #b7ebff;
                border-color: rgba(0,191,255,0.22);
                background: rgba(0,191,255,0.08);
            }
            .facility-timer {
                font-family: Orbitron;
                font-size: 10px;
                color: var(--gray-300);
            }
            .facility-progress-block {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }
            .facility-progress-head {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                align-items: center;
            }
            .facility-progress-head b {
                font-family: Orbitron;
                font-size: 11px;
                color: var(--white);
            }
            .facility-bar {
                height: 9px;
                background: rgba(255,255,255,0.08);
                border-radius: 999px;
                overflow: hidden;
            }
            .facility-bar div {
                height: 100%;
                background: linear-gradient(90deg, var(--hq-primary, #00FF41), var(--hq-accent, #FFD700));
                border-radius: 999px;
            }
            .facility-bar.active div {
                background: linear-gradient(90deg, var(--hq-accent, #FFD700), color-mix(in srgb, var(--hq-primary, #00FF41) 65%, white 10%));
            }
            .facility-detail-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }
            .facility-detail-grid div,
            .facility-completion-note,
            .hq-queue-row {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 10px;
                padding: 10px 12px;
            }
            .facility-detail-grid b {
                display: block;
                margin-top: 4px;
                font-family: Rajdhani;
                font-size: 15px;
                color: var(--white);
                line-height: 1.2;
            }
            .facility-completion-note {
                font-family: Rajdhani;
                font-size: 13px;
                color: var(--gray-300);
                line-height: 1.35;
            }
            .hq-facility-card .btn {
                min-height: 46px;
                margin-top: auto;
                border-radius: 10px;
                font-size: 11px;
                font-family: Orbitron;
                font-weight: 800;
            }
            .hq-queue-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 14px;
            }
            .hq-queue-row {
                display: grid;
                grid-template-columns: 54px minmax(0, 1fr) 220px;
                gap: 12px;
                align-items: center;
            }
            .hq-queue-order {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Orbitron;
                font-weight: 900;
                background: rgba(255,255,255,0.06);
                color: var(--hq-accent, #FFD700);
                border: 1px solid rgba(255,255,255,0.10);
            }
            .hq-queue-main {
                min-width: 0;
            }
            .hq-queue-title {
                font-family: Orbitron;
                font-size: 13px;
                color: var(--white);
                line-height: 1.2;
            }
            .hq-queue-meta {
                margin-top: 4px;
                color: var(--gray-400);
                line-height: 1.3;
            }
            .hq-queue-progress {
                min-width: 0;
            }
            .hq-empty-state {
                padding: 20px;
                text-align: center;
                color: var(--gray-500);
                border: 1px dashed rgba(255,255,255,0.12);
                border-radius: 12px;
                background: rgba(255,255,255,0.02);
            }
            .hq-actions {
                margin-top: 2px;
            }
            @media (max-width: 1100px) {
                .hq-overview-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .hq-queue-row {
                    grid-template-columns: 54px minmax(0, 1fr);
                }
                .hq-queue-progress {
                    grid-column: 1 / -1;
                }
            }
            @media (max-width: 860px) {
                .hq-page {
                    padding: var(--space-lg);
                }
                .hq-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .facility-detail-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            @media (max-width: 640px) {
                .hq-overview-grid,
                .hq-grid,
                .facility-detail-grid {
                    grid-template-columns: 1fr;
                }
                .hq-overview-panel,
                .hq-grid-section,
                .hq-queue-section {
                    padding: 14px;
                }
                .hq-page {
                    padding: 14px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function destroy() { isActive = false; }

    return { init, render, destroy };
})();
