/* ============================================
   VELOCITY — SILLY SEASON (DRIVER MARKET EVOLUTION)
   Handles driver transfers, retirements, and rookies
   at the end of each championship season.
   ============================================ */

const SillySeason = (() => {

    /**
     * Run the Silly Season logic to reshuffle the grid
     * @param {Object} career - The current career state
     */
    function processSeasonEnd(career) {
        if (!career || !career.allTeams) return;

        console.log('[SillySeason] Starting end-of-season driver market reshuffle...');

        const allTeams = career.allTeams;
        const driverData = [...DRIVERS_DATA];
        
        // --- RIVALRY UPDATE ---
        updateRivalries(allTeams);

        // 1. Identify "Free Agents" (Drivers not in the player team)
        let aiTeams = allTeams.filter(t => !t.isLocalPlayer);
        let playerTeam = allTeams.find(t => t.isLocalPlayer);

        // 2. Perform AI Team Shuffling
        aiTeams.forEach(team => {
            // Chance to change drivers based on team performance vs expectations
            // We'll use a simplified logic: 25% chance per seat to change
            team.drivers = team.drivers.map(driver => {
                const changeChance = 0.25;
                if (Math.random() < changeChance) {
                    return findNewDriverForTeam(team, allTeams, driverData);
                }
                return driver;
            });
        });

        // 3. Handle Retirements & New Rookies
        handleRetirementsAndRookies(driverData);

        console.log('[SillySeason] Silly Season completed.');
        return allTeams;
    }

    /**
     * Find a suitable new driver for an AI team
     */
    function findNewDriverForTeam(team, allTeams, driverData) {
        const teamRep = team.reputation || 75;
        
        // Find drivers currently not signed to any team
        const signedDriverIds = [];
        allTeams.forEach(t => t.drivers.forEach(d => signedDriverIds.push(d.id)));

        const available = driverData.filter(d => !signedDriverIds.includes(d.id));
        
        // Filter by "Prestige" - top teams want top drivers
        let suitable = available.filter(d => {
            const ratingDiff = Math.abs(d.rating - teamRep);
            return ratingDiff < 15; // Within 15 points of team reputation
        });

        if (suitable.length === 0) suitable = available; // Fallback

        // Pick one randomly from suitable
        const newDriver = suitable[Math.floor(Math.random() * suitable.length)];
        console.log(`[SillySeason] ${team.name} signed ${newDriver.name} (Rating: ${newDriver.rating})`);
        return newDriver;
    }

    /**
     * Randomly retire old drivers and introduce new ones
     */
    function handleRetirementsAndRookies(driverData) {
        for (let i = 0; i < driverData.length; i++) {
            const d = driverData[i];
            
            // Retirement check for older drivers
            if (d.age > 35) {
                const retireChance = (d.age - 34) * 0.15;
                if (Math.random() < retireChance) {
                    console.log(`[SillySeason] Driver RETIRED: ${d.name} (Age: ${d.age})`);
                    // Create a "Rookie" replacement in the data pool
                    driverData[i] = createRookie(d.nationality);
                }
            }
        }
    }

    /**
     * Create a new young driver (Rookie)
     */
    function createRookie(nationality) {
        // ... (existing rookie creation)
    }

    /**
     * Update/Establish driver rivalries based on championship proximity
     */
    function updateRivalries(allTeams) {
        const allDrivers = [];
        allTeams.forEach(t => t.drivers.forEach(d => allDrivers.push(d)));

        // Sort by some prestige/rating for now as a proxy for championship battle
        const sorted = [...allDrivers].sort((a, b) => b.rating - a.rating);

        for (let i = 0; i < sorted.length - 1; i += 2) {
            const d1 = sorted[i];
            const d2 = sorted[i + 1];
            if (d1 && d2) {
                d1.rivalId = d2.id;
                d1.rivalName = d2.name;
                d2.rivalId = d1.id;
                d2.rivalName = d1.name;
            }
        }
    }

    return {
        processSeasonEnd
    };
})();
