import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star, Shield, Zap, TrendingUp } from 'lucide-react';
import { XP_CONSTANTS, calculateLevelProgress } from '@/utils/gamification';

export const LevelDetails = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ level: 1, xp: 0 });

    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setStats({ level: data.level || 1, xp: data.xp || 0 });
            }
        });
        return () => unsub();
    }, [user]);

    const {
        nextLevelXp,
        progressPercent
    } = calculateLevelProgress(stats.level, stats.xp);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <header className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl shadow-orange-500/20 mb-4 animate-bounce-slow">
                    <Trophy className="text-white w-12 h-12" />
                </div>
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-600">
                    Level {stats.level}
                </h1>
                <p className="text-text-secondary text-lg">Master of Consistency</p>
            </header>

            {/* Progress Card */}
            <div className="bg-surface border border-secondary rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                        <span className="text-sm text-text-muted uppercase tracking-wider font-bold">Current XP</span>
                        <div className="text-3xl font-mono font-bold text-text-primary">{stats.xp} <span className="text-sm text-text-muted">/ {nextLevelXp}</span></div>
                    </div>
                    <div className="text-right">
                        <span className="text-sm text-accent uppercase tracking-wider font-bold">{Math.round(progressPercent)}% to Lvl {stats.level + 1}</span>
                    </div>
                </div>

                <div className="h-4 bg-secondary/30 rounded-full overflow-hidden relative z-10">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <p className="mt-4 text-center text-text-secondary text-sm">
                    {nextLevelXp - stats.xp} XP needed for next level
                </p>
            </div>

            {/* XP Sources Grid */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface border border-secondary rounded-xl p-6 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-primary/10 rounded-lg text-primary">
                            <Star size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Standard Protocol</h3>
                            <p className="text-text-muted text-sm">Every completion counts.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-primary">+{XP_CONSTANTS.STANDARD_HABIT_COMPLETION} XP</span>
                    </div>
                </div>

                <div className="bg-surface border border-secondary rounded-xl p-6 hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-accent/10 rounded-lg text-accent">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Habit Fixer Mode</h3>
                            <p className="text-text-muted text-sm">Hard mode with proof.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-accent">+{XP_CONSTANTS.HABIT_FIXER_COMPLETION} XP</span>
                    </div>
                </div>
            </div>

            {/* Perks / Unlocks (Placeholder) */}
            <div className="bg-background/50 border border-secondary rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Zap className="text-yellow-400" />
                    <h3 className="font-bold text-lg">Level Benefits</h3>
                </div>
                <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-text-secondary">
                        <TrendingUp size={16} />
                        <span>Higher levels unlock detailed analytics (Level 5)</span>
                    </li>
                    <li className="flex items-center gap-3 text-text-secondary">
                        <Trophy size={16} />
                        <span>Custom profile badges (Level 10)</span>
                    </li>
                </ul>
            </div>
        </div>
    );
};
