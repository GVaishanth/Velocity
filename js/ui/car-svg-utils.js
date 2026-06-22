/* ============================================
   VELOCITY — SHARED CAR SVG UTILS
   Shared car preview renderer for livery, R&D,
   garage, and team presentation screens.
   ============================================ */

window.CarSVGUtils = (() => {
    const FALLBACK_COLORS = {
        primary: '#FF0000',
        secondary: '#FFFFFF',
        accent: '#000000'
    };

    let svgIdCounter = 0;

    function nextId(prefix = 'car-svg') {
        svgIdCounter += 1;
        return `${prefix}-${svgIdCounter}`;
    }

    function isValidHexColor(value) {
        return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
    }

    function normalizeColor(value, fallback) {
        const safeFallback = isValidHexColor(fallback) ? fallback.toUpperCase() : '#FFFFFF';
        if (!isValidHexColor(value)) return safeFallback;
        const trimmed = value.trim();
        if (trimmed.length === 4) {
            const [, r, g, b] = trimmed;
            return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
        }
        return trimmed.toUpperCase();
    }

    function normalizeLivery(livery = {}, team = {}) {
        return {
            primary: normalizeColor(livery?.primary || team?.color, FALLBACK_COLORS.primary),
            secondary: normalizeColor(livery?.secondary || team?.secondaryColor, FALLBACK_COLORS.secondary),
            accent: normalizeColor(livery?.accent, FALLBACK_COLORS.accent),
            pattern: livery?.pattern || 'solid',
            changesThisSeason: Number.isFinite(livery?.changesThisSeason) ? livery.changesThisSeason : 0
        };
    }

    function getFuturisticCarSVG(options = {}) {
        const livery = normalizeLivery({
            primary: options.primary,
            secondary: options.secondary,
            accent: options.accent
        });
        const { primary, secondary, accent } = livery;
        const mode = options.mode || 'livery';
        const view = options.view || 'side';

        const wheelGradientId = nextId('wheel-shine');
        const wireGradientId = nextId('grad-wire-top');

        const getPartColor = (partId) => {
            if (mode === 'rd') return '#111111';
            if (['f1-body', 'f1-body-side', 'f1-rw', 'f1-rw-pillar'].includes(partId)) return primary;
            if (['f1-sidepods', 'f1-sidepods-side', 'f1-engine', 'f1-engine-side', 'f1-engine-cover'].includes(partId)) return secondary;
            if (['f1-nose', 'f1-nose-side', 'f1-fw', 'f1-fw-side', 'f1-front-wing'].includes(partId)) return accent;
            return '#050505';
        };

        const getStrokeColor = () => {
            if (mode === 'rd') return '#0080FF';
            return 'rgba(255,255,255,0.2)';
        };

        if (view === 'top') {
            return `
                <svg viewBox="0 0 300 500" style="width: 100%; max-height: 400px; filter: drop-shadow(0 0 15px rgba(0,128,255,0.1));">
                    <defs>
                        <linearGradient id="${wireGradientId}" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style="stop-color:#0080FF;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#00D4FF;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <g transform="translate(150, 250) scale(0.9)">
                        <g id="f1-wheels" class="f1-car-part">
                            <rect x="-135" y="100" width="45" height="90" rx="8" fill="#050505" stroke="${getStrokeColor()}" stroke-width="1.5"/>
                            <rect x="90" y="100" width="45" height="90" rx="8" fill="#050505" stroke="${getStrokeColor()}" stroke-width="1.5"/>
                            <rect x="-125" y="-180" width="40" height="75" rx="6" fill="#050505" stroke="${getStrokeColor()}" stroke-width="1.5"/>
                            <rect x="85" y="-180" width="40" height="75" rx="6" fill="#050505" stroke="${getStrokeColor()}" stroke-width="1.5"/>
                        </g>

                        <rect id="f1-rear-wing" class="f1-car-part" x="-80" y="180" width="160" height="40" fill="${getPartColor('f1-rw')}" stroke="${getStrokeColor()}" stroke-width="2"/>
                        <path id="f1-engine" class="f1-car-part" d="M -40 180 L 40 180 L 35 0 L -35 0 Z" fill="${getPartColor('f1-engine')}" stroke="${getStrokeColor()}" stroke-width="2"/>

                        <g id="f1-sidepods" class="f1-car-part">
                            <path d="M -35 0 C -100 20, -100 120, -40 150 Z" fill="${getPartColor('f1-sidepods')}" stroke="${getStrokeColor()}" stroke-width="2"/>
                            <path d="M 35 0 C 100 20, 100 120, 40 150 Z" fill="${getPartColor('f1-sidepods')}" stroke="${getStrokeColor()}" stroke-width="2"/>
                        </g>

                        <g id="f1-body" class="f1-car-part">
                            <ellipse cx="0" cy="-20" rx="25" ry="50" fill="#080808" stroke="#FFF" stroke-width="1.5"/>
                            <path d="M -25 -40 Q 0 -90, 25 -40" fill="none" stroke="#FFF" stroke-width="3" opacity="0.8"/>
                        </g>

                        <path id="f1-nose" class="f1-car-part" d="M -25 -70 L 25 -70 L 15 -210 L -15 -210 Z" fill="${getPartColor('f1-nose')}" stroke="${getStrokeColor()}" stroke-width="2"/>
                        <path id="f1-front-wing" class="f1-car-part" d="M -130 -240 L 130 -240 L 130 -210 L 80 -200 L -80 -200 L -130 -210 Z" fill="${getPartColor('f1-front-wing')}" stroke="${getStrokeColor()}" stroke-width="2"/>

                        <g id="f1-suspension" class="f1-car-part" stroke="${getStrokeColor()}" stroke-width="1.5">
                            <line x1="-15" y1="-180" x2="-85" y2="-150"/>
                            <line x1="-15" y1="-150" x2="-85" y2="-150"/>
                            <line x1="15" y1="-180" x2="85" y2="-150"/>
                            <line x1="15" y1="-150" x2="85" y2="-150"/>
                            <line x1="-35" y1="140" x2="-90" y2="150"/>
                            <line x1="35" y1="140" x2="90" y2="150"/>
                        </g>

                        <g id="f1-cooling" class="f1-car-part">
                            <rect x="-30" y="50" width="60" height="30" fill="rgba(0,128,255,0.1)" stroke="${getStrokeColor()}" stroke-width="1" stroke-dasharray="2 2"/>
                        </g>
                    </g>
                </svg>
            `;
        }

        return `
            <svg viewBox="0 0 600 220" style="width: 100%; filter: drop-shadow(0 0 20px rgba(0,0,0,0.8));">
                <defs>
                    <linearGradient id="${wheelGradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#333" />
                        <stop offset="50%" stop-color="#111" />
                        <stop offset="100%" stop-color="#000" />
                    </linearGradient>
                </defs>
                <g transform="translate(10, 10)">
                    <rect id="f1-rw-pillar-side" x="480" y="60" width="12" height="70" fill="${primary}" stroke="rgba(255,255,255,0.2)" />
                    <path id="f1-rw-side" d="M 450 60 L 550 50 L 560 100 L 450 100 Z" fill="${primary}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
                    <rect x="490" y="55" width="40" height="5" fill="white" />

                    <g id="f1-wheels-side">
                        <circle cx="470" cy="160" r="55" fill="url(#${wheelGradientId})" stroke="#222" stroke-width="3"/>
                        <circle cx="470" cy="160" r="22" fill="#080808" stroke="${accent}" stroke-width="2"/>
                        <circle cx="120" cy="165" r="50" fill="url(#${wheelGradientId})" stroke="#222" stroke-width="3"/>
                        <circle cx="120" cy="165" r="18" fill="#080808" stroke="${accent}" stroke-width="2"/>
                    </g>

                    <path id="f1-body-side" d="M 80 150 L 150 160 L 380 160 L 480 140 L 480 80 L 380 85 L 150 90 L 80 140 Z" fill="${primary}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
                    <path id="f1-sidepods-side" d="M 180 100 Q 220 165, 380 155 L 360 100 Z" fill="${secondary}" stroke="rgba(255,255,255,0.1)"/>
                    <path id="f1-engine-side" d="M 300 90 Q 330 40, 380 80 L 480 75 L 480 120 L 380 130 Z" fill="${secondary}" stroke="rgba(255,255,255,0.1)"/>
                    <path d="M 380 50 L 470 75 L 380 80 Z" fill="${secondary}" opacity="0.6" />
                    <path id="f1-fw-side" d="M 0 140 L 100 155 L 100 175 L 0 165 Z" fill="${accent}" stroke="rgba(255,255,255,0.3)"/>
                    <path id="f1-nose-side" d="M 100 155 L 180 95 L 200 125 L 100 175 Z" fill="${accent}" stroke="rgba(255,255,255,0.2)"/>
                    <path d="M 220 95 C 220 40, 340 40, 340 95" fill="none" stroke="#FFF" stroke-width="4" opacity="0.8"/>
                    <ellipse cx="280" cy="95" rx="40" ry="12" fill="rgba(0,0,0,0.6)" stroke="#0080FF" stroke-width="2"/>
                </g>
            </svg>
        `;
    }

    return {
        FALLBACK_COLORS,
        isValidHexColor,
        normalizeColor,
        normalizeLivery,
        getFuturisticCarSVG
    };
})();
