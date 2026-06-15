/* ============================================
   VELOCITY — EVENT BUS
   Pub/Sub system for decoupled communication
   between all game modules
   ============================================ */

const EventBus = (() => {
    // Store all event listeners
    // { eventName: [{ callback, once }] }
    const listeners = {};

    // Track event history for debugging
    const history = [];
    const MAX_HISTORY = 100;

    /**
     * Subscribe to an event
     * @param {string} event - Event name (e.g., 'race:lap_complete')
     * @param {Function} callback - Handler function
     * @returns {Function} Unsubscribe function
     */
    function on(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        const entry = { callback, once: false };
        listeners[event].push(entry);

        // Return unsubscribe function
        return () => {
            const idx = listeners[event].indexOf(entry);
            if (idx > -1) listeners[event].splice(idx, 1);
        };
    }

    /**
     * Subscribe to an event ONCE (auto-removes after first call)
     * @param {string} event
     * @param {Function} callback
     */
    function once(event, callback) {
        if (!listeners[event]) {
            listeners[event] = [];
        }
        listeners[event].push({ callback, once: true });
    }

    /**
     * Emit an event with optional data
     * @param {string} event - Event name
     * @param {*} data - Any data payload
     */
    function emit(event, data) {
        // Log to history
        history.push({ event, data, time: Date.now() });
        if (history.length > MAX_HISTORY) history.shift();

        if (!listeners[event]) return;

        // Copy array to avoid mutation issues during iteration
        const handlers = [...listeners[event]];

        handlers.forEach(entry => {
            try {
                entry.callback(data);
            } catch (err) {
                console.error(`[EventBus] Error in handler for "${event}":`, err);
            }
        });

        // Remove "once" listeners
        listeners[event] = listeners[event].filter(e => !e.once);
    }

    /**
     * Remove all listeners for a specific event
     * @param {string} event
     */
    function off(event) {
        delete listeners[event];
    }

    /**
     * Remove ALL listeners for ALL events
     */
    function clear() {
        Object.keys(listeners).forEach(key => delete listeners[key]);
    }

    /**
     * Get event history (for debugging)
     */
    function getHistory() {
        return [...history];
    }

    /**
     * Get all registered event names
     */
    function getEvents() {
        return Object.keys(listeners);
    }

    // ---- PREDEFINED EVENT NAMES (documentation) ----
    // Navigation:
    //   'nav:go'              → { screen: 'singleplayer', color: '#00FF41' }
    //   'nav:home'            → {}
    //   'nav:transition_done' → { screen }
    //
    // Game State:
    //   'game:new_career'     → { team, drivers, staff }
    //   'game:save'           → {}
    //   'game:load'           → { saveData }
    //
    // Race:
    //   'race:start'          → { track, cars }
    //   'race:lap_complete'   → { lap, positions }
    //   'race:pit_stop'       → { driver, compound }
    //   'race:overtake'       → { overtaker, overtaken }
    //   'race:safety_car'     → { reason }
    //   'race:incident'       → { type, driver }
    //   'race:finish'         → { results }
    //   'race:speed_change'   → { speed }
    //   'race:pause'          → {}
    //   'race:resume'         → {}
    //
    // UI:
    //   'ui:notify'           → { message, type }
    //   'ui:modal_open'       → { title, body, actions }
    //   'ui:modal_close'      → {}
    //
    // Audio:
    //   'audio:play'          → { sound }
    //   'audio:music_toggle'  → {}

    return {
        on,
        once,
        emit,
        off,
        clear,
        getHistory,
        getEvents
    };
})();