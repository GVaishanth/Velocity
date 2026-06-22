/* ============================================
   VELOCITY — DRIVER DEVELOPMENT SERVICE
   Aging, potential, peak/decline, retirements, rookies, long-term grid evolution
   ============================================ */

window.DriverDevelopmentService = (() => {
    const FIRST_NAMES = ['Kai','Theo','Maya','Rafael','Nico','Arjun','Luca','Emil','Sofia','Noah','Yuki','Mateo','Lena','Oscar','Milan','Ilya','Ava','Felix'];
    const LAST_NAMES = ['Voss','Rossi','Khan','Silva','Tanaka','Moretti','Novak','Reed','Petrov','Meyer','Costa','Singh','Dubois','Hayes','Kim','Sato'];
    const NATIONALITIES = [
        ['France','🇫🇷'], ['Germany','🇩🇪'], ['Italy','🇮🇹'], ['Brazil','🇧🇷'], ['Japan','🇯🇵'],
        ['India','🇮🇳'], ['UK','🇬🇧'], ['Spain','🇪🇸'], ['Netherlands','🇳🇱'], ['Australia','🇦🇺']
    ];
    const TRAIT_POOL = ['WET_MASTER','QUALIFYING_SPECIALIST','TIRE_WHISPERER','OVERTAKER','CONSISTENT','AGGRESSIVE','SMOOTH','CLUTCH','DEFENDER','FAST_STARTER'];

    function clamp(v, min = 1, max = 99) { return Math.max(min, Math.min(max, Math.round(v))); }
    function avgStats(stats = {}) {
        return Math.round(
            (stats.pace || 70) * 0.25 +
            (stats.consistency || 70) * 0.20 +
            (stats.tireManagement || 70) * 0.15 +
            (stats.wetSkill || 70) * 0.10 +
            (stats.racecraft || 70) * 0.20 +
            (stats.experience || 70) * 0.10
        );
    }
    function recalcRating(driver) {
        driver.rating = clamp(avgStats(driver.stats), 50, 99);
        return driver.rating;
    }

    function inferPotential(driver) {
        const rating = driver.rating || avgStats(driver.stats);
        const age = driver.age || 25;
        let bonus = 4;
        if (age <= 20) bonus = 14 + Math.floor(Math.random() * 7);
        else if (age <= 23) bonus = 10 + Math.floor(Math.random() * 6);
        else if (age <= 26) bonus = 6 + Math.floor(Math.random() * 5);
        else if (age <= 31) bonus = 2 + Math.floor(Math.random() * 4);
        else bonus = Math.floor(Math.random() * 3);
        return clamp(Math.max(rating, rating + bonus), rating, 98);
    }

    function ensureDriverDevelopment(driver) {
        if (!driver) return driver;
        if (!driver.stats) driver.stats = { pace: driver.rating || 70, consistency: driver.rating || 70, tireManagement: 70, wetSkill: 70, racecraft: 70, experience: 50 };
        driver.age = Number.isFinite(driver.age) ? driver.age : 22 + Math.floor(Math.random() * 14);
        driver.potentialRating = Number.isFinite(driver.potentialRating) ? driver.potentialRating : inferPotential(driver);
        driver.peakAgeStart = Number.isFinite(driver.peakAgeStart) ? driver.peakAgeStart : 26 + Math.floor(Math.random() * 3);
        driver.peakAgeEnd = Number.isFinite(driver.peakAgeEnd) ? driver.peakAgeEnd : driver.peakAgeStart + 5 + Math.floor(Math.random() * 3);
        driver.developmentRate = Number.isFinite(driver.developmentRate) ? driver.developmentRate : Number((0.7 + Math.random() * 0.8).toFixed(2));
        driver.confidence = Number.isFinite(driver.confidence) ? driver.confidence : 55;
        driver.retirementRisk = Number.isFinite(driver.retirementRisk) ? driver.retirementRisk : 0;
        driver.retired = !!driver.retired;
        driver.retirementStatus = driver.retirementStatus || (driver.retired ? 'RETIRED' : 'ACTIVE');
        driver.developmentHistory = Array.isArray(driver.developmentHistory) ? driver.developmentHistory : [];
        driver.traits = Array.isArray(driver.traits) ? driver.traits : [];
        driver.rating = Number.isFinite(driver.rating) ? driver.rating : recalcRating(driver);
        return driver;
    }

    function getTeamDevelopmentFactor(team, career) {
        const stats = team?.carStats || team?.baseCarStats || career?.carStats || {};
        const facilities = ((stats.reliability || 75) + (stats.aerodynamics || stats.aero || 75) + (stats.mechanicalGrip || stats.grip || 75)) / 300;
        const staffRating = Object.values(team?.staff || career?.staff || {}).reduce((sum, s) => sum + (s?.rating || s?.reputation || 75), 0) / Math.max(1, Object.values(team?.staff || career?.staff || {}).filter(Boolean).length) / 100;
        const facilityBoost = (typeof FacilityService !== 'undefined') ? FacilityService.calculateBenefits(team || career).driverDevelopment : 1;
        return (0.8 + facilities * 0.35 + staffRating * 0.35) * facilityBoost;
    }

    function updateRetirementRisk(driver) {
        let risk = 0;
        if (driver.age >= 35) risk += (driver.age - 34) * 0.08;
        if (driver.age >= 39) risk += 0.20;
        if ((driver.contractYears || 0) <= 0) risk += 0.12;
        if ((driver.rating || 70) < 70 && driver.age > 32) risk += 0.10;
        if (driver.traits?.includes('VETERAN')) risk -= 0.05;
        driver.retirementRisk = Math.max(0, Math.min(0.85, Number(risk.toFixed(3))));
        return driver.retirementRisk;
    }

    function developDriver(driver, team, career) {
        ensureDriverDevelopment(driver);
        if (driver.retired) return driver;
        const before = driver.rating || avgStats(driver.stats);
        driver.age += 1;
        driver.stats.experience = clamp((driver.stats.experience || 50) + (driver.age < 30 ? 3 : 1), 1, 99);
        const factor = getTeamDevelopmentFactor(team, career) * (driver.developmentRate || 1);
        let delta = 0;
        if (driver.age < driver.peakAgeStart) {
            const potentialGap = Math.max(0, (driver.potentialRating || before) - before);
            delta = Math.min(4, Math.max(0, potentialGap * 0.22 * factor));
        } else if (driver.age <= driver.peakAgeEnd) {
            delta = ((driver.potentialRating || before) > before ? 0.4 : 0) * factor;
        } else {
            delta = -Math.min(4, 0.45 + (driver.age - driver.peakAgeEnd) * 0.28);
        }
        if (driver.confidence > 70) delta += 0.3;
        if (driver.confidence < 35) delta -= 0.3;

        ['pace','consistency','tireManagement','wetSkill','racecraft'].forEach(k => {
            let statDelta = delta;
            if (k === 'pace' && driver.age > driver.peakAgeEnd) statDelta -= 0.3;
            if (k === 'racecraft' && driver.age < 32) statDelta += 0.2;
            if (k === 'wetSkill' && driver.traits?.includes('WET_MASTER')) statDelta += Math.max(0, delta) * 0.15;
            if (k === 'tireManagement' && driver.traits?.includes('TIRE_WHISPERER')) statDelta += Math.max(0, delta) * 0.15;
            driver.stats[k] = clamp((driver.stats[k] || before) + statDelta, 40, Math.max(driver.potentialRating || 99, 99));
        });
        recalcRating(driver);
        updateRetirementRisk(driver);
        driver.developmentHistory.push({ season: career?.season || 1, age: driver.age, before, after: driver.rating, delta: driver.rating - before, retirementRisk: driver.retirementRisk });
        if (driver.developmentHistory.length > 12) driver.developmentHistory.shift();
        return driver;
    }

    function shouldRetire(driver) {
        updateRetirementRisk(driver);
        return driver.age >= 38 && Math.random() < driver.retirementRisk;
    }

    function retireDriver(driver) {
        driver.retired = true;
        driver.retirementStatus = 'RETIRED';
        driver.contractStatus = 'RETIRED';
        driver.contractYears = 0;
        driver.freeAgent = false;
        driver.teamId = null;
        return driver;
    }

    function generateRookie() {
        const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
        const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
        const [nationality, flag] = NATIONALITIES[Math.floor(Math.random() * NATIONALITIES.length)];
        const potential = 82 + Math.floor(Math.random() * 15);
        const rating = 62 + Math.floor(Math.random() * 17);
        const traitCount = Math.random() < 0.35 ? 2 : 1;
        const traits = [...TRAIT_POOL].sort(() => Math.random() - 0.5).slice(0, traitCount);
        const rookie = {
            id: `rookie_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
            name: `${first[0]}. ${last}`,
            firstName: first,
            lastName: last,
            nationality,
            flag,
            age: 18 + Math.floor(Math.random() * 4),
            rating,
            cost: Math.round(2500000 + (rating - 60) * 350000),
            stats: {
                pace: clamp(rating + Math.floor(Math.random() * 7) - 3),
                consistency: clamp(rating + Math.floor(Math.random() * 7) - 5),
                tireManagement: clamp(rating + Math.floor(Math.random() * 8) - 4),
                wetSkill: clamp(rating + Math.floor(Math.random() * 10) - 5),
                racecraft: clamp(rating + Math.floor(Math.random() * 7) - 4),
                experience: 25 + Math.floor(Math.random() * 20)
            },
            traits,
            bio: 'Generated academy rookie with long-term development potential.',
            isRookie: true
        };
        rookie.potentialRating = potential;
        return ensureDriverDevelopment(rookie);
    }

    function processSeasonEnd(career) {
        if (!career?.allTeams) return { career, developmentLog: [], retirements: [], rookies: [] };
        const developmentLog = [];
        const retirements = [];
        const rookies = [];
        career.rookiePool = Array.isArray(career.rookiePool) ? career.rookiePool : [];
        career.retiredDrivers = Array.isArray(career.retiredDrivers) ? career.retiredDrivers : [];
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (playerTeam) playerTeam.drivers = career.drivers || playerTeam.drivers || [];

        career.allTeams.forEach(team => {
            team.drivers = (team.drivers || []).map(driver => {
                const before = driver.rating || 70;
                developDriver(driver, team, career);
                developmentLog.push(`${driver.name}: ${before} → ${driver.rating} (Age ${driver.age})`);
                if (shouldRetire(driver)) {
                    retireDriver(driver);
                    retirements.push(driver.name);
                    career.retiredDrivers.push({ id: driver.id, name: driver.name, age: driver.age, rating: driver.rating, season: career.season });
                    if (!team.isLocalPlayer) {
                        const rookie = generateRookie();
                        rookie.teamId = team.id;
                        rookie.contractYears = 2 + Math.floor(Math.random() * 3);
                        rookie.contractStatus = 'ACTIVE';
                        rookie.freeAgent = false;
                        rookies.push(rookie.name);
                        career.rookiePool.push(rookie);
                        return rookie;
                    }
                }
                return driver;
            });
        });

        const updatedPlayerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (updatedPlayerTeam) career.drivers = updatedPlayerTeam.drivers;
        career.driverDevelopmentLog = developmentLog;
        career.driverRetirementLog = retirements;
        career.rookieGenerationLog = rookies;
        return { career, developmentLog, retirements, rookies };
    }

    return {
        ensureDriverDevelopment,
        developDriver,
        processSeasonEnd,
        generateRookie,
        updateRetirementRisk,
        retireDriver,
        recalcRating
    };
})();
