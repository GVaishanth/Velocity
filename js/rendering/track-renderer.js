/* ============================================
   VELOCITY — TRACK RENDERER
   Renders track to canvas with sectors, pit lane,
   turn markers, DRS zones, weather overlay
   ============================================ */

window.TrackRenderer = (() => {

    let canvas = null;
    let ctx = null;
    let track = null;
    let trackPath = null;
    let pathPoints = [];
    let trackLength = 0;

    // Cached static layers
    let staticCanvas = null;
    let staticCtx = null;
    let staticCached = false;

    // Display configuration
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    let canvasWidth = 0;
    let canvasHeight = 0;

    // Track bounding box and center
    let centerX = 350;
    let centerY = 300;
    let pathWidth = 700;
    let pathHeight = 600;

    /**
     * Initialize renderer with canvas and track
     */
    function init(canvasElement, trackData) {
        canvas = canvasElement;
        ctx = canvas.getContext('2d');
        track = trackData;

        staticCanvas = document.createElement('canvas');
        staticCtx = staticCanvas.getContext('2d');

        buildPathData();
        resize();

        window.addEventListener('resize', resize);

        // Inject Camera Zoom Controls into the viewport
        let camBox = canvasElement.parentElement?.querySelector('.camera-controls');
        if (!camBox && canvasElement.parentElement) {
            camBox = document.createElement('div');
            camBox.className = 'camera-controls';
            camBox.style.cssText = 'position: absolute; bottom: 12px; right: 12px; display: flex; gap: 6px; z-index: 100; background: rgba(0,0,0,0.6); padding: 4px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);';
            camBox.innerHTML = `
                <button class="btn btn-yellow" id="btn-cam-zoom-in" title="Zoom In Track" style="padding: 6px 12px; font-family: Orbitron; font-weight: 900; font-size: 11px; cursor: pointer;">🔍 +</button>
                <button class="btn btn-yellow" id="btn-cam-zoom-out" title="Zoom Out Track" style="padding: 6px 12px; font-family: Orbitron; font-weight: 900; font-size: 11px; cursor: pointer;">🔍 -</button>
                <button class="btn btn-yellow" id="btn-cam-reset" title="Reset Zoom" style="padding: 6px 12px; font-family: Orbitron; font-weight: 900; font-size: 11px; cursor: pointer;">🔄 RESET</button>
            `;
            canvasElement.parentElement.appendChild(camBox);

            camBox.querySelector('#btn-cam-zoom-in')?.addEventListener('click', () => { zoomIn(); });
            camBox.querySelector('#btn-cam-zoom-out')?.addEventListener('click', () => { zoomOut(); });
            camBox.querySelector('#btn-cam-reset')?.addEventListener('click', () => { resetZoom(); });
        }
    }

    /**
     * Camera Zoom API Execution Matrix
     */
    function zoomIn() {
        if (!canvas) return;
        scale *= 1.25;
        offsetX = canvasWidth / 2 - centerX * scale;
        offsetY = canvasHeight / 2 - centerY * scale;
        staticCached = false;
        renderStaticLayers();
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
    }

    function zoomOut() {
        if (!canvas) return;
        scale /= 1.25;
        offsetX = canvasWidth / 2 - centerX * scale;
        offsetY = canvasHeight / 2 - centerY * scale;
        staticCached = false;
        renderStaticLayers();
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
    }

    function resetZoom() {
        resize();
        if (typeof AudioManager !== 'undefined') AudioManager.uiClick();
    }

    /**
     * Build path data and sample points along track
     */
    function buildPathData() {
        try {
            if (!track || !track.svgPath) throw new Error('Missing track path');

            // Create temporary SVG element to use getPointAtLength
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', track.svgPath);
            svg.appendChild(path);
            
            // Temporary mount to compute length
            svg.style.position = 'absolute';
            svg.style.visibility = 'hidden';
            document.body.appendChild(svg);

            trackLength = 0;
            try {
                trackLength = path.getTotalLength();
            } catch (e) {
                console.warn('[TrackRenderer] Could not compute path length, using fallback');
            }

            if (!trackLength || trackLength <= 0) trackLength = 1000;

            // Sample 800 points along path for car positioning
            const samples = 800;
            pathPoints = [];
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;

            for (let i = 0; i < samples; i++) {
                try {
                    const pt = path.getPointAtLength((i / samples) * trackLength);
                    pathPoints.push({ x: pt.x, y: pt.y, progress: i / samples });
                    if (pt.x < minX) minX = pt.x;
                    if (pt.x > maxX) maxX = pt.x;
                    if (pt.y < minY) minY = pt.y;
                    if (pt.y > maxY) maxY = pt.y;
                } catch (e) {
                    // Fallback point
                    pathPoints.push({ x: 350, y: 300, progress: i / samples });
                }
            }

            if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
                pathWidth = Math.max(100, maxX - minX);
                pathHeight = Math.max(100, maxY - minY);
                centerX = (minX + maxX) / 2;
                centerY = (minY + maxY) / 2;
            } else {
                pathWidth = 700;
                pathHeight = 600;
                centerX = 350;
                centerY = 300;
            }

            trackPath = path;
            document.body.removeChild(svg);
        } catch (err) {
            console.error('[TrackRenderer] buildPathData critical error:', err);
            // Emergency fallback points
            pathPoints = Array(800).fill(0).map((_, i) => ({ x: 350, y: 300, progress: i / 800 }));
        }
    }

    /**
     * Resize canvas to fit container
     */
    function resize() {
        if (!canvas) return;
        const parent = canvas.parentElement;
        if (!parent) return;

        canvasWidth = parent.clientWidth;
        canvasHeight = parent.clientHeight;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvasWidth * dpr;
        canvas.height = canvasHeight * dpr;
        canvas.style.width = canvasWidth + 'px';
        canvas.style.height = canvasHeight + 'px';
        ctx.scale(dpr, dpr);

        // Calculate scale to perfectly centralize and fit track
        const scaleX = canvasWidth / (pathWidth * 1.25); // Add 25% padding around track
        const scaleY = canvasHeight / (pathHeight * 1.25);
        scale = Math.min(scaleX, scaleY);

        offsetX = canvasWidth / 2 - centerX * scale;
        offsetY = canvasHeight / 2 - centerY * scale;

        // Setup static canvas
        staticCanvas.width = canvasWidth * dpr;
        staticCanvas.height = canvasHeight * dpr;
        staticCtx.scale(dpr, dpr);

        staticCached = false;
        renderStaticLayers();
    }

    /**
     * Render static layers (track, sectors, pit lane, turn numbers)
     * Done once and cached
     */
    function renderStaticLayers() {
        if (!track) return;

        staticCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        // Background gradient
        const gradient = staticCtx.createRadialGradient(
            canvasWidth / 2, canvasHeight / 2, 0,
            canvasWidth / 2, canvasHeight / 2, canvasWidth / 2
        );
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#000000');
        staticCtx.fillStyle = gradient;
        staticCtx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw subtle grid
        drawGrid();

        // Draw track with glow
        drawTrack();

        // Draw start/finish line
        drawStartFinishLine();

        // Draw pit lane
        drawPitLane();

        // Draw sector markers
        drawSectorMarkers();

        // Draw turn numbers
        drawTurnNumbers();

        // Compass
        drawCompass();

        staticCached = true;
    }

    /**
     * Draw subtle background grid
     */
    function drawGrid() {
        staticCtx.save();
        staticCtx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        staticCtx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < canvasWidth; x += gridSize) {
            staticCtx.beginPath();
            staticCtx.moveTo(x, 0);
            staticCtx.lineTo(x, canvasHeight);
            staticCtx.stroke();
        }
        for (let y = 0; y < canvasHeight; y += gridSize) {
            staticCtx.beginPath();
            staticCtx.moveTo(0, y);
            staticCtx.lineTo(canvasWidth, y);
            staticCtx.stroke();
        }
        staticCtx.restore();
    }

    /**
     * Draw the main track outline
     */
    function drawTrack() {
        staticCtx.save();
        staticCtx.translate(offsetX, offsetY);
        staticCtx.scale(scale, scale);

        // Outer glow
        staticCtx.shadowColor = 'rgba(255, 255, 255, 0.4)';
        staticCtx.shadowBlur = 15;

        // Track outline (thick)
        staticCtx.strokeStyle = '#FFFFFF';
        staticCtx.lineWidth = 14;
        staticCtx.lineJoin = 'round';
        staticCtx.lineCap = 'round';
        
        const drawPath = (ctx2d) => {
            try {
                const p2d = new Path2D(track.svgPath);
                ctx2d.stroke(p2d);
                return p2d;
            } catch (e) {
                console.warn('[TrackRenderer] Path2D failed');
                return null;
            }
        };

        const path2d = drawPath(staticCtx);
        
        // Inner track (asphalt color)
        staticCtx.shadowBlur = 0;
        staticCtx.strokeStyle = '#1a1a1a';
        staticCtx.lineWidth = 10;
        if (path2d) staticCtx.stroke(path2d);

        // Track edges (thin lines on top)
        staticCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        staticCtx.lineWidth = 12;
        staticCtx.globalAlpha = 0.3;
        if (path2d) staticCtx.stroke(path2d);
        staticCtx.globalAlpha = 1.0;

        staticCtx.restore();
    }

    /**
     * Draw start/finish line
     */
    function drawStartFinishLine() {
        if (pathPoints.length === 0) return;

        staticCtx.save();
        staticCtx.translate(offsetX, offsetY);
        staticCtx.scale(scale, scale);

        const startPoint = pathPoints[0];
        const nextPoint = pathPoints[5];
        if (!startPoint || !nextPoint) {
            staticCtx.restore();
            return;
        }

        // Compute perpendicular direction
        const dx = nextPoint.x - startPoint.x;
        const dy = nextPoint.y - startPoint.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len;
        const perpY = dx / len;

        const lineWidth = 12;

        // Checkered pattern
        for (let i = -3; i < 3; i++) {
            staticCtx.fillStyle = (i % 2 === 0) ? '#FFFFFF' : '#000000';
            staticCtx.beginPath();
            staticCtx.moveTo(
                startPoint.x + perpX * lineWidth + (i * 2),
                startPoint.y + perpY * lineWidth + (i * 2 * dy / len)
            );
            staticCtx.arc(startPoint.x, startPoint.y, 8, 0, Math.PI * 2);
            staticCtx.fill();
        }

        // Simple line approach
        staticCtx.strokeStyle = '#FFFFFF';
        staticCtx.lineWidth = 3;
        staticCtx.beginPath();
        staticCtx.moveTo(startPoint.x + perpX * lineWidth, startPoint.y + perpY * lineWidth);
        staticCtx.lineTo(startPoint.x - perpX * lineWidth, startPoint.y - perpY * lineWidth);
        staticCtx.stroke();

        // "START / FINISH" label
        staticCtx.fillStyle = '#FFFFFF';
        staticCtx.font = 'bold 9px "Orbitron", sans-serif';
        staticCtx.textAlign = 'center';
        staticCtx.fillText('S/F', startPoint.x + perpX * 22, startPoint.y + perpY * 22 + 3);

        staticCtx.restore();
    }

    /**
     * Draw pit lane parallel to start/finish
     */
    function drawPitLane() {
        if (!track.pitLane) return;

        staticCtx.save();
        staticCtx.translate(offsetX, offsetY);
        staticCtx.scale(scale, scale);

        const pitOffset = -22; 
        staticCtx.lineJoin = 'round';
        staticCtx.lineCap = 'round';

        // 1. Draw Pit Lane Background (Asphalt)
        staticCtx.beginPath();
        staticCtx.lineWidth = 12;
        staticCtx.strokeStyle = 'rgba(40, 40, 45, 0.9)';
        
        const samples = pathPoints.length;
        if (samples === 0) return; // Prevent crash if points didn't build

        const startIdx = Math.floor(0.97 * samples);
        const endIdx = Math.floor(0.03 * samples);
        
        let first = true;
        // Correct order: 0.97 -> 1.0, then 0.0 -> 0.03
        for (let i = startIdx; i < samples + endIdx; i++) {
            const idx = i % samples;
            const prog = idx / samples;
            const pt = pathPoints[idx];
            const tangent = getTrackTangent(prog);
            const normal = { x: -tangent.y, y: tangent.x };
            const px = pt.x + normal.x * pitOffset;
            const py = pt.y + normal.y * pitOffset;
            
            if (first) { staticCtx.moveTo(px, py); first = false; }
            else { staticCtx.lineTo(px, py); }
        }
        staticCtx.stroke();

        // 2. Draw Pit Lane Borders (Yellow)
        staticCtx.lineWidth = 1;
        staticCtx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        staticCtx.stroke(); 

        // 3. Draw Pit Boxes (Garages)
        const teamColors = TEAMS_DATA.map(t => t.color);
        for (let i = 0; i < 12; i++) {
            const boxProg = (0.97 + (0.06 * (i + 1) / 13)) % 1.0;
            const idx = Math.floor(boxProg * samples);
            const pt = pathPoints[idx];
            const tangent = getTrackTangent(boxProg);
            const normal = { x: -tangent.y, y: tangent.x };
            const bx = pt.x + normal.x * pitOffset;
            const by = pt.y + normal.y * pitOffset;
            
            staticCtx.save();
            staticCtx.translate(bx, by);
            staticCtx.rotate(Math.atan2(tangent.y, tangent.x));
            
            // Pit Box marker (aligned to lane)
            staticCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            staticCtx.fillRect(-8, -5, 16, 10);
            staticCtx.strokeStyle = teamColors[i] || '#FFD700';
            staticCtx.lineWidth = 1;
            staticCtx.strokeRect(-8, -5, 16, 10);
            
            staticCtx.restore();
        }

        // 4. PIT ENTRY/EXIT Arrows
        staticCtx.fillStyle = 'rgba(0, 255, 65, 0.7)';
        staticCtx.font = 'bold 9px "Orbitron", sans-serif';
        
        const entryPt = pathPoints[Math.floor(0.97 * samples)];
        const entryTangent = getTrackTangent(0.97);
        const entryNormal = { x: -entryTangent.y, y: entryTangent.x };
        staticCtx.fillText('▶ PIT IN', entryPt.x + entryNormal.x * pitOffset - 8, entryPt.y + entryNormal.y * pitOffset - 10);

        staticCtx.restore();
    }

    /**
     * Draw sector divider markers
     */
    function drawSectorMarkers() {
        if (!track.sectors) return;

        staticCtx.save();
        staticCtx.translate(offsetX, offsetY);
        staticCtx.scale(scale, scale);

        const colors = ['#AA33FF', '#00FF41', '#FFD700']; // S1, S2, S3 colors
        track.sectors.forEach((sector, idx) => {
            staticCtx.fillStyle = colors[idx];
            staticCtx.shadowColor = colors[idx];
            staticCtx.shadowBlur = 10;
            staticCtx.beginPath();
            staticCtx.arc(sector.x, sector.y, 4, 0, Math.PI * 2);
            staticCtx.fill();

            // Label
            staticCtx.shadowBlur = 0;
            staticCtx.fillStyle = colors[idx];
            staticCtx.font = 'bold 9px "Orbitron", sans-serif';
            staticCtx.fillText(`S${idx + 1}`, sector.x + 8, sector.y - 5);
        });
        staticCtx.restore();
    }

    /**
     * Draw turn numbers along track
     */
    function drawTurnNumbers() {
        if (!pathPoints.length || !track.corners) return;

        staticCtx.save();
        staticCtx.translate(offsetX, offsetY);
        staticCtx.scale(scale, scale);

        const cornerCount = Math.min(track.corners, 20);
        for (let i = 0; i < cornerCount; i++) {
            const progress = (i + 0.5) / cornerCount;
            const idx = Math.floor(progress * pathPoints.length);
            const pt = pathPoints[idx];
            if (!pt) continue;

            // Skip if too close to other markers
            staticCtx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            staticCtx.font = 'bold 8px "Rajdhani", sans-serif';
            staticCtx.textAlign = 'center';
            staticCtx.fillText(`${i + 1}`, pt.x, pt.y + 3);
        }

        staticCtx.restore();
    }

    /**
     * Draw compass rose
     */
    function drawCompass() {
        staticCtx.save();
        const cx = 30;
        const cy = canvasHeight - 30;

        staticCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        staticCtx.font = 'bold 10px "Orbitron", sans-serif';
        staticCtx.textAlign = 'center';
        staticCtx.fillText('N', cx, cy - 12);
        staticCtx.fillText('S', cx, cy + 18);
        staticCtx.fillText('W', cx - 14, cy + 3);
        staticCtx.fillText('E', cx + 14, cy + 3);

        staticCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        staticCtx.lineWidth = 1;
        staticCtx.beginPath();
        staticCtx.arc(cx, cy, 12, 0, Math.PI * 2);
        staticCtx.stroke();
        staticCtx.restore();
    }

    /**
     * Render the cached static layers to main canvas
     */
    function renderStatic() {
        if (!staticCached) renderStaticLayers();
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(staticCanvas, 0, 0, canvasWidth, canvasHeight);
    }

    /**
     * Get position on track for given progress (0-1)
     */
    function getTrackPosition(progress) {
        if (!pathPoints || pathPoints.length === 0) return { x: 0, y: 0 };
        let norm = progress % 1;
        if (norm < 0) norm += 1;
        const idx = Math.floor(norm * pathPoints.length) % pathPoints.length;
        const pt = pathPoints[idx] || pathPoints[0];

        // Transform to canvas coords
        return {
            x: pt.x * scale + offsetX,
            y: pt.y * scale + offsetY
        };
    }

    /**
     * Get tangent (direction) at progress
     */
    function getTrackTangent(progress) {
        if (!pathPoints || pathPoints.length < 2) return { x: 1, y: 0 };
        let norm = progress % 1;
        if (norm < 0) norm += 1;
        const idx = Math.floor(norm * pathPoints.length) % pathPoints.length;
        const next = (idx + 1) % pathPoints.length;
        const pt1 = pathPoints[idx] || pathPoints[0];
        const pt2 = pathPoints[next] || pathPoints[0];
        const dx = pt2.x - pt1.x;
        const dy = pt2.y - pt1.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        return { x: dx / len, y: dy / len };
    }

    function getCtx() { return ctx; }
    function getCanvasWidth() { return canvasWidth; }
    function getCanvasHeight() { return canvasHeight; }
    function getScale() { return scale; }
    function getOffset() { return { x: offsetX, y: offsetY }; }

    function destroy() {
        window.removeEventListener('resize', resize);
        canvas = null;
        ctx = null;
        staticCanvas = null;
        staticCached = false;
    }

    function getTrack() { return track; }

    return {
        init,
        resize,
        renderStatic,
        getTrackPosition,
        getTrackTangent,
        getTrack,
        getCtx,
        getCanvasWidth,
        getCanvasHeight,
        getScale,
        getOffset,
        zoomIn,
        zoomOut,
        resetZoom,
        destroy
    };
})();