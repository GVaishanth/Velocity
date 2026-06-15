/* ============================================
   VELOCITY — TEAMS DATA
   12 original fictional constructor teams
   inspired by motorsport but with no real IP
   ============================================ */

const TEAMS_DATA = [
    {
        id: 'novara',
        name: 'Novara Racing',
        shortName: 'NOV',
        color: '#FF3344',
        secondaryColor: '#1A1A1A',
        country: 'Italy',
        flag: '🇮🇹',
        founded: 1998,
        history: 'Founded in northern Italy, Novara is known for its passionate fanbase and bold racing style.',
        fanPopularity: 78,
        reputation: 82,
        baseCarStats: {
            aerodynamics: 72,
            powerUnit: 75,
            reliability: 70,
            tireManagement: 73,
            cooling: 71,
            mechanicalGrip: 74
        },
        livery: {
            primary: '#FF3344',
            secondary: '#1A1A1A',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'zenith',
        name: 'Zenith Motorsport',
        shortName: 'ZEN',
        color: '#00AAFF',
        secondaryColor: '#003366',
        country: 'United Kingdom',
        flag: '🇬🇧',
        founded: 1985,
        history: 'British engineering excellence, Zenith has dominated multiple eras with precision-built machines.',
        fanPopularity: 85,
        reputation: 90,
        baseCarStats: {
            aerodynamics: 80,
            powerUnit: 78,
            reliability: 82,
            tireManagement: 75,
            cooling: 76,
            mechanicalGrip: 79
        },
        livery: {
            primary: '#00AAFF',
            secondary: '#003366',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'veloce',
        name: 'Veloce Racing',
        shortName: 'VEL',
        color: '#FF0033',
        secondaryColor: '#000000',
        country: 'Italy',
        flag: '🇮🇹',
        founded: 1962,
        history: 'A legendary name in motorsport with the most championships in history. Pure racing heritage.',
        fanPopularity: 95,
        reputation: 92,
        baseCarStats: {
            aerodynamics: 78,
            powerUnit: 82,
            reliability: 74,
            tireManagement: 77,
            cooling: 75,
            mechanicalGrip: 80
        },
        livery: {
            primary: '#FF0033',
            secondary: '#000000',
            accent: '#FFD700'
        }
    },
    {
        id: 'asterion',
        name: 'Asterion Formula',
        shortName: 'AST',
        color: '#9933FF',
        secondaryColor: '#1A0033',
        country: 'France',
        flag: '🇫🇷',
        founded: 2010,
        history: 'A modern outfit with cutting-edge tech and aggressive development. Rising stars of the grid.',
        fanPopularity: 62,
        reputation: 70,
        baseCarStats: {
            aerodynamics: 76,
            powerUnit: 72,
            reliability: 68,
            tireManagement: 71,
            cooling: 73,
            mechanicalGrip: 75
        },
        livery: {
            primary: '#9933FF',
            secondary: '#1A0033',
            accent: '#00FFCC'
        }
    },
    {
        id: 'luminar',
        name: 'Luminar Racing',
        shortName: 'LUM',
        color: '#FFAA00',
        secondaryColor: '#2A1A00',
        country: 'Germany',
        flag: '🇩🇪',
        founded: 1972,
        history: 'German precision meets relentless innovation. Luminar has set lap records on every continent.',
        fanPopularity: 80,
        reputation: 88,
        baseCarStats: {
            aerodynamics: 77,
            powerUnit: 84,
            reliability: 85,
            tireManagement: 76,
            cooling: 78,
            mechanicalGrip: 75
        },
        livery: {
            primary: '#FFAA00',
            secondary: '#2A1A00',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'equinox',
        name: 'Equinox Racing',
        shortName: 'EQX',
        color: '#00FF88',
        secondaryColor: '#003322',
        country: 'Switzerland',
        flag: '🇨🇭',
        founded: 1995,
        history: 'A balanced team known for consistent points and reliable finishes. Tactical perfection.',
        fanPopularity: 58,
        reputation: 72,
        baseCarStats: {
            aerodynamics: 71,
            powerUnit: 73,
            reliability: 80,
            tireManagement: 78,
            cooling: 74,
            mechanicalGrip: 72
        },
        livery: {
            primary: '#00FF88',
            secondary: '#003322',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'invicta',
        name: 'Invicta Racing',
        shortName: 'INV',
        color: '#FF6600',
        secondaryColor: '#1A1A1A',
        country: 'Netherlands',
        flag: '🇳🇱',
        founded: 2005,
        history: 'Bold, aggressive, and unafraid to take risks. Invicta lives by the racing creed: no surrender.',
        fanPopularity: 70,
        reputation: 68,
        baseCarStats: {
            aerodynamics: 74,
            powerUnit: 76,
            reliability: 67,
            tireManagement: 70,
            cooling: 72,
            mechanicalGrip: 77
        },
        livery: {
            primary: '#FF6600',
            secondary: '#1A1A1A',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'paragon',
        name: 'Paragon Motorsport',
        shortName: 'PAR',
        color: '#888888',
        secondaryColor: '#000000',
        country: 'United States',
        flag: '🇺🇸',
        founded: 2018,
        history: 'A young American team backed by Silicon Valley money and Detroit muscle. Fast learners.',
        fanPopularity: 55,
        reputation: 60,
        baseCarStats: {
            aerodynamics: 68,
            powerUnit: 74,
            reliability: 65,
            tireManagement: 67,
            cooling: 70,
            mechanicalGrip: 69
        },
        livery: {
            primary: '#888888',
            secondary: '#000000',
            accent: '#FF0033'
        }
    },
    {
        id: 'crimson',
        name: 'Crimson Velocity',
        shortName: 'CRM',
        color: '#CC0022',
        secondaryColor: '#330000',
        country: 'Spain',
        flag: '🇪🇸',
        founded: 1988,
        history: 'A passionate Spanish outfit with a flair for dramatic comebacks and aggressive racing.',
        fanPopularity: 73,
        reputation: 75,
        baseCarStats: {
            aerodynamics: 73,
            powerUnit: 71,
            reliability: 72,
            tireManagement: 74,
            cooling: 70,
            mechanicalGrip: 73
        },
        livery: {
            primary: '#CC0022',
            secondary: '#330000',
            accent: '#FFDD00'
        }
    },
    {
        id: 'apex',
        name: 'Silver Apex',
        shortName: 'APX',
        color: '#CCCCCC',
        secondaryColor: '#1A1A1A',
        country: 'Austria',
        flag: '🇦🇹',
        founded: 2001,
        history: 'A perennial contender with deep pockets and a relentless drive for the top step.',
        fanPopularity: 77,
        reputation: 85,
        baseCarStats: {
            aerodynamics: 79,
            powerUnit: 80,
            reliability: 78,
            tireManagement: 76,
            cooling: 77,
            mechanicalGrip: 78
        },
        livery: {
            primary: '#CCCCCC',
            secondary: '#1A1A1A',
            accent: '#0080FF'
        }
    },
    {
        id: 'midnight',
        name: 'Midnight Racing',
        shortName: 'MID',
        color: '#1133AA',
        secondaryColor: '#000022',
        country: 'Japan',
        flag: '🇯🇵',
        founded: 1992,
        history: 'Japanese engineering brilliance meets dark-horse strategy. Famous for stunning night-race victories.',
        fanPopularity: 68,
        reputation: 78,
        baseCarStats: {
            aerodynamics: 75,
            powerUnit: 77,
            reliability: 81,
            tireManagement: 75,
            cooling: 76,
            mechanicalGrip: 74
        },
        livery: {
            primary: '#1133AA',
            secondary: '#000022',
            accent: '#FFFFFF'
        }
    },
    {
        id: 'aurora',
        name: 'Aurora GP',
        shortName: 'AUR',
        color: '#FF00AA',
        secondaryColor: '#220011',
        country: 'Brazil',
        flag: '🇧🇷',
        founded: 2015,
        history: 'A flamboyant Brazilian team with passion that matches their bright pink livery. Crowd favorites.',
        fanPopularity: 65,
        reputation: 64,
        baseCarStats: {
            aerodynamics: 70,
            powerUnit: 72,
            reliability: 69,
            tireManagement: 72,
            cooling: 71,
            mechanicalGrip: 73
        },
        livery: {
            primary: '#FF00AA',
            secondary: '#220011',
            accent: '#00FFCC'
        }
    }
];

/* --- HELPER FUNCTIONS --- */

/**
 * Get team by ID
 */
function getTeamById(id) {
    return TEAMS_DATA.find(t => t.id === id);
}

/**
 * Get all teams (sorted alphabetically)
 */
function getAllTeams() {
    return [...TEAMS_DATA].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get teams sorted by reputation
 */
function getTeamsByReputation() {
    return [...TEAMS_DATA].sort((a, b) => b.reputation - a.reputation);
}

/**
 * Get a random team
 */
function getRandomTeam() {
    return TEAMS_DATA[Math.floor(Math.random() * TEAMS_DATA.length)];
}

/**
 * Calculate average car stat for a team
 */
function getTeamOverall(team) {
    const stats = team.baseCarStats;
    const sum = stats.aerodynamics + stats.powerUnit + stats.reliability +
                stats.tireManagement + stats.cooling + stats.mechanicalGrip;
    return Math.round(sum / 6);
}