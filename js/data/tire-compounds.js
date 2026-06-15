/* ============================================
   VELOCITY — TIRE COMPOUNDS DATA
   Realistic tire performance modeling with
   degradation curves, grip levels, and
   weather suitability
   ============================================ */

/* TIRE COMPOUND DEFINITIONS
   Each compound has unique characteristics:
   - peakGrip: max performance multiplier
   - peakLap: lap when grip is maximum
   - cliffLap: lap when performance drops sharply
   - deathLap: lap when tire is unusable
   - degradationRate: how fast grip is lost per lap
   - weatherSuitability: { dry, light_rain, heavy_rain }
*/

const TIRE_COMPOUNDS = {
    SOFT: {
        id: 'SOFT',
        name: 'Soft',
        shortName: 'S',
        color: '#FF3333',
        displayColor: 'tire-soft',
        symbol: 'S',
        peakGrip: 1.05,
        peakLap: 3,
        cliffLap: 15,
        deathLap: 22,
        degradationRate: 0.018,
        lapTimeBonus: -0.6,
        weatherSuitability: {
            DRY: 1.0,
            LIGHT_RAIN: 0.4,
            HEAVY_RAIN: 0.15
        },
        description: 'Highest peak grip but degrades quickly. Best for qualifying and short stints.'
    },
    MEDIUM: {
        id: 'MEDIUM',
        name: 'Medium',
        shortName: 'M',
        color: '#FFD700',
        displayColor: 'tire-medium',
        symbol: 'M',
        peakGrip: 1.0,
        peakLap: 5,
        cliffLap: 25,
        deathLap: 32,
        degradationRate: 0.011,
        lapTimeBonus: 0.0,
        weatherSuitability: {
            DRY: 1.0,
            LIGHT_RAIN: 0.45,
            HEAVY_RAIN: 0.15
        },
        description: 'Balanced compound. The all-rounder choice for most race strategies.'
    },
    HARD: {
        id: 'HARD',
        name: 'Hard',
        shortName: 'H',
        color: '#F0F0F0',
        displayColor: 'tire-hard',
        symbol: 'H',
        peakGrip: 0.96,
        peakLap: 8,
        cliffLap: 40,
        deathLap: 50,
        degradationRate: 0.007,
        lapTimeBonus: 0.4,
        weatherSuitability: {
            DRY: 1.0,
            LIGHT_RAIN: 0.4,
            HEAVY_RAIN: 0.15
        },
        description: 'Durable but slow. Ideal for long stints and one-stop strategies.'
    },
    INTERMEDIATE: {
        id: 'INTERMEDIATE',
        name: 'Intermediate',
        shortName: 'I',
        color: '#00CC66',
        displayColor: 'tire-inter',
        symbol: 'I',
        peakGrip: 0.90,
        peakLap: 6,
        cliffLap: 28,
        deathLap: 38,
        degradationRate: 0.012,
        lapTimeBonus: 2.5,
        weatherSuitability: {
            DRY: 0.7,
            LIGHT_RAIN: 1.05,
            HEAVY_RAIN: 0.7
        },
        description: 'For damp track conditions. Effective when crossover from dry to wet.'
    },
    WET: {
        id: 'WET',
        name: 'Wet',
        shortName: 'W',
        color: '#0066FF',
        displayColor: 'tire-wet',
        symbol: 'W',
        peakGrip: 0.82,
        peakLap: 5,
        cliffLap: 25,
        deathLap: 35,
        degradationRate: 0.010,
        lapTimeBonus: 5.5,
        weatherSuitability: {
            DRY: 0.55,
            LIGHT_RAIN: 0.85,
            HEAVY_RAIN: 1.10
        },
        description: 'For heavy rain only. Massive water displacement, slow on a drying line.'
    }
};

/* COMPOUND ORDER for UI selection */
const COMPOUND_ORDER = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];
const DRY_COMPOUNDS = ['SOFT', 'MEDIUM', 'HARD'];
const WET_COMPOUNDS = ['INTERMEDIATE', 'WET'];

