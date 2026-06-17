/* ============================================
   VELOCITY — TIMING TABLE
   F1-broadcast-style live standings (60% of race screen)
   Updates in real-time with position changes,
   sector colors, tire info, pit counts
   ============================================ */

window.TimingTable = (() => {

    let container = null;
    let tableElement = null;
    let lastUpdate = 0;
    let updateInterval = 100; // ms - throttle updates for performance
    let expandedRow = null;

    /**
     * Initialize the timing table in a container
     */
    function init(containerElement) {
        container = containerElement;
        if (!container) return;
        render();
        forceUpdate();
    }

    /**
     * Build initial table structure
     */
    function render() {
        if (!container) return;

        container.innerHTML = `
            <div class="timing-table-wrapper">
                <table class="timing-table">
                    <thead>
                        <tr>
                            <th class="col-pos">POS</th>
                            <th class="col-num">#</th>
                            <th class="col-driver">DRIVER</th>
                            <th class="col-team">TEAM</th>
                            <th class="col-gap">GAP</th>
                            <th class="col-interval">INT</th>
                            <th class="col-last">LAST LAP</th>
                            <th class="col-best">BEST</th>
                            <th class="col-tire">TIRE</th>
                            <th class="col-laps">LAPS</th>
                            <th class="col-pit">PIT</th>
                        </tr>
                    </thead>
                    <tbody id="timing-table-body"></tbody>
                </table>
            </div>
        `;

        tableElement = container.querySelector('#timing-table-body');
        attachListeners();
    }

    /**
     * Attach event listeners
     */
    function attachListeners() {
        // Listen to race updates
        if (typeof EventBus !== 'undefined') {
            EventBus.on('race:lap_complete', () => requestUpdate());
            EventBus.on('race:pit_stop', () => requestUpdate());
            EventBus.on('race:overtake', () => requestUpdate());
            EventBus.on('race:incident', () => requestUpdate());
        }

        // Row click for expansion
        if (tableElement) {
            tableElement.addEventListener('click', (e) => {
                const row = e.target.closest('tr');
                if (!row) return;
                const carId = row.dataset.carId;
                toggleRowExpansion(carId);
            });
        }
    }

    /**
     * Request a UI update (throttled)
     */
    function requestUpdate() {
        const now = performance.now();
        if (now - lastUpdate < updateInterval) return;
        lastUpdate = now;
        update();
    }

    /**
     * Update the table with current race data (called on tick)
     */
    function update() {
        if (!tableElement) return;
        const cars = RaceEngine.getCars();
        if (!cars || cars.length === 0) return;

        const fragment = document.createDocumentFragment();
        cars.forEach(car => {
            try {
                const row = buildCarRow(car);
                if (row) fragment.appendChild(row);
            } catch (err) {
                console.warn('[TimingTable] Row build error swallowed:', car?.id, err);
            }
        });

        tableElement.innerHTML = '';
        tableElement.appendChild(fragment);
    }

    /**
     * Build a row for a single car
     */
    function buildCarRow(car) {
        const tr = document.createElement('tr');
        tr.dataset.carId = car.id;

        // Classes
        const classes = [];
        if (car.isPlayer) classes.push('player-row');
        if (car.isLocalPlayer) classes.push('local-player-row');
        if (car.status === 'DNF') classes.push('dnf-row');
        if (car.position === 1) classes.push('leader-row');
        if (expandedRow === car.id) classes.push('expanded');
        tr.className = classes.join(' ');

        // Position
        const posChange = getPositionChangeIndicator(car);
        const posClass = car.position === 1 ? 'pos-1' :
                        car.position === 2 ? 'pos-2' :
                        car.position === 3 ? 'pos-3' : '';

        // Gap/interval
        const gap = calculateGap(car);
        const interval = calculateInterval(car);

        // FIXED: Tire info — show compound, wear, and color
        const tireInfo = TireModel.getDisplayInfo(car.tireState);
        const tireColorMap = {
            'S': '#FF3333',
            'M': '#FFD700',
            'H': '#F0F0F0',
            'I': '#00CC66',
            'W': '#0066FF'
        };
        const tireColor = tireColorMap[tireInfo.compoundShort] || '#888888';

        // Build tire cell with compound dot + abbreviation + wear bar
        const tireCellHTML = `
            <div class="tire-cell-content">
                <div class="tire-compound-display">
                    <span class="tire-dot" style="background: ${tireColor}; box-shadow: 0 0 6px ${tireColor}aa;"></span>
                    <span class="tire-letter" style="color: ${tireColor};">${tireInfo.compoundShort}</span>
                </div>
                <div class="tire-wear-bar-container" title="${tireInfo.condition} - ${tireInfo.wearPercent}% worn">
                    <div class="tire-wear-bar" style="width: ${100 - tireInfo.wearPercent}%; background: ${tireInfo.conditionColor};"></div>
                </div>
            </div>
        `;

        // Format times
        const lastLap = car.lastLapTime ? formatLapTime(car.lastLapTime) : '--:--.---';
        const bestLap = car.bestLapTime ? formatLapTime(car.bestLapTime) : '--:--.---';

        // Sector color class for last lap
        const lastLapClass = getLapTimeClass(car);

        tr.innerHTML = `
            <td class="pos-cell ${posClass}">
                ${posChange}<span class="pos-num">${car.position}</span>
            </td>
            <td class="num-cell">
                <span class="car-num" style="color: ${car.team.color}">${formatCarNumber(car)}</span>
            </td>
            <td class="driver-cell">
                <span class="flag">${car.driver.flag || ''}</span>
                <span class="driver-name">${car.driver.name}</span>
            </td>
            <td class="team-cell">
                <span class="team-stripe" style="background: ${car.team.color}"></span>
                <span class="team-short">${car.team.shortName || car.team.name.substring(0, 3).toUpperCase()}</span>
            </td>
            <td class="time-cell">${gap}</td>
            <td class="time-cell">${interval}</td>
            <td class="time-cell ${lastLapClass}">${lastLap}</td>
            <td class="time-cell">${bestLap}</td>
            <td class="tire-cell">${tireCellHTML}</td>
            <td class="laps-cell">${car.tireState.lapsOnTire}</td>
            <td class="pit-cell" style="${car.isPittingNow ? 'color: var(--yellow); font-weight: 900; font-family: Orbitron;' : ''}">${car.pitPhase === 'stack_waiting' ? 'STACK...' : car.isPittingNow ? 'BOXING...' : car.pitStopCount}</td>
        `;

        return tr;
    }

    /**
     * Get position change indicator (▲ ▼ —)
     */
    function getPositionChangeIndicator(car) {
        if (!car.previousPosition || car.previousPosition === car.position) {
            return '<span class="pos-same">—</span>';
        }
        if (car.position < car.previousPosition) {
            return '<span class="pos-up">▲</span>';
        }
        return '<span class="pos-down">▼</span>';
    }

    /**
     * Calculate gap to leader
     */
    function calculateGap(car) {
        if (car.position === 1) return '<span class="leader-label">LEADER</span>';
        if (car.status === 'DNF') return 'DNF';

        const cars = RaceEngine.getCars();
        const leader = cars[0];
        if (!leader) return '';

        // Check if lapped
        const lapDiff = leader.lapCount - car.lapCount;
        if (lapDiff !== 0) {
            const absLap = Math.abs(lapDiff);
            return `+${absLap} LAP${absLap > 1 ? 'S' : ''}`;
        }

        const refPace = car.lastLapTime || 90;
        const progLeader = leader.lapCount + leader.trackProgress;
        const progCar = car.lapCount + car.trackProgress;
        const gap = Math.max(0, (progLeader - progCar) * refPace);
        return formatGap(gap);
    }

    /**
     * Calculate interval to car ahead
     */
    function calculateInterval(car) {
        if (car.position === 1) return '';
        if (car.status === 'DNF') return '';

        const cars = RaceEngine.getCars();
        const carAhead = cars[car.position - 2]; // position is 1-indexed
        if (!carAhead) return '';

        // Check if lapped vs car ahead
        const lapDiff = carAhead.lapCount - car.lapCount;
        if (lapDiff !== 0) {
            return `+${Math.abs(lapDiff)}L`;
        }

        const refPace = car.lastLapTime || 90;
        const progAhead = carAhead.lapCount + carAhead.trackProgress;
        const progCar = car.lapCount + car.trackProgress;
        const interval = Math.max(0, (progAhead - progCar) * refPace);
        return formatGap(interval);
    }

    /**
     * Get CSS class for lap time (purple/green/yellow based on best)
     */
    function getLapTimeClass(car) {
        if (!car.lastLapTime) return '';

        // Check if it's the overall fastest lap
        const state = RaceEngine.getState();
        if (state && state.fastestLap && Math.abs(car.lastLapTime - state.fastestLap) < 0.001) {
            return 'sector-purple';
        }

        // Personal best
        if (car.bestLapTime && Math.abs(car.lastLapTime - car.bestLapTime) < 0.001) {
            return 'sector-green';
        }

        return '';
    }

    /**
     * Format car number based on position in team
     */
    function formatCarNumber(car) {
        // Driver index + team-based number
        const idx = car.team.drivers ? car.team.drivers.indexOf(car.driver) : 0;
        return `${idx + 1}`;
    }

    /**
     * Toggle row expansion (show detailed info)
     */
    function toggleRowExpansion(carId) {
        if (expandedRow === carId) {
            expandedRow = null;
        } else {
            expandedRow = carId;
        }
        update();
    }

    /**
     * Get the expanded row detail HTML
     */
    function buildExpandedDetail(car) {
        const tireInfo = TireModel.getDisplayInfo(car.tireState);
        const strategy = car.strategy ? PitStrategy.getStrategySummary(car) : null;

        return `
            <tr class="expanded-row">
                <td colspan="11">
                    <div class="expanded-content">
                        <div class="expanded-driver">
                            <div class="exp-avatar">🏎️</div>
                            <div>
                                <div class="exp-name">${car.driver.name}</div>
                                <div class="exp-team" style="color: ${car.team.color}">${car.team.name}</div>
                            </div>
                        </div>
                        <div class="expanded-stats">
                            <div class="exp-stat">
                                <div class="exp-stat-label">TIRE COMPOUND</div>
                                <div class="exp-stat-value">${tireInfo.compoundName}</div>
                            </div>
                            <div class="exp-stat">
                                <div class="exp-stat-label">TIRE WEAR</div>
                                <div class="exp-stat-value" style="color: ${tireInfo.conditionColor}">
                                    ${tireInfo.wearPercent}% - ${tireInfo.condition}
                                </div>
                            </div>
                            <div class="exp-stat">
                                <div class="exp-stat-label">TIRE TEMP</div>
                                <div class="exp-stat-value">${tireInfo.temp}°C</div>
                            </div>
                            <div class="exp-stat">
                                <div class="exp-stat-label">PIT STOPS</div>
                                <div class="exp-stat-value">${car.pitStopCount}</div>
                            </div>
                            <div class="exp-stat">
                                <div class="exp-stat-label">SECTOR TIMES</div>
                                <div class="exp-stat-value">
                                    ${car.sectorTimes.map(s => s ? s.toFixed(3) : '--').join(' / ')}
                                </div>
                            </div>
                            ${strategy ? `
                            <div class="exp-stat">
                                <div class="exp-stat-label">STRATEGY</div>
                                <div class="exp-stat-value">${strategy.type}</div>
                            </div>` : ''}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * Update interval (called externally to force refresh)
     */
    function forceUpdate() {
        lastUpdate = 0;
        update();
    }

    /**
     * Clear and destroy
     */
    function destroy() {
        if (container) container.innerHTML = '';
        container = null;
        tableElement = null;
        expandedRow = null;
    }

    return {
        init,
        update,
        forceUpdate,
        toggleRowExpansion,
        destroy
    };
})();