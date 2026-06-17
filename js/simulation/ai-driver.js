/* ============================================
   VELOCITY — AI DRIVER (FIXED)
   Removed artificial pit stop limits
   Better strategic pit timing
   ============================================ */

window.AIDriver = (() => {

    const DIFFICULTY = {
        CASUAL: {
            name: 'Casual',
            aggressiveness: 0.4,
            mistakeMultiplier: 1.3,
            strategySkill: 0.6,
            paceMod: -0.95,
            consistencyMod: 0.9
        },
        COMPETITIVE: {
            name: 'Competitive',
            aggressiveness: 0.65,
            mistakeMultiplier: 1.0,
            strategySkill: 0.85,
            paceMod: 1.0,
            consistencyMod: 1.0
        },
        ELITE: {
            name: 'Elite',
            aggressiveness: 0.9,
            mistakeMultiplier: 0.7,
            strategySkill: 1.0,
            paceMod: 1.05,
            consistencyMod: 1.1
        }
    };

    function initAI(car, difficulty = 'COMPETITIVE') {
        const profile = DIFFICULTY[difficulty] || DIFFICULTY.COMPETITIVE;

        car.ai = {
            difficulty: difficulty,
            profile: profile,
            personality: generatePersonality(car.driver),
            currentMode: 'STANDARD',
            modeChangeLap: 0,
            lastPitDecisionLap: -10,
            targetPosition: null,
            attackingDriver: null,
            defendingFrom: null,
            committedToPit: false,
            pitNextLap: false,
            radioCooldown: 0
        };

        car.drivingMode = 'STANDARD';
    }

    function generatePersonality(driver) {
        const base = {
            aggression: 0.5,
            riskTaking: 0.5,
            tirePatience: 0.5,
            overtakeBoldness: 0.5
        };

        if (driver && Array.isArray(driver.traits)) {
            if (driver.traits.includes('AGGRESSIVE')) {
                base.aggression += 0.25;
                base.riskTaking += 0.2;
                base.overtakeBoldness += 0.2;
            }
            if (driver.traits.includes('OVERTAKER')) base.overtakeBoldness += 0.3;
            if (driver.traits.includes('SMOOTH')) {
                base.aggression -= 0.15;
                base.tirePatience += 0.25;
            }
            if (driver.traits.includes('CONSISTENT')) base.riskTaking -= 0.15;
            if (driver.traits.includes('TIRE_WHISPERER')) base.tirePatience += 0.3;
            if (driver.traits.includes('DEFENDER')) base.overtakeBoldness -= 0.1;
            if (driver.traits.includes('VETERAN')) {
                base.riskTaking -= 0.1;
                base.tirePatience += 0.15;
            }
        }

        Object.keys(base).forEach(key => {
            base[key] = Math.max(0, Math.min(1, base[key]));
        });

        return base;
    }

    function makeDecisions(car, raceState, weatherState, allCars) {
        if (!car.ai) initAI(car);
        if (car.status === 'DNF') return;

        if (car.ai.radioCooldown > 0) car.ai.radioCooldown--;

        decideDrivingMode(car, raceState, allCars);
        decidePitStrategy(car, raceState, weatherState);
        decideCombatTactics(car, raceState, allCars);
        reactToRaceConditions(car, raceState, weatherState, allCars);
    }

    function decideDrivingMode(car, raceState, allCars) {
        const personality = car.ai.personality;
        const lapsRemaining = raceState.totalLaps - raceState.currentLap;
        const tireWear = car.tireState.wearPercent;

        let chosenMode = 'STANDARD';

        if (raceState.currentLap < 3) {
            chosenMode = 'STANDARD';
        }
        else if (lapsRemaining <= 5 && tireWear < 75) {
            chosenMode = 'PUSH';
            if (car.driver.traits.includes('CLUTCH')) {
                chosenMode = 'PUSH';
            }
        }
        else if (tireWear > 70 && lapsRemaining > 5) {
            chosenMode = 'CONSERVE';
        }
        else if (car.ai.attackingDriver && tireWear < 60) {
            if (personality.aggression > 0.6) chosenMode = 'PUSH';
        }
        else if (car.ai.defendingFrom) {
            chosenMode = personality.aggression > 0.7 ? 'PUSH' : 'STANDARD';
        }
        else {
            if (personality.aggression > 0.75 && tireWear < 50) {
                chosenMode = 'PUSH';
            } else if (personality.tirePatience > 0.7) {
                chosenMode = 'CONSERVE';
            }
        }

        if (raceState.status === 'SAFETY_CAR' || raceState.status === 'VSC') {
            chosenMode = 'CONSERVE';
        }

        car.drivingMode = chosenMode;
        car.ai.currentMode = chosenMode;
    }

    /**
     * FIXED: Removed artificial pit limit
     * AI now pits as needed based on tire state and race conditions
     */
    function decidePitStrategy(car, raceState, weatherState) {
        // If already committed, just execute
        if (car.ai.committedToPit) {
            car.ai.pitNextLap = true;
            car.ai.committedToPit = false;
            return;
        }

        // Wait at least 5 laps after last pit decision
        if (raceState.currentLap - car.ai.lastPitDecisionLap < 5) {
            car.ai.pitNextLap = false;
            return;
        }

        // Get strategic recommendation
        const decision = PitStrategy.shouldPitNow(car, raceState, weatherState);

        if (decision.pit) {
            // Higher difficulty AI is more likely to act on pit decisions
            const skillRoll = Math.random();

            // CRITICAL situations always pit (overrides skill check)
            const criticalReasons = ['tires_dead', 'forced', 'wrong_compound', 'tire_puncture'];
            if (criticalReasons.includes(decision.reason)) {
                car.ai.committedToPit = true;
                car.ai.lastPitDecisionLap = raceState.currentLap;
                car.ai.pitReason = decision.reason;
                return;
            }

            // For strategic pits, use skill check
            if (skillRoll < car.ai.profile.strategySkill) {
                car.ai.committedToPit = true;
                car.ai.lastPitDecisionLap = raceState.currentLap;
                car.ai.pitReason = decision.reason;
            }
        }
    }

    function decideCombatTactics(car, raceState, allCars) {
        car.ai.attackingDriver = null;
        car.ai.defendingFrom = null;

        const carAhead = findCarAhead(car, allCars);
        if (carAhead) {
            const gap = car.totalRaceTime - carAhead.totalRaceTime;
            if (Math.abs(gap) < 2.0) {
                const paceDelta = car.lastLapTime - carAhead.lastLapTime;
                if (paceDelta < -0.2) {
                    car.ai.attackingDriver = carAhead.id;
                }
            }
        }

        const carBehind = findCarBehind(car, allCars);
        if (carBehind) {
            const gap = carBehind.totalRaceTime - car.totalRaceTime;
            if (gap < 1.5) {
                const paceDelta = carBehind.lastLapTime - car.lastLapTime;
                if (paceDelta < -0.2) {
                    car.ai.defendingFrom = carBehind.id;
                }
            }
        }
    }

    function reactToRaceConditions(car, raceState, weatherState, allCars) {
        // Weather change - smart AI pits proactively
        if (weatherState.changeInLaps && weatherState.changeInLaps <= 2) {
            const elite = car.ai.difficulty === 'ELITE';
            const compRoll = Math.random();

            if (elite || compRoll < car.ai.profile.strategySkill) {
                if (TireModel.isWrongCompoundForWeather(car.tireState, weatherState.changeWarning)) {
                    car.ai.committedToPit = true;
                }
            }
        }

        // Safety car - decide if it's a good opportunity
        if (raceState.status === 'SAFETY_CAR' && raceState.scLapsRemaining === raceState.scDuration) {
            // First lap of SC - decision time
            if (car.tireState.lapsOnTire >= 8 && car.ai.profile.strategySkill > 0.7) {
                if (Math.random() < 0.7) {
                    car.ai.committedToPit = true;
                    car.ai.pitReason = 'safety_car_opportunity';
                }
            }
        }
    }

    function findCarAhead(car, allCars) {
        const active = allCars.filter(c => c.status !== 'DNF');
        const sorted = [...active].sort((a, b) => a.totalRaceTime - b.totalRaceTime);
        const idx = sorted.findIndex(c => c.id === car.id);
        return idx > 0 ? sorted[idx - 1] : null;
    }

    function findCarBehind(car, allCars) {
        const active = allCars.filter(c => c.status !== 'DNF');
        const sorted = [...active].sort((a, b) => a.totalRaceTime - b.totalRaceTime);
        const idx = sorted.findIndex(c => c.id === car.id);
        return (idx >= 0 && idx < sorted.length - 1) ? sorted[idx + 1] : null;
    }

    function shouldAttemptOvertake(car, targetCar, track) {
        if (!car.ai.attackingDriver) return false;
        if (car.ai.attackingDriver !== targetCar.id) return false;

        const personality = car.ai.personality;
        const baseChance = LapCalculator.calculateOvertakeChance(car, targetCar, track);

        const aggressionMod = 0.5 + personality.overtakeBoldness;
        const finalChance = baseChance * aggressionMod;

        return Math.random() < finalChance;
    }

    function adjustLapTime(car, baseLapTime) {
        if (!car.ai) return baseLapTime;

        const profile = car.ai.profile;
        const adjustment = (1 - profile.paceMod) * 0.8;
        return baseLapTime + adjustment;
    }

    function modifyMistakeChance(car, baseMistakeChance) {
        if (!car.ai) return baseMistakeChance;
        return baseMistakeChance * car.ai.profile.mistakeMultiplier;
    }

    function handleRaceStart(car, gridPosition, allCars) {
        if (!car.ai) initAI(car);

        const personality = car.ai.personality;
        const driver = car.driver;

        let positionsGained = 0;
        if (driver.traits.includes('FAST_STARTER')) {
            positionsGained += Math.floor(Math.random() * 3) + 1;
        }

        if (personality.aggression > 0.7 && Math.random() < 0.4) {
            positionsGained += Math.floor(Math.random() * 2) + 1;
        }

        if (Math.random() < 0.1 && !driver.traits.includes('FAST_STARTER')) {
            positionsGained -= Math.floor(Math.random() * 3) + 1;
        }

        car.ai.startPositionsGained = positionsGained;
        return positionsGained;
    }

    function getRadioMessage(car) {
        if (car.ai.radioCooldown > 0) return null;

        const messages = [];
        const tireMsg = TireModel.getTireRadioMessage(car.tireState);
        if (tireMsg && (tireMsg.priority === 'warning' || tireMsg.priority === 'critical')) {
            messages.push(tireMsg);
        }

        if (car.ai.attackingDriver) {
            messages.push({
                text: `${car.driver.name} closing on car ahead`,
                priority: 'info'
            });
        }

        if (car.ai.defendingFrom) {
            messages.push({
                text: `${car.driver.name} defending position`,
                priority: 'info'
            });
        }

        if (messages.length > 0) {
            car.ai.radioCooldown = 6;
            return messages[0];
        }

        return null;
    }

    function getFocusLevel(car, raceState) {
        let focus = 1.0;

        if (car.ai?.defendingFrom) focus += 0.1;
        if (car.ai?.attackingDriver) focus += 0.05;

        if (car.tireState.wearPercent > 80) focus -= 0.15;

        const remaining = raceState.totalLaps - raceState.currentLap;
        if (remaining <= 5) focus += 0.08;

        return Math.max(0.7, Math.min(1.3, focus));
    }

    function initAllAICars(cars, difficulty = 'COMPETITIVE') {
        cars.forEach(car => {
            if (!car.isPlayer) {
                initAI(car, difficulty);
            }
        });
    }

    function runAITurn(allCars, raceState, weatherState) {
        allCars.forEach(car => {
            if (!car.isPlayer && car.status !== 'DNF') {
                makeDecisions(car, raceState, weatherState, allCars);
            }
        });
    }

    return {
        DIFFICULTY,
        initAI,
        initAllAICars,
        makeDecisions,
        runAITurn,
        shouldAttemptOvertake,
        handleRaceStart,
        adjustLapTime,
        modifyMistakeChance,
        getRadioMessage,
        getFocusLevel
    };
})();