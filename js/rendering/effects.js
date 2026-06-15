/* ============================================
   VELOCITY — VISUAL EFFECTS
   Weather overlays, crash effects, pit stop animations
   ============================================ */

const Effects = (() => {

    let ctx = null;
    let canvasWidth = 0;
    let canvasHeight = 0;

    // Effect collections
    let rainDrops = [];
    let crashEffects = [];
    let safetyCarFlash = 0;

    /**
     * Initialize effects system
     */
    function init() {
        rainDrops = [];
        crashEffects = [];
        safetyCarFlash = 0;
    }

    /**
     * Update all effects (called per frame)
     */
    function update(deltaTime, raceState) {
        if (!raceState) return;

        canvasWidth = TrackRenderer.getCanvasWidth();
        canvasHeight = TrackRenderer.getCanvasHeight();

        // Update rain
        const weather = raceState.weather?.current;
        if (weather === 'LIGHT_RAIN' || weather === 'HEAVY_RAIN') {
            updateRain(deltaTime, weather);
        } else {
            rainDrops = [];
        }

        // Update crash effects
        updateCrashEffects(deltaTime);

        // Safety car flashing
        if (raceState.status === 'SAFETY_CAR') {
            safetyCarFlash += deltaTime;
        } else {
            safetyCarFlash = 0;
        }
    }

    /**
     * Render all effects (called per frame)
     */
    function render(raceState) {
        ctx = TrackRenderer.getCtx();
        if (!ctx || !raceState) return;

        // Weather overlay
        renderWeatherOverlay(raceState.weather);

        // Rain particles
        if (rainDrops.length > 0) renderRain();

        // Crash effects
        renderCrashEffects();

        // Safety car overlay
        if (raceState.status === 'SAFETY_CAR') {
            renderSafetyCarOverlay();
        }

        // VSC overlay
        if (raceState.status === 'VSC') {
            renderVSCOverlay();
        }
    }

    /**
     * Update rain particles
     */
    function updateRain(deltaTime, intensity) {
        const targetDrops = intensity === 'HEAVY_RAIN' ? 150 : 60;

        // Spawn new drops
        while (rainDrops.length < targetDrops) {
            rainDrops.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * -canvasHeight,
                speed: 400 + Math.random() * 200,
                length: 10 + Math.random() * 15,
                opacity: 0.3 + Math.random() * 0.3
            });
        }

        // Update drops
        rainDrops.forEach(drop => {
            drop.y += drop.speed * deltaTime;
            drop.x -= 80 * deltaTime; // wind effect

            // Recycle when off-screen
            if (drop.y > canvasHeight) {
                drop.y = -drop.length;
                drop.x = Math.random() * canvasWidth + 100;
            }
        });
    }

    /**
     * Render rain particles
     */
    function renderRain() {
        ctx.save();
        ctx.strokeStyle = 'rgba(170, 200, 255, 0.6)';
        ctx.lineWidth = 1.2;

        rainDrops.forEach(drop => {
            ctx.globalAlpha = drop.opacity;
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 8, drop.y + drop.length);
            ctx.stroke();
        });

        ctx.globalAlpha = 1.0;
        ctx.restore();
    }

    /**
     * Render weather color overlay
     */
    function renderWeatherOverlay(weatherState) {
        if (!weatherState) return;

        ctx.save();
        switch (weatherState.current) {
            case 'CLOUDY':
                ctx.fillStyle = 'rgba(80, 80, 90, 0.10)';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                break;
            case 'LIGHT_RAIN':
                ctx.fillStyle = 'rgba(40, 60, 90, 0.20)';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                break;
            case 'HEAVY_RAIN':
                ctx.fillStyle = 'rgba(20, 30, 60, 0.35)';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                break;
            case 'DRYING':
                ctx.fillStyle = 'rgba(100, 100, 80, 0.10)';
                ctx.fillRect(0, 0, canvasWidth, canvasHeight);
                break;
        }
        ctx.restore();
    }

    /**
     * Trigger crash effect at a position
     */
    function triggerCrash(x, y) {
        crashEffects.push({
            x, y,
            age: 0,
            maxAge: 1.5,
            particles: createCrashParticles(x, y)
        });
    }

    /**
     * Create crash particles
     */
    function createCrashParticles(x, y) {
        const particles = [];
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                color: i % 3 === 0 ? '#FF6600' : '#FFD700'
            });
        }
        return particles;
    }

    /**
     * Update crash particles
     */
    function updateCrashEffects(deltaTime) {
        crashEffects.forEach(effect => {
            effect.age += deltaTime;
            effect.particles.forEach(p => {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.vy += 200 * deltaTime; // gravity
                p.vx *= 0.95; // air resistance
            });
        });
        // Remove old effects
        crashEffects = crashEffects.filter(e => e.age < e.maxAge);
    }

    /**
     * Render crash effects
     */
    function renderCrashEffects() {
        crashEffects.forEach(effect => {
            const fade = 1 - (effect.age / effect.maxAge);

            // Initial flash
            if (effect.age < 0.15) {
                const flashAlpha = (1 - effect.age / 0.15) * 0.7;
                ctx.save();
                ctx.globalAlpha = flashAlpha;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(effect.x, effect.y, 30, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Particles
            ctx.save();
            ctx.globalAlpha = fade;
            effect.particles.forEach(p => {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        });
    }

    /**
     * Safety car overlay (flashing yellow border + SC car visual on track)
     */
    function renderSafetyCarOverlay() {
        const intensity = (Math.sin(safetyCarFlash * 4) + 1) / 2;
        const alpha = 0.25 + intensity * 0.3;

        ctx.save();

        // Yellow flashing border
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha})`;
        ctx.lineWidth = 6;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        // Inner glow
        ctx.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.4})`;
        ctx.lineWidth = 18;
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);

        // SC banner at top
        const bannerHeight = 50;
        const bannerY = 0;

        // Banner background with stripes
        ctx.fillStyle = `rgba(255, 215, 0, ${0.85 + intensity * 0.15})`;
        ctx.fillRect(0, bannerY, canvasWidth, bannerHeight);

        // Diagonal stripes
        ctx.fillStyle = `rgba(0, 0, 0, 0.3)`;
        const stripeWidth = 25;
        for (let i = -bannerHeight; i < canvasWidth; i += stripeWidth * 2) {
            ctx.beginPath();
            ctx.moveTo(i, bannerY);
            ctx.lineTo(i + stripeWidth, bannerY);
            ctx.lineTo(i + stripeWidth + bannerHeight, bannerY + bannerHeight);
            ctx.lineTo(i + bannerHeight, bannerY + bannerHeight);
            ctx.closePath();
            ctx.fill();
        }

        // Main text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Safety car symbol + text
        const text = '🚨 SAFETY CAR DEPLOYED 🚨';
        ctx.fillText(text, canvasWidth / 2, bannerHeight / 2);
        ctx.textBaseline = 'alphabetic';

        // Render safety car icon ON the track (following the leader)
        renderSafetyCarOnTrack();

        ctx.restore();
    }

    /**
     * Render the SC car following the race leader
     */
    function renderSafetyCarOnTrack() {
        if (typeof RaceEngine === 'undefined' || !RaceEngine.getCars) return;

        const cars = RaceEngine.getCars();
        if (!cars || cars.length === 0) return;

        // Find race leader (first non-DNF car)
        const leader = cars.find(c => c.status !== 'DNF' && c.status !== 'FINISHED');
        if (!leader) return;

        // Position SC ahead of leader
        let scProgress = leader.trackProgress + 0.03;
        if (scProgress >= 1) scProgress -= 1;

        if (typeof TrackRenderer === 'undefined' || !TrackRenderer.getTrackPosition) return;
        const scPos = TrackRenderer.getTrackPosition(scProgress);

        // Draw SC vehicle (yellow with flashing lights)
        const flashPulse = Math.sin(performance.now() * 0.015) > 0;

        // Car body (rectangle to differentiate from racers)
        ctx.save();
        ctx.translate(scPos.x, scPos.y);

        // Get rotation from track
        const tangent = TrackRenderer.getTrackTangent(scProgress);
        const rotation = Math.atan2(tangent.y, tangent.x);
        ctx.rotate(rotation);

        // Main body
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 12;
        ctx.fillRect(-10, -6, 20, 12);
        ctx.shadowBlur = 0;

        // Black outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-10, -6, 20, 12);

        // Flashing lights on top
        if (flashPulse) {
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.shadowBlur = 10;
            ctx.fillRect(-8, -8, 4, 3);
            ctx.fillStyle = '#0000FF';
            ctx.shadowColor = '#0000FF';
            ctx.fillRect(4, -8, 4, 3);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#0000FF';
            ctx.shadowColor = '#0000FF';
            ctx.shadowBlur = 10;
            ctx.fillRect(-8, -8, 4, 3);
            ctx.fillStyle = '#FF0000';
            ctx.shadowColor = '#FF0000';
            ctx.fillRect(4, -8, 4, 3);
            ctx.shadowBlur = 0;
        }

        // "SC" label
        ctx.rotate(-rotation); // Counter-rotate text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 7px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SC', 0, 14);

        ctx.restore();
    }

    /**
     * Virtual Safety Car overlay
     */
    function renderVSCOverlay() {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.strokeRect(0, 0, canvasWidth, canvasHeight);
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.font = 'bold 14px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VSC', canvasWidth / 2, 30);
        ctx.restore();
    }

    /**
     * Render race event overlay (for big announcements)
     */
    function showEventBanner(text, color = '#FFFFFF', duration = 2000) {
        const overlay = document.querySelector('.race-event-overlay');
        if (!overlay) return;

        overlay.innerHTML = `<div class="race-event-text" style="color: ${color}">${text}</div>`;
        setTimeout(() => {
            const el = overlay.querySelector('.race-event-text');
            if (el) el.remove();
        }, duration);
    }

    function destroy() {
        rainDrops = [];
        crashEffects = [];
    }

    return {
        init,
        update,
        render,
        triggerCrash,
        showEventBanner,
        destroy
    };
})();