/* --- HELPER FUNCTIONS --- */

/**
 * Get compound by ID
 */
function getCompoundById(id) {
    if (!id) return TIRE_COMPOUNDS.MEDIUM;
    const cleanId = id.toString().toUpperCase().trim();
    return TIRE_COMPOUNDS[cleanId] || TIRE_COMPOUNDS.MEDIUM;
}

/**
 * Get all compounds as array
 */
function getAllCompounds() {
    return COMPOUND_ORDER.map(id => TIRE_COMPOUNDS[id]);
}

/**
 * Get dry-weather compounds only
 */
function getDryCompounds() {
    return DRY_COMPOUNDS.map(id => TIRE_COMPOUNDS[id]);
}

/**
 * Get wet-weather compounds only
 */
function getWetCompounds() {
    return WET_COMPOUNDS.map(id => TIRE_COMPOUNDS[id]);
}

/**
 * Calculate tire performance for a given lap on tire
 * Returns a multiplier (1.0 = baseline, >1.0 = faster, <1.0 = slower)
 *
 * @param {string} compoundId - Compound ID
 * @param {number} lapsOnTire - Laps run on this tire set
 * @param {string} weather - Current weather (DRY, LIGHT_RAIN, HEAVY_RAIN)
 * @param {number} driverTireSkill - Driver's tire management skill (0-100)
 */
function calculateTirePerformance(compoundId, lapsOnTire, weather = 'DRY', driverTireSkill = 75) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return 1.0;

    let performance;

    // PHASE 1: Warm-up (first few laps)
    if (lapsOnTire < compound.peakLap) {
        const warmupProgress = lapsOnTire / compound.peakLap;
        performance = 0.92 + (compound.peakGrip - 0.92) * warmupProgress;
    }
    // PHASE 2: Peak performance window
    else if (lapsOnTire < compound.cliffLap) {
        const wearProgress = (lapsOnTire - compound.peakLap) / (compound.cliffLap - compound.peakLap);
        // Skill modifier: better drivers preserve tires longer
        const skillFactor = 1 - ((driverTireSkill - 50) / 100) * 0.4;
        const wear = compound.degradationRate * (lapsOnTire - compound.peakLap) * skillFactor;
        performance = compound.peakGrip - wear;
    }
    // PHASE 3: Cliff zone (rapid degradation)
    else if (lapsOnTire < compound.deathLap) {
        const cliffProgress = (lapsOnTire - compound.cliffLap) / (compound.deathLap - compound.cliffLap);
        const peakAtCliff = compound.peakGrip - (compound.degradationRate * (compound.cliffLap - compound.peakLap));
        const cliffPenalty = 0.25 * cliffProgress;
        performance = peakAtCliff - cliffPenalty;
    }
    // PHASE 4: Dead tire (massive loss)
    else {
        performance = 0.55;
    }

    // Apply weather suitability
    const weatherMult = compound.weatherSuitability[weather] || 0.8;
    performance *= weatherMult;

    return Math.max(0.4, performance);
}

/**
 * Calculate lap time impact of tire wear (in seconds)
 *
 * @param {string} compoundId
 * @param {number} lapsOnTire
 * @param {string} weather
 * @param {number} driverTireSkill
 * @returns {number} Time penalty/bonus in seconds
 */
function calculateTireLapTimeImpact(compoundId, lapsOnTire, weather, driverTireSkill) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return 0;

    const performance = calculateTirePerformance(compoundId, lapsOnTire, weather, driverTireSkill);

    // Base compound bonus/penalty
    let impact = compound.lapTimeBonus;

    // Degradation impact (deviation from peak)
    const degradationLoss = (1.0 - performance) * 12; // each 1% loss = 0.12s
    impact += degradationLoss;

    return impact;
}

/**
 * Get recommended compound for current conditions
 */
