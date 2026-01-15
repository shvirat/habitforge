export const XP_VALUES = {
    HABIT_COMPLETE: 10,
    HABIT_FIXER_COMPLETE: 25,
    STREAK_BONUS_MULTIPLIER: 0.1, // 10% per day of streak
    MISSED_PENALTY: -5
};

export const LEVELS = [
    { level: 1, xp: 0, title: 'Novice', badge: 'Bronze' },
    { level: 5, xp: 500, title: 'Apprentice', badge: 'Silver' },
    { level: 10, xp: 2000, title: 'Disciple', badge: 'Gold' },
    { level: 20, xp: 5000, title: 'Master', badge: 'Platinum' },
    { level: 50, xp: 20000, title: 'Legend', badge: 'Diamond' }
];

export const calculateLevel = (currentXp: number) => {
    // Find highest level where required XP <= currentXp
    const matched = LEVELS.slice().reverse().find(l => l.xp <= currentXp);
    return matched || LEVELS[0];
};

export const getNextLevelProgress = (currentXp: number) => {
    const currentLevel = calculateLevel(currentXp);
    const nextLevel = LEVELS.find(l => l.xp > currentXp);

    if (!nextLevel) return 100; // Max level

    const prevLevelXp = currentLevel.xp;
    const nextLevelXp = nextLevel.xp;

    const totalNeeded = nextLevelXp - prevLevelXp;
    const currentProgress = currentXp - prevLevelXp;

    return Math.min(100, Math.max(0, (currentProgress / totalNeeded) * 100));
};
