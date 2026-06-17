/* ============================================
   VELOCITY — ACHIEVEMENTS DATA
   Unlockable achievements with progression tracking
   Each achievement has trigger conditions and rewards
   ============================================ */

/* ACHIEVEMENT CATEGORIES */
const ACHIEVEMENT_CATEGORIES = {
    RACE: { name: 'Race', icon: '🏁', color: '#00FF41' },
    CHAMPIONSHIP: { name: 'Championship', icon: '🏆', color: '#FFD700' },
    SKILL: { name: 'Skill', icon: '⚡', color: '#0080FF' },
    MILESTONE: { name: 'Milestone', icon: '📊', color: '#FF6600' },
    SPECIAL: { name: 'Special', icon: '⭐', color: '#FF00AA' },
    LEGENDARY: { name: 'Legendary', icon: '👑', color: '#9933FF' }
};

const ACHIEVEMENTS_DATA = [
    // === RACE ACHIEVEMENTS ===
    {
        id: 'first_race',
        name: 'Lights Out',
        description: 'Complete your very first race',
        category: 'RACE',
        icon: '🚦',
        xpReward: 100,
        condition: { type: 'TOTAL_RACES', value: 1 },
        hidden: false
    },
    {
        id: 'first_points',
        name: 'On the Board',
        description: 'Score your first championship point',
        category: 'RACE',
        icon: '🎯',
        xpReward: 150,
        condition: { type: 'FIRST_POINTS' },
        hidden: false
    },
    {
        id: 'first_podium',
        name: 'Champagne Taste',
        description: 'Finish in the top 3 for the first time',
        category: 'RACE',
        icon: '🥉',
        xpReward: 300,
        condition: { type: 'FIRST_PODIUM' },
        hidden: false
    },
    {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first race',
        category: 'RACE',
        icon: '🏆',
        xpReward: 500,
        condition: { type: 'FIRST_WIN' },
        hidden: false
    },
    {
        id: 'first_pole',
        name: 'Saturday King',
        description: 'Set the fastest qualifying time for the first time',
        category: 'RACE',
        icon: '🥇',
        xpReward: 400,
        condition: { type: 'FIRST_POLE' },
        hidden: false
    },
    {
        id: 'first_fastest_lap',
        name: 'Quickest in the Field',
        description: 'Set the fastest lap of a race',
        category: 'RACE',
        icon: '⏱️',
        xpReward: 250,
        condition: { type: 'FIRST_FASTEST_LAP' },
        hidden: false
    },

    // === SKILL ACHIEVEMENTS ===
    {
        id: 'hat_trick',
        name: 'Hat-Trick Hero',
        description: 'Pole position, race win, and fastest lap in a single race',
        category: 'SKILL',
        icon: '🎩',
        xpReward: 1000,
        condition: { type: 'HAT_TRICK' },
        hidden: false
    },
    {
        id: 'grand_chelem',
        name: 'Grand Chelem',
        description: 'Pole, win, fastest lap, AND lead every lap',
        category: 'SKILL',
        icon: '💎',
        xpReward: 2000,
        condition: { type: 'GRAND_CHELEM' },
        hidden: false
    },
    {
        id: 'comeback_king',
        name: 'Comeback King',
        description: 'Win a race after starting outside the top 10',
        category: 'SKILL',
        icon: '🚀',
        xpReward: 1500,
        condition: { type: 'COMEBACK_WIN', startPos: 10 },
        hidden: false
    },
    {
        id: 'wet_master',
        name: 'Rain Dance',
        description: 'Win a race in wet conditions',
        category: 'SKILL',
        icon: '🌧️',
        xpReward: 750,
        condition: { type: 'WET_WIN' },
        hidden: false
    },
    {
        id: 'overtake_master',
        name: 'Surgical Precision',
        description: 'Make 10 successful overtakes in a single race',
        category: 'SKILL',
        icon: '⚔️',
        xpReward: 800,
        condition: { type: 'OVERTAKE_COUNT', value: 10 },
        hidden: false
    },

    // === CHAMPIONSHIP ACHIEVEMENTS ===
    {
        id: 'first_championship',
        name: 'World Driver Champion',
        description: 'Win your first drivers championship',
        category: 'CHAMPIONSHIP',
        icon: '👑',
        xpReward: 2500,
        condition: { type: 'CHAMPIONSHIPS', value: 1 },
        hidden: false
    },
    {
        id: 'first_constructors',
        name: 'Constructor King',
        description: 'Win your first constructors championship',
        category: 'CHAMPIONSHIP',
        icon: '🏗️',
        xpReward: 3000,
        condition: { type: 'CONSTRUCTOR_CHAMPIONSHIPS', value: 1 },
        hidden: false
    },
    {
        id: 'double_title',
        name: 'The Perfect Double',
        description: 'Win both Drivers AND Constructors title in the same season',
        category: 'CHAMPIONSHIP',
        icon: '💎',
        xpReward: 5000,
        condition: { type: 'DOUBLE_TITLE' },
        hidden: false
    },

    // === MILESTONE ACHIEVEMENTS ===
    {
        id: 'races_50',
        name: 'Veteran Status',
        description: 'Complete 50 races in your career',
        category: 'MILESTONE',
        icon: '5️⃣0️⃣',
        xpReward: 1000,
        condition: { type: 'TOTAL_RACES', value: 50 },
        hidden: false
    },
    {
        id: 'wins_10',
        name: 'Double Digit Wins',
        description: 'Achieve 10 race victories',
        category: 'MILESTONE',
        icon: '🏆',
        xpReward: 1200,
        condition: { type: 'TOTAL_WINS', value: 10 },
        hidden: false
    },
    {
        id: 'poles_10',
        name: 'Qualifying Specialist',
        description: 'Achieve 10 pole positions',
        category: 'MILESTONE',
        icon: '⚡',
        xpReward: 1000,
        condition: { type: 'TOTAL_POLES', value: 10 },
        hidden: false
    },

    // === SPECIAL ACHIEVEMENTS ===
    {
        id: 'undefeated',
        name: 'The Invincible',
        description: 'Win every race in a single season',
        category: 'SPECIAL',
        icon: '🔥',
        xpReward: 15000,
        condition: { type: 'PERFECT_SEASON' },
        hidden: false
    },
    {
        id: 'budget_master',
        name: 'Frugal Principal',
        description: 'End a season with over $150M in the bank',
        category: 'SPECIAL',
        icon: '💰',
        xpReward: 2000,
        condition: { type: 'BUDGET_MILESTONE', value: 150000000 },
        hidden: false
    },

    // === LEGENDARY ACHIEVEMENTS ===
    {
        id: 'centurion',
        name: 'The Centurion',
        description: 'Win 100 races in your career',
        category: 'LEGENDARY',
        icon: '🎖️',
        xpReward: 25000,
        condition: { type: 'TOTAL_WINS', value: 100 },
        hidden: false
    },
    {
        id: 'immortal',
        name: 'The Immortal',
        description: 'Win 10 Drivers Championships',
        category: 'LEGENDARY',
        icon: '⭐',
        xpReward: 50000,
        condition: { type: 'CHAMPIONSHIPS', value: 10 },
        hidden: false
    }
];

