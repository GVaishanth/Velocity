/* ============================================
   VELOCITY — R&D MODULE
   Extracted from dashboard ownership
   ============================================ */

window.RDModule = (() => {
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
        if (window.DashboardScreen?.render) window.DashboardScreen.render();
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
                            ${window.CarSVGUtils?.getFuturisticCarSVG({ mode: 'rd', view: 'top' }) || ''}
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

    return { open: showRDModal };
})();
