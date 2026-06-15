/* ============================================
   VELOCITY — GAME ENGINE
   Main game loop and system coordinator
   Runs requestAnimationFrame ticks
   Manages screen transitions and state flow
   ============================================ */

const GameEngine = (() => {
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
        if (transitioning && !options.force) return;

        const targetScreen = document.getElementById(`screen-${screenId}`);
        if (!targetScreen) {
            console.error(`[GameEngine] Screen not found: ${screenId}`);
            return;
        }

        previousScreen = currentScreen;
        const isReverse = options.reverse || screenId === 'home';
        const transitionColor = options.color || getDefaultColor(screenId);

        clearSubsystems();

        if (options.transition === 'dive') {
            transitioning = true;
            performDiveTransition(screenId, transitionColor, isReverse, () => {
                doScreenSwitch(screenId);
                transitioning = false;
            });
            return;
        }

        doScreenSwitch(screenId);
    }

    function doScreenSwitch(screenId) {
        document.querySelectorAll('.game-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const targetScreen = document.getElementById(`screen-${screenId}`);
        targetScreen.classList.add('active');
        targetScreen.classList.remove('screen-exit');
        targetScreen.classList.add('screen-enter');

        currentScreen = screenId;
        StateManager.set('currentScreen', screenId);

        EventBus.emit('screen:changed', { screen: screenId, previous: previousScreen });
        EventBus.emit(`screen:${screenId}:enter`, { previous: previousScreen });

        const content = targetScreen.querySelector('.screen-content');
        if (content) content.scrollTop = 0;
    }

    function performDiveTransition(targetScreen, color, isReverse, callback) {
        const overlay = document.getElementById('transition-overlay');
        const tunnel = document.getElementById('transition-tunnel');

        if (!overlay || !tunnel) {
            callback();
            return;
        }

        tunnel.style.setProperty('--tunnel-color', color);
        tunnel.style.background = `radial-gradient(circle at center,
            transparent 0%,
            transparent 5%,
            ${color}33 15%,
            ${color}88 30%,
            ${color}ff 60%,
            ${color}ff 100%
        )`;

        overlay.classList.add('active');

        if (isReverse) {
            tunnel.style.animation = 'none';
            void tunnel.offsetWidth;
            tunnel.classList.add('tunnel-reverse');

            setTimeout(() => {
                callback();
            }, 400);

            setTimeout(() => {
                overlay.classList.remove('active');
                tunnel.classList.remove('tunnel-reverse');
                tunnel.style.animation = '';
            }, 800);
        } else {
            tunnel.style.animation = 'none';
            void tunnel.offsetWidth;
            tunnel.classList.add('tunnel-effect');

            AudioManager.diveTransition();

            setTimeout(() => {
                callback();
            }, 700);

            setTimeout(() => {
                overlay.classList.remove('active');
                tunnel.classList.remove('tunnel-effect');
                tunnel.style.animation = '';
            }, 1200);
        }
    }

    function getDefaultColor(screenId) {
        const colors = {
            singleplayer: '#00FF41',
            'team-setup': '#00FF41',
            dashboard: '#00FF41',
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