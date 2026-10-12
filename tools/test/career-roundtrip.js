// VELOCITY e2e — career: race → results → CONTINUE → round advances
const puppeteer = require('/tmp/jstest/node_modules/puppeteer');
(async () => {
    const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900);
    const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
    const p = await b.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGE: ' + e.message));
    await p.setViewport({ width: W, height: H });
    await p.goto('http://localhost:8000/', { waitUntil: 'domcontentloaded' });
    await p.waitForFunction(() => document.querySelector('#screen-home.active'), { timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));
    console.log('seed:', await p.evaluate(() => {
        try {
            if (StateManager.get('career')) return 'career-exists';
            StateManager.initCareer(TEAMS_DATA[0], [DRIVERS_DATA[0], DRIVERS_DATA[1]], {
                techDirector: STAFF_DATA.technicalDirectors[0],
                strategist: STAFF_DATA.chiefStrategists[0],
                pitCrew: STAFF_DATA.pitCrews[0]
            }, { seasonLength: 10, difficulty: 'COMPETITIVE' });
            StateManager.saveGame();
            return 'career-seeded:' + StateManager.get('career').team.name + ' cal=' + StateManager.get('career').seasonCalendar.slice(0,3).join('>');
        } catch (e) { return 'seed-fail: ' + e.message; }
    }));
    await p.evaluate(() => {
        const career = StateManager.get('career');
        const track = CalendarService.getTrack(career.seasonCalendar[0]) || TRACKS_DATA[0];
        RaceInitializer.initializeCareerRace(career, track, {}, {});
        setTimeout(() => EventBus.emit('nav:go', { screen: 'race' }), 300);
    });
    await p.waitForFunction(() => document.getElementById('screen-race')?.classList.contains('active'), { timeout: 10000 }).catch(()=>{});
    await new Promise(r => setTimeout(r, 12000));
    await p.evaluate(() => RaceEngine.skipToEnd());
    await p.waitForFunction(() => document.getElementById('screen-results')?.classList.contains('active'), { timeout: 20000 }).catch(()=>{});
    await new Promise(r => setTimeout(r, 2000));
    console.log('post-race:', await p.evaluate(() => JSON.stringify({
        active: document.querySelector('.game-screen.active')?.id,
        currentRound: StateManager.get('career')?.currentRound,
        rows: document.querySelectorAll('.results-table tbody tr').length
    })));
    await p.evaluate(() => document.getElementById('res-continue')?.click());
    await new Promise(r => setTimeout(r, 3500));
    console.log('after CONTINUE:', await p.evaluate(() => {
        const c = StateManager.get('career');
        const nxt = CalendarService.getNextRace(c);
        return JSON.stringify({
            active: document.querySelector('.game-screen.active')?.id,
            currentRound: c?.currentRound,
            nextTrack: nxt?.track?.name ?? nxt?.trackId ?? null,
            remaining: nxt?.remainingRounds ?? null,
            standingsType: typeof c?.standings,
            constructorsPts: (() => { try { const s = CalendarService.getStandings?.(c); return s ? 'computed' : 'no-api'; } catch(e){ return 'err:'+e.message; } })()
        });
    }));
    const real = errs.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource'));
    console.log('console errors:', real.length ? real.slice(0,6) : 'NONE ✓');
    await b.close();
})();
