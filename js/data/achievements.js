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
        name: 'Pole Position',
        description: 'Set the fastest qualifying time',
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
        condition: { type: 'COMEBACK_WIN', startPos: 10 }
        ,
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
        id: 'safety_car_master',
        name: 'Chaos Tamer',
        description: 'Win a race that featured a safety car',
        category: 'SKILL',
        icon: '🚨',
        xpReward: 500,
        condition: { type: 'SC_WIN' },
        hidden: false
    },
    {
        id: 'tire_whisperer',
        name: 'Tire Whisperer',
        description: 'Complete a one-stop race on a high-degradation track',
        category: 'SKILL',
        icon: '🛞',
        xpReward: 600,
        condition: { type: 'ONE_STOP_HIGH_DEG' },
        hidden: false
    },
    {
        id: 'perfect_strategy',
        name: 'Master Tactician',
        description: 'Win a race without making a single strategic error',
        category: 'SKILL',
        icon: '🧠',
        xpReward: 800,
        condition: { type: 'PERFECT_STRATEGY' },
        hidden: true
    },

    // === MILESTONE ACHIEVEMENTS ===
    {
        id: 'races_10',
        name: 'Rookie Season',
        description: 'Complete 10 races',
        category: 'MILESTONE',
        icon: '🔟',
        xpReward: 200,
        condition: { type: 'TOTAL_RACES', value: 10 },
        hidden: false
    },
    {
        id: 'races_50',
        name: 'Half Century',
        description: 'Complete 50 races',
        category: 'MILESTONE',
        icon: '5️⃣0️⃣',
        xpReward: 500,
        condition: { type: 'TOTAL_RACES', value: 50 },
        hidden: false
    },
    {
        id: 'races_100',
        name: 'Century Maker',
        description: 'Complete 100 races',
        category: 'MILESTONE',
        icon: '💯',
        xpReward: 1000,
        condition: { type: 'TOTAL_RACES', value: 100 },
        hidden: false
    },
    {
        id: 'races_250',
        name: 'Iron Driver',
        description: 'Complete 250 races',
        category: 'MILESTONE',
        icon: '🏗️',
        xpReward: 2500,
        condition: { type: 'TOTAL_RACES', value: 250 },
        hidden: false
    },
    {
        id: 'wins_5',
        name: 'Race Winner',
        description: 'Win 5 races',
        category: 'MILESTONE',
        icon: '🏆',
        xpReward: 400,
        condition: { type: 'TOTAL_WINS', value: 5 },
        hidden: false
    },
    {
        id: 'wins_25',
        name: 'Established Star',
        description: 'Win 25 races',
        category: 'MILESTONE',
        icon: '⭐',
        xpReward: 1500,
        condition: { type: 'TOTAL_WINS', value: 25 },
        hidden: false
    },
    {
        id: 'wins_50',
        name: 'Living Legend',
        description: 'Win 50 races',
        category: 'MILESTONE',
        icon: '🌟',
        xpReward: 3000,
        condition: { type: 'TOTAL_WINS', value: 50 },
        hidden: false
    },
    {
        id: 'podiums_25',
        name: 'Podium Regular',
        description: 'Score 25 podium finishes',
        category: 'MILESTONE',
        icon: '🏅',
        xpReward: 750,
        condition: { type: 'TOTAL_PODIUMS', value: 25 },
        hidden: false
    },
    {
        id: 'podiums_100',
        name: 'Podium Master',
        description: 'Score 100 podium finishes',
        category: 'MILESTONE',
        icon: '🎖️',
        xpReward: 2000,
        condition: { type: 'TOTAL_PODIUMS', value: 100 },
        hidden: false
    },
    {
        id: 'poles_10',
        name: 'Pole Master',
        description: 'Achieve 10 pole positions',
        category: 'MILESTONE',
        icon: '⚡',
        xpReward: 600,
        condition: { type: 'TOTAL_POLES', value: 10 },
        hidden: false
    },
    {
        id: 'poles_50',
        name: 'Saturday Specialist',
        description: 'Achieve 50 pole positions',
        category: 'MILESTONE',
        icon: '💫',
        xpReward: 2000,
        condition: { type: 'TOTAL_POLES', value: 50 },
        hidden: false
    },
    {
        id: 'fastest_laps_25',
        name: 'Speed Demon',
        description: 'Set 25 fastest laps',
        category: 'MILESTONE',
        icon: '💨',
        xpReward: 800,
        condition: { type: 'TOTAL_FASTEST_LAPS', value: 25 },
        hidden: false
    },

    // === CHAMPIONSHIP ACHIEVEMENTS ===
    {
        id: 'first_championship',
        name: 'World Champion',
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
        id: 'back_to_back',
        name: 'Back-to-Back',
        description: 'Win two consecutive drivers championships',
        category: 'CHAMPIONSHIP',
        icon: '🔁',
        xpReward: 4000,
        condition: { type: 'CONSECUTIVE_CHAMPIONSHIPS', value: 2 },
        hidden: false
    },
    {
        id: 'triple_crown',
        name: 'Triple Crown',
        description: 'Win three consecutive drivers championships',
        category: 'CHAMPIONSHIP',
        icon: '👑',
        xpReward: 6000,
        condition: { type: 'CONSECUTIVE_CHAMPIONSHIPS', value: 3 },
        hidden: false
    },
    {
        id: 'dynasty',
        name: 'Dynasty',
        description: 'Win five drivers championships',
        category: 'CHAMPIONSHIP',
        icon: '🏛️',
        xpReward: 10000,
        condition: { type: 'CHAMPIONSHIPS', value: 5 },
        hidden: false
    },
    {
        id: 'double_title',
        name: 'Double Crown',
        description: 'Win both Drivers AND Constructors title in the same season',
        category: 'CHAMPIONSHIP',
        icon: '💎',
        xpReward: 5000,
        condition: { type: 'DOUBLE_TITLE' },
        hidden: false
    },

    // === SPECIAL ACHIEVEMENTS ===
    {
        id: 'underdog',
        name: 'Underdog Story',
        description: 'Win a championship with a bottom-half team',
        category: 'SPECIAL',
        icon: '🐕',
        xpReward: 5000,
        condition: { type: 'UNDERDOG_CHAMPIONSHIP' },
        hidden: false
    },
    {
        id: 'perfect_season',
        name: 'Perfect Season',
        description: 'Win every race in a single season',
        category: 'SPECIAL',
        icon: '✨',
        xpReward: 10000,
        condition: { type: 'PERFECT_SEASON' },
        hidden: true
    },
    {
        id: 'iron_will',
        name: 'Iron Will',
        description: 'Finish every race in a season',
        category: 'SPECIAL',
        icon: '🛡️',
        xpReward: 1500,
        condition: { type: 'NO_DNF_SEASON' },
        hidden: false
    },
    {
        id: 'consistency_king',
        name: 'Consistency King',
        description: 'Score points in 10 consecutive races',
        category: 'SPECIAL',
        icon: '📈',
        xpReward: 1200,
        condition: { type: 'POINTS_STREAK', value: 10 },
        hidden: false
    },
    {
        id: 'win_streak_3',
        name: 'Winning Streak',
        description: 'Win 3 races in a row',
        category: 'SPECIAL',
        icon: '🔥',
        xpReward: 1500,
        condition: { type: 'WIN_STREAK', value: 3 },
        hidden: false
    },
    {
        id: 'win_streak_5',
        name: 'On Fire',
        description: 'Win 5 races in a row',
        category: 'SPECIAL',
        icon: '🌋',
        xpReward: 3500,
        condition: { type: 'WIN_STREAK', value: 5 },
        hidden: false
    },
    {
        id: 'all_tracks',
        name: 'Globetrotter',
        description: 'Win at least one race on 15 different tracks',
        category: 'SPECIAL',
        icon: '🌍',
        xpReward: 2500,
        condition: { type: 'UNIQUE_TRACK_WINS', value: 15 },
        hidden: false
    },
    {
        id: 'all_teams',
        name: 'Team Switcher',
        description: 'Race with 5 different constructors',
        category: 'SPECIAL',
        icon: '🔄',
        xpReward: 1000,
        condition: { type: 'UNIQUE_TEAMS', value: 5 },
        hidden: false
    },
    {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Win 5 night races',
        category: 'SPECIAL',
        icon: '🌙',
        xpReward: 1000,
        condition: { type: 'NIGHT_WINS', value: 5 },
        hidden: false
    },
    {
        id: 'street_king',
        name: 'Street King',
        description: 'Win 5 street circuit races',
        category: 'SPECIAL',
        icon: '🏙️',
        xpReward: 1200,
        condition: { type: 'STREET_WINS', value: 5 },
        hidden: false
    },
    {
        id: 'last_to_first',
        name: 'Phoenix Rising',
        description: 'Win a race after starting from last on the grid',
        category: 'SPECIAL',
        icon: '🔥',
        xpReward: 3000,
        condition: { type: 'LAST_TO_FIRST' },
        hidden: true
    },

    // === LEGENDARY ACHIEVEMENTS ===
    {
        id: 'centurion',
        name: 'Centurion',
        description: 'Win 100 races in your career',
        category: 'LEGENDARY',
        icon: '⚔️',
        xpReward: 15000,
        condition: { type: 'TOTAL_WINS', value: 100 },
        hidden: false
    },
    {
        id: 'immortal',
        name: 'Immortal',
        description: 'Win 10 drivers championships',
        category: 'LEGENDARY',
        icon: '⭐',
        xpReward: 25000,
        condition: { type: 'CHAMPIONSHIPS', value: 10 },
        hidden: false
    },
    {
        id: 'velocity_legend',
        name: 'Velocity Legend',
        description: 'Achieve the highest player level',
        category: 'LEGENDARY',
        icon: '👑',
        xpReward: 50000,
        condition: { type: 'LEVEL', value: 50 },
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
    return [...ACHIEVEMENTS_DATA].sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
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
    return ACHIEVEMENTS_DATA.filter(a => !a.hidden);
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