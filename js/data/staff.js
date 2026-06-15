/* ============================================
   VELOCITY — STAFF DATA
   Technical Directors, Chief Strategists, Pit Crews
   Each staff member modifies team performance
   ============================================ */

/* STAFF TRAITS — special bonuses */
const STAFF_TRAITS = {
    AERO_GENIUS: {
        name: 'Aero Genius',
        description: 'Extra aerodynamics development efficiency',
        icon: '🛩️'
    },
    ENGINE_WIZARD: {
        name: 'Engine Wizard',
        description: 'Boosts power unit performance',
        icon: '⚙️'
    },
    RELIABILITY_GURU: {
        name: 'Reliability Guru',
        description: 'Reduces mechanical failures',
        icon: '🔧'
    },
    WEATHER_READER: {
        name: 'Weather Reader',
        description: 'Better strategy calls in changing conditions',
        icon: '🌦️'
    },
    UNDERCUT_MASTER: {
        name: 'Undercut Master',
        description: 'Perfect pit timing for undercuts',
        icon: '⏱️'
    },
    TIRE_STRATEGIST: {
        name: 'Tire Strategist',
        description: 'Optimal compound selection',
        icon: '🛞'
    },
    SUB_TWO_SECOND: {
        name: 'Sub-2 Second Crew',
        description: 'Lightning-fast pit stops',
        icon: '⚡'
    },
    CONSISTENT_CREW: {
        name: 'Consistent Crew',
        description: 'No botched pit stops',
        icon: '✅'
    },
    DOUBLE_STACK: {
        name: 'Double Stack Pros',
        description: 'Fast double pit stops',
        icon: '🔄'
    },
    DATA_DRIVEN: {
        name: 'Data Driven',
        description: 'Strategy decisions backed by analytics',
        icon: '📊'
    },
    VETERAN_LEADER: {
        name: 'Veteran Leader',
        description: 'Years of championship experience',
        icon: '🏆'
    },
    INNOVATIVE: {
        name: 'Innovative',
        description: 'Pushes development boundaries',
        icon: '💡'
    }
};

