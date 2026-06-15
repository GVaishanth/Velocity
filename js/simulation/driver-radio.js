/* ============================================
   VELOCITY — DRIVER RADIO SYSTEM
   Varied driver comments with speed throttle
   When player driver radios in, race slows to 2x
   ============================================ */

const DriverRadio = (() => {

    let lastRadioTime = 0;
    const RADIO_COOLDOWN = 25000; // 25 seconds between radio messages
    let originalSpeed = null;
    let throttleTimeout = null;

    const COMMENT_LIBRARY = {
        tire_warming: [
            "Tires coming in now, front axle feels solid.",
            "Building surface temp, rears are getting there.",
            "Tires are almost in the peak window. Brake thermals good.",
            "Bite feels good on entry, bringing them in softly.",
            "Surface grip is building, let me push this lap."
        ],
        tire_optimal: [
            "Car balance is absolutely phenomenal right now. Hooked up!",
            "These Mediums feel mega, plenty of rear traction.",
            "Peak grip window, Mode Push! Strat 5 is working.",
            "Car is on rails, apex speeds are magnificent.",
            "Front end is biting beautifully into the hairpins."
        ],
        tire_wearing: [
            "Starting to lose the rears out of low-speed traction zones.",
            "Front left is opening up, feeling some slight graining.",
            "Rear end is getting extremely loose on exit.",
            "Carcass temp is normalizing but surface rubber is wearing.",
            "I have to manage Sector 3 slightly, rears are slipping."
        ],
        tire_cliff: [
            "Bono, my tires are completely gone! I have no grip out here!",
            "Falling off an absolute cliff! Boxing this lap, box box!",
            "Rear traction is completely finished, mate! Box now!",
            "I cannot rotate the car into Turn 4! Tires are scrubbed to zero!",
            "Emergency box! These Softs are completely dead!"
        ],
        gap_closing: [
            "I'm catching the car ahead. Give me full battery deployment.",
            "Within DRS striking distance next lap. Let's execute this.",
            "Right on his rear wing. He's struggling with entry stability.",
            "Pace delta is lethal, we are closing the gap rapidly.",
            "DRS available, give me Mode Overtake on the main straight."
        ],
        gap_growing: [
            "Pulling away clearly from the cars behind. Clean rhythm.",
            "Building a magnificent gap out front. Everything feels managed.",
            "He can't keep up with our Sector 2 pace. Absolute cruising.",
            "Power unit telemetry feels perfect, gap is widening nicely.",
            "Holding an optimal delta in clean air. Car is magnificent."
        ],
        defending: [
            "He's right in my dirty air, defending hard into Turn 1.",
            "I need more ERS clipping deployment to cover the inside line.",
            "Under intense DRS pressure from behind. Holding apex position.",
            "He's using Overtake boost, I'm forcing him to the outside.",
            "Maintaining defensive lines. Rear tire thermals are peaking."
        ],
        overtake_made: [
            "That's the move done! Phenomenal racecraft! Clear air ahead.",
            "Got him! Beautiful switchback move. Moving forward.",
            "Clean DRS overtake completed. Let's hunt down the next car.",
            "Position gained! Apex braking was absolutely pristine.",
            "Yes! Sliced right past him into the braking zone!"
        ],
        mistake: [
            "Sorry, locked the front right slightly. Normalizing temps now.",
            "Bit of a snap over the exit curb, caught it. Back on the delta.",
            "Ran deep into the hairpin, lost 0.5s. Recovering my rhythm.",
            "Had a wild rear slide there, my mistake. MGU-K is fine.",
            "Bit of an awkward moment on the dirty side. Slicing back."
        ],
        weather_rain: [
            "It's spitting heavily at Turn 4! Asphalt is getting highly greasy.",
            "Rain cell is arriving fast. Visibility and entry bite dropping.",
            "Slicks are getting extremely dangerous. Standby for Inters.",
            "I'm aquaplaning across the main straight! We need to box soon.",
            "Intermediate crossover window is right now. Copy box."
        ],
        weather_dry: [
            "A beautiful dry line is forming rapidly. Slicks ready soon.",
            "Standing water is dissipating. We can master the slick crossover!",
            "Inters are completely overheating now, track is practically dry.",
            "Asphalt thermals are rising. Ready for fresh Soft rubber.",
            "Conditions are optimal for dry compounds. Updating dash."
        ],
        safety_car: [
            "Following the Safety Car. Keeping brake and tire thermals high.",
            "Safety Car deployed. Delta is positive. Good time for an unscheduled box?",
            "Bunching up behind the SC. Weaving to keep surface heat in.",
            "Copy Safety Car. Power unit switched to Mode Conserve.",
            "Holding SC delta. Confirming strategy window for the restart."
        ],
        push_mode: [
            "Maximum attack mode! Strat 5, full ERS deployment!",
            "Mode Push, pushing flat out on every single apex!",
            "Full send this lap! Lighting up the timing sheets.",
            "All-in on this overcut window. Car balance is superb.",
            "Maximizing powertrain output. Sector deltas look gorgeous."
        ],
        save_mode: [
            "Mode Conserve. Managing surface thermals and fuel targets.",
            "Lifting and coasting exactly 50 meters before braking zones.",
            "Looking after the rear rubber. Battery is harvesting well.",
            "Managing pace delta perfectly. Everything is rock solid.",
            "Cruising in clean air. Gearbox and thermal readings optimal."
        ],
        good_lap: [
            "What an absolute stunning lap! Personal best micro-sectors!",
            "Fastest lap overall! That felt absolutely like qualifying!",
            "P1 pace in Sector 3! The aerodynamic floor is sucking beautifully.",
            "Hooked that one up flawlessly! Car is an absolute rocket.",
            "Mega lap! Let's keep this exact consistent rhythm going."
        ],
        engine_issue: [
            "Engine note sounds strange out of Turn 2. Getting weird shifts.",
            "MGU-H deployment seems clipping early. Check telemetry channels!",
            "Getting an unexpected power unit derate down the back straight.",
            "Oil thermals are creeping up slightly. Switching strat modes.",
            "Something feels slightly off with the torque synchronization."
        ],
        general: [
            "Car feels beautifully balanced. Holding the target lap delta.",
            "Telemetry is absolutely clean. Hitting all our fuel milestones.",
            "Good rhythm out here. Tires sit beautifully in the thermal window.",
            "All power unit parameters are rock solid. Heading into next sector.",
            "Executing clean lines. Aerodynamic stability is absolutely class."
        ]
    };

    /**
     * Get a random comment from a category
     */
    function getComment(category) {
        const comments = COMMENT_LIBRARY[category] || COMMENT_LIBRARY.general;
        return comments[Math.floor(Math.random() * comments.length)];
    }

    /**
     * Determine what category of comment fits the current state
     */
    function pickCommentCategory(car, raceState) {
        const tireState = car.tireState;
        const tireWear = tireState.wearPercent;

        // Tire state has highest priority
        if (tireState.isWornOut) return 'tire_cliff';
        if (tireState.isInCliff) return 'tire_cliff';
        if (tireWear > 65) return 'tire_wearing';
        if (tireState.lapsOnTire < 3) return 'tire_warming';
        if (tireWear < 30 && tireState.lapsOnTire >= 3) return 'tire_optimal';

        // Race events
        if (raceState && raceState.status === 'SAFETY_CAR') return 'safety_car';

        // Driving modes
        if (car.drivingMode === 'PUSH') {
            return Math.random() < 0.5 ? 'push_mode' : 'general';
        }
        if (car.drivingMode === 'CONSERVE') return 'save_mode';

        // Position context
        if (car.hasDRS) return 'gap_closing';

        // Fastest lap holder
        if (raceState && raceState.fastestLapDriverId === car.id) {
            return 'good_lap';
        }

        return 'general';
    }

    /**
     * Try to play a radio message
     * Returns true if played, false if blocked by cooldown
     */
    function tryRadio(car, raceState, forcedCategory = null) {
        if (!car || !car.isPlayer) return false;

        const now = performance.now();
        if (now - lastRadioTime < RADIO_COOLDOWN) return false;

        const category = forcedCategory || pickCommentCategory(car, raceState);
        const comment = getComment(category);
        const priority = getPriority(category);

        // Emit radio message
        if (typeof EventBus !== 'undefined') {
            const driverName = car.driver.lastName || car.driver.name;
            EventBus.emit('race:radio', {
                text: `${driverName}: ${comment}`,
                priority: priority,
                driver: car.driver.name,
                category: category
            });
        }

        // Throttle speed during radio
        throttleSpeedForRadio();

        lastRadioTime = now;
        return true;
    }

    /**
     * Reduce race speed to 2x momentarily, then restore
     * Player can still see the radio message comfortably
     */
    function throttleSpeedForRadio() {
        if (typeof RaceEngine === 'undefined') return;
        if (!RaceEngine.getSpeed) return;

        const currentSpeed = RaceEngine.getSpeed();
        if (currentSpeed <= 2) return; // Already slow enough

        // Cancel any existing throttle restore
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
        } else {
            // Only save original if no throttle is in progress
            originalSpeed = currentSpeed;
        }

        // Throttle to 2x
        RaceEngine.setSpeed(2);

        // Notify UI subtly
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('ui:notify', {
                message: '📻 Radio — speed temporarily 2x',
                type: 'info',
                duration: 2500
            });
        }

        // Restore original speed after 3 seconds
        throttleTimeout = setTimeout(() => {
            if (originalSpeed !== null && RaceEngine.getState && RaceEngine.getState()) {
                RaceEngine.setSpeed(originalSpeed);
                originalSpeed = null;
            }
            throttleTimeout = null;
        }, 3000);
    }

    /**
     * Get priority level for a category
     */
    function getPriority(category) {
        const critical = ['tire_cliff', 'engine_issue'];
        const warning = ['tire_wearing', 'mistake', 'weather_rain', 'defending'];
        const positive = ['overtake_made', 'good_lap', 'tire_optimal'];

        if (critical.includes(category)) return 'critical';
        if (warning.includes(category)) return 'warning';
        if (positive.includes(category)) return 'positive';
        return 'info';
    }

    /**
     * Force a specific message (used by event listeners)
     */
    function forceMessage(car, category) {
        if (!car || !car.isPlayer) return false;
        const raceState = typeof RaceEngine !== 'undefined' && RaceEngine.getState
            ? RaceEngine.getState()
            : null;
        return tryRadio(car, raceState, category);
    }

    /**
     * Reset state (called on race end)
     */
    function reset() {
        lastRadioTime = 0;
        originalSpeed = null;
        if (throttleTimeout) {
            clearTimeout(throttleTimeout);
            throttleTimeout = null;
        }
    }

    /**
     * Hook into race events to trigger contextual radio
     */
    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('race:overtake', (event) => {
            if (Math.random() > 0.25) return;
            const car = RaceEngine.getCar && RaceEngine.getCar(event.attackerId);
            if (car && car.isPlayer) {
                setTimeout(() => forceMessage(car, 'overtake_made'), 500);
            }
        });

        EventBus.on('race:incident', (event) => {
            if (Math.random() > 0.5) return;
            const car = RaceEngine.getCar && RaceEngine.getCar(event.carId);
            if (car && car.isPlayer && event.type === 'driver_mistake') {
                setTimeout(() => forceMessage(car, 'mistake'), 300);
            }
        });

        EventBus.on('weather:changed', (event) => {
            const playerCars = RaceEngine.getPlayerCars && RaceEngine.getPlayerCars();
            if (playerCars && playerCars[0]) {
                const category = (event.to === 'LIGHT_RAIN' || event.to === 'HEAVY_RAIN')
                    ? 'weather_rain' : 'weather_dry';
                setTimeout(() => forceMessage(playerCars[0], category), 600);
            }
        });

        EventBus.on('race:safety_car', () => {
            const playerCars = RaceEngine.getPlayerCars && RaceEngine.getPlayerCars();
            if (playerCars && playerCars[0]) {
                setTimeout(() => forceMessage(playerCars[0], 'safety_car'), 400);
            }
        });

        EventBus.on('race:fastest_lap', (event) => {
            if (Math.random() > 0.2) return;
            const car = RaceEngine.getCar && RaceEngine.getCar(event.carId);
            if (car && car.isPlayer) {
                setTimeout(() => forceMessage(car, 'good_lap'), 500);
            }
        });

        EventBus.on('race:lap_complete', (data) => {
            // Random ambient radio every few laps
            if (data.car && data.car.isPlayer && Math.random() < 0.05) {
                tryRadio(data.car, RaceEngine.getState && RaceEngine.getState());
            }
        });

        EventBus.on('race:finish', reset);
    }

    function init() {
        attachListeners();
    }

    return {
        init,
        tryRadio,
        forceMessage,
        reset
    };
})();