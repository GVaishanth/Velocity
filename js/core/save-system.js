/* ============================================
   VELOCITY — SAVE SYSTEM
   LocalStorage wrapper with versioning,
   compression, and error handling
   ============================================ */

window.SaveSystem = (() => {
    const SAVE_PREFIX = 'velocity_';
    const SAVE_VERSION = 1;

    function stableStringify(value) {
        const seen = new WeakSet();
        return JSON.stringify(value, (key, val) => {
            if (val && typeof val === 'object') {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
                if (!Array.isArray(val)) {
                    return Object.keys(val).sort().reduce((acc, k) => {
                        acc[k] = val[k];
                        return acc;
                    }, {});
                }
            }
            return val;
        });
    }

    function checksum(data) {
        const str = stableStringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
        }
        return String(hash >>> 0);
    }

    function notifyRecovery(message) {
        try {
            if (typeof EventBus !== 'undefined') EventBus.emit('ui:notify', { message, type: 'warning', duration: 6000 });
        } catch(e) {}
    }

    /**
     * Save data to LocalStorage under a key
     * @param {string} key - Save slot name
     * @param {*} data - Any serializable data
     * @returns {boolean} Success
     */
    function save(key, data) {
        try {
            const storageKey = SAVE_PREFIX + key;
            const existing = localStorage.getItem(storageKey);
            if (existing) {
                localStorage.setItem(storageKey + '_backup', existing);
            }

            // Persist exactly what can be reloaded: remove object identity/shared refs.
            const serializableData = JSON.parse(JSON.stringify(data));
            const wrapper = {
                version: SAVE_VERSION,
                timestamp: Date.now(),
                key,
                checksum: checksum(serializableData),
                data: serializableData
            };
            const serializedWrapper = JSON.stringify(wrapper);
            localStorage.setItem(storageKey, serializedWrapper);
            if (!existing) localStorage.setItem(storageKey + '_backup', serializedWrapper);
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
        return loadInternal(key, false);
    }

    function loadBackup(key) {
        return loadInternal(key, true);
    }

    function loadInternal(key, backup = false) {
        const storageKey = SAVE_PREFIX + key + (backup ? '_backup' : '');
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return null;

            const wrapper = JSON.parse(raw);

            // Version migration if needed
            if (wrapper.version !== SAVE_VERSION) {
                console.warn('[SaveSystem] Save version mismatch, attempting migration');
                return validateAndRepairSaveData(key, migrateData(wrapper));
            }

            const data = wrapper.data;
            if (wrapper.checksum && wrapper.checksum !== checksum(data)) {
                throw new Error(`Checksum mismatch for ${key}${backup ? ' backup' : ''}`);
            }

            return validateAndRepairSaveData(key, data);
        } catch (err) {
            console.error(`[SaveSystem] Load failed for ${storageKey}:`, err);
            if (!backup) {
                const recovered = loadBackup(key);
                if (recovered) {
                    notifyRecovery(`Primary save '${key}' was corrupted. Loaded backup.`);
                    return recovered;
                }
            }
            return null;
        }
    }

    function validateAndRepairSaveData(key, data) {
        if (!data || typeof data !== 'object') return data;

        if ((key === 'gamestate' || key === 'mp_gamestate' || key === 'autosave' || key === 'mp_autosave') && data) {
            if (data.career) data.career = validateAndRepairCareer(data.career);
            if (data.race) data.race = validateAndRepairRace(data.race);
            data.settings = data.settings || {};
            data.profile = data.profile || null;
            if (key === 'gamestate' && (data.career?.isMultiplayer || data.race?.isMultiplayerRace)) {
                console.error('[SaveSystem] Multiplayer data found in single-player save slot. Rejecting load.');
                return null;
            }
            if ((key === 'mp_gamestate' || key === 'mp_autosave') && data.career) {
                data.career.isMultiplayer = true;
            }
        }

        return data;
    }

    function validateAndRepairRace(race) {
        if (!race || typeof race !== 'object') return null;
        const repaired = { ...race };
        if (repaired.trackId && !repaired.track && typeof CalendarService !== 'undefined') {
            repaired.track = CalendarService.getTrack(repaired.trackId);
        }
        if (repaired.track && !repaired.trackId) repaired.trackId = repaired.track.id;
        repaired.cars = Array.isArray(repaired.cars) ? repaired.cars : repaired.cars;
        if (Array.isArray(repaired.cars)) {
            repaired.cars = repaired.cars.map(c => ({
                ...c,
                fuel: typeof c.fuel === 'number' ? c.fuel : 100,
                fuelLoad: typeof c.fuelLoad === 'number' ? c.fuelLoad : (typeof c.fuel === 'number' ? c.fuel : 100),
                tireState: c.tireState || (typeof TireModel !== 'undefined' ? TireModel.createTireState('MEDIUM') : null),
                pitPhase: c.pitPhase || (c.isPittingNow ? 'entering' : 'racing'),
                pitStopCount: c.pitStopCount || 0,
                lapCount: c.lapCount || 0,
                trackProgress: c.trackProgress || 0,
                totalRaceTime: c.totalRaceTime || 0,
                totalRaceDistance: c.totalRaceDistance || 0,
                status: c.status || 'READY'
            }));
        }
        repaired.events = Array.isArray(repaired.events) ? repaired.events : [];
        repaired.recentEvents = Array.isArray(repaired.recentEvents) ? repaired.recentEvents : repaired.events.slice(-10);
        repaired.weather = repaired.weather || null;
        return repaired;
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

        // Ensure schedule is valid track IDs using the authoritative CalendarService
        if (typeof CalendarService !== 'undefined') {
            CalendarService.ensureCareerCalendar(repaired, { seasonLength: repaired.totalRounds || 10 });
        } else if (repaired.schedule.length === 0 && typeof TRACKS_DATA !== 'undefined') {
            repaired.schedule = TRACKS_DATA.slice(0, repaired.totalRounds).map(t => t.id);
            repaired.seasonCalendar = [...repaired.schedule];
            repaired.totalRounds = repaired.schedule.length;
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
                date: new Date(wrapper.timestamp).toLocaleString(),
                checksum: wrapper.checksum || null
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
    function autoSave(gameState, slot = 'autosave') {
        return save(slot, gameState);
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
        loadBackup,
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
        validateAndRepairSaveData,
        validateAndRepairCareer,
        validateAndRepairRace,
        getStorageInfo
    };
})();