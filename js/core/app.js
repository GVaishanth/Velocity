/* ============================================
   VELOCITY — APP BOOTSTRAP
   Main entry point that initializes everything
   when the page loads and ties all systems together
   ============================================ */

const App = (() => {

    let isInitialized = false;
    let initStartTime = 0;

    /**
     * Main entry point - called when DOM is ready
     */
    function start() {
        if (isInitialized) return;
        initStartTime = performance.now();

        console.log('%c🏁 VELOCITY - Constructor Championship', 'color: #00FF41; font-size: 18px; font-weight: bold;');
        console.log('%cInitializing game systems...', 'color: #888; font-size: 12px;');

        // Show loading screen
        if (typeof GameEngine !== 'undefined') {
            GameEngine.showLoadingScreen();
        }

        // Animated loading sequence
        runInitSequence();
    }

    /**
     * Run initialization sequence with progress updates
     */
    function runInitSequence() {
        const steps = [
            { name: 'Loading data files', percent: 10, fn: verifyDataLoaded },
            { name: 'Initializing core systems', percent: 25, fn: initCoreSystems },
            { name: 'Setting up audio', percent: 40, fn: initAudio },
            { name: 'Building UI systems', percent: 55, fn: initUISystems },
            { name: 'Loading player profile', percent: 70, fn: loadProfile },
            { name: 'Setting up screens', percent: 85, fn: initScreens },
            { name: 'Starting game engine', percent: 95, fn: startEngine },
            { name: 'Ready to race', percent: 100, fn: finalizeStartup }
        ];

        let currentStep = 0;

        function runStep() {
            if (currentStep >= steps.length) {
                completeInit();
                return;
            }

            const step = steps[currentStep];
            console.log(`  [${step.percent}%] ${step.name}...`);

            try {
                step.fn();
                if (typeof GameEngine !== 'undefined') {
                    GameEngine.setLoadingProgress(step.percent);
                }
            } catch (err) {
                console.error(`Error in step "${step.name}":`, err);
            }

            currentStep++;
            // Small delay between steps for visible progress
            setTimeout(runStep, 80);
        }

        runStep();
    }

    /**
     * Step 1: Verify all data modules loaded
     */
    function verifyDataLoaded() {
        const required = [
            'TEAMS_DATA',
            'DRIVERS_DATA',
            'STAFF_DATA',
            'TRACKS_DATA',
            'ACHIEVEMENTS_DATA',
            'TIRE_COMPOUNDS'
        ];

        const missing = required.filter(name => typeof window[name] === 'undefined');
        if (missing.length > 0) {
            console.error('Missing data modules:', missing);
            throw new Error('Required data not loaded: ' + missing.join(', '));
        }

        console.log(`     ✓ ${TEAMS_DATA.length} teams, ${DRIVERS_DATA.length} drivers, ${TRACKS_DATA.length} tracks, ${ACHIEVEMENTS_DATA.length} achievements`);
    }

    /**
     * Step 2: Initialize core systems
     */
    function initCoreSystems() {
        if (typeof EventBus === 'undefined') throw new Error('EventBus not loaded');
        if (typeof SaveSystem === 'undefined') throw new Error('SaveSystem not loaded');
        if (typeof StateManager === 'undefined') throw new Error('StateManager not loaded');
        if (typeof GameEngine === 'undefined') throw new Error('GameEngine not loaded');

        // Setup global error handler
        if (typeof ErrorBoundary !== 'undefined') {
            ErrorBoundary.init();
        }

        window.addEventListener('error', (e) => {
            console.error('[Global Error]', e.error);
            if (typeof ErrorBoundary !== 'undefined') {
                ErrorBoundary.handleError(e.error || new Error(e.message), 'app.js:global');
            } else if (typeof Notifications !== 'undefined') {
                Notifications.error('Something went wrong', 'Check console for details');
            }
        });

        // Setup unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('[Unhandled Promise]', e.reason);
            if (typeof ErrorBoundary !== 'undefined') {
                ErrorBoundary.handleError(e.reason || new Error('Promise rejection'), 'app.js:unhandledrejection');
            }
        });
    }

    /**
     * Step 3: Initialize audio
     */
    function initAudio() {
        if (typeof AudioManager === 'undefined') {
            console.warn('AudioManager not available');
            return;
        }
        AudioManager.init();
        AudioManager.attachEventListeners();

        // Audio context needs user interaction to start
        const resumeAudio = () => {
            AudioManager.resume();
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
        };
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('keydown', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
    }

    /**
     * Step 4: Initialize UI systems
     */
    function initUISystems() {
        if (typeof Notifications !== 'undefined') Notifications.init();
        if (typeof Modals !== 'undefined') Modals.init();
        if (typeof DriverRadio !== 'undefined') DriverRadio.init();
    }

    /**
     * Step 5: Load player profile from save
     */
    function loadProfile() {
        if (typeof StateManager === 'undefined') return;

        const profile = StateManager.loadProfile();
        if (profile) {
            console.log(`     ✓ Profile loaded: ${profile.username} (Level ${calculateLevel(profile.xp || 0)})`);
        } else {
            console.log('     ✓ New player profile created');
        }

        // Apply saved settings
        const settings = StateManager.get('settings');
        if (settings && typeof AudioManager !== 'undefined') {
            if (settings.musicOn && !AudioManager.isMusicEnabled()) {
                // Music will start on first user interaction
            }
            if (settings.soundOn === false) {
                AudioManager.toggleSfx();
            }
        }
    }

    /**
     * Step 6: Initialize all screens
     */
    function initScreens() {
        const screens = [
            { name: 'HomeController', obj: typeof HomeController !== 'undefined' ? HomeController : null },
            { name: 'SinglePlayerScreen', obj: typeof SinglePlayerScreen !== 'undefined' ? SinglePlayerScreen : null },
            { name: 'MultiplayerScreen', obj: typeof MultiplayerScreen !== 'undefined' ? MultiplayerScreen : null },
            { name: 'ProfileScreen', obj: typeof ProfileScreen !== 'undefined' ? ProfileScreen : null },
            { name: 'TutorialScreen', obj: typeof TutorialScreen !== 'undefined' ? TutorialScreen : null },
            { name: 'TeamSetupScreen', obj: typeof TeamSetupScreen !== 'undefined' ? TeamSetupScreen : null },            { name: 'DashboardScreen', obj: typeof DashboardScreen !== 'undefined' ? DashboardScreen : null },
            { name: 'RaceWeekendScreen', obj: typeof RaceWeekendScreen !== 'undefined' ? RaceWeekendScreen : null },
            { name: 'RaceScreen', obj: typeof RaceScreen !== 'undefined' ? RaceScreen : null },
            { name: 'ResultsScreen', obj: typeof ResultsScreen !== 'undefined' ? ResultsScreen : null }
        ];

        screens.forEach(s => {
            if (s.obj && typeof s.obj.init === 'function') {
                try {
                    s.obj.init();
                } catch (err) {
                    console.error(`Failed to init ${s.name}:`, err);
                }
            } else {
                console.warn(`     ⚠ ${s.name} not available`);
            }
        });
    }

    /**
     * Step 7: Start the main game engine
     */
    function startEngine() {
        if (typeof GameEngine === 'undefined') return;
        GameEngine.init();

        // Run startup validation (health check)
        if (typeof StartupValidator !== 'undefined') {
            try {
                const health = StartupValidator.run();
                if (!health || health.errors.length > 0) {
                    console.warn('[App] Startup had issues but continuing with fallbacks.');
                }
            } catch (e) {
                console.warn('[App] StartupValidator failed (non-fatal):', e);
            }
        }
    }

    /**
     * Step 8: Final setup
     */
    function finalizeStartup() {
        // Initialize home controller (which handles the visual home page)
        if (typeof HomeController !== 'undefined') {
            HomeController.autoInit();
        }

        // Setup global navigation listeners
        setupGlobalListeners();
    }

    /**
     * Complete initialization and hide loading screen
     */
    function completeInit() {
        const totalTime = ((performance.now() - initStartTime) / 1000).toFixed(2);
        console.log(`%c✓ Game ready in ${totalTime}s`, 'color: #00FF41; font-weight: bold;');
        console.log('%cTip: Press M for music, S for sound, ESC to return home', 'color: #888; font-style: italic;');

        // Hide loading screen with delay for smoothness
        setTimeout(() => {
            if (typeof GameEngine !== 'undefined') {
                GameEngine.hideLoadingScreen();
            }

            isInitialized = true;

            // Show welcome notification for new players
            const profile = StateManager.get('profile');
            if (profile && profile.totalRaces === 0) {
                setTimeout(() => {
                    if (typeof Notifications !== 'undefined') {
                        Notifications.info(
                            'Welcome to VELOCITY!',
                            'Click the YELLOW quadrant for tutorial'
                        );
                    }
                }, 1000);
            }
        }, 400);
    }

    /**
     * Setup global event listeners
     */
    function setupGlobalListeners() {
        // Prevent context menu (immersion)
        document.addEventListener('contextmenu', (e) => {
            // Allow in dev/text areas
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // Comment out the next line if you want right-click enabled
            // e.preventDefault();
        });

        // Prevent default for game keyboard shortcuts when not in input
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            // Prevent spacebar from scrolling when on race screen
            if (e.key === ' ' && document.getElementById('screen-race')?.classList.contains('active')) {
                e.preventDefault();
            }
        });

        // Pause race when tab hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                const mode = StateManager.get('mode');
                if (mode === 'LIVE_RACE' && typeof RaceEngine !== 'undefined') {
                    if (!RaceEngine.isCurrentlyPaused()) {
                        RaceEngine.pause();
                    }
                }
            }
        });

        // Save before unload
        window.addEventListener('beforeunload', () => {
            if (typeof StateManager !== 'undefined') {
                StateManager.saveProfile();
                const career = StateManager.get('career');
                const race = StateManager.get('race');
                if (career || race) {
                    StateManager.saveGame();
                }
            }
        });

        // Auto-save every 60 seconds during gameplay
        setInterval(() => {
            const mode = StateManager.get('mode');
            if (mode === 'CAREER' || mode === 'CAREER_SETUP' || mode === 'RACE_WEEKEND' || mode === 'LIVE_RACE' || mode === 'QUICK_RACE') {
                StateManager.saveGame();
            }
            StateManager.saveProfile();
        }, 60000);
    }

    /**
     * Get init status
     */
    function isReady() {
        return isInitialized;
    }

    /**
     * Public API
     */
    return {
        start,
        isReady
    };
})();

/* ============================================
   AUTO-START ON DOM READY
   ============================================ */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.start);
} else {
    // DOM already ready - start immediately
    App.start();
}