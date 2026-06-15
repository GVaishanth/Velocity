/* ============================================
   VELOCITY — DRIVERS DATA
   42 original fictional drivers with stats,
   traits, and personalities
   ============================================ */

/* DRIVER TRAITS — special abilities that modify behavior */
const DRIVER_TRAITS = {
    QUALIFYING_SPECIALIST: {
        name: 'Qualifying Specialist',
        description: '+5 pace in qualifying sessions',
        icon: '⚡'
    },
    WET_MASTER: {
        name: 'Wet Master',
        description: '+10 wet skill in rain conditions',
        icon: '🌧️'
    },
    OVERTAKER: {
        name: 'Overtaker',
        description: '+15% overtake success rate',
        icon: '⚔️'
    },
    TIRE_WHISPERER: {
        name: 'Tire Whisperer',
        description: 'Reduces tire degradation by 20%',
        icon: '🛞'
    },
    IRON_WILL: {
        name: 'Iron Will',
        description: 'Lower mistake chance under pressure',
        icon: '🛡️'
    },
    FAST_STARTER: {
        name: 'Fast Starter',
        description: 'Gains positions on lap 1',
        icon: '🚀'
    },
    CONSISTENT: {
        name: 'Consistent',
        description: 'Smaller lap time variance',
        icon: '📏'
    },
    AGGRESSIVE: {
        name: 'Aggressive',
        description: '+10 pace, +5% mistake risk',
        icon: '🔥'
    },
    SMOOTH: {
        name: 'Smooth Operator',
        description: 'Better tire and fuel management',
        icon: '✨'
    },
    CLUTCH: {
        name: 'Clutch Performer',
        description: '+5 pace in final 10 laps',
        icon: '⏱️'
    },
    DEFENDER: {
        name: 'Defender',
        description: 'Harder to overtake',
        icon: '🚧'
    },
    VETERAN: {
        name: 'Veteran',
        description: 'Race intelligence bonus',
        icon: '🎖️'
    }
};

