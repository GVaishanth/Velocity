/* ============================================
   VELOCITY — STORAGE CLEANUP SERVICE
   Automatic retention policy and storage monitor
   ============================================ */

window.StorageCleanupService = (() => {
    const MAX_BYTES = 5 * 1024 * 1024; // conservative localStorage quota estimate
    const AUTO_THRESHOLD = 0.80;
    const EMERGENCY_THRESHOLD = 0.95;
    const MP_ROOM_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const ALWAYS_KEEP_PATTERNS = [
        /^velocity_achievements/i,
        /achievement/i,
        /^velocity_profile$/,
        /^velocity_gamestate$/,
        /^velocity_mp_gamestate$/
    ];
    const TEMP_PATTERNS = [
        /debug/i,
        /diag/i,
        /cache/i,
        /temp/i,
        /test/i,
        /race_snapshot/i,
        /tmp/i
    ];

    function byteSize(str) { return (str || '').length * 2; }
    function now() { return Date.now(); }

    function getStorageEntries(storage = localStorage) {
        const entries = [];
        try {
            for (let i = 0; i < storage.length; i++) {
                const key = storage.key(i);
                const value = storage.getItem(key) || '';
                entries.push({ key, value, bytes: byteSize(value) });
            }
        } catch (e) { console.warn('[StorageCleanup] Failed reading storage entries:', e); }
        return entries.sort((a, b) => b.bytes - a.bytes);
    }

    function isAlwaysKeep(key) {
        return ALWAYS_KEEP_PATTERNS.some(p => p.test(key));
    }

    function isTemporaryKey(key) {
        return TEMP_PATTERNS.some(p => p.test(key));
    }

    function parseWrapper(raw) {
        try { return JSON.parse(raw); } catch { return null; }
    }

    function getStorageReport() {
        const localEntries = getStorageEntries(localStorage);
        const sessionEntries = getStorageEntries(sessionStorage);
        const usedBytes = localEntries.reduce((s, e) => s + e.bytes, 0);
        const sessionBytes = sessionEntries.reduce((s, e) => s + e.bytes, 0);
        return {
            usedBytes,
            usedKB: Math.round(usedBytes / 1024),
            usedPercent: Math.min(100, Math.round((usedBytes / MAX_BYTES) * 100)),
            maxBytes: MAX_BYTES,
            maxKB: Math.round(MAX_BYTES / 1024),
            sessionBytes,
            largest: localEntries.slice(0, 10).map(e => ({ key: e.key, kb: Math.round(e.bytes / 1024) })),
            sessionLargest: sessionEntries.slice(0, 10).map(e => ({ key: e.key, kb: Math.round(e.bytes / 1024) }))
        };
    }

    function writeWrapper(key, wrapper) {
        if (wrapper && wrapper.data && typeof wrapper === 'object') {
            // Keep SaveSystem checksum contract valid after trimming.
            try {
                const seen = new WeakSet();
                const str = JSON.stringify(wrapper.data, (k, v) => {
                    if (v && typeof v === 'object') {
                        if (seen.has(v)) return '[Circular]';
                        seen.add(v);
                        if (!Array.isArray(v)) return Object.keys(v).sort().reduce((acc, key) => { acc[key] = v[key]; return acc; }, {});
                    }
                    return v;
                });
                let hash = 0;
                for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
                wrapper.checksum = String(hash >>> 0);
                wrapper.timestamp = Date.now();
            } catch(e) {}
        }
        localStorage.setItem(key, JSON.stringify(wrapper));
    }

    function trimCareer(career, stats) {
        if (!career || typeof career !== 'object') return career;
        if (Array.isArray(career.raceHistory) && career.raceHistory.length > 20) {
            const removed = career.raceHistory.length - 20;
            career.raceHistory = career.raceHistory.slice(-20);
            stats.itemsRemoved += removed;
            stats.bytesSavedApprox += removed * 2500;
        }
        // Keep recent history useful but reduce large embedded result payloads.
        if (Array.isArray(career.raceHistory)) {
            career.raceHistory = career.raceHistory.map((r, idx, arr) => {
                if (idx < arr.length - 20 && r.fullResults) {
                    const { fullResults, ...rest } = r;
                    stats.itemsRemoved += 1;
                    stats.bytesSavedApprox += 1500;
                    return rest;
                }
                return r;
            });
        }
        if (Array.isArray(career.contractMovementLog) && career.contractMovementLog.length > 30) career.contractMovementLog = career.contractMovementLog.slice(-30);
        if (Array.isArray(career.driverDevelopmentLog) && career.driverDevelopmentLog.length > 30) career.driverDevelopmentLog = career.driverDevelopmentLog.slice(-30);
        if (Array.isArray(career.academyDevelopmentLog) && career.academyDevelopmentLog.length > 30) career.academyDevelopmentLog = career.academyDevelopmentLog.slice(-30);
        if (Array.isArray(career.facilitySeasonLog) && career.facilitySeasonLog.length > 30) career.facilitySeasonLog = career.facilitySeasonLog.slice(-30);
        if (Array.isArray(career.sponsorHistory) && career.sponsorHistory.length > 20) career.sponsorHistory = career.sponsorHistory.slice(-20);
        return career;
    }

    function trimRace(race, stats) {
        if (!race || typeof race !== 'object') return race;
        if (Array.isArray(race.events) && race.events.length > 100) {
            const removed = race.events.length - 100;
            race.events = race.events.slice(-100);
            stats.itemsRemoved += removed;
            stats.bytesSavedApprox += removed * 250;
        }
        if (Array.isArray(race.recentEvents) && race.recentEvents.length > 20) race.recentEvents = race.recentEvents.slice(-20);
        return race;
    }

    function trimSaveWrapper(key, stats) {
        const raw = localStorage.getItem(key);
        const wrapper = parseWrapper(raw);
        if (!wrapper?.data) return;
        const before = raw.length;
        const data = wrapper.data;
        if (data.career) data.career = trimCareer(data.career, stats);
        if (data.race) data.race = trimRace(data.race, stats);
        wrapper.data = data;
        writeWrapper(key, wrapper);
        const after = (localStorage.getItem(key) || '').length;
        if (after < before) stats.bytesSavedApprox += (before - after) * 2;
    }

    function removeKey(storage, key, stats, reason) {
        try {
            const bytes = byteSize(storage.getItem(key) || '');
            storage.removeItem(key);
            stats.itemsRemoved += 1;
            stats.bytesSavedApprox += bytes;
            stats.removed.push({ key, reason, kb: Math.round(bytes / 1024) });
        } catch (e) { console.warn('[StorageCleanup] Failed removing key:', key, e); }
    }

    function cleanupSessionStorage(stats, aggressive = false) {
        const session = sessionStorage.getItem('velocity_mp_session');
        if (session) {
            const data = parseWrapper(session);
            if (data?.updatedAt && now() - data.updatedAt > MP_ROOM_MAX_AGE_MS) {
                removeKey(sessionStorage, 'velocity_mp_session', stats, 'expired reconnect session');
            }
        }
        try {
            const raw = sessionStorage.getItem('velocity_mp_reconnect_preferences');
            const prefs = raw ? JSON.parse(raw) : null;
            if (prefs) {
                Object.keys(prefs).forEach(roomId => {
                    if (prefs[roomId]?.updatedAt && now() - prefs[roomId].updatedAt > MP_ROOM_MAX_AGE_MS) {
                        delete prefs[roomId];
                        stats.itemsRemoved += 1;
                    }
                });
                sessionStorage.setItem('velocity_mp_reconnect_preferences', JSON.stringify(prefs));
            }
        } catch(e) {}
        getStorageEntries(sessionStorage).forEach(e => {
            if (isTemporaryKey(e.key)) removeKey(sessionStorage, e.key, stats, 'temporary session data');
        });
    }

    function cleanup(options = {}) {
        const aggressive = !!options.aggressive;
        const stats = { itemsRemoved: 0, bytesSavedApprox: 0, removed: [] };

        // 1. Debug/temp/cache/test data
        getStorageEntries(localStorage).forEach(e => {
            if (!isAlwaysKeep(e.key) && isTemporaryKey(e.key)) removeKey(localStorage, e.key, stats, 'debug/temp/cache/test data');
        });

        // 2. Trim important saves but preserve active career/championship/progress.
        ['velocity_gamestate', 'velocity_mp_gamestate', 'velocity_autosave', 'velocity_mp_autosave'].forEach(key => {
            if (localStorage.getItem(key)) trimSaveWrapper(key, stats);
        });

        // 3. Expired reconnect/session data.
        cleanupSessionStorage(stats, aggressive);

        // 4. Emergency-only: remove autosave backups and stale autosaves, never primary saves or achievements/profile.
        if (aggressive) {
            getStorageEntries(localStorage).forEach(e => {
                if (isAlwaysKeep(e.key)) return;
                if (/autosave_backup$|mp_autosave_backup$|velocity_autosave$|velocity_mp_autosave$/i.test(e.key)) {
                    removeKey(localStorage, e.key, stats, 'emergency autosave cleanup');
                }
            });
        }

        stats.kbSavedApprox = Math.round(stats.bytesSavedApprox / 1024);
        console.log('[StorageCleanup] Cleanup complete:', stats);
        return stats;
    }

    function autoCleanupIfNeeded() {
        const report = getStorageReport();
        if (report.usedPercent >= Math.round(EMERGENCY_THRESHOLD * 100)) return cleanup({ aggressive: true, reason: 'emergency-threshold' });
        if (report.usedPercent >= Math.round(AUTO_THRESHOLD * 100)) return cleanup({ aggressive: false, reason: 'auto-threshold' });
        return { itemsRemoved: 0, bytesSavedApprox: 0, kbSavedApprox: 0, removed: [], skipped: true, usedPercent: report.usedPercent };
    }

    return {
        getStorageReport,
        cleanup,
        autoCleanupIfNeeded,
        trimCareer,
        trimRace
    };
})();