const STAFF_DATA = {
    // === TECHNICAL DIRECTORS ===
    technicalDirectors: [
        {
            id: 'td001',
            name: 'Dr. K. Bauer',
            firstName: 'Klaus',
            lastName: 'Bauer',
            nationality: 'Germany',
            flag: '🇩🇪',
            age: 54,
            rating: 92,
            cost: 9500000,
            bonus: {
                aerodynamics: 4,
                reliability: 3
            },
            traits: ['AERO_GENIUS', 'VETERAN_LEADER'],
            bio: 'Three-time championship-winning engineer. A master of aerodynamics.'
        },
        {
            id: 'td002',
            name: 'Eng. M. Yamamoto',
            firstName: 'Masaru',
            lastName: 'Yamamoto',
            nationality: 'Japan',
            flag: '🇯🇵',
            age: 51,
            rating: 90,
            cost: 8500000,
            bonus: {
                powerUnit: 5,
                cooling: 3
            },
            traits: ['ENGINE_WIZARD', 'INNOVATIVE'],
            bio: 'Power unit specialist. Revolutionized engine cooling in the modern era.'
        },
        {
            id: 'td003',
            name: 'Prof. J. Whitmore',
            firstName: 'James',
            lastName: 'Whitmore',
            nationality: 'United Kingdom',
            flag: '🇬🇧',
            age: 58,
            rating: 89,
            cost: 8000000,
            bonus: {
                aerodynamics: 3,
                mechanicalGrip: 3
            },
            traits: ['AERO_GENIUS', 'VETERAN_LEADER'],
            bio: 'Oxford-educated aero specialist with decades of championship experience.'
        },
        {
            id: 'td004',
            name: 'Eng. R. Conti',
            firstName: 'Roberto',
            lastName: 'Conti',
            nationality: 'Italy',
            flag: '🇮🇹',
            age: 47,
            rating: 87,
            cost: 7000000,
            bonus: {
                powerUnit: 3,
                mechanicalGrip: 4
            },
            traits: ['INNOVATIVE'],
            bio: 'Italian flair meets engineering precision. A bold thinker.'
        },
        {
            id: 'td005',
            name: 'Dr. L. Petrov',
            firstName: 'Lev',
            lastName: 'Petrov',
            nationality: 'Russia',
            flag: '🇷🇺',
            age: 49,
            rating: 86,
            cost: 6500000,
            bonus: {
                reliability: 5,
                cooling: 2
            },
            traits: ['RELIABILITY_GURU'],
            bio: 'A reliability obsessive who keeps cars running when others fail.'
        },
        {
            id: 'td006',
            name: 'Eng. F. Dubois',
            firstName: 'François',
            lastName: 'Dubois',
            nationality: 'France',
            flag: '🇫🇷',
            age: 45,
            rating: 84,
            cost: 5500000,
            bonus: {
                aerodynamics: 3,
                cooling: 2
            },
            traits: ['INNOVATIVE'],
            bio: 'A creative French engineer with a knack for unique solutions.'
        },
        {
            id: 'td007',
            name: 'Dr. S. Berg',
            firstName: 'Sofia',
            lastName: 'Berg',
            nationality: 'Sweden',
            flag: '🇸🇪',
            age: 42,
            rating: 82,
            cost: 4500000,
            bonus: {
                mechanicalGrip: 3,
                reliability: 2
            },
            traits: ['DATA_DRIVEN'],
            bio: 'A rising star in motorsport engineering, data-obsessed and precise.'
        },
        {
            id: 'td008',
            name: 'Eng. P. Kowalski',
            firstName: 'Piotr',
            lastName: 'Kowalski',
            nationality: 'Poland',
            flag: '🇵🇱',
            age: 40,
            rating: 78,
            cost: 3500000,
            bonus: {
                powerUnit: 2,
                reliability: 2
            },
            traits: ['RELIABILITY_GURU'],
            bio: 'A workhorse engineer. Solid, dependable, no-nonsense.'
        }
    ],

    // === CHIEF STRATEGISTS ===
    chiefStrategists: [
        {
            id: 'st001',
            name: 'M. Chen',
            firstName: 'Mei',
            lastName: 'Chen',
            nationality: 'China',
            flag: '🇨🇳',
            age: 38,
            rating: 91,
            cost: 6000000,
            bonus: {
                strategyRating: 8,
                pitDecisionAccuracy: 5
            },
            traits: ['UNDERCUT_MASTER', 'DATA_DRIVEN'],
            bio: 'A data scientist who turned to racing. Reads races like spreadsheets.'
        },
        {
            id: 'st002',
            name: 'R. Kowalczyk',
            firstName: 'Rafał',
            lastName: 'Kowalczyk',
            nationality: 'Poland',
            flag: '🇵🇱',
            age: 44,
            rating: 89,
            cost: 5500000,
            bonus: {
                strategyRating: 6,
                weatherReadAccuracy: 7
            },
            traits: ['WEATHER_READER', 'TIRE_STRATEGIST'],
            bio: 'A meteorology degree gives him an edge when the clouds gather.'
        },
        {
            id: 'st003',
            name: 'A. O\'Sullivan',
            firstName: 'Aidan',
            lastName: 'O\'Sullivan',
            nationality: 'Ireland',
            flag: '🇮🇪',
            age: 41,
            rating: 87,
            cost: 5000000,
            bonus: {
                strategyRating: 5,
                pitDecisionAccuracy: 4
            },
            traits: ['UNDERCUT_MASTER'],
            bio: 'An Irish strategist famous for daring undercut calls.'
        },
        {
            id: 'st004',
            name: 'D. Mendez',
            firstName: 'Diana',
            lastName: 'Mendez',
            nationality: 'Spain',
            flag: '🇪🇸',
            age: 39,
            rating: 86,
            cost: 4500000,
            bonus: {
                strategyRating: 5,
                tireStrategyBonus: 4
            },
            traits: ['TIRE_STRATEGIST'],
            bio: 'A tire genius who maximizes every compound to its breaking point.'
        },
        {
            id: 'st005',
            name: 'B. Anderson',
            firstName: 'Brian',
            lastName: 'Anderson',
            nationality: 'Australia',
            flag: '🇦🇺',
            age: 50,
            rating: 84,
            cost: 4000000,
            bonus: {
                strategyRating: 4,
                pitDecisionAccuracy: 3
            },
            traits: ['VETERAN_LEADER'],
            bio: 'A veteran race engineer who has seen every strategy work — and fail.'
        },
        {
            id: 'st006',
            name: 'H. Albrecht',
            firstName: 'Helga',
            lastName: 'Albrecht',
            nationality: 'Germany',
            flag: '🇩🇪',
            age: 36,
            rating: 81,
            cost: 3500000,
            bonus: {
                strategyRating: 3,
                weatherReadAccuracy: 4
            },
            traits: ['DATA_DRIVEN'],
            bio: 'A young analyst with a brilliant mind and zero tolerance for sentiment.'
        },
        {
            id: 'st007',
            name: 'V. Singh',
            firstName: 'Vikram',
            lastName: 'Singh',
            nationality: 'India',
            flag: '🇮🇳',
            age: 35,
            rating: 78,
            cost: 2800000,
            bonus: {
                strategyRating: 3,
                tireStrategyBonus: 2
            },
            traits: ['TIRE_STRATEGIST'],
            bio: 'A rising strategist with sharp instincts and growing confidence.'
        },
        {
            id: 'st008',
            name: 'L. Costa',
            firstName: 'Luiza',
            lastName: 'Costa',
            nationality: 'Brazil',
            flag: '🇧🇷',
            age: 33,
            rating: 75,
            cost: 2200000,
            bonus: {
                strategyRating: 2,
                pitDecisionAccuracy: 2
            },
            traits: ['UNDERCUT_MASTER'],
            bio: 'A young Brazilian strategist building her reputation race by race.'
        }
    ],

    // === PIT CREWS ===
    pitCrews: [
        {
            id: 'pc001',
            name: 'Lightning Crew',
            crewChief: 'M. Foster',
            nationality: 'United Kingdom',
            flag: '🇬🇧',
            rating: 94,
            cost: 5000000,
            bonus: {
                pitStopTime: -1.8,  // shaves 1.8s off pit stops
                pitConsistency: 10
            },
            traits: ['SUB_TWO_SECOND', 'CONSISTENT_CREW'],
            avgStopTime: 2.1,
            bio: 'World-record holders. Six wheels on, six wheels off, under 2.5 seconds.'
        },
        {
            id: 'pc002',
            name: 'Velocity Squadron',
            crewChief: 'T. Brennan',
            nationality: 'Ireland',
            flag: '🇮🇪',
            rating: 91,
            cost: 4200000,
            bonus: {
                pitStopTime: -1.4,
                pitConsistency: 8
            },
            traits: ['SUB_TWO_SECOND', 'DOUBLE_STACK'],
            avgStopTime: 2.3,
            bio: 'Drilled to perfection. Specializes in double-stack pit stops.'
        },
        {
            id: 'pc003',
            name: 'Apex Garage',
            crewChief: 'D. Müller',
            nationality: 'Germany',
            flag: '🇩🇪',
            rating: 89,
            cost: 3800000,
            bonus: {
                pitStopTime: -1.2,
                pitConsistency: 9
            },
            traits: ['CONSISTENT_CREW'],
            avgStopTime: 2.4,
            bio: 'German precision applied to pit lane. Never a wasted motion.'
        },
        {
            id: 'pc004',
            name: 'Iron Hand Crew',
            crewChief: 'R. Kobayashi',
            nationality: 'Japan',
            flag: '🇯🇵',
            rating: 87,
            cost: 3200000,
            bonus: {
                pitStopTime: -1.0,
                pitConsistency: 7
            },
            traits: ['CONSISTENT_CREW'],
            avgStopTime: 2.5,
            bio: 'Disciplined and methodical. Errors are not an option.'
        },
        {
            id: 'pc005',
            name: 'Thunderstrike',
            crewChief: 'C. Russo',
            nationality: 'Italy',
            flag: '🇮🇹',
            rating: 84,
            cost: 2800000,
            bonus: {
                pitStopTime: -0.8,
                pitConsistency: 5
            },
            traits: ['DOUBLE_STACK'],
            avgStopTime: 2.7,
            bio: 'Fast and passionate. When they nail it, they fly.'
        },
        {
            id: 'pc006',
            name: 'Steady Hands',
            crewChief: 'P. Lefebvre',
            nationality: 'France',
            flag: '🇫🇷',
            rating: 81,
            cost: 2200000,
            bonus: {
                pitStopTime: -0.6,
                pitConsistency: 6
            },
            traits: ['CONSISTENT_CREW'],
            avgStopTime: 2.8,
            bio: 'Slow and steady wins the race. Never the fastest, never the slowest.'
        },
        {
            id: 'pc007',
            name: 'Rapid Response',
            crewChief: 'J. Carter',
            nationality: 'United States',
            flag: '🇺🇸',
            rating: 78,
            cost: 1800000,
            bonus: {
                pitStopTime: -0.4,
                pitConsistency: 4
            },
            traits: [],
            avgStopTime: 3.0,
            bio: 'An ambitious American crew climbing the pit lane ranks.'
        },
        {
            id: 'pc008',
            name: 'Garage 7',
            crewChief: 'M. Petrov',
            nationality: 'Bulgaria',
            flag: '🇧🇬',
            rating: 74,
            cost: 1400000,
            bonus: {
                pitStopTime: -0.2,
                pitConsistency: 3
            },
            traits: [],
            avgStopTime: 3.2,
            bio: 'Budget-friendly and dependable. Gets the job done.'
        }
    ]
};

