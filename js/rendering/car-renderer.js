/* ============================================
   VELOCITY — CAR RENDERER
   Renders cars on track with smooth movement
   Updated every frame for fluid animation
   ============================================ */

window.CarRenderer = (() => {

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
                color: car.livery?.primary || car.team.color,
                livery: car.livery,
                isLocal: car.isLocalPlayer,
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
        const isLocal = visual.isLocal;
        const isPitting = car.isPittingNow;

        // PITTING CAR — show in pit lane area
        if (isPitting) {
            renderPittingCar(car, visual);
            return;
        }

        // Local Player specific glow (Livery Primary) vs Remote Player (White)
        if (isPlayer) {
            const pulseSize = 4 + Math.sin(visual.pulsePhase) * 2;
            ctx.beginPath();
            ctx.arc(visual.x, visual.y, size + pulseSize, 0, Math.PI * 2);
            
            const highlightColor = isLocal ? (visual.color || '#00D4FF') : '#FFFFFF';
            
            ctx.strokeStyle = highlightColor;
            ctx.lineWidth = isLocal ? 3 : 2;
            ctx.shadowColor = highlightColor;
            ctx.shadowBlur = isLocal ? 15 : 12;
            ctx.stroke();
            ctx.shadowBlur = 0;
            
            // Secondary ring for local
            if (isLocal) {
                ctx.beginPath();
                ctx.arc(visual.x, visual.y, size + pulseSize + 4, 0, Math.PI * 2);
                ctx.strokeStyle = highlightColor + '44'; // Translucent
                ctx.lineWidth = 1;
                ctx.stroke();
            }
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

        // --- AUTHENTIC PIT PATH OFFSET ---
        const trackPos = TrackRenderer.getTrackPosition(car.trackProgress);
        const tangent = TrackRenderer.getTrackTangent(car.trackProgress);
        
        // Use the car's individual dynamic lateral offset
        const lateralOffset = car.pitLateralOffset || -22; 
        const normal = { x: -tangent.y, y: tangent.x };
        
        const renderX = trackPos.x + normal.x * lateralOffset;
        const renderY = trackPos.y + normal.y * lateralOffset;

        // Background pit box highlight
        ctx.save();
        ctx.translate(renderX, renderY);
        ctx.rotate(Math.atan2(tangent.y, tangent.x));
        
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        ctx.fillRect(-15, -10, 30, 20);
        ctx.strokeStyle = car.team?.color || 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-15, -10, 30, 20);
        ctx.restore();

        // Car body
        ctx.fillStyle = visual.color;
        ctx.shadowColor = visual.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = phase === 'stopped' ? 0.9 : 1.0;
        ctx.beginPath();
        ctx.arc(renderX, renderY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Position number
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${size}px "Rajdhani", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${car.position}`, renderX, renderY + 1);
        ctx.textBaseline = 'alphabetic';

        // Phase indicator
        let phaseText = '';
        let phaseColor = '#FFFFFF';
        if (phase === 'entering') {
            phaseText = '↓ PIT';
            phaseColor = '#FFD700';
        } else if (phase === 'stopped') {
            const pulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
            phaseText = '🔧 BOX';
            phaseColor = `rgba(255, 100, 0, ${pulse})`;

            // Mechanics
            ctx.fillStyle = phaseColor;
            [[-12, -10], [12, -10], [-12, 10], [12, 10]].forEach(pos => {
                ctx.beginPath();
                ctx.arc(renderX + pos[0], renderY + pos[1], 2, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (phase === 'exiting') {
            phaseText = '↑ OUT';
            phaseColor = '#00FF41';
        }

        ctx.fillStyle = phaseColor;
        ctx.font = 'bold 8px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(phaseText, renderX, renderY - size - 6);

        // Progress bar
        if (car.pitAnimationDuration > 0) {
            const p = car.pitAnimationProgress / car.pitAnimationDuration;
            const barWidth = 24;
            const barHeight = 2;
            const barX = renderX - barWidth / 2;
            const barY = renderY + size + 4;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            ctx.fillStyle = phaseColor;
            ctx.fillRect(barX, barY, barWidth * p, barHeight);
        }
    }

    function renderPittingCarLegacy(car, visual) {
        // Implementation for older track versions
        const size = visual.size;
        const pitOffsetY = -35;
        const pitX = visual.x;
        const pitY = visual.y + pitOffsetY;
        
        ctx.fillStyle = visual.color;
        ctx.beginPath();
        ctx.arc(pitX, pitY, size, 0, Math.PI * 2);
        ctx.fill();
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