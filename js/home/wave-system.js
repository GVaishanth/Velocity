/* ============================================
   VELOCITY — WAVE SYSTEM (OPTIMIZED)
   Up to 5 light waves flowing across screen
   Illumination calls throttled to 50ms intervals
   for major performance improvement
   ============================================ */

const WaveSystem = (() => {

    let canvas = null;
    let ctx = null;
    let waves = [];
    let isActive = false;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const MAX_WAVES = 5;
    const SPAWN_INTERVAL = 1800;
    let lastSpawnTime = 0;

    // Throttle illumination updates (huge perf win)
    let illuminationAccumulator = 0;
    const ILLUMINATION_INTERVAL = 0.05; // 50ms

    // Throttle canvas rendering to 30fps
    let renderAccumulator = 0;
    const TARGET_FRAME_TIME = 0.033;

    const DEFAULT_COLORS = ['#00FF41', '#0080FF', '#FF0033', '#FFD700', '#FFFFFF'];
    let colorIndex = 0;

    let overrideColor = null;
    let overrideUntil = 0;

    /**
     * Initialize the wave system
     */
    function init(canvasElement) {
        canvas = canvasElement;
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        dpr = window.devicePixelRatio || 1;

        resize();
        window.addEventListener('resize', resize);
        isActive = true;
    }

    /**
     * Resize canvas
     */
    function resize() {
        if (!canvas) return;
        width = window.innerWidth;
        height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
    }

    /**
     * Create a new wave with random parameters
     */
    function createWave(color = null) {
        const edge = Math.floor(Math.random() * 4);
        let startX, startY, targetX, targetY;

        switch (edge) {
            case 0: // top
                startX = Math.random() * width;
                startY = -100;
                targetX = startX + (Math.random() - 0.5) * width * 0.5;
                targetY = height + 100;
                break;
            case 1: // right
                startX = width + 100;
                startY = Math.random() * height;
                targetX = -100;
                targetY = startY + (Math.random() - 0.5) * height * 0.5;
                break;
            case 2: // bottom
                startX = Math.random() * width;
                startY = height + 100;
                targetX = startX + (Math.random() - 0.5) * width * 0.5;
                targetY = -100;
                break;
            case 3: // left
                startX = -100;
                startY = Math.random() * height;
                targetX = width + 100;
                targetY = startY + (Math.random() - 0.5) * height * 0.5;
                break;
        }

        const dx = targetX - startX;
        const dy = targetY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 80 + Math.random() * 60;
        const vx = (dx / dist) * speed;
        const vy = (dy / dist) * speed;

        const waveColor = color || getNextColor();

        return {
            x: startX,
            y: startY,
            vx: vx,
            vy: vy,
            radius: 180 + Math.random() * 120,
            color: waveColor,
            life: 0,
            maxLife: 6 + Math.random() * 3,
            opacity: 0,
            sineAmplitude: 30 + Math.random() * 40,
            sinePhase: Math.random() * Math.PI * 2,
            sineFreq: 0.3 + Math.random() * 0.4,
            renderX: startX,
            renderY: startY
        };
    }

    /**
     * Get next color in cycle (or override)
     */
    function getNextColor() {
        const now = performance.now();
        if (overrideColor && now < overrideUntil) {
            return overrideColor;
        }
        const color = DEFAULT_COLORS[colorIndex];
        colorIndex = (colorIndex + 1) % DEFAULT_COLORS.length;
        return color;
    }

    /**
     * Set color override (when hovering tire quadrant)
     */
    function setColorOverride(color, durationMs = 500) {
        overrideColor = color;
        overrideUntil = performance.now() + durationMs;

        waves.forEach(wave => {
            wave.color = color;
        });

        if (typeof TracksBackground !== 'undefined') {
            TracksBackground.pulseAllInColor(color, 0.5);
        }
    }

    /**
     * Clear color override
     */
    function clearColorOverride() {
        overrideColor = null;
        overrideUntil = 0;
    }

    /**
     * Update waves (called every frame)
     * Illumination calls throttled to 50ms intervals
     */
    function update(deltaTime) {
        if (!isActive) return;
        const now = performance.now();

        // Spawn new waves
        if (waves.length < MAX_WAVES && now - lastSpawnTime > SPAWN_INTERVAL) {
            waves.push(createWave());
            lastSpawnTime = now;
        }

        // Update each wave (cheap operations only)
        waves.forEach(wave => {
            wave.life += deltaTime;

            wave.x += wave.vx * deltaTime;
            wave.y += wave.vy * deltaTime;

            const velLength = Math.sqrt(wave.vx * wave.vx + wave.vy * wave.vy);
            const perpX = -wave.vy / velLength;
            const perpY = wave.vx / velLength;
            const sineOffset = Math.sin(wave.life * wave.sineFreq + wave.sinePhase) * wave.sineAmplitude;
            const renderX = wave.x + perpX * sineOffset;
            const renderY = wave.y + perpY * sineOffset;

            const fadeInTime = 0.8;
            const fadeOutStart = wave.maxLife - 1.5;
            if (wave.life < fadeInTime) {
                wave.opacity = wave.life / fadeInTime;
            } else if (wave.life > fadeOutStart) {
                wave.opacity = Math.max(0, 1 - (wave.life - fadeOutStart) / 1.5);
            } else {
                wave.opacity = 1;
            }

            wave.renderX = renderX;
            wave.renderY = renderY;
        });

        // THROTTLED: expensive illumination calculation (50ms intervals)
        illuminationAccumulator += deltaTime;
        if (illuminationAccumulator >= ILLUMINATION_INTERVAL) {
            if (typeof TracksBackground !== 'undefined') {
                waves.forEach(wave => {
                    TracksBackground.illuminateTrack(
                        wave.renderX,
                        wave.renderY,
                        wave.radius,
                        wave.color,
                        wave.opacity
                    );
                });
            }
            illuminationAccumulator = 0;
        }

        // Remove dead waves
        waves = waves.filter(w => w.life < w.maxLife);

        renderAccumulator += deltaTime;
        if (renderAccumulator >= TARGET_FRAME_TIME) {
            render();
            renderAccumulator = 0;
        }
    }

    /**
     * Render waves to canvas
     */
    function render() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';

        waves.forEach(wave => {
            if (wave.opacity <= 0) return;

            const gradient = ctx.createRadialGradient(
                wave.renderX, wave.renderY, 0,
                wave.renderX, wave.renderY, wave.radius
            );

            const rgb = hexToRgb(wave.color);
            const alpha = wave.opacity * 0.35;

            gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
            gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.6})`);
            gradient.addColorStop(0.8, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.1})`);
            gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(wave.renderX, wave.renderY, wave.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Convert hex color to RGB object
     */
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    function spawnWave(color = null) {
        if (waves.length < MAX_WAVES) {
            waves.push(createWave(color));
        }
    }

    function clearWaves() {
        waves = [];
    }

    function getWaveCount() {
        return waves.length;
    }

    function destroy() {
        window.removeEventListener('resize', resize);
        waves = [];
        isActive = false;
        canvas = null;
        ctx = null;
    }

    return {
        init,
        update,
        render,
        spawnWave,
        clearWaves,
        getWaveCount,
        setColorOverride,
        clearColorOverride,
        destroy
    };
})();