/* ============================================
   VELOCITY — TRACKS BACKGROUND (OPTIMIZED & ZERO-LAG)
   - Pre-rendered static base background canvas
   - Draws Master canvas in a single draw call
   - Interactive zero-lag hover illumination near mouse
   - Added 5 new iconic F1 track layouts
   ============================================ */

const TracksBackground = (() => {

    let canvas = null;
    let ctx = null;
    let width = 0;
    let height = 0;
    let tracks = [];
    let trackShapes = [];
    let isActive = false;
    let dpr = 1;

    // Static master layer cache
    let staticMasterCanvas = null;
    let staticMasterCtx = null;
    let needsMasterRedraw = true;
    let fullyLoaded = false;

    // Auto-detect optimal count based on device
    const TRACK_COUNT = detectOptimalTrackCount();
    const TRACK_SIZES = { min: 28, max: 70 };

    /**
     * Detect ideal track count based on device performance
     */
    function detectOptimalTrackCount() {
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const screenArea = window.innerWidth * window.innerHeight;

        if (isMobile) return 100;
        if (cores <= 2) return 120;
        if (cores <= 4) return 180;
        if (screenArea < 1000000) return 200;
        return 250;
    }

    /**
     * Initialize the tracks background
     */
    function init(canvasElement) {
        canvas = canvasElement;
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        dpr = window.devicePixelRatio || 1;

        buildTrackShapes();
        resize();

        window.addEventListener('resize', resize);

        // Zero-lag highly interactive mouse illumination HUD
        window.addEventListener('mousemove', (e) => {
            if (!isActive || !canvas) return;
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const interactiveColors = ['#00FF41', '#0080FF', '#FFD700', '#FF0033', '#AA33FF'];
            const color = interactiveColors[Math.floor(performance.now() / 1200) % interactiveColors.length];
            illuminateTrack(mouseX, mouseY, 180, color, 0.95);
        }, { passive: true });

        isActive = true;
    }

    /**
     * Handle canvas resize
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

        staticMasterCanvas = document.createElement('canvas');
        staticMasterCanvas.width = width * dpr;
        staticMasterCanvas.height = height * dpr;
        staticMasterCtx = staticMasterCanvas.getContext('2d');
        staticMasterCtx.scale(dpr, dpr);

        needsMasterRedraw = true;
        fullyLoaded = false;

        generateTracks();
    }

    /**
     * Build the pool of track shapes from TRACKS_DATA
     */
    function buildTrackShapes() {
        trackShapes = [];

        if (typeof TRACKS_DATA === 'undefined') {
            console.warn('[TracksBackground] TRACKS_DATA not loaded');
            return;
        }

        TRACKS_DATA.forEach(trackData => {
            const shape = {
                id: trackData.id,
                path: trackData.svgPath,
                viewBox: { width: 700, height: 600 },
                cachedRenders: new Map(),
                cachedTinted: new Map()
            };
            trackShapes.push(shape);
        });
    }

    /**
     * Get or create a base WHITE render of a track at given size
     */
    function getTrackRender(shape, size) {
        const sizeKey = Math.round(size);
        if (shape.cachedRenders.has(sizeKey)) {
            return shape.cachedRenders.get(sizeKey);
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = sizeKey;
        offCanvas.height = sizeKey;
        const offCtx = offCanvas.getContext('2d');

        const scale = Math.min(sizeKey / shape.viewBox.width, sizeKey / shape.viewBox.height) * 0.85;
        const offsetX = (sizeKey - shape.viewBox.width * scale) / 2;
        const offsetY = (sizeKey - shape.viewBox.height * scale) / 2;

        offCtx.translate(offsetX, offsetY);
        offCtx.scale(scale, scale);

        try {
            const path2D = new Path2D(shape.path);
            offCtx.strokeStyle = '#FFFFFF';
            offCtx.lineWidth = 4 / scale;
            offCtx.lineJoin = 'round';
            offCtx.lineCap = 'round';
            offCtx.stroke(path2D);
        } catch (e) {
            console.warn('[TracksBackground] Failed to render track:', e);
        }

        shape.cachedRenders.set(sizeKey, offCanvas);
        return offCanvas;
    }

    /**
     * Get or create a TINTED (colored) render of a track
     * The path stroke itself is rendered in the target color
     */
    function getTintedRender(shape, size, color) {
        const sizeKey = Math.round(size);
        const cacheKey = `${sizeKey}_${color}`;

        if (shape.cachedTinted.has(cacheKey)) {
            return shape.cachedTinted.get(cacheKey);
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = sizeKey;
        offCanvas.height = sizeKey;
        const offCtx = offCanvas.getContext('2d');

        const scale = Math.min(sizeKey / shape.viewBox.width, sizeKey / shape.viewBox.height) * 0.85;
        const offsetX = (sizeKey - shape.viewBox.width * scale) / 2;
        const offsetY = (sizeKey - shape.viewBox.height * scale) / 2;

        offCtx.translate(offsetX, offsetY);
        offCtx.scale(scale, scale);

        try {
            const path2D = new Path2D(shape.path);
            offCtx.strokeStyle = color;
            offCtx.lineWidth = 4 / scale;
            offCtx.lineJoin = 'round';
            offCtx.lineCap = 'round';
            offCtx.stroke(path2D);
        } catch (e) {
            console.warn('[TracksBackground] Failed to render tinted track:', e);
        }

        if (shape.cachedTinted.size > 50) {
            const firstKey = shape.cachedTinted.keys().next().value;
            shape.cachedTinted.delete(firstKey);
        }

        shape.cachedTinted.set(cacheKey, offCanvas);
        return offCanvas;
    }

    /**
     * Generate scattered track instances using grid + jitter
     */
    function generateTracks() {
        tracks = [];

        if (trackShapes.length === 0) return;

        const cols = Math.ceil(Math.sqrt(TRACK_COUNT * (width / height)));
        const rows = Math.ceil(TRACK_COUNT / cols);
        const cellW = width / cols;
        const cellH = height / rows;

        let placed = 0;
        for (let r = 0; r < rows && placed < TRACK_COUNT; r++) {
            for (let c = 0; c < cols && placed < TRACK_COUNT; c++) {
                const centerX = width / 2;
                const centerY = height / 2;
                const tentativeX = c * cellW + cellW / 2 + (Math.random() - 0.5) * cellW * 0.6;
                const tentativeY = r * cellH + cellH / 2 + (Math.random() - 0.5) * cellH * 0.6;

                const distFromCenter = Math.sqrt(
                    Math.pow(tentativeX - centerX, 2) +
                    Math.pow(tentativeY - centerY, 2)
                );

                if (distFromCenter < 340) continue;

                const size = TRACK_SIZES.min + Math.random() * (TRACK_SIZES.max - TRACK_SIZES.min);
                const shape = trackShapes[Math.floor(Math.random() * trackShapes.length)];

                tracks.push({
                    x: tentativeX,
                    y: tentativeY,
                    size: size,
                    rotation: Math.random() * Math.PI * 2,
                    shape: shape,
                    baseOpacity: 0.12 + Math.random() * 0.2,
                    currentOpacity: 0,
                    illumination: 0,
                    illuminationColor: null,
                    fadeInDelay: Math.random() * 1200,
                    fadeInStartTime: performance.now()
                });

                placed++;
            }
        }

        needsMasterRedraw = true;
        fullyLoaded = false;
    }

    /**
     * Wave system or mouse calls this to light up nearby tracks instantly
     */
    function illuminateTrack(x, y, radius, color, intensity = 1.0) {
        tracks.forEach(track => {
            const dx = track.x - x;
            const dy = track.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < radius) {
                const influence = (1 - dist / radius) * intensity;
                if (influence > track.illumination) {
                    track.illumination = influence;
                    track.illuminationColor = color;
                }
            }
        });
    }

    /**
     * Update tracks each frame
     */
    function update(deltaTime) {
        if (!isActive) return;
        const now = performance.now();

        let allLoaded = true;
        tracks.forEach(track => {
            if (track.currentOpacity < track.baseOpacity) {
                allLoaded = false;
                if (now > track.fadeInStartTime + track.fadeInDelay) {
                    track.currentOpacity = Math.min(
                        track.baseOpacity,
                        track.currentOpacity + deltaTime * 1.5
                    );
                    needsMasterRedraw = true;
                }
            }

            if (track.illumination > 0) {
                track.illumination = Math.max(0, track.illumination - deltaTime * 2.2);
                if (track.illumination === 0) {
                    track.illuminationColor = null;
                }
            }
        });

        if (allLoaded && !fullyLoaded) {
            fullyLoaded = true;
            needsMasterRedraw = true;
        }

        render();
    }

    /**
     * Render tracks - Draws Master canvas in 1 draw call, plus dynamic glows
     */
    function render() {
        if (!ctx) return;
        ctx.clearRect(0, 0, width, height);

        // 1. Redraw Master Layer cache if initial fade-in is occurring
        if (needsMasterRedraw && staticMasterCtx) {
            staticMasterCtx.clearRect(0, 0, width, height);
            tracks.forEach(track => {
                if (track.currentOpacity <= 0) return;
                staticMasterCtx.save();
                staticMasterCtx.translate(track.x, track.y);
                staticMasterCtx.rotate(track.rotation);

                const baseRender = getTrackRender(track.shape, track.size);
                if (baseRender) {
                    staticMasterCtx.globalAlpha = track.currentOpacity;
                    staticMasterCtx.globalCompositeOperation = 'screen';
                    staticMasterCtx.drawImage(baseRender, -track.size / 2, -track.size / 2, track.size, track.size);
                }
                staticMasterCtx.restore();
            });

            if (fullyLoaded) needsMasterRedraw = false;
        }

        // 2. Draw cached Master Layer (Single ultra-fast draw call!)
        if (staticMasterCanvas) {
            ctx.drawImage(staticMasterCanvas, 0, 0, width, height);
        }

        // 3. Draw active interactive neon overlays
        ctx.globalCompositeOperation = 'screen';
        tracks.forEach(track => {
            if (track.illumination <= 0 || !track.illuminationColor) return;

            ctx.save();
            ctx.translate(track.x, track.y);
            ctx.rotate(track.rotation);

            const halfSize = track.size / 2;
            const tintedRender = getTintedRender(track.shape, track.size, track.illuminationColor);
            if (tintedRender) {
                ctx.globalAlpha = track.illumination;
                ctx.drawImage(tintedRender, -halfSize, -halfSize, track.size, track.size);
            }
            ctx.restore();
        });

        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * Force all tracks to pulse in a color
     */
    function pulseAllInColor(color, intensity = 0.6) {
        tracks.forEach(track => {
            track.illumination = Math.max(track.illumination, intensity);
            track.illuminationColor = color;
        });
    }

    function getTracks() {
        return tracks;
    }

    function getDimensions() {
        return { width, height };
    }

    function destroy() {
        window.removeEventListener('resize', resize);
        isActive = false;
        canvas = null;
        ctx = null;
        staticMasterCanvas = null;
        staticMasterCtx = null;
        tracks = [];
        trackShapes.forEach(s => {
            s.cachedRenders.clear();
            s.cachedTinted.clear();
        });
    }

    return {
        init,
        update,
        render,
        illuminateTrack,
        pulseAllInColor,
        getTracks,
        getDimensions,
        destroy
    };
})();