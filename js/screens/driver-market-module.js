/* ============================================
   VELOCITY — DRIVER MARKET MODULE
   Transfer center extracted from dashboard ownership
   ============================================ */

window.DriverMarketModule = (() => {
    function showDriverMarketModal() {
        const career = StateManager.get('career');
        if (!career) return;

        if (!Array.isArray(career.driverMarketShortlist)) {
            career.driverMarketShortlist = [];
            StateManager.set('career', career);
            StateManager.saveGame?.();
        }

        const initialMarket = buildDriverMarketDataset(career);
        const state = {
            search: '',
            age: 'all',
            rating: 'all',
            potential: 'all',
            nationality: 'all',
            team: 'all',
            freeAgent: 'all',
            trait: 'all',
            sort: 'rating-desc',
            view: 'all',
            compareIds: [],
            selectedDriverId: career.drivers?.[0]?.id || initialMarket.allDrivers?.[0]?.id || null
        };

        const rerenderMarket = () => {
            const currentCareer = StateManager.get('career');
            const root = document.getElementById('market-transfer-center');
            if (!root || !currentCareer) return;
            const market = buildDriverMarketDataset(currentCareer);
            const selectedStillExists = market.allDrivers.some(d => d.id === state.selectedDriverId);
            if (!selectedStillExists) state.selectedDriverId = market.allDrivers?.[0]?.id || null;
            state.compareIds = state.compareIds.filter(id => market.allDrivers.some(d => d.id === id)).slice(0, 3);
            root.innerHTML = renderDriverMarketTransferCenter(currentCareer, state, market);
            attachDriverMarketInteractions(currentCareer, state, rerenderMarket, market);
            if (state.focusField) {
                const focusTarget = document.getElementById(state.focusField);
                if (focusTarget) {
                    focusTarget.focus();
                    if (typeof focusTarget.setSelectionRange === 'function') {
                        const end = focusTarget.value?.length || 0;
                        focusTarget.setSelectionRange(end, end);
                    }
                }
            }
        };

        Modals.open({
            title: `💼 DRIVER MARKET — TRANSFER CENTRE • BUDGET $${formatMoney(career.budget)}`,
            className: 'modal-xl modal-market',
            body: '<div id="market-transfer-center"></div>',
            actions: [{ label: 'RETURN TO DASHBOARD', type: 'secondary' }],
            onOpen: rerenderMarket
        });
    }

    function buildDriverMarketDataset(career) {
        const rosterMap = new Map();
        const baseDrivers = Array.isArray(DRIVERS_DATA) ? DRIVERS_DATA : [];
        const teamCollection = [];

        if (Array.isArray(career.allTeams)) teamCollection.push(...career.allTeams);
        if (career.team) teamCollection.push({ ...career.team, drivers: career.drivers });

        teamCollection.forEach(team => {
            const teamDrivers = Array.isArray(team?.drivers) ? team.drivers : [];
            teamDrivers.forEach(driver => {
                rosterMap.set(driver.id, {
                    teamId: team.id || null,
                    teamName: team.name || 'Unknown Team',
                    teamShortName: team.shortName || 'TEAM',
                    teamColor: team.color || team.teamColor || '#888888',
                    isPlayerTeam: team.id === career.team?.id,
                    liveDriver: driver
                });
            });
        });

        const knownIds = new Set();
        const allDrivers = [];

        const pushDriver = (driver) => {
            if (!driver?.id || knownIds.has(driver.id)) return;
            knownIds.add(driver.id);
            const rosterInfo = rosterMap.get(driver.id);
            const liveDriver = rosterInfo?.liveDriver || driver;
            const mergedStats = {
                ...(driver.stats || {}),
                ...(liveDriver.stats || {})
            };
            const mergedDriver = {
                ...driver,
                ...liveDriver,
                stats: mergedStats
            };
            const freeAgent = !rosterInfo;
            const traitNames = getDriverTraitNames(mergedDriver);
            const visiblePotential = getDriverVisiblePotential(mergedDriver);
            allDrivers.push({
                ...mergedDriver,
                freeAgent,
                currentTeamId: rosterInfo?.teamId || 'free-agent',
                currentTeamName: rosterInfo?.teamName || 'Free Agent',
                currentTeamShortName: rosterInfo?.teamShortName || 'FA',
                currentTeamColor: rosterInfo?.teamColor || '#666666',
                isPlayerTeamDriver: !!rosterInfo?.isPlayerTeam,
                marketValue: mergedDriver.marketValue || mergedDriver.cost || 0,
                traitNames,
                visiblePotential,
                careerStats: getDriverCareerStats(career, mergedDriver.id),
                shortlist: career.driverMarketShortlist?.includes(mergedDriver.id) || false,
                contractSortValue: Number.isFinite(mergedDriver.contractYears) ? mergedDriver.contractYears : 99
            });
        };

        baseDrivers.forEach(pushDriver);
        rosterMap.forEach(({ liveDriver }) => pushDriver(liveDriver));

        const shortlisted = allDrivers.filter(driver => driver.shortlist);
        const freeAgents = allDrivers.filter(driver => driver.freeAgent);
        const topProspects = getTopProspectDrivers(allDrivers);

        return {
            allDrivers,
            shortlisted,
            freeAgents,
            topProspects,
            nationalities: [...new Set(allDrivers.map(d => d.nationality).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
            teams: [...new Map(allDrivers.filter(d => !d.freeAgent).map(d => [d.currentTeamId, { id: d.currentTeamId, name: d.currentTeamName }])).values()]
                .sort((a, b) => a.name.localeCompare(b.name)),
            traits: Object.entries(typeof DRIVER_TRAITS !== 'undefined' ? DRIVER_TRAITS : {})
                .map(([key, trait]) => ({ key, label: trait?.name || key.replace(/_/g, ' ') }))
                .sort((a, b) => a.label.localeCompare(b.label))
        };
    }

    function getDriverTraitNames(driver) {
        return (driver?.traits || []).map(traitKey => {
            const trait = typeof DRIVER_TRAITS !== 'undefined' ? DRIVER_TRAITS[traitKey] : null;
            return trait ? `${trait.icon} ${trait.name}` : traitKey.replace(/_/g, ' ');
        });
    }

    function getDriverVisiblePotential(driver) {
        const rawPotential = driver?.potentialRating ?? driver?.potential ?? null;
        if (Number.isFinite(rawPotential)) return rawPotential;
        const rating = Number.isFinite(driver?.rating) ? driver.rating : 70;
        const age = Number.isFinite(driver?.age) ? driver.age : 27;
        const ageCurve = age <= 20 ? 17 :
            age <= 21 ? 15 :
            age <= 22 ? 13 :
            age <= 23 ? 11 :
            age <= 24 ? 9 :
            age <= 25 ? 7 :
            age <= 26 ? 5 :
            age <= 27 ? 4 :
            age <= 28 ? 3 :
            age <= 29 ? 2 :
            age <= 30 ? 1 :
            age <= 31 ? 0 :
            age <= 32 ? -1 : -2;
        const paceBonus = Math.max(0, Math.round(((driver?.stats?.pace || rating) - 80) / 8));
        return Math.max(rating, Math.min(99, rating + ageCurve + paceBonus));
    }

    function getTopProspectDrivers(drivers) {
        return [...drivers]
            .filter(driver => (driver.age || 99) <= 24)
            .sort((a, b) => {
                const potentialGap = (b.visiblePotential ?? b.rating ?? 0) - (a.visiblePotential ?? a.rating ?? 0);
                if (potentialGap !== 0) return potentialGap;
                const ageGap = (a.age || 99) - (b.age || 99);
                if (ageGap !== 0) return ageGap;
                return (b.rating || 0) - (a.rating || 0);
            })
            .slice(0, 8);
    }

    function getDriverCareerStats(career, driverId) {
        const standings = career?.championship?.driverStandings || [];
        const standing = standings.find(entry => entry.driverId === driverId) || null;
        const completedRounds = Math.max(
            Array.isArray(career?.raceHistory) ? career.raceHistory.length : 0,
            Number.isFinite(career?.currentRound) ? career.currentRound : 0
        );
        return {
            starts: standing ? completedRounds : 0,
            points: standing?.points || 0,
            wins: standing?.wins || 0,
            podiums: standing?.podiums || 0,
            bestFinish: Number.isFinite(standing?.bestFinish) && standing.bestFinish < 90 ? standing.bestFinish : null
        };
    }

    function getDriverStatEntries(driver) {
        const labels = {
            pace: 'Pace',
            consistency: 'Consistency',
            tireManagement: 'Tire Management',
            wetSkill: 'Wet Skill',
            racecraft: 'Racecraft',
            experience: 'Experience'
        };
        return Object.entries(driver?.stats || {})
            .map(([key, value]) => ({
                key,
                label: labels[key] || formatStatName(key),
                value: Number.isFinite(value) ? value : 0
            }))
            .sort((a, b) => b.value - a.value);
    }

    function getDriverStrengths(driver, count = 2) {
        return getDriverStatEntries(driver).slice(0, count);
    }

    function getDriverWeaknesses(driver, count = 2) {
        return [...getDriverStatEntries(driver)].sort((a, b) => a.value - b.value).slice(0, count);
    }

    function formatCareerStat(value, prefix = '') {
        if (value === null || value === undefined || value === '') return '—';
        return `${prefix}${value}`;
    }

    function filterDriverMarketDrivers(drivers, state) {
        const searchTerm = (state.search || '').trim().toLowerCase();
        let filtered = [...drivers];

        if (state.view === 'shortlist') filtered = filtered.filter(driver => driver.shortlist);
        if (state.view === 'free-agents') filtered = filtered.filter(driver => driver.freeAgent);
        if (state.view === 'prospects') filtered = getTopProspectDrivers(filtered);

        if (searchTerm) {
            filtered = filtered.filter(driver => {
                const haystack = [
                    driver.name,
                    driver.firstName,
                    driver.lastName,
                    driver.nationality,
                    driver.currentTeamName,
                    driver.currentTeamShortName
                ].filter(Boolean).join(' ').toLowerCase();
                return haystack.includes(searchTerm);
            });
        }

        if (state.age === 'u23') filtered = filtered.filter(driver => (driver.age || 99) <= 22);
        if (state.age === '23-26') filtered = filtered.filter(driver => (driver.age || 0) >= 23 && (driver.age || 0) <= 26);
        if (state.age === '27-30') filtered = filtered.filter(driver => (driver.age || 0) >= 27 && (driver.age || 0) <= 30);
        if (state.age === '31plus') filtered = filtered.filter(driver => (driver.age || 0) >= 31);

        if (state.rating === '90plus') filtered = filtered.filter(driver => (driver.rating || 0) >= 90);
        if (state.rating === '85-89') filtered = filtered.filter(driver => (driver.rating || 0) >= 85 && (driver.rating || 0) <= 89);
        if (state.rating === '80-84') filtered = filtered.filter(driver => (driver.rating || 0) >= 80 && (driver.rating || 0) <= 84);
        if (state.rating === '75-79') filtered = filtered.filter(driver => (driver.rating || 0) >= 75 && (driver.rating || 0) <= 79);
        if (state.rating === 'under75') filtered = filtered.filter(driver => (driver.rating || 0) < 75);

        if (state.potential === '95plus') filtered = filtered.filter(driver => (driver.visiblePotential ?? driver.rating ?? 0) >= 95);
        if (state.potential === '90-94') filtered = filtered.filter(driver => (driver.visiblePotential ?? driver.rating ?? 0) >= 90 && (driver.visiblePotential ?? driver.rating ?? 0) <= 94);
        if (state.potential === '85-89') filtered = filtered.filter(driver => (driver.visiblePotential ?? driver.rating ?? 0) >= 85 && (driver.visiblePotential ?? driver.rating ?? 0) <= 89);
        if (state.potential === 'under85') filtered = filtered.filter(driver => (driver.visiblePotential ?? driver.rating ?? 0) < 85);

        if (state.nationality !== 'all') filtered = filtered.filter(driver => driver.nationality === state.nationality);
        if (state.team !== 'all') filtered = filtered.filter(driver => driver.currentTeamId === state.team);
        if (state.freeAgent === 'free') filtered = filtered.filter(driver => driver.freeAgent);
        if (state.freeAgent === 'signed') filtered = filtered.filter(driver => !driver.freeAgent);
        if (state.trait !== 'all') filtered = filtered.filter(driver => (driver.traits || []).includes(state.trait));

        filtered.sort((a, b) => {
            if (state.sort === 'rating-asc') return (a.rating || 0) - (b.rating || 0) || (a.age || 99) - (b.age || 99);
            if (state.sort === 'youngest') return (a.age || 99) - (b.age || 99) || (b.rating || 0) - (a.rating || 0);
            if (state.sort === 'oldest') return (b.age || 0) - (a.age || 0) || (b.rating || 0) - (a.rating || 0);
            if (state.sort === 'potential-desc') return (b.visiblePotential ?? b.rating ?? 0) - (a.visiblePotential ?? a.rating ?? 0) || (b.rating || 0) - (a.rating || 0);
            if (state.sort === 'alphabetical') return (a.lastName || a.name || '').localeCompare(b.lastName || b.name || '') || (b.rating || 0) - (a.rating || 0);
            return (b.rating || 0) - (a.rating || 0) || (a.age || 99) - (b.age || 99);
        });

        return filtered;
    }

    function renderDriverMarketTransferCenter(career, state, market) {
        const filteredDrivers = filterDriverMarketDrivers(market.allDrivers, state);
        const selectedDriver = market.allDrivers.find(driver => driver.id === state.selectedDriverId) || filteredDrivers[0] || null;
        const compareDrivers = state.compareIds
            .map(id => market.allDrivers.find(driver => driver.id === id))
            .filter(Boolean);

        return `
            <div class="transfer-market-layout">
                <section class="transfer-market-section market-search-section">
                    <div class="market-section-title-row">
                        <div>
                            <div class="market-kicker">SEARCH & FILTERS</div>
                            <h3 class="market-panel-title">Transfer Board Controls</h3>
                        </div>
                        <div class="market-overview-grid">
                            <div class="market-overview-tile"><span>All Drivers</span><b>${market.allDrivers.length}</b></div>
                            <div class="market-overview-tile"><span>Free Agents</span><b>${market.freeAgents.length}</b></div>
                            <div class="market-overview-tile"><span>Shortlisted</span><b>${market.shortlisted.length}</b></div>
                            <div class="market-overview-tile"><span>Prospects</span><b>${market.topProspects.length}</b></div>
                        </div>
                    </div>
                    <div class="market-toolbar-grid">
                        <label class="market-control market-search-wide">
                            <span>Search</span>
                            <input class="input" id="market-search" value="${escapeHTML(state.search)}" placeholder="Search by name, nationality or team...">
                        </label>
                        <label class="market-control">
                            <span>Age</span>
                            <select class="select" id="market-filter-age">
                                ${renderSelectOptions([
                                    ['all', 'All Ages'],
                                    ['u23', '22 & Under'],
                                    ['23-26', '23-26'],
                                    ['27-30', '27-30'],
                                    ['31plus', '31+']
                                ], state.age)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Overall Rating</span>
                            <select class="select" id="market-filter-rating">
                                ${renderSelectOptions([
                                    ['all', 'All Ratings'],
                                    ['90plus', '90+'],
                                    ['85-89', '85-89'],
                                    ['80-84', '80-84'],
                                    ['75-79', '75-79'],
                                    ['under75', 'Under 75']
                                ], state.rating)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Potential</span>
                            <select class="select" id="market-filter-potential">
                                ${renderSelectOptions([
                                    ['all', 'All Potential'],
                                    ['95plus', '95+'],
                                    ['90-94', '90-94'],
                                    ['85-89', '85-89'],
                                    ['under85', 'Under 85']
                                ], state.potential)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Nationality</span>
                            <select class="select" id="market-filter-nationality">
                                ${renderSelectOptions([['all', 'All Nationalities'], ...market.nationalities.map(name => [name, name])], state.nationality)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Current Team</span>
                            <select class="select" id="market-filter-team">
                                ${renderSelectOptions([
                                    ['all', 'All Teams'],
                                    ['free-agent', 'Free Agents'],
                                    ...market.teams.map(team => [team.id, team.name])
                                ], state.team)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Free Agent Status</span>
                            <select class="select" id="market-filter-status">
                                ${renderSelectOptions([
                                    ['all', 'All Drivers'],
                                    ['free', 'Free Agents'],
                                    ['signed', 'Signed Drivers']
                                ], state.freeAgent)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Traits</span>
                            <select class="select" id="market-filter-trait">
                                ${renderSelectOptions([['all', 'All Traits'], ...market.traits.map(trait => [trait.key, trait.label])], state.trait)}
                            </select>
                        </label>
                        <label class="market-control">
                            <span>Sort By</span>
                            <select class="select" id="market-sort">
                                ${renderSelectOptions([
                                    ['rating-desc', 'Highest Rating'],
                                    ['rating-asc', 'Lowest Rating'],
                                    ['youngest', 'Youngest'],
                                    ['oldest', 'Oldest'],
                                    ['potential-desc', 'Highest Potential'],
                                    ['alphabetical', 'Alphabetical']
                                ], state.sort)}
                            </select>
                        </label>
                    </div>
                    <div class="market-view-tabs">
                        ${renderMarketViewTab('all', 'All Drivers', market.allDrivers.length, state.view)}
                        ${renderMarketViewTab('shortlist', 'Shortlist', market.shortlisted.length, state.view)}
                        ${renderMarketViewTab('free-agents', 'Free Agents', market.freeAgents.length, state.view)}
                        ${renderMarketViewTab('prospects', 'Top Prospects', market.topProspects.length, state.view)}
                    </div>
                </section>

                <section class="transfer-market-section market-listings-section">
                    <div class="market-section-title-row">
                        <div>
                            <div class="market-kicker">DRIVER LISTINGS</div>
                            <h3 class="market-panel-title">Scouting Overview</h3>
                        </div>
                        <div class="market-results-label">${filteredDrivers.length} drivers match current filters</div>
                    </div>

                    ${renderMarketComparisonPanel(compareDrivers)}

                    <div class="market-snapshot-grid">
                        ${renderMarketSnapshotSection('Shortlisted Drivers', 'Tracked targets for future transfer decisions.', market.shortlisted, state, 'No shortlisted drivers yet.')}
                        ${renderMarketSnapshotSection('Free Agents', 'Immediately available driver pool for future contract integration.', market.freeAgents, state, 'No free agents currently available.')}
                        ${renderMarketSnapshotSection('Top Prospects', 'Young high-potential drivers to monitor for future academy expansion.', market.topProspects, state, 'No prospect data available yet.')}
                    </div>

                    <div class="market-driver-grid">
                        ${filteredDrivers.length ? filteredDrivers.map(driver => renderDriverMarketCard(driver, state)).join('') : `
                            <div class="market-empty-state">
                                <div class="market-empty-icon">🔎</div>
                                <div class="market-empty-title">No Drivers Match</div>
                                <div class="market-empty-copy">Adjust your filters or search terms to widen the transfer board.</div>
                            </div>
                        `}
                    </div>
                </section>

                <section class="transfer-market-section market-detail-section">
                    <div class="market-section-title-row">
                        <div>
                            <div class="market-kicker">DRIVER DETAILS</div>
                            <h3 class="market-panel-title">Selected Driver Panel</h3>
                        </div>
                        <div class="market-results-label">${selectedDriver ? escapeHTML(selectedDriver.currentTeamName) : 'No selection'}</div>
                    </div>
                    ${renderDriverMarketDetailPanel(selectedDriver, state, career)}
                </section>
            </div>
        `;
    }

    function renderSelectOptions(options, selectedValue) {
        return options.map(([value, label]) => `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('');
    }

    function renderMarketViewTab(id, label, count, currentView) {
        return `
            <button class="market-view-tab ${currentView === id ? 'active' : ''}" data-market-view="${id}">
                <span>${escapeHTML(label)}</span>
                <b>${count}</b>
            </button>
        `;
    }

    function renderMarketComparisonPanel(compareDrivers) {
        const filledSlots = compareDrivers.map(driver => `
            <div class="market-compare-card">
                <div class="market-compare-head">
                    <span class="market-compare-flag">${escapeHTML(driver.flag || '🏁')}</span>
                    <div>
                        <div class="market-compare-name">${escapeHTML(driver.name)}</div>
                        <div class="market-compare-team">${escapeHTML(driver.currentTeamName)}</div>
                    </div>
                </div>
                <div class="market-compare-metrics">
                    <div><span>OVR</span><b>${driver.rating || '—'}</b></div>
                    <div><span>Age</span><b>${driver.age || '—'}</b></div>
                    <div><span>Potential</span><b>${driver.visiblePotential ?? '—'}</b></div>
                    <div><span>Team</span><b>${escapeHTML(driver.currentTeamShortName || driver.currentTeamName)}</b></div>
                    <div><span>Points</span><b>${driver.careerStats?.points || 0}</b></div>
                    <div><span>Podiums</span><b>${driver.careerStats?.podiums || 0}</b></div>
                </div>
                <div class="market-compare-traits">
                    ${(driver.traitNames || []).length ? driver.traitNames.slice(0, 3).map(trait => `<span>${escapeHTML(trait)}</span>`).join('') : '<span>No published traits</span>'}
                </div>
            </div>
        `);

        while (filledSlots.length < 3) {
            filledSlots.push(`
                <div class="market-compare-card placeholder">
                    <div class="market-compare-placeholder">Select driver ${filledSlots.length + 1}</div>
                    <div class="market-compare-placeholder-copy">Use compare on any driver card to build a side-by-side board.</div>
                </div>
            `);
        }

        return `
            <div class="market-compare-shell ${compareDrivers.length ? 'active' : ''}">
                <div class="market-compare-toolbar">
                    <div>
                        <div class="market-kicker">COMPARE MODE</div>
                        <div class="market-compare-subtitle">Select up to 3 drivers. Compare age, OVR, potential, team, traits and career statistics side-by-side.</div>
                    </div>
                    <div class="market-compare-toolbar-actions">
                        <span>${compareDrivers.length}/3 selected</span>
                        <button class="btn" data-market-clear-compare ${compareDrivers.length ? '' : 'disabled'}>Clear</button>
                    </div>
                </div>
                <div class="market-compare-grid">${filledSlots.join('')}</div>
            </div>
        `;
    }

    function renderMarketSnapshotSection(title, subtitle, drivers, state, emptyText) {
        const previewDrivers = Array.isArray(drivers) ? drivers.slice(0, 6) : [];
        return `
            <div class="market-snapshot-card">
                <div class="market-snapshot-head">
                    <div>
                        <div class="market-snapshot-title">${escapeHTML(title)}</div>
                        <div class="market-snapshot-subtitle">${escapeHTML(subtitle)}</div>
                    </div>
                    <b>${Array.isArray(drivers) ? drivers.length : 0}</b>
                </div>
                <div class="market-snapshot-list">
                    ${previewDrivers.length ? previewDrivers.map(driver => renderMarketCompactDriver(driver, state)).join('') : `<div class="market-snapshot-empty">${escapeHTML(emptyText)}</div>`}
                </div>
            </div>
        `;
    }

    function renderMarketCompactDriver(driver, state) {
        return `
            <button class="market-compact-driver ${state.selectedDriverId === driver.id ? 'active' : ''}" data-market-select="${driver.id}">
                <span class="market-compact-flag">${escapeHTML(driver.flag || '🏁')}</span>
                <span class="market-compact-copy">
                    <b>${escapeHTML(driver.name)}</b>
                    <small>${driver.rating || '—'} OVR • ${driver.visiblePotential ?? '—'} POT • ${escapeHTML(driver.currentTeamShortName || driver.currentTeamName)}</small>
                </span>
            </button>
        `;
    }

    function renderDriverMarketCard(driver, state) {
        const traitPreview = (driver.traitNames || []).slice(0, 2);
        const compareActive = state.compareIds.includes(driver.id);
        const statusLabel = driver.isPlayerTeamDriver ? 'YOUR TEAM' : (driver.freeAgent ? 'FREE AGENT' : 'GRID DRIVER');
        const teamStyle = driver.currentTeamColor ? `style="--driver-team-color:${driver.currentTeamColor};"` : '';
        return `
            <article class="market-driver-card ${state.selectedDriverId === driver.id ? 'selected' : ''} ${driver.shortlist ? 'shortlisted' : ''} ${compareActive ? 'compare-active' : ''}" data-market-card="${driver.id}" ${teamStyle}>
                <div class="market-driver-topline">
                    <div class="market-driver-identity">
                        <span class="market-driver-flag">${escapeHTML(driver.flag || '🏁')}</span>
                        <div>
                            <div class="market-driver-name">${escapeHTML(driver.name)}</div>
                            <div class="market-driver-meta">${escapeHTML(driver.nationality || 'Global')} • Age ${driver.age || '—'} • ${escapeHTML(driver.currentTeamName)}</div>
                        </div>
                    </div>
                    <div class="market-driver-ovr"><span>OVR</span><b>${driver.rating || '—'}</b></div>
                </div>
                <div class="market-driver-info-grid">
                    <div><span>Potential</span><b>${driver.visiblePotential ?? '—'}</b></div>
                    <div><span>Current Team</span><b>${escapeHTML(driver.currentTeamShortName || driver.currentTeamName)}</b></div>
                    <div><span>Status</span><b>${escapeHTML(statusLabel)}</b></div>
                    <div><span>Points</span><b>${driver.careerStats?.points || 0}</b></div>
                </div>
                <div class="market-driver-traits">
                    ${(traitPreview.length ? traitPreview : ['No published traits']).map(trait => `<span>${escapeHTML(trait)}</span>`).join('')}
                </div>
                <div class="market-driver-actions-row">
                    <button class="btn market-card-action ${driver.shortlist ? 'btn-primary' : ''}" data-market-shortlist="${driver.id}">${driver.shortlist ? 'Remove Shortlist' : 'Add Shortlist'}</button>
                    <button class="btn ${compareActive ? 'btn-primary' : ''}" data-market-compare="${driver.id}">${compareActive ? 'Comparing' : 'Compare'}</button>
                </div>
            </article>
        `;
    }

    function renderDriverMarketDetailPanel(driver, state, career) {
        if (!driver) {
            return `
                <div class="market-detail-empty">
                    <div class="market-empty-icon">🏎️</div>
                    <div class="market-empty-title">Select a Driver</div>
                    <div class="market-empty-copy">Choose a driver card to review the detailed scouting panel.</div>
                </div>
            `;
        }

        const strengths = getDriverStrengths(driver);
        const weaknesses = getDriverWeaknesses(driver);
        const careerStats = driver.careerStats || {};
        const rosterFull = (career.drivers?.length || 0) >= 2;
        const canSignFreeAgent = driver.freeAgent && !driver.isPlayerTeamDriver && !rosterFull && (driver.cost || 0) <= (career.budget || 0);
        const detailAction = driver.isPlayerTeamDriver
            ? `<button class="btn btn-danger" data-market-release="${driver.id}">Release Driver</button>`
            : driver.freeAgent
                ? `<button class="btn btn-glow" data-market-hire="${driver.id}" ${canSignFreeAgent ? '' : 'disabled'}>${rosterFull ? 'Roster Full' : ((driver.cost || 0) > (career.budget || 0) ? 'Budget Too Low' : 'Sign Driver')}</button>`
                : `<button class="btn" disabled>Scouting Only</button>`;

        return `
            <div class="market-detail-shell">
                <div class="market-detail-hero">
                    <div class="market-detail-title-block">
                        <div class="market-detail-flag">${escapeHTML(driver.flag || '🏁')}</div>
                        <div>
                            <div class="market-detail-name">${escapeHTML(driver.name)}</div>
                            <div class="market-detail-subtitle">${escapeHTML(driver.nationality || 'Global')} • ${escapeHTML(driver.currentTeamName)} • ${driver.freeAgent ? 'Free Agent Pool' : 'Active Grid Driver'}</div>
                        </div>
                    </div>
                    <div class="market-detail-rating-pill">
                        <span>OVR</span>
                        <b>${driver.rating || '—'}</b>
                    </div>
                </div>

                <div class="market-detail-summary-grid">
                    <div><span>Nationality</span><b>${escapeHTML(driver.nationality || 'Global')}</b></div>
                    <div><span>Age</span><b>${driver.age || '—'}</b></div>
                    <div><span>Overall</span><b>${driver.rating || '—'}</b></div>
                    <div><span>Potential</span><b>${driver.visiblePotential ?? '—'}</b></div>
                    <div><span>Current Team</span><b>${escapeHTML(driver.currentTeamName)}</b></div>
                    <div><span>Free Agent</span><b>${driver.freeAgent ? 'Yes' : 'No'}</b></div>
                </div>

                <div class="market-detail-columns">
                    <div class="market-detail-panel">
                        <div class="market-detail-panel-title">Traits</div>
                        <div class="market-detail-trait-stack">
                            ${(driver.traitNames || []).length ? driver.traitNames.map(trait => `<span>${escapeHTML(trait)}</span>`).join('') : '<span>No trait data published</span>'}
                        </div>
                        <div class="market-detail-subsection">
                            <div class="market-detail-panel-title">Strengths</div>
                            <div class="market-detail-trait-stack market-strength-stack">
                                ${strengths.map(item => `<span>${escapeHTML(item.label)} ${item.value}</span>`).join('')}
                            </div>
                        </div>
                        <div class="market-detail-subsection">
                            <div class="market-detail-panel-title">Weaknesses</div>
                            <div class="market-detail-trait-stack market-weakness-stack">
                                ${weaknesses.map(item => `<span>${escapeHTML(item.label)} ${item.value}</span>`).join('')}
                            </div>
                        </div>
                        <div class="market-detail-subsection">
                            <div class="market-detail-panel-title">Driver Profile</div>
                            <p class="market-detail-bio">${escapeHTML(driver.bio || 'No scouting report published yet.')}</p>
                        </div>
                    </div>
                    <div class="market-detail-panel market-detail-panel-dual">
                        <div class="market-detail-subsection">
                            <div class="market-detail-panel-title">Performance Snapshot</div>
                            <div class="market-detail-stats-grid">
                                ${renderDriverDetailStat('Pace', driver.stats?.pace)}
                                ${renderDriverDetailStat('Consistency', driver.stats?.consistency)}
                                ${renderDriverDetailStat('Tire Mgmt', driver.stats?.tireManagement)}
                                ${renderDriverDetailStat('Wet Skill', driver.stats?.wetSkill)}
                                ${renderDriverDetailStat('Racecraft', driver.stats?.racecraft)}
                                ${renderDriverDetailStat('Experience', driver.stats?.experience)}
                            </div>
                        </div>
                        <div class="market-detail-subsection">
                            <div class="market-detail-panel-title">Career Statistics</div>
                            <div class="market-career-grid">
                                ${renderDriverCareerStat('Starts', careerStats.starts || 0)}
                                ${renderDriverCareerStat('Points', careerStats.points || 0)}
                                ${renderDriverCareerStat('Wins', careerStats.wins || 0)}
                                ${renderDriverCareerStat('Podiums', careerStats.podiums || 0)}
                                ${renderDriverCareerStat('Best Finish', formatCareerStat(careerStats.bestFinish, 'P'))}
                                ${renderDriverCareerStat('Shortlist', driver.shortlist ? 'Tracked' : 'Open')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="market-detail-actions">
                    <button class="btn ${driver.shortlist ? 'btn-primary' : ''}" data-market-shortlist="${driver.id}">${driver.shortlist ? 'Remove from Shortlist' : 'Add to Shortlist'}</button>
                    <button class="btn ${state.compareIds.includes(driver.id) ? 'btn-primary' : ''}" data-market-compare="${driver.id}">${state.compareIds.includes(driver.id) ? 'Remove from Compare' : 'Add to Compare'}</button>
                    ${detailAction}
                </div>
            </div>
        `;
    }

    function renderDriverCareerStat(label, value) {
        return `
            <div class="market-career-stat">
                <span>${escapeHTML(label)}</span>
                <b>${escapeHTML(String(value ?? '—'))}</b>
            </div>
        `;
    }

    function renderDriverDetailStat(label, value) {
        const safeValue = Number.isFinite(value) ? value : 0;
        return `
            <div class="market-detail-stat">
                <div class="market-detail-stat-head"><span>${escapeHTML(label)}</span><b>${safeValue}</b></div>
                <div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.max(0, Math.min(100, safeValue))}%"></div></div>
            </div>
        `;
    }

    function attachDriverMarketInteractions(career, state, rerenderMarket, market) {
        const bindValue = (id, key) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.addEventListener(id === 'market-search' ? 'input' : 'change', () => {
                state[key] = element.value;
                state.focusField = id === 'market-search' ? 'market-search' : null;
                rerenderMarket();
            });
        };

        bindValue('market-search', 'search');
        bindValue('market-filter-age', 'age');
        bindValue('market-filter-rating', 'rating');
        bindValue('market-filter-potential', 'potential');
        bindValue('market-filter-nationality', 'nationality');
        bindValue('market-filter-team', 'team');
        bindValue('market-filter-status', 'freeAgent');
        bindValue('market-filter-trait', 'trait');
        bindValue('market-sort', 'sort');

        document.querySelectorAll('[data-market-view]').forEach(button => {
            button.addEventListener('click', () => {
                state.view = button.dataset.marketView;
                rerenderMarket();
            });
        });

        document.querySelectorAll('[data-market-card], [data-market-select]').forEach(element => {
            element.addEventListener('click', (event) => {
                if (event.target.closest('[data-market-shortlist], [data-market-compare], [data-market-hire], [data-market-release]')) return;
                const targetId = element.dataset.marketCard || element.dataset.marketSelect;
                if (!targetId) return;
                state.selectedDriverId = targetId;
                rerenderMarket();
            });
        });

        document.querySelectorAll('[data-market-shortlist]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleDriverShortlist(career, button.dataset.marketShortlist);
                rerenderMarket();
            });
        });

        document.querySelectorAll('[data-market-compare]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const driverId = button.dataset.marketCompare;
                if (state.compareIds.includes(driverId)) {
                    state.compareIds = state.compareIds.filter(id => id !== driverId);
                } else {
                    if (state.compareIds.length >= 3) {
                        Notifications.info('Comparison Limit', 'You can compare up to 3 drivers at once.');
                        return;
                    }
                    state.compareIds = [...state.compareIds, driverId];
                }
                rerenderMarket();
            });
        });

        document.querySelector('[data-market-clear-compare]')?.addEventListener('click', () => {
            state.compareIds = [];
            rerenderMarket();
        });

        document.querySelectorAll('[data-market-hire]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                hireDriver(button.dataset.marketHire);
            });
        });

        document.querySelectorAll('[data-market-release]').forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                const index = career.drivers.findIndex(driver => driver.id === button.dataset.marketRelease);
                if (index >= 0) releaseDriver(index);
            });
        });
    }

    function toggleDriverShortlist(career, driverId) {
        if (!driverId) return;
        const shortlist = new Set(Array.isArray(career.driverMarketShortlist) ? career.driverMarketShortlist : []);
        if (shortlist.has(driverId)) shortlist.delete(driverId);
        else shortlist.add(driverId);
        career.driverMarketShortlist = [...shortlist];
        StateManager.set('career', career);
        StateManager.saveGame?.();
        Notifications.info('Shortlist Updated', shortlist.has(driverId) ? 'Driver added to shortlist.' : 'Driver removed from shortlist.');
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
            confirmText: 'Sign Driver',
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

                Notifications.success(`Signed ${driver.name}!`, `Driver added to ${career.team.name}.`);
                Modals.close();
                setTimeout(() => showDriverMarketModal(), 300);
            }
        });
    }


    function injectStyles() {
        if (document.getElementById('driver-market-styles')) return;
        const style = document.createElement('style');
        style.id = 'driver-market-styles';
        style.textContent = `
            #modal-box.modal-xl.modal-market {
                width: min(96vw, 1200px);
                max-width: 1200px;
            }
            .transfer-market-layout {
                display: flex;
                flex-direction: column;
                gap: 16px;
                font-family: 'Rajdhani', sans-serif;
            }
            .transfer-market-section {
                background: linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02));
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 16%, var(--border-subtle));
                border-radius: 14px;
                padding: 16px;
            }
            .market-section-title-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 14px;
                flex-wrap: wrap;
            }
            .market-panel-title {
                font-family: Orbitron;
                font-size: 18px;
                letter-spacing: 1px;
                color: var(--white);
                margin-top: 4px;
            }
            .market-results-label {
                font-family: Orbitron;
                font-size: 10px;
                color: var(--gray-400);
                letter-spacing: 1px;
                text-transform: uppercase;
                align-self: center;
            }
            .market-overview-grid {
                display: grid;
                grid-template-columns: repeat(4, minmax(88px, 1fr));
                gap: 8px;
                width: min(100%, 480px);
            }
            .market-overview-tile {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 10px;
                padding: 10px;
                min-height: 62px;
            }
            .market-overview-tile span {
                display: block;
                font-family: Orbitron;
                font-size: 9px;
                color: var(--gray-500);
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .market-overview-tile b {
                display: block;
                margin-top: 6px;
                font-family: Orbitron;
                font-size: 22px;
                color: var(--team-primary, var(--green));
            }
            .market-toolbar-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
            }
            .market-control {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .market-control span {
                font-family: Orbitron;
                font-size: 9px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--gray-500);
            }
            .market-search-wide {
                grid-column: span 2;
            }
            .market-view-tabs {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 12px;
            }
            .market-view-tab {
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                border-radius: 999px;
                color: var(--gray-300);
                padding: 8px 12px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                font-family: Orbitron;
                font-size: 10px;
                letter-spacing: 1px;
                transition: 0.2s ease;
            }
            .market-view-tab b {
                color: var(--team-primary, var(--green));
                font-size: 11px;
            }
            .market-view-tab.active,
            .market-view-tab:hover {
                border-color: var(--team-primary, var(--green));
                color: var(--white);
                box-shadow: 0 0 16px color-mix(in srgb, var(--team-primary, #00FF41) 14%, transparent);
                background: color-mix(in srgb, var(--team-primary, #00FF41) 10%, transparent);
            }
            .market-compare-shell {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 14px;
                border-radius: 12px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.08);
                margin-bottom: 14px;
            }
            .market-compare-toolbar {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;
            }
            .market-compare-subtitle {
                color: var(--gray-400);
                font-size: 13px;
                margin-top: 4px;
            }
            .market-compare-toolbar-actions {
                display: flex;
                gap: 10px;
                align-items: center;
                font-family: Orbitron;
                font-size: 10px;
                color: var(--gray-400);
            }
            .market-compare-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
            }
            .market-compare-card {
                background: linear-gradient(135deg, rgba(20,20,28,0.92), rgba(8,8,12,0.96));
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 12px;
                min-height: 182px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .market-compare-card.placeholder {
                justify-content: center;
                align-items: center;
                text-align: center;
                color: var(--gray-500);
            }
            .market-compare-head {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .market-compare-flag {
                font-size: 26px;
            }
            .market-compare-name {
                font-family: Orbitron;
                color: var(--white);
                font-size: 14px;
            }
            .market-compare-team {
                font-size: 12px;
                color: var(--gray-500);
            }
            .market-compare-metrics {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
            }
            .market-compare-metrics div,
            .market-driver-info-grid div,
            .market-detail-summary-grid div {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 8px;
                padding: 8px 9px;
            }
            .market-compare-metrics span,
            .market-driver-info-grid span,
            .market-detail-summary-grid span,
            .market-detail-stat-head span {
                display: block;
                font-family: Orbitron;
                font-size: 8px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--gray-500);
                margin-bottom: 4px;
            }
            .market-compare-metrics b,
            .market-driver-info-grid b,
            .market-detail-summary-grid b {
                color: var(--white);
                font-size: 13px;
                line-height: 1.15;
                overflow-wrap: anywhere;
            }
            .market-compare-traits {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
                margin-top: auto;
            }
            .market-compare-traits span {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 10px;
                color: var(--gray-300);
            }
            .market-compare-placeholder {
                font-family: Orbitron;
                font-size: 14px;
                color: var(--white);
                margin-bottom: 4px;
            }
            .market-compare-placeholder-copy {
                font-size: 12px;
                line-height: 1.35;
            }
            .market-snapshot-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
                margin-bottom: 14px;
            }
            .market-snapshot-card {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 12px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .market-snapshot-head {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                align-items: flex-start;
            }
            .market-snapshot-head b {
                font-family: Orbitron;
                font-size: 18px;
                color: var(--team-primary, var(--green));
            }
            .market-snapshot-title {
                font-family: Orbitron;
                color: var(--white);
                font-size: 12px;
            }
            .market-snapshot-subtitle,
            .market-snapshot-empty,
            .market-empty-copy,
            .market-detail-bio {
                color: var(--gray-400);
                font-size: 12px;
                line-height: 1.4;
            }
            .market-snapshot-list {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .market-compact-driver {
                width: 100%;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.04);
                border-radius: 10px;
                padding: 8px 10px;
                display: flex;
                gap: 10px;
                align-items: center;
                cursor: pointer;
                color: var(--white);
                transition: 0.2s ease;
                text-align: left;
            }
            .market-compact-driver.active,
            .market-compact-driver:hover {
                border-color: var(--team-primary, var(--green));
                background: color-mix(in srgb, var(--team-primary, #00FF41) 8%, transparent);
            }
            .market-compact-copy {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .market-compact-copy b {
                font-family: Orbitron;
                font-size: 12px;
                color: var(--white);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .market-compact-copy small {
                color: var(--gray-500);
                font-size: 11px;
            }
            .market-driver-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 12px;
            }
            .market-driver-card {
                --driver-team-color: var(--team-primary, #00FF41);
                background: linear-gradient(135deg, rgba(20,20,28,0.9), rgba(8,8,12,0.96));
                border: 1px solid rgba(255,255,255,0.08);
                border-left: 3px solid color-mix(in srgb, var(--driver-team-color) 78%, white 10%);
                border-radius: 12px;
                padding: 12px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                cursor: pointer;
                min-height: 236px;
                transition: 0.2s ease;
            }
            .market-driver-card:hover,
            .market-driver-card.selected {
                transform: translateY(-2px);
                border-color: color-mix(in srgb, var(--driver-team-color) 45%, rgba(255,255,255,0.12));
                box-shadow: 0 10px 24px color-mix(in srgb, var(--driver-team-color) 12%, transparent);
            }
            .market-driver-card.shortlisted {
                box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--team-accent, #FFFFFF) 24%, transparent);
            }
            .market-driver-card.compare-active {
                background: linear-gradient(135deg, color-mix(in srgb, var(--team-primary, #00FF41) 12%, rgba(20,20,28,0.92)), rgba(8,8,12,0.97));
            }
            .market-driver-topline {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                align-items: flex-start;
            }
            .market-driver-identity {
                display: flex;
                gap: 10px;
                min-width: 0;
                align-items: center;
            }
            .market-driver-flag,
            .market-detail-flag {
                font-size: 28px;
                flex-shrink: 0;
            }
            .market-driver-name,
            .market-detail-name {
                font-family: Orbitron;
                font-size: 15px;
                color: var(--white);
                line-height: 1.15;
            }
            .market-driver-meta,
            .market-detail-subtitle {
                color: var(--gray-400);
                font-size: 12px;
                margin-top: 3px;
                line-height: 1.35;
            }
            .market-driver-ovr,
            .market-detail-rating-pill {
                min-width: 64px;
                text-align: center;
                border-radius: 10px;
                border: 1px solid color-mix(in srgb, var(--team-primary, #00FF41) 35%, transparent);
                background: color-mix(in srgb, var(--team-primary, #00FF41) 9%, transparent);
                padding: 7px 8px;
            }
            .market-driver-ovr span,
            .market-detail-rating-pill span {
                display: block;
                font-family: Orbitron;
                font-size: 8px;
                letter-spacing: 1px;
                color: var(--gray-500);
                text-transform: uppercase;
            }
            .market-driver-ovr b,
            .market-detail-rating-pill b {
                display: block;
                margin-top: 3px;
                font-family: Orbitron;
                font-size: 20px;
                color: var(--team-primary, var(--green));
            }
            .market-driver-info-grid,
            .market-detail-summary-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
            }
            .market-driver-traits,
            .market-detail-trait-stack {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .market-driver-traits span,
            .market-detail-trait-stack span {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 10px;
                color: var(--gray-300);
            }
            .market-strength-stack span {
                border-color: rgba(0,255,65,0.2);
                color: #c8ffd7;
            }
            .market-weakness-stack span {
                border-color: rgba(255,215,0,0.2);
                color: #ffe7a3;
            }
            .market-driver-actions-row,
            .market-detail-actions {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: auto;
            }
            .market-card-action,
            .market-driver-actions-row .btn,
            .market-detail-actions .btn {
                padding: 9px 12px;
                font-size: 10px;
                letter-spacing: 1px;
            }
            .market-empty-state,
            .market-detail-empty {
                grid-column: 1 / -1;
                border: 1px dashed rgba(255,255,255,0.14);
                border-radius: 12px;
                background: rgba(255,255,255,0.025);
                padding: 26px 18px;
                text-align: center;
            }
            .market-empty-icon {
                font-size: 28px;
                margin-bottom: 8px;
            }
            .market-empty-title {
                font-family: Orbitron;
                font-size: 16px;
                color: var(--white);
                margin-bottom: 6px;
            }
            .market-detail-shell {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .market-detail-hero {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: center;
                flex-wrap: wrap;
            }
            .market-detail-title-block {
                display: flex;
                gap: 12px;
                align-items: center;
                min-width: 0;
            }
            .market-detail-columns {
                display: grid;
                grid-template-columns: minmax(220px, 0.95fr) minmax(280px, 1.05fr);
                gap: 12px;
            }
            .market-detail-panel {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 12px;
                padding: 12px;
            }
            .market-detail-panel-dual {
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .market-detail-subsection {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .market-detail-panel-title {
                font-family: Orbitron;
                font-size: 11px;
                color: var(--team-primary, var(--green));
                margin-bottom: 10px;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .market-detail-stats-grid {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 10px;
            }
            .market-career-grid {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 10px;
            }
            .market-career-stat {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 8px;
                padding: 9px 10px;
            }
            .market-career-stat span {
                display: block;
                font-family: Orbitron;
                font-size: 8px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--gray-500);
                margin-bottom: 4px;
            }
            .market-career-stat b {
                color: var(--white);
                font-family: Orbitron;
                font-size: 13px;
                line-height: 1.15;
            }
            .market-detail-stat {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .market-detail-stat-head {
                display: flex;
                justify-content: space-between;
                gap: 8px;
                align-items: baseline;
            }
            .market-detail-stat-head b {
                color: var(--white);
                font-family: Orbitron;
                font-size: 12px;
            }
            @media (max-width: 1100px) {
                .market-toolbar-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                .market-driver-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .market-search-wide {
                    grid-column: span 3;
                }
                .market-overview-grid,
                .market-snapshot-grid,
                .market-compare-grid,
                .market-detail-columns,
                .market-career-grid {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
            }
            @media (max-width: 780px) {
                .market-toolbar-grid,
                .market-overview-grid,
                .market-snapshot-grid,
                .market-driver-grid,
                .market-compare-grid,
                .market-detail-columns,
                .market-detail-stats-grid,
                .market-career-grid {
                    grid-template-columns: 1fr;
                }
                .market-search-wide {
                    grid-column: span 1;
                }
                .market-driver-info-grid,
                .market-detail-summary-grid {
                    grid-template-columns: 1fr 1fr;
                }
            }
            @media (max-width: 560px) {
                .transfer-market-section {
                    padding: 12px;
                }
                .market-driver-actions-row,
                .market-detail-actions,
                .market-view-tabs {
                    flex-direction: column;
                    align-items: stretch;
                }
                .market-driver-info-grid,
                .market-detail-summary-grid {
                    grid-template-columns: 1fr;
                }
            }

        `;
        document.head.appendChild(style);
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

    const originalOpen = showDriverMarketModal;
    function open() {
        injectStyles();
        return originalOpen();
    }

    return { open };
})();
