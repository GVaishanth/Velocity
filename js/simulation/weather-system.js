/* ============================================
   VELOCITY — WEATHER SYSTEM (REALISTIC)
   - Track rain probability actually matters
   - Weather changes are slow and rare (like IRL)
   - Forecast accuracy increases over time
   - Most races stay in the starting weather
   ============================================ */

window.WeatherSystem = (() => {

    const WEATHER_STATES = {
        DRY: {
            id: 'DRY',
            name: 'Dry',
            icon: '☀️',
            color: '#FFD700',
            visibilityModifier: 1.0,
            gripModifier: 1.0,
            mistakeModifier: 1.0,
            description: 'Clear and dry conditions'
        },
        CLOUDY: {
            id: 'CLOUDY',
            name: 'Cloudy',
            icon: '☁️',
            color: '#888888',
            visibilityModifier: 0.98,
            gripModifier: 1.0,
            mistakeModifier: 1.0,
            description: 'Overcast but dry'
        },
        LIGHT_RAIN: {
            id: 'LIGHT_RAIN',
            name: 'Light Rain',
            icon: '🌦️',
            color: '#5599DD',
            visibilityModifier: 0.85,
            gripModifier: 0.78,
            mistakeModifier: 1.6,
            description: 'Damp track, intermediates likely best'
        },
        HEAVY_RAIN: {
            id: 'HEAVY_RAIN',
            name: 'Heavy Rain',
            icon: '🌧️',
            color: '#2266AA',
            visibilityModifier: 0.65,
            gripModifier: 0.55,
            mistakeModifier: 2.5,
            description: 'Wet conditions, full wets required'
        },
        DRYING: {
            id: 'DRYING',
            name: 'Drying',
            icon: '🌤️',
            color: '#AABB77',
            visibilityModifier: 0.92,
            gripModifier: 0.88,
            mistakeModifier: 1.3,
            description: 'Track drying after rain'
        }
    };

    /**
     * Create a new weather state for a race
     * Starting weather is heavily influenced by track rain probability
     */
    function createWeatherState(track) {
        const startWeather = determineStartWeather(track);

        // Determine if this race will have weather changes at all
        // Most races (70%) stay in the starting weather throughout
        const willChange = Math.random() < 0.30;

        return {
            current: startWeather,
            previous: null,
            forecastAccuracy: 0.7,
            lap: 0,
            history: [{ lap: 0, weather: startWeather }],
            trackWetness: getInitialWetness(startWeather),
            airTemp: 20 + Math.floor(Math.random() * 14),
            trackTemp: 28 + Math.floor(Math.random() * 20),
            windSpeed: Math.floor(Math.random() * 18),
            changeWarning: null,
            changeInLaps: null,
            forecast: [],

            // NEW: pre-determined weather changes for this race
            willChange: willChange,
            scheduledChanges: willChange ? generateScheduledChanges(track, startWeather) : [],
            lastChangeLap: 0,

            // NEW: track this for radio/UI
            stableForLaps: 0,
            lapsToNextChange: null
        };
    }

    /**
     * Get initial track wetness based on weather
     */
    function getInitialWetness(weather) {
        switch (weather) {
            case 'HEAVY_RAIN': return 95;
            case 'LIGHT_RAIN': return 55;
            case 'DRYING': return 25;
            case 'CLOUDY': return 5;
            case 'DRY':
            default: return 0;
        }
    }

    /**
     * Determine starting weather - heavily weighted by track probability
     * Most tracks should mostly be dry
     */
    function determineStartWeather(track) {
        const rainProb = track.rainProbability || 20;
        const roll = Math.random() * 100;

        // Track rain probability now actually maps to chances
        // e.g., 30% rain prob track = 30% chance starts with some rain
        if (roll < rainProb * 0.2) {
            return 'HEAVY_RAIN';   // 20% of rainy starts are heavy
        }
        if (roll < rainProb * 0.5) {
            return 'LIGHT_RAIN';   // 30% of rainy starts are light
        }
        if (roll < rainProb) {
            return 'CLOUDY';       // Rest of rainy starts are just cloudy
        }
        // Otherwise dry/cloudy split
        if (roll < rainProb + 20) {
            return 'CLOUDY';
        }
        return 'DRY';
    }

    /**
     * Pre-generate scheduled weather changes for the race
     * Most races have 0-2 changes maximum, spread over many laps
     */
    function generateScheduledChanges(track, startWeather) {
        const rainProb = track.rainProbability || 20;
        const changes = [];

        // Number of changes: 0-2 max, weighted by rain probability
        const numChanges = rainProb > 50
            ? (Math.random() < 0.6 ? 2 : 1)
            : rainProb > 25
                ? (Math.random() < 0.5 ? 1 : 0)
                : (Math.random() < 0.2 ? 1 : 0);

        if (numChanges === 0) return [];

        // Each change must be at least 10-15 laps apart
        const minLapForChange = 8;
        const maxLapForChange = 50;

        let lastChangeLap = 0;
        let currentWeather = startWeather;

        for (let i = 0; i < numChanges; i++) {
            const lapsBetween = 10 + Math.floor(Math.random() * 15);
            const changeLap = lastChangeLap + minLapForChange + lapsBetween;

            if (changeLap > maxLapForChange) break;

            // Determine the next weather state realistically
            const nextWeather = getNextLogicalWeather(currentWeather, rainProb);

            changes.push({
                lap: changeLap,
                from: currentWeather,
                to: nextWeather,
                triggered: false
            });

            currentWeather = nextWeather;
            lastChangeLap = changeLap;
        }

        return changes;
    }

    /**
     * Get a logical next weather state (no random jumps)
     * e.g., DRY → CLOUDY → LIGHT_RAIN, not DRY → HEAVY_RAIN
     */
    function getNextLogicalWeather(current, trackRainProb) {
        const transitions = {
            'DRY': ['CLOUDY', 'LIGHT_RAIN'],
            'CLOUDY': ['DRY', 'LIGHT_RAIN'],
            'LIGHT_RAIN': ['HEAVY_RAIN', 'DRYING', 'CLOUDY'],
            'HEAVY_RAIN': ['LIGHT_RAIN', 'DRYING'],
            'DRYING': ['DRY', 'CLOUDY']
        };

        const options = transitions[current] || ['DRY'];

        // Weight towards drying out unless it's a wet track
        if (trackRainProb < 40) {
            // Prefer drying transitions
            if (current === 'LIGHT_RAIN' || current === 'HEAVY_RAIN') {
                return 'DRYING';
            }
        }

        return options[Math.floor(Math.random() * options.length)];
    }

    /**
     * Generate weather forecast for display
     */
    function generateForecast(weatherState, raceLength) {
        const forecast = [{ lap: 0, weather: weatherState.current, confidence: 1.0 }];

        // Add scheduled changes to forecast
        weatherState.scheduledChanges.forEach(change => {
            forecast.push({
                lap: change.lap,
                weather: change.to,
                confidence: 0.85
            });
        });

        weatherState.forecast = forecast;
        return forecast;
    }

    /**
     * Update weather for current lap
     * Now uses scheduled changes - no more random per-lap rolls
     */
    function updateLap(weatherState, currentLap, track) {
        weatherState.lap = currentLap;
        weatherState.stableForLaps = currentLap - weatherState.lastChangeLap;

        // Dynamic Temperature Evolution
        // Air temp shifts slightly
        weatherState.airTemp += (Math.random() - 0.5) * 0.2;
        
        // Track temp is affected by air temp, sun (DRY/CLOUDY), and rain
        const weather = weatherState.current;
        let targetTrackTemp = weatherState.airTemp + 10; // Base offset
        
        if (weather === 'DRY') targetTrackTemp += 15;
        if (weather === 'CLOUDY') targetTrackTemp += 5;
        if (weather === 'LIGHT_RAIN') targetTrackTemp -= 5;
        if (weather === 'HEAVY_RAIN') targetTrackTemp -= 12;
        
        // Gradually move track temp toward target
        const tempDiff = targetTrackTemp - weatherState.trackTemp;
        weatherState.trackTemp += tempDiff * 0.05;

        let changed = false;

        // Check if any scheduled change should trigger
        weatherState.scheduledChanges.forEach(change => {
            if (!change.triggered && currentLap >= change.lap) {
                change.triggered = true;
                weatherState.previous = weatherState.current;
                weatherState.current = change.to;
                weatherState.history.push({ lap: currentLap, weather: change.to });
                weatherState.lastChangeLap = currentLap;
                weatherState.stableForLaps = 0;
                changed = true;
            }
        });

        // Update track wetness gradually
        updateTrackWetness(weatherState);

        // Update change warning for UI (look ahead 5 laps)
        updateChangeWarning(weatherState, currentLap);

        if (changed && typeof EventBus !== 'undefined') {
            EventBus.emit('weather:changed', {
                from: weatherState.previous,
                to: weatherState.current,
                lap: currentLap
            });
        }

        return changed;
    }

    /**
     * Gradually update track wetness toward target for current weather
     */
    function updateTrackWetness(weatherState) {
        const targetWetness = {
            DRY: 0,
            CLOUDY: 5,
            DRYING: 25,
            LIGHT_RAIN: 60,
            HEAVY_RAIN: 95
        };
        const target = targetWetness[weatherState.current] || 0;
        const diff = target - weatherState.trackWetness;
        // Slow transition: 8% per lap
        weatherState.trackWetness += diff * 0.08;
        weatherState.trackWetness = Math.max(0, Math.min(100, weatherState.trackWetness));
    }

    /**
     * Update upcoming change warning for UI
     */
    function updateChangeWarning(weatherState, currentLap) {
        weatherState.changeWarning = null;
        weatherState.changeInLaps = null;

        // Find next scheduled change
        const nextChange = weatherState.scheduledChanges.find(
            c => !c.triggered && c.lap > currentLap
        );

        if (nextChange) {
            const lapsAway = nextChange.lap - currentLap;
            // Only show warning when within 5 laps
            if (lapsAway <= 5) {
                weatherState.changeWarning = nextChange.to;
                weatherState.changeInLaps = lapsAway;
            }
            weatherState.lapsToNextChange = lapsAway;
        }
    }

    /**
     * Get current weather info for display
     */
    function getDisplayInfo(weatherState) {
        const weather = WEATHER_STATES[weatherState.current];
        return {
            current: weather,
            icon: weather.icon,
            name: weather.name,
            airTemp: weatherState.airTemp,
            trackTemp: weatherState.trackTemp,
            wetness: Math.round(weatherState.trackWetness),
            windSpeed: weatherState.windSpeed,
            changeWarning: weatherState.changeWarning ? WEATHER_STATES[weatherState.changeWarning] : null,
            changeInLaps: weatherState.changeInLaps,
            color: weather.color,
            stableForLaps: weatherState.stableForLaps,
            lapsToNextChange: weatherState.lapsToNextChange
        };
    }

    /**
     * Get grip modifier for lap calculations
     */
    function getGripModifier(weatherState) {
        return WEATHER_STATES[weatherState.current].gripModifier;
    }

    /**
     * Get mistake chance modifier
     */
    function getMistakeModifier(weatherState) {
        return WEATHER_STATES[weatherState.current].mistakeModifier;
    }

    /**
     * Is the track currently wet?
     */
    function isWet(weatherState) {
        return weatherState.current === 'LIGHT_RAIN' ||
               weatherState.current === 'HEAVY_RAIN' ||
               (weatherState.current === 'DRYING' && weatherState.trackWetness > 30);
    }

    /**
     * Determine optimal tire compound for current weather
     */
    function getOptimalCompound(weatherState) {
        switch (weatherState.current) {
            case 'HEAVY_RAIN': return 'WET';
            case 'LIGHT_RAIN':
                return weatherState.trackWetness > 70 ? 'WET' : 'INTERMEDIATE';
            case 'DRYING':
                return weatherState.trackWetness > 50 ? 'INTERMEDIATE' : 'SOFT';
            case 'CLOUDY':
            case 'DRY':
                return 'MEDIUM';
            default:
                return 'MEDIUM';
        }
    }

    /**
     * Get radio message about weather
     */
    function getRadioMessage(weatherState) {
        if (weatherState.changeInLaps && weatherState.changeInLaps <= 5) {
            return {
                text: `Weather change incoming: ${WEATHER_STATES[weatherState.changeWarning].name} in ${weatherState.changeInLaps} laps`,
                priority: 'warning'
            };
        }
        if (weatherState.current === 'HEAVY_RAIN') {
            return { text: 'Heavy rain falling, visibility poor', priority: 'critical' };
        }
        if (weatherState.current === 'LIGHT_RAIN') {
            return { text: 'Light rain on circuit, track damp', priority: 'warning' };
        }
        return null;
    }

    return {
        WEATHER_STATES,
        createWeatherState,
        generateForecast,
        updateLap,
        getDisplayInfo,
        getGripModifier,
        getInitialWetness, // Exported
        getMistakeModifier,
        isWet,
        getOptimalCompound,
        getRadioMessage
    };
})();