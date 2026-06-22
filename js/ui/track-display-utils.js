/* ============================================
   VELOCITY — TRACK DISPLAY UTILS
   Shared track preview rendering and selection helpers
   for dashboard, race weekend, and setup screens.
   ============================================ */

window.TrackDisplayUtils = (() => {
    const DEFAULT_VIEWBOX = '0 0 700 600';

    function resolveTrack(trackOrId) {
        if (!trackOrId) return null;
        if (typeof trackOrId === 'object' && trackOrId.svgPath) return trackOrId;
        if (typeof CalendarService !== 'undefined' && typeof CalendarService.getTrack === 'function') {
            const resolved = CalendarService.getTrack(trackOrId);
            if (resolved) return resolved;
        }
        if (typeof getTrackById === 'function') return getTrackById(trackOrId);
        if (typeof TRACKS_DATA !== 'undefined' && Array.isArray(TRACKS_DATA)) {
            return TRACKS_DATA.find(track => track?.id === trackOrId) || null;
        }
        return null;
    }

    function getRenderableTracks() {
        if (typeof CalendarService !== 'undefined' && typeof CalendarService.getAllValidTrackIds === 'function') {
            return CalendarService.getAllValidTrackIds()
                .map(resolveTrack)
                .filter(Boolean);
        }
        if (typeof TRACKS_DATA !== 'undefined' && Array.isArray(TRACKS_DATA)) {
            return TRACKS_DATA.filter(track => track?.id && track?.svgPath);
        }
        return [];
    }

    function renderTrackSvg(trackOrId, config = {}) {
        const track = resolveTrack(trackOrId);
        if (!track?.svgPath) return '';

        const viewBox = config.viewBox || DEFAULT_VIEWBOX;
        const preserveAspectRatio = config.preserveAspectRatio || 'xMidYMid meet';
        const ariaHidden = config.ariaHidden ? ' aria-hidden="true"' : '';
        const extraAttrs = config.extraSvgAttributes || '';
        const layers = Array.isArray(config.layers) ? config.layers : [];

        return `
            <svg viewBox="${viewBox}" preserveAspectRatio="${preserveAspectRatio}"${ariaHidden}${extraAttrs}>
                ${layers.map(layer => renderSvgLayer(track.svgPath, layer)).join('')}
            </svg>
        `;
    }

    function renderSvgLayer(pathData, layer = {}) {
        if (layer.type === 'circle') {
            return `<circle cx="${layer.cx}" cy="${layer.cy}" r="${layer.r}"${serializeSvgAttributes(layer)} />`;
        }
        return `<path d="${pathData}"${serializeSvgAttributes(layer)} />`;
    }

    function serializeSvgAttributes(layer = {}) {
        const attrs = [];
        const map = {
            fill: 'fill',
            stroke: 'stroke',
            strokeWidth: 'stroke-width',
            strokeLinejoin: 'stroke-linejoin',
            strokeLinecap: 'stroke-linecap',
            strokeDasharray: 'stroke-dasharray',
            opacity: 'opacity',
            className: 'class'
        };
        Object.entries(map).forEach(([key, attr]) => {
            if (layer[key] !== undefined && layer[key] !== null) {
                attrs.push(`${attr}="${String(layer[key])}"`);
            }
        });
        return attrs.length ? ' ' + attrs.join(' ') : '';
    }

    function renderMiniTrackSvg(trackOrId, colors = {}) {
        const accent = colors.accent || '#FFFFFF';
        const main = colors.main || '#00FF41';
        return renderTrackSvg(trackOrId, {
            layers: [
                { fill: 'none', stroke: 'rgba(255,255,255,.13)', strokeWidth: 18, strokeLinecap: 'round', strokeLinejoin: 'round' },
                { fill: 'none', stroke: accent, strokeWidth: 8, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: '.84' },
                { fill: 'none', stroke: main, strokeWidth: 3, strokeLinecap: 'round', strokeLinejoin: 'round', opacity: '.95' }
            ]
        });
    }

    function renderDashboardTrackSvg(trackOrId, colors = {}) {
        const accent = colors.accent || '#FFFFFF';
        const main = colors.main || '#111111';
        return renderTrackSvg(trackOrId, {
            ariaHidden: true,
            layers: [
                { fill: 'none', stroke: accent, strokeWidth: 22, strokeLinejoin: 'round', strokeLinecap: 'round', opacity: '0.18' },
                { fill: 'none', stroke: accent, strokeWidth: 10, strokeLinejoin: 'round', strokeLinecap: 'round', opacity: '0.9' },
                { fill: 'none', stroke: main, strokeWidth: 6, strokeLinejoin: 'round', strokeLinecap: 'round', opacity: '1' }
            ]
        });
    }

    function renderWeekendTrackSvg(trackOrId, colors = {}) {
        const glow = colors.glow || 'rgba(0,255,65,0.2)';
        const main = colors.main || '#00FF41';
        return renderTrackSvg(trackOrId, {
            layers: [
                { fill: 'none', stroke: glow, strokeWidth: 14, strokeLinejoin: 'round', strokeLinecap: 'round' },
                { fill: 'none', stroke: main, strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' }
            ]
        });
    }

    function buildTrackSelectOptions(options = {}) {
        const tracks = getRenderableTracks();
        const includeRandom = options.includeRandom === true;
        const randomLabel = options.randomLabel || '🎲 Random Track';
        const selectedId = options.selectedId || null;

        const optionHtml = tracks.map(track => `<option value="${track.id}" ${track.id === selectedId ? 'selected' : ''}>${track.flag} ${escapeHTML(track.name)}</option>`).join('');
        if (!includeRandom) return optionHtml;
        return `<option value="random" ${selectedId === 'random' ? 'selected' : ''}>${randomLabel}</option>${optionHtml}`;
    }

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    return {
        DEFAULT_VIEWBOX,
        resolveTrack,
        getRenderableTracks,
        renderTrackSvg,
        renderMiniTrackSvg,
        renderDashboardTrackSvg,
        renderWeekendTrackSvg,
        buildTrackSelectOptions
    };
})();
