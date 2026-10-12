/* ============================================
   VELOCITY — GAME ENGINE
   Main game loop and system coordinator
   Runs requestAnimationFrame ticks
   Manages screen transitions and state flow
   ============================================ */

window.GameEngine = (() => {
    // Engine state
    let running = false;
    let lastTime = 0;
    let deltaTime = 0;
    let frameCount = 0;
    let fps = 60;
    let fpsUpdateTime = 0;

    let activeSubsystems = [];

    let currentScreen = 'home';
    let previousScreen = null;

    let transitioning = false;

    function init() {
        console.log('[GameEngine] Initializing...');

        AudioManager.init();
        AudioManager.attachEventListeners();

        StateManager.loadProfile();

        setupEventListeners();
        setupKeyboardShortcuts();

        start();

        console.log('[GameEngine] Ready');
    }

    function start() {
        if (running) return;
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(tick);
    }

    function stop() {
        running = false;
    }

    function tick(currentTime) {
        if (!running) return;

        deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        if (deltaTime > 0.1) deltaTime = 0.1;

        frameCount++;
        if (currentTime - fpsUpdateTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            fpsUpdateTime = currentTime;
        }

        activeSubsystems.forEach(sys => {
            try {
                if (typeof sys.update === 'function') {
                    sys.update(deltaTime, currentTime);
                }
            } catch (err) {
                console.error('[GameEngine] Subsystem update error:', err);
            }
        });

        requestAnimationFrame(tick);
    }

    function registerSubsystem(subsystem) {
        if (!subsystem) return;
        if (!activeSubsystems.includes(subsystem)) {
            activeSubsystems.push(subsystem);
            if (typeof subsystem.init === 'function') {
                try {
                    subsystem.init();
                } catch (err) {
                    console.error('[GameEngine] Subsystem init error:', err);
                }
            }
        }
    }

    function unregisterSubsystem(subsystem) {
        const idx = activeSubsystems.indexOf(subsystem);
        if (idx > -1) {
            try {
                if (typeof activeSubsystems[idx].destroy === 'function') {
                    activeSubsystems[idx].destroy();
                }
            } catch (err) {
                console.warn('[GameEngine] Subsystem destroy error:', err);
            }
            activeSubsystems.splice(idx, 1);
        }
    }

    /**
     * Clear all subsystems (used on screen transitions)
     * Each destroy is wrapped in try/catch so one failure
     * doesn't prevent others from being cleaned up
     */
    function clearSubsystems() {
        activeSubsystems.forEach(sys => {
            try {
                if (typeof sys.destroy === 'function') {
                    sys.destroy();
                }
            } catch (err) {
                console.warn('[GameEngine] Subsystem destroy error:', err);
            }
        });
        activeSubsystems = [];
    }

    /* ===== SCREEN MANAGEMENT ===== */

    function goToScreen(screenId, options = {}) {
        const directorReady = typeof TransitionDirector !== 'undefined' && TransitionDirector.isReady();

        if (transitioning && !options.force) {
            // Rapid navigation: let the director cancel its in-flight sequence
            // and take over from the cover state (no flash, no queue pile-up).
            if (directorReady && TransitionDirector.isRunning()) {
                options.force = true;
            } else {
                return;
            }
        }

        const targetScreen = document.getElementById(`screen-${screenId}`);
        if (!targetScreen) {
            console.error(`[GameEngine] Screen not found: ${screenId}`);
            return;
        }

        previousScreen = currentScreen;
        const transitionColor = options.color || getDefaultColor(screenId);

        clearSubsystems();

        if ((options.transition === 'dive' || options.transition === 'cinematic') && directorReady) {
            transitioning = true;
            TransitionDirector.go(screenId, currentScreen, {
                color: transitionColor,
                swap: () => doScreenSwitch(screenId, true),
                done: () => { transitioning = false; }
            });
            return;
        }

        doScreenSwitch(screenId);
    }

    function doScreenSwitch(screenId, skipEnterAnim = false) {
        console.log(`[GameEngine] Screen transition: ${previousScreen} → ${screenId}`);
        
        // ROUTE VALIDATION + FAILSAFE
        const validScreens = ['home','singleplayer','multiplayer','profile','tutorial','team-setup','race-weekend','race','results','dashboard','headquarters'];
        if (!validScreens.includes(screenId)) {
            console.error(`[GameEngine] Invalid route: ${screenId} — falling back to home`);
            screenId = 'home';
        }

        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(`screen-${screenId}`);
        if (!targetScreen) {
            console.error(`[GameEngine] Screen element missing: screen-${screenId}. Falling back.`);
            const home = document.getElementById('screen-home');
            if (home) home.classList.add('active');
            return;
        }

        try {
            targetScreen.classList.add('active');
            targetScreen.classList.remove('screen-exit');
            // When the TransitionDirector swapped us in, it runs its own
            // staged chunk entrance — suppress the generic whole-screen enter.
            if (!skipEnterAnim) {
                targetScreen.classList.add('screen-enter');
            }

            currentScreen = screenId;
            StateManager.set('currentScreen', screenId);

        EventBus.emit('screen:changed', { screen: screenId, previous: previousScreen });
        EventBus.emit(`screen:${screenId}:enter`, { previous: previousScreen });

        const content = targetScreen.querySelector('.screen-content');
        if (content) content.scrollTop = 0;
        } catch (err) {
            console.error('[GameEngine] Screen switch render error:', err);
            if (typeof ErrorBoundary !== 'undefined') {
                ErrorBoundary.handleError(err, `screen:${screenId}`);
            }
            // Fallback UI
            const fallback = document.getElementById('screen-home');
            if (fallback) fallback.classList.add('active');
        }
    }

    function getDefaultColor(screenId) {
        const colors = {
            singleplayer: '#00FF41',
            'team-setup': '#00FF41',
            dashboard: '#00FF41',
            headquarters: '#FFD700',
            'race-weekend': '#00FF41',
            race: '#00FF41',
            results: '#00FF41',
            profile: '#0080FF',
            multiplayer: '#FF0033',
            tutorial: '#FFD700',
            home: '#FFFFFF'
        };
        return colors[screenId] || '#FFFFFF';
    }

    /* ===== EVENT LISTENERS ===== */

    function setupEventListeners() {
        EventBus.on('nav:go', (data) => {
            goToScreen(data.screen, {
                transition: 'dive',
                color: data.color || getDefaultColor(data.screen)
            });
        });

        EventBus.on('nav:home', () => {
            goToScreen('home', {
                transition: 'dive',
                reverse: true
            });
        });

        EventBus.on('nav:direct', (data) => {
            goToScreen(data.screen);
        });

        EventBus.on('career:state_changed', () => {
            StateManager.saveGame();
        });

        EventBus.on('race:finish', () => {
            StateManager.saveGame();
            StateManager.saveProfile();
        });

        EventBus.on('profile:update', () => {
            StateManager.saveProfile();
        });

        window.addEventListener('blur', () => {
            const state = StateManager.get('mode');
            if (state === 'LIVE_RACE') {
                EventBus.emit('race:pause');
            }
        });

        window.addEventListener('focus', () => {
            AudioManager.resume();
        });

        EventBus.on('settings:music_toggle', () => {
            const enabled = AudioManager.toggleMusic();
            StateManager.update('settings', { musicOn: enabled });
            StateManager.saveProfile();
        });

        EventBus.on('settings:sfx_toggle', () => {
            const enabled = AudioManager.toggleSfx();
            StateManager.update('settings', { soundOn: enabled });
            StateManager.saveProfile();
        });
    }

    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape' && currentScreen !== 'home') {
                e.preventDefault();
                // Guard live sessions: an accidental ESC must not nuke a race
                // in progress. Ask for confirmation first (fall back to staying
                // put if the modal system is unavailable).
                if (currentScreen === 'race') {
                    if (typeof Modals !== 'undefined' && Modals.confirm) {
                        // Pause locally only when this client controls the sim
                        // (single player, or the MP Host). An MP Challenger's
                        // local pause can't stop the Host's authoritative sim.
                        const isMpClient = typeof OnlineManager !== 'undefined'
                            && typeof RaceEngine !== 'undefined'
                            && RaceEngine.getState?.()?.isMultiplayerRace
                            && !OnlineManager.isHost();
                        EventBus.emit('race:pause');
                        if (!isMpClient && typeof RaceEngine !== 'undefined' && typeof RaceEngine.pause === 'function') RaceEngine.pause();
                        Modals.confirm({
                            title: 'Abandon Live Race?',
                            body: 'Leaving now will forfeit the session in progress. Are you sure?',
                            confirmText: 'Abandon Race',
                            cancelText: 'Keep Racing',
                            onConfirm: () => EventBus.emit('nav:home'),
                            onCancel: () => {
                                if (!isMpClient && typeof RaceEngine !== 'undefined' && typeof RaceEngine.resume === 'function') RaceEngine.resume();
                            }
                        });
                    }
                    return;
                }
                if (currentScreen === 'race-weekend') {
                    if (typeof Modals !== 'undefined' && Modals.confirm) {
                        Modals.confirm({
                            title: 'Leave Race Weekend?',
                            body: 'Your session progress may be lost. Are you sure?',
                            confirmText: 'Leave Weekend',
                            cancelText: 'Stay',
                            onConfirm: () => EventBus.emit('nav:home')
                        });
                    }
                    return;
                }
                EventBus.emit('nav:home');
                return;
            }

            if (e.key === 'm' || e.key === 'M') {
                EventBus.emit('settings:music_toggle');
                return;
            }

            if (e.key === 's' || e.key === 'S') {
                EventBus.emit('settings:sfx_toggle');
                return;
            }

            if (currentScreen === 'race') {
                handleRaceKeyboard(e);
            }
        });
    }

    function handleRaceKeyboard(e) {
        switch (e.key) {
            case ' ':
                e.preventDefault();
                EventBus.emit('race:toggle_pause');
                break;
            case 'ArrowUp':
                e.preventDefault();
                EventBus.emit('race:speed_up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                EventBus.emit('race:speed_down');
                break;
            case 'Enter':
                e.preventDefault();
                EventBus.emit('race:skip');
                break;
            case '1':
                EventBus.emit('race:driver_mode', { driver: 0, mode: 'PUSH' });
                break;
            case '2':
                EventBus.emit('race:driver_mode', { driver: 0, mode: 'STANDARD' });
                break;
            case '3':
                EventBus.emit('race:driver_mode', { driver: 0, mode: 'CONSERVE' });
                break;
            case 'p':
            case 'P':
                EventBus.emit('race:pit_call', { driver: 0 });
                break;
        }
    }

    /* ===== LOADING SCREEN ===== */

    function showLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (screen) {
            screen.classList.remove('fade-out');
            screen.style.display = 'flex';
        }
    }

    function hideLoadingScreen() {
        const screen = document.getElementById('loading-screen');
        if (!screen) return;
        screen.classList.add('fade-out');
        setTimeout(() => {
            screen.style.display = 'none';
        }, 500);
    }

    function setLoadingProgress(percent, text) {
        const fill = document.getElementById('loader-fill');
        const percentLabel = document.getElementById('loader-percent');
        if (fill) fill.style.width = `${percent}%`;
        if (percentLabel) percentLabel.textContent = `${Math.round(percent)}%`;
    }

    function animateLoading(duration, callback) {
        const startTime = performance.now();
        const update = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(100, (elapsed / duration) * 100);
            setLoadingProgress(progress);
            if (progress < 100) {
                requestAnimationFrame(update);
            } else {
                if (callback) callback();
            }
        };
        update();
    }

    /* ===== UTILITY ===== */

    function getCurrentScreen() {
        return currentScreen;
    }

    function getPreviousScreen() {
        return previousScreen;
    }

    function getFps() {
        return fps;
    }

    function getDeltaTime() {
        return deltaTime;
    }

    function isRunning() {
        return running;
    }

    function isTransitioning() {
        return transitioning;
    }

    /* ===== PUBLIC API ===== */

    return {
        init,
        start,
        stop,

        registerSubsystem,
        unregisterSubsystem,
        clearSubsystems,

        goToScreen,
        getCurrentScreen,
        getPreviousScreen,

        showLoadingScreen,
        hideLoadingScreen,
        setLoadingProgress,
        animateLoading,

        getFps,
        getDeltaTime,
        isRunning,
        isTransitioning
    };
})();