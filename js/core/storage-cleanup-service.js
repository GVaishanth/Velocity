/* ============================================
   VELOCITY — STORAGE CLEANUP SERVICE
   Automatic retention policy and storage monitor
   ============================================ */

window.StorageCleanupService = (() => {
    const MAX_BYTES = 5 * 1024 * 1024; // conservative localStorage quota estimate
    const AUTO_THRESHOLD = 0.80;
    const EMERGENCY_THRESHOLD = 0.95;
    const MP_ROOM_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const AUTOSAVE_DETAILED_HISTORY_LIMIT = 8;
    const AUTOSAVE_SUMMARY_HISTORY_LIMIT = 24;
    const GENERIC_LOG_LIMIT = 20;
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

    function summarizeRaceHistoryEntry(entry, stats) {
        if (!entry || typeof entry !== 'object') return entry;
        const summarized = { ...entry };
        const results = Array.isArray(entry.fullResults) ? entry.fullResults : [];
        if (results.length) {
            const winner = results.find(r => r?.position === 1);
            const fastestLap = results.find(r => r?.fastestLap);
            const podium = results
                .filter(r => Number.isFinite(r?.position) && r.position <= 3)
                .sort((a, b) => a.position - b.position)
                .map(r => r?.driver?.name)
                .filter(Boolean);
            const playerTeamId = results.find(r => r?.team?.id && entry.playerTeamId && r.team.id === entry.playerTeamId)?.team?.id || null;
            const playerRows = playerTeamId ? results.filter(r => r?.team?.id === playerTeamId) : [];
            const playerBest = playerRows.length ? playerRows.sort((a, b) => (a?.position || 99) - (b?.position || 99))[0] : null;
            summarized.winner = summarized.winner || winner?.driver?.name || '—';
            summarized.fastestLap = summarized.fastestLap || fastestLap?.driver?.name || '—';
            summarized.podium = summarized.podium || podium;
            if (!summarized.playerBestPosition && Number.isFinite(playerBest?.position)) summarized.playerBestPosition = playerBest.position;
            if (!summarized.playerPoints && playerRows.length) {
                summarized.playerPoints = playerRows.reduce((sum, row) => sum + (row?.points || 0) + (row?.fastestLapBonus || 0), 0);
            }
        }
        if (summarized.fullResults) {
            delete summarized.fullResults;
            stats.itemsRemoved += 1;
            stats.bytesSavedApprox += Math.max(1500, results.length * 220);
        }
        return summarized;
    }

    function trimLogArray(obj, key, limit, stats) {
        if (!Array.isArray(obj?.[key]) || obj[key].length <= limit) return;
        const removed = obj[key].length - limit;
        obj[key] = obj[key].slice(-limit);
        stats.itemsRemoved += removed;
        stats.bytesSavedApprox += removed * 250;
    }

    function trimCareer(career, stats, options = {}) {
        if (!career || typeof career !== 'object') return career;
        const detailedLimit = options.detailedHistoryLimit ?? AUTOSAVE_DETAILED_HISTORY_LIMIT;
        const summaryLimit = options.summaryHistoryLimit ?? AUTOSAVE_SUMMARY_HISTORY_LIMIT;

        if (Array.isArray(career.raceHistory)) {
            const originalLength = career.raceHistory.length;
            const startIndex = Math.max(0, originalLength - summaryLimit);
            if (startIndex > 0) {
                stats.itemsRemoved += startIndex;
                stats.bytesSavedApprox += startIndex * 250;
                career.raceHistory = career.raceHistory.slice(startIndex);
            }
            const summaryCutoff = Math.max(0, career.raceHistory.length - detailedLimit);
            career.raceHistory = career.raceHistory.map((race, idx) => idx < summaryCutoff ? summarizeRaceHistoryEntry(race, stats) : race);
        }

        trimLogArray(career, 'contractMovementLog', GENERIC_LOG_LIMIT, stats);
        trimLogArray(career, 'driverDevelopmentLog', GENERIC_LOG_LIMIT, stats);
        trimLogArray(career, 'academyDevelopmentLog', GENERIC_LOG_LIMIT, stats);
        trimLogArray(career, 'facilitySeasonLog', GENERIC_LOG_LIMIT, stats);
        trimLogArray(career, 'sponsorHistory', GENERIC_LOG_LIMIT, stats);
        trimLogArray(career, 'facilityAILog', GENERIC_LOG_LIMIT, stats);

        if (career._lastSponsorOutcome && typeof career._lastSponsorOutcome === 'object') {
            career._lastSponsorOutcome = {
                ok: !!career._lastSponsorOutcome.ok,
                sponsorId: career._lastSponsorOutcome.sponsor?.id || career._lastSponsorOutcome.sponsorId || null,
                reward: career._lastSponsorOutcome.reward || 0
            };
        }
        return career;
    }

    function trimRace(race, stats, options = {}) {
        if (!race || typeof race !== 'object') return race;
        const eventLimit = options.eventLimit ?? 40;
        const recentLimit = options.recentEventLimit ?? 12;
        if (Array.isArray(race.events) && race.events.length > eventLimit) {
            const removed = race.events.length - eventLimit;
            race.events = race.events.slice(-eventLimit);
            stats.itemsRemoved += removed;
            stats.bytesSavedApprox += removed * 250;
        }
        if (Array.isArray(race.recentEvents) && race.recentEvents.length > recentLimit) {
            const removed = race.recentEvents.length - recentLimit;
            race.recentEvents = race.recentEvents.slice(-recentLimit);
            stats.itemsRemoved += removed;
            stats.bytesSavedApprox += removed * 120;
        }
        if (Array.isArray(race.cars)) {
            race.cars = race.cars.map(car => ({
                id: car.id,
                position: car.position,
                gridPosition: car.gridPosition,
                lapCount: car.lapCount,
                trackProgress: car.trackProgress,
                totalRaceTime: car.totalRaceTime,
                totalRaceDistance: car.totalRaceDistance,
                status: car.status,
                pitPhase: car.pitPhase,
                pitStopCount: car.pitStopCount,
                pitRequested: !!car.pitRequested,
                pitNextLap: !!car.pitNextLap,
                isPittingNow: !!car.isPittingNow,
                fuel: car.fuel,
                fuelLoad: car.fuelLoad,
                boostLevel: car.boostLevel,
                driver: car.driver,
                team: car.team,
                tireState: car.tireState,
                strategy: car.strategy,
                bestLapTime: car.bestLapTime,
                currentLapTime: car.currentLapTime,
                gapToLeader: car.gapToLeader,
                intervalToCarAhead: car.intervalToCarAhead,
                lastLapTime: car.lastLapTime,
                dnfReason: car.dnfReason || null
            }));
        }
        return race;
    }

    function cloneData(data) {
        try { return JSON.parse(JSON.stringify(data)); } catch { return data; }
    }

    function optimizeAutosaveData(gameState, options = {}) {
        const stats = { itemsRemoved: 0, bytesSavedApprox: 0, removed: [], optimized: true };
        const cloned = cloneData(gameState);
        if (!cloned || typeof cloned !== 'object') return { data: cloned, stats };
        if (cloned.career) cloned.career = trimCareer(cloned.career, stats, options);
        if (cloned.race) cloned.race = trimRace(cloned.race, stats, options);
        if (cloned.ui) delete cloned.ui;
        if (cloned.debug) delete cloned.debug;
        stats.kbSavedApprox = Math.round(stats.bytesSavedApprox / 1024);
        return { data: cloned, stats };
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

        // 2. Trim autosaves only. Primary manual saves remain untouched.
        ['velocity_autosave', 'velocity_mp_autosave'].forEach(key => {
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
        trimRace,
        optimizeAutosaveData
    };
})();
