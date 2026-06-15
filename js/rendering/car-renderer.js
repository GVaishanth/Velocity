/* ============================================
   VELOCITY — CAR RENDERER
   Renders cars on track with smooth movement
   Updated every frame for fluid animation
   ============================================ */

const CarRenderer = (() => {

    let ctx = null;
    let carVisuals = new Map(); // carId -> visual state
    let lastPositions = new Map();

    /**
     * Initialize car visuals for all cars in the race
     */
    function init(cars) {
        carVisuals.clear();
        lastPositions.clear();

        cars.forEach(car => {
            carVisuals.set(car.id, {
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                rotation: 0,
                size: car.isPlayer ? 8 : 7,
                color: car.team.color,
                showLabel: car.isPlayer,
                pulsePhase: Math.random() * Math.PI * 2,
                trail: []
            });
        });
    }

    /**
     * Update car positions (called every frame)
     */
    function update(deltaTime, cars) {
        if (!cars) return;

        cars.forEach(car => {
            if (!carVisuals.has(car.id)) return;
            const visual = carVisuals.get(car.id);

            if (car.status === 'DNF') {
                visual.dnf = true;
                return;
            }

            // Get target position from track renderer
            const targetPos = TrackRenderer.getTrackPosition(car.trackProgress);
            visual.targetX = targetPos.x;
            visual.targetY = targetPos.y;

            // Calculate rotation from tangent
            const tangent = TrackRenderer.getTrackTangent(car.trackProgress);
            visual.rotation = Math.atan2(tangent.y, tangent.x);

            // Smooth movement (interpolate to target)
            if (visual.x === 0 && visual.y === 0) {
                // First update - snap to position
                visual.x = visual.targetX;
                visual.y = visual.targetY;
            } else {
                // Smooth lerp
                const lerpFactor = Math.min(1, deltaTime * 15);
                visual.x += (visual.targetX - visual.x) * lerpFactor;
                visual.y += (visual.targetY - visual.y) * lerpFactor;
            }

            // Update trail for player cars
            if (car.isPlayer && visual.trail.length < 8) {
                visual.trail.push({ x: visual.x, y: visual.y, age: 0 });
            }
            if (car.isPlayer) {
                visual.trail.forEach(t => t.age += deltaTime);
                visual.trail = visual.trail.filter(t => t.age < 0.4);
            }

            // Pulse phase for player markers
            visual.pulsePhase += deltaTime * 4;
        });
    }

    /**
     * Render all cars
     */
    function render(cars) {
        ctx = TrackRenderer.getCtx();
        if (!ctx || !cars) return;

        // Sort cars: DNF first (bottom), then by reverse position (leaders on top)
        const sortedCars = [...cars].sort((a, b) => {
            if (a.status === 'DNF' && b.status !== 'DNF') return -1;
            if (a.status !== 'DNF' && b.status === 'DNF') return 1;
            return b.position - a.position;
        });

        sortedCars.forEach(car => {
            renderCar(car);
        });
    }

    /**
     * Render a single car
     */
    function renderCar(car) {
        const visual = carVisuals.get(car.id);
        if (!visual) return;

        ctx.save();

        if (car.status === 'DNF') {
            renderDNFCar(visual);
        } else {
            // Render trail for player cars
            if (car.isPlayer && visual.trail.length > 0) {
                renderTrail(visual);
            }

            // Render the car
            renderActiveCar(car, visual);
        }

        ctx.restore();
    }

    /**
     * Render an active (racing) car
     */
    function renderActiveCar(car, visual) {
        const size = visual.size;
        const isLeader = car.position === 1;
        const isPlayer = car.isPlayer;
        const isPitting = car.isPittingNow;

        // PITTING CAR — show in pit lane area
        if (isPitting) {
            renderPittingCar(car, visual);
            return;
        }

        // Player glow ring
        if (isPlayer) {
            const pulseSize = 4 + Math.sin(visual.pulsePhase) * 2;
            ctx.beginPath();
            ctx.arc(visual.x, visual.y, size + pulseSize, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Leader crown
        if (isLeader && !car.isPlayer) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('♛', visual.x, visual.y - size - 4);
        }

        // Car body
        ctx.fillStyle = visual.color;
        ctx.shadowColor = visual.color;
        ctx.shadowBlur = isPlayer ? 8 : 4;
        ctx.beginPath();
        ctx.arc(visual.x, visual.y, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(visual.x - size * 0.3, visual.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isPlayer ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = isPlayer ? 1.5 : 1;
        ctx.beginPath();
        ctx.arc(visual.x, visual.y, size, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${size}px "Rajdhani", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${car.position}`, visual.x, visual.y + 1);
        ctx.textBaseline = 'alphabetic';

        // Pit incoming indicator
        if (car.pitNextLap) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 8px "Orbitron", sans-serif';
            ctx.fillText('→ PIT', visual.x, visual.y - size - 8);
        }

        // DRS indicator
        if (car.hasDRS) {
            ctx.fillStyle = '#00FF41';
            ctx.font = 'bold 6px "Orbitron", sans-serif';
            ctx.fillText('DRS', visual.x + size + 4, visual.y - size + 2);
        }

        // Driver name label for player cars
        if (isPlayer) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 9px "Rajdhani", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(car.driver.name.toUpperCase(), visual.x, visual.y + size + 12);
        }
    }

    /**
     * Render a car that's currently in the pit
     * Shows it offset from the track in pit lane area
     */
    function renderPittingCar(car, visual) {
        const size = visual.size;
        const phase = car.pitPhase;

        // Calculate pit lane position (offset above the regular track position)
        const pitOffsetY = -35;
        const pitX = visual.x;
        const pitY = visual.y + pitOffsetY;

        // Background pit box highlight
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.fillRect(pitX - 18, pitY - 12, 36, 24);
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pitX - 18, pitY - 12, 36, 24);

        // Car body (slightly transparent to show it's in pit)
        ctx.fillStyle = visual.color;
        ctx.shadowColor = visual.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = phase === 'stopped' ? 0.9 : 1.0;
        ctx.beginPath();
        ctx.arc(pitX, pitY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Position number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${size}px "Rajdhani", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${car.position}`, pitX, pitY + 1);
        ctx.textBaseline = 'alphabetic';

        // Phase indicator
        let phaseText = '';
        let phaseColor = '#FFFFFF';
        if (phase === 'entering') {
            phaseText = '↓ ENTERING';
            phaseColor = '#FFD700';
        } else if (phase === 'stopped') {
            // Pulsing tire change indicator
            const pulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
            phaseText = '🔧 CHANGING';
            phaseColor = `rgba(255, 100, 0, ${pulse})`;

            // Show 4 mechanic dots around the car
            ctx.fillStyle = `rgba(255, 200, 0, ${pulse})`;
            const positions = [
                [-12, -8], [12, -8], [-12, 8], [12, 8]
            ];
            positions.forEach(pos => {
                ctx.beginPath();
                ctx.arc(pitX + pos[0], pitY + pos[1], 2, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (phase === 'exiting') {
            phaseText = '↑ EXITING';
            phaseColor = '#00FF41';
        }

        ctx.fillStyle = phaseColor;
        ctx.font = 'bold 8px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(phaseText, pitX, pitY - size - 6);

        // Show driver name if player
        if (car.isPlayer) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = 'bold 9px "Rajdhani", sans-serif';
            ctx.fillText(car.driver.name.toUpperCase(), pitX, pitY + size + 18);
        }

        // Progress bar showing pit completion
        if (car.pitAnimationDuration > 0) {
            const progress = car.pitAnimationProgress / car.pitAnimationDuration;
            const barWidth = 32;
            const barHeight = 3;
            const barX = pitX - barWidth / 2;
            const barY = pitY + size + 4;

            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Fill
            ctx.fillStyle = phaseColor;
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        }
    }

    /**
     * Render a DNF (retired) car
     */
    function renderDNFCar(visual) {
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(visual.x, visual.y, visual.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#888888';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(visual.x - visual.size, visual.y - visual.size);
        ctx.lineTo(visual.x + visual.size, visual.y + visual.size);
        ctx.moveTo(visual.x + visual.size, visual.y - visual.size);
        ctx.lineTo(visual.x - visual.size, visual.y + visual.size);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    /**
     * Render motion trail behind player cars
     */
    function renderTrail(visual) {
        visual.trail.forEach((t, idx) => {
            const ageRatio = t.age / 0.4;
            const alpha = (1 - ageRatio) * 0.3;
            const size = visual.size * (1 - ageRatio * 0.5);

            ctx.globalAlpha = alpha;
            ctx.fillStyle = visual.color;
            ctx.beginPath();
            ctx.arc(t.x, t.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1.0;
    }

    /**
     * Cleanup
     */
    function destroy() {
        carVisuals.clear();
        lastPositions.clear();
    }

    return {
        init,
        update,
        render,
        destroy
    };
})();