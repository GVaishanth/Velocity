/* ============================================
   VELOCITY — LAP CALCULATOR (FIXED)
   Calculates realistic lap times based on:
   - Driver skill, car stats, tire condition,
     weather, fuel, slipstream, DRS, mode
   Applies 75% skill / 25% random rule
   FIXED: Hard clamps prevent impossible values
   ============================================ */

const LapCalculator = (() => {

    const SKILL_WEIGHT = 0.75;
    const RANDOM_WEIGHT = 0.25;

    /**
     * Calculate a single lap time for a car
     * Safety clamps prevent absurd values
     */
    function calculateLapTime(car, track, weatherState, raceContext = {}) {
        const driver = car.driver;
        const carStats = car.carStats;
        const tireState = car.tireState;
        const drivingMode = car.drivingMode || 'STANDARD';

        // Base performance score (0-100 scale)
        let performanceScore = calculatePerformanceScore(driver, carStats);

        // Calculate tire impact (clamp to safe range)
        const tireImpactRaw = TireModel.getLapTimeImpact(tireState, driver, weatherState.current, drivingMode);
        const safeTireImpact = Math.max(-2, Math.min(15, tireImpactRaw || 0));

        // Apply weather effects
        const weatherEffect = calculateWeatherEffect(weatherState, driver);
        performanceScore *= weatherEffect.performanceMult;

        // Apply driving mode
        const modeEffect = calculateModeEffect(drivingMode);
        performanceScore *= modeEffect.performanceMult;

        // CLAMP performance score to prevent extreme values
        performanceScore = Math.max(40, Math.min(105, performanceScore));

        // Calculate base lap time from performance
        const baseLapTime = track.baseLapTime || 90;
        let lapTime = baseLapTime - ((performanceScore - 70) * 0.18);

        // Add tire wear penalty (already clamped)
        lapTime += safeTireImpact;

        // Add weather time penalty (clamp negative penalties)
        lapTime += Math.max(0, weatherEffect.timePenalty || 0);

        // Apply driving mode time modifier
        lapTime += modeEffect.timeModifier;

        // Upgraded competitive calculations: Affected by driver's aggression level set by player and Boost button
        const playerAggression = car.strategy?.aggression !== undefined ? car.strategy.aggression : (car.ai?.personality?.aggression ? Math.round(car.ai.personality.aggression * 10) : 5);
        const aggressionImpact = (5 - playerAggression) * 0.35; // At 10, shaves exactly 1.75 seconds per lap
        lapTime += aggressionImpact;

        if (car.overtakeBoostActive) {
            lapTime -= 3.2; // Transcendent blistering ERS Overtake Boost!
        }

        if (car.isPlayer) {
            lapTime -= 0.8; // Competitive human constructor pace alignment
        }

        // Fuel load effect removed (pointless)
        const fuelPenalty = 0;
        lapTime += fuelPenalty;

        // Slipstream / DRS bonus
        if (raceContext.hasSlipstream) {
            lapTime -= 0.4;
        }
        if (raceContext.hasDRS) {
            lapTime -= 0.6;
        }

        // Dirty air penalty
        if (raceContext.inDirtyAir) {
            lapTime += 0.3;
        }

        // Apply randomness (tighter than before)
        const randomVariance = (Math.random() - 0.5) * 1.2;
        lapTime += randomVariance;

        // Driver consistency variance
        const consistencyMult = 1 - ((driver.stats.consistency - 50) / 100) * 0.4;
        const consistencyVariance = (Math.random() - 0.5) * 0.5 * consistencyMult;
        lapTime += consistencyVariance;

        // HARD floor and ceiling — prevents impossible values
        const minLapTime = baseLapTime * 0.92;
        const maxLapTime = baseLapTime * 1.35;
        lapTime = Math.max(minLapTime, Math.min(maxLapTime, lapTime));

        // Final safety: NaN check
        if (isNaN(lapTime) || !isFinite(lapTime)) {
            lapTime = baseLapTime;
        }

        return {
            time: lapTime,
            sectors: distributeSectorTimes(lapTime),
            performanceScore: performanceScore
        };
    }

    /**
     * Calculate driver/car performance score (0-100)
     */
    function calculatePerformanceScore(driver, carStats) {
        if (!driver || !driver.stats || !carStats) return 70;

        const driverPace = driver.stats.pace || 70;
        const driverConsistency = driver.stats.consistency || 70;
        const driverRacecraft = driver.stats.racecraft || 70;
        const driverExperience = driver.stats.experience || 70;

        const driverScore =
            (driverPace * 0.45) +
            (driverConsistency * 0.20) +
            (driverRacecraft * 0.20) +
            (driverExperience * 0.15);

        const carScore =
            ((carStats.aerodynamics || 70) * 0.25) +
            ((carStats.powerUnit || 70) * 0.25) +
            ((carStats.mechanicalGrip || 70) * 0.20) +
            ((carStats.tireManagement || 70) * 0.10) +
            ((carStats.cooling || 70) * 0.10) +
            ((carStats.reliability || 70) * 0.10);

        return (driverScore * 0.50) + (carScore * 0.50);
    }

    /**
     * Calculate weather impact on lap time
     */
    function calculateWeatherEffect(weatherState, driver) {
        const weather = WeatherSystem.WEATHER_STATES[weatherState.current];
        let performanceMult = weather.gripModifier || 1.0;
        let timePenalty = 0;

        const wetSkill = driver.stats?.wetSkill || 75;

        switch (weatherState.current) {
            case 'LIGHT_RAIN':
                timePenalty = 2.5;
                const wetBonus1 = (wetSkill - 75) / 100 * 1.5;
                timePenalty -= wetBonus1;
                if (driver.traits?.includes('WET_MASTER')) timePenalty -= 0.8;
                break;
            case 'HEAVY_RAIN':
                timePenalty = 6.0;
                const wetBonus2 = (wetSkill - 75) / 100 * 3;
                timePenalty -= wetBonus2;
                if (driver.traits?.includes('WET_MASTER')) timePenalty -= 1.5;
                break;
            case 'DRYING':
                timePenalty = 1.5;
                break;
            case 'CLOUDY':
                timePenalty = 0.1;
                break;
        }

        // Clamp time penalty
        timePenalty = Math.max(0, Math.min(10, timePenalty));

        return { performanceMult, timePenalty };
    }

    /**
     * Calculate driving mode effect
     */
    function calculateModeEffect(mode) {
        switch (mode) {
            case 'PUSH':
                return { performanceMult: 1.05, timeModifier: -0.5 };
            case 'CONSERVE':
                return { performanceMult: 0.97, timeModifier: 0.6 };
            case 'OVERTAKE_BOOST':
                return { performanceMult: 1.10, timeModifier: -1.2 };
            case 'STANDARD':
            default:
                return { performanceMult: 1.0, timeModifier: 0 };
        }
    }

    /**
     * Calculate fuel weight penalty (removed)
     */
    function calculateFuelPenalty(raceContext) {
        return 0;
    }

    /**
     * Distribute lap time into 3 sectors
     */
    function distributeSectorTimes(lapTime) {
        if (isNaN(lapTime) || lapTime <= 0) {
            return [30, 40, 30];
        }
        const s1 = lapTime * (0.30 + (Math.random() - 0.5) * 0.03);
        const s2 = lapTime * (0.40 + (Math.random() - 0.5) * 0.03);
        const s3 = lapTime - s1 - s2;
        return [s1, s2, s3];
    }

    /**
     * Calculate a qualifying lap
     */
    function calculateQualiLap(car, track, weatherState) {
        const driver = car.driver;
        const carStats = car.carStats;

        const performanceScore =
            ((driver.stats?.pace || 70) * 0.50) +
            ((driver.stats?.consistency || 70) * 0.10) +
            ((carStats.aerodynamics || 70) * 0.20) +
            ((carStats.powerUnit || 70) * 0.20);

        let lapTime = (track.baseLapTime - 2) - ((performanceScore - 70) * 0.20);

        if (weatherState.current === 'LIGHT_RAIN') lapTime += 3;
        if (weatherState.current === 'HEAVY_RAIN') lapTime += 7;

        if (driver.traits?.includes('QUALIFYING_SPECIALIST')) {
            lapTime -= 0.4;
        }

        lapTime += (Math.random() - 0.5) * 1.0;

        const minLapTime = track.baseLapTime * 0.90;
        const maxLapTime = track.baseLapTime * 1.10;
        return Math.max(minLapTime, Math.min(maxLapTime, lapTime));
    }

    /**
     * Determine if a car can overtake another
     */
    function calculateOvertakeChance(attackingCar, defendingCar, track) {
        if (!attackingCar || !defendingCar || !track) return 0;

        const paceGap = attackingCar.lastLapTime
            ? defendingCar.lastLapTime - attackingCar.lastLapTime
            : 0;

        let chance = Math.max(0, Math.min(0.4, paceGap * 0.15));

        const trackMod = (11 - (track.overtakingDifficulty || 5)) / 10;
        chance *= trackMod;

        const attackerRC = attackingCar.driver?.stats?.racecraft || 70;
        const defenderRC = defendingCar.driver?.stats?.racecraft || 70;
        const racecraftDiff = (attackerRC - defenderRC) / 100;
        chance += racecraftDiff * 0.2;

        if (attackingCar.driver?.traits?.includes('OVERTAKER')) chance += 0.15;
        if (defendingCar.driver?.traits?.includes('DEFENDER')) chance -= 0.12;

        if (attackingCar.hasDRS) chance += 0.2;

        if (attackingCar.tireState && defendingCar.tireState) {
            const tireDiff = (attackingCar.tireState.currentGrip - defendingCar.tireState.currentGrip);
            chance += tireDiff * 0.5;
        }

        return Math.max(0, Math.min(0.85, chance));
    }

    return {
        calculateLapTime,
        calculateQualiLap,
        calculatePerformanceScore,
        calculateOvertakeChance,
        distributeSectorTimes
    };
})();