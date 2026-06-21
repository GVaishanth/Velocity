/* ============================================
   VELOCITY — SAFE UTILITIES (DEFENSIVE)
   Global helpers to prevent crashes from missing data
   ============================================ */

window.Safe = (() => {
    function get(obj, path, fallback = null) {
        if (!obj || typeof obj !== 'object') return fallback;
        const keys = path.split('.');
        let current = obj;
        for (const k of keys) {
            if (current == null || typeof current !== 'object' || !(k in current)) {
                return fallback;
            }
            current = current[k];
        }
        return current != null ? current : fallback;
    }

    function getArray(obj, path, fallback = []) {
        const val = get(obj, path, null);
        return Array.isArray(val) ? val : fallback;
    }

    function getNumber(obj, path, fallback = 0) {
        const val = get(obj, path, fallback);
        return (typeof val === 'number' && !isNaN(val)) ? val : fallback;
    }

    function getString(obj, path, fallback = '') {
        const val = get(obj, path, fallback);
        return (typeof val === 'string') ? val : fallback;
    }

    function safeMap(arr, fn, fallback = []) {
        if (!Array.isArray(arr)) return fallback;
        try { return arr.map(fn); } catch { return fallback; }
    }

    function safeFilter(arr, fn, fallback = []) {
        if (!Array.isArray(arr)) return fallback;
        try { return arr.filter(fn); } catch { return fallback; }
    }

    function safeFind(arr, fn, fallback = null) {
        if (!Array.isArray(arr)) return fallback;
        try { return arr.find(fn) || fallback; } catch { return fallback; }
    }

    function has(obj, path) {
        return get(obj, path, undefined) !== undefined;
    }

    function ensureObject(obj) {
        return (obj && typeof obj === 'object') ? obj : {};
    }

    function ensureArray(arr) {
        return Array.isArray(arr) ? arr : [];
    }

    return {
        get, getArray, getNumber, getString,
        safeMap, safeFilter, safeFind,
        has, ensureObject, ensureArray
    };
})();