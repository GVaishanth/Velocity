/* ============================================
   VELOCITY — RACE INITIALIZER
   Single authoritative pipeline for preparing race setup state
   ============================================ */

window.RaceInitializer = (() => {
    function resolveTrack(input) {
        if (input?.track) return input.track;
        const id = input?.trackId || input?.id;
        if (typeof CalendarService !== 'undefined') return CalendarService.getTrack(id);
        if (typeof getTrackById === 'function') return getTrackById(id);
        return null;
    }

    function cloneTrackWithLaps(track, laps) {
        if (!track) return null;
        const totalLaps = laps || track.laps || 1;
        return { ...track, laps: Math.max(1, parseInt(totalLaps, 10) || 1) };
    }

    function validateTeams(allTeams) {
        const errors = [];
        if (!Array.isArray(allTeams) || allTeams.length === 0) {
            errors.push('allTeams is missing or empty');
            return { valid: false, errors };
        }
        allTeams.forEach((team, teamIdx) => {
            if (!team?.id) errors.push(`team[${teamIdx}] missing id`);
            if (!Array.isArray(team?.drivers) || team.drivers.length === 0) {
                errors.push(`team[${team?.id || teamIdx}] has no drivers`);
            } else {
                team.drivers.forEach((driver, driverIdx) => {
                    if (!driver?.id) errors.push(`team[${team?.id || teamIdx}].drivers[${driverIdx}] missing id`);
                    if (!driver?.name) errors.push(`team[${team?.id || teamIdx}].drivers[${driverIdx}] missing name`);
                });
            }
        });
        return { valid: errors.length === 0, errors };
    }

    function flattenCars(allTeams) {
        const entries = [];
        allTeams.forEach(team => {
            (team.drivers || []).forEach(driver => entries.push({ team, driver }));
        });
        return entries;
    }

    function performanceScore(entry) {
        const d = entry.driver || {};
        const stats = d.stats || {};
        const teamStats = entry.team?.carStats || entry.team?.baseCarStats || {};
        const driverScore = d.rating || ((stats.pace || 75) * 0.45 + (stats.consistency || 75) * 0.25 + (stats.racecraft || 75) * 0.2 + (stats.experience || 75) * 0.1);
        const carScore = Object.values(teamStats).filter(v => typeof v === 'number').reduce((sum, v) => sum + v, 0) / Math.max(1, Object.values(teamStats).filter(v => typeof v === 'number').length);
        return (driverScore * 0.65) + ((carScore || 75) * 0.35);
    }

    function generateGrid(allTeams, options = {}) {
        const entries = flattenCars(allTeams);
        if (options.preserveTeamOrder) {
            return entries.map((entry, idx) => ({ carId: entry.driver.id, position: idx + 1 }));
        }
        const scored = entries.map((entry, idx) => ({
            carId: entry.driver.id,
            score: performanceScore(entry) + (options.randomize === false ? 0 : (Math.random() * 10 - 5)),
            originalIndex: idx
        }));
        scored.sort((a, b) => {
            if (Math.abs(b.score - a.score) > 0.0001) return b.score - a.score;
            return a.originalIndex - b.originalIndex;
        });
        return scored.map((entry, idx) => ({ carId: entry.carId, position: idx + 1 }));
    }

    function validateGrid(grid, allTeams) {
        const driverIds = new Set(flattenCars(allTeams).map(x => x.driver?.id).filter(Boolean));
        const errors = [];
        if (!Array.isArray(grid) || grid.length === 0) errors.push('grid is missing or empty');
        const seenPositions = new Set();
        const seenCars = new Set();
        (grid || []).forEach((g, idx) => {
            if (!g?.carId) errors.push(`grid[${idx}] missing carId`);
            if (!driverIds.has(g?.carId)) errors.push(`grid[${idx}] carId not found in drivers: ${g?.carId}`);
            if (!Number.isFinite(g?.position)) errors.push(`grid[${idx}] invalid position`);
            if (seenPositions.has(g?.position)) errors.push(`duplicate grid position: ${g?.position}`);
            if (seenCars.has(g?.carId)) errors.push(`duplicate grid carId: ${g?.carId}`);
            seenPositions.add(g?.position);
            seenCars.add(g?.carId);
        });
        if (grid && grid.length !== driverIds.size) errors.push(`grid length ${grid.length} does not match driver count ${driverIds.size}`);
        return { valid: errors.length === 0, errors };
    }

    function createWeather(track, explicitWeather = null) {
        if (explicitWeather) return explicitWeather;
        if (typeof WeatherSystem !== 'undefined' && WeatherSystem.createWeatherState) {
            const weather = WeatherSystem.createWeatherState(track);
            if (WeatherSystem.generateForecast) WeatherSystem.generateForecast(weather, track.laps || 1);
            return weather;
        }
        return {
            current: 'DRY',
            previous: 'DRY',
            trackTemp: 35,
            airTemp: 25,
            trackWetness: 0,
            scheduledChanges: [],
            forecast: []
        };
    }

    function validateRaceConfig(race) {
        const errors = [];
        if (!race.track?.id) errors.push('track missing or invalid');
        if (!race.track?.laps) errors.push('track.laps missing');
        if (!race.playerTeamId) errors.push('playerTeamId missing');
        if (!race.strategy) errors.push('strategy missing');
        if (!race.weather) errors.push('weather missing');
        const teamValidation = validateTeams(race.allTeams);
        if (!teamValidation.valid) errors.push(...teamValidation.errors);
        const gridValidation = validateGrid(race.grid, race.allTeams || []);
        if (!gridValidation.valid) errors.push(...gridValidation.errors);
        return { valid: errors.length === 0, errors };
    }

    function initializeRace(config = {}) {
        if (typeof StateManager === 'undefined') {
            throw new Error('RaceInitializer requires StateManager');
        }

        const trackBase = resolveTrack(config);
        if (!trackBase) {
            throw new Error(`RaceInitializer: invalid track ${config.trackId || config.track?.id || '(missing)'}`);
        }

        const track = cloneTrackWithLaps(trackBase, config.laps || config.totalLaps);
        const allTeams = Array.isArray(config.allTeams) ? config.allTeams : [];
        const teamValidation = validateTeams(allTeams);
        if (!teamValidation.valid) {
            console.error('[RaceInitializer] Invalid teams:', teamValidation.errors, allTeams);
            throw new Error('RaceInitializer: invalid teams - ' + teamValidation.errors.join('; '));
        }

        const grid = config.grid || generateGrid(allTeams, { randomize: config.randomizeGrid !== false });
        const strategy = {
            startingTire: 'MEDIUM',
            pitStops: 2,
            aggression: 5,
            ...(config.strategy || {})
        };
        const weather = createWeather(track, config.weather || config.weatherState || null);

        const normalized = {
            track,
            trackId: track.id,
            allTeams,
            grid,
            weather,
            strategy,
            playerTeamId: config.playerTeamId || config.teamId || null,
            difficulty: config.difficulty || StateManager.get('settings.difficulty') || 'COMPETITIVE',
            speed: config.speed || StateManager.get('settings.raceSpeed') || 2,
            totalLaps: track.laps,
            isCareerRace: !!config.isCareerRace,
            isQuickRace: !!config.isQuickRace,
            isMultiplayerRace: !!config.isMultiplayerRace,
            source: config.source || config.mode || 'standard',
            initializedAt: Date.now()
        };

        const validation = validateRaceConfig(normalized);
        if (!validation.valid) {
            console.error('[RaceInitializer] Race validation failed:', validation.errors, normalized);
            throw new Error('RaceInitializer validation failed: ' + validation.errors.join('; '));
        }

        StateManager.set('race', normalized);
        if (config.mode) StateManager.set('mode', config.mode);
        return normalized;
    }

    function initializeCareerRace(career, track, strategy = {}, options = {}) {
        if (!career) throw new Error('RaceInitializer.initializeCareerRace: missing career');
        return initializeRace({
            source: options.source || (career.isMultiplayer ? 'multiplayer-career' : 'career'),
            mode: options.mode,
            track,
            allTeams: career.allTeams,
            playerTeamId: career.team?.id,
            difficulty: career.difficulty || options.difficulty,
            speed: options.speed,
            strategy,
            grid: options.grid || null,
            weather: options.weather || null,
            isCareerRace: true,
            isMultiplayerRace: !!career.isMultiplayer || !!options.isMultiplayerRace
        });
    }

    return {
        initializeRace,
        initializeCareerRace,
        validateRaceConfig,
        validateGrid,
        validateTeams,
        generateGrid
    };
})();