const DRIVERS_DATA = [
    // === ELITE TIER (Rating 88-95) ===
    {
        id: 'd001',
        name: 'L. Moreau',
        firstName: 'Lucas',
        lastName: 'Moreau',
        nationality: 'France',
        flag: '🇫🇷',
        age: 28,
        rating: 93,
        cost: 22500000,
        stats: {
            pace: 94,
            consistency: 90,
            tireManagement: 88,
            wetSkill: 92,
            racecraft: 91,
            experience: 85
        },
        traits: ['QUALIFYING_SPECIALIST', 'WET_MASTER'],
        bio: 'Former karting prodigy turned championship contender. Known for precision under pressure.'
    },
    {
        id: 'd002',
        name: 'N. Schmidt',
        firstName: 'Niklas',
        lastName: 'Schmidt',
        nationality: 'Germany',
        flag: '🇩🇪',
        age: 31,
        rating: 92,
        cost: 21000000,
        stats: {
            pace: 92,
            consistency: 93,
            tireManagement: 90,
            wetSkill: 85,
            racecraft: 90,
            experience: 92
        },
        traits: ['CONSISTENT', 'VETERAN'],
        bio: 'A textbook driver. Smooth, calculated, and devastatingly fast over a race distance.'
    },
    {
        id: 'd003',
        name: 'A. Koval',
        firstName: 'Alexei',
        lastName: 'Koval',
        nationality: 'Czech Republic',
        flag: '🇨🇿',
        age: 26,
        rating: 91,
        cost: 19500000,
        stats: {
            pace: 95,
            consistency: 84,
            tireManagement: 80,
            wetSkill: 88,
            racecraft: 92,
            experience: 78
        },
        traits: ['AGGRESSIVE', 'OVERTAKER'],
        bio: 'A fearless attacker. Always going for the gap, sometimes finding it.'
    },
    {
        id: 'd004',
        name: 'D. Alvarez',
        firstName: 'Diego',
        lastName: 'Alvarez',
        nationality: 'Spain',
        flag: '🇪🇸',
        age: 29,
        rating: 90,
        cost: 18000000,
        stats: {
            pace: 89,
            consistency: 91,
            tireManagement: 92,
            wetSkill: 87,
            racecraft: 89,
            experience: 88
        },
        traits: ['TIRE_WHISPERER', 'SMOOTH'],
        bio: 'A master strategist. Wins races by saving tires when others burn them.'
    },
    {
        id: 'd005',
        name: 'H. Tanaka',
        firstName: 'Hiroshi',
        lastName: 'Tanaka',
        nationality: 'Japan',
        flag: '🇯🇵',
        age: 30,
        rating: 90,
        cost: 18500000,
        stats: {
            pace: 91,
            consistency: 92,
            tireManagement: 87,
            wetSkill: 90,
            racecraft: 88,
            experience: 89
        },
        traits: ['WET_MASTER', 'CLUTCH'],
        bio: 'Calm in chaos. Tanaka thrives when the rain falls and the pressure rises.'
    },
    {
        id: 'd006',
        name: 'R. Brown',
        firstName: 'Ryan',
        lastName: 'Brown',
        nationality: 'United States',
        flag: '🇺🇸',
        age: 27,
        rating: 89,
        cost: 17000000,
        stats: {
            pace: 90,
            consistency: 86,
            tireManagement: 85,
            wetSkill: 84,
            racecraft: 92,
            experience: 82
        },
        traits: ['OVERTAKER', 'FAST_STARTER'],
        bio: 'A street-racing prodigy turned circuit master. Lethal at race starts.'
    },

    // === STRONG TIER (Rating 82-87) ===
    {
        id: 'd007',
        name: 'E. Hughes',
        firstName: 'Emma',
        lastName: 'Hughes',
        nationality: 'United Kingdom',
        flag: '🇬🇧',
        age: 25,
        rating: 87,
        cost: 14500000,
        stats: {
            pace: 88,
            consistency: 87,
            tireManagement: 86,
            wetSkill: 89,
            racecraft: 85,
            experience: 75
        },
        traits: ['CONSISTENT', 'IRON_WILL'],
        bio: 'A rising star with ice in her veins. The future of British motorsport.'
    },
    {
        id: 'd008',
        name: 'M. Rossi',
        firstName: 'Matteo',
        lastName: 'Rossi',
        nationality: 'Italy',
        flag: '🇮🇹',
        age: 32,
        rating: 86,
        cost: 13500000,
        stats: {
            pace: 86,
            consistency: 88,
            tireManagement: 89,
            wetSkill: 82,
            racecraft: 87,
            experience: 91
        },
        traits: ['SMOOTH', 'VETERAN'],
        bio: 'A grand prix veteran with the patience of a chess master.'
    },
    {
        id: 'd009',
        name: 'J. Martin',
        firstName: 'Jacques',
        lastName: 'Martin',
        nationality: 'France',
        flag: '🇫🇷',
        age: 28,
        rating: 85,
        cost: 12500000,
        stats: {
            pace: 87,
            consistency: 84,
            tireManagement: 83,
            wetSkill: 86,
            racecraft: 85,
            experience: 81
        },
        traits: ['QUALIFYING_SPECIALIST'],
        bio: 'A one-lap specialist. Give him a fresh tire and he disappears.'
    },
    {
        id: 'd010',
        name: 'T. Leclerc',
        firstName: 'Théo',
        lastName: 'Leclerc',
        nationality: 'Monaco',
        flag: '🇲🇨',
        age: 26,
        rating: 85,
        cost: 12000000,
        stats: {
            pace: 87,
            consistency: 83,
            tireManagement: 84,
            wetSkill: 85,
            racecraft: 86,
            experience: 80
        },
        traits: ['QUALIFYING_SPECIALIST', 'OVERTAKER'],
        bio: 'Born in the principality, raised on street circuits. A natural on tight tracks.'
    },
    {
        id: 'd011',
        name: 'S. Cooper',
        firstName: 'Sam',
        lastName: 'Cooper',
        nationality: 'Australia',
        flag: '🇦🇺',
        age: 30,
        rating: 84,
        cost: 11500000,
        stats: {
            pace: 84,
            consistency: 86,
            tireManagement: 85,
            wetSkill: 86,
            racecraft: 84,
            experience: 87
        },
        traits: ['DEFENDER', 'CONSISTENT'],
        bio: 'A reliable workhorse. Cooper will deliver points race after race.'
    },
    {
        id: 'd012',
        name: 'P. Rodrigues',
        firstName: 'Pedro',
        lastName: 'Rodrigues',
        nationality: 'Brazil',
        flag: '🇧🇷',
        age: 29,
        rating: 84,
        cost: 11000000,
        stats: {
            pace: 86,
            consistency: 81,
            tireManagement: 82,
            wetSkill: 88,
            racecraft: 87,
            experience: 83
        },
        traits: ['WET_MASTER', 'AGGRESSIVE'],
        bio: 'A South American firebrand with a samba soul and a racer\'s heart.'
    },
    {
        id: 'd013',
        name: 'K. Sorensen',
        firstName: 'Kristoffer',
        lastName: 'Sorensen',
        nationality: 'Denmark',
        flag: '🇩🇰',
        age: 27,
        rating: 83,
        cost: 10500000,
        stats: {
            pace: 84,
            consistency: 85,
            tireManagement: 84,
            wetSkill: 82,
            racecraft: 82,
            experience: 79
        },
        traits: ['SMOOTH'],
        bio: 'Quiet, methodical, and surprisingly quick. A Scandinavian secret weapon.'
    },
    {
        id: 'd014',
        name: 'I. Volkov',
        firstName: 'Ilya',
        lastName: 'Volkov',
        nationality: 'Estonia',
        flag: '🇪🇪',
        age: 24,
        rating: 83,
        cost: 10000000,
        stats: {
            pace: 87,
            consistency: 78,
            tireManagement: 79,
            wetSkill: 84,
            racecraft: 85,
            experience: 70
        },
        traits: ['AGGRESSIVE', 'FAST_STARTER'],
        bio: 'A talent so raw it cuts. Volkov could be champion or chaos.'
    },
    {
        id: 'd015',
        name: 'F. Müller',
        firstName: 'Felix',
        lastName: 'Müller',
        nationality: 'Switzerland',
        flag: '🇨🇭',
        age: 31,
        rating: 82,
        cost: 9500000,
        stats: {
            pace: 82,
            consistency: 87,
            tireManagement: 86,
            wetSkill: 81,
            racecraft: 83,
            experience: 88
        },
        traits: ['CONSISTENT', 'TIRE_WHISPERER'],
        bio: 'A precise technician. Never the fastest, never out of the points.'
    },

    // === MID-TIER (Rating 75-81) ===
    {
        id: 'd016',
        name: 'A. Oliveira',
        firstName: 'André',
        lastName: 'Oliveira',
        nationality: 'Portugal',
        flag: '🇵🇹',
        age: 28,
        rating: 81,
        cost: 8500000,
        stats: {
            pace: 81,
            consistency: 82,
            tireManagement: 80,
            wetSkill: 83,
            racecraft: 81,
            experience: 80
        },
        traits: ['SMOOTH'],
        bio: 'A reliable midfielder with podium potential on his best days.'
    },
    {
        id: 'd017',
        name: 'C. Park',
        firstName: 'Chan-woo',
        lastName: 'Park',
        nationality: 'South Korea',
        flag: '🇰🇷',
        age: 26,
        rating: 81,
        cost: 8000000,
        stats: {
            pace: 83,
            consistency: 79,
            tireManagement: 80,
            wetSkill: 82,
            racecraft: 82,
            experience: 76
        },
        traits: ['QUALIFYING_SPECIALIST'],
        bio: 'A flying lap specialist with growing race craft. One to watch.'
    },
    {
        id: 'd018',
        name: 'B. van der Berg',
        firstName: 'Bram',
        lastName: 'van der Berg',
        nationality: 'Netherlands',
        flag: '🇳🇱',
        age: 29,
        rating: 80,
        cost: 7500000,
        stats: {
            pace: 80,
            consistency: 81,
            tireManagement: 82,
            wetSkill: 84,
            racecraft: 79,
            experience: 82
        },
        traits: ['WET_MASTER'],
        bio: 'A wet-weather specialist who turns rainy races into highlight reels.'
    },
    {
        id: 'd019',
        name: 'M. O\'Brien',
        firstName: 'Michael',
        lastName: 'O\'Brien',
        nationality: 'Ireland',
        flag: '🇮🇪',
        age: 30,
        rating: 80,
        cost: 7000000,
        stats: {
            pace: 79,
            consistency: 82,
            tireManagement: 81,
            wetSkill: 83,
            racecraft: 81,
            experience: 84
        },
        traits: ['VETERAN', 'DEFENDER'],
        bio: 'The Irishman is famously hard to pass. Bumper to bumper, he holds his line.'
    },
    {
        id: 'd020',
        name: 'Y. Nakamura',
        firstName: 'Yuki',
        lastName: 'Nakamura',
        nationality: 'Japan',
        flag: '🇯🇵',
        age: 25,
        rating: 79,
        cost: 6500000,
        stats: {
            pace: 81,
            consistency: 78,
            tireManagement: 80,
            wetSkill: 79,
            racecraft: 80,
            experience: 73
        },
        traits: ['CONSISTENT'],
        bio: 'A young Japanese talent climbing the ranks with quiet determination.'
    },
    {
        id: 'd021',
        name: 'G. Salvatore',
        firstName: 'Gianluca',
        lastName: 'Salvatore',
        nationality: 'Italy',
        flag: '🇮🇹',
        age: 33,
        rating: 79,
        cost: 6500000,
        stats: {
            pace: 78,
            consistency: 81,
            tireManagement: 83,
            wetSkill: 78,
            racecraft: 82,
            experience: 90
        },
        traits: ['VETERAN', 'TIRE_WHISPERER'],
        bio: 'An old-school racer. Reads the race like a novel and finds the perfect plot twist.'
    },
    {
        id: 'd022',
        name: 'L. Anderson',
        firstName: 'Liam',
        lastName: 'Anderson',
        nationality: 'Canada',
        flag: '🇨🇦',
        age: 28,
        rating: 78,
        cost: 6000000,
        stats: {
            pace: 79,
            consistency: 78,
            tireManagement: 79,
            wetSkill: 80,
            racecraft: 78,
            experience: 78
        },
        traits: ['CONSISTENT'],
        bio: 'A solid points-scorer who rarely makes mistakes and rarely makes headlines.'
    },
    {
        id: 'd023',
        name: 'O. Werner',
        firstName: 'Oskar',
        lastName: 'Werner',
        nationality: 'Austria',
        flag: '🇦🇹',
        age: 27,
        rating: 78,
        cost: 5800000,
        stats: {
            pace: 80,
            consistency: 76,
            tireManagement: 77,
            wetSkill: 78,
            racecraft: 79,
            experience: 76
        },
        traits: ['AGGRESSIVE'],
        bio: 'An attack-minded racer who pushes the limits — sometimes past them.'
    },
    {
        id: 'd024',
        name: 'D. Petrov',
        firstName: 'Dmitri',
        lastName: 'Petrov',
        nationality: 'Bulgaria',
        flag: '🇧🇬',
        age: 26,
        rating: 77,
        cost: 5500000,
        stats: {
            pace: 78,
            consistency: 77,
            tireManagement: 76,
            wetSkill: 79,
            racecraft: 78,
            experience: 75
        },
        traits: ['OVERTAKER'],
        bio: 'A relentless overtaker known for late-braking heroics.'
    },
    {
        id: 'd025',
        name: 'A. Petersen',
        firstName: 'Anders',
        lastName: 'Petersen',
        nationality: 'Norway',
        flag: '🇳🇴',
        age: 29,
        rating: 77,
        cost: 5300000,
        stats: {
            pace: 76,
            consistency: 80,
            tireManagement: 79,
            wetSkill: 81,
            racecraft: 76,
            experience: 79
        },
        traits: ['SMOOTH', 'WET_MASTER'],
        bio: 'Northern lights guide his racing. Smooth, calm, deceptively quick.'
    },

    // === LOWER MID-TIER (Rating 70-76) ===
    {
        id: 'd026',
        name: 'R. Singh',
        firstName: 'Ravi',
        lastName: 'Singh',
        nationality: 'India',
        flag: '🇮🇳',
        age: 24,
        rating: 76,
        cost: 5000000,
        stats: {
            pace: 78,
            consistency: 74,
            tireManagement: 75,
            wetSkill: 76,
            racecraft: 77,
            experience: 70
        },
        traits: ['FAST_STARTER'],
        bio: 'India\'s rising star. Explosive starts, growing race craft.'
    },
    {
        id: 'd027',
        name: 'V. Petrescu',
        firstName: 'Valentin',
        lastName: 'Petrescu',
        nationality: 'Romania',
        flag: '🇷🇴',
        age: 28,
        rating: 76,
        cost: 4800000,
        stats: {
            pace: 76,
            consistency: 77,
            tireManagement: 76,
            wetSkill: 75,
            racecraft: 76,
            experience: 77
        },
        traits: ['CONSISTENT'],
        bio: 'A workmanlike racer who delivers exactly what his team expects.'
    },
    {
        id: 'd028',
        name: 'J. Williams',
        firstName: 'Jordan',
        lastName: 'Williams',
        nationality: 'United Kingdom',
        flag: '🇬🇧',
        age: 25,
        rating: 75,
        cost: 4500000,
        stats: {
            pace: 76,
            consistency: 75,
            tireManagement: 73,
            wetSkill: 77,
            racecraft: 76,
            experience: 72
        },
        traits: ['OVERTAKER'],
        bio: 'A British prospect with raw pace and a knack for late-race charges.'
    },
    {
        id: 'd029',
        name: 'F. Costa',
        firstName: 'Fernando',
        lastName: 'Costa',
        nationality: 'Argentina',
        flag: '🇦🇷',
        age: 30,
        rating: 75,
        cost: 4300000,
        stats: {
            pace: 74,
            consistency: 78,
            tireManagement: 76,
            wetSkill: 75,
            racecraft: 76,
            experience: 81
        },
        traits: ['VETERAN'],
        bio: 'An Argentinian who races with passion and patience in equal measure.'
    },
    {
        id: 'd030',
        name: 'K. Larsson',
        firstName: 'Karl',
        lastName: 'Larsson',
        nationality: 'Sweden',
        flag: '🇸🇪',
        age: 27,
        rating: 74,
        cost: 4000000,
        stats: {
            pace: 75,
            consistency: 75,
            tireManagement: 74,
            wetSkill: 76,
            racecraft: 73,
            experience: 74
        },
        traits: ['SMOOTH'],
        bio: 'A Swedish steady hand. Never spectacular, always present.'
    },
    {
        id: 'd031',
        name: 'M. Diallo',
        firstName: 'Moussa',
        lastName: 'Diallo',
        nationality: 'Senegal',
        flag: '🇸🇳',
        age: 26,
        rating: 74,
        cost: 3800000,
        stats: {
            pace: 77,
            consistency: 72,
            tireManagement: 73,
            wetSkill: 74,
            racecraft: 75,
            experience: 71
        },
        traits: ['AGGRESSIVE'],
        bio: 'Africa\'s breakout racer. Bold, fast, and hungry for more.'
    },
    {
        id: 'd032',
        name: 'T. Holm',
        firstName: 'Tobias',
        lastName: 'Holm',
        nationality: 'Finland',
        flag: '🇫🇮',
        age: 29,
        rating: 73,
        cost: 3600000,
        stats: {
            pace: 73,
            consistency: 76,
            tireManagement: 74,
            wetSkill: 77,
            racecraft: 73,
            experience: 76
        },
        traits: ['WET_MASTER'],
        bio: 'A Finn who feels at home in the wet. Loves the chaos of rain.'
    },
    {
        id: 'd033',
        name: 'C. Mendez',
        firstName: 'Carlos',
        lastName: 'Mendez',
        nationality: 'Mexico',
        flag: '🇲🇽',
        age: 31,
        rating: 73,
        cost: 3500000,
        stats: {
            pace: 72,
            consistency: 75,
            tireManagement: 76,
            wetSkill: 73,
            racecraft: 75,
            experience: 82
        },
        traits: ['VETERAN', 'TIRE_WHISPERER'],
        bio: 'A Mexican veteran who treats tires like gold and points like trophies.'
    },
    {
        id: 'd034',
        name: 'W. Chen',
        firstName: 'Wei',
        lastName: 'Chen',
        nationality: 'China',
        flag: '🇨🇳',
        age: 25,
        rating: 72,
        cost: 3300000,
        stats: {
            pace: 73,
            consistency: 72,
            tireManagement: 74,
            wetSkill: 71,
            racecraft: 72,
            experience: 70
        },
        traits: ['CONSISTENT'],
        bio: 'A promising Chinese racer with a methodical, studious approach.'
    },
    {
        id: 'd035',
        name: 'H. Krause',
        firstName: 'Hannes',
        lastName: 'Krause',
        nationality: 'Germany',
        flag: '🇩🇪',
        age: 27,
        rating: 72,
        cost: 3200000,
        stats: {
            pace: 72,
            consistency: 73,
            tireManagement: 73,
            wetSkill: 71,
            racecraft: 72,
            experience: 73
        },
        traits: ['DEFENDER'],
        bio: 'A defensive specialist. Hard to catch, harder to pass.'
    },

    // === ROOKIE/BUDGET TIER (Rating 65-71) ===
    {
        id: 'd036',
        name: 'E. Novak',
        firstName: 'Erik',
        lastName: 'Novak',
        nationality: 'Slovenia',
        flag: '🇸🇮',
        age: 22,
        rating: 71,
        cost: 3000000,
        stats: {
            pace: 74,
            consistency: 68,
            tireManagement: 70,
            wetSkill: 72,
            racecraft: 71,
            experience: 60
        },
        traits: ['QUALIFYING_SPECIALIST'],
        bio: 'Young and fearless. Novak has the raw pace to surprise on Saturdays.'
    },
    {
        id: 'd037',
        name: 'B. Adebayo',
        firstName: 'Babatunde',
        lastName: 'Adebayo',
        nationality: 'Nigeria',
        flag: '🇳🇬',
        age: 23,
        rating: 70,
        cost: 2800000,
        stats: {
            pace: 72,
            consistency: 68,
            tireManagement: 69,
            wetSkill: 71,
            racecraft: 72,
            experience: 62
        },
        traits: ['FAST_STARTER'],
        bio: 'Africa\'s next big thing. Adebayo races with infectious energy.'
    },
    {
        id: 'd038',
        name: 'P. Karpov',
        firstName: 'Pavel',
        lastName: 'Karpov',
        nationality: 'Belarus',
        flag: '🇧🇾',
        age: 24,
        rating: 69,
        cost: 2500000,
        stats: {
            pace: 70,
            consistency: 70,
            tireManagement: 70,
            wetSkill: 69,
            racecraft: 68,
            experience: 65
        },
        traits: ['CONSISTENT'],
        bio: 'A steady young driver still finding his ceiling in top-tier racing.'
    },
    {
        id: 'd039',
        name: 'S. Fitzgerald',
        firstName: 'Sean',
        lastName: 'Fitzgerald',
        nationality: 'Ireland',
        flag: '🇮🇪',
        age: 21,
        rating: 68,
        cost: 2300000,
        stats: {
            pace: 71,
            consistency: 66,
            tireManagement: 67,
            wetSkill: 73,
            racecraft: 70,
            experience: 58
        },
        traits: ['WET_MASTER'],
        bio: 'A rookie with rain in his blood and ambition in his heart.'
    },
    {
        id: 'd040',
        name: 'A. Voss',
        firstName: 'Anika',
        lastName: 'Voss',
        nationality: 'Germany',
        flag: '🇩🇪',
        age: 22,
        rating: 68,
        cost: 2200000,
        stats: {
            pace: 70,
            consistency: 69,
            tireManagement: 68,
            wetSkill: 67,
            racecraft: 70,
            experience: 60
        },
        traits: ['QUALIFYING_SPECIALIST'],
        bio: 'A young engineer-turned-racer with a technical mind and rising talent.'
    },
    {
        id: 'd041',
        name: 'R. Akinyemi',
        firstName: 'Rotimi',
        lastName: 'Akinyemi',
        nationality: 'Nigeria',
        flag: '🇳🇬',
        age: 23,
        rating: 67,
        cost: 2000000,
        stats: {
            pace: 69,
            consistency: 66,
            tireManagement: 67,
            wetSkill: 68,
            racecraft: 69,
            experience: 60
        },
        traits: ['OVERTAKER'],
        bio: 'A rookie who races like he has nothing to lose. Often, he doesn\'t.'
    },
    {
        id: 'd042',
        name: 'T. Bauer',
        firstName: 'Tim',
        lastName: 'Bauer',
        nationality: 'Liechtenstein',
        flag: '🇱🇮',
        age: 20,
        rating: 65,
        cost: 1800000,
        stats: {
            pace: 67,
            consistency: 65,
            tireManagement: 65,
            wetSkill: 66,
            racecraft: 65,
            experience: 55
        },
        traits: ['CONSISTENT'],
        bio: 'The grid\'s youngest driver. Raw talent waiting to be shaped.'
    }
];

