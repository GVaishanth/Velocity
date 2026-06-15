/* ============================================
   VELOCITY — TRANSITIONS
   Screen transition helpers for animated effects
   Works alongside GameEngine's dive transitions
   ============================================ */

const Transitions = (() => {

    /**
     * Fade in an element
     */
    function fadeIn(element, duration = 400) {
        if (!element) return;
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.display = element.dataset.displayType || 'block';

        // Force reflow
        void element.offsetWidth;

        element.style.opacity = '1';
    }

    /**
     * Fade out an element
     */
    function fadeOut(element, duration = 400) {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            setTimeout(() => {
                element.style.display = 'none';
                resolve();
            }, duration);
        });
    }

    /**
     * Slide in from direction
     */
    function slideIn(element, direction = 'right', duration = 500) {
        if (!element) return;

        const directions = {
            right: 'translateX(100%)',
            left: 'translateX(-100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };

        element.style.transform = directions[direction];
        element.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        element.style.opacity = '1';

        void element.offsetWidth;

        element.style.transform = 'translate(0, 0)';
    }

    /**
     * Stagger animation for child elements
     */
    function staggerChildren(parentElement, delayPerItem = 50) {
        if (!parentElement) return;
        const children = Array.from(parentElement.children);
        children.forEach((child, idx) => {
            child.style.opacity = '0';
            child.style.transform = 'translateY(20px)';
            child.style.transition = 'opacity 400ms ease, transform 400ms ease';

            setTimeout(() => {
                child.style.opacity = '1';
                child.style.transform = 'translateY(0)';
            }, idx * delayPerItem);
        });
    }

    /**
     * Pulse an element to draw attention
     */
    function pulse(element, color = null) {
        if (!element) return;
        element.style.animation = 'pulse-glow 0.6s ease';
        if (color) {
            element.style.boxShadow = `0 0 20px ${color}`;
        }
        setTimeout(() => {
            element.style.animation = '';
            element.style.boxShadow = '';
        }, 600);
    }

    /**
     * Shake an element (for errors)
     */
    function shake(element) {
        if (!element) return;
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 500);
    }

    /**
     * Count-up number animation
     */
    function countUp(element, from, to, duration = 1000, formatter = null) {
        if (!element) return;
        const startTime = performance.now();
        const diff = to - from;

        const update = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            const eased = easeOutCubic(progress);
            const current = from + (diff * eased);

            const display = formatter ? formatter(current) : Math.round(current);
            element.textContent = display;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    }

    /**
     * Easing functions
     */
    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * Race start light sequence (5 red lights → all out)
     */
    function raceLightSequence(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'race-start-overlay';
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0;
            width: 100vw; height: 100vh;
            background: rgba(0, 0, 0, 0.9);
            z-index: 9000;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 30px;
        `;

        const lightsRow = document.createElement('div');
        lightsRow.style.cssText = 'display: flex; gap: 16px;';

        const lights = [];
        for (let i = 0; i < 5; i++) {
            const light = document.createElement('div');
            light.className = 'race-light';
            lightsRow.appendChild(light);
            lights.push(light);
        }

        const text = document.createElement('div');
        text.style.cssText = `
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            font-size: 28px;
            letter-spacing: 6px;
            color: white;
            text-transform: uppercase;
        `;
        text.textContent = 'LIGHTS OUT IN...';

        overlay.appendChild(text);
        overlay.appendChild(lightsRow);
        document.body.appendChild(overlay);

        // Sequence
        let i = 0;
        const interval = setInterval(() => {
            if (i < 5) {
                lights[i].classList.add('on');
                if (typeof AudioManager !== 'undefined') AudioManager.raceLight();
                i++;
            } else {
                clearInterval(interval);

                // Random pause (0.2 - 1.5s)
                const goDelay = 200 + Math.random() * 1300;
                setTimeout(() => {
                    // All lights out
                    lights.forEach(l => l.classList.remove('on'));
                    text.textContent = 'GO! GO! GO!';
                    text.style.color = '#00FF41';
                    text.style.textShadow = '0 0 20px #00FF41';

                    if (typeof AudioManager !== 'undefined') AudioManager.raceGo();

                    // Remove overlay after a moment
                    setTimeout(() => {
                        overlay.style.transition = 'opacity 0.5s ease';
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            if (typeof overlay.remove === 'function') overlay.remove();
                            else if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                            if (callback) callback();
                        }, 500);
                    }, 800);
                }, goDelay);
            }
        }, 1000);
    }

    /**
     * Confetti animation (for victories)
     */
    function confetti(duration = 3000) {
        const colors = ['#00FF41', '#0080FF', '#FF0033', '#FFD700', '#FF00AA'];
        const particles = 80;

        for (let i = 0; i < particles; i++) {
            setTimeout(() => {
                const piece = document.createElement('div');
                piece.className = 'confetti-piece';
                piece.style.cssText = `
                    left: ${Math.random() * 100}vw;
                    top: -10px;
                    background: ${colors[Math.floor(Math.random() * colors.length)]};
                    width: ${4 + Math.random() * 6}px;
                    height: ${4 + Math.random() * 6}px;
                    animation-duration: ${2 + Math.random() * 2}s;
                    transform: rotate(${Math.random() * 360}deg);
                `;
                document.body.appendChild(piece);

                setTimeout(() => piece.remove(), 4000);
            }, Math.random() * duration);
        }
    }

    /**
     * Animate a number changing (with sound tick)
     */
    function animateValue(element, fromValue, toValue, duration = 800) {
        if (!element) return;
        element.classList.add('number-tick');
        countUp(element, fromValue, toValue, duration);
        setTimeout(() => element.classList.remove('number-tick'), duration);
    }

    /**
     * Reveal element with scale-in
     */
    function scaleIn(element, duration = 300) {
        if (!element) return;
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0';
        element.style.transition = `transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), opacity ${duration}ms ease`;

        void element.offsetWidth;

        element.style.transform = 'scale(1)';
        element.style.opacity = '1';
    }

    /**
     * Flash element briefly
     */
    function flash(element, color = '#FFFFFF', duration = 300) {
        if (!element) return;
        const originalBg = element.style.backgroundColor;
        element.style.transition = `background-color ${duration}ms ease`;
        element.style.backgroundColor = color;
        setTimeout(() => {
            element.style.backgroundColor = originalBg;
        }, duration);
    }

    /**
     * Sequential reveal for items in a list
     */
    function revealSequential(elements, delayBetween = 100) {
        if (!elements) return;
        Array.from(elements).forEach((el, idx) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(15px)';
            el.style.transition = 'opacity 400ms ease, transform 400ms ease';

            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, idx * delayBetween);
        });
    }

    return {
        fadeIn,
        fadeOut,
        slideIn,
        staggerChildren,
        pulse,
        shake,
        countUp,
        animateValue,
        scaleIn,
        flash,
        revealSequential,
        raceLightSequence,
        confetti,
        // Easing exports
        easeOutCubic,
        easeInOutCubic
    };
})();