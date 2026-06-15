/* ============================================
   VELOCITY — HOME CONTROLLER (UPDATED)
   - Pauses background when not on home screen
   - Live-applies settings to running game
   - Added Performance Mode and Season Length settings
   ============================================ */

const HomeController = (() => {

    let isActive = false;
    let subsystemRef = null;

    /**
     * Initialize home page when shown
     */
    function init() {
        if (isActive) return;

        const tracksCanvas = document.getElementById('tracks-canvas');
        const wavesCanvas = document.getElementById('waves-canvas');

        if (tracksCanvas && typeof TracksBackground !== 'undefined') {
            TracksBackground.init(tracksCanvas);
        }

        if (wavesCanvas && typeof WaveSystem !== 'undefined') {
            WaveSystem.init(wavesCanvas);
        }

        if (typeof TireWheel !== 'undefined') {
            TireWheel.init();
        }

        setupUIControls();
        registerWithEngine();
        renderContinueButton();

        isActive = true;
    }

    /**
     * Setup home page button controls
     */
    function setupUIControls() {
        const musicBtn = document.getElementById('btn-music');
        const settingsBtn = document.getElementById('btn-settings');
        const brazilBtn = document.getElementById('btn-quick-launch-brazil');
        const abudhabiBtn = document.getElementById('btn-quick-launch-abudhabi');

        if (brazilBtn) {
            brazilBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                if (typeof TireWheel !== 'undefined') TireWheel.pause?.();
                if (typeof SinglePlayerScreen !== 'undefined' && typeof SinglePlayerScreen.launchScenario === 'function') {
                    SinglePlayerScreen.launchScenario('miracle_of_brazil');
                }
            });
        }

        if (abudhabiBtn) {
            abudhabiBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();
                if (typeof TireWheel !== 'undefined') TireWheel.pause?.();
                if (typeof SinglePlayerScreen !== 'undefined' && typeof SinglePlayerScreen.launchScenario === 'function') {
                    SinglePlayerScreen.launchScenario('abu_dhabi_shootout');
                }
            });
        }

        if (musicBtn) {
            updateMusicButton(musicBtn);

            musicBtn.addEventListener('click', () => {
                if (typeof AudioManager !== 'undefined') {
                    const enabled = AudioManager.toggleMusic();
                    updateMusicButton(musicBtn);
                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('ui:notify', {
                            message: enabled ? 'Music enabled' : 'Music disabled',
                            type: 'info'
                        });
                    }
                }
            });
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                showSettingsModal();
            });
        }
    }

    function updateMusicButton(btn) {
        if (typeof AudioManager === 'undefined') return;
        const enabled = AudioManager.isMusicEnabled();
        btn.classList.toggle('active', enabled);
        btn.title = enabled ? 'Music On' : 'Music Off';
    }

    /**
     * Show settings modal with all options
     */
    function showSettingsModal() {
        if (typeof Modals === 'undefined') return;

        const profile = StateManager.get('profile');
        const settings = StateManager.get('settings') || {};

        Modals.open({
            title: 'Settings',
            body: `
                <div class="settings-modal">
                    <div class="form-group">
                        <label class="form-label">Username</label>
                        <input type="text" class="input" id="settings-username"
                               value="${escapeHTML(profile.username || '')}" maxlength="20">
                    </div>

                    <div class="form-group">
                        <label class="form-label">Music</label>
                        <div class="toggle-group">
                            <span class="toggle-label">Background Music</span>
                            <div class="toggle ${settings.musicOn ? 'active' : ''}" id="settings-music-toggle"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Sound Effects</label>
                        <div class="toggle-group">
                            <span class="toggle-label">SFX</span>
                            <div class="toggle ${settings.soundOn !== false ? 'active' : ''}" id="settings-sfx-toggle"></div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Default Race Speed</label>
                        <select class="select" id="settings-speed">
                            <option value="1" ${settings.raceSpeed == 1 ? 'selected' : ''}>1x (Real Time)</option>
                            <option value="2" ${(!settings.raceSpeed || settings.raceSpeed == 2) ? 'selected' : ''}>2x</option>
                            <option value="5" ${settings.raceSpeed == 5 ? 'selected' : ''}>5x (Quick)</option>
                            <option value="10" ${settings.raceSpeed == 10 ? 'selected' : ''}>10x (Fast)</option>
                            <option value="30" ${settings.raceSpeed == 30 ? 'selected' : ''}>30x (Skip)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Default Season Length</label>
                        <select class="select" id="settings-season-length">
                            <option value="5" ${settings.seasonLength == 5 ? 'selected' : ''}>5 Races</option>
                            <option value="10" ${(!settings.seasonLength || settings.seasonLength == 10) ? 'selected' : ''}>10 Races</option>
                            <option value="16" ${settings.seasonLength == 16 ? 'selected' : ''}>16 Races</option>
                            <option value="23" ${settings.seasonLength == 23 ? 'selected' : ''}>23 Races</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">AI Difficulty</label>
                        <select class="select" id="settings-difficulty">
                            <option value="CASUAL" ${settings.difficulty === 'CASUAL' ? 'selected' : ''}>Casual</option>
                            <option value="COMPETITIVE" ${(!settings.difficulty || settings.difficulty === 'COMPETITIVE') ? 'selected' : ''}>Competitive</option>
                            <option value="ELITE" ${settings.difficulty === 'ELITE' ? 'selected' : ''}>Elite</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Performance Mode</label>
                        <select class="select" id="settings-performance">
                            <option value="auto" ${(!settings.performance || settings.performance === 'auto') ? 'selected' : ''}>Auto Detect</option>
                            <option value="high" ${settings.performance === 'high' ? 'selected' : ''}>High Quality</option>
                            <option value="balanced" ${settings.performance === 'balanced' ? 'selected' : ''}>Balanced</option>
                            <option value="low" ${settings.performance === 'low' ? 'selected' : ''}>Low (Best Perf)</option>
                        </select>
                    </div>

                    <div class="divider"></div>

                    <div class="form-group">
                        <button class="btn btn-danger btn-full" id="btn-clear-saves">
                            Clear All Saves
                        </button>
                    </div>
                </div>
            `,
            actions: [
                {
                    label: 'Cancel',
                    type: 'secondary'
                },
                {
                    label: 'Save Settings',
                    type: 'primary',
                    onClick: () => saveSettings()
                }
            ],
            onOpen: () => {
                document.getElementById('settings-music-toggle')?.addEventListener('click', (e) => {
                    e.target.classList.toggle('active');
                });
                document.getElementById('settings-sfx-toggle')?.addEventListener('click', (e) => {
                    e.target.classList.toggle('active');
                });

                document.getElementById('btn-clear-saves')?.addEventListener('click', () => {
                    Modals.confirm({
                        title: 'Clear All Saves?',
                        body: 'This will permanently delete all saved games and your profile. This cannot be undone.',
                        confirmText: 'Yes, Delete',
                        confirmType: 'danger',
                        onConfirm: () => {
                            SaveSystem.clearAll();
                            StateManager.reset();
                            location.reload();
                        }
                    });
                });
            }
        });
    }

    /**
     * Save and APPLY settings live
     */
    function saveSettings() {
        const username = document.getElementById('settings-username')?.value?.trim();
        const musicOn = document.getElementById('settings-music-toggle')?.classList.contains('active');
        const soundOn = document.getElementById('settings-sfx-toggle')?.classList.contains('active');
        const raceSpeed = parseInt(document.getElementById('settings-speed')?.value) || 2;
        const difficulty = document.getElementById('settings-difficulty')?.value || 'COMPETITIVE';
        const seasonLength = parseInt(document.getElementById('settings-season-length')?.value) || 10;
        const performance = document.getElementById('settings-performance')?.value || 'auto';

        // Update profile username
        if (username) {
            StateManager.update('profile', { username });
        }

        // Save all settings
        StateManager.update('settings', {
            musicOn,
            soundOn,
            raceSpeed,
            difficulty,
            seasonLength,
            performance
        });

        // APPLY audio settings live
        if (typeof AudioManager !== 'undefined') {
            if (musicOn !== AudioManager.isMusicEnabled()) {
                AudioManager.toggleMusic();
            }
            if (soundOn !== AudioManager.isSfxEnabled()) {
                AudioManager.toggleSfx();
            }
        }

        // APPLY race speed to running race
        if (typeof RaceEngine !== 'undefined' && RaceEngine.getState && RaceEngine.getState()) {
            RaceEngine.setSpeed(raceSpeed);
        }

        // APPLY difficulty to active career
        const career = StateManager.get('career');
        if (career) {
            career.difficulty = difficulty;
            career.totalRounds = seasonLength;
            StateManager.set('career', career);
        }

        // Apply performance mode CSS class
        applyPerformanceMode(performance);

        // Persist
        StateManager.saveProfile();
        StateManager.saveGame();

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('ui:notify', {
                message: 'Settings saved & applied',
                type: 'success'
            });
            EventBus.emit('settings:updated', {
                musicOn, soundOn, raceSpeed, difficulty, seasonLength, performance
            });
        }

        const musicBtn = document.getElementById('btn-music');
        if (musicBtn) updateMusicButton(musicBtn);
    }

    /**
     * Apply performance mode by adding CSS class to body
     */
    function applyPerformanceMode(mode) {
        document.body.classList.remove('perf-high', 'perf-balanced', 'perf-low');
        if (mode === 'high') document.body.classList.add('perf-high');
        else if (mode === 'balanced') document.body.classList.add('perf-balanced');
        else if (mode === 'low') document.body.classList.add('perf-low');
    }

    /**
     * Show or hide the "Continue" indicator on home page
     */
    function renderContinueButton() {
        const hasSave = SaveSystem.exists('gamestate');
        // Reserved for future visual indicator
    }

    /**
     * Register update loop with GameEngine
     * IMPORTANT: Only updates when home screen is actually visible
     */
    function registerWithEngine() {
        if (typeof GameEngine === 'undefined') return;

        subsystemRef = {
            update: (deltaTime) => {
                // Only run background animations if home is actively visible
                const homeScreen = document.getElementById('screen-home');
                if (!homeScreen || !homeScreen.classList.contains('active')) return;
                if (!isActive) return;

                if (typeof TracksBackground !== 'undefined') {
                    TracksBackground.update(deltaTime);
                }
                if (typeof WaveSystem !== 'undefined') {
                    WaveSystem.update(deltaTime);
                }
            },
            destroy: () => {
                isActive = false;
            }
        };

        GameEngine.registerSubsystem(subsystemRef);
    }

    /**
     * Called when leaving home screen
     */
    function deactivate() {
        if (!isActive) return;

        if (subsystemRef && typeof GameEngine !== 'undefined') {
            GameEngine.unregisterSubsystem(subsystemRef);
        }

        if (typeof TracksBackground !== 'undefined') TracksBackground.destroy();
        if (typeof WaveSystem !== 'undefined') WaveSystem.destroy();
        if (typeof TireWheel !== 'undefined') TireWheel.destroy();

        isActive = false;
        subsystemRef = null;
    }

    /**
     * Called when returning to home screen
     */
    function reactivate() {
        if (isActive) return;
        init();
    }

    /**
     * Listen for screen changes
     */
    function attachScreenListeners() {
        if (typeof EventBus === 'undefined') return;

        EventBus.on('screen:home:enter', () => {
            if (!isActive) reactivate();
        });

        EventBus.on('screen:changed', (data) => {
            if (data.previous === 'home' && data.screen !== 'home') {
                // Keep active for fast return
            }
        });
    }

    function escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Auto-init on load
     */
    function autoInit() {
        attachScreenListeners();

        // Apply saved performance mode immediately
        const settings = StateManager.get('settings');
        if (settings?.performance) {
            applyPerformanceMode(settings.performance);
        }

        const homeScreen = document.getElementById('screen-home');
        if (homeScreen && homeScreen.classList.contains('active')) {
            init();
        }
    }

    return {
        init,
        autoInit,
        deactivate,
        reactivate,
        attachScreenListeners,
        applyPerformanceMode
    };
})();