/* --- HELPER FUNCTIONS --- */

/**
 * Get achievement by ID
 */
function getAchievementById(id) {
    return ACHIEVEMENTS_DATA.find(a => a.id === id);
}

/**
 * Get all achievements (sorted by category, then XP)
 */
function getAllAchievements() {
    const categoryOrder = ['RACE', 'CHAMPIONSHIP', 'SKILL', 'MILESTONE', 'SPECIAL', 'LEGENDARY'];
    return [...ACHIEVEMENTS_DATA].sort((a, b) => {
        if (a.category !== b.category) {
            return categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        }
        return a.xpReward - b.xpReward;
    });
}

/**
 * Get achievements by category
 */
function getAchievementsByCategory(category) {
    return ACHIEVEMENTS_DATA.filter(a => a.category === category);
}

/**
 * Get visible (non-hidden) achievements
 */
function getVisibleAchievements() {
    return getAllAchievements().filter(a => !a.hidden);
}

/**
 * Get hidden achievements
 */
function getHiddenAchievements() {
    return ACHIEVEMENTS_DATA.filter(a => a.hidden);
}

/**
 * Get unlocked achievements for a profile
 */
function getUnlockedAchievements(profile) {
    if (!profile || !profile.achievements) return [];
    return ACHIEVEMENTS_DATA.filter(a => profile.achievements.includes(a.id));
}

/**
 * Get locked achievements (with hidden filtering)
 */
function getLockedAchievements(profile, includeHidden = false) {
    const unlocked = profile?.achievements || [];
    return ACHIEVEMENTS_DATA.filter(a =>
        !unlocked.includes(a.id) &&
        (includeHidden || !a.hidden)
    );
}

/**
 * Calculate completion percentage
 */
function getAchievementProgress(profile) {
    const total = ACHIEVEMENTS_DATA.length;
    const unlocked = profile?.achievements?.length || 0;
    return {
        unlocked,
        total,
        percent: Math.round((unlocked / total) * 100)
    };
}

/**
 * Check if a condition is met for given profile/event data
 * Called by event-bus listeners after races
 */