function getRecommendedCompound(weather, raceLength, currentLap) {
    const remainingLaps = raceLength - currentLap;

    if (weather === 'HEAVY_RAIN') return TIRE_COMPOUNDS.WET;
    if (weather === 'LIGHT_RAIN') return TIRE_COMPOUNDS.INTERMEDIATE;

    // Dry conditions - choose based on remaining stint length
    if (remainingLaps <= 15) return TIRE_COMPOUNDS.SOFT;
    if (remainingLaps <= 30) return TIRE_COMPOUNDS.MEDIUM;
    return TIRE_COMPOUNDS.HARD;
}

/**
 * Check if tire is in cliff zone (warning state)
 */
function isTireInCliff(compoundId, lapsOnTire) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return false;
    return lapsOnTire >= compound.cliffLap;
}

/**
 * Check if tire is dead/unusable
 */
function isTireDead(compoundId, lapsOnTire) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return false;
    return lapsOnTire >= compound.deathLap;
}

/**
 * Get tire condition label (for UI display)
 */
function getTireCondition(compoundId, lapsOnTire) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return { label: 'Unknown', percent: 0, color: '#888' };

    let percent;
    let label;
    let color;

    if (lapsOnTire < compound.peakLap) {
        percent = 100;
        label = 'Warming';
        color = '#FFD700';
    } else if (lapsOnTire < compound.cliffLap) {
        const range = compound.cliffLap - compound.peakLap;
        const progress = (lapsOnTire - compound.peakLap) / range;
        percent = Math.round(100 - (progress * 50));
        if (percent > 75) {
            label = 'Optimal';
            color = '#00FF41';
        } else if (percent > 50) {
            label = 'Good';
            color = '#88FF00';
        } else {
            label = 'Wearing';
            color = '#FFAA00';
        }
    } else if (lapsOnTire < compound.deathLap) {
        const range = compound.deathLap - compound.cliffLap;
        const progress = (lapsOnTire - compound.cliffLap) / range;
        percent = Math.round(50 - (progress * 40));
        label = 'Cliff!';
        color = '#FF6600';
    } else {
        percent = 5;
        label = 'Dead';
        color = '#FF0033';
    }

    return { label, percent: Math.max(0, percent), color };
}

/**
 * Get tire age description for radio messages
 */
function getTireAgeDescription(compoundId, lapsOnTire) {
    const compound = TIRE_COMPOUNDS[compoundId];
    if (!compound) return 'Tires unknown';

    if (lapsOnTire < compound.peakLap) {
        return 'Tires warming up';
    } else if (lapsOnTire < compound.cliffLap - 5) {
        return 'Tires feeling good';
    } else if (lapsOnTire < compound.cliffLap) {
        return 'Tires starting to fade';
    } else if (lapsOnTire < compound.deathLap - 3) {
        return 'Tires falling off the cliff!';
    } else {
        return 'Tires completely gone, BOX BOX!';
    }
}

/**
 * Calculate minimum number of pit stops needed
 * (based on tire life vs race length)
 */
function calculateMinimumPitStops(track, weather = 'DRY') {
    if (weather !== 'DRY') return 2; // wet races usually need more stops

    const raceLength = track.laps;
    const mediumLife = TIRE_COMPOUNDS.MEDIUM.cliffLap;
    const hardLife = TIRE_COMPOUNDS.HARD.cliffLap;

    // Use hard tires for max stint length
    if (raceLength <= hardLife) return 0; // unrealistic
    if (raceLength <= hardLife * 2) return 1; // one-stop possible
    if (raceLength <= hardLife * 3) return 2; // two-stop required
    return 3;
}

/**
 * Generate strategy options for a race
 * Returns array of viable strategies
 */
