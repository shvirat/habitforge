export const XP_CONSTANTS = {
    HABIT_FIXER_COMPLETION: 50,
    STANDARD_HABIT_COMPLETION: 10,
    HABIT_FAILURE_PENALTY: 5, // Deducted when marking as failed/skipped
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
