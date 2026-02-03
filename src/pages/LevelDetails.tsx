import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, Star, Shield, Zap, TrendingUp, History, ChevronDown, ChevronUp } from 'lucide-react';
import { XP_CONSTANTS, calculateLevelProgress, getRankTitle } from '@/utils/gamification';
import { HabitService } from '@/features/habits/HabitService';
import { format } from 'date-fns';
import { clsx } from 'clsx';

export const LevelDetails = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ level: 1, xp: 0 });
    const [logs, setLogs] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const [habitMap, setHabitMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!user) return;
        // Fetch habits to build a lookup map for older logs that don't satisfy the habitTitle field
        HabitService.getUserHabits(user.uid).then(habits => {
            const map: Record<string, string> = {};
            habits.forEach(h => map[h.id] = h.title);
            setHabitMap(map);
        });
    }, [user]);

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

    useEffect(() => {
        if (showHistory && user && logs.length === 0) {
            setLoadingLogs(true);
            HabitService.getUserGlobalLogs(user.uid)
                .then(setLogs)
                .catch(console.error)
                .finally(() => setLoadingLogs(false));
        }
    }, [showHistory, user]);

    const {
        nextLevelXp,
        progressPercent
    } = calculateLevelProgress(stats.level, stats.xp);

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            {/* ... (Header and Progress Card remain same) ... */}
            <header className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-linear-to-br from-yellow-400 to-orange-500 shadow-xl shadow-orange-500/20 mb-4 animate-bounce-slow">
                    <Trophy className="text-white w-12 h-12" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-600">
                    Level {stats.level}
                </h1>
                <p className="text-text-secondary text-base md:text-lg">{getRankTitle(stats.level)}</p>
            </header>

            {/* Progress Card */}
            <div className="bg-surface border border-secondary rounded-2xl p-5 md:p-8 shadow-2xl relative overflow-hidden">
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
                        className="h-full bg-linear-to-r from-primary to-accent transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--primary),0.5)]"
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

            {/* History Dropdown */}
            <div className="bg-surface border border-secondary rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <History size={24} className="text-primary" />
                        <h3 className="font-bold text-lg">XP History</h3>
                    </div>
                    {showHistory ? <ChevronUp /> : <ChevronDown />}
                </button>

                {showHistory && (
                    <div className="border-t border-secondary max-h-100 overflow-y-auto p-4 space-y-2">
                        {loadingLogs ? (
                            <div className="text-center py-8 text-text-muted">Loading history...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8 text-text-muted">No history recorded yet.</div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-surface/50 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx(
                                            "w-2 h-2 rounded-full",
                                            log.status === 'completed' ? "bg-success" : "bg-error"
                                        )} />
                                        <div>
                                            <p className="font-medium text-sm">
                                                {log.habitTitle || habitMap[log.habitId] || (log.habitId ? 'Protocol Completion' : 'Activity')}
                                            </p>
                                            <p className="text-xs text-text-muted">{format(log.completedAt, 'MMM d, yyyy • h:mm a')}</p>
                                        </div>
                                    </div>
                                    <span className={clsx(
                                        "font-mono font-bold text-sm",
                                        log.status === 'completed' ? "text-success" : "text-error"
                                    )}>
                                        {log.status === 'completed' ? '+' : ''}{log.xpEarned || log.xpChange || 0} XP
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
