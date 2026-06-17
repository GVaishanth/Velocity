/* ============================================
   VELOCITY — TEAM SETUP SCREEN
   4-step team builder: Team → Drivers → Staff → Review
   ============================================ */

window.TeamSetupScreen = (() => {

    let container = null;
    let isActive = false;
    let currentStep = 1;

    // Selections in progress
    let selection = {
        team: null,
        drivers: [],
        staff: { techDirector: null, strategist: null, pitCrew: null }
    };

    let budget = 100000000;
    let remainingBudget = 100000000;
    let setupShuffledTeams = null;

    function init() {
        container = document.getElementById('team-setup-content');
        if (!container) return;
        attachListeners();
    }

    function render() {
        if (!container) return;
        recalculateBudget();

        container.innerHTML = `
            <div class="team-setup-container">
                <button class="home-btn" id="ts-home-btn" title="Back to Home">⌂</button>

                <div class="setup-header">
                    <h1 class="setup-title">TEAM SETUP</h1>
                    <div class="budget-display">
                        <span class="budget-label">BUDGET</span>
                        <span class="budget-value ${getBudgetClass()}" id="ts-budget">
                            $${formatMoney(remainingBudget)}
                        </span>
                        <span class="budget-breakdown">/ $${formatMoney(budget)}</span>
                    </div>
                </div>

                <div class="setup-steps">
                    ${renderStepIndicator()}
                </div>

                <div id="ts-step-content">
                    ${renderStepContent()}
                </div>
            </div>
        `;

        attachStepListeners();
    }

    function renderStepIndicator() {
        const steps = ['TEAM', 'DRIVERS', 'STAFF', 'REVIEW'];
        return steps.map((label, idx) => {
            const num = idx + 1;
            const cls = num === currentStep ? 'active'
                : num < currentStep ? 'completed' : '';
            const connector = idx < steps.length - 1
                ? '<div class="setup-step-connector"></div>' : '';
            return `
                <div class="setup-step ${cls}">
                    <div class="setup-step-number">${num}</div>
                    <div class="setup-step-label">${label}</div>
                </div>
                ${connector}
            `;
        }).join('');
    }

    function renderStepContent() {
        switch (currentStep) {
            case 1: return renderTeamStep();
            case 2: return renderDriversStep();
            case 3: return renderStaffStep();
            case 4: return renderReviewStep();
            default: return '';
        }
    }

    /**
     * STEP 1: Team Selection
     */
    function renderTeamStep() {
        return `
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <p style="color: var(--gray-400); letter-spacing: 2px;">Choose your constructor</p>
            </div>

            <div class="team-grid">
                ${(setupShuffledTeams || TEAMS_DATA).map(team => {
                    const isSelected = selection.team?.id === team.id;
                    return `
                        <div class="team-select-card ${isSelected ? 'selected' : ''}"
                             data-team-id="${team.id}">
                            <div class="team-select-logo" style="background: ${team.color}">
                                ${team.shortName}
                            </div>
                            <div class="team-select-name">${escapeHTML(team.name)}</div>
                            <div class="team-select-country">${team.flag} ${escapeHTML(team.country)}</div>
                            <div class="team-select-stats">
                                <div class="team-stat-row">
                                    <span class="team-stat-label">Reputation</span>
                                    <span class="team-stat-value">${team.reputation}</span>
                                </div>
                                <div class="team-stat-row">
                                    <span class="team-stat-label">Fans</span>
                                    <span class="team-stat-value">${team.fanPopularity}</span>
                                </div>
                                <div class="team-stat-row">
                                    <span class="team-stat-label">Overall</span>
                                    <span class="team-stat-value">${getTeamOverall(team)}</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xl);">
                <button class="btn" id="ts-back-home">← BACK</button>
                <button class="btn btn-primary" id="ts-next-step"
                    ${!selection.team ? 'disabled' : ''}>
                    NEXT: HIRE DRIVERS →
                </button>
            </div>
        `;
    }

    /**
     * STEP 2: Driver Selection
     */
    function renderDriversStep() {
        return `
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <p style="color: var(--gray-400); letter-spacing: 2px;">
                    Hire 2 drivers (${selection.drivers.length}/2 selected)
                </p>
            </div>

            <div class="driver-market">
                <div class="driver-market-header">
                    <div class="driver-market-filters">
                        <button class="filter-chip active" data-filter="all">ALL</button>
                        <button class="filter-chip" data-filter="elite">ELITE (88+)</button>
                        <button class="filter-chip" data-filter="strong">STRONG (82+)</button>
                        <button class="filter-chip" data-filter="mid">MID (75+)</button>
                        <button class="filter-chip" data-filter="budget">BUDGET (&lt;75)</button>
                    </div>
                    <button class="btn btn-auto-fill" id="ts-auto-drivers">
                        🎲 AUTO-FILL
                    </button>
                </div>

                <div class="driver-list" id="ts-driver-list">
                    ${renderDriverList('all')}
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xl);">
                <button class="btn" id="ts-prev-step">← BACK</button>
                <button class="btn btn-primary" id="ts-next-step"
                    ${selection.drivers.length < 2 ? 'disabled' : ''}>
                    NEXT: HIRE STAFF →
                </button>
            </div>
        `;
    }

    function renderDriverList(filter = 'all') {
        let drivers = [...DRIVERS_DATA];
        if (filter === 'elite') drivers = drivers.filter(d => d.rating >= 88);
        else if (filter === 'strong') drivers = drivers.filter(d => d.rating >= 82 && d.rating < 88);
        else if (filter === 'mid') drivers = drivers.filter(d => d.rating >= 75 && d.rating < 82);
        else if (filter === 'budget') drivers = drivers.filter(d => d.rating < 75);

        drivers.sort(() => Math.random() - 0.5);

        return drivers.map(d => {
            const isHired = selection.drivers.some(sd => sd.id === d.id);
            const canAfford = d.cost <= remainingBudget + (isHired ? d.cost : 0);

            return `
                <div class="driver-hire-card ${isHired ? 'hired' : ''} ${!canAfford && !isHired ? 'disabled' : ''}"
                     data-driver-id="${d.id}">
                    <div class="driver-hire-avatar">${d.flag || '🏎️'}</div>
                    <div class="driver-hire-info">
                        <div class="driver-hire-name">${escapeHTML(d.name)}</div>
                        <div class="driver-hire-traits">
                            ${d.traits.slice(0, 2).map(t => {
                                const trait = DRIVER_TRAITS[t];
                                return `<span class="badge badge-yellow" title="${trait?.description || ''}">${trait?.icon || ''} ${trait?.name || t}</span>`;
                            }).join('')}
                        </div>
                    </div>
                    <div class="driver-hire-stats">
                        <div class="driver-hire-stat">
                            <div class="driver-hire-stat-label">PACE</div>
                            <div class="driver-hire-stat-value">${d.stats.pace}</div>
                        </div>
                        <div class="driver-hire-stat">
                            <div class="driver-hire-stat-label">WET</div>
                            <div class="driver-hire-stat-value">${d.stats.wetSkill}</div>
                        </div>
                    </div>
                    <div class="driver-hire-rating">${d.rating}</div>
                    <div class="driver-hire-cost">$${formatMoney(d.cost)}</div>
                    <button class="btn driver-hire-action ${isHired ? 'btn-danger' : 'btn-glow'}"
                        ${!canAfford && !isHired ? 'disabled' : ''}>
                        ${isHired ? 'FIRE' : 'HIRE'}
                    </button>
                </div>
            `;
        }).join('');
    }

    /**
     * STEP 3: Staff Selection
     */
    let currentStaffTab = 'technicalDirectors';
    function renderStaffStep() {
        return `
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <p style="color: var(--gray-400); letter-spacing: 2px;">Hire one of each staff role</p>
            </div>

            <div class="staff-tabs">
                <button class="staff-tab ${currentStaffTab === 'technicalDirectors' ? 'active' : ''}"
                    data-tab="technicalDirectors">
                    🛠️ TECHNICAL DIRECTOR ${selection.staff.techDirector ? '✓' : ''}
                </button>
                <button class="staff-tab ${currentStaffTab === 'chiefStrategists' ? 'active' : ''}"
                    data-tab="chiefStrategists">
                    🧠 CHIEF STRATEGIST ${selection.staff.strategist ? '✓' : ''}
                </button>
                <button class="staff-tab ${currentStaffTab === 'pitCrews' ? 'active' : ''}"
                    data-tab="pitCrews">
                    🔧 PIT CREW ${selection.staff.pitCrew ? '✓' : ''}
                </button>
            </div>

            <div class="staff-list" id="ts-staff-list">
                ${renderStaffList(currentStaffTab)}
            </div>

            <div style="display: flex; justify-content: space-between; margin-top: var(--space-xl);">
                <button class="btn" id="ts-prev-step">← BACK</button>
                <button class="btn btn-primary" id="ts-next-step"
                    ${!hasAllStaff() ? 'disabled' : ''}>
                    NEXT: REVIEW →
                </button>
            </div>
        `;
    }

    function renderStaffList(category) {
        const list = STAFF_DATA[category] || [];
        const roleMap = {
            technicalDirectors: 'techDirector',
            chiefStrategists: 'strategist',
            pitCrews: 'pitCrew'
        };
        const role = roleMap[category];

        return `<div style="display: flex; flex-direction: column; gap: var(--space-md);">
            ${list.sort((a, b) => b.rating - a.rating).map(s => {
                const isSelected = selection.staff[role]?.id === s.id;
                const canAfford = s.cost <= remainingBudget + (isSelected ? s.cost : 0);

                const bonusText = s.bonus ? Object.entries(s.bonus)
                    .map(([k, v]) => `+${v} ${k.replace(/([A-Z])/g, ' $1').toUpperCase()}`)
                    .join(' • ') : '';

                return `
                    <div class="staff-card ${isSelected ? 'selected' : ''} ${!canAfford && !isSelected ? 'disabled' : ''}"
                         data-staff-id="${s.id}" data-staff-role="${role}">
                        <div class="staff-avatar">${s.flag || '👤'}</div>
                        <div class="staff-info">
                            <div class="staff-name">${escapeHTML(s.name)}</div>
                            <div class="staff-specialty">${escapeHTML(s.bio || '')}</div>
                            <div class="staff-bonus">${bonusText}</div>
                        </div>
                        <div class="staff-rating">${s.rating}</div>
                        <div class="staff-cost">$${formatMoney(s.cost)}</div>
                    </div>
                `;
            }).join('')}
        </div>`;
    }

    /**
     * STEP 4: Review
     */
    function renderReviewStep() {
        const team = selection.team;
        const teamStats = team.baseCarStats;
        const totalSpent = budget - remainingBudget;

        return `
            <div style="text-align: center; margin-bottom: var(--space-xl);">
                <p style="color: var(--gray-400); letter-spacing: 2px;">Review your team and start the season</p>
            </div>

            <div class="review-container">
                <div class="review-section">
                    <h3 class="review-section-title">🏎️ Team</h3>
                    <div class="review-item">
                        <span class="review-item-label">Constructor</span>
                        <span class="review-item-value" style="color: ${team.color}">${escapeHTML(team.name)}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-item-label">Country</span>
                        <span class="review-item-value">${team.flag} ${escapeHTML(team.country)}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-item-label">Reputation</span>
                        <span class="review-item-value">${team.reputation}/100</span>
                    </div>

                    <h3 class="review-section-title" style="margin-top: var(--space-xl);">👥 Drivers</h3>
                    ${selection.drivers.map(d => `
                        <div class="review-item">
                            <span class="review-item-label">${d.flag} ${escapeHTML(d.name)}</span>
                            <span class="review-item-value">Rating: ${d.rating} • $${formatMoney(d.cost)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="review-section">
                    <h3 class="review-section-title">🛠️ Staff</h3>
                    <div class="review-item">
                        <span class="review-item-label">Technical Director</span>
                        <span class="review-item-value">${escapeHTML(selection.staff.techDirector?.name)}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-item-label">Chief Strategist</span>
                        <span class="review-item-value">${escapeHTML(selection.staff.strategist?.name)}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-item-label">Pit Crew</span>
                        <span class="review-item-value">${escapeHTML(selection.staff.pitCrew?.name)}</span>
                    </div>

                    <h3 class="review-section-title" style="margin-top: var(--space-xl);">💰 Budget</h3>
                    <div class="review-item">
                        <span class="review-item-label">Total Spent</span>
                        <span class="review-item-value">$${formatMoney(totalSpent)}</span>
                    </div>
                    <div class="review-item">
                        <span class="review-item-label">Remaining</span>
                        <span class="review-item-value" style="color: var(--green)">$${formatMoney(remainingBudget)}</span>
                    </div>

                    <h3 class="review-section-title" style="margin-top: var(--space-xl);">📊 Car Performance</h3>
                    ${Object.entries(teamStats).map(([stat, val]) => `
                        <div class="review-item">
                            <span class="review-item-label">${stat.replace(/([A-Z])/g, ' $1')}</span>
                            <div style="display: flex; align-items: center; gap: var(--space-sm); flex: 1; max-width: 60%;">
                                <div class="stat-bar" style="flex: 1;">
                                    <div class="stat-bar-fill" style="width: ${val}%"></div>
                                </div>
                                <span style="font-family: 'Orbitron'; font-weight: 700; min-width: 30px; text-align: right;">${val}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <button class="btn btn-enter-paddock" id="ts-confirm">
                ENTER THE PADDOCK
            </button>

            <button class="btn" id="ts-prev-step" style="width: 100%; margin-top: var(--space-md);">
                ← BACK TO STAFF
            </button>
        `;
    }

    /* === LISTENERS === */
    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:team-setup:enter', () => {
            isActive = true;
            currentStep = 1;
            selection = { team: null, drivers: [], staff: { techDirector: null, strategist: null, pitCrew: null } };
            if (typeof StateManager !== 'undefined' && StateManager.randomizeGameData) {
                StateManager.randomizeGameData();
            }
            setupShuffledTeams = [...TEAMS_DATA].sort(() => Math.random() - 0.5);
            render();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.screen !== 'team-setup') isActive = false;
        });
    }

    function attachStepListeners() {
        if (!container) return;

        container.querySelector('#ts-home-btn')?.addEventListener('click', () => {
            confirmLeave();
        });

        container.querySelector('#ts-back-home')?.addEventListener('click', () => {
            confirmLeave();
        });

        container.querySelector('#ts-next-step')?.addEventListener('click', () => {
            if (currentStep < 4) {
                currentStep++;
                if (typeof AudioManager !== 'undefined') AudioManager.uiConfirm();
                render();
            }
        });

        container.querySelector('#ts-prev-step')?.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                render();
            }
        });

        // STEP 1: Team selection
        container.querySelectorAll('.team-select-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.teamId;
                selection.team = getTeamById(id);
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
                render();
            });
        });

        // STEP 2: Driver hiring
        container.querySelectorAll('.driver-hire-card').forEach(card => {
            const btn = card.querySelector('.driver-hire-action');
            if (!btn || btn.disabled) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDriver(card.dataset.driverId);
            });
        });

        // Driver filters
        container.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const list = container.querySelector('#ts-driver-list');
                if (list) list.innerHTML = renderDriverList(chip.dataset.filter);
                attachStepListeners();
            });
        });

        // Auto-fill drivers
        container.querySelector('#ts-auto-drivers')?.addEventListener('click', () => {
            autoFillDrivers();
        });

        // STEP 3: Staff tabs
        container.querySelectorAll('.staff-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentStaffTab = tab.dataset.tab;
                render();
            });
        });

        // STEP 3: Staff cards
        container.querySelectorAll('.staff-card').forEach(card => {
            if (card.classList.contains('disabled')) return;
            card.addEventListener('click', () => {
                const id = card.dataset.staffId;
                const role = card.dataset.staffRole;
                toggleStaff(role, currentStaffTab, id);
            });
        });

        // STEP 4: Confirm
        container.querySelector('#ts-confirm')?.addEventListener('click', () => {
            confirmTeam();
        });
    }

    /* === SELECTION HELPERS === */
    function toggleDriver(id) {
        const driver = getDriverById(id);
        if (!driver) return;

        const idx = selection.drivers.findIndex(d => d.id === id);
        if (idx >= 0) {
            // Fire
            selection.drivers.splice(idx, 1);
        } else {
            if (selection.drivers.length >= 2) {
                Notifications.warning('Maximum 2 drivers');
                return;
            }
            if (driver.cost > remainingBudget) {
                Notifications.error('Not enough budget');
                return;
            }
            selection.drivers.push(driver);
        }
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
        render();
    }

    function toggleStaff(role, category, id) {
        const staffMember = STAFF_DATA[category].find(s => s.id === id);
        if (!staffMember) return;

        if (selection.staff[role]?.id === id) {
            selection.staff[role] = null;
        } else {
            const previousCost = selection.staff[role]?.cost || 0;
            if (staffMember.cost > remainingBudget + previousCost) {
                Notifications.error('Not enough budget');
                return;
            }
            selection.staff[role] = staffMember;
        }
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
        render();
    }

    function autoFillDrivers() {
        selection.drivers = [];
        const availableBudget = remainingBudget;

        // Try to get one strong driver + one mid-tier
        const strong = DRIVERS_DATA.filter(d => d.rating >= 82 && d.cost <= availableBudget * 0.6);
        if (strong.length > 0) {
            const pick = strong[Math.floor(Math.random() * strong.length)];
            selection.drivers.push(pick);
        }

        const remainder = remainingBudget;
        const second = DRIVERS_DATA.filter(d =>
            d.cost <= remainder &&
            !selection.drivers.some(sd => sd.id === d.id)
        );
        if (second.length > 0) {
            second.sort((a, b) => b.rating - a.rating);
            selection.drivers.push(second[0]);
        }

        Notifications.success('Drivers auto-filled');
        render();
    }

    /* === UTILS === */
    function hasAllStaff() {
        return selection.staff.techDirector && selection.staff.strategist && selection.staff.pitCrew;
    }

    function recalculateBudget() {
        let spent = 0;
        selection.drivers.forEach(d => spent += d.cost);
        Object.values(selection.staff).forEach(s => { if (s) spent += s.cost; });
        remainingBudget = budget - spent;
    }

    function getBudgetClass() {
        if (remainingBudget < 0) return 'danger';
        if (remainingBudget < budget * 0.1) return 'warning';
        return '';
    }

    function formatMoney(n) {
        if (typeof n !== 'number') return '0';
        if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(0) + 'K';
        return n.toString();
    }

    function confirmLeave() {
        Modals.confirm({
            title: 'Leave Team Setup?',
            body: 'Your progress will be lost.',
            confirmText: 'Yes, Leave',
            confirmType: 'danger',
            onConfirm: () => {
                EventBus.emit('nav:home');
            }
        });
    }

    function confirmTeam() {
        if (!selection.team || selection.drivers.length < 2 || !hasAllStaff()) {
            Notifications.error('Incomplete team');
            return;
        }
        if (remainingBudget < 0) {
            Notifications.error('Over budget!');
            return;
        }

        // Initialize career
        const settings = StateManager.get('settings') || {};
        StateManager.initCareer(selection.team, selection.drivers, selection.staff, {
            seasonLength: settings.seasonLength || 10,
            difficulty: settings.difficulty || 'COMPETITIVE'
        });

        Notifications.success('Team registered!', `Welcome to ${selection.team.name}`);

        // Navigate to dashboard
        setTimeout(() => {
            EventBus.emit('nav:go', { screen: 'dashboard', color: '#00FF41' });
        }, 800);
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

    return { init, render, destroy };
})();