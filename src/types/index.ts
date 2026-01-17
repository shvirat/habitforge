export type HabitFrequency = 'daily' | 'weekly' | 'custom';
export type HabitCategory = 'health' | 'productivity' | 'learning' | 'mindfulness' | 'fitness' | 'other';

export interface Habit {
    id: string;
    userId: string;
    title: string;
    description?: string;
    purpose: string; // "Why does this habit matter?"
    frequency: HabitFrequency;
    customSchedule?: string[]; // e.g., ['Mon', 'Wed']
    category: HabitCategory;
    createdAt: Date;
    streak: number;
    totalCompletions: number;
    lastCompleted?: Date;
    lastFailed?: Date;
    isArchived: boolean;
    // Habit Fixer specific
    isHabitFixer: boolean;
    reminderTime?: string;
}

export interface HabitLog {
    id: string;
    habitId: string;
    userId: string;
    date: string; // YYYY-MM-DD
    completedAt: Date;
    status: 'completed' | 'failed' | 'skipped';
    failReason?: string;
    proofImageUrl?: string; // For Habit Fixer
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    level: number;
    xp: number;
    joinedAt: Date;
}
