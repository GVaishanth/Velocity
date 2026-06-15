/* ============================================
   VELOCITY — ANIMATION LOOP
   Coordinates rendering during live races
   Registered with GameEngine as a subsystem
   ============================================ */

const AnimationLoop = (() => {

    let isActive = false;
    let lastFps = 60;
    let frameCount = 0;
    let lastFpsTime = 0;

    /**
     * Start the rendering loop
     */
    function start(canvas, track, cars) {
        if (!canvas || !track || !cars) {
            console.error('[AnimationLoop] Missing parameters');
            return;
        }

        // Initialize all rendering systems
        TrackRenderer.init(canvas, track);
        CarRenderer.init(cars);
        Effects.init();

        isActive = true;
        frameCount = 0;
        lastFpsTime = performance.now();

        // Register as game engine subsystem (for update ticks)
        if (typeof GameEngine !== 'undefined') {
            GameEngine.registerSubsystem({
                update: tick
            });
        }
    }

    /**
     * Main render tick - called by GameEngine each frame
     */
    function tick(deltaTime) {
        if (!isActive) return;

        const raceState = RaceEngine.getState();
        if (!raceState) return;

        try {
            CarRenderer.update(deltaTime, raceState.cars);
            Effects.update(deltaTime, raceState);

            TrackRenderer.renderStatic();
            CarRenderer.render(raceState.cars);
            Effects.render(raceState);
        } catch (err) {
            console.warn('[AnimationLoop] Render error gracefully swallowed:', err);
        }

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            lastFps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
        }
    }

    /**
     * Trigger a crash visual effect at car's location
     */
    function triggerCrashEffect(carId) {
        const car = RaceEngine.getCar(carId);
        if (!car) return;
        const pos = TrackRenderer.getTrackPosition(car.trackProgress);
        Effects.triggerCrash(pos.x, pos.y);
    }

    /**
     * Show event banner
     */
    function showBanner(text, color, duration) {
        Effects.showEventBanner(text, color, duration);
    }

    /**
     * Stop the rendering loop
     */
    function stop() {
        isActive = false;
        TrackRenderer.destroy();
        CarRenderer.destroy();
        Effects.destroy();
    }

    function getFps() { return lastFps; }
    function isRunning() { return isActive; }

    /**
     * Listen for race events to trigger visual effects
     */
    function attachListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('race:incident', (event) => {
            if (event.type === 'crash' || event.type === EventSystem.EVENT_TYPES.CRASH) {
                triggerCrashEffect(event.carId);
                showBanner('CRASH!', '#FF0033', 1500);
            }
        });

        EventBus.on('race:safety_car', (event) => {
            const reason = event.reason === 'crash' ? 'CRASH INCIDENT' : 'DEBRIS ON TRACK';
            showBanner(`⚠️ SAFETY CAR — ${reason} ⚠️`, '#FFD700', 3500);
        });

        EventBus.on('race:green_flag', () => {
            showBanner('🏁 GREEN FLAG — RACING RESUMES 🏁', '#00FF41', 2000);
        });

        EventBus.on('weather:changed', (event) => {
            const weather = WeatherSystem.WEATHER_STATES[event.to];
            showBanner(`${weather.icon} WEATHER CHANGE — ${weather.name.toUpperCase()}`, weather.color, 2500);
        });

        EventBus.on('race:overtake', () => {
            // Quiet - shows in event ticker
        });

        EventBus.on('race:fastest_lap', () => {
            showBanner('⏱️ FASTEST LAP', '#AA33FF', 1500);
        });
    }

    return {
        start,
        stop,
        tick,
        triggerCrashEffect,
        showBanner,
        attachListeners,
        getFps,
        isRunning
    };
})();