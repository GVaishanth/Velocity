/* Final regression sweep: every navigable screen at 390x844, capture + console errors. */
const puppeteer = require('/tmp/jstest/node_modules/puppeteer');
const W = process.argv[2] || 390, H = process.argv[3] || 844;

(async () => {
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: +W, height: +H });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

    await page.goto('http://localhost:8000/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3500));

    // seed a career so dashboards have data (same recipe as career-roundtrip.js)
    console.log('seed:', await page.evaluate(() => {
        try {
            if (StateManager.get('career')) return 'career-exists';
            StateManager.initCareer(TEAMS_DATA[0], [DRIVERS_DATA[0], DRIVERS_DATA[1]], {
                techDirector: STAFF_DATA.technicalDirectors[0],
                strategist: STAFF_DATA.chiefStrategists[0],
                pitCrew: STAFF_DATA.pitCrews[0]
            }, { seasonLength: 10, difficulty: 'COMPETITIVE' });
            StateManager.saveGame();
            return 'career-seeded:' + StateManager.get('career').team.name;
        } catch (e) { return 'seed-fail: ' + e.message; }
    }));
    await new Promise(r => setTimeout(r, 1500));

    const screens = ['home', 'dashboard', 'headquarters', 'race-weekend', 'singleplayer', 'team-setup', 'multiplayer'];
    for (const s of screens) {
        await page.evaluate(sv => EventBus.emit('nav:go', { screen: sv }), s);
        await new Promise(r => setTimeout(r, 2500));
        const active = await page.evaluate(() => document.querySelector('.game-screen.active')?.id);
        // horizontal overflow check
        const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
        console.log(`${s.padEnd(14)} → ${active}   scrollW-overflow: ${overflowX ? 'YES ⚠' : 'no'}`);
        await page.screenshot({ path: `/tmp/shots/sweep-${s}-${W}x${H}.png` });
    }
    console.log('console errors:', errors.length ? errors : 'NONE ✓');
    await browser.close();
})();
