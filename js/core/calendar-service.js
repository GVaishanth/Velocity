/* ============================================
   VELOCITY — CALENDAR SERVICE
   Single authoritative source for season calendars
   ============================================ */

window.CalendarService = (() => {
    const SAFE_FALLBACK_IDS = [
        'monaco', 'silverstone', 'spa', 'monza', 'suzuka',
        'interlagos', 'bahrain', 'shanghai', 'albert_park', 'hungaroring'
    ];

    function getTrack(id) {
        if (!id) return null;
        if (typeof getTrackById === 'function') {
            const track = getTrackById(id);
            if (track) return track;
        }
        if (typeof TRACKS_DATA !== 'undefined' && Array.isArray(TRACKS_DATA)) {
            return TRACKS_DATA.find(t => t && t.id === id) || null;
        }
        return null;
    }

    function getAllValidTrackIds() {
        if (typeof TRACKS_DATA !== 'undefined' && Array.isArray(TRACKS_DATA) && TRACKS_DATA.length) {
            return TRACKS_DATA.filter(t => t && t.id).map(t => t.id);
        }
        return SAFE_FALLBACK_IDS.filter(id => getTrack(id) || typeof TRACKS_DATA === 'undefined');
    }

    function toTrackIdArray(trackIds) {
        if (!Array.isArray(trackIds)) return [];
        return trackIds.map(item => typeof item === 'string' ? item : item?.id).filter(Boolean);
    }

    function normalizeTrackIds(trackIds) {
        const source = toTrackIdArray(trackIds);
        const seen = new Set();
        const valid = [];

        source.forEach(id => {
            if (!id || seen.has(id)) return;
            if (getTrack(id)) {
                seen.add(id);
                valid.push(id);
            }
        });

        return valid;
    }

    function validateCalendar(trackIds, options = {}) {
        const source = toTrackIdArray(trackIds);
        const calendar = normalizeTrackIds(source);
        const invalidIds = [...new Set(source.filter(id => !getTrack(id)))];
        const duplicateIds = source.filter((id, idx) => source.indexOf(id) !== idx);
        const errors = [];

        if (source.length === 0) errors.push('Calendar is empty');
        if (invalidIds.length) errors.push(`Invalid track IDs: ${invalidIds.join(', ')}`);
        if (duplicateIds.length && options.allowDuplicates !== true) errors.push(`Duplicate track IDs: ${[...new Set(duplicateIds)].join(', ')}`);
        if (options.expectedLength && calendar.length !== options.expectedLength) {
            errors.push(`Calendar length ${calendar.length} does not match expected ${options.expectedLength}`);
        }

        return {
            valid: errors.length === 0,
            source,
            calendar,
            invalidIds,
            duplicateIds: [...new Set(duplicateIds)],
            errors
        };
    }

    function validateCareerCalendar(career) {
        if (!career || typeof career !== 'object') {
            return { valid: false, source: [], calendar: [], invalidIds: [], duplicateIds: [], errors: ['Career missing'] };
        }
        const source = career.seasonCalendar || career.schedule || [];
        const result = validateCalendar(source);
        const currentRound = Number.isFinite(career.currentRound) ? career.currentRound : NaN;
        if (!Number.isFinite(currentRound)) result.errors.push('currentRound is not a number');
        else if (currentRound < 0) result.errors.push(`currentRound is negative: ${currentRound}`);
        else if (result.calendar.length > 0 && currentRound > result.calendar.length) result.errors.push(`currentRound ${currentRound} exceeds calendar length ${result.calendar.length}`);
        result.valid = result.errors.length === 0;
        return result;
    }

    function shuffleCopy(arr) {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    /**
     * Build an authoritative calendar.
     * If selected/custom track ids are supplied, they are preserved exactly after validation.
     * IMPORTANT: if a custom calendar was supplied but invalid, this returns the valid subset
     * (possibly empty) and does NOT replace it with random tracks.
     */
    function createCalendar(options = {}) {
        const selectedSource = options.selectedTrackIds ||
            options.selectedTracks ||
            options.customCalendar ||
            options.seasonCalendar ||
            options.trackIds ||
            [];
        const hadExplicitSelection = Array.isArray(selectedSource) && selectedSource.length > 0;
        const selected = normalizeTrackIds(selectedSource);

        if (hadExplicitSelection) {
            const validation = validateCalendar(selectedSource);
            if (!validation.valid) {
                console.error('[CalendarService] Custom calendar validation failed:', validation.errors, validation);
            }
            return selected;
        }

        const requestedLength = Math.max(1, parseInt(options.seasonLength || options.totalRounds || 10, 10) || 10);
        const allIds = getAllValidTrackIds();
        const pool = options.shuffle === false ? [...allIds] : shuffleCopy(allIds);
        return pool.slice(0, Math.min(requestedLength, pool.length));
    }

    function getCareerCalendar(career) {
        if (!career || typeof career !== 'object') return [];
        return normalizeTrackIds(career.seasonCalendar || career.schedule || []);
    }

    function applyCalendar(career, calendar, options = {}) {
        if (!career || typeof career !== 'object') return career;
        const normalized = normalizeTrackIds(calendar);
        career.schedule = [...normalized];
        career.seasonCalendar = [...normalized];
        career.totalRounds = normalized.length;
        if (options.markSelected) career.selectedTrackIds = [...normalized];
        if (typeof career.currentRound !== 'number' || isNaN(career.currentRound)) career.currentRound = 0;
        career.currentRound = Math.max(0, career.currentRound);
        if (normalized.length > 0) career.currentRound = Math.min(career.currentRound, normalized.length);
        return career;
    }

    /**
     * Centralized calendar validation/repair. Dashboard and screens may call this,
     * but all repair decisions live here.
     */
    function ensureCareerCalendar(career, options = {}) {
        if (!career || typeof career !== 'object') return career;

        const validation = validateCareerCalendar(career);
        let calendar = validation.calendar;

        if (!validation.valid) {
            console.error('[CalendarService] Career calendar invalid:', validation.errors, {
                schedule: career.schedule,
                seasonCalendar: career.seasonCalendar,
                currentRound: career.currentRound,
                career
            });
        }

        if (calendar.length === 0) {
            const explicit = options.selectedTrackIds || options.customCalendar || career.selectedTrackIds || career.customCalendar;
            calendar = createCalendar({
                seasonLength: career.totalRounds || options.seasonLength || 10,
                selectedTrackIds: explicit,
                shuffle: options.shuffle
            });

            if (calendar.length === 0) {
                console.error('[CalendarService] Unable to repair calendar. No valid tracks available or custom calendar invalid.');
            }
        }

        return applyCalendar(career, calendar, { markSelected: !!(career.selectedTrackIds || options.markSelected) });
    }

    function saveCalendar(career, calendar, options = {}) {
        return applyCalendar(career, calendar, options);
    }

    function loadCalendar(career) {
        return getCareerCalendar(career);
    }

    function getNextRace(career) {
        const calendar = getCareerCalendar(career);
        const currentRound = Math.max(0, parseInt(career?.currentRound || 0, 10) || 0);
        if (!calendar.length || currentRound >= calendar.length) {
            return { trackId: null, track: null, roundIndex: currentRound, remainingRounds: 0, calendar };
        }
        const trackId = calendar[currentRound];
        return {
            trackId,
            track: getTrack(trackId),
            roundIndex: currentRound,
            remainingRounds: calendar.length - currentRound,
            calendar
        };
    }

    function isSeasonComplete(career) {
        const calendar = getCareerCalendar(career);
        const currentRound = Math.max(0, parseInt(career?.currentRound || 0, 10) || 0);
        return calendar.length > 0 && currentRound >= calendar.length;
    }

    function advanceRound(career, targetRound = null) {
        if (!career || typeof career !== 'object') return career;
        ensureCareerCalendar(career);
        const calendar = getCareerCalendar(career);
        const nextRound = targetRound === null || targetRound === undefined
            ? (career.currentRound || 0) + 1
            : parseInt(targetRound, 10);
        career.currentRound = Math.max(0, Math.min(Number.isFinite(nextRound) ? nextRound : 0, calendar.length));
        return career;
    }

    function createNextSeasonCalendar(career, options = {}) {
        const explicit = options.selectedTrackIds || options.customCalendar || career?.selectedTrackIds || career?.customCalendar || null;
        return createCalendar({
            seasonLength: options.seasonLength || career?.totalRounds || career?.schedule?.length || 10,
            selectedTrackIds: explicit,
            shuffle: explicit ? false : options.shuffle !== false
        });
    }

    function generateNextSeason(career, options = {}) {
        const nextCalendar = createNextSeasonCalendar(career, options);
        saveCalendar(career, nextCalendar, { markSelected: !!(career?.selectedTrackIds || options.selectedTrackIds) });
        career.currentRound = 0;
        return career;
    }

    return {
        createCalendar,
        validateCalendar,
        validateCareerCalendar,
        createNextSeasonCalendar,
        generateNextSeason,
        ensureCareerCalendar,
        applyCalendar,
        saveCalendar,
        loadCalendar,
        advanceRound,
        getCareerCalendar,
        getNextRace,
        isSeasonComplete,
        normalizeTrackIds,
        getTrack,
        getAllValidTrackIds
    };
})();
