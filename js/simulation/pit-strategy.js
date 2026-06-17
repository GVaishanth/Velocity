/* ============================================
   VELOCITY — PIT STRATEGY
   Decides when to pit, what tires to use,
   handles undercut/overcut tactics
   ============================================ */

window.PitStrategy = (() => {

    /**
     * Create a strategy plan for a car at race start
     */
    function createStrategyPlan(car, track, weatherState, preferences = {}) {
        const aggression = preferences.aggression || 5; // 1-10
        const targetStops = preferences.targetStops || calculateOptimalStops(track, weatherState);

        const plan = {
            type: getStrategyType(targetStops, aggression),
            targetStops: targetStops,
            stints: generateStints(track, weatherState, targetStops, aggression),
            currentStintIndex: 0,
            adaptable: true,
            lastDecisionLap: 0
        };

        return plan;
    }

    /**
     * Calculate optimal number of pit stops for a race
     */
    function calculateOptimalStops(track, weatherState) {
        // Wet races usually need more stops
        if (weatherState.current === 'HEAVY_RAIN' || weatherState.current === 'LIGHT_RAIN') {
            return 2;
        }

        const raceLength = track.laps;
        const tireDeg = track.tireDegradation || 5;

        // High degradation tracks need more stops
        if (tireDeg >= 8 && raceLength > 50) return 2;
        if (tireDeg >= 7 && raceLength > 60) return 2;
        if (raceLength > 65) return 2;

        return 1;
    }

    /**
     * Generate stint plan based on target stops
     */
    function generateStints(track, weatherState, targetStops, aggression) {
        const raceLength = track.laps;

        if (weatherState.current === 'HEAVY_RAIN') {
            return [{ compound: 'WET', plannedLaps: raceLength }];
        }
        if (weatherState.current === 'LIGHT_RAIN') {
            return [{ compound: 'INTERMEDIATE', plannedLaps: raceLength }];
        }

        // Dry race
        if (targetStops === 1) {
            // One stop - aggressive or conservative
            if (aggression >= 7) {
                return [
                    { compound: 'SOFT', plannedLaps: Math.floor(raceLength * 0.35) },
                    { compound: 'HARD', plannedLaps: Math.ceil(raceLength * 0.65) }
                ];
            } else {
                return [
                    { compound: 'MEDIUM', plannedLaps: Math.floor(raceLength * 0.45) },
                    { compound: 'HARD', plannedLaps: Math.ceil(raceLength * 0.55) }
                ];
            }
        }

        // Two stops
        if (aggression >= 7) {
            return [
                { compound: 'SOFT', plannedLaps: Math.floor(raceLength * 0.25) },
                { compound: 'SOFT', plannedLaps: Math.floor(raceLength * 0.35) },
                { compound: 'MEDIUM', plannedLaps: Math.ceil(raceLength * 0.40) }
            ];
        } else {
            return [
                { compound: 'MEDIUM', plannedLaps: Math.floor(raceLength * 0.33) },
                { compound: 'MEDIUM', plannedLaps: Math.floor(raceLength * 0.33) },
                { compound: 'HARD', plannedLaps: Math.ceil(raceLength * 0.34) }
            ];
        }
    }

    /**
     * Determine strategy type label
     */
    function getStrategyType(stops, aggression) {
        const aggressive = aggression >= 7;
        if (stops === 0) return 'No-Stop (Wet)';
        if (stops === 1) return aggressive ? 'Aggressive 1-Stop' : 'Conservative 1-Stop';
        if (stops === 2) return aggressive ? 'Aggressive 2-Stop' : 'Standard 2-Stop';
        return 'Multi-Stop';
    }

    /**
     * Should this car pit on this lap? (called by AI driver)
     */
    function shouldPitNow(car, raceState, weatherState) {
        const tireState = car.tireState;
        const strategy = car.strategy;

        // Forced pit
        if (car.forcedPitNextLap) return { pit: true, reason: 'forced' };

        // Tire dead - must pit immediately
        if (tireState.isWornOut) return { pit: true, reason: 'tires_dead' };

        // Wrong compound for weather
        if (TireModel.isWrongCompoundForWeather(tireState, weatherState.current)) {
            return { pit: true, reason: 'wrong_compound' };
        }

        // Weather change imminent
        if (weatherState.changeInLaps && weatherState.changeInLaps <= 3) {
            const upcomingWeather = weatherState.changeWarning;
            const willNeedDifferentTire =
                (upcomingWeather === 'HEAVY_RAIN' && !['WET'].includes(tireState.compoundId)) ||
                (upcomingWeather === 'LIGHT_RAIN' && !['INTERMEDIATE', 'WET'].includes(tireState.compoundId));
            if (willNeedDifferentTire) {
                return { pit: true, reason: 'weather_change' };
            }
        }

        // Safety car opportunity
        if (raceState.status === 'SAFETY_CAR' && tireState.lapsOnTire >= 6) {
            const compound = getCompoundById(tireState.compoundId);
            if (tireState.lapsOnTire >= compound.peakLap + 2) {
                return { pit: true, reason: 'safety_car_opportunity' };
            }
        }

        // Approaching tire cliff - pit before it falls off
        if (tireState.isInCliff) {
            const remaining = raceState.totalLaps - raceState.currentLap;
            if (remaining > 3) {
                return { pit: true, reason: 'cliff_approaching' };
            }
        }

        // Strategy plan trigger - follow the plan
        if (strategy && strategy.stints) {
            const currentStint = strategy.stints[strategy.currentStintIndex];
            if (currentStint && tireState.lapsOnTire >= currentStint.plannedLaps) {
                const remaining = raceState.totalLaps - raceState.currentLap;
                if (remaining > 5) {
                    return { pit: true, reason: 'strategy' };
                }
            }
        }

        // Additional check: high tire wear even without strategy
        if (tireState.wearPercent > 75) {
            const remaining = raceState.totalLaps - raceState.currentLap;
            if (remaining > 5) {
                return { pit: true, reason: 'high_wear' };
            }
        }

        // Undercut opportunity
        if (shouldAttemptUndercut(car, raceState)) {
            return { pit: true, reason: 'undercut' };
        }

        return { pit: false };
    }

    /**
     * Decide if undercut is worth attempting
     * Pit early to gain track position via fresher tires
     */
    function shouldAttemptUndercut(car, raceState) {
        if (!car.tireState) return false;

        const compound = getCompoundById(car.tireState.compoundId);
        if (!compound) return false;

        // Need to be past peak performance to consider undercut
        if (car.tireState.lapsOnTire < compound.peakLap + 5) return false;

        // Need to be close to car ahead (within 2 seconds)
        const carAhead = raceState.cars[car.position - 2]; // position is 1-indexed
        if (!carAhead) return false;

        const gapAhead = car.totalRaceTime - carAhead.totalRaceTime;
        if (Math.abs(gapAhead) > 2.5) return false;

        // Strategist trait check
        const strategist = car.team?.strategist;
        if (strategist?.traits?.includes('UNDERCUT_MASTER')) {
            return Math.random() < 0.35;
        }

        // Random chance based on strategy
        return Math.random() < 0.15;
    }

    /**
     * Choose what compound to put on at next pit stop
     */
    function chooseNextCompound(car, raceState, weatherState) {
        const strategy = car.strategy;
        const lapsRemaining = raceState.totalLaps - raceState.currentLap;

        // Weather-driven choice
        if (weatherState.current === 'HEAVY_RAIN') return 'WET';
        if (weatherState.current === 'LIGHT_RAIN') return 'INTERMEDIATE';

        // Weather changing soon
        if (weatherState.changeInLaps && weatherState.changeInLaps <= 5) {
            const upcoming = weatherState.changeWarning;
            if (upcoming === 'HEAVY_RAIN') return 'WET';
            if (upcoming === 'LIGHT_RAIN') return 'INTERMEDIATE';
            if (upcoming === 'DRYING') return 'INTERMEDIATE';
        }

        // Follow strategy plan if available
        if (strategy && strategy.stints) {
            const nextStintIndex = strategy.currentStintIndex + 1;
            const nextStint = strategy.stints[nextStintIndex];
            if (nextStint && lapsRemaining > 5) {
                // Verify compound is sensible for remaining laps
                const compound = getCompoundById(nextStint.compound);
                if (lapsRemaining < compound.cliffLap * 0.5) {
                    // Too short for this compound, use a faster one
                    return chooseCompoundForShortStint(lapsRemaining);
                }
                return nextStint.compound;
            }
        }

        // Mandatory compound rule: must use 2 different compounds (dry race)
        if (!weatherState.isWet && !TireModel.hasUsedTwoCompounds(car.tireState)) {
            const currentCompound = car.tireState.compoundId;
            // Force a different compound
            const alternatives = ['SOFT', 'MEDIUM', 'HARD'].filter(c => c !== currentCompound);
            if (lapsRemaining < 15) return 'SOFT';
            if (lapsRemaining < 30) return 'MEDIUM';
            return alternatives.includes('HARD') ? 'HARD' : 'MEDIUM';
        }

        // Default: pick based on remaining race
        return chooseCompoundForRemaining(lapsRemaining);
    }

    /**
     * Pick compound for short stint
     */
    function chooseCompoundForShortStint(lapsRemaining) {
        if (lapsRemaining <= 10) return 'SOFT';
        if (lapsRemaining <= 20) return 'MEDIUM';
        return 'MEDIUM';
    }

    /**
     * Pick compound for remaining race distance
     */
    function chooseCompoundForRemaining(lapsRemaining) {
        if (lapsRemaining <= 14) return 'SOFT';
        if (lapsRemaining <= 28) return 'MEDIUM';
        return 'HARD';
    }

    /**
     * Calculate the time loss of a pit stop
     */
    function calculateTotalPitTime(car, track) {
        const pitCrew = car.team?.staff?.pitCrew || car.team?.pitCrew;
        const pitLanePenalty = track.pitLanePenalty || 18; // default time loss
        return calculatePitStopTime(pitCrew, pitLanePenalty);
    }

    /**
     * Execute the pit stop on a car
     */
    function executePitStop(car, newCompound, raceState, track) {
        const stopTime = calculateTotalPitTime(car, track);

        // Add time to car's race time
        car.totalRaceTime += stopTime;

        // Pit the tires (resets tire state)
        TireModel.pitStop(car.tireState, newCompound, raceState.currentLap);

        // Update strategy index
        if (car.strategy && car.strategy.currentStintIndex < car.strategy.stints.length - 1) {
            car.strategy.currentStintIndex++;
        }

        // Clear forced pit flag
        car.forcedPitNextLap = false;

        // Create event
        const event = EventSystem.createPitStopEvent(car, newCompound, stopTime, raceState.currentLap);

        return { stopTime, event };
    }

    /**
     * Estimate gap loss/gain from pitting
     * Used by AI to decide undercut viability
     */
    function estimatePitLossGain(car, track, weatherState) {
        const pitLoss = calculateTotalPitTime(car, track);

        // Fresh tire advantage per lap (varies by compound)
        const freshTireGain = 1.5; // seconds per lap typically
        const lapsToRecoverPitLoss = pitLoss / freshTireGain;

        return {
            pitLoss: pitLoss,
            lapsToRecoverPitLoss: Math.ceil(lapsToRecoverPitLoss),
            isWorthwhile: lapsToRecoverPitLoss < 8
        };
    }

    /**
     * Get pit strategy summary for UI
     */
    function getStrategySummary(car) {
        const strategy = car.strategy;
        if (!strategy) return 'No strategy set';

        const stopsRemaining = strategy.stints.length - 1 - strategy.currentStintIndex;
        return {
            type: strategy.type,
            stopsRemaining: stopsRemaining,
            currentStintLap: car.tireState.lapsOnTire,
            plannedStintLength: strategy.stints[strategy.currentStintIndex]?.plannedLaps || 0,
            nextCompound: strategy.stints[strategy.currentStintIndex + 1]?.compound || 'TBD'
        };
    }

    /**
     * Get reason explanation for radio
     */
    function getPitReasonRadio(reason) {
        const messages = {
            forced: 'Box this lap, forced pit stop',
            tires_dead: 'Box box! Tires are gone',
            wrong_compound: 'Box this lap, wrong tires for these conditions',
            weather_change: 'Box for weather tires',
            safety_car_opportunity: 'Box now, safety car opportunity',
            cliff_approaching: 'Box this lap, tires falling off',
            strategy: 'Box this lap, scheduled stop',
            undercut: 'Box this lap, going for the undercut'
        };
        return messages[reason] || 'Box this lap';
    }

    return {
        createStrategyPlan,
        calculateOptimalStops,
        getStrategyType,
        shouldPitNow,
        chooseNextCompound,
        executePitStop,
        calculateTotalPitTime,
        estimatePitLossGain,
        getStrategySummary,
        getPitReasonRadio
    };
})();