function generateStrategyOptions(track, weather = 'DRY') {
    const strategies = [];
    const raceLength = track.laps;

    if (weather === 'HEAVY_RAIN') {
        strategies.push({
            name: 'Full Wet',
            stints: [{ compound: 'WET', laps: raceLength }],
            pitStops: 0,
            description: 'Heavy rain throughout'
        });
        return strategies;
    }

    if (weather === 'LIGHT_RAIN') {
        strategies.push({
            name: 'Intermediates',
            stints: [{ compound: 'INTERMEDIATE', laps: raceLength }],
            pitStops: 0,
            description: 'Light rain throughout'
        });
        return strategies;
    }

    // Dry strategies
    // One-stop
    if (raceLength <= 60) {
        strategies.push({
            name: 'One-Stop (M-H)',
            stints: [
                { compound: 'MEDIUM', laps: Math.floor(raceLength * 0.4) },
                { compound: 'HARD', laps: Math.ceil(raceLength * 0.6) }
            ],
            pitStops: 1,
            description: 'Conservative one-stopper'
        });
    }

    // Two-stop standard
    strategies.push({
        name: 'Two-Stop (M-M-H)',
        stints: [
            { compound: 'MEDIUM', laps: Math.floor(raceLength * 0.33) },
            { compound: 'MEDIUM', laps: Math.floor(raceLength * 0.33) },
            { compound: 'HARD', laps: Math.ceil(raceLength * 0.34) }
        ],
        pitStops: 2,
        description: 'Balanced two-stop'
    });

    // Two-stop aggressive
    strategies.push({
        name: 'Two-Stop (S-M-M)',
        stints: [
            { compound: 'SOFT', laps: Math.floor(raceLength * 0.2) },
            { compound: 'MEDIUM', laps: Math.floor(raceLength * 0.4) },
            { compound: 'MEDIUM', laps: Math.ceil(raceLength * 0.4) }
        ],
        pitStops: 2,
        description: 'Aggressive start'
    });

    // Three-stop sprint
    if (track.tireDegradation >= 7) {
        strategies.push({
            name: 'Three-Stop (S-S-M-S)',
            stints: [
                { compound: 'SOFT', laps: Math.floor(raceLength * 0.25) },
                { compound: 'SOFT', laps: Math.floor(raceLength * 0.25) },
                { compound: 'MEDIUM', laps: Math.floor(raceLength * 0.25) },
                { compound: 'SOFT', laps: Math.ceil(raceLength * 0.25) }
            ],
            pitStops: 3,
            description: 'High-deg track, max attack'
        });
    }

    return strategies;
}

/**
 * Calculate pit stop time loss
 * @param {Object} pitCrew - Pit crew object with bonus
 * @param {number} pitLanePenalty - Track-specific time loss for pit lane (default 18s)
 */
function calculatePitStopTime(pitCrew, pitLanePenalty = 18) {
    const baseStopTime = 2.8; // base wheel-change time
    const crewBonus = pitCrew?.bonus?.pitStopTime || 0; // negative values shave time
    const stopTime = Math.max(2.0, baseStopTime + crewBonus);

    // Random variance: ±0.3s based on consistency
    const consistency = pitCrew?.bonus?.pitConsistency || 0;
    const variance = (Math.random() - 0.5) * (0.6 - consistency / 30);

    return pitLanePenalty + stopTime + variance;
}

/**
 * Determine if a pit stop should happen (used by AI)
 */
function shouldPitNow(carState, track, raceState) {
    const compound = TIRE_COMPOUNDS[carState.tireCompound];
    if (!compound) return false;

    // Mandatory pit if tires are dead
    if (carState.lapsOnTire >= compound.deathLap - 1) return true;

    // Strategic pit if approaching cliff
    if (carState.lapsOnTire >= compound.cliffLap - 2) {
        // Don't pit if very close to end of race
        const remainingLaps = raceState.totalLaps - raceState.currentLap;
        if (remainingLaps > 5) return true;
    }

    // Safety car opportunity (cheap pit stop)
    if (raceState.status === 'SAFETY_CAR' && carState.lapsOnTire >= compound.peakLap + 3) {
        return true;
    }

    // Weather change
    if (raceState.weatherChanged) return true;

    return false;
}