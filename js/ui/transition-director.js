/* ============================================================
   VELOCITY — TRANSITION DIRECTOR
   Cinematic, per-page-unique navigation transitions.
   Architecture: content EXIT (current page) → themed COVER
   (mid-sequence, screen swapped underneath) → content ENTRANCE
   (landing page, staggered semantic chunks).

   Motion rules (from design doc docs/plans/2026-10-11-page-transitions-design.md):
   - transform/opacity only (Web Animations API, no dependencies)
   - interruptible: rapid navigation cancels in-flight sequences
   - prefers-reduced-motion → 300ms crossfade
   ============================================================ */

const TransitionDirector = (function () {
    'use strict';

    /* ---------- environment ---------- */
    const WAAPI_OK = typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
    const reduceMQ = (typeof window !== 'undefined' && typeof window.matchMedia === 'function')
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : { matches: false };

    function prefersReduced() {
        return !!(reduceMQ && reduceMQ.matches);
    }

    /* ---------- live state ---------- */
    let stage = null;          // .tr-stage container (persistent node)
    let cover = null;          // .tr-cover (rebuilt per navigation)
    let sheet = null;          // .tr-sheet (solid panel inside cover)
    let labelEl = null;
    let anims = [];            // live Animation objects (cancellable)
    let exitAnims = [];        // content-exit Animations (cancelled at swap to restore styles)
    let timers = [];           // pending setTimeout ids
    let seqToken = 0;          // increments per navigation — kills the old sequence
    let running = false;

    /* ---------- helpers ---------- */
    function mk(cls, parent) {
        const el = document.createElement('div');
        el.className = cls;
        if (parent) parent.appendChild(el);
        return el;
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function alive(token) { return token === seqToken; }

    function wait(ms) {
        return new Promise(resolve => {
            const id = setTimeout(resolve, ms);
            timers.push(id);
        });
    }

    function later(fn, ms, token) {
        const id = setTimeout(() => { if (token === undefined || alive(token)) fn(); }, ms);
        timers.push(id);
    }

    /**
     * Run a WAAPI animation, track it, resolve cleanly on finish OR cancel.
     */
    function animate(el, frames, options) {
        try {
            const a = el.animate(frames, Object.assign({ fill: 'both' }, options));
            anims.push(a);
            return a.finished.catch(() => { /* cancelled — fine */ });
        } catch (e) {
            return Promise.resolve();
        }
    }

    function cancelAll() {
        anims.forEach(a => { try { a.cancel(); } catch (e) { } });
        anims = [];
        exitAnims = [];
        timers.forEach(clearTimeout);
        timers = [];
    }

    function sfx(name) {
        try {
            if (typeof AudioManager !== 'undefined' && typeof AudioManager[name] === 'function') {
                const args = Array.prototype.slice.call(arguments, 1);
                AudioManager[name].apply(AudioManager, args);
            }
        } catch (e) { /* audio is cosmetic — never break nav */ }
    }

    function sheetFade(to, ms, easing) {
        return animate(sheet, [{ opacity: to ? 0 : 1 }, { opacity: to }], {
            duration: ms, easing: easing || 'ease'
        });
    }

    /* ---------- content EXIT transforms (per current screen) ---------- */
    const EXITS = {
        'home':         { to: 'scale(1.12)', ms: 250 },
        'singleplayer': { to: 'translateY(26px)', ms: 230 },
        'multiplayer':  { to: 'scaleY(0.82)', ms: 230 },
        'profile':      { to: 'translateY(-22px)', ms: 230 },
        'tutorial':     { to: 'perspective(800px) rotateX(7deg) translateY(16px)', ms: 250 },
        'team-setup':   { to: 'translateY(34px)', ms: 230 },
        'dashboard':    { to: 'translateY(52px) scale(0.98)', ms: 240 },
        'headquarters': { to: 'translateY(72px)', ms: 250 },
        'race-weekend': { to: 'translateX(56px)', ms: 230 },
        'race':         { to: 'scaleX(1.22)', ms: 220 },
        'results':      { to: 'perspective(700px) rotateX(-6deg) scaleY(0.94)', ms: 240 },
        '_default':     { to: 'translateY(18px)', ms: 220 }
    };

    function contentExit(fromId) {
        const el = fromId && document.getElementById('screen-' + fromId);
        if (!el) return Promise.resolve();
        const spec = EXITS[fromId] || EXITS._default;
        try {
            const a = el.animate(
                [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: spec.to }],
                { duration: spec.ms, easing: 'cubic-bezier(.5,.05,.6,.4)', fill: 'forwards' }
            );
            anims.push(a);
            exitAnims.push(a);
            return a.finished.catch(() => { });
        } catch (e) {
            return Promise.resolve();
        }
    }

    function cancelExitAnims() {
        exitAnims.forEach(a => { try { a.cancel(); } catch (e) { } });
        exitAnims = [];
    }

    /* ---------- content ENTRANCE choreography (per landing screen) ---------- */
    const INTRO_EASE = 'cubic-bezier(.16,1,.3,1)';
    const INTROS = {
        'home': {
            groups: [
                { sel: '#home-header', from: 'translateY(26px)', stagger: 0, dur: 420 },
                { sel: '.tire-quadrant', from: 'scale(0.5)', stagger: 90, dur: 430 }
            ]
        },
        'race': {
            groups: [
                { sel: '#race-top-bar', from: 'translateY(-120%)', stagger: 0, dur: 380 },
                { sel: '#race-timing-panel', from: 'translateX(-48px)', stagger: 0, dur: 400 },
                { sel: '#race-right-panel', from: 'translateX(48px)', stagger: 0, dur: 400 },
                { sel: '#race-bottom-bar', from: 'translateY(120%)', stagger: 0, dur: 380 }
            ],
            baseDelay: 40
        },
        'multiplayer': { from: 'perspective(700px) rotateX(9deg) translateY(16px)', stagger: 80, dur: 400, max: 6 },
        'profile':     { from: 'translateY(10px)', stagger: 70, dur: 360, holo: true, max: 4 },
        'results':     { from: 'scale(0.9) translateY(26px)', stagger: 90, dur: 420 },
        '_default':    { from: 'translateY(18px)', stagger: 70, dur: 380 }
    };

    function introUnit(el, from, dur, delay) {
        return animate(el,
            [{ opacity: 0, transform: from }, { opacity: 1, transform: 'none' }],
            { duration: dur, easing: INTRO_EASE, delay: delay, fill: 'backwards' }
        );
    }

    function contentIntro(targetId) {
        const screen = document.getElementById('screen-' + targetId);
        if (!screen) return;
        const spec = INTROS[targetId] || INTROS._default;
        const base = spec.baseDelay || 0;

        if (spec.groups) {
            spec.groups.forEach(g => {
                const els = screen.querySelectorAll(g.sel);
                let i = 0;
                els.forEach(el => {
                    introUnit(el, g.from, g.dur, base + i * (g.stagger || 0));
                    i++;
                });
            });
        } else {
            const content = screen.querySelector('.screen-content');
            const root = content || screen;
            const chunks = Array.prototype.slice.call(root.children)
                .filter(el => el.tagName !== 'SCRIPT')
                .slice(0, spec.max || 8);
            chunks.forEach((el, i) => {
                introUnit(el, spec.from, spec.dur, base + i * spec.stagger);
            });
            if (spec.holo && content) {
                // flicker the license card, not the whole screen content —
                // the card is a much smaller raster than the full scroll area
                const holoTarget = screen.querySelector('.profile-vip-license') || content;
                animate(holoTarget,
                    [{ opacity: 0 }, { opacity: 1 }, { opacity: 0.35 }, { opacity: 1 }],
                    { duration: 420, easing: 'ease', delay: base, fill: 'backwards' }
                );
            }
        }
    }

    /* ---- SINGLEPLAYER rim texture: baked once in idle time so the
       transition only ever GPU-scales a ready PNG (no per-frame SVG
       raster at huge scales, no mid-flight decode hitch) ---- */
    const rimBaker = (function () {
        const angles = [0, 40, 80, 120, 160, 200, 240, 280, 320];
        const spokes = angles.map(function (a) {
            return '<g transform="rotate(' + a + ' 100 100)">' +
                '<line x1="100" y1="82" x2="100" y2="45" stroke="#10151a" stroke-width="14"/>' +
                '<line x1="100" y1="81" x2="100" y2="46" stroke="#3a434b" stroke-width="9"/>' +
                '<line x1="97"  y1="80" x2="97"  y2="48" stroke="#6d7985" stroke-width="2.4" opacity="0.8"/>' +
            '</g>';
        }).join('');
        const svg =
            // wide viewBox leaves room for the painted (baked) glow — no live CSS filter
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28 -28 256 256" aria-hidden="true">' +
                '<defs>' +
                    '<radialGradient id="tr-dish" cx="50%" cy="42%" r="62%">' +
                        '<stop offset="0%" stop-color="#3d454c"/><stop offset="48%" stop-color="#262c32"/>' +
                        '<stop offset="78%" stop-color="#15191d"/><stop offset="100%" stop-color="#0a0d10"/>' +
                    '</radialGradient>' +
                    '<filter id="tr-hglow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="6"/></filter>' +
                    '<filter id="tr-bglow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="2.5"/></filter>' +
                '</defs>' +
                // painted halo ring around the tire (bake-once glow, replaces drop-shadow filter)
                '<circle cx="100" cy="100" r="97" fill="none" stroke="#00FF41" stroke-width="7" opacity="0.45" filter="url(#tr-hglow)"/>' +
                // black rubber tire : outer ring + sidewall + shoulder
                '<circle cx="100" cy="100" r="98" fill="#050607"/>' +
                '<circle cx="100" cy="100" r="96" fill="#0b0d0e" stroke="#171b1e" stroke-width="2"/>' +
                '<circle cx="100" cy="100" r="84" fill="none" stroke="#121619" stroke-width="9" opacity="0.75"/>' +
                // rim barrel + dish
                '<circle cx="100" cy="100" r="62" fill="none" stroke="#20262b" stroke-width="3"/>' +
                '<circle cx="100" cy="100" r="58" fill="url(#tr-dish)" stroke="#48525b" stroke-width="2.4"/>' +
                // drilled brake disc peeking between the spokes
                '<circle cx="100" cy="100" r="46" fill="none" stroke="#3c444c" stroke-width="10" stroke-dasharray="1.6 5.2" opacity="0.55"/>' +
                spokes +
                // specular sweep on the top lip
                '<path d="M100 42 A58 58 0 0 1 153 77" fill="none" stroke="#9facb8" stroke-width="1.8" opacity="0.75"/>' +
                // hub bore — the tunnel we dive through — with a baked neon green halo
                '<circle cx="100" cy="100" r="22" fill="#000"/>' +
                '<circle cx="100" cy="100" r="23.4" fill="none" stroke="#00FF41" stroke-width="2.5" opacity="0.85" filter="url(#tr-bglow)"/>' +
                '<circle cx="100" cy="100" r="23.4" fill="none" stroke="#00FF41" stroke-width="1" opacity="0.95"/>' +
                '<circle cx="100" cy="100" r="26.5" fill="none" stroke="#00FF41" stroke-width="3.4" opacity="0.18"/>' +
            '</svg>';
        const svgUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        let pngUri = null;
        function bake() {
            try {
                const src = new Image();
                src.onload = function () {
                    try {
                        const c = document.createElement('canvas');
                        c.width = 1024; c.height = 1024;
                        c.getContext('2d').drawImage(src, 0, 0, 1024, 1024);
                        pngUri = c.toDataURL('image/png');
                    } catch (e) { /* keep SVG fallback */ }
                };
                src.src = svgUri;
            } catch (e) { /* cosmetic */ }
        }
        if (typeof document !== 'undefined') {
            if (typeof requestIdleCallback === 'function') requestIdleCallback(bake, { timeout: 2500 });
            else setTimeout(bake, 600);
        }
        return { uri: function () { return pngUri || svgUri; } };
    })();

    /* ============================================================
       COVER IDENTITIES — one signature sequence per destination
       ctx: { color, sheet, cover, token }
       ============================================================ */
    const IDENTITIES = {

        /* ---- HOME : tire tunnel (forward entering, reverse revealing) ---- */
        'home': {
            label: 'VELOCITY', icon: '🏁', hold: 180,
            build(ctx) {
                ctx.rings = [];
                for (let i = 0; i < 5; i++) ctx.rings.push(mk('tr-ring', sheet));
            },
            async coverIn(ctx) {
                ctx.rings.forEach((r, i) => {
                    animate(r,
                        [{ transform: 'scale(1.25)', opacity: 0.9 }, { transform: 'scale(0)', opacity: 0 }],
                        { duration: 500, delay: i * 80, easing: 'cubic-bezier(.5,0,.8,.4)' });
                });
                await sheetFade(1, 420, 'ease-in');
            },
            async coverOut(ctx) {
                ctx.rings.forEach((r, i) => {
                    animate(r,
                        [{ transform: 'scale(0)', opacity: 0.85 }, { transform: 'scale(1.32)', opacity: 0 }],
                        { duration: 720, delay: i * 70, easing: 'cubic-bezier(.16,1,.3,1)' });
                });
                await sheetFade(0, 580, 'ease-out');
            }
        },

        /* ---- SINGLEPLAYER : dive through a spinning racing rim ---- */
        'singleplayer': {
            label: 'SINGLE PLAYER', icon: '\u{1F6DE}', hold: 120,
            build(ctx) {
                const rim = mk('tr-wheel', sheet);
                const img = new Image();
                img.alt = '';
                img.draggable = false;
                img.src = rimBaker.uri();
                rim.appendChild(img);
                ctx.rim = rim;
            },
            async coverIn(ctx, token) {
                sfx('whoosh', 0.7);
                sheetFade(1, 160, 'ease-out');
                animate(ctx.rim,
                    [{ transform: 'translate(-50%,-50%) scale(0.12) rotate(-140deg)', opacity: 0 },
                     { opacity: 1, offset: 0.08 },
                     { transform: 'translate(-50%,-50%) scale(1.05) rotate(120deg)', opacity: 1, offset: 0.45 },
                     { transform: 'translate(-50%,-50%) scale(12) rotate(300deg)', opacity: 1 }],
                    { duration: 780, easing: 'cubic-bezier(.5,.02,.65,1)' });
                await wait(720);
                if (!alive(token)) return;
                sfx('raceGo');
                await wait(60);
                if (!alive(token)) return;
            },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ opacity: 1 }, { opacity: 0 }],
                    { duration: 320, easing: 'cubic-bezier(.65,.05,.35,1)' });
            }
        },

        /* ---- MULTIPLAYER : uplink radar ---- */
        'multiplayer': {
            label: 'MULTIPLAYER', icon: '📡', hold: 140,
            build(ctx) {
                const center = mk('tr-radar', sheet);
                ctx.sweep = mk('tr-sweep', center);
                ctx.nodes = [];
                const spots = [[-11, -9], [9, -13], [0, 5], [12, 8]];   // vmin offsets
                spots.forEach(p => {
                    const n = mk('tr-node', center);
                    n.style.left = `calc(50% + ${p[0]}vmin)`;
                    n.style.top = `calc(50% + ${p[1]}vmin)`;
                    ctx.nodes.push(n);
                });
                ctx.links = [];
                spots.slice(0, 3).forEach(p => {
                    const l = mk('tr-link', center);
                    const len = Math.hypot(p[0], p[1]);
                    const ang = Math.atan2(p[1], p[0]) * 180 / Math.PI;
                    l.style.left = '50%';
                    l.style.top = '50%';
                    l.style.width = `${len}vmin`;
                    l.dataset.ang = ang;
                    ctx.links.push(l);
                });
                ctx.edge = mk('tr-edge tr-edge-h', sheet);
            },
            async coverIn(ctx, token) {
                animate(sheet,
                    [{ transform: 'scaleY(0.015)', opacity: 0 },
                     { opacity: 1, offset: 0.2 },
                     { transform: 'scaleY(1)', opacity: 1 }],
                    { duration: 300, easing: 'cubic-bezier(.6,.05,.25,1)' });
                animate(ctx.sweep,
                    [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
                    { duration: 950, easing: 'linear' });
                ctx.nodes.forEach((n, i) => {
                    animate(n,
                        [{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
                        { duration: 200, delay: 260 + i * 110, easing: 'cubic-bezier(.34,1.56,.64,1)' });
                });
                ctx.links.forEach((l, i) => {
                    const a = l.dataset.ang;
                    animate(l,
                        [{ transform: `rotate(${a}deg) scaleX(0)`, opacity: 0.9 },
                         { transform: `rotate(${a}deg) scaleX(1)`, opacity: 0.9 }],
                        { duration: 260, delay: 700 + i * 90, easing: 'ease-out' });
                });
                await wait(900);
                if (!alive(token)) return;
            },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ transform: 'translateX(0)', opacity: 1 },
                     { transform: 'translateX(104%)', opacity: 1 }],
                    { duration: 360, easing: 'cubic-bezier(.7,0,.84,.4)' });
            }
        },

        /* ---- PROFILE : telemetry scan ---- */
        'profile': {
            label: 'TELEMETRY', icon: '📊', hold: 120,
            build(ctx) {
                ctx.scanbar = mk('tr-scanbar', sheet);
                const cols = [[8, 6, 38], [16, 4, 58], [24, 7, 30], [46, 5, 66],
                              [56, 8, 44], [68, 4, 72], [78, 6, 52], [88, 5, 34]];
                cols.forEach(c => {
                    const el = mk('tr-tcol', sheet);
                    el.style.left = c[0] + '%';
                    el.style.width = c[1] + '%';
                    el.style.height = c[2] + '%';
                });
                ctx.cols = Array.prototype.slice.call(sheet.querySelectorAll('.tr-tcol'));
            },
            async coverIn(ctx) {
                sheetFade(1, 240, 'ease-in');
                animate(ctx.scanbar,
                    [{ transform: 'translateY(0)', opacity: 1 },
                     { transform: 'translateY(96vh)', opacity: 1 }],
                    { duration: 320, iterations: 2, easing: 'ease-in-out' });
                ctx.cols.forEach((c, i) => {
                    animate(c,
                        [{ transform: 'scaleY(0)', opacity: 0.32 }, { transform: 'scaleY(1)', opacity: 0.32 }],
                        { duration: 340, delay: 120 + i * 45, easing: 'ease-out' });
                });
                await wait(680);
            },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ transform: 'translateY(0)', opacity: 1 },
                     { transform: 'translateY(-104%)', opacity: 1 }],
                    { duration: 400, easing: 'cubic-bezier(.7,0,.84,.4)' });
            }
        },

        /* ---- TUTORIAL : pit board slides across ---- */
        'tutorial': {
            label: 'DRIVING SCHOOL', icon: '📋', hold: 140,
            build(ctx) {
                ctx.board = mk('tr-board', sheet);
                [100, 72, 86, 48].forEach(w => {
                    const r = mk('tr-board-row', ctx.board);
                    r.style.width = w + '%';
                });
                ctx.rows = Array.prototype.slice.call(ctx.board.querySelectorAll('.tr-board-row'));
                ctx.edge = mk('tr-edge tr-edge-h', sheet);
                ctx.edge.style.right = 'auto';
                ctx.edge.style.left = '0';
            },
            async coverIn(ctx) {
                animate(sheet,
                    [{ transform: 'translateX(104%)', opacity: 1 },
                     { transform: 'translateX(0)', opacity: 1 }],
                    { duration: 340, easing: 'cubic-bezier(.55,.08,.2,1)' });
                animate(ctx.board,
                    [{ transform: 'translate(calc(-50% - 6vw), -50%) rotate(-1.5deg)', opacity: 0 },
                     { transform: 'translate(-50%, -50%) rotate(-1.5deg)', opacity: 1 }],
                    { duration: 420, delay: 120, easing: 'cubic-bezier(.16,1,.3,1)' });
                ctx.rows.forEach((r, i) => {
                    animate(r,
                        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
                        { duration: 240, delay: 340 + i * 90, easing: 'ease-out' });
                });
                await wait(820);
            },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ transform: 'translateX(0)', opacity: 1 },
                     { transform: 'translateX(-104%)', opacity: 1 }],
                    { duration: 380, easing: 'cubic-bezier(.65,.05,.85,.5)' });
            }
        },

        /* ---- TEAM SETUP : garage shutter ---- */
        'team-setup': {
            label: 'THE GARAGE', icon: '🔧', hold: 130,
            build(ctx) {
                sheet.style.background = 'transparent';
                ctx.slats = [];
                for (let i = 0; i < 8; i++) {
                    const s = mk('tr-slat', cover);
                    s.style.top = (i * 12.5) + '%';
                    s.style.height = 'calc(12.5% + 2px)';
                    ctx.slats.push(s);
                }
            },
            async coverIn(ctx) {
                sheetFade(1, 320, 'ease-in');
                ctx.slats.forEach((s, i) => {
                    animate(s,
                        [{ transform: 'translateY(-860%)' }, { transform: 'translateY(0)' }],
                        { duration: 260, delay: i * 45, easing: 'cubic-bezier(.5,.05,.3,1)' });
                });
                await wait(600);
            },
            async coverOut(ctx) {
                ctx.slats.forEach((s, i) => {
                    animate(s,
                        [{ transform: 'translateY(0)' }, { transform: 'translateY(-860%)' }],
                        { duration: 280, delay: (ctx.slats.length - 1 - i) * 36, easing: 'cubic-bezier(.6,.05,.8,.4)' });
                });
                sheetFade(0, 540, 'ease-out');
                await wait(560);
            }
        },

        /* ---- DASHBOARD : HQ glass doors ---- */
        'dashboard': {
            label: 'HQ DASHBOARD', icon: '🏢', hold: 220,
            build(ctx) {
                sheet.style.background = 'transparent';
                ctx.paneL = mk('tr-pane tr-pane-l', cover);
                ctx.paneR = mk('tr-pane tr-pane-r', cover);
                ctx.seam = mk('tr-seam', cover);
            },
            async coverIn(ctx) {
                sheetFade(1, 220, 'linear');
                animate(ctx.paneL,
                    [{ transform: 'translateX(-103%)' }, { transform: 'translateX(0)' }],
                    { duration: 340, easing: 'cubic-bezier(.6,.05,.2,1)' });
                await animate(ctx.paneR,
                    [{ transform: 'translateX(103%)' }, { transform: 'translateX(0)' }],
                    { duration: 340, easing: 'cubic-bezier(.6,.05,.2,1)' });
                sfx('uiClick');
                animate(ctx.seam,
                    [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0.45 }],
                    { duration: 500, easing: 'ease-out' });
            },
            async coverOut(ctx) {
                animate(ctx.seam, [{ opacity: 0.6 }, { opacity: 0 }], { duration: 180, easing: 'ease-in' });
                animate(ctx.paneL,
                    [{ transform: 'translateX(0)' }, { transform: 'translateX(-103%)' }],
                    { duration: 360, delay: 60, easing: 'cubic-bezier(.55,.1,.75,.5)' });
                animate(ctx.paneR,
                    [{ transform: 'translateX(0)' }, { transform: 'translateX(103%)' }],
                    { duration: 360, delay: 60, easing: 'cubic-bezier(.55,.1,.75,.5)' });
                await sheetFade(0, 420, 'ease-out');
            }
        },

        /* ---- HEADQUARTERS : elevator blinds ---- */
        'headquarters': {
            label: 'HEADQUARTERS', icon: '🛗', hold: 160,
            build(ctx) {
                sheet.style.background = 'transparent';
                const blinds = mk('tr-blinds', cover);
                ctx.blinds = [];
                for (let i = 0; i < 10; i++) {
                    const b = mk('tr-blind', blinds);
                    b.style.left = (i * 10) + '%';
                    b.style.width = 'calc(10% + 1px)';
                    ctx.blinds.push(b);
                }
                ctx.rim = mk('tr-rim', cover);
            },
            async coverIn(ctx) {
                sheetFade(1, 280, 'ease-in');
                ctx.blinds.forEach((b, i) => {
                    animate(b,
                        [{ transform: 'perspective(760px) rotateY(90deg)' },
                         { transform: 'perspective(760px) rotateY(0deg)' }],
                        { duration: 300, delay: i * 38, easing: 'cubic-bezier(.3,.9,.3,1)' });
                });
                await wait(680);
                animate(ctx.rim, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
            },
            async coverOut(ctx) {
                animate(ctx.rim, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in' });
                ctx.blinds.forEach((b, i) => {
                    animate(b,
                        [{ transform: 'perspective(760px) rotateY(0deg)' },
                         { transform: 'perspective(760px) rotateY(-90deg)' }],
                        { duration: 260, delay: i * 30, easing: 'cubic-bezier(.55,.1,.8,.45)' });
                });
                await sheetFade(0, 560, 'ease-out');
            }
        },

        /* ---- RACE WEEKEND : pit lane rush + checkered wipe ---- */
        'race-weekend': {
            label: 'RACE WEEKEND', icon: '🏎️', hold: 150,
            build(ctx) {
                const vecs = [[-1, -1], [1, -1], [-1, 1], [1, 1], [0.2, 1.4]];
                ctx.boxes = vecs.map(v => {
                    const b = mk('tr-pitbox', sheet);
                    b.style.width = '26%';
                    b.style.height = '20%';
                    b.dataset.dx = v[0];
                    b.dataset.dy = v[1];
                    return b;
                });
                ctx.stripe = mk('tr-checkstripe', sheet);
            },
            async coverIn(ctx) {
                sheetFade(1, 220, 'ease-in');
                animate(ctx.stripe,
                    [{ transform: 'translateX(104%)' }, { transform: 'translateX(0)' }],
                    { duration: 420, delay: 100, easing: 'cubic-bezier(.4,.9,.3,1)' });
                ctx.boxes.forEach((b, i) => {
                    const dx = parseFloat(b.dataset.dx) * 46;
                    const dy = parseFloat(b.dataset.dy) * 44;
                    animate(b,
                        [{ transform: 'translate(-50%, -50%) scale(0.12)', opacity: 0 },
                         { opacity: 1, offset: 0.22 },
                         { transform: `translate(calc(-50% + ${dx}vw), calc(-50% + ${dy}vh)) scale(2.4)`, opacity: 0 }],
                        { duration: 560, delay: 80 + i * 70, easing: 'cubic-bezier(.5,.05,.75,.4)' });
                });
                await wait(880);
            },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ transform: 'translateX(0)', opacity: 1 },
                     { transform: 'translateX(-104%)', opacity: 1 }],
                    { duration: 380, easing: 'cubic-bezier(.65,.05,.85,.5)' });
            }
        },

        /* ---- RACE : no cover identity — the race screen runs its own
               start-lights sequence (Transitions.raceLightSequence),
               so navigation to it uses the default sheet wipe ---- */

        /* ---- RESULTS : chequered flag wave + drop ---- */

        /* ---- RESULTS : chequered flag wave + drop ---- */
        'results': {
            label: 'CLASSIFICATION', icon: '🏆', hold: 240,
            build(ctx) {
                sheet.style.background = 'transparent';
                ctx.rows = [];
                for (let i = 0; i < 12; i++) {
                    const r = mk('tr-flagrow', cover);
                    r.style.top = (i * (100 / 12)) + '%';
                    r.style.height = `calc(${100 / 12}% + 1px)`;
                    r.style.backgroundPosition = (i % 2 ? '36px' : '0') + ' 0';
                    ctx.rows.push(r);
                }
            },
            async coverIn(ctx) {
                sheetFade(1, 300, 'ease-in');
                ctx.rows.forEach((r, i) => {
                    const from = i % 2 ? 'translateX(104%)' : 'translateX(-104%)';
                    animate(r,
                        [{ transform: from }, { transform: 'translateX(0)' }],
                        { duration: 260, delay: i * 28, easing: 'cubic-bezier(.3,.8,.3,1)' });
                });
                await wait(580);
                ctx.rows.forEach((r, i) => {   // cloth wave
                    animate(r,
                        [{ transform: 'skewX(0deg)' },
                         { transform: 'skewX(-5deg)', offset: 0.33 },
                         { transform: 'skewX(4deg)', offset: 0.66 },
                         { transform: 'skewX(0deg)' }],
                        { duration: 600, delay: i * 22, easing: 'ease-in-out' });
                });
                await wait(380);
            },
            async coverOut(ctx) {
                ctx.rows.forEach((r, i) => {
                    animate(r,
                        [{ transform: 'translateY(0)' }, { transform: 'translateY(112%)' }],
                        { duration: 250, delay: i * 26, easing: 'cubic-bezier(.55,.08,.75,.45)' });
                });
                sheetFade(0, 480, 'ease-out');
                await wait(600);
            }
        },

        /* ---- fallback : clean sheet wipe ---- */
        '_default': {
            label: 'VELOCITY', icon: '🏁', hold: 140,
            build(ctx) { },
            async coverIn(ctx) { await sheetFade(1, 300, 'ease-in'); },
            async coverOut(ctx) {
                await animate(sheet,
                    [{ transform: 'translateY(0)', opacity: 1 },
                     { transform: 'translateY(-104%)', opacity: 1 }],
                    { duration: 380, easing: 'cubic-bezier(.65,.05,.85,.5)' });
            }
        }
    };

    /* ============================================================
       Stage lifecycle
       ============================================================ */
    function ensureStage() {
        if (stage && stage.isConnected) return stage;
        stage = mk('tr-stage');
        stage.id = 'tr-stage';
        document.body.appendChild(stage);
        return stage;
    }

    function buildStage(targetId, identity, color) {
        ensureStage();
        stage.classList.add('tr-live');
        stage.innerHTML = '';

        cover = mk('tr-cover tr-id-' + targetId);
        cover.style.setProperty('--c', color || '#FFFFFF');
        sheet = mk('tr-sheet', cover);
        labelEl = mk('tr-label', cover);
        labelEl.innerHTML =
            `<span class="tr-label-icon">${esc(identity.icon)}</span>` +
            `<span class="tr-label-name">${esc(identity.label)}</span>`;
        stage.appendChild(cover);
        return { cover, sheet, label: labelEl, color };
    }

    function teardown() {
        cancelAll();
        if (stage) {
            stage.classList.remove('tr-live');
            stage.innerHTML = '';
        }
        cover = null; sheet = null; labelEl = null;
        document.querySelectorAll('.game-screen.tr-anim').forEach(s => s.classList.remove('tr-anim'));
    }

    function labelIn() {
        if (!labelEl) return;
        animate(labelEl,
            [{ opacity: 0, transform: 'translateX(-50%) translateY(12px)' },
             { opacity: 1, transform: 'translateX(-50%) translateY(0)' }],
            { duration: 320, delay: 180, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
    }

    function labelOut() {
        if (!labelEl) return;
        animate(labelEl,
            [{ opacity: 1, transform: 'translateX(-50%) translateY(0)' },
             { opacity: 0, transform: 'translateX(-50%) translateY(-10px)' }],
            { duration: 170, easing: 'ease-in' });
    }

    /* ============================================================
       Sequences
       ============================================================ */
    async function runReduced(opts, token) {
        await sheetFade(1, 150, 'linear');
        if (!alive(token)) return false;
        opts.swap();
        await sheetFade(0, 150, 'linear');
        return alive(token);
    }

    async function runStandard(identity, ctx, opts, fromId, token) {
        sfx('whoosh', 0.55);

        // freeze backdrop-filters on the exiting screen during the exit
        const fromScreen = fromId && document.getElementById('screen-' + fromId);
        if (fromScreen) fromScreen.classList.add('tr-anim');

        const exitP = contentExit(fromId);
        const inP = identity.coverIn(ctx, token);
        labelIn();
        await Promise.all([exitP, inP]);
        if (!alive(token)) return false;

        cancelExitAnims();          // restore hidden screen's styles
        opts.swap();                // switch screens under full cover

        // …and on the arriving screen during cover-out + intro
        const toScreen = document.getElementById('screen-' + opts.targetId);
        if (toScreen) toScreen.classList.add('tr-anim');

        await wait(identity.hold || 140);
        if (!alive(token)) return false;

        labelOut();
        const outP = identity.coverOut(ctx, token);
        later(() => { if (alive(token)) contentIntro(opts.targetId); }, 90, token);
        await outP;
        return alive(token);
    }

    /**
     * TransitionDirector.go(targetId, fromId, { color, swap, done })
     * swap(): performs the actual screen switch (called at full cover)
     * done(): cleanup callback (always called once the sequence ends or is killed)
     */
    async function go(targetId, fromId, opts) {
        if (!WAAPI_OK || prefersReduced() === null) { /* paranoia guard */ }
        if (!WAAPI_OK) { opts.swap(); opts.done && opts.done(); return; }

        const token = ++seqToken;    // kills any in-flight sequence
        cancelAll();
        running = true;
        opts.targetId = targetId;

        const identity = IDENTITIES[targetId] || IDENTITIES._default;
        const reduced = prefersReduced();

        try {
            const ctx = buildStage(targetId, identity, opts.color);
            let finished = false;
            if (reduced) {
                finished = await runReduced(opts, token);
            } else {
                ctx.token = token;
                if (identity.build) {
                    try { identity.build(ctx); } catch (e) { console.warn('[TransitionDirector] build failed:', e); }
                }
                finished = await runStandard(identity, ctx, opts, fromId, token);
            }

            if (finished && alive(token)) {
                running = false;
                teardown();
                if (opts.done) opts.done();
            }
            // !finished → a newer navigation took over; it owns the stage + done()
        } catch (err) {
            console.error('[TransitionDirector] sequence error:', err);
            if (alive(token)) {
                running = false;
                try { opts.swap(); } catch (e) { /* already swapped */ }
                teardown();
                if (opts.done) opts.done();
            }
        }
    }

    /* ---------- public API ---------- */
    function isReady() { return WAAPI_OK; }
    function isRunning() { return running; }

    return {
        go: go,
        isReady: isReady,
        isRunning: isRunning
    };
})();