/* --- HELPER FUNCTIONS --- */

/**
 * Get all technical directors
 */
function getAllTechnicalDirectors() {
    return [...STAFF_DATA.technicalDirectors].sort((a, b) => b.rating - a.rating);
}

/**
 * Get all chief strategists
 */
function getAllChiefStrategists() {
    return [...STAFF_DATA.chiefStrategists].sort((a, b) => b.rating - a.rating);
}

/**
 * Get all pit crews
 */
function getAllPitCrews() {
    return [...STAFF_DATA.pitCrews].sort((a, b) => b.rating - a.rating);
}

/**
 * Get staff member by ID across all categories
 */
function getStaffById(id) {
    return STAFF_DATA.technicalDirectors.find(s => s.id === id) ||
           STAFF_DATA.chiefStrategists.find(s => s.id === id) ||
           STAFF_DATA.pitCrews.find(s => s.id === id);
}

/**
 * Get staff by category and ID
 */
function getStaffByCategory(category, id) {
    if (!STAFF_DATA[category]) return null;
    return STAFF_DATA[category].find(s => s.id === id);
}

/**
 * Get random staff for AI teams
 */
function getRandomStaff(category, excludeIds = []) {
    const pool = STAFF_DATA[category].filter(s => !excludeIds.includes(s.id));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Calculate total staff cost
 */
function calculateStaffCost(staff) {
    let total = 0;
    if (staff.techDirector) total += staff.techDirector.cost || 0;
    if (staff.strategist) total += staff.strategist.cost || 0;
    if (staff.pitCrew) total += staff.pitCrew.cost || 0;
    return total;
}

/**
 * Apply staff bonuses to team car stats
 */
function applyStaffBonuses(carStats, staff) {
    const newStats = { ...carStats };

    if (staff.techDirector && staff.techDirector.bonus) {
        Object.entries(staff.techDirector.bonus).forEach(([stat, val]) => {
            if (newStats[stat] !== undefined) {
                newStats[stat] = Math.min(100, newStats[stat] + val);
            }
        });
    }

    return newStats;
}

/**
 * Get staff tier label
 */
function getStaffTier(staff) {
    if (staff.rating >= 90) return 'ELITE';
    if (staff.rating >= 85) return 'STRONG';
    if (staff.rating >= 80) return 'MID';
    if (staff.rating >= 75) return 'LOWER';
    return 'BUDGET';
}

/**
 * Auto-assign staff to an AI team based on budget tier
 */
function autoAssignStaff(budgetTier, excludeIds = []) {
    // budgetTier: 'HIGH', 'MEDIUM', 'LOW'
    const ranges = {
        HIGH: { min: 85, max: 95 },
        MEDIUM: { min: 78, max: 87 },
        LOW: { min: 70, max: 80 }
    };
    const range = ranges[budgetTier] || ranges.MEDIUM;

    const filterByRange = (list) =>
        list.filter(s =>
            s.rating >= range.min &&
            s.rating <= range.max &&
            !excludeIds.includes(s.id)
        );

    const tdPool = filterByRange(STAFF_DATA.technicalDirectors);
    const stPool = filterByRange(STAFF_DATA.chiefStrategists);
    const pcPool = filterByRange(STAFF_DATA.pitCrews);

    return {
        techDirector: tdPool[Math.floor(Math.random() * tdPool.length)] || STAFF_DATA.technicalDirectors[STAFF_DATA.technicalDirectors.length - 1],
        strategist: stPool[Math.floor(Math.random() * stPool.length)] || STAFF_DATA.chiefStrategists[STAFF_DATA.chiefStrategists.length - 1],
        pitCrew: pcPool[Math.floor(Math.random() * pcPool.length)] || STAFF_DATA.pitCrews[STAFF_DATA.pitCrews.length - 1]
    };
}