/* --- HELPER FUNCTIONS --- */

/**
 * Get driver by ID
 */
function getDriverById(id) {
    return DRIVERS_DATA.find(d => d.id === id);
}

/**
 * Get all drivers (alphabetically sorted)
 */
function getAllDrivers() {
    return [...DRIVERS_DATA].sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/**
 * Get drivers filtered by rating range
 */
function getDriversByRatingRange(min, max) {
    return DRIVERS_DATA.filter(d => d.rating >= min && d.rating <= max);
}

/**
 * Get drivers by cost range
 */
function getDriversByCostRange(min, max) {
    return DRIVERS_DATA.filter(d => d.cost >= min && d.cost <= max);
}

/**
 * Get drivers by nationality
 */
function getDriversByNationality(nationality) {
    return DRIVERS_DATA.filter(d => d.nationality === nationality);
}

/**
 * Get drivers with a specific trait
 */
function getDriversByTrait(trait) {
    return DRIVERS_DATA.filter(d => d.traits.includes(trait));
}

/**
 * Calculate overall driver rating (weighted)
 */
function calculateDriverOverall(driver) {
    const s = driver.stats;
    return Math.round(
        (s.pace * 0.30) +
        (s.consistency * 0.20) +
        (s.tireManagement * 0.15) +
        (s.wetSkill * 0.10) +
        (s.racecraft * 0.15) +
        (s.experience * 0.10)
    );
}

/**
 * Get tier label for driver
 */
function getDriverTier(driver) {
    if (driver.rating >= 88) return 'ELITE';
    if (driver.rating >= 82) return 'STRONG';
    if (driver.rating >= 75) return 'MID';
    if (driver.rating >= 70) return 'LOWER';
    return 'ROOKIE';
}

/**
 * Get random subset of drivers (for AI teams)
 */
function getRandomDrivers(count, excludeIds = []) {
    const available = DRIVERS_DATA.filter(d => !excludeIds.includes(d.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

/**
 * Format driver name for display
 */
function formatDriverName(driver, format = 'short') {
    if (format === 'full') return `${driver.firstName} ${driver.lastName}`;
    if (format === 'last') return driver.lastName;
    return driver.name; // "L. Moreau"
}