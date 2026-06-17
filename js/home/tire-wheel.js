/* ============================================
   VELOCITY — TIRE WHEEL
   Interactive spinning tire on home page
   4 quadrants with hover effects, click triggers
   dive transition to corresponding screen
   ============================================ */

window.TireWheel = (() => {

    let wheelEl = null;
    let quadrants = [];
    let isActive = false;
    let hoveredQuadrant = null;
    let clickHandled = false;

    /**
     * Initialize the tire wheel
     */
    function init() {
        if (isActive) return; // Completely prevents duplicate listener execution
        wheelEl = document.getElementById('tire-wheel');
        if (!wheelEl) {
            console.warn('[TireWheel] tire-wheel element not found');
            return;
        }

        quadrants = Array.from(wheelEl.querySelectorAll('.tire-quadrant'));
        if (quadrants.length === 0) {
            console.warn('[TireWheel] No tire quadrants found');
            return;
        }

        attachListeners();
        isActive = true;
    }

    /**
     * Attach event listeners to quadrants
     */
    function attachListeners() {
        quadrants.forEach(quadrant => {
            const section = quadrant.dataset.section;
            const color = quadrant.dataset.color;

            // Mouse enter - pause wheel, set wave color
            quadrant.addEventListener('mouseenter', () => {
                handleHover(quadrant, section, color);
            });

            // Mouse leave - resume wheel
            quadrant.addEventListener('mouseleave', () => {
                handleHoverEnd(quadrant);
            });

            // Click - dive transition
            quadrant.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(section, color);
            });

            // Touch support
            quadrant.addEventListener('touchstart', () => {
                handleHover(quadrant, section, color);
            }, { passive: true });
        });
    }

    /**
     * Handle hover on a quadrant
     */
    function handleHover(quadrant, section, color) {
        if (clickHandled) return;

        hoveredQuadrant = section;

        // Pause wheel spin
        wheelEl.classList.add('paused');

        // Update wave system color
        if (typeof WaveSystem !== 'undefined') {
            WaveSystem.setColorOverride(color, 2000);
        }

        // Sound feedback
        if (typeof AudioManager !== 'undefined') {
            AudioManager.uiHover();
        }

        // Emit event
        if (typeof EventBus !== 'undefined') {
            EventBus.emit('home:quadrant_hover', { section, color });
        }
    }

    /**
     * Handle hover end
     */
    function handleHoverEnd(quadrant) {
        if (clickHandled) return;

        hoveredQuadrant = null;

        // Resume wheel spin
        wheelEl.classList.remove('paused');

        // Clear color override (gradually returns to default cycle)
        if (typeof WaveSystem !== 'undefined') {
            WaveSystem.clearColorOverride();
        }

        if (typeof EventBus !== 'undefined') {
            EventBus.emit('home:quadrant_unhover');
        }
    }

    /**
     * Handle click on a quadrant - trigger dive transition
     */
    function handleClick(section, color) {
        if (clickHandled) return;
        clickHandled = true;

        // Map section to screen name
        const screenMap = {
            singleplayer: 'singleplayer',
            multiplayer: 'multiplayer',
            profile: 'profile',
            tutorial: 'tutorial'
        };

        const screen = screenMap[section];
        if (!screen) {
            console.warn('[TireWheel] Unknown section:', section);
            clickHandled = false;
            return;
        }

        // Sound
        if (typeof AudioManager !== 'undefined') {
            AudioManager.uiClick();
        }

        // Pause wheel
        wheelEl.classList.add('paused');

        // Execute majestic cinematic fly-through zoom exactly into the center axle
        wheelEl.classList.add('cinematic-zoom-into-center');

        // After short fly-through delay, trigger navigation
        setTimeout(() => {
            if (typeof EventBus !== 'undefined') {
                EventBus.emit('nav:go', { screen, color });
            }

            // Clean up and reset wheel state after navigation fully completes
            setTimeout(() => {
                clickHandled = false;
                if (wheelEl) {
                    wheelEl.classList.remove('cinematic-zoom-into-center', 'paused');
                }
            }, 1200);
        }, 500);
    }

    /**
     * Programmatically pause/resume the wheel
     */
    function getHoveredSection() {
        return hoveredQuadrant;
    }

    /**
     * Programmatically pause/resume the wheel
     */
    function pause() {
        if (wheelEl) wheelEl.classList.add('paused');
    }

    function resume() {
        if (wheelEl && !hoveredQuadrant) {
            wheelEl.classList.remove('paused');
        }
    }

    /**
     * Cleanup
     */
    function destroy() {
        quadrants.forEach(q => {
            // Could clone and replace to remove listeners
            const clone = q.cloneNode(true);
            q.parentNode.replaceChild(clone, q);
        });
        wheelEl = null;
        quadrants = [];
        hoveredQuadrant = null;
        clickHandled = false;
        isActive = false;
    }

    return {
        init,
        pause,
        resume,
        getHoveredSection,
        destroy
    };
})();