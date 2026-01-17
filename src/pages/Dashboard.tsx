import { useEffect, useState } from 'react';
import { Plus, Check, X, Camera, Trophy, Flame, Zap, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { HabitService } from '@/features/habits/HabitService';
import type { Habit } from '@/types';
import { Button } from '@/components/Button';
import { CreateHabitModal } from '@/components/CreateHabitModal';
import { HabitDetailsModal } from '@/components/HabitDetailsModal';
import { SkeletonCard } from '@/components/SkeletonCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { clsx } from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { isSameDay, isSameWeek } from 'date-fns';

import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const Dashboard = () => {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [loading, setLoading] = useState(true);
    const [xp, setXp] = useState(0);
    const navigate = useNavigate();
    const actionBase = "h-10 px-4 text-sm flex items-center justify-center gap-2 rounded-xl";
    const [confirmAction, setConfirmAction] = useState<{ type: string, habitId: string, title: string, message: string } | null>(null);

    const loadHabits = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await HabitService.getUserHabits(user.uid);
            setHabits(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadHabits();

        // Check for missed habits from yesterday
        if (user) {
            HabitService.processMissedHabits(user.uid).then(missed => {
                if (missed.length > 0) {
                    const habitNames = missed.map(h => h.title).join(', ');
                    toast.error(`Streak Reset! You missed ${missed.length} protocol${missed.length > 1 ? 's' : ''} yesterday: ${habitNames}. XP Penalty applied.`);
                    // Reload habits to show reset streaks
                    loadHabits();
                }
            });
        }

        // Listen for XP changes
        if (user) {
            const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                if (doc.exists()) {
                    setXp(doc.data().xp || 0);
                }
            });
            return () => unsub();
        }
    }, [user]);

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row gap-6 md:items-end justify-between relative z-10">
                <div>
                    <h1 className="text-2xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-primary/60 tracking-tight mb-2">Dashboard</h1>
                    <p className="text-text-secondary font-medium flex items-center gap-2">
                        <Zap size={16} className="text-accent" />
                        Forging your discipline, one day at a time.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/levels" className="bg-surface/60 backdrop-blur-md border border-white/10 px-6 py-2 rounded-xl flex items-center gap-4 shadow-lg active:scale-95 transition-transform hover:border-yellow-500/30 group cursor-default">
                        <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                            <Trophy size={20} className="text-yellow-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-xl leading-none text-text-primary tracking-tight">{xp}</span>
                            <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Experience</span>
                        </div>
                    </Link>
                    <Button onClick={() => setIsModalOpen(true)} className="hidden md:flex shadow-lg shadow-primary/20 px-4 py-[25px] rounded-x text-[18px]">
                        <Plus size={20} className="mr-2" />
                        New Habit
                    </Button>
                </div>
            </header>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
                    {[...Array(6)].map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : habits.length === 0 ? (
                <div className="text-center py-24 bg-surface/30 backdrop-blur-sm rounded-3xl border border-white/5 border-dashed relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <p className="text-xl text-text-secondary mb-6 font-light relative z-10">Your forge is cold. Reignite it.</p>
                    <Button onClick={() => setIsModalOpen(true)} size="lg" className="relative z-10">
                        <Plus size={20} className="mr-2" />
                        Initiate Protocol
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-8">
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className="glass-card rounded-2xl p-6 group relative overflow-hidden flex flex-col cursor-pointer transition-transform hover:scale-[1.01]"
                            onClick={(e) => {
                                // Prevent opening if clicking on buttons
                                if ((e.target as HTMLElement).closest('button')) return;
                                setSelectedHabit(habit);
                            }}
                        >
                            {/* Card Glow Effect */}
                            <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-all duration-500" />

                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="font-bold text-lg md:text-xl text-text-primary mb-1 tracking-tight group-hover:text-primary transition-colors">{habit.title}</h3>
                                    <span className={clsx(
                                        "text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border",
                                        (() => {
                                            const cat = habit.category.toLowerCase().trim();
                                            if (cat === 'health' || cat === 'fitness') return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                            if (cat === 'work' || cat === 'career') return "bg-blue-500/10 text-blue-400 border-blue-500/20";
                                            if (cat === 'learning' || cat === 'study') return "bg-violet-500/10 text-violet-400 border-violet-500/20";
                                            if (cat === 'mindfulness' || cat === 'spirituality') return "bg-teal-500/10 text-teal-400 border-teal-500/20";
                                            if (cat === 'social' || cat === 'relationship') return "bg-pink-500/10 text-pink-400 border-pink-500/20";
                                            if (cat === 'finance') return "bg-amber-500/10 text-amber-400 border-amber-500/20";
                                            // Default fallback based on hash to keep same random categories consistent
                                            const colors = [
                                                "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
                                                "bg-rose-500/10 text-rose-400 border-rose-500/20",
                                                "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                                                "bg-lime-500/10 text-lime-400 border-lime-500/20",
                                            ];
                                            return colors[cat.length % colors.length];
                                        })()
                                    )}>
                                        {habit.category}
                                    </span>
                                    {habit.frequency === 'weekly' && (
                                        <span className="ml-2 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                            Weekly
                                        </span>
                                    )}
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 text-orange-500">
                                        <Flame size={20} className={clsx("fill-orange-500", habit.streak > 0 && "animate-pulse")} />
                                        <span className="text-xl md:text-2xl font-black font-mono leading-none">{habit.streak}</span>
                                    </div>
                                    <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1">Day Streak</p>
                                </div>
                            </div>

                            <p className="text-text-secondary text-sm line-clamp-2 mb-8 min-h-[2.5rem] relative z-10 leading-relaxed">
                                {habit.purpose}
                            </p>

                            <div className="flex items-center gap-3 mt-auto relative z-10">
                                {(() => {
                                    const today = new Date();
                                    const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
                                    const isCompleted = lastCompleted && (
                                        habit.frequency === 'weekly'
                                            ? isSameWeek(lastCompleted, today, { weekStartsOn: 1 })
                                            : isSameDay(lastCompleted, today)
                                    );

                                    if (isCompleted) {
                                        return (
                                            <div
                                                className={`w-full ${actionBase} bg-success/10 text-success font-bold border border-success/20 shadow-[0_0_15px_rgba(0,230,118,0.1)]`}>
                                                <Check size={16} strokeWidth={3} />
                                                {habit.frequency === 'weekly' ? 'Week Complete' : 'Completed'}
                                            </div>
                                        );
                                    }

                                    if (habit.frequency === 'weekly') {
                                        const isSunday = today.getDay() === 0;
                                        if (!isSunday) {
                                            return (
                                                <div className={`w-full ${actionBase} bg-white/5 text-text-muted font-bold border border-white/5 cursor-not-allowed`}>
                                                    <Calendar size={16} />
                                                    Available Sunday
                                                </div>
                                            );
                                        }
                                    }

                                    const isFailed = habit.lastFailed &&
                                        new Date(habit.lastFailed).toDateString() === today.toDateString();

                                    if (isFailed) {
                                        return (
                                            <div className={`w-full ${actionBase} bg-error/10 text-error font-bold border border-error/20`}>
                                                <X size={16} strokeWidth={3} />
                                                Failed
                                            </div>
                                        );
                                    }

                                    if (habit.isHabitFixer) {
                                        return (
                                            <Button
                                                variant="accent"
                                                className={`w-full ${actionBase}`}
                                                onClick={() => navigate(`/fixer/${habit.id}`)}
                                            >
                                                <Camera size={16} />
                                                Verify Proof
                                            </Button>
                                        );
                                    }

                                    return (
                                        <>
                                            <button
                                                className={`h-10 w-10 flex items-center justify-center rounded-lg
                                                            text-text-muted border border-white/5
                                                            hover:text-error hover:bg-error/10 hover:border-error/20
                                                            transition-all active:scale-95`}
                                                onClick={() => setConfirmAction({
                                                    type: 'fail',
                                                    habitId: habit.id,
                                                    title: 'Fail Protocol?',
                                                    message: 'Marking this as failed will reset your streak and deduct XP. Are you sure?'
                                                })}
                                                title="Fail Day"
                                            >
                                                <X size={18} />
                                            </button>
                                            <Button
                                                className={`flex-1 ${actionBase}`}
                                                onClick={async () => {
                                                    if (!user) return;
                                                    await HabitService.completeHabit(user.uid, habit.id);
                                                    loadHabits();
                                                }}
                                            >
                                                <Check size={16} strokeWidth={3} />
                                                Complete
                                            </Button>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="fixed bottom-28 right-6 z-50 md:hidden animate-scale-up">
                <Button onClick={() => setIsModalOpen(true)} size="lg" className="rounded-full h-14 w-14 p-0 shadow-[0_0_30px_rgba(0,230,118,0.4)] border border-primary/20">
                    <Plus size={24} strokeWidth={3} />
                </Button>
            </div>

            <CreateHabitModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onHabitCreated={loadHabits}
            />

            <HabitDetailsModal
                habit={selectedHabit}
                isOpen={!!selectedHabit}
                onClose={() => setSelectedHabit(null)}
                onHabitUpdated={loadHabits}
            />

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={async () => {
                    if (!user || !confirmAction) return;
                    if (confirmAction.type === 'fail') {
                        try {
                            await HabitService.failHabit(user.uid, confirmAction.habitId);
                            loadHabits();
                        } catch (e) {
                            console.error(e);
                        } finally {
                            setConfirmAction(null);
                        }
                    } else {
                        setConfirmAction(null);
                    }
                }}
                title={confirmAction?.title || ''}
                message={confirmAction?.message || ''}
                isDestructive={true}
                confirmText="Yes, Fail It"
            />
        </div>
    );
};
