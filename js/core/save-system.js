/* ============================================
   VELOCITY — SAVE SYSTEM
   LocalStorage wrapper with versioning,
   compression, and error handling
   ============================================ */

window.SaveSystem = (() => {
    const SAVE_PREFIX = 'velocity_';
    const SAVE_VERSION = 1;

    /**
     * Save data to LocalStorage under a key
     * @param {string} key - Save slot name
     * @param {*} data - Any serializable data
     * @returns {boolean} Success
     */
    function save(key, data) {
        try {
            const wrapper = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                data: data
            };
            localStorage.setItem(
                SAVE_PREFIX + key,
                JSON.stringify(wrapper)
            );
            return true;
        } catch (err) {
            console.error('[SaveSystem] Save failed:', err);
            // Likely storage full
            if (err.name === 'QuotaExceededError') {
                EventBus.emit('ui:notify', {
                    message: 'Storage full! Clear old saves.',
                    type: 'error'
                });
            }
            return false;
        }
    }

    /**
     * Load data from LocalStorage
     * @param {string} key - Save slot name
     * @returns {*} Saved data or null
     */
    function load(key) {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + key);
            if (!raw) return null;

            const wrapper = JSON.parse(raw);

            // Version migration if needed
            if (wrapper.version !== SAVE_VERSION) {
                console.warn('[SaveSystem] Save version mismatch, attempting migration');
                return migrateData(wrapper);
            }

            const data = wrapper.data;

            // DEEP CAREER VALIDATION + AUTO-REPAIR (prevents black screens on bad saves)
            if (key === 'gamestate' && data && data.career) {
                data.career = validateAndRepairCareer(data.career);
            }

            return data;
        } catch (err) {
            console.error('[SaveSystem] Load failed:', err);
            return null;
        }
    }

    function validateAndRepairCareer(career) {
        if (!career || typeof career !== 'object') return null;

        const repaired = { ...career };

        // Core required fields with defaults
        repaired.team = career.team || { id: 'novara', name: 'Novara Racing', shortName: 'NOV', color: '#00FF41' };
        repaired.drivers = Array.isArray(career.drivers) && career.drivers.length >= 1 ? career.drivers : [];
        repaired.staff = career.staff || {};
        repaired.budget = typeof career.budget === 'number' ? career.budget : 100000000;
        repaired.season = career.season || 1;
        repaired.currentRound = typeof career.currentRound === 'number' ? career.currentRound : 0;
        repaired.totalRounds = career.totalRounds || 10;
        repaired.schedule = Array.isArray(career.schedule) && career.schedule.length > 0 ? career.schedule : [];
        repaired.carStats = career.carStats || { aero: 70, power: 70, reliability: 70, tireMgmt: 70, cooling: 70, grip: 70 };
        repaired.championship = career.championship || { driverStandings: [], constructorStandings: [] };
        repaired.allTeams = Array.isArray(career.allTeams) && career.allTeams.length > 0 ? career.allTeams : [];
        repaired.raceHistory = Array.isArray(career.raceHistory) ? career.raceHistory : [];
        repaired.isMultiplayer = !!career.isMultiplayer;

        // Ensure schedule is valid track IDs (fallback to first tracks if empty)
        if (repaired.schedule.length === 0 && typeof TRACKS_DATA !== 'undefined') {
            repaired.schedule = TRACKS_DATA.slice(0, repaired.totalRounds).map(t => t.id);
        }

        // Ensure championship standings exist
        if (!repaired.championship.driverStandings || !Array.isArray(repaired.championship.driverStandings)) {
            repaired.championship.driverStandings = [];
        }
        if (!repaired.championship.constructorStandings || !Array.isArray(repaired.championship.constructorStandings)) {
            repaired.championship.constructorStandings = [];
        }

        // Ensure allTeams have drivers
        if (repaired.allTeams.length > 0) {
            repaired.allTeams = repaired.allTeams.map(t => ({
                ...t,
                drivers: Array.isArray(t.drivers) ? t.drivers : []
            }));
        }

        return repaired;
    }

    /**
     * Check if a save exists
     * @param {string} key
     * @returns {boolean}
     */
    function exists(key) {
        return localStorage.getItem(SAVE_PREFIX + key) !== null;
    }

    /**
     * Delete a save
     * @param {string} key
     */
    function remove(key) {
        localStorage.removeItem(SAVE_PREFIX + key);
    }

    /**
     * Get save metadata (timestamp, version) without loading full data
     * @param {string} key
     * @returns {Object|null}
     */
    function getMeta(key) {
        try {
            const raw = localStorage.getItem(SAVE_PREFIX + key);
            if (!raw) return null;
            const wrapper = JSON.parse(raw);
            return {
                version: wrapper.version,
                timestamp: wrapper.timestamp,
                date: new Date(wrapper.timestamp).toLocaleString()
            };
        } catch {
            return null;
        }
    }

    /**
     * List all velocity save keys
     * @returns {string[]}
     */
    function listSaves() {
        const saves = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(SAVE_PREFIX)) {
                saves.push(key.replace(SAVE_PREFIX, ''));
            }
        }
        return saves;
    }

    /**
     * Save complete game state
     * @param {Object} gameState
     */
    function saveGameState(gameState) {
        return save('gamestate', gameState);
    }

    /**
     * Load complete game state
     * @returns {Object|null}
     */
    function loadGameState() {
        return load('gamestate');
    }

    /**
     * Save player profile separately
     * @param {Object} profile
     */
    function saveProfile(profile) {
        return save('profile', profile);
    }

    /**
     * Load player profile
     * @returns {Object|null}
     */
    function loadProfile() {
        return load('profile');
    }

    /**
     * Quick auto-save with slot rotation
     */
    function autoSave(gameState) {
        save('autosave', gameState);
    }

    /**
     * Export all save data as base64 string (for sharing/backup)
     * @returns {string}
     */
    function exportAll() {
        const allData = {};
        listSaves().forEach(key => {
            allData[key] = load(key);
        });
        return btoa(JSON.stringify(allData));
    }

    /**
     * Import save data from base64 string
     * @param {string} encoded
     * @returns {boolean}
     */
    function importAll(encoded) {
        try {
            const allData = JSON.parse(atob(encoded));
            Object.entries(allData).forEach(([key, data]) => {
                save(key, data);
            });
            return true;
        } catch (err) {
            console.error('[SaveSystem] Import failed:', err);
            return false;
        }
    }

    /**
     * Clear all velocity saves
     */
    function clearAll() {
        listSaves().forEach(key => remove(key));
    }

    /**
     * Migrate old save format to current version
     */
    function migrateData(wrapper) {
        // Future use: handle version upgrades
        console.log('[SaveSystem] Migration not needed yet');
        return wrapper.data;
    }

    /**
     * Get storage usage stats
     */
    function getStorageInfo() {
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(SAVE_PREFIX)) {
                totalSize += localStorage.getItem(key).length;
            }
        }
        return {
            usedBytes: totalSize * 2, // UTF-16
            usedKB: Math.round((totalSize * 2) / 1024),
            maxKB: 5120, // Typical 5MB limit
            saveCount: listSaves().length
        };
    }

    return {
        save,
        load,
        exists,
        remove,
        getMeta,
        listSaves,
        saveGameState,
        loadGameState,
        saveProfile,
        loadProfile,
        autoSave,
        exportAll,
        importAll,
        clearAll,
        getStorageInfo
    };
})();