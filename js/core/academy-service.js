/* ============================================
   VELOCITY — DRIVER ACADEMY SERVICE
   Youth generation, scouting, academy development, promotion
   ============================================ */

window.AcademyService = (() => {
    const REGIONS = {
        EUROPE: { name: 'Europe', nationalities: [['France','🇫🇷'],['Germany','🇩🇪'],['Italy','🇮🇹'],['UK','🇬🇧'],['Spain','🇪🇸'],['Netherlands','🇳🇱'],['Czech Republic','🇨🇿']] },
        SOUTH_AMERICA: { name: 'South America', nationalities: [['Brazil','🇧🇷'],['Argentina','🇦🇷'],['Chile','🇨🇱'],['Colombia','🇨🇴']] },
        NORTH_AMERICA: { name: 'North America', nationalities: [['USA','🇺🇸'],['Canada','🇨🇦'],['Mexico','🇲🇽']] },
        ASIA: { name: 'Asia', nationalities: [['Japan','🇯🇵'],['India','🇮🇳'],['China','🇨🇳'],['South Korea','🇰🇷']] },
        AFRICA: { name: 'Africa', nationalities: [['South Africa','🇿🇦'],['Morocco','🇲🇦'],['Kenya','🇰🇪'],['Egypt','🇪🇬']] },
        OCEANIA: { name: 'Oceania', nationalities: [['Australia','🇦🇺'],['New Zealand','🇳🇿']] }
    };
    const FIRST = ['Kai','Maya','Theo','Luca','Ava','Noah','Rafa','Sofia','Arjun','Yuki','Milan','Ilya','Felix','Lena','Mateo','Nia'];
    const LAST = ['Voss','Rossi','Khan','Silva','Tanaka','Reed','Costa','Singh','Dubois','Hayes','Novak','Kim','Sato','Okoro','Mbeki','Lopez'];
    const ACADEMY_TRAITS = ['WONDERKID','WET_TALENT','QUALIFYING_TALENT','AGGRESSIVE_RACER','CONSISTENCY_EXPERT','LATE_DEVELOPER','SIMULATOR_STAR'];
    const TRAIT_MAP = {
        WONDERKID: ['FAST_STARTER'],
        WET_TALENT: ['WET_MASTER'],
        QUALIFYING_TALENT: ['QUALIFYING_SPECIALIST'],
        AGGRESSIVE_RACER: ['AGGRESSIVE','OVERTAKER'],
        CONSISTENCY_EXPERT: ['CONSISTENT'],
        LATE_DEVELOPER: ['SMOOTH'],
        SIMULATOR_STAR: ['TIRE_WHISPERER']
    };

    function clamp(v, min = 1, max = 99) { return Math.max(min, Math.min(max, Math.round(v))); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function ratingFromStats(stats) {
        return clamp((stats.pace * .25) + (stats.consistency * .2) + (stats.tireManagement * .15) + (stats.wetSkill * .1) + (stats.racecraft * .2) + (stats.experience * .1), 40, 99);
    }

    function generateYouthDriver(regionKey = 'EUROPE', quality = 1) {
        const region = REGIONS[regionKey] || REGIONS.EUROPE;
        const [nationality, flag] = pick(region.nationalities);
        const age = 15 + Math.floor(Math.random() * 6);
        const base = 48 + Math.floor(Math.random() * 20) + Math.floor((quality - 1) * 3);
        const potential = clamp(base + 16 + Math.floor(Math.random() * 20) + (age <= 17 ? 4 : 0), base + 4, 98);
        const academyTraits = [...ACADEMY_TRAITS].sort(() => Math.random() - .5).slice(0, Math.random() < .3 ? 2 : 1);
        const mappedTraits = [...new Set(academyTraits.flatMap(t => TRAIT_MAP[t] || []))];
        const first = pick(FIRST), last = pick(LAST);
        const stats = {
            pace: clamp(base + Math.random()*8 - 4, 40, 90),
            consistency: clamp(base + Math.random()*8 - 5, 40, 90),
            tireManagement: clamp(base + Math.random()*8 - 4, 40, 90),
            wetSkill: clamp(base + Math.random()*10 - 5, 40, 90),
            racecraft: clamp(base + Math.random()*8 - 4, 40, 90),
            experience: clamp(18 + Math.random()*20, 10, 55)
        };
        const driver = {
            id: `acad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`,
            name: `${first[0]}. ${last}`,
            firstName: first,
            lastName: last,
            nationality, flag, age,
            rating: ratingFromStats(stats),
            potentialRating: potential,
            hiddenPotential: potential,
            potentialRange: makePotentialRange(potential, quality),
            scoutingConfidence: quality >= 3 ? 'High' : quality >= 2 ? 'Medium' : 'Low',
            stats,
            traits: mappedTraits,
            academyTraits,
            academyStatus: 'ACADEMY',
            developmentRate: Number((0.9 + Math.random()*0.9 + (academyTraits.includes('WONDERKID') ? .35 : 0)).toFixed(2)),
            peakAgeStart: academyTraits.includes('LATE_DEVELOPER') ? 29 : 25 + Math.floor(Math.random()*4),
            peakAgeEnd: 32 + Math.floor(Math.random()*4),
            confidence: 50,
            simulatorHours: 0,
            academySeasons: 0,
            freeAgent: false,
            contractYears: 0,
            salary: 0,
            marketValue: Math.round(500000 + potential * 50000),
            isAcademyDriver: true,
            bio: `Academy prospect scouted from ${region.name}. Potential estimate: ${makePotentialRange(potential, quality)}.`
        };
        return (typeof DriverDevelopmentService !== 'undefined') ? DriverDevelopmentService.ensureDriverDevelopment(driver) : driver;
    }

    function makePotentialRange(potential, quality = 1) {
        const spread = quality >= 3 ? 3 : quality >= 2 ? 6 : 10;
        return `${clamp(potential - spread, 50, 99)}–${clamp(potential + spread, 50, 99)}`;
    }

    function ensureAcademy(team) {
        if (!team) return team;
        team.academy = team.academy || {};
        team.academy.facilities = Number.isFinite(team.academy.facilities) ? team.academy.facilities : 60 + Math.floor(Math.random()*20);
        team.academy.investment = Number.isFinite(team.academy.investment) ? team.academy.investment : 2000000;
        team.academy.scoutingQuality = Number.isFinite(team.academy.scoutingQuality) ? team.academy.scoutingQuality : 1;
        team.academy.drivers = Array.isArray(team.academy.drivers) ? team.academy.drivers : [];
        team.academy.reserveDriver = team.academy.reserveDriver || null;
        team.academy.scoutingReports = Array.isArray(team.academy.scoutingReports) ? team.academy.scoutingReports : [];
        while (team.academy.drivers.length < 3) team.academy.drivers.push(generateYouthDriver('EUROPE', team.academy.scoutingQuality));
        team.academy.drivers = team.academy.drivers.map(d => ({ ...d, isAcademyDriver: true }));
        return team;
    }

    function ensureCareerAcademies(career) {
        if (!career?.allTeams) return career;
        career.allTeams.forEach(ensureAcademy);
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (playerTeam) career.academy = playerTeam.academy;
        career.academiesEnabled = true;
        return career;
    }

    function scoutRegion(career, regionKey = 'EUROPE', investment = 1000000) {
        ensureCareerAcademies(career);
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (!playerTeam) return { ok: false, reason: 'No player team' };
        const cost = Math.max(250000, investment || 1000000);
        if ((career.budget || 0) < cost) return { ok: false, reason: 'Insufficient budget' };
        career.budget -= cost;
        const quality = Math.min(4, Math.max(1, Math.floor(cost / 750000) + (playerTeam.academy.scoutingQuality || 1) - 1));
        const prospects = [generateYouthDriver(regionKey, quality), generateYouthDriver(regionKey, quality), generateYouthDriver(regionKey, quality)];
        const report = { id: `report_${Date.now()}`, region: regionKey, quality, cost, prospects, createdAt: Date.now() };
        playerTeam.academy.scoutingReports.push(report);
        career.academy = playerTeam.academy;
        return { ok: true, report };
    }

    function signProspect(career, reportId, prospectId) {
        ensureCareerAcademies(career);
        const team = career.allTeams.find(t => t.id === career.team?.id);
        const report = team?.academy?.scoutingReports?.find(r => r.id === reportId);
        const prospect = report?.prospects?.find(p => p.id === prospectId);
        if (!team || !prospect) return { ok: false, reason: 'Prospect not found' };
        const signingCost = Math.max(250000, Math.round((prospect.marketValue || 1000000) * .12));
        if ((career.budget || 0) < signingCost) return { ok: false, reason: 'Insufficient budget' };
        career.budget -= signingCost;
        prospect.academyStatus = 'ACADEMY';
        prospect.teamId = team.id;
        team.academy.drivers.push(prospect);
        report.prospects = report.prospects.filter(p => p.id !== prospectId);
        career.academy = team.academy;
        return { ok: true, prospect, signingCost };
    }

    function developAcademyDriver(driver, team) {
        if (!driver) return driver;
        driver.age += 1;
        driver.academySeasons = (driver.academySeasons || 0) + 1;
        const hqBoost = (typeof FacilityService !== 'undefined') ? FacilityService.calculateBenefits(team).academyQuality : 1;
        const facilityFactor = ((team.academy?.facilities || 60) / 100) * hqBoost;
        const investmentFactor = Math.min(1.5, (team.academy?.investment || 1000000) / 3000000);
        const opportunity = driver.academyStatus === 'RESERVE' ? .5 : driver.academyStatus === 'LOANED' ? .8 : .25;
        const gap = Math.max(0, (driver.potentialRating || driver.rating) - (driver.rating || 50));
        const gain = Math.min(5, Math.max(0, gap * .18 * (driver.developmentRate || 1) * (0.7 + facilityFactor + investmentFactor*.25 + opportunity)));
        ['pace','consistency','tireManagement','wetSkill','racecraft'].forEach(k => driver.stats[k] = clamp((driver.stats[k] || driver.rating || 50) + gain + Math.random()*1.2 - .4, 35, 99));
        driver.stats.experience = clamp((driver.stats.experience || 20) + (driver.academyStatus === 'RESERVE' ? 4 : 2), 10, 85);
        driver.rating = ratingFromStats(driver.stats);
        driver.potentialRange = makePotentialRange(driver.potentialRating || driver.rating, team.academy?.scoutingQuality || 1);
        return driver;
    }

    function processSeasonEnd(career) {
        ensureCareerAcademies(career);
        const log = [];
        career.allTeams.forEach(team => {
            ensureAcademy(team);
            team.academy.drivers.forEach(d => { const before = d.rating; developAcademyDriver(d, team); log.push(`${team.name} academy: ${d.name} ${before}→${d.rating}`); });
            if (team.academy.reserveDriver) developAcademyDriver(team.academy.reserveDriver, team);
            // AI scouting and promotion
            if (!team.isLocalPlayer) {
                if (team.academy.drivers.length < 3 || Math.random() < .35) team.academy.drivers.push(generateYouthDriver(pick(Object.keys(REGIONS)), team.academy.scoutingQuality || 1));
                const star = [...team.academy.drivers].sort((a,b)=>(b.rating + b.potentialRating*.25) - (a.rating + a.potentialRating*.25))[0];
                const weakSeatIdx = (team.drivers || []).findIndex(d => (d.rating || 70) < 72 || d.retired || d.freeAgent || d.contractYears <= 0);
                if (star && star.age >= 18 && star.rating >= 72 && weakSeatIdx >= 0) {
                    star.academyStatus = 'MAIN_TEAM';
                    star.isAcademyGraduate = true;
                    star.contractYears = 2;
                    star.contractStatus = 'ACTIVE';
                    star.freeAgent = false;
                    star.teamId = team.id;
                    team.drivers[weakSeatIdx] = star;
                    team.academy.drivers = team.academy.drivers.filter(d => d.id !== star.id);
                    log.push(`${team.name} promoted academy graduate ${star.name}`);
                }
            }
        });
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (playerTeam) career.academy = playerTeam.academy;
        career.academyDevelopmentLog = log;
        return { career, log };
    }

    function promoteToReserve(career, driverId) {
        ensureCareerAcademies(career);
        const team = career.allTeams.find(t => t.id === career.team?.id);
        const driver = team?.academy?.drivers?.find(d => d.id === driverId);
        if (!team || !driver) return { ok: false, reason: 'Academy driver not found' };
        driver.academyStatus = 'RESERVE';
        team.academy.reserveDriver = driver;
        team.academy.drivers = team.academy.drivers.filter(d => d.id !== driverId);
        career.academy = team.academy;
        return { ok: true, driver };
    }

    function promoteToMainTeam(career, driverId, replaceIndex = null) {
        ensureCareerAcademies(career);
        const team = career.allTeams.find(t => t.id === career.team?.id);
        let driver = team?.academy?.drivers?.find(d => d.id === driverId) || (team?.academy?.reserveDriver?.id === driverId ? team.academy.reserveDriver : null);
        if (!team || !driver) return { ok: false, reason: 'Academy/reserve driver not found' };
        const idx = replaceIndex === null ? (career.drivers.length < 2 ? career.drivers.length : 1) : replaceIndex;
        driver.academyStatus = 'MAIN_TEAM';
        driver.isAcademyGraduate = true;
        driver.contractYears = 2;
        driver.contractStatus = 'ACTIVE';
        driver.freeAgent = false;
        driver.teamId = team.id;
        if (typeof ContractService !== 'undefined') driver = ContractService.withDriverContract(driver, team.id, 2);
        career.drivers[idx] = driver;
        team.drivers = career.drivers;
        team.academy.drivers = team.academy.drivers.filter(d => d.id !== driverId);
        if (team.academy.reserveDriver?.id === driverId) team.academy.reserveDriver = null;
        career.academy = team.academy;
        return { ok: true, driver };
    }

    function releaseAcademyDriver(career, driverId) {
        ensureCareerAcademies(career);
        const team = career.allTeams.find(t => t.id === career.team?.id);
        if (!team) return { ok: false };
        team.academy.drivers = team.academy.drivers.filter(d => d.id !== driverId);
        if (team.academy.reserveDriver?.id === driverId) team.academy.reserveDriver = null;
        career.academy = team.academy;
        return { ok: true };
    }

    return {
        REGIONS,
        generateYouthDriver,
        ensureAcademy,
        ensureCareerAcademies,
        scoutRegion,
        signProspect,
        processSeasonEnd,
        promoteToReserve,
        promoteToMainTeam,
        releaseAcademyDriver,
        developAcademyDriver
    };
})();
