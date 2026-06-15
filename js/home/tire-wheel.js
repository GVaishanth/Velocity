/* ============================================
   VELOCITY — TIRE WHEEL
   Interactive spinning tire on home page
   4 quadrants with hover effects, click triggers
   dive transition to corresponding screen
   ============================================ */

const TireWheel = (() => {

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

        // Block multiplayer from redirecting with sarcastic popup
        if (section === 'multiplayer') {
            setTimeout(() => { clickHandled = false; }, 1500); // 1.5s definitive debounce lock
            if (typeof AudioManager !== 'undefined') AudioManager.uiClick?.();

            if (typeof Modals !== 'undefined') {
                Modals.open({
                    title: '🚧 MULTIPLAYER UPLINK: UNDER CONSTRUCTION',
                    body: `
                        <div style="text-align: center; padding: 16px; max-width: 500px; margin: 0 auto;">
                            <div style="font-size: 64px; margin-bottom: 16px;">🏎️💨... 🚧💥💥</div>
                            <h3 style="font-family: Orbitron; font-size: 20px; color: var(--yellow); margin-bottom: 12px;">
                                Oh, look at you, elite Esport socialite. Wanting to race real humans?
                            </h3>
                            <p style="font-family: Rajdhani; font-size: 16px; color: var(--gray-300); line-height: 1.6; margin-bottom: 16px;">
                                Let's be completely sarcastic and realistic here: building highly synchronized worldwide multi-client peer-to-peer WebRTC Star Topology netcode is vastly out of our elite budget for today. E.g., we're entirely saving our remaining serverless bandwidth and brain cells for the real championship Paddock.
                            </p>
                            <div style="padding: 12px; background: rgba(255,0,51,0.1); border: 1px solid var(--red); border-radius: 8px; color: var(--red); font-family: Rajdhani; font-size: 14px; font-weight: 700;">
                                🛑 Subspace Gateway Sealed for now. Baka, go prove you can beat the 11 elite AI Constructor bots in Single Player first.
                            </div>
                        </div>
                    `,
                    actions: [
                        { label: 'Fine, I Will Go Practice vs AI Bots 🙄', type: 'primary' }
                    ]
                });
            } else if (typeof Notifications !== 'undefined') {
                Notifications.warning('Multiplayer Blocked', 'Under construction! Go beat the AI bots first.');
            }
            return;
        }

        // Map section to screen name
        const screenMap = {
            singleplayer: 'singleplayer',
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