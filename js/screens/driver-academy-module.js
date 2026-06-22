/* ============================================
   VELOCITY — DRIVER ACADEMY MODULE
   Academy UI extracted from dashboard ownership
   ============================================ */

window.DriverAcademyModule = (() => {
    function getAcademyDriverPool(academy) {
        const pool = [];
        const seen = new Set();
        const pushDriver = (driver, fallbackStatus = 'ACADEMY') => {
            if (!driver?.id || seen.has(driver.id)) return;
            seen.add(driver.id);
            pool.push({
                ...driver,
                academyStatus: driver.academyStatus || fallbackStatus
            });
        };
        pushDriver(academy?.reserveDriver, 'RESERVE');
        (academy?.drivers || []).forEach(driver => pushDriver(driver, 'ACADEMY'));
        return pool;
    }

    function getAcademyTraitLabels(driver) {
        const academyTraitMap = {
            WONDERKID: 'Future Star',
            WET_TALENT: 'Wet Weather Talent',
            QUALIFYING_TALENT: 'Qualifying Expert',
            AGGRESSIVE_RACER: 'Aggressive Racer',
            CONSISTENCY_EXPERT: 'Consistency Master',
            LATE_DEVELOPER: 'Late Developer',
            SIMULATOR_STAR: 'Simulator Star'
        };
        const academyTraits = (driver?.academyTraits || []).map(key => academyTraitMap[key] || key.replace(/_/g, ' '));
        if (academyTraits.length) return academyTraits;
        return getDriverTraitNames(driver).map(name => name.replace(/^\S+\s/, ''));
    }

    function getAcademyTrendMeta(driver) {
        const rate = Number(driver?.developmentRate || 1);
        const potential = Number(driver?.potentialRating || driver?.potential || driver?.rating || 0);
        const academyTraits = driver?.academyTraits || [];
        const label = rate >= 1.35 ? 'Rapid Growth' : rate >= 1 ? 'Normal Growth' : 'Slow Growth';
        const type = rate >= 1.35 ? 'rapid' : rate >= 1 ? 'normal' : 'slow';
        const score = Math.max(26, Math.min(100, Math.round(rate * 58)));
        const badges = [];
        if (potential >= 90) badges.push({ label: 'Elite Prospect', type: 'elite' });
        if (academyTraits.includes('LATE_DEVELOPER')) badges.push({ label: 'Late Developer', type: 'late' });
        if (academyTraits.includes('WONDERKID')) badges.push({ label: 'Future Star', type: 'future' });
        return { label, type, score, badges };
    }

    function getAcademyOverviewStats(academyDrivers, academy) {
        const featured = [...academyDrivers].sort((a, b) => {
            const potentialGap = (b.potentialRating || b.rating || 0) - (a.potentialRating || a.rating || 0);
            if (potentialGap !== 0) return potentialGap;
            return (a.age || 99) - (b.age || 99);
        })[0] || null;
        return {
            rating: Math.round(academy?.facilities || 0),
            totalProspects: academyDrivers.length,
            averagePotential: academyDrivers.length ? Math.round(academyDrivers.reduce((sum, driver) => sum + (driver.potentialRating || driver.rating || 0), 0) / academyDrivers.length) : 0,
            highestPotentialProspect: featured,
            averageAge: academyDrivers.length ? Number((academyDrivers.reduce((sum, driver) => sum + (driver.age || 0), 0) / academyDrivers.length).toFixed(1)) : 0
        };
    }

    function filterAcademyDrivers(drivers, state) {
        let filtered = [...drivers];
        if (state.age === 'u17') filtered = filtered.filter(driver => (driver.age || 99) <= 17);
        if (state.age === '18-19') filtered = filtered.filter(driver => (driver.age || 0) >= 18 && (driver.age || 0) <= 19);
        if (state.age === '20-21') filtered = filtered.filter(driver => (driver.age || 0) >= 20 && (driver.age || 0) <= 21);
        if (state.age === '22plus') filtered = filtered.filter(driver => (driver.age || 0) >= 22);

        if (state.ovr === '70plus') filtered = filtered.filter(driver => (driver.rating || 0) >= 70);
        if (state.ovr === '65-69') filtered = filtered.filter(driver => (driver.rating || 0) >= 65 && (driver.rating || 0) <= 69);
        if (state.ovr === '60-64') filtered = filtered.filter(driver => (driver.rating || 0) >= 60 && (driver.rating || 0) <= 64);
        if (state.ovr === 'under60') filtered = filtered.filter(driver => (driver.rating || 0) < 60);

        if (state.potential === '90plus') filtered = filtered.filter(driver => (driver.potentialRating || driver.rating || 0) >= 90);
        if (state.potential === '85-89') filtered = filtered.filter(driver => (driver.potentialRating || driver.rating || 0) >= 85 && (driver.potentialRating || driver.rating || 0) <= 89);
        if (state.potential === '80-84') filtered = filtered.filter(driver => (driver.potentialRating || driver.rating || 0) >= 80 && (driver.potentialRating || driver.rating || 0) <= 84);
        if (state.potential === 'under80') filtered = filtered.filter(driver => (driver.potentialRating || driver.rating || 0) < 80);

        if (state.nationality !== 'all') filtered = filtered.filter(driver => driver.nationality === state.nationality);
        if (state.trend !== 'all') {
            filtered = filtered.filter(driver => {
                const trend = getAcademyTrendMeta(driver);
                if (state.trend === 'rapid') return trend.type === 'rapid';
                if (state.trend === 'normal') return trend.type === 'normal';
                if (state.trend === 'slow') return trend.type === 'slow';
                if (state.trend === 'elite') return trend.badges.some(badge => badge.type === 'elite');
                if (state.trend === 'late') return trend.badges.some(badge => badge.type === 'late');
                return true;
            });
        }

        filtered.sort((a, b) => {
            if (state.sort === 'potential-asc') return (a.potentialRating || a.rating || 0) - (b.potentialRating || b.rating || 0) || (a.age || 99) - (b.age || 99);
            if (state.sort === 'youngest') return (a.age || 99) - (b.age || 99) || (b.potentialRating || b.rating || 0) - (a.potentialRating || a.rating || 0);
            if (state.sort === 'oldest') return (b.age || 0) - (a.age || 0) || (b.potentialRating || b.rating || 0) - (a.potentialRating || a.rating || 0);
            if (state.sort === 'ovr-desc') return (b.rating || 0) - (a.rating || 0) || (b.potentialRating || 0) - (a.potentialRating || 0);
            if (state.sort === 'alphabetical') return (a.lastName || a.name || '').localeCompare(b.lastName || b.name || '') || (b.potentialRating || 0) - (a.potentialRating || 0);
            return (b.potentialRating || b.rating || 0) - (a.potentialRating || a.rating || 0) || (a.age || 99) - (b.age || 99);
        });
        return filtered;
    }

    function renderAcademyOverviewSection(overview) {
        return `
            <section class="academy-section academy-overview-section">
                <div class="academy-section-header">
                    <div>
                        <div class="market-kicker">ACADEMY OVERVIEW</div>
                        <h3 class="academy-section-title">Talent Pipeline Summary</h3>
                    </div>
                </div>
                <div class="academy-overview-grid">
                    <div class="academy-overview-card"><span>Academy Rating</span><b>${overview.rating}</b></div>
                    <div class="academy-overview-card"><span>Total Prospects</span><b>${overview.totalProspects}</b></div>
                    <div class="academy-overview-card"><span>Average Potential</span><b>${overview.averagePotential}</b></div>
                    <div class="academy-overview-card"><span>Highest Potential Prospect</span><b>${escapeHTML(overview.highestPotentialProspect?.name || '—')}</b></div>
                    <div class="academy-overview-card"><span>Average Age</span><b>${overview.averageAge || '—'}</b></div>
                </div>
            </section>
        `;
    }

    function renderFeaturedAcademyProspect(driver) {
        if (!driver) {
            return `
                <section class="academy-section academy-feature-section">
                    <div class="academy-section-header">
                        <div>
                            <div class="market-kicker">FEATURED PROSPECT</div>
                            <h3 class="academy-section-title">Headliner Prospect</h3>
                        </div>
                    </div>
                    <div class="academy-empty-state">No academy prospects available.</div>
                </section>
            `;
        }
        const trend = getAcademyTrendMeta(driver);
        const traits = getAcademyTraitLabels(driver);
        return `
            <section class="academy-section academy-feature-section">
                <div class="academy-section-header">
                    <div>
                        <div class="market-kicker">FEATURED PROSPECT</div>
                        <h3 class="academy-section-title">Headliner Prospect</h3>
                    </div>
                    <div class="academy-feature-status">${escapeHTML(driver.academyStatus || 'ACADEMY')}</div>
                </div>
                <div class="academy-feature-card">
                    <div class="academy-feature-avatar">${escapeHTML(driver.flag || '🏁')}</div>
                    <div class="academy-feature-main">
                        <h2>${escapeHTML(driver.name)}</h2>
                        <div class="academy-feature-meta">${escapeHTML(driver.nationality || 'Global')} • Age ${driver.age || '—'} • OVR ${driver.rating || '—'} • Potential ${driver.potentialRating || driver.rating || '—'}</div>
                        <div class="academy-feature-traits">
                            ${traits.length ? traits.map(trait => `<span>${escapeHTML(trait)}</span>`).join('') : '<span>No published academy traits</span>'}
                        </div>
                    </div>
                    <div class="academy-feature-side">
                        <div class="academy-feature-trend-card ${trend.type}">
                            <span>Development Trend</span>
                            <b>${escapeHTML(trend.label)}</b>
                            <div class="academy-trend-meter"><div class="academy-trend-fill ${trend.type}" style="width:${trend.score}%"></div></div>
                        </div>
                        <div class="academy-feature-badges">
                            ${trend.badges.length ? trend.badges.map(badge => `<span class="academy-trend-badge ${badge.type}">${escapeHTML(badge.label)}</span>`).join('') : '<span class="academy-trend-badge neutral">Development Watch</span>'}
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderAcademyDriverWorkspace(filteredDrivers, selectedDriver, state, academyDrivers, academy) {
        return `
            <section class="academy-section academy-drivers-section">
                <div class="academy-section-header">
                    <div>
                        <div class="market-kicker">ACADEMY DRIVERS</div>
                        <h3 class="academy-section-title">Prospect Watchlist</h3>
                    </div>
                    <div class="academy-results-label">${filteredDrivers.length} prospects match current filters</div>
                </div>
                <div class="academy-filter-grid">
                    <label class="academy-control">
                        <span>Age</span>
                        <select class="select" id="academy-filter-age">
                            ${renderSelectOptions([
                                ['all', 'All Ages'],
                                ['u17', '17 & Under'],
                                ['18-19', '18-19'],
                                ['20-21', '20-21'],
                                ['22plus', '22+']
                            ], state.age)}
                        </select>
                    </label>
                    <label class="academy-control">
                        <span>OVR</span>
                        <select class="select" id="academy-filter-ovr">
                            ${renderSelectOptions([
                                ['all', 'All OVR'],
                                ['70plus', '70+'],
                                ['65-69', '65-69'],
                                ['60-64', '60-64'],
                                ['under60', 'Under 60']
                            ], state.ovr)}
                        </select>
                    </label>
                    <label class="academy-control">
                        <span>Potential</span>
                        <select class="select" id="academy-filter-potential">
                            ${renderSelectOptions([
                                ['all', 'All Potential'],
                                ['90plus', '90+'],
                                ['85-89', '85-89'],
                                ['80-84', '80-84'],
                                ['under80', 'Under 80']
                            ], state.potential)}
                        </select>
                    </label>
                    <label class="academy-control">
                        <span>Nationality</span>
                        <select class="select" id="academy-filter-nationality">
                            ${renderSelectOptions([['all', 'All Nationalities'], ...[...new Set(academyDrivers.map(driver => driver.nationality).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map(name => [name, name])], state.nationality)}
                        </select>
                    </label>
                    <label class="academy-control">
                        <span>Development Trend</span>
                        <select class="select" id="academy-filter-trend">
                            ${renderSelectOptions([
                                ['all', 'All Trends'],
                                ['rapid', 'Rapid Growth'],
                                ['normal', 'Normal Growth'],
                                ['slow', 'Slow Growth'],
                                ['elite', 'Elite Prospect'],
                                ['late', 'Late Developer']
                            ], state.trend)}
                        </select>
                    </label>
                    <label class="academy-control">
                        <span>Sort By</span>
                        <select class="select" id="academy-sort">
                            ${renderSelectOptions([
                                ['potential-desc', 'Highest Potential'],
                                ['potential-asc', 'Lowest Potential'],
                                ['youngest', 'Youngest'],
                                ['oldest', 'Oldest'],
                                ['ovr-desc', 'Highest OVR'],
                                ['alphabetical', 'Alphabetical']
                            ], state.sort)}
                        </select>
                    </label>
                </div>
                <div class="academy-driver-workspace">
                    <div class="academy-table-panel">
                        <div class="academy-table-wrap">
                            <table class="academy-table academy-prospect-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Age</th>
                                        <th>OVR</th>
                                        <th>Potential</th>
                                        <th>Development Trend</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${filteredDrivers.length ? filteredDrivers.map(driver => renderAcademyTableRow(driver, state.selectedDriverId)).join('') : `<tr><td colspan="6"><div class="academy-empty-row">No prospects match current filters.</div></td></tr>`}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="academy-profile-panel">
                        ${renderAcademyProfilePanel(selectedDriver, academy)}
                    </div>
                </div>
            </section>
        `;
    }

    function renderAcademyTableRow(driver, selectedDriverId) {
        const trend = getAcademyTrendMeta(driver);
        return `
            <tr class="academy-driver-row ${selectedDriverId === driver.id ? 'selected' : ''}" data-academy-select="${driver.id}">
                <td>
                    <div class="academy-name-cell">
                        <span class="academy-row-flag">${escapeHTML(driver.flag || '🏁')}</span>
                        <div>
                            <b>${escapeHTML(driver.name)}</b>
                            <small>${escapeHTML(driver.nationality || 'Global')}</small>
                        </div>
                    </div>
                </td>
                <td>${driver.age || '—'}</td>
                <td>${driver.rating || '—'}</td>
                <td>${driver.potentialRating || driver.rating || '—'}</td>
                <td><span class="academy-trend-pill ${trend.type}">${escapeHTML(trend.label)}</span></td>
                <td>${escapeHTML(driver.academyStatus || 'ACADEMY')}</td>
            </tr>
        `;
    }

    function renderAcademyProfilePanel(driver, academy) {
        if (!driver) {
            return `<div class="academy-empty-state">Select a prospect to inspect their academy profile.</div>`;
        }
        const trend = getAcademyTrendMeta(driver);
        const strengths = getDriverStrengths(driver);
        const weaknesses = getDriverWeaknesses(driver);
        const traits = getAcademyTraitLabels(driver);
        return `
            <div class="academy-profile-shell">
                <div class="academy-profile-header">
                    <div class="academy-profile-title-block">
                        <div class="academy-profile-flag">${escapeHTML(driver.flag || '🏁')}</div>
                        <div>
                            <div class="academy-profile-name">${escapeHTML(driver.name)}</div>
                            <div class="academy-profile-subtitle">${escapeHTML(driver.nationality || 'Global')} • ${escapeHTML(driver.academyStatus || 'ACADEMY')}</div>
                        </div>
                    </div>
                    <div class="academy-profile-rating"><span>OVR</span><b>${driver.rating || '—'}</b></div>
                </div>
                <div class="academy-profile-grid">
                    <div><span>Nationality</span><b>${escapeHTML(driver.nationality || 'Global')}</b></div>
                    <div><span>Age</span><b>${driver.age || '—'}</b></div>
                    <div><span>OVR</span><b>${driver.rating || '—'}</b></div>
                    <div><span>Potential</span><b>${driver.potentialRating || driver.rating || '—'}</b></div>
                    <div><span>Development Trend</span><b>${escapeHTML(trend.label)}</b></div>
                    <div><span>Academy Status</span><b>${escapeHTML(driver.academyStatus || 'ACADEMY')}</b></div>
                </div>
                <div class="academy-profile-block">
                    <div class="academy-profile-block-title">Traits</div>
                    <div class="academy-profile-tags">${traits.length ? traits.map(trait => `<span>${escapeHTML(trait)}</span>`).join('') : '<span>No academy traits published</span>'}</div>
                </div>
                <div class="academy-profile-block academy-profile-split">
                    <div>
                        <div class="academy-profile-block-title">Strengths</div>
                        <div class="academy-profile-tags strength">${strengths.map(stat => `<span>${escapeHTML(stat.label)} ${stat.value}</span>`).join('')}</div>
                    </div>
                    <div>
                        <div class="academy-profile-block-title">Weaknesses</div>
                        <div class="academy-profile-tags weakness">${weaknesses.map(stat => `<span>${escapeHTML(stat.label)} ${stat.value}</span>`).join('')}</div>
                    </div>
                </div>
                <div class="academy-profile-block">
                    <div class="academy-profile-block-title">Development Tracking</div>
                    <div class="academy-trend-meter"><div class="academy-trend-fill ${trend.type}" style="width:${trend.score}%"></div></div>
                    <div class="academy-profile-badges">
                        ${trend.badges.length ? trend.badges.map(badge => `<span class="academy-trend-badge ${badge.type}">${escapeHTML(badge.label)}</span>`).join('') : '<span class="academy-trend-badge neutral">Stable Monitor</span>'}
                    </div>
                </div>
            </div>
        `;
    }

    function renderAcademyDevelopmentTracking(drivers) {
        const rapid = drivers.filter(driver => getAcademyTrendMeta(driver).type === 'rapid').length;
        const normal = drivers.filter(driver => getAcademyTrendMeta(driver).type === 'normal').length;
        const slow = drivers.filter(driver => getAcademyTrendMeta(driver).type === 'slow').length;
        const elite = drivers.filter(driver => getAcademyTrendMeta(driver).badges.some(badge => badge.type === 'elite')).length;
        const late = drivers.filter(driver => getAcademyTrendMeta(driver).badges.some(badge => badge.type === 'late')).length;
        return `
            <section class="academy-section academy-tracking-section">
                <div class="academy-section-header">
                    <div>
                        <div class="market-kicker">DEVELOPMENT TRACKING</div>
                        <h3 class="academy-section-title">Progress Monitoring</h3>
                    </div>
                </div>
                <div class="academy-tracking-grid">
                    <div class="academy-tracking-card"><span>Rapid Growth</span><b>${rapid}</b></div>
                    <div class="academy-tracking-card"><span>Normal Growth</span><b>${normal}</b></div>
                    <div class="academy-tracking-card"><span>Slow Growth</span><b>${slow}</b></div>
                    <div class="academy-tracking-card"><span>Elite Prospects</span><b>${elite}</b></div>
                    <div class="academy-tracking-card"><span>Late Developers</span><b>${late}</b></div>
                </div>
                <div class="academy-future-grid">
                    <div class="academy-future-card">
                        <div class="academy-profile-block-title">Future Academy Actions</div>
                        <div class="academy-future-actions">
                            <button class="btn" disabled>Scout Talent</button>
                            <button class="btn" disabled>Promote Driver</button>
                            <button class="btn" disabled>Reserve Driver</button>
                            <button class="btn" disabled>Development Programs</button>
                        </div>
                    </div>
                    <div class="academy-future-card">
                        <div class="academy-profile-block-title">Tracking Guide</div>
                        <div class="academy-guide-list">
                            <span class="academy-trend-badge rapid">Rapid Growth</span>
                            <span class="academy-trend-badge normal">Normal Growth</span>
                            <span class="academy-trend-badge slow">Slow Growth</span>
                            <span class="academy-trend-badge elite">Elite Prospect</span>
                            <span class="academy-trend-badge late">Late Developer</span>
                        </div>
                    </div>
                </div>
            </section>
        `;
    }

    function renderAcademyDevelopmentCenter(career, state) {
        const academy = career.academy || {};
        const academyDrivers = getAcademyDriverPool(academy);
        const overview = getAcademyOverviewStats(academyDrivers, academy);
        const filteredDrivers = filterAcademyDrivers(academyDrivers, state);
        const selectedDriver = academyDrivers.find(driver => driver.id === state.selectedDriverId) || filteredDrivers[0] || overview.highestPotentialProspect || null;
        const featured = overview.highestPotentialProspect || selectedDriver;
        return `
            <div class="academy-center">
                ${renderAcademyOverviewSection(overview)}
                ${renderFeaturedAcademyProspect(featured)}
                ${renderAcademyDriverWorkspace(filteredDrivers, selectedDriver, state, academyDrivers, academy)}
                ${renderAcademyDevelopmentTracking(academyDrivers)}
            </div>
        `;
    }

    function showAcademyModal() {
        const career = StateManager.get('career');
        if (!career || typeof AcademyService === 'undefined') return;
        AcademyService.ensureCareerAcademies(career);
        const academyDrivers = getAcademyDriverPool(career.academy || {});
        const featured = getAcademyOverviewStats(academyDrivers, career.academy || {}).highestPotentialProspect;
        const state = {
            age: 'all',
            ovr: 'all',
            potential: 'all',
            nationality: 'all',
            trend: 'all',
            sort: 'potential-desc',
            selectedDriverId: featured?.id || academyDrivers[0]?.id || null
        };

        const rerenderAcademy = () => {
            const currentCareer = StateManager.get('career');
            if (!currentCareer) return;
            AcademyService.ensureCareerAcademies(currentCareer);
            const currentDrivers = getAcademyDriverPool(currentCareer.academy || {});
            if (!currentDrivers.some(driver => driver.id === state.selectedDriverId)) {
                state.selectedDriverId = currentDrivers[0]?.id || null;
            }
            const root = document.getElementById('academy-development-center');
            if (!root) return;
            root.innerHTML = renderAcademyDevelopmentCenter(currentCareer, state);
            attachAcademyUIInteractions(currentCareer, state, rerenderAcademy);
        };

        Modals.open({
            title: '🌱 DRIVER ACADEMY — TALENT DEVELOPMENT CENTRE',
            className: 'modal-xl modal-academy',
            body: '<div id="academy-development-center"></div>',
            actions: [{ label: 'Close Academy', type: 'secondary' }],
            onOpen: rerenderAcademy
        });
    }

    function attachAcademyUIInteractions(career, state, rerenderAcademy) {
        const bindValue = (id, key) => {
            const element = document.getElementById(id);
            if (!element) return;
            element.addEventListener('change', () => {
                state[key] = element.value;
                rerenderAcademy();
            });
        };
        bindValue('academy-filter-age', 'age');
        bindValue('academy-filter-ovr', 'ovr');
        bindValue('academy-filter-potential', 'potential');
        bindValue('academy-filter-nationality', 'nationality');
        bindValue('academy-filter-trend', 'trend');
        bindValue('academy-sort', 'sort');

        document.querySelectorAll('[data-academy-select]').forEach(element => {
            element.addEventListener('click', () => {
                state.selectedDriverId = element.dataset.academySelect;
                rerenderAcademy();
            });
        });
    }


    function renderSelectOptions(options, selectedValue) {
        return options.map(([value, label]) => `<option value="${escapeHTML(value)}" ${value === selectedValue ? 'selected' : ''}>${escapeHTML(label)}</option>`).join('');
    }

    function getDriverTraitNames(driver) {
        return (driver?.traits || []).map(traitKey => {
            const trait = typeof DRIVER_TRAITS !== 'undefined' ? DRIVER_TRAITS[traitKey] : null;
            return trait ? `${trait.icon} ${trait.name}` : traitKey.replace(/_/g, ' ');
        });
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
            .map(([key, value]) => ({ key, label: labels[key] || formatStatName(key), value: Number.isFinite(value) ? value : 0 }))
            .sort((a, b) => b.value - a.value);
    }

    function getDriverStrengths(driver, count = 2) {
        return getDriverStatEntries(driver).slice(0, count);
    }

    function getDriverWeaknesses(driver, count = 2) {
        return [...getDriverStatEntries(driver)].sort((a, b) => a.value - b.value).slice(0, count);
    }

    function injectStyles() {
        if (document.getElementById('driver-academy-styles')) return;
        const style = document.createElement('style');
        style.id = 'driver-academy-styles';
        style.textContent = `
            /* === ACADEMY DEVELOPMENT CENTRE === */
            .academy-center {
                display: flex;
                flex-direction: column;
                gap: 16px;
                font-family: Rajdhani, sans-serif;
            }
            .academy-section {
                background: linear-gradient(135deg, rgba(255,255,255,0.035), rgba(255,255,255,0.02));
                border: 1px solid rgba(0,191,255,0.18);
                border-radius: 14px;
                padding: 16px;
            }
            .academy-section-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 14px;
                flex-wrap: wrap;
            }
            .academy-section-title {
                font-family: Orbitron;
                font-size: 18px;
                letter-spacing: 1px;
                color: var(--white);
                margin-top: 4px;
            }
            .academy-results-label,
            .academy-feature-status {
                font-family: Orbitron;
                font-size: 10px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--gray-400);
            }
            .academy-overview-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
            }
            .academy-overview-card,
            .academy-tracking-card {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
                padding: 12px;
                min-height: 78px;
            }
            .academy-overview-card span,
            .academy-tracking-card span,
            .academy-control span,
            .academy-profile-grid span,
            .academy-career-stat span,
            .academy-feature-trend-card span,
            .academy-profile-block-title {
                display: block;
                font-family: Orbitron;
                font-size: 9px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--gray-500);
            }
            .academy-overview-card b,
            .academy-tracking-card b {
                display: block;
                margin-top: 6px;
                font-family: Orbitron;
                font-size: 20px;
                color: #00BFFF;
                line-height: 1.15;
                overflow-wrap: anywhere;
            }
            .academy-feature-card {
                display: grid;
                grid-template-columns: 92px minmax(0, 1fr) 220px;
                gap: 16px;
                align-items: stretch;
                background: linear-gradient(135deg, rgba(0,255,65,0.08), rgba(0,128,255,0.08), rgba(0,0,0,0.45));
                border: 1px solid rgba(0,255,65,0.28);
                border-radius: 16px;
                padding: 18px;
            }
            .academy-feature-avatar {
                width: 84px;
                height: 84px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 42px;
                background: rgba(255,255,255,0.06);
                border: 2px solid rgba(0,191,255,0.36);
            }
            .academy-feature-main h2 {
                font-family: Orbitron;
                font-size: 24px;
                line-height: 1.1;
                margin-bottom: 8px;
            }
            .academy-feature-meta {
                color: var(--gray-300);
                font-size: 14px;
                line-height: 1.35;
            }
            .academy-feature-traits,
            .academy-profile-tags,
            .academy-feature-badges,
            .academy-guide-list {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .academy-feature-traits span,
            .academy-profile-tags span,
            .academy-guide-list span,
            .academy-trend-badge {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 999px;
                padding: 4px 8px;
                font-size: 10px;
                color: var(--gray-300);
            }
            .academy-feature-side {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .academy-feature-trend-card,
            .academy-profile-block,
            .academy-future-card,
            .academy-profile-shell {
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.07);
                border-radius: 12px;
                padding: 12px;
            }
            .academy-feature-trend-card b,
            .academy-profile-grid b,
            .academy-career-stat b,
            .academy-profile-rating b,
            .academy-profile-name {
                color: var(--white);
            }
            .academy-feature-trend-card b {
                display: block;
                margin: 6px 0 10px;
                font-family: Orbitron;
                font-size: 18px;
            }
            .academy-trend-meter {
                height: 8px;
                background: rgba(255,255,255,0.08);
                border-radius: 999px;
                overflow: hidden;
            }
            .academy-trend-fill {
                height: 100%;
                border-radius: 999px;
                background: linear-gradient(90deg, #00AAFF, #00FF41);
            }
            .academy-trend-fill.rapid,
            .academy-trend-badge.rapid { background: linear-gradient(90deg, rgba(0,255,65,0.2), rgba(0,255,65,0.08)); color: #c8ffd7; border-color: rgba(0,255,65,0.24); }
            .academy-trend-fill.normal,
            .academy-trend-badge.normal { background: linear-gradient(90deg, rgba(0,191,255,0.2), rgba(0,191,255,0.08)); color: #b7ebff; border-color: rgba(0,191,255,0.24); }
            .academy-trend-fill.slow,
            .academy-trend-badge.slow { background: linear-gradient(90deg, rgba(255,215,0,0.2), rgba(255,215,0,0.08)); color: #ffe7a3; border-color: rgba(255,215,0,0.24); }
            .academy-trend-badge.elite { color: #fff0b8; border-color: rgba(255,215,0,0.3); }
            .academy-trend-badge.late { color: #ffcfbf; border-color: rgba(255,102,0,0.28); }
            .academy-trend-badge.future { color: #d3c2ff; border-color: rgba(153,51,255,0.28); }
            .academy-trend-badge.neutral { color: var(--gray-300); }
            .academy-filter-grid {
                display: grid;
                grid-template-columns: repeat(6, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 14px;
            }
            .academy-control {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            .academy-driver-workspace {
                display: grid;
                grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
                gap: 14px;
                align-items: start;
            }
            .academy-table-panel,
            .academy-profile-panel { min-width: 0; }
            .academy-table-wrap {
                overflow: auto;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 12px;
            }
            .academy-prospect-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13px;
            }
            .academy-prospect-table th {
                font-family: Orbitron;
                color: var(--gray-500);
                font-size: 10px;
                text-align: left;
                padding: 10px;
                background: rgba(255,255,255,0.04);
                position: sticky;
                top: 0;
                z-index: 1;
            }
            .academy-prospect-table td {
                padding: 10px;
                border-top: 1px solid rgba(255,255,255,0.05);
                vertical-align: middle;
            }
            .academy-driver-row {
                cursor: pointer;
                transition: 0.18s ease;
            }
            .academy-driver-row:hover,
            .academy-driver-row.selected {
                background: rgba(0,191,255,0.08);
            }
            .academy-name-cell {
                display: flex;
                gap: 10px;
                align-items: center;
            }
            .academy-row-flag,
            .academy-profile-flag {
                font-size: 22px;
                flex-shrink: 0;
            }
            .academy-name-cell b {
                display: block;
                color: var(--white);
                line-height: 1.15;
            }
            .academy-name-cell small {
                color: var(--gray-500);
                line-height: 1.15;
            }
            .academy-trend-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 4px 8px;
                border-radius: 999px;
                font-family: Orbitron;
                font-size: 9px;
                letter-spacing: 1px;
                text-transform: uppercase;
                border: 1px solid rgba(255,255,255,0.08);
            }
            .academy-trend-pill.rapid { color: #c8ffd7; border-color: rgba(0,255,65,0.24); background: rgba(0,255,65,0.1); }
            .academy-trend-pill.normal { color: #b7ebff; border-color: rgba(0,191,255,0.24); background: rgba(0,191,255,0.1); }
            .academy-trend-pill.slow { color: #ffe7a3; border-color: rgba(255,215,0,0.24); background: rgba(255,215,0,0.1); }
            .academy-profile-shell {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .academy-profile-header {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                flex-wrap: wrap;
            }
            .academy-profile-title-block {
                display: flex;
                gap: 10px;
                align-items: center;
                min-width: 0;
            }
            .academy-profile-name {
                font-family: Orbitron;
                font-size: 18px;
                line-height: 1.1;
            }
            .academy-profile-subtitle {
                font-size: 12px;
                color: var(--gray-400);
                margin-top: 3px;
            }
            .academy-profile-rating {
                min-width: 66px;
                text-align: center;
                padding: 8px 10px;
                border-radius: 10px;
                border: 1px solid rgba(0,191,255,0.28);
                background: rgba(0,191,255,0.08);
            }
            .academy-profile-rating span {
                display: block;
                font-family: Orbitron;
                font-size: 8px;
                letter-spacing: 1px;
                color: var(--gray-500);
            }
            .academy-profile-rating b {
                display: block;
                margin-top: 4px;
                font-family: Orbitron;
                font-size: 20px;
            }
            .academy-profile-grid,
            .academy-profile-split {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
            }
            .academy-profile-grid div,
            .academy-career-stat {
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                border-radius: 8px;
                padding: 9px 10px;
            }
            .academy-profile-grid b,
            .academy-career-stat b {
                display: block;
                margin-top: 4px;
                font-size: 13px;
                line-height: 1.15;
                overflow-wrap: anywhere;
            }
            .academy-profile-tags.strength span { border-color: rgba(0,255,65,0.22); color: #c8ffd7; }
            .academy-profile-tags.weakness span { border-color: rgba(255,215,0,0.22); color: #ffe7a3; }
            .academy-empty-state,
            .academy-empty-row {
                padding: 18px;
                text-align: center;
                color: var(--gray-500);
            }
            .academy-tracking-grid {
                display: grid;
                grid-template-columns: repeat(5, minmax(0, 1fr));
                gap: 10px;
                margin-bottom: 14px;
            }
            .academy-future-grid {
                display: grid;
                grid-template-columns: 1.2fr 0.8fr;
                gap: 12px;
            }
            .academy-future-actions {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
                margin-top: 10px;
            }
            .academy-future-actions .btn[disabled] {
                opacity: 0.55;
                cursor: not-allowed;
            }
            @media (max-width: 1100px) {
                .academy-overview-grid,
                .academy-tracking-grid,
                .academy-filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                .academy-feature-card,
                .academy-driver-workspace,
                .academy-future-grid { grid-template-columns: 1fr; }
            }
            @media (max-width: 760px) {
                .academy-overview-grid,
                .academy-filter-grid,
                .academy-profile-grid,
                .academy-profile-split,
                .academy-future-actions,
                .academy-tracking-grid { grid-template-columns: 1fr 1fr; }
                .academy-feature-card { padding: 16px; }
            }
            @media (max-width: 560px) {
                .academy-section { padding: 12px; }
                .academy-overview-grid,
                .academy-filter-grid,
                .academy-profile-grid,
                .academy-profile-split,
                .academy-future-actions,
                .academy-tracking-grid { grid-template-columns: 1fr; }
                .academy-feature-card { grid-template-columns: 1fr; }
                .academy-feature-avatar { margin: 0 auto; }
            }


        `;
        document.head.appendChild(style);
    }

    function formatStatName(key) {
        return String(key || '').replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    const originalOpen = showAcademyModal;
    function open() {
        injectStyles();
        return originalOpen();
    }

    return { open };
})();
