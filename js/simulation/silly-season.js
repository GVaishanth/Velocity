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

        // 2. Handle Retirements & New Rookies FIRST, so this season's rookies
        // are already in the pool when AI teams shop for replacements.
        // (Previously ran AFTER the shuffle, so created rookies could never
        // actually be signed and the feature was invisible.)
        handleRetirementsAndRookies(driverData);

        // 3. Perform AI Team Shuffling
        aiTeams.forEach(team => {
            // Chance to change drivers based on team performance vs expectations
            // We'll use a simplified logic: 25% chance per seat to change.
            // Track newly-signed ids DURING the map — otherwise both seats of the
            // same team can sign the same free agent in one pass (signedDriverIds
            // is only recomputed per team, after the map commits).
            const newlySignedThisTeam = [];
            team.drivers = team.drivers.map(driver => {
                const changeChance = 0.25;
                if (Math.random() < changeChance) {
                    const replacement = findNewDriverForTeam(team, allTeams, driverData, newlySignedThisTeam);
                    if (replacement) {
                        newlySignedThisTeam.push(replacement.id);
                        return replacement;
                    }
                }
                return driver;
            });
        });

        console.log('[SillySeason] Silly Season completed.');
        return allTeams;
    }

    /**
     * Find a suitable new driver for an AI team
     * @param {string[]} excludeIds - extra ids to treat as unavailable (e.g. drivers
     *                                signed earlier in the same team's seat shuffle)
     */
    function findNewDriverForTeam(team, allTeams, driverData, excludeIds = []) {
        const teamRep = team.reputation || 75;

        // Find drivers currently not signed to any team
        const signedDriverIds = [...excludeIds];
        allTeams.forEach(t => t.drivers.forEach(d => signedDriverIds.push(d.id)));

        const available = driverData.filter(d => d && d.id && !signedDriverIds.includes(d.id));
        if (available.length === 0) return null;
        
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
     * Create a new young driver (Rookie) to replace a retiree.
     * Returns a full driver object matching the DRIVERS_DATA shape.
     */
    const ROOKIE_FIRST_NAMES = ['Kai', 'Enzo', 'Theo', 'Rafael', 'Yuki', 'Mateo', 'Felix', 'Oscar', 'Liam', 'Noah', 'Arvid', 'Gabriel', 'Julian', 'Leon', 'Marco', 'Nikolai'];
    const ROOKIE_LAST_NAMES = ['Vettelbach', 'Costa', 'Lindqvist', 'Moretti', 'Nakamura', 'Alvarez', 'Bergström', 'Kowalski', 'Silva', 'Duval', 'Haugen', 'Ferrante', 'Novak', 'Reyes', 'Larsen', 'Petrov'];
    const ROOKIE_FLAGS = ['🏁', '🌍', '🏎️'];

    function createRookie(nationality) {
        const firstName = ROOKIE_FIRST_NAMES[Math.floor(Math.random() * ROOKIE_FIRST_NAMES.length)];
        const lastName = ROOKIE_LAST_NAMES[Math.floor(Math.random() * ROOKIE_LAST_NAMES.length)];
        // Rookies: high potential (rating skewed high), low experience, low cost
        const rating = 72 + Math.floor(Math.random() * 18); // 72–89
        const clampStat = v => Math.max(40, Math.min(99, Math.round(v)));
        return {
            id: 'rookie_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
            name: `${firstName.charAt(0)}. ${lastName}`,
            firstName: firstName,
            lastName: lastName,
            nationality: nationality || 'International',
            flag: ROOKIE_FLAGS[Math.floor(Math.random() * ROOKIE_FLAGS.length)],
            age: 18 + Math.floor(Math.random() * 5), // 18–22
            rating: rating,
            cost: 500000 + rating * 40000, // cheap rookie contract
            stats: {
                pace: clampStat(rating + (Math.random() * 8 - 2)),
                consistency: clampStat(rating - 8 + Math.random() * 10),
                tireManagement: clampStat(rating - 6 + Math.random() * 10),
                wetSkill: clampStat(rating - 4 + Math.random() * 12),
                racecraft: clampStat(rating - 7 + Math.random() * 10),
                experience: clampStat(35 + Math.random() * 20) // rookies lack experience
            },
            traits: Math.random() < 0.35 ? ['AGGRESSIVE'] : (Math.random() < 0.25 ? ['SMOOTH'] : []),
            bio: 'Explosive rookie fresh from the junior formulae. Raw pace, still learning race craft.'
        };
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