function checkAchievementCondition(achievement, profile, eventData = {}) {
    const c = achievement.condition;
    if (!c) return false;

    switch (c.type) {
        case 'TOTAL_RACES':
            return profile.totalRaces >= c.value;

        case 'TOTAL_WINS':
            return profile.totalWins >= c.value;

        case 'TOTAL_PODIUMS':
            return profile.totalPodiums >= c.value;

        case 'TOTAL_POLES':
            return profile.totalPoles >= c.value;

        case 'TOTAL_FASTEST_LAPS':
            return profile.totalFastestLaps >= c.value;

        case 'CHAMPIONSHIPS':
            return profile.totalChampionships >= c.value;

        case 'CONSTRUCTOR_CHAMPIONSHIPS':
            return (profile.constructorChampionships || 0) >= c.value;

        case 'CONSECUTIVE_CHAMPIONSHIPS':
            return (profile.consecutiveChampionships || 0) >= c.value;

        case 'FIRST_POINTS':
            return profile.totalRaces > 0 && (eventData.points || 0) > 0;

        case 'FIRST_PODIUM':
            return profile.totalPodiums === 1;

        case 'FIRST_WIN':
            return profile.totalWins === 1;

        case 'FIRST_POLE':
            return profile.totalPoles === 1;

        case 'FIRST_FASTEST_LAP':
            return profile.totalFastestLaps === 1;

        case 'HAT_TRICK':
            return eventData.pole && eventData.win && eventData.fastestLap;

        case 'GRAND_CHELEM':
            return eventData.pole && eventData.win && eventData.fastestLap && eventData.ledAllLaps;

        case 'COMEBACK_WIN':
            return eventData.win && eventData.startPosition > c.startPos;

        case 'LAST_TO_FIRST':
            return eventData.win && eventData.startPosition === 20;

        case 'WET_WIN':
            return eventData.win && eventData.wetRace;

        case 'SC_WIN':
            return eventData.win && eventData.hadSafetyCar;

        case 'DOUBLE_TITLE':
            return eventData.wonDrivers && eventData.wonConstructors;

        case 'PERFECT_SEASON':
            return eventData.perfectSeason;

        case 'NO_DNF_SEASON':
            return eventData.noDNFSeason;

        case 'POINTS_STREAK':
            return (profile.currentPointsStreak || 0) >= c.value;

        case 'WIN_STREAK':
            return (profile.currentWinStreak || 0) >= c.value;

        case 'UNIQUE_TRACK_WINS':
            return (profile.uniqueTrackWins?.length || 0) >= c.value;

        case 'UNIQUE_TEAMS':
            return (profile.uniqueTeams?.length || 0) >= c.value;

        case 'NIGHT_WINS':
            return (profile.nightWins || 0) >= c.value;

        case 'STREET_WINS':
            return (profile.streetWins || 0) >= c.value;

        case 'ONE_STOP_HIGH_DEG':
            return eventData.oneStop && eventData.trackTireDeg >= 7;

        case 'UNDERDOG_CHAMPIONSHIP':
            return eventData.championshipWon && eventData.teamReputation < 70;

        case 'PERFECT_STRATEGY':
            return eventData.win && eventData.strategyErrors === 0;

        case 'LEVEL':
            return profile.level >= c.value;

        default:
            return false;
    }
}

/**
 * Check all achievements and return newly unlocked ones
 * Called after every race/event
 */
function checkAllAchievements(profile, eventData = {}) {
    const newlyUnlocked = [];
    const currentUnlocked = profile.achievements || [];

    ACHIEVEMENTS_DATA.forEach(achievement => {
        if (currentUnlocked.includes(achievement.id)) return;
        if (checkAchievementCondition(achievement, profile, eventData)) {
            newlyUnlocked.push(achievement);
        }
    });

    return newlyUnlocked;
}

/**
 * Unlock an achievement for a profile
 */
function unlockAchievement(profile, achievementId) {
    if (!profile.achievements) profile.achievements = [];
    if (profile.achievements.includes(achievementId)) return false;

    const achievement = getAchievementById(achievementId);
    if (!achievement) return false;

    profile.achievements.push(achievementId);
    profile.xp = (profile.xp || 0) + achievement.xpReward;

    // Emit unlock event for UI notification
    if (typeof EventBus !== 'undefined') {
        EventBus.emit('achievement:unlocked', achievement);
    }

    return true;
}

/**
 * Get total XP earned from achievements
 */
function getTotalAchievementXP(profile) {
    const unlocked = getUnlockedAchievements(profile);
    return unlocked.reduce((sum, a) => sum + a.xpReward, 0);
}

/**
 * Calculate player level from XP
 */
function calculateLevel(xp) {
    // Level formula: level = floor(sqrt(xp / 100))
    // Level 1: 0-99 XP
    // Level 2: 100-399 XP
    // Level 5: 2500-3599 XP
    // Level 10: 10000-12099 XP
    // Level 50: 250000+ XP
    return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

/**
 * XP needed for next level
 */
function xpForNextLevel(currentLevel) {
    return Math.pow(currentLevel, 2) * 100;
}

/**
 * XP progress within current level
 */
function getLevelProgress(xp) {
    const currentLevel = calculateLevel(xp);
    const currentLevelXP = xpForNextLevel(currentLevel - 1);
    const nextLevelXP = xpForNextLevel(currentLevel);
    const progressXP = xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    return {
        level: currentLevel,
        currentXP: xp,
        progressXP,
        neededXP,
        percent: Math.min(100, Math.round((progressXP / neededXP) * 100))
    };
}