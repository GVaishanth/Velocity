// VELOCITY e2e — real player path: weekend intro → skip FP → Q1/Q2/Q3 → strategy → race → results
const puppeteer = require('/tmp/jstest/node_modules/puppeteer');
(async () => {
    const W = +(process.argv[2] || 1440), H = +(process.argv[3] || 900);
    const b = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage'] });
    const p = await b.newPage();
    const errs = [];
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    p.on('pageerror', e => errs.push('PAGE: ' + e.message));
    await p.setViewport({ width: W, height: H });
    const shot = id => p.screenshot({ path: `/tmp/shots/e2e-${id}-${W}x${H}.png` });
    const log = async (t) => console.log(t, await p.evaluate(() =>
        document.querySelector('.game-screen.active')?.id || '?'));

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
            return 'career-seeded, R1=' + CalendarService.getTrack(StateManager.get('career').seasonCalendar[0]).name;
        } catch (e) { return 'seed-fail: ' + e.message; }
    }));

    const click = async (sel, wait = 1200) => { await p.evaluate(s => document.querySelector(s)?.click(), sel); await new Promise(r => setTimeout(r, wait)); };

    // 1) race-weekend intro
    await p.evaluate(() => EventBus.emit('nav:go', { screen: 'race-weekend' }));
    await p.waitForFunction(() => document.getElementById('screen-race-weekend')?.classList.contains('active'), { timeout: 9000 }).catch(()=>{});
    await new Promise(r => setTimeout(r, 1500));
    await log('step intro →');
    // 2) skip to qualifying
    await click('#rw-skip-quali', 1800);
    await shot('quali');
    await log('quali bracket →');
    // 3) Q1 Q2 Q3 then proceed
    for (let i = 0; i < 4; i++) {
        await click('#q-execute-btn', 1600);
        const btn = await p.evaluate(() => document.getElementById('q-execute-btn')?.textContent?.trim().slice(0, 30));
        console.log(`  quali click ${i + 1} → button now: ${btn}`);
    }
    await shot('strategy');
    await log('strategy →');
    // 4) launch GP (countdown may start — wait it out)
    await click('#rw-launch-final-gp', 1000);
    await p.waitForFunction(() => document.getElementById('screen-race')?.classList.contains('active'), { timeout: 30000 }).catch(()=>{});
    await log('race →');
    // 5) finish
    await new Promise(r => setTimeout(r, 12000));
    await p.evaluate(() => RaceEngine.skipToEnd());
    await p.waitForFunction(() => document.getElementById('screen-results')?.classList.contains('active'), { timeout: 20000 }).catch(()=>{});
    await new Promise(r => setTimeout(r, 2000));
    await shot('results');
    // 6) continue → round advances
    const gridInfo = await p.evaluate(() => {
        const grid = StateManager.get('qualiStartingGrid');
        return grid ? `grid size ${grid.length}, pole: ${grid[0]?.driver?.name}` : 'no grid';
    });
    console.log('quali grid:', gridInfo);
    await click('#res-continue', 3500);
    console.log('after CONTINUE:', await p.evaluate(() => {
        const c = StateManager.get('career');
        const nxt = CalendarService.getNextRace(c);
        return JSON.stringify({ active: document.querySelector('.game-screen.active')?.id, currentRound: c?.currentRound, next: nxt?.track?.name, remaining: nxt?.remainingRounds });
    }));
    const real = errs.filter(e => !e.includes('favicon') && !e.includes('Failed to load resource'));
    console.log('console errors:', real.length ? [...new Set(real)].slice(0,6) : 'NONE ✓');
    await b.close();
})();
