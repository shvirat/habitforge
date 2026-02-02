export const XP_CONSTANTS = {
    HABIT_FIXER_COMPLETION: 50,
    STANDARD_HABIT_COMPLETION: 10,
    HABIT_FAILURE_PENALTY: 50, // Deducted when marking as failed/skipped
    LEVEL_BASE_XP: 100, // XP needed for Level 2
};

/**
 * Calculates the level based on total XP.
 * Formula: Level = Floor(Sqrt(XP / 100)) + 1
 */
export const calculateLevel = (xp: number): number => {
    if (xp < 0) return 1;
    return Math.floor(Math.sqrt(xp / XP_CONSTANTS.LEVEL_BASE_XP)) + 1;
};

/**
 * Calculates XP details for progress bars.
 */
export const calculateLevelProgress = (level: number, xp: number) => {
    // Current Level Base XP = (L-1)^2 * 100
    const currentLevelBaseXp = Math.pow(level - 1, 2) * XP_CONSTANTS.LEVEL_BASE_XP;

    // Next Level Base XP = (L)^2 * 100
    const nextLevelXp = Math.pow(level, 2) * XP_CONSTANTS.LEVEL_BASE_XP;

    // XP needed to traverse this level
    const xpForNextLevel = nextLevelXp - currentLevelBaseXp;

    // How much XP we have into this level
    const currentProgressXp = xp - currentLevelBaseXp;

    // Percentage
    const progressPercent = xpForNextLevel > 0
        ? Math.min(100, Math.max(0, (currentProgressXp / xpForNextLevel) * 100))
        : 100;

    return {
        nextLevelXp, // Total XP needed for next level
        xpForNextLevel, // XP delta for this level
        currentProgressXp, // XP earned in this level
        progressPercent
    };
};

export const LEVELS = [
    { level: 1, xp: 0, title: 'Novice', badge: 'Bronze' },
    { level: 5, xp: 500, title: 'Apprentice', badge: 'Silver' },
    { level: 10, xp: 2000, title: 'Disciple', badge: 'Gold' },
    { level: 20, xp: 5000, title: 'Master', badge: 'Platinum' },
    { level: 50, xp: 20000, title: 'Legend', badge: 'Diamond' }
];

export const getRankTitle = (level: number): string => {
    // specific levels have titles, but we want ranges.
    // E.g. Level 1-4 = Novice, 5-9 = Apprentice
    const matched = LEVELS.slice().reverse().find(l => level >= l.level);
    return matched ? matched.title : 'Novice';
};
