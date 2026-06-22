/* ============================================
   VELOCITY — TEAM HEADQUARTERS / FACILITY SERVICE
   Long-term team infrastructure, construction, AI investment
   ============================================ */

window.FacilityService = (() => {
    const MAX_LEVEL = 10;
    const FACILITIES = {
        rd: { name: 'Research & Development', icon: '🔬', baseCost: 5000000, baseWeeks: 6, benefit: 'Faster all car development and more R&D points' },
        aerodynamics: { name: 'Aerodynamic Center', icon: '🛩️', baseCost: 6500000, baseWeeks: 8, benefit: 'Downforce upgrades and wind tunnel efficiency' },
        powertrain: { name: 'Powertrain Lab', icon: '⚡', baseCost: 7000000, baseWeeks: 8, benefit: 'Power unit gains and energy deployment efficiency' },
        simulation: { name: 'Simulator Facility', icon: '🖥️', baseCost: 5500000, baseWeeks: 7, benefit: 'Driver growth and qualifying preparation' },
        manufacturing: { name: 'Factory / Manufacturing', icon: '🏭', baseCost: 6000000, baseWeeks: 7, benefit: 'Reliability and upgrade production speed' },
        driverDevelopment: { name: 'Driver Academy Campus', icon: '🌱', baseCost: 4500000, baseWeeks: 6, benefit: 'Academy growth, rookie quality, youth scouting' },
        staffDevelopment: { name: 'Staff Training Center', icon: '🎓', baseCost: 4000000, baseWeeks: 5, benefit: 'Engineer, strategist, TD, race-engineer improvement' },
        scouting: { name: 'Scouting Department', icon: '🌍', baseCost: 3500000, baseWeeks: 5, benefit: 'More accurate scouting reports and talent discovery' },
        marketing: { name: 'Marketing Center', icon: '📣', baseCost: 3000000, baseWeeks: 4, benefit: 'Sponsor offers, fan growth, brand value' },
        hospitality: { name: 'Hospitality Suite', icon: '🥂', baseCost: 2500000, baseWeeks: 4, benefit: 'Sponsor confidence and shareholder sentiment' }
    };

    const TEAM_SPECIALIZATIONS = {
        invicta: { aerodynamics: 3, powertrain: 2 },
        paragon: { simulation: 3, powertrain: 2 },
        veloce: { manufacturing: 3, marketing: 2 },
        novara: { driverDevelopment: 3, scouting: 2 },
        zenith: { rd: 2, aerodynamics: 2 },
        asterion: { manufacturing: 2, hospitality: 2 },
        default: {}
    };

    function clamp(v, min = 1, max = MAX_LEVEL) { return Math.max(min, Math.min(max, Math.round(v))); }
    function facilityKeys() { return Object.keys(FACILITIES); }
    function getDefinition(key) { return FACILITIES[key]; }

    const UPGRADE_WEEK_BY_LEVEL = {
        1: 2,  // Level 1 → 2
        2: 3,  // Level 2 → 3
        3: 4,  // Level 3 → 4
        4: 6,  // Level 4 → 5
        5: 8,  // Level 5 → 6
        6: 10, // Level 6 → 7
        7: 12, // Level 7 → 8
        8: 14, // Level 8 → 9
        9: 16  // Level 9 → 10
    };

    const UPGRADE_COST_MULTIPLIER_BY_LEVEL = {
        1: 0.75,
        2: 1.00,
        3: 1.35,
        4: 1.85,
        5: 2.55,
        6: 3.45,
        7: 4.60,
        8: 6.00,
        9: 7.70
    };

    function upgradeCost(key, currentLevel) {
        const def = FACILITIES[key];
        const level = clamp(currentLevel || 1, 1, 9);
        const multiplier = UPGRADE_COST_MULTIPLIER_BY_LEVEL[level] || 1;
        return Math.round((def?.baseCost || 3000000) * multiplier / 100000) * 100000;
    }

    function upgradeWeeks(key, currentLevel) {
        const level = clamp(currentLevel || 1, 1, 9);
        return UPGRADE_WEEK_BY_LEVEL[level] || 16;
    }

    function maintenanceCost(key, level) {
        const def = FACILITIES[key];
        return Math.round((def?.baseCost || 3000000) * 0.055 * Math.max(1, level) / 100000) * 100000;
    }

    function defaultHQ(team = {}) {
        const spec = TEAM_SPECIALIZATIONS[team.id] || TEAM_SPECIALIZATIONS.default;
        const facilities = {};
        facilityKeys().forEach(key => {
            const rep = team.reputation || team.fanPopularity || 70;
            const baseline = rep >= 88 ? 5 : rep >= 80 ? 4 : rep >= 72 ? 3 : 2;
            facilities[key] = { level: clamp(baseline + (spec[key] || 0), 1, 9), upgrade: null };
        });
        return {
            name: `${team.name || 'Team'} Headquarters`,
            facilities,
            boardConfidence: team.isLocalPlayer ? 72 : 65,
            sponsorConfidence: team.fanPopularity || 60,
            shareholderConfidence: 65,
            brandValue: (team.reputation || team.fanPopularity || 70) * 1000000,
            completedProjects: [],
            maintenanceDue: 0
        };
    }

    function ensureTeamHQ(team) {
        if (!team) return team;
        team.headquarters = team.headquarters || defaultHQ(team);
        team.headquarters.facilities = team.headquarters.facilities || {};
        facilityKeys().forEach(key => {
            const existing = team.headquarters.facilities[key];
            team.headquarters.facilities[key] = {
                level: clamp(existing?.level || defaultHQ(team).facilities[key].level),
                upgrade: existing?.upgrade || null
            };
        });
        syncAcademyFromHQ(team);
        return team;
    }

    function ensureCareerFacilities(career) {
        if (!career?.allTeams) return career;
        career.allTeams.forEach(ensureTeamHQ);
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (playerTeam) {
            career.headquarters = playerTeam.headquarters;
            syncAcademyFromHQ(playerTeam);
            career.academy = playerTeam.academy || career.academy;
        }
        career.facilitiesEnabled = true;
        return career;
    }

    function getFacilityLevel(teamOrCareer, key) {
        const hq = teamOrCareer?.headquarters || teamOrCareer?.team?.headquarters;
        return hq?.facilities?.[key]?.level || 1;
    }

    function calculateBenefits(teamOrCareer) {
        const hq = teamOrCareer?.headquarters || {};
        const f = hq.facilities || {};
        const level = k => f[k]?.level || 1;
        return {
            rdSpeed: 1 + level('rd') * 0.035,
            aeroResearch: 1 + level('aerodynamics') * 0.045,
            powertrainResearch: 1 + level('powertrain') * 0.04,
            driverDevelopment: 1 + level('simulation') * 0.025 + level('driverDevelopment') * 0.04,
            academyQuality: 1 + level('driverDevelopment') * 0.06,
            scoutingAccuracy: 1 + level('scouting') * 0.07,
            staffDevelopment: 1 + level('staffDevelopment') * 0.04,
            reliability: level('manufacturing') * 0.45,
            sponsorIncome: 1 + level('marketing') * 0.035 + level('hospitality') * 0.02,
            brandGrowth: level('marketing') * 0.5,
            maintenanceCost: facilityKeys().reduce((sum, k) => sum + maintenanceCost(k, level(k)), 0)
        };
    }

    function syncAcademyFromHQ(team) {
        if (!team) return;
        if (typeof AcademyService !== 'undefined') AcademyService.ensureAcademy(team);
        if (!team.academy) return;
        team.academy.facilities = Math.max(team.academy.facilities || 1, getFacilityLevel(team, 'driverDevelopment') * 10);
        team.academy.scoutingQuality = Math.max(team.academy.scoutingQuality || 1, Math.ceil(getFacilityLevel(team, 'scouting') / 3));
        team.academy.investment = Math.max(team.academy.investment || 0, getFacilityLevel(team, 'driverDevelopment') * 750000);
    }

    function boardApprovalChance(career, key, cost) {
        const hq = career.headquarters || {};
        const confidence = (hq.boardConfidence || 65) + (hq.shareholderConfidence || 65) * 0.25;
        const budgetRatio = cost / Math.max(1, career.budget || 1);
        let chance = confidence / 100 - budgetRatio * 0.55;
        if (cost > 25000000) chance -= 0.12;
        if (['marketing','hospitality'].includes(key)) chance += 0.05;
        return Math.max(0.15, Math.min(0.95, chance));
    }

    function requestUpgrade(career, key) {
        ensureCareerFacilities(career);
        const facility = career.headquarters.facilities[key];
        const def = FACILITIES[key];
        if (!facility || !def) return { ok: false, reason: 'Unknown facility' };
        if (facility.level >= MAX_LEVEL) return { ok: false, reason: 'Facility already max level' };
        if (facility.upgrade) return { ok: false, reason: 'Upgrade already in progress' };
        const cost = upgradeCost(key, facility.level);
        if ((career.budget || 0) < cost) return { ok: false, reason: 'Insufficient budget' };
        const approvalChance = boardApprovalChance(career, key, cost);
        if (Math.random() > approvalChance) {
            career.headquarters.boardConfidence = Math.max(0, (career.headquarters.boardConfidence || 65) - 3);
            return { ok: false, reason: 'Board rejected the project', approvalChance };
        }
        career.budget -= cost;
        facility.upgrade = {
            fromLevel: facility.level,
            toLevel: facility.level + 1,
            weeksRemaining: upgradeWeeks(key, facility.level),
            totalWeeks: upgradeWeeks(key, facility.level),
            cost,
            startedSeason: career.season || 1
        };
        career.headquarters.shareholderConfidence = Math.max(0, (career.headquarters.shareholderConfidence || 65) - (cost > 20000000 ? 4 : 1));
        return { ok: true, facility: key, cost, upgrade: facility.upgrade, approvalChance };
    }

    function processConstruction(career, weeks = 10) {
        ensureCareerFacilities(career);
        const completed = [];
        facilityKeys().forEach(key => {
            const facility = career.headquarters.facilities[key];
            if (!facility?.upgrade) return;
            facility.upgrade.weeksRemaining -= weeks;
            if (facility.upgrade.weeksRemaining <= 0) {
                facility.level = clamp(facility.upgrade.toLevel);
                completed.push({ key, level: facility.level, name: FACILITIES[key].name });
                career.headquarters.completedProjects.push({ key, level: facility.level, season: career.season || 1 });
                facility.upgrade = null;
            }
        });
        const benefits = calculateBenefits(career);
        career.headquarters.maintenanceDue = benefits.maintenanceCost;
        career.budget = Math.max(0, (career.budget || 0) - benefits.maintenanceCost);
        const team = career.allTeams?.find(t => t.id === career.team?.id);
        if (team) {
            team.headquarters = career.headquarters;
            applyFacilityEffectsToTeam(team);
            syncAcademyFromHQ(team);
            career.academy = team.academy;
        }
        return { completed, maintenanceCost: benefits.maintenanceCost };
    }

    function applyFacilityEffectsToTeam(team) {
        ensureTeamHQ(team);
        const b = calculateBenefits(team);
        team.facilityBenefits = b;
        team.carStats = team.carStats || { ...(team.baseCarStats || {}) };
        if (team.carStats.aerodynamics !== undefined) team.carStats.aerodynamics = Math.min(99, Math.round((team.baseCarStats?.aerodynamics || team.carStats.aerodynamics || 70) + b.aeroResearch * 1.2));
        if (team.carStats.aero !== undefined) team.carStats.aero = Math.min(99, Math.round((team.baseCarStats?.aero || team.carStats.aero || 70) + b.aeroResearch * 1.2));
        if (team.carStats.powerUnit !== undefined) team.carStats.powerUnit = Math.min(99, Math.round((team.baseCarStats?.powerUnit || team.carStats.powerUnit || 70) + b.powertrainResearch));
        if (team.carStats.power !== undefined) team.carStats.power = Math.min(99, Math.round((team.baseCarStats?.power || team.carStats.power || 70) + b.powertrainResearch));
        if (team.carStats.reliability !== undefined) team.carStats.reliability = Math.min(99, Math.round((team.baseCarStats?.reliability || team.carStats.reliability || 70) + b.reliability));
        return team;
    }

    function processAI(career) {
        ensureCareerFacilities(career);
        const log = [];
        (career.allTeams || []).filter(t => !t.isLocalPlayer).forEach(team => {
            ensureTeamHQ(team);
            const rep = team.reputation || team.fanPopularity || 70;
            const budget = team.aiBudget || (rep * 1500000);
            const priority = rep >= 85 ? ['aerodynamics','simulation','powertrain','rd'] : rep >= 75 ? ['manufacturing','driverDevelopment','scouting','rd'] : ['driverDevelopment','scouting','marketing','manufacturing'];
            const key = priority.find(k => !team.headquarters.facilities[k].upgrade && team.headquarters.facilities[k].level < (rep >= 85 ? 9 : 7));
            if (key) {
                const facility = team.headquarters.facilities[key];
                const cost = upgradeCost(key, facility.level);
                if (budget > cost) {
                    facility.upgrade = { fromLevel: facility.level, toLevel: facility.level + 1, weeksRemaining: upgradeWeeks(key, facility.level), totalWeeks: upgradeWeeks(key, facility.level), cost, startedSeason: career.season || 1 };
                    team.aiBudget = budget - cost;
                    log.push(`${team.name} started ${FACILITIES[key].name} L${facility.level + 1}`);
                }
            }
            // AI construction progress
            facilityKeys().forEach(k => {
                const f = team.headquarters.facilities[k];
                if (f.upgrade) {
                    f.upgrade.weeksRemaining -= 10;
                    if (f.upgrade.weeksRemaining <= 0) {
                        f.level = clamp(f.upgrade.toLevel);
                        f.upgrade = null;
                        log.push(`${team.name} completed ${FACILITIES[k].name} L${f.level}`);
                    }
                }
            });
            applyFacilityEffectsToTeam(team);
            syncAcademyFromHQ(team);
        });
        career.facilityAILog = log;
        return { career, log };
    }

    function processSeasonEnd(career) {
        const construction = processConstruction(career, 10);
        const ai = processAI(career);
        career.facilitySeasonLog = [...(construction.completed || []).map(c => `Completed ${c.name} L${c.level}`), ...(ai.log || [])];
        return { career, construction, ai };
    }

    return {
        FACILITIES,
        ensureTeamHQ,
        ensureCareerFacilities,
        requestUpgrade,
        processConstruction,
        processAI,
        processSeasonEnd,
        calculateBenefits,
        applyFacilityEffectsToTeam,
        upgradeCost,
        upgradeWeeks,
        maintenanceCost,
        getFacilityLevel,
        getDefinition
    };
})();
