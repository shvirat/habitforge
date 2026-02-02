import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    increment,
    Timestamp,
    orderBy,
    deleteDoc,
    runTransaction
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import type { Habit } from '@/types';
import { XP_CONSTANTS, calculateLevel } from '@/utils/gamification';

const HABITS_COLLECTION = 'habits';

export const HabitService = {
    // Create a new habit
    createHabit: async (habitData: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'totalCompletions' | 'isArchived'>) => {
        try {
            const docRef = await addDoc(collection(db, HABITS_COLLECTION), {
                ...habitData,
                createdAt: Timestamp.now(),
                streak: 0,
                totalCompletions: 0,
                isArchived: false,
            });
            return docRef.id;
        } catch (error) {
            console.error('Error creating habit:', error);
            throw error;
        }
    },

    // Update habit details
    updateHabit: async (habitId: string, updates: Partial<Habit>) => {
        try {
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            await updateDoc(habitRef, updates);
        } catch (error) {
            console.error('Error updating habit:', error);
            throw error;
        }
    },

    // Get all habits for a user
    getUserHabits: async (userId: string): Promise<Habit[]> => {
        try {
            const q = query(
                collection(db, HABITS_COLLECTION),
                where('userId', '==', userId),
                where('isArchived', '==', false),
                orderBy('createdAt', 'desc') // Requires Firestore Index
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt.toDate(),
                // Convert timestamp to date if present for the type system
                lastCompleted: doc.data().lastCompleted ? doc.data().lastCompleted.toDate() : undefined,
                lastFailed: doc.data().lastFailed ? doc.data().lastFailed.toDate() : undefined
            } as Habit));
        } catch (error) {
            console.error('Error fetching habits:', error);
            throw error;
        }
    },

    // Permanently delete a habit
    deleteHabit: async (habitId: string) => {
        try {
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            await deleteDoc(habitRef);
            // Note: Orphan logs are kept for historical XP/Level integrity.
        } catch (error) {
            console.error('Error deleting habit:', error);
            throw error;
        }
    },



    // Helper to check for level up
    checkAndApplyLevelUp: async (userId: string) => {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            const currentXp = userDoc.data().xp || 0;
            const currentLevel = userDoc.data().level || 1;
            const calculatedLevel = calculateLevel(currentXp);

            if (calculatedLevel > currentLevel) {
                await updateDoc(userRef, { level: calculatedLevel });
                return true; // Leveled up
            }
        }
        return false;
    },

    failHabit: async (userId: string, habitId: string, failureDate: Date = new Date()) => {
        try {
            await runTransaction(db, async (transaction) => {
                const habitRef = doc(db, HABITS_COLLECTION, habitId);
                const habitDoc = await transaction.get(habitRef);

                if (!habitDoc.exists()) throw new Error("Habit not found");

                const data = habitDoc.data();

                // Idempotency Check: Don't fail if already failed today/on failureDate
                if (data.lastFailed) {
                    const lastFailedDate = data.lastFailed.toDate();
                    if (
                        lastFailedDate.getFullYear() === failureDate.getFullYear() &&
                        lastFailedDate.getMonth() === failureDate.getMonth() &&
                        lastFailedDate.getDate() === failureDate.getDate()
                    ) {
                        // Already failed for this date, ignore to prevent double XP deduction
                        return;
                    }
                }

                const habitTitle = data.title;
                const userRef = doc(db, 'users', userId);
                const logRef = doc(collection(db, 'logs'));

                // Log failure
                transaction.set(logRef, {
                    userId,
                    habitId,
                    habitTitle,
                    date: failureDate.toISOString().split('T')[0],
                    completedAt: Timestamp.fromDate(failureDate),
                    status: 'failed',
                    xpChange: -XP_CONSTANTS.HABIT_FAILURE_PENALTY
                });

                // Reset Streak
                transaction.update(habitRef, {
                    streak: 0,
                    lastFailed: Timestamp.fromDate(failureDate)
                });

                // Deduct XP
                transaction.update(userRef, {
                    xp: increment(-XP_CONSTANTS.HABIT_FAILURE_PENALTY)
                });
            });
        } catch (error) {
            console.error("Error failing habit:", error);
            throw error;
        }
    },

    completeHabitWithProof: async (userId: string, habitId: string, imageBlob: Blob) => {
        try {
            // 1. Compress Image
            const compressedBlob = await import('@/utils/compression').then(m => m.compressImage(imageBlob));

            // 2. Upload to Cloudinary
            const downloadURL = await uploadImageToCloudinary(compressedBlob);

            // 3. Run Transaction for DB consistency
            await runTransaction(db, async (transaction) => {
                const habitRef = doc(db, HABITS_COLLECTION, habitId);
                const habitDoc = await transaction.get(habitRef);
                const userRef = doc(db, 'users', userId);

                if (!habitDoc.exists()) throw new Error("Habit not found");

                const data = habitDoc.data();
                const today = new Date().toDateString();

                if (data.lastCompleted && data.lastCompleted.toDate().toDateString() === today) {
                    throw new Error("Habit already completed today");
                }

                // Create Log
                const logRef = doc(collection(db, 'logs'));
                transaction.set(logRef, {
                    userId,
                    habitId,
                    habitTitle: data.title || 'Protocol',
                    date: new Date().toISOString().split('T')[0],
                    completedAt: Timestamp.now(),
                    status: 'completed',
                    proofUrl: downloadURL, // Store URL not Base64
                    type: 'habit-fixer',
                    xpEarned: XP_CONSTANTS.HABIT_FIXER_COMPLETION
                });

                // Update Habit
                transaction.update(habitRef, {
                    streak: (data.streak || 0) + 1,
                    totalCompletions: (data.totalCompletions || 0) + 1,
                    lastCompleted: Timestamp.now()
                });

                // Award XP
                transaction.update(userRef, {
                    xp: increment(XP_CONSTANTS.HABIT_FIXER_COMPLETION)
                });
            });

            // Check for level up (outside transaction)
            await HabitService.checkAndApplyLevelUp(userId);

        } catch (error) {
            console.error('Error completing habit:', error);
            throw error;
        }
    },

    completeHabit: async (userId: string, habitId: string) => {
        try {
            await runTransaction(db, async (transaction) => {
                const habitRef = doc(db, HABITS_COLLECTION, habitId);
                const habitDoc = await transaction.get(habitRef);
                const userRef = doc(db, 'users', userId);

                if (!habitDoc.exists()) throw new Error("Habit not found");

                const data = habitDoc.data();
                const today = new Date().toDateString();

                if (data.lastCompleted && data.lastCompleted.toDate().toDateString() === today) {
                    throw new Error("Habit already completed today");
                }

                // Log completion
                const logRef = doc(collection(db, 'logs'));
                transaction.set(logRef, {
                    userId,
                    habitId,
                    habitTitle: data.title || 'Protocol',
                    date: new Date().toISOString().split('T')[0],
                    completedAt: Timestamp.now(),
                    status: 'completed',
                    xpEarned: XP_CONSTANTS.STANDARD_HABIT_COMPLETION
                });

                // Update Habit
                transaction.update(habitRef, {
                    streak: (data.streak || 0) + 1,
                    totalCompletions: (data.totalCompletions || 0) + 1,
                    lastCompleted: Timestamp.now()
                });

                // Award XP
                transaction.update(userRef, {
                    xp: increment(XP_CONSTANTS.STANDARD_HABIT_COMPLETION)
                });
            });

            // Check Level Up logic
            await HabitService.checkAndApplyLevelUp(userId);

        } catch (error) {
            console.error('Error completing habit:', error);
            throw error;
        }
    },

    // Get logs for a specific habit (for history view)
    getHabitLogs: async (userId: string, habitId: string) => {
        try {
            const q = query(
                collection(db, 'logs'),
                where('userId', '==', userId),
                where('habitId', '==', habitId),
                where('status', '==', 'completed')
            );

            const querySnapshot = await getDocs(q);
            // Sort client-side to avoid complex index requirements
            return querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    completedAt: doc.data().completedAt?.toDate ? doc.data().completedAt.toDate() : new Date(doc.data().date)
                }))
                .sort((a: { completedAt: Date }, b: { completedAt: Date }) => b.completedAt.getTime() - a.completedAt.getTime());
        } catch (error) {
            console.error('Error fetching habit logs:', error);
            throw error;
        }
    },



    // Check for missed daily habits
    checkMissedDailyHabits: async (userId: string) => {
        try {
            const habits = await HabitService.getUserHabits(userId);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            return habits.filter(habit => {
                if (habit.frequency !== 'daily') return false;

                const createdAt = new Date(habit.createdAt);
                const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
                const lastFailed = habit.lastFailed ? new Date(habit.lastFailed) : null;

                // Ignore newly created habits
                if (
                    createdAt.toDateString() === today.toDateString() ||
                    createdAt.toDateString() === yesterday.toDateString()
                ) {
                    return false;
                }

                // Ignore if already failed today or yesterday
                if (lastFailed) {
                    if (
                        lastFailed.toDateString() === today.toDateString() ||
                        lastFailed.toDateString() === yesterday.toDateString()
                    ) {
                        return false;
                    }
                }

                // Never completed → missed
                if (!lastCompleted) return true;

                const completedToday = lastCompleted.toDateString() === today.toDateString();
                const completedYesterday = lastCompleted.toDateString() === yesterday.toDateString();

                return !completedToday && !completedYesterday;
            });
        } catch (error) {
            console.error("Error checking missed daily habits:", error);
            return [];
        }
    },

    // Check for missed weekly habits
    checkMissedWeeklyHabits: async (userId: string) => {
        try {
            const habits = await HabitService.getUserHabits(userId);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            return habits.filter(habit => {
                if (habit.frequency !== 'weekly') return false;

                const createdAt = new Date(habit.createdAt);
                const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
                const lastFailed = habit.lastFailed ? new Date(habit.lastFailed) : null;

                // Ignore habits created within last 7 days
                if (createdAt >= sevenDaysAgo) {
                    return false;
                }

                // Ignore if already failed in last 7 days
                if (lastFailed && lastFailed >= sevenDaysAgo) {
                    return false;
                }

                // Never completed → missed
                if (!lastCompleted) return true;

                return lastCompleted < sevenDaysAgo;
            });
        } catch (error) {
            console.error("Error checking missed weekly habits:", error);
            return [];
        }
    },


    processMissedHabits: async (userId: string) => {
        const missedDaily = await HabitService.checkMissedDailyHabits(userId);
        const missedWeekly = await HabitService.checkMissedWeeklyHabits(userId);

        // Deduplicate just in case
        const missedMap = new Map<string, Habit>();

        [...missedDaily, ...missedWeekly].forEach(habit => {
            missedMap.set(habit.id, habit);
        });

        const missed = Array.from(missedMap.values());
        if (missed.length === 0) return [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const processed = [];

        for (const habit of missed) {
            try {
                const failDate =
                    habit.frequency === 'daily'
                        ? yesterday
                        : sevenDaysAgo;

                await HabitService.failHabit(userId, habit.id, failDate);
                processed.push(habit);
            } catch (error) {
                console.error(
                    `Failed to process missed habit ${habit.id}`,
                    error
                );
            }
        }

        return processed;
    },



    // Get all logs for a user (for level history)
    getUserGlobalLogs: async (userId: string) => {
        try {
            const q = query(
                collection(db, 'logs'),
                where('userId', '==', userId),
                orderBy('completedAt', 'desc') // Might require index, fallback to client sort if needed
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate ? doc.data().completedAt.toDate() : new Date(doc.data().date)
            }));
        } catch (error) {
            // Fallback for missing index
            if ((error as any)?.code === 'failed-precondition') {
                console.warn('Missing index for global logs, falling back to client-side sort');
                const q = query(
                    collection(db, 'logs'),
                    where('userId', '==', userId)
                );
                const querySnapshot = await getDocs(q);
                return querySnapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        completedAt: doc.data().completedAt?.toDate ? doc.data().completedAt.toDate() : new Date(doc.data().date)
                    }))
                    .sort((a: { completedAt: Date }, b: { completedAt: Date }) => b.completedAt.getTime() - a.completedAt.getTime());
            }
            console.error('Error fetching global logs:', error);
            throw error;
        }
    }
};
