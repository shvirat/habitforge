import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trophy, Calendar, CheckCircle2, Flame, Edit2, Save } from 'lucide-react';
import { HabitService } from '@/features/habits/HabitService';
import { useAuth } from '@/context/AuthContext';
import type { Habit } from '@/types';
import { format } from 'date-fns';

interface HabitDetailsModalProps {
    habit: Habit | null;
    isOpen: boolean;
    onClose: () => void;
    onHabitUpdated?: () => void;
}

export const HabitDetailsModal: React.FC<HabitDetailsModalProps> = ({ habit, isOpen, onClose, onHabitUpdated }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ title: '', purpose: '' });

    const handleSave = async () => {
        if (!habit || !user) return;
        try {
            await HabitService.updateHabit(habit.id, {
                title: editForm.title,
                purpose: editForm.purpose
            });
            setIsEditing(false);
            if (onHabitUpdated) onHabitUpdated();
        } catch (error) {
            console.error('Failed to update', error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && habit && user) {
            setLoading(true);
            HabitService.getHabitLogs(user.uid, habit.id)
                .then(data => setLogs(data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen, habit, user]);

    if (!isOpen || !habit) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-2xl bg-surface dark:bg-surface border border-border/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="py-10 px-6 md:p-10 bg-surfaceLight/30 border-b border-border/10 dark:border-white/5 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-2 right-2 p-1 md:p-2 text-text-muted hover:text-text-primary rounded-full bg-black/5 dark:bg-white/5 md:bg-transparent dark:md:bg-transparent hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Title</label>
                                <input
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="w-full bg-black/5 dark:bg-black/30 border border-border/20 rounded-lg p-2 text-lg md:text-xl font-bold text-text-primary focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1 block">Purpose</label>
                                <input
                                    value={editForm.purpose}
                                    onChange={e => setEditForm({ ...editForm, purpose: e.target.value })}
                                    className="w-full bg-black/5 dark:bg-black/30 border border-border/20 rounded-lg p-2 text-text-secondary focus:outline-none focus:border-primary/50"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-xl text-sm font-bold text-text-muted hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 flex items-center gap-2 transition-colors"
                                >
                                    <Save size={16} /> Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary mb-3 border border-primary/20">
                                    {habit.category}
                                </span>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl md:text-3xl font-black text-text-primary tracking-tight">{habit.title}</h2>
                                    <button
                                        onClick={() => {
                                            setEditForm({ title: habit.title, purpose: habit.purpose });
                                            setIsEditing(true);
                                        }}
                                        className="p-1.5 text-text-muted hover:text-primary rounded-full hover:bg-primary/10 transition-colors"
                                        title="Edit Protocol"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                </div>
                                <p className="text-text-secondary italic">"{habit.purpose}"</p>
                            </div>
                            <div className="text-center bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 min-w-[100px]">
                                <Flame size={24} className="text-orange-500 mx-auto mb-1 animate-pulse" />
                                <span className="block text-xl md:text-2xl font-black text-orange-500 leading-none">{habit.streak}</span>
                                <span className="text-[10px] text-orange-400/80 uppercase font-bold tracking-wider">Streak</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-surfaceLight/50 border border-border/10 dark:border-white/5 hover:bg-surfaceLight/80 transition-colors">
                            <CheckCircle2 size={20} className="text-emerald-500 mb-2" />
                            <span className="block text-xl md:text-2xl font-bold text-text-primary">{habit.totalCompletions}</span>
                            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Total Runs</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-surfaceLight/50 border border-border/10 dark:border-white/5 hover:bg-surfaceLight/80 transition-colors">
                            <Trophy size={20} className="text-yellow-500 mb-2" />
                            <span className="block text-xl md:text-2xl font-bold text-text-primary">
                                {habit.isHabitFixer ? '50' : '10'}
                            </span>
                            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">XP / Run</span>
                        </div>
                        <div className="p-4 rounded-2xl bg-surfaceLight/50 border border-border/10 dark:border-white/5 hover:bg-surfaceLight/80 transition-colors">
                            <Calendar size={20} className="text-blue-500 mb-2" />
                            <span className="block text-xl md:text-2xl font-bold text-text-primary capitalize">{habit.frequency}</span>
                            <span className="text-xs text-text-muted uppercase tracking-wider font-medium">Frequency</span>
                        </div>
                    </div>

                    {/* History List */}
                    <div>
                        <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                            <Calendar size={18} className="text-accent" />
                            Recent Activity
                        </h3>
                        {loading ? (
                            <div className="text-center py-8 text-text-muted animate-pulse">Loading mission logs...</div>
                        ) : logs.length === 0 ? (
                            <div className="text-center py-8 border border-border/10 dark:border-white/5 border-dashed rounded-xl bg-surfaceLight/30">
                                <p className="text-text-muted text-sm">No activity recorded yet. Initiate protocol.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {logs.slice(0, 10).map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-surfaceLight/30 border border-border/10 dark:border-white/5 hover:bg-surfaceLight/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center border border-success/20">
                                                <CheckCircle2 size={14} className="text-success" />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-medium text-text-primary">Protocol Completed</span>
                                                <span className="text-xs text-text-muted">{format(log.completedAt, 'PPP p')}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded border border-success/20">
                                            +{log.xpEarned} XP
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
