/* ============================================
   VELOCITY — CONTRACT SERVICE
   Driver/staff contracts, renewals, expiry, AI personnel movement
   ============================================ */

window.ContractService = (() => {
    const DEFAULT_DRIVER_YEARS = 3;
    const DEFAULT_STAFF_YEARS = 2;

    function moneyRound(n) {
        return Math.max(250000, Math.round((n || 0) / 100000) * 100000);
    }

    function driverSalary(driver) {
        const rating = driver?.rating || 75;
        const base = driver?.cost ? driver.cost * 0.35 : 1000000 + Math.pow(Math.max(0, rating - 60), 2) * 18000;
        return moneyRound(base);
    }

    function staffSalary(staff) {
        const rating = staff?.rating || 75;
        const base = staff?.cost ? staff.cost * 0.30 : 750000 + Math.pow(Math.max(0, rating - 60), 2) * 14000;
        return moneyRound(base);
    }

    function marketValue(person) {
        const rating = person?.rating || 75;
        const cost = person?.cost || 0;
        return moneyRound(Math.max(cost, 1000000 + Math.pow(Math.max(0, rating - 55), 2) * 25000));
    }

    function withDriverContract(driver, teamId, years = null) {
        if (!driver) return driver;
        const d = { ...driver };
        const existingYears = Number.isFinite(d.contractYears) ? d.contractYears : years;
        d.contractYears = Math.max(0, existingYears ?? (2 + Math.floor(Math.random() * DEFAULT_DRIVER_YEARS)));
        d.salary = Number.isFinite(d.salary) ? d.salary : driverSalary(d);
        d.loyalty = Number.isFinite(d.loyalty) ? d.loyalty : Math.max(35, Math.min(95, 55 + Math.floor(Math.random() * 36)));
        d.marketValue = Number.isFinite(d.marketValue) ? d.marketValue : marketValue(d);
        d.teamId = d.contractYears > 0 ? (d.teamId || teamId || null) : null;
        d.expiryDate = d.contractYears > 0 ? `End of Season +${d.contractYears}` : 'Free Agent';
        d.contractStatus = d.contractYears > 0 ? 'ACTIVE' : 'EXPIRED';
        d.freeAgent = d.contractYears <= 0;
        return d;
    }

    function withStaffContract(staff, teamId, role, years = null) {
        if (!staff) return staff;
        const s = { ...staff };
        const existingYears = Number.isFinite(s.contractYears) ? s.contractYears : years;
        s.contractYears = Math.max(0, existingYears ?? (1 + Math.floor(Math.random() * DEFAULT_STAFF_YEARS)));
        s.salary = Number.isFinite(s.salary) ? s.salary : staffSalary(s);
        s.reputation = Number.isFinite(s.reputation) ? s.reputation : (s.rating || 75);
        s.marketValue = Number.isFinite(s.marketValue) ? s.marketValue : marketValue(s);
        s.teamId = s.contractYears > 0 ? (s.teamId || teamId || null) : null;
        s.role = s.role || role || 'staff';
        s.expiryDate = s.contractYears > 0 ? `End of Season +${s.contractYears}` : 'Free Agent';
        s.contractStatus = s.contractYears > 0 ? 'ACTIVE' : 'EXPIRED';
        s.freeAgent = s.contractYears <= 0;
        return s;
    }

    function ensureTeamContracts(team, staff = null) {
        if (!team) return team;
        const t = { ...team };
        t.drivers = (t.drivers || []).map(d => withDriverContract(d, t.id));
        const srcStaff = staff || t.staff || {};
        t.staff = {
            techDirector: withStaffContract(srcStaff.techDirector, t.id, 'techDirector'),
            strategist: withStaffContract(srcStaff.strategist, t.id, 'strategist'),
            pitCrew: withStaffContract(srcStaff.pitCrew, t.id, 'pitCrew')
        };
        return t;
    }

    function ensureCareerContracts(career) {
        if (!career) return career;
        career.drivers = (career.drivers || []).map(d => withDriverContract(d, career.team?.id));
        career.staff = {
            techDirector: withStaffContract(career.staff?.techDirector, career.team?.id, 'techDirector'),
            strategist: withStaffContract(career.staff?.strategist, career.team?.id, 'strategist'),
            pitCrew: withStaffContract(career.staff?.pitCrew, career.team?.id, 'pitCrew')
        };
        career.allTeams = (career.allTeams || []).map(team => {
            const isPlayerTeam = team.id === career.team?.id;
            return ensureTeamContracts(team, isPlayerTeam ? career.staff : team.staff);
        });
        const playerTeam = career.allTeams.find(t => t.id === career.team?.id);
        if (playerTeam) {
            playerTeam.drivers = career.drivers;
            playerTeam.staff = career.staff;
        }
        career.contractsEnabled = true;
        return career;
    }

    function annualPersonnelCost(team) {
        const driverCost = (team?.drivers || []).reduce((sum, d) => sum + (d.salary || 0), 0);
        const staffCost = Object.values(team?.staff || {}).reduce((sum, s) => sum + (s?.salary || 0), 0);
        return driverCost + staffCost;
    }

    function renewDriver(career, driverId, years = 2, salary = null) {
        ensureCareerContracts(career);
        const driver = career.drivers.find(d => d.id === driverId);
        if (!driver) return { ok: false, reason: 'Driver not found' };
        const newSalary = moneyRound(salary || driver.salary * (1.05 + Math.max(0, (driver.rating || 75) - 80) * 0.01));
        const signingBonus = moneyRound(newSalary * 0.25);
        if ((career.budget || 0) < signingBonus) return { ok: false, reason: 'Insufficient budget for signing bonus' };
        career.budget -= signingBonus;
        Object.assign(driver, withDriverContract({ ...driver, contractYears: years, salary: newSalary, freeAgent: false, contractStatus: 'ACTIVE' }, career.team?.id, years));
        const team = career.allTeams?.find(t => t.id === career.team?.id);
        if (team) team.drivers = career.drivers;
        return { ok: true, signingBonus, salary: newSalary };
    }

    function renewStaff(career, role, years = 2, salary = null) {
        ensureCareerContracts(career);
        const member = career.staff?.[role];
        if (!member) return { ok: false, reason: 'Staff not found' };
        const newSalary = moneyRound(salary || member.salary * 1.08);
        const signingBonus = moneyRound(newSalary * 0.20);
        if ((career.budget || 0) < signingBonus) return { ok: false, reason: 'Insufficient budget for signing bonus' };
        career.budget -= signingBonus;
        career.staff[role] = withStaffContract({ ...member, contractYears: years, salary: newSalary, freeAgent: false, contractStatus: 'ACTIVE' }, career.team?.id, role, years);
        const team = career.allTeams?.find(t => t.id === career.team?.id);
        if (team) team.staff = career.staff;
        return { ok: true, signingBonus, salary: newSalary };
    }

    function releaseDriver(career, driverId) {
        ensureCareerContracts(career);
        const driver = career.drivers.find(d => d.id === driverId);
        if (driver) {
            driver.contractYears = 0;
            driver.contractStatus = 'RELEASED';
            driver.freeAgent = true;
            driver.teamId = null;
        }
        return driver;
    }

    function expirePerson(person) {
        if (!person) return person;
        person.contractYears = Math.max(0, (person.contractYears || 0) - 1);
        person.expiryDate = person.contractYears > 0 ? `End of Season +${person.contractYears}` : 'Free Agent';
        if (person.contractYears <= 0) {
            person.contractStatus = 'EXPIRED';
            person.freeAgent = true;
            person.teamId = null;
        }
        return person;
    }

    function buildDriverPool(careerOrTeams) {
        const allTeams = Array.isArray(careerOrTeams) ? careerOrTeams : (careerOrTeams?.allTeams || []);
        const rookiePool = Array.isArray(careerOrTeams?.rookiePool) ? careerOrTeams.rookiePool : [];
        const pool = new Map();

        (typeof DRIVERS_DATA !== 'undefined' ? DRIVERS_DATA : []).forEach(driver => {
            if (driver?.id) pool.set(driver.id, withDriverContract(driver, null, 0));
        });

        allTeams.forEach(team => {
            (team?.drivers || []).forEach(driver => {
                if (driver?.id && !pool.has(driver.id)) pool.set(driver.id, withDriverContract(driver, null, 0));
            });
        });

        rookiePool.forEach(driver => {
            if (driver?.id) pool.set(driver.id, withDriverContract(driver, null, 0));
        });

        return [...pool.values()].filter(driver => !driver?.retired);
    }

    function getAvailableDrivers(careerOrTeams, assignedIds = null) {
        const allTeams = Array.isArray(careerOrTeams) ? careerOrTeams : (careerOrTeams?.allTeams || []);
        const signed = new Set();
        (allTeams || []).forEach(team => {
            (team.drivers || []).forEach(driver => {
                if (!driver) return;
                if (!driver.freeAgent && driver.contractYears > 0) signed.add(driver.id);
            });
        });
        if (assignedIds instanceof Set) {
            assignedIds.forEach(id => signed.add(id));
        }
        return buildDriverPool(careerOrTeams)
            .filter(driver => !signed.has(driver.id))
            .map(driver => withDriverContract(driver, null, 0));
    }

    function getAvailableStaff(allTeams, role) {
        const signed = new Set();
        (allTeams || []).forEach(t => Object.values(t.staff || {}).forEach(s => { if (s && !s.freeAgent && s.contractYears > 0) signed.add(s.id); }));
        const poolName = role === 'techDirector' ? 'technicalDirectors' : role === 'strategist' ? 'chiefStrategists' : 'pitCrews';
        return (typeof STAFF_DATA !== 'undefined' ? (STAFF_DATA[poolName] || []) : [])
            .filter(s => !signed.has(s.id))
            .map(s => withStaffContract(s, null, role, 0));
    }

    function chooseDriverForTeam(team, careerOrTeams, assignedIds = null) {
        const available = getAvailableDrivers(careerOrTeams, assignedIds);
        if (!available.length) return null;
        const rep = team.reputation || team.fanPopularity || 75;
        available.sort((a, b) => Math.abs((a.rating || 75) - rep) - Math.abs((b.rating || 75) - rep));
        const candidates = available.filter(d => Math.abs((d.rating || 75) - rep) <= 18);
        const pick = (candidates.length ? candidates : available).sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
        if (assignedIds instanceof Set) assignedIds.add(pick.id);
        return withDriverContract(pick, team.id, 1 + Math.floor(Math.random() * 3));
    }

    function chooseStaffForTeam(team, allTeams, role) {
        const available = getAvailableStaff(allTeams, role);
        if (!available.length) return null;
        const rep = team.reputation || team.fanPopularity || 75;
        const pick = available.sort((a, b) => Math.abs((a.rating || 75) - rep) - Math.abs((b.rating || 75) - rep))[0];
        return withStaffContract(pick, team.id, role, 1 + Math.floor(Math.random() * 3));
    }

    function detachAssignedAcademyDrivers(career) {
        const activeIds = new Set((career?.allTeams || []).flatMap(team => (team.drivers || []).map(driver => driver?.id)).filter(Boolean));
        (career?.allTeams || []).forEach(team => {
            if (!team.academy) return;
            team.academy.drivers = (team.academy.drivers || []).filter(driver => driver && !activeIds.has(driver.id));
            if (team.academy.reserveDriver && activeIds.has(team.academy.reserveDriver.id)) {
                team.academy.reserveDriver = null;
            }
        });
        const playerTeam = career?.allTeams?.find(team => team.id === career?.team?.id);
        if (playerTeam) career.academy = playerTeam.academy;
    }

    function repairActiveDriverRosters(career, movementLog = []) {
        const allTeams = career?.allTeams || [];
        const playerTeamId = career?.team?.id;
        const assignedIds = new Set();

        const assignUniqueDrivers = (team, priority = false) => {
            const uniqueRoster = [];
            (team.drivers || []).forEach(driver => {
                if (!driver || driver.retired) return;
                if (assignedIds.has(driver.id)) {
                    if (!priority) movementLog.push(`${team.name} released duplicate driver ${driver.name}`);
                    return;
                }
                const signed = withDriverContract(driver, team.id, driver.contractYears || 1);
                signed.teamId = team.id;
                signed.freeAgent = false;
                signed.contractStatus = signed.contractStatus === 'EXPIRED' ? 'ACTIVE' : signed.contractStatus;
                uniqueRoster.push(signed);
                assignedIds.add(signed.id);
            });
            team.drivers = uniqueRoster;

            while (team.drivers.length < 2) {
                const replacement = chooseDriverForTeam(team, career, assignedIds);
                if (!replacement) break;
                team.drivers.push(replacement);
                movementLog.push(`${team.name} signed ${replacement.name}`);
            }
        };

        const playerTeam = allTeams.find(team => team.id === playerTeamId);
        if (playerTeam) assignUniqueDrivers(playerTeam, true);
        allTeams.filter(team => team.id !== playerTeamId).forEach(team => assignUniqueDrivers(team, false));

        if (playerTeam) career.drivers = playerTeam.drivers;
        detachAssignedAcademyDrivers(career);
        return { assignedIds };
    }

    function processSeasonEnd(career) {
        ensureCareerContracts(career);
        if (career?.contractsLastProcessedSeason === career?.season) {
            return { career, movementLog: career.contractMovementLog || [], skipped: true };
        }

        const movementLog = [];
        const allTeams = career.allTeams || [];
        const playerTeamId = career.team?.id;

        allTeams.forEach(team => {
            const cost = annualPersonnelCost(team);
            if (team.id === playerTeamId) career.budget = Math.max(0, (career.budget || 0) - cost);
            team.seasonPersonnelExpense = cost;

            team.drivers = (team.drivers || []).map(expirePerson);
            Object.keys(team.staff || {}).forEach(role => expirePerson(team.staff[role]));

            if (team.id !== playerTeamId) {
                team.drivers = team.drivers.filter(driver => !driver.freeAgent && !driver.retired);
                ['techDirector', 'strategist', 'pitCrew'].forEach(role => {
                    const current = team.staff?.[role];
                    const weak = !current || current.freeAgent || (current.rating || 70) < 72;
                    if (weak) {
                        const replacement = chooseStaffForTeam(team, allTeams, role);
                        if (replacement) {
                            team.staff = team.staff || {};
                            team.staff[role] = replacement;
                            movementLog.push(`${team.name} hired ${replacement.name} (${role})`);
                        }
                    }
                });
            } else {
                team.drivers = (team.drivers || []).filter(Boolean);
            }
        });

        repairActiveDriverRosters(career, movementLog);

        const playerTeam = allTeams.find(team => team.id === playerTeamId);
        if (playerTeam) {
            career.drivers = playerTeam.drivers;
            career.staff = playerTeam.staff;
        }
        career.contractMovementLog = movementLog;
        career.contractsLastProcessedSeason = career.season;
        return { career, movementLog };
    }

    function formatMoney(n) {
        if (!Number.isFinite(n)) return '$0';
        if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
        if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
        return `$${n}`;
    }

    return {
        withDriverContract,
        withStaffContract,
        ensureTeamContracts,
        ensureCareerContracts,
        annualPersonnelCost,
        renewDriver,
        renewStaff,
        releaseDriver,
        processSeasonEnd,
        getAvailableDrivers,
        getAvailableStaff,
        repairActiveDriverRosters,
        formatMoney
    };
})();
