/* ============================================
   VELOCITY — STATE MANAGER
   Central game state with reactive updates
   ============================================ */

const StateManager = (() => {
    // The master game state object
    let state = {
        // Current mode
        mode: 'MENU', // MENU | CAREER_SETUP | CAREER | RACE_WEEKEND | QUALIFYING | LIVE_RACE | RESULTS

        // Current screen
        currentScreen: 'home',

        // Player profile (persists across games)
        profile: {
            username: 'RACER_01',
            level: 1,
            xp: 0,
            totalRaces: 0,
            totalWins: 0,
            totalPodiums: 0,
            totalPoles: 0,
            totalFastestLaps: 0,
            totalChampionships: 0,
            achievements: [],
            createdAt: Date.now()
        },

        // Active career/season data
        career: null,
        // Structure when active:
        // {
        //   team: {...},
        //   drivers: [{...}, {...}],
        //   staff: { techDirector, strategist, pitCrew },
        //   budget: 100000000,
        //   season: 1,
        //   currentRound: 0,
        //   totalRounds: 10,
        //   schedule: [...trackIds],
        //   carStats: { aero, power, reliability, tireMgmt, cooling, grip },
        //   rdPoints: 1250,
        //   upgradeQueue: [],
        //   philosophy: 'BALANCED',
        //   fanPopularity: 50,
        //   sponsors: [],
        //   championship: { driverStandings: [], constructorStandings: [] },
        //   allTeams: [...],
        //   raceHistory: []
        // }

        // Live race state
        race: null,
        // Structure when active:
        // {
        //   track: {...},
        //   cars: [...],
        //   currentLap: 0,
        //   totalLaps: 57,
        //   weather: 'DRY',
        //   status: 'GREEN',
        //   speed: 2,
        //   paused: false,
        //   events: [],
        //   startTime: Date.now()
        // }

        // Settings
        settings: {
            musicOn: false,
            soundOn: true,
            raceSpeed: 2, // seconds per lap at 1x
            difficulty: 'COMPETITIVE', // CASUAL | COMPETITIVE | ELITE
            seasonLength: 10 // races per season
        }
    };

    /**
     * Get the full state (read-only copy)
     */
    function getState() {
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Get a specific state path
     * @param {string} path - Dot-notation path (e.g., 'career.budget')
     */
    function get(path) {
        const keys = path.split('.');
        let current = state;
        for (const key of keys) {
            if (current === null || current === undefined) return undefined;
            current = current[key];
        }
        // Return deep copy for objects/arrays
        if (typeof current === 'object' && current !== null) {
            return JSON.parse(JSON.stringify(current));
        }
        return current;
    }

    /**
     * Set a specific state path
     * @param {string} path
     * @param {*} value
     */
    function set(path, value) {
        const keys = path.split('.');
        let current = state;
        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        const oldValue = current[keys[keys.length - 1]];
        current[keys[keys.length - 1]] = value;

        // Emit state change event
        EventBus.emit('state:changed', { path, value, oldValue });
        EventBus.emit(`state:${path}`, { value, oldValue });
    }

    /**
     * Update a nested object (merge)
     * @param {string} path
     * @param {Object} updates
     */
    function update(path, updates) {
        const current = get(path);
        if (typeof current === 'object' && current !== null) {
            set(path, { ...current, ...updates });
        } else {
            set(path, updates);
        }
    }

    /**
     * Initialize a new career
     */
    function initCareer(teamData, drivers, staff, settings, mpOptions = null) {
        const allTeams = generateAllTeams(teamData, drivers, mpOptions);

        const career = {
            team: teamData,
            drivers: drivers,
            staff: staff,
            budget: 100000000 - calculateTotalCost(drivers, staff),
            season: 1,
            currentRound: 0,
            totalRounds: settings.seasonLength || 10,
            schedule: (mpOptions && mpOptions.masterSchedule) ? mpOptions.masterSchedule : generateSchedule(settings.seasonLength || 10),
            carStats: { ...teamData.baseCarStats },
            rdPoints: 1250,
            upgradeQueue: [],
            philosophy: 'BALANCED',
            fanPopularity: teamData.fanPopularity || 50,
            sponsors: generateStartingSponsors(teamData),
            championship: {
                driverStandings: [],
                constructorStandings: []
            },
            allTeams: allTeams,
            raceHistory: []
        };

        // Apply staff bonuses to car stats
        if (staff.techDirector && staff.techDirector.bonus) {
            Object.entries(staff.techDirector.bonus).forEach(([stat, val]) => {
                if (career.carStats[stat] !== undefined) {
                    career.carStats[stat] = Math.min(100, career.carStats[stat] + val);
                }
            });
        }

        // Initialize championship standings
        career.championship = initChampionshipStandings(allTeams);

        set('career', career);
        set('mode', 'CAREER');

        EventBus.emit('game:career_started', career);
    }

    /**
     * Generate all AI teams for the season
     */
    function generateAllTeams(playerTeam, playerDrivers, mpOptions = null) {
        const allTeams = [];
        const usedDriverIds = playerDrivers.map(d => d.id);

        if (mpOptions && mpOptions.onlinePlayers) {
            mpOptions.onlinePlayers.forEach(op => {
                op.drivers?.forEach(d => {
                    if (!usedDriverIds.includes(d.id)) usedDriverIds.push(d.id);
                });
            });
        } else if (mpOptions && mpOptions.remoteDrivers) {
            mpOptions.remoteDrivers.forEach(d => usedDriverIds.push(d.id));
        }

        TEAMS_DATA.forEach(team => {
            const onlinePlayer = mpOptions?.onlinePlayers?.find(op => op.team?.id === team.id);

            if (team.id === playerTeam.id) {
                // Local Player's team
                allTeams.push({
                    ...team,
                    isPlayer: true,
                    isLocalPlayer: true,
                    onlineUsername: onlinePlayer ? onlinePlayer.username : 'You',
                    drivers: playerDrivers,
                    carStats: { ...team.baseCarStats }
                });
            } else if (onlinePlayer) {
                // Remote Connected Player's team
                allTeams.push({
                    ...team,
                    isPlayer: true,
                    isRemotePlayer: true,
                    remoteUsername: onlinePlayer.username,
                    onlineUsername: onlinePlayer.username,
                    drivers: onlinePlayer.drivers,
                    carStats: { ...team.baseCarStats }
                });
            } else if (mpOptions && team.id === mpOptions.remoteTeam?.id) {
                // Legacy 1v1 Remote Player's team
                allTeams.push({
                    ...team,
                    isPlayer: true,
                    isRemotePlayer: true,
                    remoteUsername: mpOptions.remoteUsername,
                    drivers: mpOptions.remoteDrivers,
                    carStats: { ...team.baseCarStats }
                });
            } else {
                // AI team — assign 2 drivers
                const availableDrivers = DRIVERS_DATA.filter(
                    d => !usedDriverIds.includes(d.id)
                );
                const aiDrivers = [];
                for (let i = 0; i < 2 && availableDrivers.length > 0; i++) {
                    const idx = Math.floor(Math.random() * availableDrivers.length);
                    const driver = availableDrivers.splice(idx, 1)[0];
                    aiDrivers.push(driver);
                    usedDriverIds.push(driver.id);
                }

                allTeams.push({
                    ...team,
                    isPlayer: false,
                    drivers: aiDrivers,
                    carStats: { ...team.baseCarStats }
                });
            }
        });

        return allTeams;
    }

    /**
     * Generate a race calendar (random tracks)
     */
    function generateSchedule(numRaces) {
        const shuffled = [...TRACKS_DATA].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numRaces).map(t => t.id);
    }

    /**
     * Calculate total hiring costs
     */
    function calculateTotalCost(drivers, staff) {
        let total = 0;
        drivers.forEach(d => total += (d.cost || 0));
        Object.values(staff).forEach(s => {
            if (s) total += (s.cost || 0);
        });
        return total;
    }

    /**
     * Generate starting sponsors
     */
    function generateStartingSponsors(team) {
        return [
            {
                name: 'Apex Energy',
                basePayment: 500000,
                bonusPayment: 200000,
                objective: { type: 'TOP_10', target: 10, met: false },
                duration: 3
            },
            {
                name: 'TitanTech',
                basePayment: 300000,
                bonusPayment: 150000,
                objective: { type: 'POINTS', target: 1, met: false },
                duration: 2
            }
        ];
    }

    /**
     * Initialize championship standings for all teams
     */
    function initChampionshipStandings(allTeams) {
        const driverStandings = [];
        const constructorStandings = [];

        allTeams.forEach(team => {
            constructorStandings.push({
                teamId: team.id,
                teamName: team.name,
                teamColor: team.color,
                points: 0,
                wins: 0,
                podiums: 0
            });

            team.drivers.forEach(driver => {
                driverStandings.push({
                    driverId: driver.id,
                    driverName: driver.name,
                    nationality: driver.nationality,
                    teamId: team.id,
                    teamName: team.name,
                    teamColor: team.color,
                    points: 0,
                    wins: 0,
                    podiums: 0,
                    bestFinish: 99
                });
            });
        });

        return { driverStandings, constructorStandings };
    }

    /**
     * Load game from save
     */
    function loadFromSave() {
        const savedState = SaveSystem.loadGameState();
        if (savedState) {
            state = { ...state, ...savedState };
            EventBus.emit('state:loaded', state);
            return true;
        }
        return false;
    }

    /**
     * Save current game
     */
    function saveGame() {
        const saveData = {
            mode: state.mode,
            profile: state.profile,
            career: state.career,
            settings: state.settings
        };
        const success = SaveSystem.saveGameState(saveData);
        if (success) {
            EventBus.emit('ui:notify', {
                message: 'Game saved',
                type: 'success'
            });
        }
        return success;
    }

    /**
     * Load profile from storage
     */
    function loadProfile() {
        const saved = SaveSystem.loadProfile();
        if (saved) {
            state.profile = { ...state.profile, ...saved };
        }
        return state.profile;
    }

    /**
     * Save profile to storage
     */
    function saveProfile() {
        SaveSystem.saveProfile(state.profile);
    }

    /**
     * Reset all state
     */
    function reset() {
        state.mode = 'MENU';
        state.career = null;
        state.race = null;
        EventBus.emit('state:reset');
    }

    /**
     * Randomize teams and drivers, adjusting their standards based on age/exp,
     * ensuring overall standard is strictly clamped between 65 and 95.
     */
    function randomizeGameData() {
        if (typeof TEAMS_DATA === 'undefined' || typeof DRIVERS_DATA === 'undefined') return;

        // 1. Shuffle Teams
        TEAMS_DATA.sort(() => Math.random() - 0.5);

        // 2. Adjust Teams (clamp to 65-95)
        TEAMS_DATA.forEach(t => {
            let baseRep = t.reputation || t.fanPopularity || 75;
            let shift = Math.floor(Math.random() * 11) - 5; // -5 to +5
            let newRep = Math.max(65, Math.min(95, baseRep + shift));
            t.reputation = newRep;
            t.fanPopularity = Math.max(65, Math.min(95, (t.fanPopularity || 75) + (Math.floor(Math.random() * 7) - 3)));

            if (t.baseCarStats) {
                Object.keys(t.baseCarStats).forEach(key => {
                    let val = t.baseCarStats[key] || 70;
                    val = newRep + (Math.floor(Math.random() * 7) - 3);
                    t.baseCarStats[key] = Math.max(65, Math.min(95, val));
                });
            }
        });

        // 3. Shuffle Drivers
        DRIVERS_DATA.sort(() => Math.random() - 0.5);

        // 4. Adjust Drivers based on age and exp (clamp to 65-95)
        DRIVERS_DATA.forEach(d => {
            let baseRating = d.rating || 75;

            // Age impact: young (<24) grow, old (>33) decline, prime shift
            let ageShift = 0;
            if (d.age < 24) ageShift = Math.floor(Math.random() * 5) + 1; // +1 to +5
            else if (d.age > 33) ageShift = -(Math.floor(Math.random() * 4) + 1); // -1 to -4
            else ageShift = Math.floor(Math.random() * 5) - 2; // -2 to +2

            // Experience impact
            let expShift = 0;
            if (d.stats?.experience > 80) expShift = Math.floor(Math.random() * 3) + 1; // +1 to +3
            else if (d.stats?.experience < 50) expShift = -(Math.floor(Math.random() * 3) + 1); // -1 to -3

            let newRating = baseRating + ageShift + expShift;
            newRating = Math.max(65, Math.min(95, newRating));

            if (d.stats) {
                const diff = newRating - baseRating;
                ['pace', 'consistency', 'tireManagement', 'wetSkill', 'racecraft'].forEach(statKey => {
                    let val = d.stats[statKey] || 70;
                    val += diff + (Math.floor(Math.random() * 5) - 2);
                    d.stats[statKey] = Math.max(60, Math.min(98, val));
                });
            }

            d.rating = newRating;
            d.cost = Math.round(5000000 + Math.pow((newRating - 60) / 35, 2) * 20000000);
        });
    }

    return {
        getState,
        get,
        set,
        update,
        initCareer,
        loadFromSave,
        saveGame,
        loadProfile,
        saveProfile,
        randomizeGameData,
        reset
    };
})();