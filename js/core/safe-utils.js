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

    /**
     * Canonical HTML escaper for user-controlled strings inserted via innerHTML.
     * NOTE: many screens still carry legacy local copies of this function;
     * new code should always use this shared implementation.
     */
    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /**
     * Canonical currency formatter ($12.5M / $800K / $450).
     * Fixes a production crash: race-weekend.js called formatMoney() with no
     * definition in scope (ReferenceError broke the FP/Quali crash-repair flow).
     */
    function formatMoney(n) {
        if (!Number.isFinite(n)) return '0';
        const sign = n < 0 ? '-' : '';
        const abs = Math.abs(n);
        if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(1)}M`;
        if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(0)}K`;
        return `${sign}${Math.round(abs)}`;
    }

    return {
        get, getArray, getNumber, getString,
        safeMap, safeFilter, safeFind,
        has, ensureObject, ensureArray,
        escapeHTML, formatMoney
    };
})();

/* Global aliases so screens without a local copy (e.g. race-weekend.js) work.
   Screens with legacy local function declarations keep their shadowed copies. */
if (typeof window !== 'undefined') {
    if (typeof window.escapeHTML !== 'function') window.escapeHTML = window.Safe.escapeHTML;
    if (typeof window.formatMoney !== 'function') window.formatMoney = window.Safe.formatMoney;
}