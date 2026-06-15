/* ============================================
   VELOCITY — EVENT SYSTEM
   Generates race events: crashes, safety cars,
   mechanical failures, mistakes, weather changes
   ============================================ */

const EventSystem = (() => {

    const EVENT_TYPES = {
        MECHANICAL_FAILURE: 'mechanical_failure',
        CRASH: 'crash',
        DRIVER_MISTAKE: 'driver_mistake',
        SAFETY_CAR: 'safety_car',
        VIRTUAL_SAFETY_CAR: 'virtual_safety_car',
        YELLOW_FLAG: 'yellow_flag',
        OVERTAKE: 'overtake',
        PIT_STOP: 'pit_stop',
        FASTEST_LAP: 'fastest_lap',
        DRS_ENABLED: 'drs_enabled',
        TIRE_PUNCTURE: 'tire_puncture',
        WEATHER_CHANGE: 'weather_change'
    };

    /**
     * Check for events for one car on one lap
     */
    function checkCarEvents(car, raceState, weatherState) {
        const events = [];
        const driver = car.driver;
        const carStats = car.carStats;

        // 1. Mechanical failure check
        if (checkMechanicalFailure(car)) {
            events.push({
                type: EVENT_TYPES.MECHANICAL_FAILURE,
                carId: car.id,
                driver: driver.name,
                team: car.team.name,
                lap: raceState.currentLap,
                severity: 'CRITICAL',
                message: generateFailureMessage(driver.name),
                effects: { dnf: true }
            });
            return events;
        }

        // 2. Tire puncture (rare)
        if (TireModel.checkTireFailure(car.tireState)) {
            events.push({
                type: EVENT_TYPES.TIRE_PUNCTURE,
                carId: car.id,
                driver: driver.name,
                team: car.team.name,
                lap: raceState.currentLap,
                severity: 'HIGH',
                message: `${driver.name} has a puncture! Limping to the pits.`,
                effects: { forcePit: true, timePenalty: 25 }
            });
            return events;
        }

        // 3. Driver mistake
        const mistakeRoll = Math.random();
        const mistakeChance = calculateMistakeChance(driver, weatherState, car.drivingMode);
        if (mistakeRoll < mistakeChance) {
            const mistakeType = generateMistake(driver, weatherState);
            events.push({
                type: EVENT_TYPES.DRIVER_MISTAKE,
                carId: car.id,
                driver: driver.name,
                team: car.team.name,
                lap: raceState.currentLap,
                severity: mistakeType.severity,
                message: mistakeType.message,
                effects: { timePenalty: mistakeType.timePenalty }
            });

            // Severe mistakes can lead to crashes
            if (mistakeType.severity === 'CRITICAL' && Math.random() < 0.4) {
                events.push({
                    type: EVENT_TYPES.CRASH,
                    carId: car.id,
                    driver: driver.name,
                    team: car.team.name,
                    lap: raceState.currentLap,
                    severity: 'CRITICAL',
                    message: `${driver.name} crashes out!`,
                    effects: { dnf: true, triggerSC: Math.random() < 0.7 }
                });
            }
        }

        return events;
    }

    /**
     * Calculate mechanical failure probability per lap
     */
    function checkMechanicalFailure(car) {
        const reliability = car.carStats.reliability;
        // Higher reliability = lower failure chance
        // 90 reliability = 0.1% per lap
        // 70 reliability = 0.3% per lap
        // 50 reliability = 0.5% per lap
        const baseChance = (100 - reliability) / 10000;

        // Push mode increases failure risk
        let chance = baseChance;
        if (car.drivingMode === 'PUSH') chance *= 1.3;

        return Math.random() < chance;
    }

    /**
     * Calculate driver mistake probability per lap
     */
    function calculateMistakeChance(driver, weatherState, drivingMode) {
        const consistency = driver.stats.consistency;
        let chance = (100 - consistency) / 5000;

        // Weather modifier
        const weatherMod = WeatherSystem.getMistakeModifier(weatherState);
        chance *= weatherMod;

        // Driving mode
        if (drivingMode === 'PUSH') chance *= 1.4;
        if (drivingMode === 'CONSERVE') chance *= 0.7;

        // Trait modifiers
        if (driver.traits.includes('IRON_WILL')) chance *= 0.7;
        if (driver.traits.includes('AGGRESSIVE')) chance *= 1.25;
        if (driver.traits.includes('CONSISTENT')) chance *= 0.6;

        return chance;
    }

    /**
     * Generate a driver mistake event
     */
    function generateMistake(driver, weatherState) {
        const wet = WeatherSystem.isWet(weatherState);
        const mistakes = wet ? [
            { message: `${driver.name} runs wide in the wet`, timePenalty: 2, severity: 'LOW' },
            { message: `${driver.name} aquaplanes briefly`, timePenalty: 4, severity: 'MEDIUM' },
            { message: `${driver.name} slides off track!`, timePenalty: 7, severity: 'HIGH' },
            { message: `${driver.name} spins in the rain!`, timePenalty: 12, severity: 'CRITICAL' }
        ] : [
            { message: `${driver.name} locks up under braking`, timePenalty: 1.5, severity: 'LOW' },
            { message: `${driver.name} runs wide`, timePenalty: 2.5, severity: 'LOW' },
            { message: `${driver.name} misses the apex`, timePenalty: 3, severity: 'MEDIUM' },
            { message: `${driver.name} goes off track!`, timePenalty: 6, severity: 'HIGH' },
            { message: `${driver.name} spins!`, timePenalty: 10, severity: 'CRITICAL' }
        ];

        // Weight toward lower severity
        const roll = Math.random();
        if (roll < 0.55) return mistakes[0];
        if (roll < 0.80) return mistakes[1];
        if (roll < 0.93) return mistakes[2];
        if (roll < 0.99) return mistakes[3];
        return mistakes[4] || mistakes[3];
    }

    /**
     * Generate mechanical failure message
     */
    function generateFailureMessage(driverName) {
        const failures = [
            `${driverName} retires with engine failure!`,
            `${driverName} stops on track - gearbox issue!`,
            `${driverName} pulls off with hydraulics failure!`,
            `${driverName} has lost power - electrical problem!`,
            `${driverName} is out - suspension failure!`,
            `${driverName} retires with brake failure!`,
            `${driverName} has an MGU-K problem and stops!`,
            `${driverName} is out with a power unit failure!`
        ];
        return failures[Math.floor(Math.random() * failures.length)];
    }

    /**
     * Check if a safety car should be deployed (race-level event)
     * MORE REALISTIC: Less frequent, only triggers from real incidents
     */
    function checkSafetyCarTrigger(raceState, track, recentEvents) {
        // Check if a recent crash triggers SC (most common cause)
        const recentCrash = recentEvents.find(e =>
            e.type === EVENT_TYPES.CRASH &&
            e.effects?.triggerSC &&
            raceState.currentLap - e.lap <= 1
        );

        if (recentCrash) {
            return {
                triggered: true,
                reason: 'crash',
                duration: 3 + Math.floor(Math.random() * 3),
                crashDriver: recentCrash.driver
            };
        }

        // Random SC for debris/incidents - REDUCED FREQUENCY
        if (raceState.status !== 'GREEN') return { triggered: false };

        // No SC in first 3 laps or last 5 laps
        const remaining = raceState.totalLaps - raceState.currentLap;
        if (raceState.currentLap < 3 || remaining < 5) return { triggered: false };

        // Cool-down: no SC within 8 laps of previous one
        if (raceState.lastSCLap && raceState.currentLap - raceState.lastSCLap < 8) {
            return { triggered: false };
        }

        // Much lower base chance - only ~10% of races get a random SC
        const trackProbability = (track.safetyCarProbability || 30) / 100;
        const baseChance = (trackProbability * 0.4) / raceState.totalLaps;

        if (Math.random() < baseChance) {
            return {
                triggered: true,
                reason: 'debris',
                duration: 2 + Math.floor(Math.random() * 3)
            };
        }

        return { triggered: false };
    }

    /**
     * Generate overtake event
     */
    function createOvertakeEvent(attacker, defender, lap) {
        const messages = [
            `${attacker.driver.name} takes ${defender.driver.name}!`,
            `${attacker.driver.name} dives past ${defender.driver.name}!`,
            `Move complete! ${attacker.driver.name} ahead of ${defender.driver.name}`,
            `${attacker.driver.name} makes the move stick on ${defender.driver.name}`
        ];

        return {
            type: EVENT_TYPES.OVERTAKE,
            attackerId: attacker.id,
            defenderId: defender.id,
            attackerName: attacker.driver.name,
            defenderName: defender.driver.name,
            lap: lap,
            severity: 'INFO',
            message: messages[Math.floor(Math.random() * messages.length)]
        };
    }

    /**
     * Generate pit stop event
     */
    function createPitStopEvent(car, newCompound, stopTime, lap) {
        return {
            type: EVENT_TYPES.PIT_STOP,
            carId: car.id,
            driver: car.driver.name,
            team: car.team.name,
            compound: newCompound,
            stopTime: stopTime,
            lap: lap,
            severity: 'INFO',
            message: `${car.driver.name} pits for ${getCompoundById(newCompound).name}s (${stopTime.toFixed(1)}s)`
        };
    }

    /**
     * Generate safety car event
     */
    function createSafetyCarEvent(reason, duration, lap) {
        return {
            type: EVENT_TYPES.SAFETY_CAR,
            reason: reason,
            duration: duration,
            lap: lap,
            severity: 'WARNING',
            message: reason === 'crash'
                ? 'SAFETY CAR DEPLOYED - Incident on track'
                : 'SAFETY CAR DEPLOYED - Debris on circuit'
        };
    }

    /**
     * Generate fastest lap event
     */
    function createFastestLapEvent(car, lapTime, lap) {
        return {
            type: EVENT_TYPES.FASTEST_LAP,
            carId: car.id,
            driver: car.driver.name,
            team: car.team.name,
            time: lapTime,
            lap: lap,
            severity: 'INFO',
            message: `Fastest lap! ${car.driver.name} - ${formatLapTime(lapTime)}`
        };
    }

    /**
     * Generate weather change event
     */
    function createWeatherChangeEvent(from, to, lap) {
        const fromWeather = WeatherSystem.WEATHER_STATES[from];
        const toWeather = WeatherSystem.WEATHER_STATES[to];
        return {
            type: EVENT_TYPES.WEATHER_CHANGE,
            from: from,
            to: to,
            lap: lap,
            severity: 'WARNING',
            message: `Weather change: ${fromWeather.name} → ${toWeather.name}`
        };
    }

    /**
     * Apply event effects to a car
     */
    function applyEventEffects(car, event) {
        if (!event.effects) return;

        if (event.effects.dnf) {
            car.status = 'DNF';
            car.dnfReason = event.message;
        }

        if (event.effects.timePenalty) {
            car.pendingTimePenalty = (car.pendingTimePenalty || 0) + event.effects.timePenalty;
        }

        if (event.effects.forcePit) {
            car.forcedPitNextLap = true;
        }
    }

    /**
     * Get severity color for UI
     */
    function getSeverityColor(severity) {
        switch (severity) {
            case 'CRITICAL': return '#FF0033';
            case 'HIGH': return '#FF6600';
            case 'WARNING': return '#FFD700';
            case 'MEDIUM': return '#FFAA00';
            case 'LOW': return '#AAAAAA';
            case 'INFO': return '#0080FF';
            default: return '#FFFFFF';
        }
    }

    return {
        EVENT_TYPES,
        checkCarEvents,
        checkSafetyCarTrigger,
        createOvertakeEvent,
        createPitStopEvent,
        createSafetyCarEvent,
        createFastestLapEvent,
        createWeatherChangeEvent,
        applyEventEffects,
        getSeverityColor
    };
})();