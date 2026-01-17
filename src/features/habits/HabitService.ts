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
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

    // Toggle habit archive status (soft delete)
    archiveHabit: async (habitId: string) => {
        try {
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            await updateDoc(habitRef, { isArchived: true });
        } catch (error) {
            console.error('Error archiving habit:', error);
            throw error;
        }
    },

    blobToBase64: (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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

    failHabit: async (userId: string, habitId: string) => {
        try {
            // Log failure
            await addDoc(collection(db, 'logs'), {
                userId,
                habitId,
                date: new Date().toISOString().split('T')[0],
                completedAt: Timestamp.now(),
                status: 'failed',
                xpChange: -XP_CONSTANTS.HABIT_FAILURE_PENALTY
            });

            // Reset Streak (Strict Mode) or just keep it? Let's reset streak for now.
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            await updateDoc(habitRef, {
                streak: 0,
                lastFailed: Timestamp.now()
            });

            // Deduct XP
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                xp: increment(-XP_CONSTANTS.HABIT_FAILURE_PENALTY)
            });

            // We don't usually de-level people, so no level check needed for penalty.
        } catch (error) {
            console.error("Error failing habit:", error);
            throw error;
        }
    },

    completeHabitWithProof: async (userId: string, habitId: string, imageBlob: Blob) => {
        try {
            // Start by checking if already completed today
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            const habitDoc = await getDoc(habitRef);

            if (!habitDoc.exists()) throw new Error("Habit not found");

            const data = habitDoc.data();
            const today = new Date().toDateString();

            if (data.lastCompleted && data.lastCompleted.toDate().toDateString() === today) {
                console.warn("Habit already completed today");
                return;
            }

            // Compress Image (No-Storage Strategy)
            // Target: < 100-200KB to fit comfortably in Firestore 1MB limit
            const compressedBlob = await import('@/utils/compression').then(m => m.compressImage(imageBlob));

            // Safety Check: If it's still huge (rare, but possible with massive source files), warn.
            if (compressedBlob.size > 800 * 1024) {
                throw new Error("Image is too large even after compression. Please try a different photo.");
            }

            // Convert to Base64
            const base64Image = await HabitService.blobToBase64(compressedBlob);

            // Create Log
            await addDoc(collection(db, 'logs'), {
                userId,
                habitId,
                date: new Date().toISOString().split('T')[0],
                completedAt: Timestamp.now(),
                status: 'completed',
                proofBase64: base64Image,
                type: 'habit-fixer',
                xpEarned: XP_CONSTANTS.HABIT_FIXER_COMPLETION
            });

            // Update Habit Streak & Stats
            const currentStreak = data.streak || 0;
            const currentTotal = data.totalCompletions || 0;
            await updateDoc(habitRef, {
                streak: currentStreak + 1,
                totalCompletions: currentTotal + 1,
                lastCompleted: Timestamp.now()
            });

            // Award XP to User
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                xp: increment(XP_CONSTANTS.HABIT_FIXER_COMPLETION)
            });

            // Check for level up
            await HabitService.checkAndApplyLevelUp(userId);

        } catch (error) {
            console.error('Error completing habit:', error);
            throw error;
        }
    },

    completeHabit: async (userId: string, habitId: string) => {
        try {
            const habitRef = doc(db, HABITS_COLLECTION, habitId);
            const habitDoc = await getDoc(habitRef);

            if (!habitDoc.exists()) throw new Error("Habit not found");

            const data = habitDoc.data();
            const today = new Date().toDateString();

            if (data.lastCompleted && data.lastCompleted.toDate().toDateString() === today) {
                console.warn("Habit already completed today");
                return;
            }

            // Log completion
            await addDoc(collection(db, 'logs'), {
                userId,
                habitId,
                date: new Date().toISOString().split('T')[0],
                completedAt: Timestamp.now(),
                status: 'completed',
                xpEarned: XP_CONSTANTS.STANDARD_HABIT_COMPLETION
            });

            // Update Habit
            const currentStreak = data.streak || 0;
            const currentTotal = data.totalCompletions || 0;
            await updateDoc(habitRef, {
                streak: currentStreak + 1,
                totalCompletions: currentTotal + 1,
                lastCompleted: Timestamp.now()
            });

            // Award XP
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                xp: increment(XP_CONSTANTS.STANDARD_HABIT_COMPLETION)
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
                .sort((a: any, b: any) => b.completedAt.getTime() - a.completedAt.getTime());
        } catch (error) {
            console.error('Error fetching habit logs:', error);
            throw error;
        }
    }
};
