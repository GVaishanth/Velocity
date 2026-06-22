/* ============================================
   VELOCITY — HEADQUARTERS SCREEN
   Dedicated facility management page
   ============================================ */

window.HeadquartersScreen = (() => {
    let container = null;
    let isActive = false;

    const FACILITY_ORDER = [
        ['aerodynamics', 'Aerodynamics Center'],
        ['manufacturing', 'Factory'],
        ['simulation', 'Driver Simulator'],
        ['driverDevelopment', 'Driver Academy'],
        ['staffDevelopment', 'Staff Training Center'],
        ['scouting', 'Scouting Department'],
        ['marketing', 'Marketing Department'],
        ['rd', 'Research & Development']
    ];

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
        const nextDays = getNextCompletionDays(career);

        container.innerHTML = `
            <div class="hq-page">
                <button class="home-btn" id="hq-home-btn" title="Back Home">⌂</button>
                <div class="hq-command-frame">
                    <div class="hq-header">
                        <div>
                            <div class="hq-kicker">TEAM HEADQUARTERS</div>
                            <h1>${escapeHTML(hq.name || `${career.team?.name || 'Team'} Headquarters`)}</h1>
                            <p>Command center for car development, talent, scouting, sponsorship and long-term competitive advantage.</p>
                        </div>
                        <div class="hq-summary">
                        <div><span>Facility Rating</span><b>${rating}</b></div>
                        <div><span>Active Upgrades</span><b>${active.length}</b></div>
                        <div><span>Next Completion</span><b>${nextDays === null ? '—' : `${nextDays} Days`}</b></div>
                        <div><span>Budget</span><b>$${formatMoney(career.budget || 0)}</b></div>
                    </div>
                </div>

                <div class="hq-benefits">
                    <div>Driver Dev x${benefits.driverDevelopment.toFixed(2)}</div>
                    <div>Academy x${benefits.academyQuality.toFixed(2)}</div>
                    <div>Scouting x${benefits.scoutingAccuracy.toFixed(2)}</div>
                    <div>Aero x${benefits.aeroResearch.toFixed(2)}</div>
                    <div>Power x${benefits.powertrainResearch.toFixed(2)}</div>
                    <div>Sponsors x${benefits.sponsorIncome.toFixed(2)}</div>
                    <div>Maintenance $${formatMoney(benefits.maintenanceCost)}/season</div>
                </div>

                <div class="hq-grid">
                    ${FACILITY_ORDER.map(([key, label]) => renderFacility(career, key, label)).join('')}
                </div>

                <div class="hq-actions">
                    <button class="btn" id="hq-back-dashboard">← BACK TO DASHBOARD</button>
                </div>
            </div>
        `;
        injectStyles();
        attachUI(career);
    }

    function renderFacility(career, key, label) {
        const def = FacilityService.getDefinition(key) || {};
        const facility = career.headquarters?.facilities?.[key] || { level: 1 };
        const level = facility.level || 1;
        const cost = FacilityService.upgradeCost(key, level);
        const weeks = FacilityService.upgradeWeeks(key, level);
        const currentBenefit = describeBenefit(key, level);
        const nextBenefit = level < 10 ? describeBenefit(key, level + 1) : 'Maximum facility capability reached.';
        const canAfford = (career.budget || 0) >= cost;
        return `
            <div class="hq-facility-card">
                <div class="facility-top">
                    <div class="facility-title">${def.icon || '🏢'} ${escapeHTML(label)}</div>
                    <div class="facility-level">LVL ${level}</div>
                </div>
                <div class="facility-bar"><div style="width:${level * 10}%"></div></div>
                <div class="facility-benefit"><b>Current:</b> ${currentBenefit}</div>
                <div class="facility-benefit"><b>Next:</b> ${nextBenefit}</div>
                ${facility.upgrade ? `
                    <div class="facility-progress">
                        <div>UPGRADING TO LEVEL ${facility.upgrade.toLevel}</div>
                        <div>${facility.upgrade.weeksRemaining} weeks / ${facility.upgrade.weeksRemaining * 7} days remaining</div>
                        <div class="facility-bar yellow"><div style="width:${Math.max(0, 100 - (facility.upgrade.weeksRemaining / facility.upgrade.totalWeeks) * 100)}%"></div></div>
                    </div>
                ` : `
                    <div class="facility-upgrade-box">
                        <span>Cost $${formatMoney(cost)} • Time ${weeks} weeks</span>
                        <button class="btn btn-glow hq-upgrade-btn" data-facility="${key}" ${level >= 10 || !canAfford ? 'disabled' : ''}>UPGRADE</button>
                    </div>
                `}
            </div>
        `;
    }

    function describeBenefit(key, level) {
        const pct = n => `${Math.round(n)}%`;
        const map = {
            aerodynamics: `Aero research +${pct(level * 4.5)}; better car performance`,
            manufacturing: `Reliability +${(level * 0.45).toFixed(1)}; faster production`,
            simulation: `Driver development +${pct(level * 2.5)}; qualifying preparation`,
            driverDevelopment: `Academy quality +${pct(level * 6)}; youth growth`,
            staffDevelopment: `Staff growth +${pct(level * 4)}; engineering depth`,
            scouting: `Scouting accuracy +${pct(level * 7)}; talent discovery`,
            marketing: `Sponsor income +${pct(level * 3.5)}; fan growth`,
            rd: `R&D speed +${pct(level * 3.5)}; innovation bonuses`
        };
        return map[key] || 'Improves long-term team capability.';
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

    function getNextCompletionDays(career) {
        const weeks = getActiveUpgrades(career).map(([, f]) => f.upgrade?.weeksRemaining).filter(Number.isFinite);
        if (!weeks.length) return null;
        return Math.min(...weeks) * 7;
    }

    function formatMoney(n) {
        if (!Number.isFinite(n)) return '0';
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return String(n);
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
            .hq-page { min-height:100%; padding: var(--space-xl); background: var(--black); color: var(--white); position:relative; }
            .hq-command-frame { border-top: 2px solid rgba(255,215,0,.5); border-bottom: 2px solid rgba(0,255,65,.35); padding: 18px 0; margin-bottom: 18px; background: linear-gradient(90deg, rgba(255,215,0,.04), rgba(0,255,65,.025), transparent); }
            .hq-header { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; }
            .hq-kicker { font-family:Orbitron; color:#FFD700; font-size:12px; font-weight:900; letter-spacing:3px; }
            .hq-header h1 { font-family:Orbitron; margin:8px 0; color:#fff; text-shadow: 0 0 18px rgba(255,215,0,.2); }
            .hq-header p { color:var(--gray-400); font-family:Rajdhani; max-width:720px; }
            .hq-summary { display:grid; grid-template-columns:repeat(2,150px); gap:10px; }
            .hq-summary div, .hq-benefits div { background:var(--surface-1); border:1px solid rgba(255,215,0,.25); border-radius:10px; padding:12px; }
            .hq-summary span { display:block; font-family:Orbitron; font-size:9px; color:var(--gray-500); }
            .hq-summary b { font-family:Orbitron; font-size:22px; color:#FFD700; }
            .hq-benefits { display:grid; grid-template-columns:repeat(7,1fr); gap:8px; margin-bottom:16px; font-family:Orbitron; font-size:10px; color:#00FF41; }
            .hq-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
            .hq-facility-card { background:linear-gradient(135deg, rgba(20,20,30,.86), rgba(5,8,12,.96)); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:18px; box-shadow: 0 10px 28px rgba(0,0,0,.35); transition:.2s ease; }
            .hq-facility-card:hover { transform: translateY(-3px); border-color: rgba(0,255,65,.45); box-shadow: 0 14px 38px rgba(0,255,65,.08); }
            .facility-top { display:flex; justify-content:space-between; gap:10px; align-items:center; }
            .facility-title { font-family:Orbitron; font-weight:900; color:white; font-size:13px; }
            .facility-level { font-family:Orbitron; font-weight:900; color:#000; background:#FFD700; border-radius:999px; padding:4px 10px; font-size:11px; box-shadow: 0 0 16px rgba(255,215,0,.25); }
            .facility-bar { height:9px; background:rgba(255,255,255,.08); border-radius:8px; overflow:hidden; margin:12px 0; }
            .facility-bar div { height:100%; background:linear-gradient(90deg,#00FF41,#FFD700); }
            .facility-bar.yellow div { background:#FFD700; }
            .facility-benefit { font-family:Rajdhani; color:var(--gray-300); font-size:13px; margin:5px 0; }
            .facility-upgrade-box, .facility-progress { margin-top:12px; display:flex; justify-content:space-between; gap:10px; align-items:center; font-family:Orbitron; font-size:10px; color:var(--gray-400); }
            .facility-progress { display:block; color:#FFD700; }
            .hq-actions { margin-top:20px; }
            @media(max-width:1100px){ .hq-header{flex-direction:column;} .hq-summary,.hq-grid,.hq-benefits{grid-template-columns:1fr;} }
        `;
        document.head.appendChild(style);
    }

    function destroy() { isActive = false; }

    return { init, render, destroy };
})();
