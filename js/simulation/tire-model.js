/* ============================================
   VELOCITY — TIRE MODEL
   Live tire state tracking and wear simulation
   Wraps the static tire compound data into
   dynamic per-car tire instances
   ============================================ */

window.TireModel = (() => {

    /**
     * Create a new tire state for a car
     * Each car has one TireState instance that tracks its current tires
     */
    function createTireState(compoundId = 'MEDIUM') {
        return {
            compoundId: compoundId,
            lapsOnTire: 0,
            totalDistance: 0,
            currentGrip: 1.0,
            currentTemp: 80,    // Celsius, optimal range 90-110
            heatBuildUp: 0,
            wearPercent: 0,
            _exactWear: 0,      // True physical IRL cumulative wear tread depth
            isWornOut: false,
            isInCliff: false,
            history: [],        // Each pit stop adds an entry
            stintStartLap: 0
        };
    }

    /**
     * True Real Life (IRL) cumulative physical tire degradation engine
     * Accurately tracks tread scrubbed off and models Pirelli F1 cliff curves
     */
    function updateLap(tireState, driver, weather, drivingMode = 'STANDARD', trackTemp = 35) {
        tireState.lapsOnTire++;

        const compound = getCompoundById(tireState.compoundId);
        if (!compound) return;

        const tireSkill = driver?.stats?.tireManagement || 75;

        // Scrubbing rate multiplier based on engine mode and driving style
        let wearMultiplier = 1.0;
        if (drivingMode === 'PUSH') wearMultiplier = 1.4;
        else if (drivingMode === 'CONSERVE') wearMultiplier = 0.7;

        // Track Temp impact on wear (Base 35°C)
        const tempWearMod = 1.0 + (trackTemp - 35) * 0.015; // 1.5% more wear per degree above 35
        wearMultiplier *= Math.max(0.5, tempWearMod);

        if (driver?.traits?.includes('TIRE_WHISPERER')) wearMultiplier *= 0.8;
        if (driver?.traits?.includes('SMOOTH')) wearMultiplier *= 0.9;
        if (driver?.traits?.includes('AGGRESSIVE')) wearMultiplier *= 1.15;

        // True physical IRL wear depth scrubbed off per lap
        const baseWearPerLap = 100 / (compound.deathLap || 25);
        const skillPreservation = 1 - ((tireSkill - 50) / 100) * 0.35;
        const wearLapIncrement = baseWearPerLap * wearMultiplier * skillPreservation;

        // Accumulate physical wear definitively
        tireState._exactWear = (tireState._exactWear || 0) + wearLapIncrement;
        tireState.wearPercent = Math.min(100, Math.round(tireState._exactWear));

        // IRL Grip performance matrix
        const wearFraction = tireState._exactWear / 100;
        let performance = 1.0;
        if (wearFraction < 0.08) {
            // Warmup out-lap window
            performance = 0.92 + (compound.peakGrip - 0.92) * (wearFraction / 0.08);
        } else if (wearFraction < 0.75) {
            // Peak optimal to Cliff edge
            const degradation = (wearFraction - 0.08) * 0.25;
            performance = compound.peakGrip - degradation;
        } else if (wearFraction < 1.0) {
            // Pirelli F1 Cliff drop-off window
            const cliffPenalty = 0.18 + (wearFraction - 0.75) * 1.6;
            performance = (compound.peakGrip - 0.16) - cliffPenalty;
        } else {
            // Structural tire failure / completely completely scrubbed
            performance = 0.35;
        }

        // Apply dynamic weather suitability
        const weatherMult = compound.weatherSuitability?.[weather] || 0.8;
        tireState.currentGrip = Math.max(0.3, performance * weatherMult);

        // Definitive IRL status thresholds
        tireState.isInCliff = tireState.wearPercent >= 75;
        tireState.isWornOut = tireState.wearPercent >= 100;

        // Temperature simulation
        updateTireTemperature(tireState, drivingMode, weather);

        return tireState;
    }

    /**
     * Update tire temperature based on driving style and weather
     * Optimal range: 90-110°C
     */
    function updateTireTemperature(tireState, drivingMode, weather, trackTemp = 35) {
        const optimalTemp = 100;
        let targetTemp = optimalTemp + (trackTemp - 35) * 0.5; // Track temp shifts target

        // Driving mode affects target temp
        if (drivingMode === 'PUSH') targetTemp += 15;
        if (drivingMode === 'CONSERVE') targetTemp -= 10;

        // Weather affects target temp
        if (weather === 'LIGHT_RAIN') targetTemp -= 20;
        if (weather === 'HEAVY_RAIN') targetTemp -= 35;

        // Gradual temperature change toward target
        const diff = targetTemp - tireState.currentTemp;
        tireState.currentTemp += diff * 0.25;

        // Temperature affects grip slightly
        if (tireState.currentTemp < 80) {
            tireState.currentGrip *= 0.95; // cold tires
        } else if (tireState.currentTemp > 120) {
            tireState.currentGrip *= 0.92; // overheating
        }
    }

    /**
     * Reset tire state after a pit stop
     * Records old stint to history
     */
    function pitStop(tireState, newCompoundId, currentLap) {
        // Save old stint to history
        tireState.history.push({
            compoundId: tireState.compoundId,
            laps: tireState.lapsOnTire,
            stintStartLap: tireState.stintStartLap,
            endLap: currentLap,
            finalGrip: tireState.currentGrip,
            finalWear: tireState.wearPercent
        });

        // Reset to fresh tires
        tireState.compoundId = newCompoundId;
        tireState.lapsOnTire = 0;
        tireState.currentGrip = 0.92; // out-lap warmup grip
        tireState.currentTemp = 75;    // cool from pit lane
        tireState.heatBuildUp = 0;
        tireState.wearPercent = 0;
        tireState._exactWear = 0;
        tireState.isWornOut = false;
        tireState.isInCliff = false;
        tireState.stintStartLap = currentLap;
    }

    /**
     * Get current tire performance (grip multiplier)
     */
    function getCurrentGrip(tireState) {
        return tireState.currentGrip || 1.0;
    }

    /**
     * Get lap time impact in seconds
     */
    function getLapTimeImpact(tireState) {
        // Return impact based on current wear and grip
        const wear = tireState.wearPercent || 0;
        
        if (wear < 10) return 0; // Fresh tire
        if (wear < 50) return (wear - 10) * 0.02; // Minor deg
        if (wear < 75) return 0.8 + (wear - 50) * 0.08; // Noticeable deg
        
        // The Cliff
        return 2.8 + (wear - 75) * 0.4;
    }

    /**
     * Get tire condition info for UI display
     */
    function getDisplayInfo(tireState) {
        const compound = getCompoundById(tireState.compoundId);
        
        let label = 'New';
        let color = '#00FF41';
        const wear = tireState.wearPercent;

        if (wear > 90) { label = 'Dead'; color = '#FF0033'; }
        else if (wear > 75) { label = 'Cliff'; color = '#FF6600'; }
        else if (wear > 50) { label = 'Worn'; color = '#FFD700'; }
        else if (wear > 25) { label = 'Used'; color = '#AAFF00'; }

        return {
            compound: compound,
            compoundName: compound.name,
            compoundShort: compound.shortName,
            compoundColor: compound.color,
            displayColor: compound.displayColor,
            lapsOnTire: tireState.lapsOnTire,
            wearPercent: tireState.wearPercent,
            condition: label,
            conditionColor: color,
            grip: Math.round(tireState.currentGrip * 100),
            temp: tireState.currentTemp.toFixed(1),
            isInCliff: tireState.isInCliff,
            isWornOut: tireState.isWornOut
        };
    }

    /**
     * Determine if pit stop is urgently needed
     */
    function needsPitStop(tireState, lapsRemaining) {
        const compound = getCompoundById(tireState.compoundId);
        if (!compound) return false;

        // Dead tires = MUST pit
        if (tireState.isWornOut) return true;

        // Approaching cliff with laps remaining
        if (tireState.isInCliff && lapsRemaining > 3) return true;

        // Wrong tires for weather (handled elsewhere)
        return false;
    }

    /**
     * Suggest best compound for the rest of the race
     */
    function suggestCompoundForRest(weather, lapsRemaining, hasUsedHard = false, hasUsedSoft = false) {
        if (weather === 'HEAVY_RAIN') return 'WET';
        if (weather === 'LIGHT_RAIN') return 'INTERMEDIATE';

        // Dry conditions
        if (lapsRemaining <= 12) return 'SOFT';
        if (lapsRemaining <= 28) return 'MEDIUM';
        return 'HARD';
    }

    /**
     * Check if tires are mismatched to weather (need urgent pit)
     */
    function isWrongCompoundForWeather(tireState, weather) {
        const compound = tireState.compoundId;

        if (weather === 'HEAVY_RAIN' && (compound === 'SOFT' || compound === 'MEDIUM' || compound === 'HARD')) {
            return true;
        }
        if (weather === 'LIGHT_RAIN' && compound !== 'INTERMEDIATE' && compound !== 'WET') {
            return true;
        }
        if (weather === 'DRY' && (compound === 'INTERMEDIATE' || compound === 'WET')) {
            return true;
        }
        return false;
    }

    /**
     * Calculate stint progress (0.0 - 1.0)
     */
    function getStintProgress(tireState) {
        const compound = getCompoundById(tireState.compoundId);
        if (!compound) return 0;
        return Math.min(1, tireState.lapsOnTire / compound.cliffLap);
    }

    /**
     * Get tire warning message (for team radio)
     */
    function getTireRadioMessage(tireState) {
        if (tireState.isWornOut) {
            return { text: 'TIRES DEAD! BOX BOX BOX!', priority: 'critical' };
        }
        if (tireState.isInCliff) {
            return { text: 'Tires falling off the cliff, recommend pit', priority: 'warning' };
        }

        const compound = getCompoundById(tireState.compoundId);
        const lapsToCliff = compound.cliffLap - tireState.lapsOnTire;

        if (lapsToCliff <= 3) {
            return { text: 'Tires getting tired, pit window opening', priority: 'warning' };
        }
        if (lapsToCliff <= 7) {
            return { text: 'Tires in good shape, monitoring degradation', priority: 'info' };
        }
        if (tireState.lapsOnTire < compound.peakLap) {
            return { text: 'Tires warming up, bring them in gently', priority: 'info' };
        }
        return { text: 'Tires feeling strong, push when ready', priority: 'positive' };
    }

    /**
     * Count total pit stops made
     */
    function getPitStopCount(tireState) {
        return tireState.history.length;
    }

    /**
     * Get list of compounds used
     */
    function getCompoundsUsed(tireState) {
        const used = tireState.history.map(h => h.compoundId);
        used.push(tireState.compoundId);
        return [...new Set(used)];
    }

    /**
     * Check if mandatory rule satisfied (must use 2 different compounds in dry race)
     */
    function hasUsedTwoCompounds(tireState) {
        return getCompoundsUsed(tireState).length >= 2;
    }

    /**
     * Calculate average stint length
     */
    function getAverageStintLength(tireState) {
        if (tireState.history.length === 0) return tireState.lapsOnTire;
        const totalLaps = tireState.history.reduce((sum, h) => sum + h.laps, 0) + tireState.lapsOnTire;
        return Math.round(totalLaps / (tireState.history.length + 1));
    }

    /**
     * Reset tire state for new race
     */
    function resetForNewRace(tireState, startingCompound = 'MEDIUM') {
        tireState.compoundId = startingCompound;
        tireState.lapsOnTire = 0;
        tireState.totalDistance = 0;
        tireState.currentGrip = 0.95;
        tireState.currentTemp = 80;
        tireState.heatBuildUp = 0;
        tireState.wearPercent = 0;
        tireState._exactWear = 0;
        tireState.isWornOut = false;
        tireState.isInCliff = false;
        tireState.history = [];
        tireState.stintStartLap = 0;
    }

    /**
     * Simulate tire failure chance (puncture, blowout)
     * Very rare but adds drama
     */
    function checkTireFailure(tireState, randomFactor = Math.random()) {
        const compound = getCompoundById(tireState.compoundId);
        if (!compound) return false;

        // Only possible when tires are heavily worn
        if (tireState.wearPercent < 85) return false;

        // Base chance per lap when in extreme wear
        const failureChance = (tireState.wearPercent - 85) / 1000;

        return randomFactor < failureChance;
    }

    /* ===== PUBLIC API ===== */

    return {
        createTireState,
        updateLap,
        pitStop,
        getCurrentGrip,
        getLapTimeImpact,
        getDisplayInfo,
        needsPitStop,
        suggestCompoundForRest,
        isWrongCompoundForWeather,
        getStintProgress,
        getTireRadioMessage,
        getPitStopCount,
        getCompoundsUsed,
        hasUsedTwoCompounds,
        getAverageStintLength,
        resetForNewRace,
        checkTireFailure
    };
})();