/* ============================================
   VELOCITY — HOME CONTROLLER (UPDATED)
   - Pauses background when not on home screen
   - Live-applies settings to running game
   - Added Performance Mode and Season Length settings
   ============================================ */

window.HomeController = (() => {

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
        // --- MULTIPLAYER RECONNECT CHECK ---
        try {
            const session = sessionStorage.getItem('velocity_mp_session');
            if (session) {
                const data = JSON.parse(session);
                if (data && data.roomCode) {
                    showReconnectPopup(data, 'home-startup-session');
                }
            }
        } catch(e) { console.warn('[HomeController] Reconnect session check failed:', e); }


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
        const storageReport = (typeof StorageCleanupService !== 'undefined') ? StorageCleanupService.getStorageReport() : null;

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
                        <label class="form-label">Storage Usage</label>
                        <div style="background: var(--surface-1); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                            <div style="display: flex; justify-content: space-between; font-family: Orbitron; font-size: 12px; font-weight: 800;">
                                <span>${storageReport ? `${storageReport.usedPercent}% Used` : 'Unavailable'}</span>
                                <span>${storageReport ? `${storageReport.usedKB}KB / ${storageReport.maxKB}KB` : ''}</span>
                            </div>
                            <div style="height: 8px; background: rgba(255,255,255,0.08); border-radius: 8px; overflow: hidden;">
                                <div id="storage-usage-fill" style="height: 100%; width: ${storageReport ? storageReport.usedPercent : 0}%; background: ${storageReport && storageReport.usedPercent > 90 ? 'var(--red)' : storageReport && storageReport.usedPercent > 75 ? '#FFD700' : 'var(--green)'};"></div>
                            </div>
                            <button class="btn btn-glow btn-full" id="btn-clean-storage" style="font-family: Orbitron; font-weight: 900;">Clean Storage</button>
                            <div id="storage-clean-result" style="font-family: Rajdhani; font-size: 12px; color: var(--gray-400);">Preserves achievements, careers, HQ, academy, contracts, profile, and settings.</div>
                        </div>
                    </div>

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

                document.getElementById('btn-clean-storage')?.addEventListener('click', () => {
                    if (typeof StorageCleanupService === 'undefined') return;
                    const before = StorageCleanupService.getStorageReport();
                    const result = StorageCleanupService.cleanup({ aggressive: before.usedPercent >= 90 });
                    const after = StorageCleanupService.getStorageReport();
                    const el = document.getElementById('storage-clean-result');
                    if (el) el.textContent = `Storage cleaned: ${result.itemsRemoved} items removed, ~${result.kbSavedApprox}KB saved. Usage ${before.usedPercent}% → ${after.usedPercent}%.`;
                    const fill = document.getElementById('storage-usage-fill');
                    if (fill) fill.style.width = `${after.usedPercent}%`;
                    if (typeof Notifications !== 'undefined') Notifications.success('Storage Cleaned', `${result.itemsRemoved} items removed • ~${result.kbSavedApprox}KB saved`);
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

        EventBus.on('multiplayer:disconnected', (data) => {
            if (data && data.roomCode) {
                showReconnectPopup(data, 'multiplayer-disconnected-event');
            }
        });

        EventBus.on('screen:changed', (data) => {
            if (data.previous === 'home' && data.screen !== 'home') {
                // Keep active for fast return
            }
        });
    }

    function getReconnectPreference(roomCode) {
        try {
            const raw = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = raw ? JSON.parse(raw) : {};
            return prefs?.[roomCode] || null;
        } catch (e) {
            console.warn('[HomeController] Failed reading reconnect preferences:', e);
            return null;
        }
    }

    function setReconnectSuppressed(roomCode, suppressed) {
        if (!roomCode) return;
        try {
            const raw = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = raw ? JSON.parse(raw) : {};
            if (suppressed) {
                prefs[roomCode] = { roomId: roomCode, suppressReconnect: true, updatedAt: Date.now() };
            } else {
                delete prefs[roomCode];
            }
            sessionStorage.setItem('velocity_mp_reconnect_preferences', JSON.stringify(prefs));

            const sessionRaw = sessionStorage.getItem('velocity_mp_session');
            if (sessionRaw) {
                const sessionData = JSON.parse(sessionRaw);
                if (sessionData?.roomCode === roomCode) {
                    sessionData.suppressReconnect = !!suppressed;
                    sessionStorage.setItem('velocity_mp_session', JSON.stringify(sessionData));
                }
            }
        } catch (e) {
            console.warn('[HomeController] Failed writing reconnect preference:', e);
        }
    }

    function isReconnectSuppressed(roomCode, sessionData = null) {
        const pref = getReconnectPreference(roomCode);
        return !!(sessionData?.suppressReconnect || pref?.suppressReconnect);
    }

    function showReconnectPopup(data, source = 'unknown') {
        if (typeof Modals === 'undefined' || !data) return;
        const sessionData = typeof data === 'string' ? { roomCode: data, isHost: false } : data;
        if (!sessionData.roomCode) return;
        
        const roomCode = sessionData.roomCode;
        const isHost = sessionData.isHost;
        const suppressed = isReconnectSuppressed(roomCode, sessionData);

        console.log('[UplinkReconnect]', {
            source,
            roomId: roomCode,
            suppressReconnect: suppressed,
            sessionSuppressReconnect: !!sessionData.suppressReconnect,
            preference: getReconnectPreference(roomCode)
        });

        if (suppressed) return;

        setTimeout(() => {
            // Re-check immediately before rendering the modal so queued timers cannot ignore Stay Offline.
            let latestSession = null;
            try {
                const raw = sessionStorage.getItem('velocity_mp_session');
                latestSession = raw ? JSON.parse(raw) : null;
            } catch(e) {}
            if (isReconnectSuppressed(roomCode, latestSession?.roomCode === roomCode ? latestSession : sessionData)) {
                console.log('[UplinkReconnect] Popup suppressed before display', { source, roomId: roomCode });
                return;
            }

            Modals.confirm({
                title: '⚡ UPLINK LOST',
                body: `
                    <div style="text-align: center; padding: 10px;">
                        <div style="font-size: 48px; margin-bottom: 15px;">📡❌</div>
                        <p style="font-family: Rajdhani; font-size: 16px; color: var(--gray-300); line-height: 1.5;">
                            Connection to Master Broker was interrupted. Would you like to attempt to recover your session in Room <b>${roomCode}</b>?
                        </p>
                    </div>
                `,
                confirmText: isHost ? 'RE-ESTABLISH HOST' : 'RECONNECT NOW',
                cancelText: 'STAY OFFLINE',
                onCancel: () => {
                    setReconnectSuppressed(roomCode, true);
                    try { sessionStorage.removeItem('velocity_mp_session'); } catch(e) {}
                    console.log('[UplinkReconnect] Stay Offline selected', { roomId: roomCode, suppressReconnect: true });
                },
                onConfirm: () => {
                    setReconnectSuppressed(roomCode, false);
                    console.log('[UplinkReconnect] Reconnect selected', { roomId: roomCode, suppressReconnect: false });
                    if (typeof EventBus !== 'undefined') {
                        EventBus.emit('nav:go', { screen: 'multiplayer', color: '#FF0033' });
                        setTimeout(() => {
                            if (typeof OnlineManager !== 'undefined') {
                                if (isHost) {
                                    // Special Host Reconnect logic: Re-create with fixed ID
                                    OnlineManager.createRoom(() => {
                                        Notifications.success('Host Session Restored!');
                                    }, roomCode);
                                } else {
                                    OnlineManager.connectAndReceiveHostLocked(roomCode, () => {
                                        // Handled
                                    });
                                }
                            }
                        }, 500);
                    }
                }
            });
        }, 1000);
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